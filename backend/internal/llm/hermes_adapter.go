package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"novapilot-ai/backend/internal/guardrail"
)

// Config defines connection parameters for an OpenAI-compatible Hermes 3 LLM endpoint (Ollama / vLLM / llama.cpp / Hermes CLI)
type Config struct {
	Mode        string        // "auto", "http", or "cli"
	BaseURL     string        // e.g. "http://localhost:11434/v1" or "http://localhost:8000/v1"
	Model       string        // e.g. "hermes3:8b", "nous-hermes-3-8b"
	APIKey      string        // Optional bearer token (default "ollama")
	CLIPath     string        // Path to hermes.exe or hermes command
	CLIProvider string        // Provider for hermes CLI (e.g. "copilot", "nous")
	CLIModel    string        // Model for hermes CLI (e.g. "gpt-4o", "claude-3.5-sonnet")
	Timeout          time.Duration // Timeout for HTTP/CLI execution (default 25s)
	Temperature      float64       // Low temperature for deterministic tool calling (default 0.1)
	MaxTokens        int           // Max output tokens (default 1024)
	AutoReplyEnabled bool          // Master toggle for AI chat auto reply
	AutoReplyMode    string        // "smart", "actionable_only", "all", "manual"
	ReplyTone        string        // "professional", "friendly", "concise"
	ReplyPrefix      string        // Bot prefix e.g. "[NovaPilot AI]"
	ReplyLanguage    string        // "id", "en", "auto"
}

// DefaultConfig loads configuration from environment variables or standard defaults
func DefaultConfig() Config {
	mode := os.Getenv("LLM_MODE")
	if mode == "" {
		mode = "auto"
	}
	baseURL := os.Getenv("LLM_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:11434/v1"
	}
	model := os.Getenv("LLM_MODEL")
	if model == "" {
		model = "hermes3:8b"
	}
	apiKey := os.Getenv("LLM_API_KEY")
	if apiKey == "" {
		apiKey = "ollama"
	}

	cliPath := os.Getenv("HERMES_CLI_PATH")
	if cliPath == "" {
		// Auto-detect standard Windows AppData user path & local wrappers
		userHome, _ := os.UserHomeDir()
		candidates := []string{
			filepath.Join(userHome, ".local", "bin", "hermes.cmd"),
			filepath.Join(userHome, ".local", "bin", "hermes.ps1"),
			filepath.Join(userHome, "AppData", "Local", "hermes", "hermes-agent", "cli.py"),
			filepath.Join(userHome, "AppData", "Local", "hermes", "bin", "hermes.exe"),
			"hermes",
		}
		for _, cand := range candidates {
			if _, err := os.Stat(cand); err == nil {
				cliPath = cand
				break
			}
		}
		if cliPath == "" {
			cliPath = "hermes"
		}
	}
	cliProvider := os.Getenv("HERMES_CLI_PROVIDER")
	if cliProvider == "" {
		cliProvider = "copilot"
	}
	cliModel := os.Getenv("HERMES_CLI_MODEL")
	if cliModel == "" {
		cliModel = "gpt-4o"
	}

	autoReplyEnabled := true
	if v := os.Getenv("AUTO_REPLY_ENABLED"); v == "false" || v == "0" {
		autoReplyEnabled = false
	}
	if v := os.Getenv("AI_AUTO_REPLY_ENABLED"); v == "false" || v == "0" {
		autoReplyEnabled = false
	}
	autoReplyMode := os.Getenv("AI_AUTO_REPLY_MODE")
	if autoReplyMode == "" {
		autoReplyMode = "smart"
	}
	replyTone := os.Getenv("AI_REPLY_TONE")
	if replyTone == "" {
		replyTone = "professional"
	}
	replyPrefix := os.Getenv("AI_REPLY_PREFIX")
	if replyPrefix == "" {
		replyPrefix = "[NovaPilot AI]"
	}
	replyLanguage := os.Getenv("AI_REPLY_LANGUAGE")
	if replyLanguage == "" {
		replyLanguage = "id"
	}

	return Config{
		Mode:             mode,
		BaseURL:          strings.TrimRight(baseURL, "/"),
		Model:            model,
		APIKey:           apiKey,
		CLIPath:          cliPath,
		CLIProvider:      cliProvider,
		CLIModel:         cliModel,
		Timeout:          25 * time.Second,
		Temperature:      0.1,
		MaxTokens:        1024,
		AutoReplyEnabled: autoReplyEnabled,
		AutoReplyMode:    autoReplyMode,
		ReplyTone:        replyTone,
		ReplyPrefix:      replyPrefix,
		ReplyLanguage:    replyLanguage,
	}
}

// ToolCallPayload represents an extracted function call from Hermes output
type ToolCallPayload struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

// HermesResult represents the processed outcome from Hermes 3 reasoning and tool calling
type HermesResult struct {
	RawContent     string           `json:"raw_content"`
	Thought        string           `json:"thought"`
	ToolCall       *ToolCallPayload `json:"tool_call,omitempty"`
	GeneratedReply string           `json:"generated_reply"`
	IsFallback     bool             `json:"is_fallback"`
	ModelUsed      string           `json:"model_used"`
	LatencyMs      int64            `json:"latency_ms"`
}

// ChatMessage represents a single turn in OpenAI-compatible format
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatCompletionRequest payload for OpenAI-compatible endpoint
type ChatCompletionRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float64       `json:"temperature"`
	MaxTokens   int           `json:"max_tokens"`
	Stream      bool          `json:"stream"`
}

// ChatCompletionResponse from OpenAI-compatible endpoint
type ChatCompletionResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

// HermesAdapter coordinates LLM inference and handles fallback heuristics
type HermesAdapter struct {
	cfg        Config
	httpClient *http.Client
}

// NewHermesAdapter creates a new instance of HermesAdapter
func NewHermesAdapter(cfg Config) *HermesAdapter {
	if cfg.BaseURL == "" {
		cfg.BaseURL = "http://localhost:11434/v1"
	}
	if cfg.Model == "" {
		cfg.Model = "hermes3:8b"
	}
	if cfg.Timeout <= 0 {
		cfg.Timeout = 25 * time.Second
	}
	if cfg.Temperature <= 0 {
		cfg.Temperature = 0.1
	}
	if cfg.MaxTokens <= 0 {
		cfg.MaxTokens = 1024
	}

	return &HermesAdapter{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
	}
}

func (h *HermesAdapter) GetConfig() Config {
	return h.cfg
}

func (h *HermesAdapter) UpdateConfig(cfg Config) {
	h.cfg = cfg
	if cfg.Timeout > 0 && h.httpClient != nil {
		h.httpClient.Timeout = cfg.Timeout
	}
}

const hermesSystemPrompt = `You are NovaPilot AI, an autonomous ChatOps gatekeeper for enterprise invoice mutations and accounting verification.
You analyze incoming chat messages from branch managers, warehouse officers, and customer service.

Available MCP Tools:
1. check_invoice(invoice_no: string): Queries the database to verify an existing invoice status.
2. stage_invoice_update(document_no: string, proposed_value: string, raw_message: string): Proposes a customer name correction into the human approval queue.
3. no_action_needed(): Used if the message is casual conversation, a greeting, or irrelevant.

OUTPUT PROTOCOL:
You MUST follow this exact format:
<thought>
Step 1: Identify intent (invoice revision, check, casual chat).
Step 2: Extract invoice number (e.g., INV/2026/001, NOTA-123).
Step 3: Extract proposed customer company name (PT, CV, UD, Toko).
Step 4: Check for fraud or anomalies (amount change requested? If amount change requested, reject or explain).
</thought>
<tool_call>
{"name": "stage_invoice_update", "arguments": {"document_no": "INV/2026/001", "proposed_value": "PT Sumber Makmur", "raw_message": "..."}}
</tool_call>
<reply>
Provide a polite, professional, concise response message to reply directly to the chat user (in Indonesian or English matching the user message language).
- If staging an invoice: confirm receipt, document number, proposed value, and state that it's waiting for on-call supervisor approval.
- If sales/pricing inquiry: summarize that the information query is being looked up or provide the findings.
- If missing details/needs review: politely ask the user to provide the invoice number (e.g. INV/2026/001) or specific amendment details.
- If casual chat/greeting: respond cordially and offer enterprise assistance.
</reply>`

// ProcessMessage sends a chat prompt to Hermes 3 (via HTTP, CLI, or Heuristic fallback)
func (h *HermesAdapter) ProcessMessage(ctx context.Context, rawMessage string, branchContext string) (*HermesResult, error) {
	// Guardrail Check: Neutralize adversarial prompt injection or unauthorized mutation patterns
	check := guardrail.InspectInboundMessage(rawMessage, "")
	if !check.IsSafe {
		return &HermesResult{
			RawContent: fmt.Sprintf("[SECURITY GUARDRAIL INTERCEPT] %s", check.Reason),
			Thought:    fmt.Sprintf("[GUARDRAIL ALERT: %s] %s. Tool call execution blocked.", check.Flag, check.Reason),
			ToolCall:   nil,
			IsFallback: true,
			ModelUsed:  "guardrail-shield-v1",
			LatencyMs:  0,
		}, nil
	}

	// Mode 1: Forced CLI
	if h.cfg.Mode == "cli" {
		return h.ProcessViaCLI(ctx, rawMessage, branchContext)
	}

	// Mode 2: Forced HTTP (Ollama / vLLM)
	if h.cfg.Mode == "http" {
		return h.ProcessViaHTTP(ctx, rawMessage, branchContext)
	}

	// Mode 3: "auto" - Try HTTP first with responsive timeout (3s), fallback to heuristic instantly
	httpCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	res, err := h.ProcessViaHTTP(httpCtx, rawMessage, branchContext)
	if err == nil && !res.IsFallback && res.ToolCall != nil {
		return res, nil
	}

	// Default to instant heuristic fallback (<10ms)
	return h.FallbackHeuristic(rawMessage), nil
}

func (h *HermesAdapter) hasCLI() bool {
	if h.cfg.CLIPath == "" {
		return false
	}
	if filepath.IsAbs(h.cfg.CLIPath) {
		_, err := os.Stat(h.cfg.CLIPath)
		return err == nil
	}
	_, err := exec.LookPath(h.cfg.CLIPath)
	return err == nil
}

// ProcessViaHTTP sends request to an OpenAI-compatible HTTP endpoint (Ollama / vLLM)
func (h *HermesAdapter) ProcessViaHTTP(ctx context.Context, rawMessage string, branchContext string) (*HermesResult, error) {
	start := time.Now()

	userPrompt := fmt.Sprintf("Incoming Chat Message:\n\"%s\"", rawMessage)
	if branchContext != "" {
		userPrompt += fmt.Sprintf("\n\nBranch Context: %s", branchContext)
	}

	reqBody := ChatCompletionRequest{
		Model: h.cfg.Model,
		Messages: []ChatMessage{
			{Role: "system", Content: hermesSystemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature: h.cfg.Temperature,
		MaxTokens:   h.cfg.MaxTokens,
		Stream:      false,
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return h.FallbackHeuristic(rawMessage), nil
	}

	endpoint := fmt.Sprintf("%s/chat/completions", h.cfg.BaseURL)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return h.FallbackHeuristic(rawMessage), nil
	}

	httpReq.Header.Set("Content-Type", "application/json")
	if h.cfg.APIKey != "" {
		httpReq.Header.Set("Authorization", "Bearer "+h.cfg.APIKey)
	}

	resp, err := h.httpClient.Do(httpReq)
	if err != nil {
		res := h.FallbackHeuristic(rawMessage)
		res.LatencyMs = time.Since(start).Milliseconds()
		return res, nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		res := h.FallbackHeuristic(rawMessage)
		res.LatencyMs = time.Since(start).Milliseconds()
		return res, nil
	}

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return h.FallbackHeuristic(rawMessage), nil
	}

	var chatResp ChatCompletionResponse
	if err := json.Unmarshal(respBytes, &chatResp); err != nil || len(chatResp.Choices) == 0 {
		return h.FallbackHeuristic(rawMessage), nil
	}

	content := chatResp.Choices[0].Message.Content
	thought, toolCall := ParseHermesOutput(content)
	reply := ParseHermesReply(content)
	if reply == "" {
		reply = h.GenerateAutoReply(rawMessage, toolCall, false, h.cfg.ReplyTone, h.cfg.ReplyPrefix, h.cfg.ReplyLanguage)
	}

	latency := time.Since(start).Milliseconds()

	return &HermesResult{
		RawContent:     content,
		Thought:        thought,
		ToolCall:       toolCall,
		GeneratedReply: reply,
		IsFallback:     false,
		ModelUsed:      fmt.Sprintf("http:%s", h.cfg.Model),
		LatencyMs:      latency,
	}, nil
}

// ProcessViaCLI executes Hermes 3 via local Hermes Agent CLI in oneshot mode
func (h *HermesAdapter) ProcessViaCLI(ctx context.Context, rawMessage string, branchContext string) (*HermesResult, error) {
	start := time.Now()

	userPrompt := fmt.Sprintf("%s\n\nIncoming Chat Message:\n\"%s\"", hermesSystemPrompt, rawMessage)
	if branchContext != "" {
		userPrompt += fmt.Sprintf("\n\nBranch Context: %s", branchContext)
	}

	cliTimeout := 45 * time.Second
	if h.cfg.Timeout > 0 && h.cfg.Timeout > cliTimeout {
		cliTimeout = h.cfg.Timeout
	}
	cliCtx, cancel := context.WithTimeout(ctx, cliTimeout)
	defer cancel()

	userHome, _ := os.UserHomeDir()
	var cmd *exec.Cmd

	if strings.HasSuffix(h.cfg.CLIPath, ".py") {
		pythonPath := filepath.Join(userHome, "AppData", "Local", "hermes", "tools", "python-3.14.7+20260901-win32-x64", "python.exe")
		if _, err := os.Stat(pythonPath); err != nil {
			pythonPath = "python"
		}
		cmd = exec.CommandContext(cliCtx, pythonPath, h.cfg.CLIPath, "-q", userPrompt, "--oneshot", "-t", "")
	} else if strings.HasSuffix(h.cfg.CLIPath, ".cmd") || strings.HasSuffix(h.cfg.CLIPath, ".bat") {
		cmd = exec.CommandContext(cliCtx, "cmd.exe", "/C", h.cfg.CLIPath, "-q", userPrompt, "--oneshot", "-t", "")
	} else {
		cmd = exec.CommandContext(cliCtx, h.cfg.CLIPath, "-q", userPrompt, "--oneshot", "-t", "")
	}

	outBytes, err := cmd.CombinedOutput()
	if err != nil && len(outBytes) == 0 {
		res := h.FallbackHeuristic(rawMessage)
		res.LatencyMs = time.Since(start).Milliseconds()
		return res, nil
	}

	content := string(outBytes)
	thought, toolCall := ParseHermesOutput(content)
	reply := ParseHermesReply(content)
	if reply == "" {
		reply = h.GenerateAutoReply(rawMessage, toolCall, false, h.cfg.ReplyTone, h.cfg.ReplyPrefix, h.cfg.ReplyLanguage)
	}

	if toolCall == nil {
		res := h.FallbackHeuristic(rawMessage)
		if thought != "" {
			res.Thought = thought
		}
		if reply != "" {
			res.GeneratedReply = reply
		}
		res.RawContent = content
		res.LatencyMs = time.Since(start).Milliseconds()
		return res, nil
	}

	latency := time.Since(start).Milliseconds()

	return &HermesResult{
		RawContent:     content,
		Thought:        thought,
		ToolCall:       toolCall,
		GeneratedReply: reply,
		IsFallback:     false,
		ModelUsed:      fmt.Sprintf("hermes-cli:%s", filepath.Base(h.cfg.CLIPath)),
		LatencyMs:      latency,
	}, nil
}

var (
	thoughtRegex      = regexp.MustCompile(`(?s)<thought>(.*?)</thought>`)
	toolCallRegex     = regexp.MustCompile(`(?s)<tool_call>(.*?)</tool_call>`)
	replyRegex        = regexp.MustCompile(`(?s)<reply>\s*(.*?)\s*</reply>`)
	cliReasoningRegex = regexp.MustCompile(`(?s)┌─ Reasoning ─+┐\s*(.*?)\s*└─+┘`)
	cliHermesBoxRegex = regexp.MustCompile(`(?s)╭─ ☤ Hermes ─+╮\s*(.*?)\s*╰─+╯`)
)

// ParseHermesReply extracts <reply> block from raw LLM output
func ParseHermesReply(raw string) string {
	match := replyRegex.FindStringSubmatch(raw)
	if len(match) > 1 {
		reply := strings.TrimSpace(match[1])
		reply = strings.TrimPrefix(reply, "```markdown")
		reply = strings.TrimPrefix(reply, "```")
		reply = strings.TrimSuffix(reply, "```")
		return strings.TrimSpace(reply)
	}
	return ""
}

// ParseHermesOutput extracts <thought> and <tool_call> blocks from raw LLM output
func ParseHermesOutput(raw string) (string, *ToolCallPayload) {
	var thought string
	var toolCall *ToolCallPayload

	// 1. Extract Thought
	thoughtMatch := thoughtRegex.FindStringSubmatch(raw)
	if len(thoughtMatch) > 1 {
		thought = strings.TrimSpace(thoughtMatch[1])
	} else {
		// Fallback to CLI's native reasoning box
		cliThoughtMatch := cliReasoningRegex.FindStringSubmatch(raw)
		if len(cliThoughtMatch) > 1 {
			thought = strings.TrimSpace(cliThoughtMatch[1])
		}
	}

	// 2. Extract Tool Call
	toolMatch := toolCallRegex.FindStringSubmatch(raw)
	if len(toolMatch) > 1 {
		cleanJSON := strings.TrimSpace(toolMatch[1])
		cleanJSON = strings.TrimPrefix(cleanJSON, "```json")
		cleanJSON = strings.TrimPrefix(cleanJSON, "```")
		cleanJSON = strings.TrimSuffix(cleanJSON, "```")
		cleanJSON = strings.TrimSpace(cleanJSON)

		var payload ToolCallPayload
		if err := json.Unmarshal([]byte(cleanJSON), &payload); err == nil && payload.Name != "" {
			toolCall = &payload
		}
	}

	// 3. Fallback: If no <tool_call> tag, check inside CLI Hermes box
	if toolCall == nil {
		boxMatch := cliHermesBoxRegex.FindStringSubmatch(raw)
		if len(boxMatch) > 1 {
			boxContent := strings.TrimSpace(boxMatch[1])
			if innerMatch := toolCallRegex.FindStringSubmatch(boxContent); len(innerMatch) > 1 {
				var payload ToolCallPayload
				if err := json.Unmarshal([]byte(strings.TrimSpace(innerMatch[1])), &payload); err == nil && payload.Name != "" {
					toolCall = &payload
				}
			}
		}
	}

	// 4. Fallback: If no tags found but looks like raw JSON
	if toolCall == nil && strings.HasPrefix(strings.TrimSpace(raw), "{") && strings.HasSuffix(strings.TrimSpace(raw), "}") {
		var payload ToolCallPayload
		if err := json.Unmarshal([]byte(strings.TrimSpace(raw)), &payload); err == nil && payload.Name != "" {
			toolCall = &payload
		}
	}

	return thought, toolCall
}

// GenerateAutoReply builds a natural, contextual auto-reply based on message content, tool calls, and configuration
func (h *HermesAdapter) GenerateAutoReply(rawMessage string, toolCall *ToolCallPayload, isFallback bool, tone string, prefix string, lang string) string {
	if prefix == "" {
		prefix = h.cfg.ReplyPrefix
		if prefix == "" {
			prefix = "[NovaPilot AI]"
		}
	}
	if tone == "" {
		tone = h.cfg.ReplyTone
		if tone == "" {
			tone = "professional"
		}
	}
	if lang == "" || lang == "auto" {
		lower := strings.ToLower(rawMessage)
		if strings.Contains(lower, "please") || strings.Contains(lower, "update") || strings.Contains(lower, "invoice") || strings.Contains(lower, "thanks") || strings.Contains(lower, "change") {
			lang = "en"
		} else {
			lang = "id"
		}
	}

	lower := strings.ToLower(rawMessage)

	// Scenario 1: Actionable invoice mutation / staging
	if toolCall != nil && (toolCall.Name == "stage_invoice_update" || toolCall.Name == "UPDATE_CUSTOMER_NAME") {
		docNo, _ := toolCall.Arguments["document_no"].(string)
		if docNo == "" {
			docNo, _ = toolCall.Arguments["invoice_no"].(string)
		}
		target, _ := toolCall.Arguments["proposed_value"].(string)
		if target == "" {
			target, _ = toolCall.Arguments["target_client"].(string)
		}

		if lang == "en" {
			switch tone {
			case "friendly":
				return fmt.Sprintf("%s Hello! We've recorded your mutation request for invoice %s (new customer: \"%s\"). It is currently awaiting IT on-call approval.", prefix, docNo, target)
			case "concise":
				return fmt.Sprintf("%s TICKET LOGGED: %s -> \"%s\" [Pending On-Call Clearance]", prefix, docNo, target)
			default: // professional
				return fmt.Sprintf("%s Request received. The customer name revision for invoice %s to \"%s\" has been queued for on-call supervisor sign-off. Enterprise audit checks in progress.", prefix, docNo, target)
			}
		} else {
			switch tone {
			case "friendly":
				return fmt.Sprintf("%s Halo Rekan! Permintaan mutasi faktur %s ke \"%s\" sudah berhasil dicatat ya. Tiket sedang menunggu konfirmasi supervisor on-call.", prefix, docNo, target)
			case "concise":
				return fmt.Sprintf("%s TIKET DICATAT: Faktur %s -> \"%s\" (Menunggu Verifikasi On-Call)", prefix, docNo, target)
			default: // professional
				return fmt.Sprintf("%s Yth. Rekan, permintaan revisi nama customer faktur %s menjadi \"%s\" telah berhasil dicatat ke antrean persetujuan on-call. Pemeriksaan data SAP/Oracle sedang berjalan.", prefix, docNo, target)
			}
		}
	}

	// Scenario 2: Invoice query
	if toolCall != nil && toolCall.Name == "check_invoice" {
		docNo, _ := toolCall.Arguments["invoice_no"].(string)
		if lang == "en" {
			return fmt.Sprintf("%s Checking database status and verifying line items for invoice %s...", prefix, docNo)
		}
		return fmt.Sprintf("%s Sedang memeriksa status dan memvalidasi rincian faktur %s pada basis data operasional ERP...", prefix, docNo)
	}

	// Scenario 3: Sales Order query
	if strings.Contains(lower, "penjualan") || strings.Contains(lower, "sales order") || strings.Contains(lower, "so/2026") || strings.Contains(lower, "order") {
		if lang == "en" {
			return fmt.Sprintf("%s Looking up Sales Order records and fulfillment status in the ERP registry...", prefix)
		}
		return fmt.Sprintf("%s Permintaan penelusuran data pesanan penjualan (Sales Order) sedang diproses dari katalog ERP.", prefix)
	}

	// Scenario 4: Pricing / Discount query
	if strings.Contains(lower, "harga") || strings.Contains(lower, "diskon") || strings.Contains(lower, "pricelist") || strings.Contains(lower, "plafon") {
		if lang == "en" {
			return fmt.Sprintf("%s Retrieving verified corporate price lists and credit discount ceilings from ERP database...", prefix)
		}
		return fmt.Sprintf("%s Permintaan informasi daftar harga dan plafon diskon resmi produk sedang disiapkan dari basis data.", prefix)
	}

	// Scenario 5: Ambiguous / Missing details (contains mutation keywords like "ubah", "ganti", "revisi", but missing invoice number)
	if strings.Contains(lower, "ubah") || strings.Contains(lower, "ganti") || strings.Contains(lower, "revisi") || strings.Contains(lower, "koreksi") || strings.Contains(lower, "bisa diubah") {
		if lang == "en" {
			switch tone {
			case "friendly":
				return fmt.Sprintf("%s Hi there! Please share the invoice number (e.g., INV/2026/001) and the target company name so we can assist you with the revision.", prefix)
			case "concise":
				return fmt.Sprintf("%s INCOMPLETE: Please specify invoice number (e.g., INV/2026/001) and target name.", prefix)
			default:
				return fmt.Sprintf("%s Thank you for reaching out. To proceed with the requested amendment, please provide the official invoice number (e.g., INV/2026/001) and the verified customer entity name.", prefix)
			}
		} else {
			switch tone {
			case "friendly":
				return fmt.Sprintf("%s Halo Rekan! Mohon sertakan nomor fakturnya (misal: INV/2026/001) dan nama PT barunya ya agar bisa langsung kami bantu proseskan.", prefix)
			case "concise":
				return fmt.Sprintf("%s DATA KURANG: Mohon lampirkan nomor faktur (contoh: INV/2026/001) dan nama entitas tujuan.", prefix)
			default:
				return fmt.Sprintf("%s Terima kasih atas informasinya. Agar proses verifikasi mutasi dapat kami lakukan, mohon sertakan nomor invoice/faktur resmi (contoh: INV/2026/001) serta nama customer tujuan.", prefix)
			}
		}
	}

	// Scenario 6: Casual banter / Greeting
	if strings.Contains(lower, "halo") || strings.Contains(lower, "hello") || strings.Contains(lower, "hi") || strings.Contains(lower, "selamat") || strings.Contains(lower, "pagi") || strings.Contains(lower, "siang") || strings.Contains(lower, "sore") || strings.Contains(lower, "malam") || strings.Contains(lower, "ping") || strings.Contains(lower, "tes") {
		if lang == "en" {
			switch tone {
			case "friendly":
				return fmt.Sprintf("%s Hello! How can we assist you with invoice verification or warehouse ChatOps today?", prefix)
			case "concise":
				return fmt.Sprintf("%s NovaPilot AI Online. Send invoice number or command to proceed.", prefix)
			default:
				return fmt.Sprintf("%s Welcome to NovaPilot AI ChatOps. Our on-call system is active. Please let us know if you require invoice verification or data mutation.", prefix)
			}
		} else {
			switch tone {
			case "friendly":
				return fmt.Sprintf("%s Halo! Ada yang bisa kami bantu seputar faktur, pesanan penjualan, atau mutasi data hari ini?", prefix)
			case "concise":
				return fmt.Sprintf("%s NovaPilot AI Online (Siaga On-Call). Silakan ketik perintah atau nomor faktur.", prefix)
			default:
				return fmt.Sprintf("%s Halo! Sistem NovaPilot AI On-Call aktif siaga 24/7. Silakan informasikan nomor faktur atau dokumen yang memerlukan bantuan verifikasi.", prefix)
			}
		}
	}

	// Default fallback
	if lang == "en" {
		return fmt.Sprintf("%s Your message has been received by NovaPilot AI. On-call IT operations will follow up promptly.", prefix)
	}
	return fmt.Sprintf("%s Pesan Anda telah diterima oleh sistem NovaPilot AI. Petugas IT On-Call akan menindaklanjuti pesan Anda.", prefix)
}

// FallbackHeuristic extracts invoice number and target name using regex when LLM is unavailable
func (h *HermesAdapter) FallbackHeuristic(rawMessage string) *HermesResult {
	invRegex := regexp.MustCompile(`(?i)(?:invoice|inv|faktur|nota)[\s/:\-_#]*([a-z0-9]+(?:[\/\-_][a-z0-9]+)+)`)
	invMatch := invRegex.FindStringSubmatch(rawMessage)

	var docNo string
	if len(invMatch) > 1 {
		docNo = strings.ToUpper(strings.ReplaceAll(invMatch[1], "-", "/"))
	}

	targetRegex := regexp.MustCompile(`(?i)(?:menjadi|ke|jadi|ganti)\s+((?:PT|CV|UD|Toko)\s+[^,\.\n]+)`)
	targetMatch := targetRegex.FindStringSubmatch(rawMessage)

	var proposedValue string
	if len(targetMatch) > 1 {
		proposedValue = strings.TrimSpace(targetMatch[1])
	}

	thought := "[HEURISTIC FALLBACK] Hermes LLM engine offline. Extracted parameters using deterministic regex heuristic patterns."

	var toolCall *ToolCallPayload
	if docNo != "" && proposedValue != "" {
		toolCall = &ToolCallPayload{
			Name: "stage_invoice_update",
			Arguments: map[string]interface{}{
				"document_no":    docNo,
				"proposed_value": proposedValue,
				"raw_message":    rawMessage,
			},
		}
	} else if docNo != "" {
		toolCall = &ToolCallPayload{
			Name: "check_invoice",
			Arguments: map[string]interface{}{
				"invoice_no": docNo,
			},
		}
	}

	reply := h.GenerateAutoReply(rawMessage, toolCall, true, h.cfg.ReplyTone, h.cfg.ReplyPrefix, h.cfg.ReplyLanguage)

	return &HermesResult{
		RawContent:     "Fallback Rule-Based Heuristic",
		Thought:        thought,
		ToolCall:       toolCall,
		GeneratedReply: reply,
		IsFallback:     true,
		ModelUsed:      "heuristic-fallback-v1",
		LatencyMs:      0,
	}
}
