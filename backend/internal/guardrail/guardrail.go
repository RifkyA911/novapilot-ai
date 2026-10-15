package guardrail

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"time"
)

var (
	ErrSensitiveDataLeak   = errors.New("guardrail violation: message contains sensitive credentials or secrets (DLP triggered)")
	ErrRateLimitExceeded   = errors.New("guardrail violation: outbound dispatch rate limit exceeded, please wait before retrying")
	ErrEmergencyNumber     = errors.New("guardrail violation: sending to emergency or reserved service numbers is strictly prohibited")
	ErrInvalidPhoneNumber  = errors.New("guardrail violation: invalid recipient phone number format")
	ErrPromptInjection     = errors.New("guardrail violation: detected adversarial prompt injection pattern")
	ErrSQLInjectionPattern = errors.New("guardrail violation: detected potential SQL injection pattern in proposed mutation")
	ErrUnauthorizedField   = errors.New("guardrail violation: mutation of sensitive financial fields (amounts/bank accounts) via chat is prohibited")
)

var (
	// DLP Regexes
	dbConnRegex    = regexp.MustCompile(`(?i)(postgres|postgresql|mysql|oracle|mongodb):\/\/[^\s]+`)
	jwtRegex       = regexp.MustCompile(`\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b`)
	bearerRegex    = regexp.MustCompile(`(?i)\bBearer\s+[A-Za-z0-9\-\._~\+\/]{20,}=*\b`)
	privateKeyRgx  = regexp.MustCompile(`(?i)-----BEGIN[ A-Z0-9_-]*PRIVATE KEY-----`)
	credentialRgx  = regexp.MustCompile(`(?i)(password|secret|api_key|token)\s*[:=]\s*['"][^\s'"]{6,}['"]`)

	// Inbound Injection Regexes
	injectionRegex = regexp.MustCompile(`(?i)(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules|commands)|(?:system\s+override|developer\s+mode|jailbreak|dan\s+mode)|you\s+are\s+now\s+(?:an?\s+)?unrestricted|<script[\s>]|javascript:`)
	sqlPatternRgx  = regexp.MustCompile(`(?i)(?:--|\/\*|\*\/|;\s*(?:drop|delete|insert|update|alter|truncate)|union\s+all\s+select|union\s+select|1\s*=\s*1|'\s*or\s*'1'='1)`)
	amountTamper   = regexp.MustCompile(`(?i)(?:ubah|ganti|revisi|set)\s+(?:total|nominal|jumlah|harga|amount|saldo|rekening|no\s*rek|bank\s+account)`)

	// Emergency Numbers
	emergencyNumbers = map[string]bool{
		"110": true,
		"112": true,
		"113": true,
		"115": true,
		"118": true,
		"119": true,
		"911": true,
		"999": true,
	}
)

// RateLimiter manages sliding window rate limits for outbound messages
type RateLimiter struct {
	mu           sync.Mutex
	history      map[string][]time.Time
	maxPerWindow int
	window       time.Duration
	minInterval  time.Duration
}

// Global default rate limiter: max 5 messages per 30s per recipient, min 1s cooldown
var DefaultRateLimiter = NewRateLimiter(5, 30*time.Second, 1*time.Second)

func NewRateLimiter(maxPerWindow int, window time.Duration, minInterval time.Duration) *RateLimiter {
	return &RateLimiter{
		history:      make(map[string][]time.Time),
		maxPerWindow: maxPerWindow,
		window:       window,
		minInterval:  minInterval,
	}
}

func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	timestamps, exists := rl.history[key]
	if !exists {
		rl.history[key] = []time.Time{now}
		return true
	}

	// Filter timestamps inside window
	var valid []time.Time
	for _, t := range timestamps {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}

	// Check min interval from last send
	if len(valid) > 0 {
		last := valid[len(valid)-1]
		if now.Sub(last) < rl.minInterval {
			return false
		}
	}

	if len(valid) >= rl.maxPerWindow {
		rl.history[key] = valid
		return false
	}

	valid = append(valid, now)
	rl.history[key] = valid
	return true
}

// ValidateOutboundMessage applies DLP, rate-limiting, and recipient phone checks
func ValidateOutboundMessage(phone string, message string) error {
	cleanPhone := strings.TrimSpace(phone)
	cleanPhone = strings.TrimPrefix(cleanPhone, "+")
	cleanDigits := regexp.MustCompile(`\D`).ReplaceAllString(cleanPhone, "")

	if cleanDigits == "" {
		return ErrInvalidPhoneNumber
	}

	if emergencyNumbers[cleanDigits] {
		return ErrEmergencyNumber
	}

	if len(cleanDigits) < 8 || len(cleanDigits) > 16 {
		return fmt.Errorf("%w: phone number must be between 8 and 16 digits (got %d digits)", ErrInvalidPhoneNumber, len(cleanDigits))
	}

	// Check DLP for sensitive credential leakage
	if dbConnRegex.MatchString(message) ||
		jwtRegex.MatchString(message) ||
		bearerRegex.MatchString(message) ||
		privateKeyRgx.MatchString(message) ||
		credentialRgx.MatchString(message) {
		return ErrSensitiveDataLeak
	}

	// Check sliding window rate limit
	if !DefaultRateLimiter.Allow(cleanDigits) {
		return ErrRateLimitExceeded
	}

	return nil
}

// InboundInspectionResult details security assessment of incoming chat
type InboundInspectionResult struct {
	IsSafe          bool
	Flag            string
	Reason          string
	RequiresReview  bool
	SanitizedTarget string
}

// InspectInboundMessage checks for adversarial injection, SQL patterns, and unauthorized field mutations
func InspectInboundMessage(rawMessage string, proposedTarget string) InboundInspectionResult {
	res := InboundInspectionResult{
		IsSafe:          true,
		SanitizedTarget: strings.TrimSpace(proposedTarget),
	}

	// 1. Check prompt injection
	if injectionRegex.MatchString(rawMessage) {
		res.IsSafe = false
		res.Flag = "PROMPT_INJECTION_DETECTED"
		res.Reason = "Message contains adversarial prompt injection or instructions to bypass safety policy."
		res.RequiresReview = true
		return res
	}

	// 2. Check for unauthorized financial mutations (amount/bank changes via chat)
	if amountTamper.MatchString(rawMessage) {
		res.IsSafe = false
		res.Flag = "UNAUTHORIZED_AMOUNT_MUTATION"
		res.Reason = "Mutation of financial amounts or bank account details via chat is strictly prohibited by Gatekeeper SOP."
		res.RequiresReview = true
		return res
	}

	// 3. Check for SQL Injection patterns in raw message or proposed target
	if sqlPatternRgx.MatchString(rawMessage) || sqlPatternRgx.MatchString(proposedTarget) {
		res.IsSafe = false
		res.Flag = "SQL_INJECTION_PATTERN_DETECTED"
		res.Reason = "Message or proposed mutation target contains SQL injection syntax."
		res.RequiresReview = true
		return res
	}

	// 4. Sanitize proposed target if present (strip HTML / unsafe characters)
	if res.SanitizedTarget != "" {
		// Strip script tags or HTML-like angle brackets
		res.SanitizedTarget = strings.ReplaceAll(res.SanitizedTarget, "<", "")
		res.SanitizedTarget = strings.ReplaceAll(res.SanitizedTarget, ">", "")
		res.SanitizedTarget = strings.ReplaceAll(res.SanitizedTarget, "\"", "")
		res.SanitizedTarget = strings.ReplaceAll(res.SanitizedTarget, "'", "")
		res.SanitizedTarget = strings.TrimSpace(res.SanitizedTarget)
	}

	return res
}
