package llm_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"novapilot-ai/backend/internal/llm"
)

func TestParseHermesOutput_StandardThoughtAndToolCall(t *testing.T) {
	rawOutput := `<thought>
Step 1: The user wants to change customer name for invoice INV/2026/001.
Step 2: Extracted invoice number: INV/2026/001.
Step 3: Proposed customer name is PT Sumber Makmur Abadi.
Step 4: No amount change requested. Safe for staging.
</thought>
<tool_call>
{"name": "stage_invoice_update", "arguments": {"document_no": "INV/2026/001", "proposed_value": "PT Sumber Makmur Abadi", "raw_message": "Ubah INV/2026/001"}}
</tool_call>`

	thought, toolCall := llm.ParseHermesOutput(rawOutput)

	if thought == "" {
		t.Errorf("expected thought to be extracted, got empty")
	}
	if toolCall == nil {
		t.Fatalf("expected toolCall to be extracted, got nil")
	}
	if toolCall.Name != "stage_invoice_update" {
		t.Errorf("expected tool name stage_invoice_update, got %s", toolCall.Name)
	}
	if toolCall.Arguments["document_no"] != "INV/2026/001" {
		t.Errorf("expected document_no INV/2026/001, got %v", toolCall.Arguments["document_no"])
	}
	if toolCall.Arguments["proposed_value"] != "PT Sumber Makmur Abadi" {
		t.Errorf("expected proposed_value PT Sumber Makmur Abadi, got %v", toolCall.Arguments["proposed_value"])
	}
}

func TestParseHermesOutput_WithMarkdownCodeBlock(t *testing.T) {
	rawOutput := "<thought>\nNeed to verify invoice status first.\n</thought>\n<tool_call>\n```json\n{\n  \"name\": \"check_invoice\",\n  \"arguments\": {\n    \"invoice_no\": \"INV/2026/099\"\n  }\n}\n```\n</tool_call>"

	thought, toolCall := llm.ParseHermesOutput(rawOutput)

	if thought == "" {
		t.Errorf("expected thought to be extracted, got empty")
	}
	if toolCall == nil {
		t.Fatalf("expected toolCall to be extracted, got nil")
	}
	if toolCall.Name != "check_invoice" {
		t.Errorf("expected tool name check_invoice, got %s", toolCall.Name)
	}
	if toolCall.Arguments["invoice_no"] != "INV/2026/099" {
		t.Errorf("expected invoice_no INV/2026/099, got %v", toolCall.Arguments["invoice_no"])
	}
}

func TestProcessMessage_WithMockServer(t *testing.T) {
	mockResponse := llm.ChatCompletionResponse{
		ID: "chatcmpl-mock-hermes-123",
		Choices: []struct {
			Message struct {
				Role    string `json:"role"`
				Content string `json:"content"`
			} `json:"message"`
			FinishReason string `json:"finish_reason"`
		}{
			{
				Message: struct {
					Role    string `json:"role"`
					Content string `json:"content"`
				}{
					Role: "assistant",
					Content: `<thought>User requests invoice correction for CV Maju Jaya.</thought>
<tool_call>
{"name": "stage_invoice_update", "arguments": {"document_no": "INV/2026/002", "proposed_value": "CV Maju Jaya Abadi"}}
</tool_call>`,
				},
				FinishReason: "stop",
			},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/chat/completions" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(mockResponse)
	}))
	defer server.Close()

	cfg := llm.Config{
		BaseURL:     server.URL,
		Model:       "hermes3:8b",
		Timeout:     5 * time.Second,
		Temperature: 0.1,
		MaxTokens:   512,
	}

	adapter := llm.NewHermesAdapter(cfg)
	res, err := adapter.ProcessMessage(context.Background(), "Tolong ganti nota INV/2026/002 jadi CV Maju Jaya Abadi", "Cabang Surabaya")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.IsFallback {
		t.Errorf("expected live LLM execution, got fallback")
	}
	if res.ToolCall == nil {
		t.Fatalf("expected tool call to be returned")
	}
	if res.ToolCall.Name != "stage_invoice_update" {
		t.Errorf("expected stage_invoice_update, got %s", res.ToolCall.Name)
	}
	if res.ToolCall.Arguments["document_no"] != "INV/2026/002" {
		t.Errorf("expected INV/2026/002, got %v", res.ToolCall.Arguments["document_no"])
	}
}

func TestProcessMessage_OfflineFallback(t *testing.T) {
	// Point to unreachable port to simulate offline Ollama/vLLM engine
	cfg := llm.Config{
		BaseURL: "http://127.0.0.1:59999/v1",
		Model:   "hermes3:8b",
		Timeout: 500 * time.Millisecond,
	}

	adapter := llm.NewHermesAdapter(cfg)
	chat := "Mohon tolong ubah faktur INV-2026-005 menjadi PT Berkah Sejahtera"
	res, err := adapter.ProcessMessage(context.Background(), chat, "Head Office")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !res.IsFallback {
		t.Errorf("expected fallback when engine is offline")
	}
	if res.ToolCall == nil {
		t.Fatalf("expected toolCall from heuristic fallback")
	}
	if res.ToolCall.Name != "stage_invoice_update" {
		t.Errorf("expected stage_invoice_update, got %s", res.ToolCall.Name)
	}
	if res.ToolCall.Arguments["document_no"] != "INV/2026/005" {
		t.Errorf("expected INV/2026/005 (normalized), got %v", res.ToolCall.Arguments["document_no"])
	}
	if res.ToolCall.Arguments["proposed_value"] != "PT Berkah Sejahtera" {
		t.Errorf("expected PT Berkah Sejahtera, got %v", res.ToolCall.Arguments["proposed_value"])
	}
}

func TestProcessViaCLI_Live(t *testing.T) {
	cfg := llm.DefaultConfig()
	cfg.Mode = "cli"
	adapter := llm.NewHermesAdapter(cfg)

	// Skip if hermes CLI is not installed
	if cfg.CLIPath == "" {
		t.Skip("hermes CLI not available on this machine")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()

	chat := "Tolong ubah nota faktur INV/2026/001 menjadi PT Sumber Makmur Abadi"
	res, err := adapter.ProcessMessage(ctx, chat, "Cabang Surabaya Hub")
	if err != nil {
		t.Fatalf("unexpected error running hermes CLI: %v", err)
	}

	if res.IsFallback {
		t.Logf("CLI failed, fell back to heuristic: %s", res.Thought)
	} else {
		t.Logf("CLI succeeded! Model: %s, Latency: %dms, Raw: %s", res.ModelUsed, res.LatencyMs, res.RawContent)
	}
}

func TestParseHermesReply_Extraction(t *testing.T) {
	raw := `<thought>Reasoning complete.</thought>
<tool_call>{"name": "stage_invoice_update", "arguments": {"document_no": "INV/2026/001"}}</tool_call>
<reply>
Permintaan mutasi faktur INV/2026/001 telah kami catat dalam antrean on-call.
</reply>`

	reply := llm.ParseHermesReply(raw)
	expected := "Permintaan mutasi faktur INV/2026/001 telah kami catat dalam antrean on-call."
	if reply != expected {
		t.Errorf("expected '%s', got '%s'", expected, reply)
	}
}

func TestGenerateAutoReply_ContextualScenarios(t *testing.T) {
	adapter := llm.NewHermesAdapter(llm.DefaultConfig())

	// Scenario 1: Actionable
	toolCall := &llm.ToolCallPayload{
		Name: "stage_invoice_update",
		Arguments: map[string]interface{}{
			"document_no":    "INV/2026/001",
			"proposed_value": "PT Sumber Makmur",
		},
	}
	reply := adapter.GenerateAutoReply("Ubah invoice INV/2026/001", toolCall, false, "professional", "[NovaPilot AI]", "id")
	if reply == "" || !containsSubstring(reply, "INV/2026/001") || !containsSubstring(reply, "PT Sumber Makmur") {
		t.Errorf("unexpected reply for actionable scenario: %s", reply)
	}

	// Scenario 2: Greeting
	greetingReply := adapter.GenerateAutoReply("halo selamat pagi min", nil, false, "friendly", "[NovaPilot AI]", "id")
	if greetingReply == "" || !containsSubstring(greetingReply, "Halo!") {
		t.Errorf("unexpected greeting reply: %s", greetingReply)
	}

	// Scenario 3: Needs Review
	unclearReply := adapter.GenerateAutoReply("tolong ubah nama pt jadi PT Berkah", nil, false, "professional", "[NovaPilot AI]", "id")
	if unclearReply == "" || !containsSubstring(unclearReply, "nomor invoice/faktur") {
		t.Errorf("unexpected needs review reply: %s", unclearReply)
	}
}

func containsSubstring(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && len(substr) > 0 && (stringContains(s, substr)))
}

func stringContains(s, substr string) bool {
	for i := 0; i+len(substr) <= len(s); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
