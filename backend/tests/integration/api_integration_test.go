package integration_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"novapilot-ai/backend/internal/domain"
	"novapilot-ai/backend/internal/handler"
	"novapilot-ai/backend/internal/repository/postgres"
	"novapilot-ai/backend/internal/service"
)

func TestFullLifecycle_InboundToMutationAndAudit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := postgres.NewRepository(nil)
	sseHub := handler.NewSSEHub()
	ticketSvc := service.NewTicketService(repo, repo, repo, repo, sseHub)
	uploadDir := os.TempDir() + "/novapilot_integration_uploads"
	apiHandler := handler.NewAPIHandler(ticketSvc, repo, repo, repo, repo, sseHub, uploadDir, nil)

	router := gin.New()
	api := router.Group("/api")
	{
		api.GET("/health", apiHandler.HealthCheck)
		api.GET("/telemetry", apiHandler.GetTelemetry)
		api.GET("/tickets", apiHandler.ListTickets)
		api.GET("/tickets/:id", apiHandler.GetTicket)
		api.POST("/tickets/:id/approve", apiHandler.ApproveTicket)
		api.GET("/inbound-messages", apiHandler.ListInboundMessages)
		api.POST("/inbound-messages", apiHandler.CreateInboundMessage)
		api.POST("/inbound-messages/:id/stage-ticket", apiHandler.StageTicketFromMessage)
		api.GET("/invoices", apiHandler.ListInvoices)
		api.GET("/audit-logs", apiHandler.ListAuditLogs)
	}

	// Step 1: Check System Health
	healthReq, _ := http.NewRequest(http.MethodGet, "/api/health", nil)
	healthResp := httptest.NewRecorder()
	router.ServeHTTP(healthResp, healthReq)
	if healthResp.Code != http.StatusOK {
		t.Fatalf("expected health status 200, got %d", healthResp.Code)
	}

	// Step 2: Inbound Message Intake via WhatsApp webhook
	inboundPayload := map[string]interface{}{
		"platform":    "whatsapp",
		"sender_id":   "628991234567@s.whatsapp.net",
		"sender_name": "Pak Harto (Kepala Gudang)",
		"raw_message": "Mohon bantuan tim IT, invoice INV/2026/001 tolong diganti namanya menjadi PT Makmur Sukses Bersama. Terima kasih.",
		"media_type":  "text",
	}
	bodyBytes, _ := json.Marshal(inboundPayload)
	msgReq, _ := http.NewRequest(http.MethodPost, "/api/inbound-messages", bytes.NewBuffer(bodyBytes))
	msgReq.Header.Set("Content-Type", "application/json")
	msgResp := httptest.NewRecorder()
	router.ServeHTTP(msgResp, msgReq)

	if msgResp.Code != http.StatusCreated {
		t.Fatalf("expected message creation 201, got %d: %s", msgResp.Code, msgResp.Body.String())
	}

	var savedMsg domain.InboundMessage
	if err := json.Unmarshal(msgResp.Body.Bytes(), &savedMsg); err != nil {
		t.Fatalf("failed to decode inbound message: %v", err)
	}
	if savedMsg.Classification != domain.ClassActionable {
		t.Errorf("expected classification ACTIONABLE, got %s", savedMsg.Classification)
	}
	if savedMsg.ExtractedDoc != "INV/2026/001" {
		t.Errorf("expected doc INV/2026/001, got %s", savedMsg.ExtractedDoc)
	}

	// Step 3: Stage into Approval Ticket
	stagePayload := map[string]interface{}{
		"document_no":    savedMsg.ExtractedDoc,
		"proposed_value": "PT Makmur Sukses Bersama",
	}
	stageBytes, _ := json.Marshal(stagePayload)
	stageReq, _ := http.NewRequest(http.MethodPost, fmt.Sprintf("/api/inbound-messages/%d/stage-ticket", savedMsg.ID), bytes.NewBuffer(stageBytes))
	stageReq.Header.Set("Content-Type", "application/json")
	stageResp := httptest.NewRecorder()
	router.ServeHTTP(stageResp, stageReq)

	if stageResp.Code != http.StatusCreated {
		t.Fatalf("expected stage ticket 201, got %d: %s", stageResp.Code, stageResp.Body.String())
	}

	var stagedTicket domain.Ticket
	_ = json.Unmarshal(stageResp.Body.Bytes(), &stagedTicket)
	if stagedTicket.Status != domain.StatusPendingApproval {
		t.Fatalf("expected status PENDING_APPROVAL, got %s", stagedTicket.Status)
	}

	// Step 4: Admin Approves the Staged Ticket
	approvePayload := map[string]interface{}{
		"approver_name": "Supervisor Ahmad",
	}
	approveBytes, _ := json.Marshal(approvePayload)
	approveReq, _ := http.NewRequest(http.MethodPost, fmt.Sprintf("/api/tickets/%d/approve", stagedTicket.ID), bytes.NewBuffer(approveBytes))
	approveReq.Header.Set("Content-Type", "application/json")
	approveResp := httptest.NewRecorder()
	router.ServeHTTP(approveResp, approveReq)

	if approveResp.Code != http.StatusOK {
		t.Fatalf("expected approval 200, got %d: %s", approveResp.Code, approveResp.Body.String())
	}

	var executedTicket domain.Ticket
	_ = json.Unmarshal(approveResp.Body.Bytes(), &executedTicket)
	if executedTicket.Status != domain.StatusExecuted {
		t.Errorf("expected status EXECUTED, got %s", executedTicket.Status)
	}

	// Step 5: Verify Invoice Mutation in Database
	invReq, _ := http.NewRequest(http.MethodGet, "/api/invoices", nil)
	invResp := httptest.NewRecorder()
	router.ServeHTTP(invResp, invReq)

	var invoices []domain.Invoice
	_ = json.Unmarshal(invResp.Body.Bytes(), &invoices)
	var foundInvoice *domain.Invoice
	for _, inv := range invoices {
		if inv.InvoiceNo == "INV/2026/001" {
			foundInvoice = &inv
			break
		}
	}
	if foundInvoice == nil {
		t.Fatalf("invoice INV/2026/001 not found")
	}
	if foundInvoice.CustomerName != "PT Makmur Sukses Bersama" {
		t.Errorf("expected updated customer name 'PT Makmur Sukses Bersama', got '%s'", foundInvoice.CustomerName)
	}

	// Step 6: Verify Audit Trail Log is Recorded
	auditReq, _ := http.NewRequest(http.MethodGet, "/api/audit-logs", nil)
	auditResp := httptest.NewRecorder()
	router.ServeHTTP(auditResp, auditReq)

	var auditLogs []domain.AuditLog
	_ = json.Unmarshal(auditResp.Body.Bytes(), &auditLogs)
	foundAudit := false
	for _, log := range auditLogs {
		if log.TicketID == stagedTicket.ID && log.Action == "APPROVED_AND_MUTATED" {
			foundAudit = true
			if log.PerformedBy != "Supervisor Ahmad" {
				t.Errorf("expected PerformedBy Supervisor Ahmad, got %s", log.PerformedBy)
			}
			break
		}
	}
	if !foundAudit {
		t.Errorf("expected APPROVED_AND_MUTATED audit entry for ticket %d", stagedTicket.ID)
	}
}
