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
	Timeout     time.Duration // Timeout for HTTP/CLI execution (default 25s)
	Temperature float64       // Low temperature for deterministic tool calling (default 0.1)
	MaxTokens   int           // Max output tokens (default 1024)
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
		// Auto-detect standard Windows AppData user path
		userHome, _ := os.UserHomeDir()
		standardWinPath := filepath.Join(userHome, "AppData", "Local", "hermes", "bin", "hermes.exe")
		if _, err := os.Stat(standardWinPath); err == nil {
			cliPath = standardWinPath
		} else {
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

	return Config{
		Mode:        mode,
		BaseURL:     strings.TrimRight(baseURL, "/"),
		Model:       model,
		APIKey:      apiKey,
		CLIPath:     cliPath,
		CLIProvider: cliProvider,
		CLIModel:    cliModel,
		Timeout:     25 * time.Second,
		Temperature: 0.1,
		MaxTokens:   1024,
	}
}

// ToolCallPayload represents an extracted function call from Hermes output
type ToolCallPayload struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

// HermesResult represents the processed outcome from Hermes 3 reasoning and tool calling
type HermesResult struct {
	RawContent string           `json:"raw_content"`
	Thought    string           `json:"thought"`
	ToolCall   *ToolCallPayload `json:"tool_call,omitempty"`
	IsFallback bool             `json:"is_fallback"`
	ModelUsed  string           `json:"model_used"`
	LatencyMs  int64            `json:"latency_ms"`
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
</tool_call>`

// ProcessMessage sends a chat prompt to Hermes 3 (via HTTP, CLI, or Heuristic fallback)
func (h *HermesAdapter) ProcessMessage(ctx context.Context, rawMessage string, branchContext string) (*HermesResult, error) {
	// Mode 1: Forced CLI
	if h.cfg.Mode == "cli" {
		return h.ProcessViaCLI(ctx, rawMessage, branchContext)
	}

	// Mode 2: Forced HTTP (Ollama / vLLM)
	if h.cfg.Mode == "http" {
		return h.ProcessViaHTTP(ctx, rawMessage, branchContext)
	}

	// Mode 3: "auto" - Try HTTP first, then CLI, then Heuristic Fallback
	res, err := h.ProcessViaHTTP(ctx, rawMessage, branchContext)
	if err == nil && !res.IsFallback && res.ToolCall != nil {
		return res, nil
	}

	// If HTTP was fallback or failed, try CLI if binary is available
	if h.hasCLI() {
		cliRes, cliErr := h.ProcessViaCLI(ctx, rawMessage, branchContext)
		if cliErr == nil && !cliRes.IsFallback && cliRes.ToolCall != nil {
			return cliRes, nil
		}
	}

	// Default to heuristic fallback
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

	latency := time.Since(start).Milliseconds()

	return &HermesResult{
		RawContent: content,
		Thought:    thought,
		ToolCall:   toolCall,
		IsFallback: false,
		ModelUsed:  fmt.Sprintf("http:%s", h.cfg.Model),
		LatencyMs:  latency,
	}, nil
}

// ProcessViaCLI executes Hermes 3 via local hermes.exe CLI in oneshot mode
func (h *HermesAdapter) ProcessViaCLI(ctx context.Context, rawMessage string, branchContext string) (*HermesResult, error) {
	start := time.Now()

	userPrompt := fmt.Sprintf("%s\n\nIncoming Chat Message:\n\"%s\"", hermesSystemPrompt, rawMessage)
	if branchContext != "" {
		userPrompt += fmt.Sprintf("\n\nBranch Context: %s", branchContext)
	}

	cmdArgs := []string{
		"--provider", h.cfg.CLIProvider,
		"-m", h.cfg.CLIModel,
		"-z", userPrompt,
	}

	cliTimeout := 8 * time.Second
	if h.cfg.Timeout > 0 && h.cfg.Timeout < cliTimeout {
		cliTimeout = h.cfg.Timeout
	}
	cliCtx, cancel := context.WithTimeout(ctx, cliTimeout)
	defer cancel()

	cmd := exec.CommandContext(cliCtx, h.cfg.CLIPath, cmdArgs...)
	outBytes, err := cmd.Output()
	if err != nil {
		res := h.FallbackHeuristic(rawMessage)
		res.LatencyMs = time.Since(start).Milliseconds()
		return res, nil
	}

	content := string(outBytes)
	thought, toolCall := ParseHermesOutput(content)
	if toolCall == nil {
		res := h.FallbackHeuristic(rawMessage)
		if thought != "" {
			res.Thought = thought
		}
		res.RawContent = content
		res.LatencyMs = time.Since(start).Milliseconds()
		return res, nil
	}

	latency := time.Since(start).Milliseconds()

	return &HermesResult{
		RawContent: content,
		Thought:    thought,
		ToolCall:   toolCall,
		IsFallback: false,
		ModelUsed:  fmt.Sprintf("hermes-cli:%s/%s", h.cfg.CLIProvider, h.cfg.CLIModel),
		LatencyMs:  latency,
	}, nil
}

var (
	thoughtRegex  = regexp.MustCompile(`(?s)<thought>(.*?)</thought>`)
	toolCallRegex = regexp.MustCompile(`(?s)<tool_call>(.*?)</tool_call>`)
)

// ParseHermesOutput extracts <thought> and <tool_call> blocks from raw LLM output
func ParseHermesOutput(raw string) (string, *ToolCallPayload) {
	var thought string
	var toolCall *ToolCallPayload

	// 1. Extract Thought
	thoughtMatch := thoughtRegex.FindStringSubmatch(raw)
	if len(thoughtMatch) > 1 {
		thought = strings.TrimSpace(thoughtMatch[1])
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

	// 3. Fallback: If no tags found but looks like raw JSON
	if toolCall == nil && strings.HasPrefix(strings.TrimSpace(raw), "{") && strings.HasSuffix(strings.TrimSpace(raw), "}") {
		var payload ToolCallPayload
		if err := json.Unmarshal([]byte(strings.TrimSpace(raw)), &payload); err == nil && payload.Name != "" {
			toolCall = &payload
		}
	}

	return thought, toolCall
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

	return &HermesResult{
		RawContent: "Fallback Rule-Based Heuristic",
		Thought:    thought,
		ToolCall:   toolCall,
		IsFallback: true,
		ModelUsed:  "heuristic-fallback-v1",
		LatencyMs:  0,
	}
}
