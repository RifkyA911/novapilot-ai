package handler_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"novapilot-ai/backend/internal/domain"
	"novapilot-ai/backend/internal/handler"
	"novapilot-ai/backend/internal/repository/postgres"
	"novapilot-ai/backend/internal/service"
)

func setupTestServer() (*gin.Engine, *postgres.Repository) {
	gin.SetMode(gin.TestMode)
	repo := postgres.NewRepository(nil)
	sseHub := handler.NewSSEHub()
	ticketSvc := service.NewTicketService(repo, repo, repo, repo, sseHub)
	uploadDir := os.TempDir() + "/novapilot_test_uploads"

	apiHandler := handler.NewAPIHandler(ticketSvc, repo, repo, repo, repo, sseHub, uploadDir, nil)

	r := gin.New()
	api := r.Group("/api")
	{
		api.GET("/health", apiHandler.HealthCheck)
		api.GET("/telemetry", apiHandler.GetTelemetry)
		api.GET("/tickets", apiHandler.ListTickets)
		api.GET("/tickets/:id", apiHandler.GetTicket)
		api.POST("/tickets", apiHandler.CreateTicket)
		api.POST("/tickets/:id/approve", apiHandler.ApproveTicket)
		api.POST("/tickets/:id/reject", apiHandler.RejectTicket)
		api.GET("/inbound-messages", apiHandler.ListInboundMessages)
		api.POST("/inbound-messages", apiHandler.CreateInboundMessage)
		api.POST("/inbound-messages/:id/stage-ticket", apiHandler.StageTicketFromMessage)
		api.GET("/database/config", apiHandler.GetDatabaseConfig)
		api.POST("/database/test", apiHandler.TestDatabaseConnection)
		api.GET("/mcp/tools", apiHandler.ListMCPTools)
		api.POST("/mcp/tools", apiHandler.UploadMCPTool)
		api.POST("/mcp/test", apiHandler.ExecuteMCPToolTest)
	}

	return r, repo
}

func TestHealthCheck(t *testing.T) {
	router, _ := setupTestServer()

	req, _ := http.NewRequest(http.MethodGet, "/api/health", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse JSON response: %v", err)
	}

	if body["status"] != "UP" {
		t.Errorf("expected status UP, got %v", body["status"])
	}
	if body["service"] != "NovaPilot AI Core" {
		t.Errorf("expected service NovaPilot AI Core, got %v", body["service"])
	}
}

func TestGetTelemetry(t *testing.T) {
	router, _ := setupTestServer()

	req, _ := http.NewRequest(http.MethodGet, "/api/telemetry", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse JSON response: %v", err)
	}

	if body["lan_ip"] == nil {
		t.Errorf("expected lan_ip in telemetry")
	}
	if body["database"] == nil {
		t.Errorf("expected database info in telemetry")
	}
}

func TestCreateInboundMessage_AutoClassificationAndExtraction(t *testing.T) {
	router, _ := setupTestServer()

	// 1. Actionable Message with Invoice and Target
	payload := map[string]interface{}{
		"platform":    "whatsapp",
		"sender_id":   "6281234567890@s.whatsapp.net",
		"sender_name": "Surabaya Store",
		"raw_message": "Mohon update nota INV/2026/001 customer menjadi PT Sejahtera Sukses",
		"media_type":  "text",
	}
	payloadBytes, _ := json.Marshal(payload)

	req, _ := http.NewRequest(http.MethodPost, "/api/inbound-messages", bytes.NewBuffer(payloadBytes))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got %d, body: %s", resp.Code, resp.Body.String())
	}

	var msg domain.InboundMessage
	if err := json.Unmarshal(resp.Body.Bytes(), &msg); err != nil {
		t.Fatalf("failed to parse created message: %v", err)
	}

	if msg.Classification != domain.ClassActionable {
		t.Errorf("expected classification ACTIONABLE, got %s", msg.Classification)
	}
	if msg.ExtractedDoc != "INV/2026/001" {
		t.Errorf("expected extracted doc INV/2026/001, got %s", msg.ExtractedDoc)
	}
	if msg.ExtractedTarget != "PT Sejahtera Sukses" {
		t.Errorf("expected extracted target 'PT Sejahtera Sukses', got '%s'", msg.ExtractedTarget)
	}
}

func TestStageAndApproveTicketWorkflow(t *testing.T) {
	router, _ := setupTestServer()

	// 1. Create Inbound Message
	msgPayload := map[string]interface{}{
		"platform":    "whatsapp",
		"sender_id":   "6281234567890@s.whatsapp.net",
		"sender_name": "Finance Admin",
		"raw_message": "Tolong ubah nama INV/2026/001 menjadi PT Berkah Sentosa",
		"media_type":  "text",
	}
	msgBytes, _ := json.Marshal(msgPayload)
	req1, _ := http.NewRequest(http.MethodPost, "/api/inbound-messages", bytes.NewBuffer(msgBytes))
	req1.Header.Set("Content-Type", "application/json")
	resp1 := httptest.NewRecorder()
	router.ServeHTTP(resp1, req1)

	var createdMsg domain.InboundMessage
	_ = json.Unmarshal(resp1.Body.Bytes(), &createdMsg)

	// 2. Stage Ticket from Message
	stagePayload := map[string]interface{}{
		"document_no":    createdMsg.ExtractedDoc,
		"proposed_value": createdMsg.ExtractedTarget,
	}
	stageBytes, _ := json.Marshal(stagePayload)
	req2, _ := http.NewRequest(http.MethodPost, fmt.Sprintf("/api/inbound-messages/%d/stage-ticket", createdMsg.ID), bytes.NewBuffer(stageBytes))
	req2.Header.Set("Content-Type", "application/json")
	resp2 := httptest.NewRecorder()
	router.ServeHTTP(resp2, req2)

	if resp2.Code != http.StatusCreated {
		t.Fatalf("expected stage ticket 201, got %d, body: %s", resp2.Code, resp2.Body.String())
	}

	var stagedTicket domain.Ticket
	_ = json.Unmarshal(resp2.Body.Bytes(), &stagedTicket)

	if stagedTicket.Status != domain.StatusPendingApproval {
		t.Errorf("expected status PENDING_APPROVAL, got %s", stagedTicket.Status)
	}

	// 3. Approve Ticket
	approvePayload := map[string]interface{}{
		"approver_name": "Lead Supervisor Budi",
	}
	approveBytes, _ := json.Marshal(approvePayload)
	req3, _ := http.NewRequest(http.MethodPost, fmt.Sprintf("/api/tickets/%d/approve", stagedTicket.ID), bytes.NewBuffer(approveBytes))
	req3.Header.Set("Content-Type", "application/json")
	resp3 := httptest.NewRecorder()
	router.ServeHTTP(resp3, req3)

	if resp3.Code != http.StatusOK {
		t.Fatalf("expected approve status 200, got %d, body: %s", resp3.Code, resp3.Body.String())
	}

	var approvedTicket domain.Ticket
	_ = json.Unmarshal(resp3.Body.Bytes(), &approvedTicket)

	if approvedTicket.Status != domain.StatusExecuted {
		t.Errorf("expected ticket status EXECUTED, got %s", approvedTicket.Status)
	}
}

func TestGetDatabaseConfig(t *testing.T) {
	router, _ := setupTestServer()

	req, _ := http.NewRequest(http.MethodGet, "/api/database/config", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var cfg map[string]interface{}
	if err := json.Unmarshal(resp.Body.Bytes(), &cfg); err != nil {
		t.Fatalf("failed to parse JSON: %v", err)
	}

	if cfg["system_db"] == nil {
		t.Errorf("expected system_db in config response")
	}
	if cfg["mcp_ref_db"] == nil {
		t.Errorf("expected mcp_ref_db in config response")
	}
}

func TestMCPToolsAndUpload(t *testing.T) {
	router, _ := setupTestServer()

	// 1. List tools
	req, _ := http.NewRequest(http.MethodGet, "/api/mcp/tools", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var listData struct {
		Tools []map[string]interface{} `json:"tools"`
		Count int                      `json:"count"`
	}
	if err := json.Unmarshal(resp.Body.Bytes(), &listData); err != nil {
		t.Fatalf("failed to parse JSON: %v", err)
	}

	if listData.Count < 3 {
		t.Errorf("expected at least 3 default MCP tools, got %d", listData.Count)
	}

	// 2. Upload custom tool
	uploadBody := `{"name":"sync_sap_inventory","description":"Sync sap stock","version":"1.0.0"}`
	reqUp, _ := http.NewRequest(http.MethodPost, "/api/mcp/tools", strings.NewReader(uploadBody))
	reqUp.Header.Set("Content-Type", "application/json")
	respUp := httptest.NewRecorder()
	router.ServeHTTP(respUp, reqUp)

	if respUp.Code != http.StatusOK {
		t.Fatalf("expected upload status 200, got %d", respUp.Code)
	}

	// 3. Test execute tool
	execBody := `{"tool_name":"sync_sap_inventory","parameters":{"warehouse_id":"JKT-01"}}`
	reqExec, _ := http.NewRequest(http.MethodPost, "/api/mcp/test", strings.NewReader(execBody))
	reqExec.Header.Set("Content-Type", "application/json")
	respExec := httptest.NewRecorder()
	router.ServeHTTP(respExec, reqExec)

	if respExec.Code != http.StatusOK {
		t.Fatalf("expected exec status 200, got %d", respExec.Code)
	}
}
