package handler

import (
	"database/sql"
	"fmt"
	"io"
	"net"
	"net/http"
	"novapilot-ai/backend/internal/domain"
	"novapilot-ai/backend/internal/service"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type APIHandler struct {
	ticketService *service.TicketService
	invoiceRepo   domain.InvoiceRepository
	auditRepo     domain.AuditRepository
	inboundRepo   domain.InboundMessageRepository
	patternRepo   domain.LearnedPatternRepository
	sseHub        *SSEHub
	uploadDir     string
	db            *sql.DB
	startTime     time.Time
}

func NewAPIHandler(
	ticketService *service.TicketService,
	invoiceRepo domain.InvoiceRepository,
	auditRepo domain.AuditRepository,
	inboundRepo domain.InboundMessageRepository,
	patternRepo domain.LearnedPatternRepository,
	sseHub *SSEHub,
	uploadDir string,
	db *sql.DB,
) *APIHandler {
	_ = os.MkdirAll(uploadDir, 0755)
	return &APIHandler{
		ticketService: ticketService,
		invoiceRepo:   invoiceRepo,
		auditRepo:     auditRepo,
		inboundRepo:   inboundRepo,
		patternRepo:   patternRepo,
		sseHub:        sseHub,
		uploadDir:     uploadDir,
		db:            db,
		startTime:     time.Now(),
	}
}


func (h *APIHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "UP",
		"service":   "NovaPilot AI Core",
		"version":   "1.0.0",
		"timestamp": time.Now().UTC(),
	})
}

func (h *APIHandler) GetTelemetry(c *gin.Context) {
	// 1. Resolve host active LAN IP
	lanIP := "127.0.0.1"
	if addrs, err := net.InterfaceAddrs(); err == nil {
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
				if ipnet.IP.To4() != nil {
					lanIP = ipnet.IP.String()
					break
				}
			}
		}
	}

	// 2. Resolve database connection pool statistics
	var dbStats gin.H
	if h.db != nil {
		stats := h.db.Stats()
		dbStats = gin.H{
			"open_connections": stats.OpenConnections,
			"in_use":           stats.InUse,
			"idle":             stats.Idle,
			"wait_count":       stats.WaitCount,
			"max_open":         25,
			"status":           "HEALTHY",
			"driver":           "PostgreSQL 18 (Local)",
		}
	} else {
		dbStats = gin.H{
			"status": "DISCONNECTED",
			"driver": "None",
		}
	}

	// 3. Resolve memory and runtime statistics
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	c.JSON(http.StatusOK, gin.H{
		"service":         "NovaPilot AI Core",
		"status":          "OPERATIONAL",
		"lan_ip":          lanIP,
		"uptime_seconds":  int(time.Since(h.startTime).Seconds()),
		"goroutines":      runtime.NumGoroutine(),
		"memory_alloc_mb": fmt.Sprintf("%.2f MB", float64(memStats.Alloc)/1024/1024),
		"database":        dbStats,
		"timestamp":       time.Now().UTC(),
	})
}

func (h *APIHandler) ListTickets(c *gin.Context) {
	statusFilter := c.Query("status")
	tickets, err := h.ticketService.ListTickets(statusFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tickets)
}

func (h *APIHandler) GetTicket(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket id"})
		return
	}
	ticket, err := h.ticketService.GetTicket(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ticket)
}

func (h *APIHandler) CreateTicket(c *gin.Context) {
	var input domain.CreateTicketInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ticket, err := h.ticketService.CreateTicketFromChat(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, ticket)
}

func (h *APIHandler) ApproveTicket(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket id"})
		return
	}

	var input domain.ApproveTicketInput
	if err := c.ShouldBindJSON(&input); err != nil {
		input.ApproverName = "John Doe (On-Call)"
	}

	ticket, err := h.ticketService.ApproveTicket(id, input.ApproverName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ticket)
}

func (h *APIHandler) RejectTicket(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket id"})
		return
	}

	var input domain.RejectTicketInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "reason is required for rejection"})
		return
	}

	ticket, err := h.ticketService.RejectTicket(id, input.ApproverName, input.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ticket)
}

func (h *APIHandler) ListInvoices(c *gin.Context) {
	invoices, err := h.invoiceRepo.ListAll(50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, invoices)
}

func (h *APIHandler) ListAuditLogs(c *gin.Context) {
	logs, err := h.auditRepo.GetRecent(50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}

// UploadDocument handles multi-part file uploads (PDF, images, proof documents)
func (h *APIHandler) UploadDocument(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file field is required"})
		return
	}
	defer file.Close()

	var ticketID *int
	ticketIDStr := c.Request.FormValue("ticket_id")
	if ticketIDStr != "" {
		if tid, err := strconv.Atoi(ticketIDStr); err == nil {
			ticketID = &tid
		}
	}

	uploadedBy := c.Request.FormValue("uploaded_by")
	if uploadedBy == "" {
		uploadedBy = "WEB_USER"
	}

	// Generate safe file name
	safeFileName := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(header.Filename))
	destinationPath := filepath.Join(h.uploadDir, safeFileName)

	out, err := os.Create(destinationPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file on disk"})
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to write file content"})
		return
	}

	doc := &domain.Document{
		TicketID:   ticketID,
		FileName:   header.Filename,
		FilePath:   "/uploads/" + safeFileName,
		MimeType:   header.Header.Get("Content-Type"),
		FileSize:   header.Size,
		UploadedBy: uploadedBy,
	}

	if err := h.ticketService.AttachDocument(doc); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register document record"})
		return
	}

	c.JSON(http.StatusCreated, doc)
}

// Inbound Messages Handlers (Omnichannel Viewer & Ticket Stager)

type InboundMessageInput struct {
	Platform        string `json:"platform" binding:"required"`
	SenderID        string `json:"sender_id" binding:"required"`
	SenderName      string `json:"sender_name"`
	RawMessage      string `json:"raw_message" binding:"required"`
	MediaType       string `json:"media_type"`
	MediaURL        string `json:"media_url"`
	OCRText         string `json:"ocr_text"`
	Classification  string `json:"classification"`
	ExtractedDoc    string `json:"extracted_doc"`
	ExtractedIntent string `json:"extracted_intent"`
	ExtractedTarget string `json:"extracted_target"`
}

type StageTicketFromMessageInput struct {
	DocumentNo    string `json:"document_no"`
	ProposedValue string `json:"proposed_value"`
	BranchID      *int   `json:"branch_id"`
}

func (h *APIHandler) ListInboundMessages(c *gin.Context) {
	platform := c.Query("platform")
	classification := c.Query("classification")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))

	msgs, err := h.inboundRepo.ListMessages(limit, platform, classification)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, msgs)
}

func (h *APIHandler) CreateInboundMessage(c *gin.Context) {
	var input InboundMessageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	combinedText := strings.TrimSpace(input.RawMessage + " " + input.OCRText)
	rawLower := strings.ToLower(combinedText)

	extractedDoc := input.ExtractedDoc
	extractedIntent := input.ExtractedIntent
	extractedTarget := input.ExtractedTarget
	classification := domain.MessageClassification(input.Classification)

	// 1. Auto-extract invoice document number from raw message or OCR if not provided
	if extractedDoc == "" {
		docRegex := regexp.MustCompile(`(?i)(?:INV|NOTA|FAKTUR)[-/][A-Za-z0-9\-/]+`)
		if match := docRegex.FindString(combinedText); match != "" {
			extractedDoc = match
		}
	}

	// 2. Check Learned Patterns first if classification or intent is unclassified
	if h.patternRepo != nil && (classification == "" || extractedIntent == "") {
		if patterns, err := h.patternRepo.ListPatterns(); err == nil {
			for _, pat := range patterns {
				if !pat.IsActive || pat.RegexPattern == "" {
					continue
				}
				rgx, err := regexp.Compile("(?i)" + pat.RegexPattern)
				if err != nil {
					continue
				}
				if rgx.MatchString(combinedText) {
					if classification == "" {
						classification = domain.MessageClassification(pat.Classification)
					}
					if extractedIntent == "" {
						extractedIntent = pat.TargetIntent
					}
					_ = h.patternRepo.IncrementMatched(pat.ID)
					break
				}
			}
		}
	}

	// 3. Fallback heuristic classification
	if classification == "" {
		if strings.Contains(rawLower, "inv/") || strings.Contains(rawLower, "inv-") || strings.Contains(rawLower, "nota/") {
			classification = domain.ClassActionable
		} else if strings.Contains(rawLower, "ubah") || strings.Contains(rawLower, "ganti") || strings.Contains(rawLower, "pt") || strings.Contains(rawLower, "cv") || strings.Contains(rawLower, "gambar") || strings.Contains(rawLower, "faktur") {
			classification = domain.ClassNeedsReview
		} else {
			classification = domain.ClassCasualBanter
		}
	}

	// 4. Auto-extract target mutation value if not provided
	if extractedTarget == "" {
		targetRegex := regexp.MustCompile(`(?i)(?:ke|menjadi|jadi)\s+((?:PT|CV)?\s*[A-Za-z0-9\s]{2,40}?)(?:\?|$|\.|\!|\n)`)
		if sub := targetRegex.FindStringSubmatch(combinedText); len(sub) > 1 {
			candidate := strings.TrimSpace(sub[1])
			if len(candidate) > 2 {
				extractedTarget = candidate
			}
		}
	}
	if extractedIntent == "" && (strings.Contains(rawLower, "ubah") || strings.Contains(rawLower, "ganti")) {
		extractedIntent = "UPDATE_CUSTOMER_NAME"
	}

	mediaType := input.MediaType
	if mediaType == "" {
		if input.MediaURL != "" {
			mediaType = "image"
		} else {
			mediaType = "text"
		}
	}

	msg := &domain.InboundMessage{
		Platform:        input.Platform,
		SenderID:        input.SenderID,
		SenderName:      input.SenderName,
		RawMessage:      input.RawMessage,
		MediaType:       mediaType,
		MediaURL:        input.MediaURL,
		OCRText:         input.OCRText,
		Classification:  classification,
		ExtractedDoc:    extractedDoc,
		ExtractedIntent: extractedIntent,
		ExtractedTarget: extractedTarget,
		CreatedAt:       time.Now(),
	}

	if err := h.inboundRepo.SaveMessage(msg); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if h.sseHub != nil {
		h.sseHub.Broadcast("inbound_message", msg)
	}

	c.JSON(http.StatusCreated, msg)
}

func (h *APIHandler) StageTicketFromMessage(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid message id"})
		return
	}

	var input StageTicketFromMessageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg, err := h.inboundRepo.GetMessageByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}

	proposedVal := input.ProposedValue
	if proposedVal == "" {
		proposedVal = msg.ExtractedTarget
	}
	if proposedVal == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "proposed_value is required (contoh: PT Baru)"})
		return
	}

	docNo := input.DocumentNo
	if docNo == "" {
		docNo = msg.ExtractedDoc
	}
	if docNo == "" {
		docRegex := regexp.MustCompile(`(?i)(?:INV|NOTA|FAKTUR)[-/][A-Za-z0-9\-/]+`)
		if match := docRegex.FindString(msg.OCRText + " " + msg.RawMessage); match != "" {
			docNo = match
		}
	}
	if docNo == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "document_no is required (contoh: INV/2026/001)"})
		return
	}

	intent := msg.ExtractedIntent
	if intent == "" {
		intent = "UPDATE_CUSTOMER_NAME"
	}

	ticketInput := domain.CreateTicketInput{
		RawMessage:      msg.RawMessage,
		ExtractedIntent: intent,
		DocumentNo:      docNo,
		FieldTarget:     "customer_name",
		ProposedValue:   proposedVal,
		BranchID:        input.BranchID,
		ConfidenceScore: 0.95,
	}

	ticket, err := h.ticketService.CreateTicketFromChat(ticketInput)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = h.inboundRepo.LinkTicket(msg.ID, ticket.ID, ticket.TicketNo)

	if h.sseHub != nil {
		msg.TicketID = &ticket.ID
		msg.TicketNo = ticket.TicketNo
		msg.Classification = domain.ClassActionable
		h.sseHub.Broadcast("inbound_message_updated", msg)
	}

	c.JSON(http.StatusCreated, ticket)
}

// ==========================================
// LEARNED PATTERNS (Self-Learning Loop)
// ==========================================

func (h *APIHandler) ListLearnedPatterns(c *gin.Context) {
	if h.patternRepo == nil {
		c.JSON(http.StatusOK, []domain.LearnedPattern{})
		return
	}
	patterns, err := h.patternRepo.ListPatterns()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, patterns)
}

type CreateLearnedPatternInput struct {
	PatternName    string  `json:"pattern_name" binding:"required"`
	ExamplePhrase  string  `json:"example_phrase" binding:"required"`
	RegexPattern   string  `json:"regex_pattern"`
	TargetIntent   string  `json:"target_intent"`
	Classification string  `json:"classification"`
	Confidence     float64 `json:"confidence"`
	LearnedBy      string  `json:"learned_by"`
}

func (h *APIHandler) CreateLearnedPattern(c *gin.Context) {
	if h.patternRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "pattern repository unavailable"})
		return
	}

	var input CreateLearnedPatternInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	regexPat := strings.TrimSpace(input.RegexPattern)
	if regexPat == "" {
		words := strings.Fields(strings.ToLower(input.ExamplePhrase))
		var keywords []string
		stopWords := map[string]bool{"ini": true, "itu": true, "ada": true, "dari": true, "dan": true, "yang": true, "bisa": true, "tolong": true, "kak": true, "gan": true}
		for _, w := range words {
			wClean := regexp.MustCompile(`[^a-z0-9]`).ReplaceAllString(w, "")
			if len(wClean) >= 3 && !stopWords[wClean] {
				keywords = append(keywords, regexp.QuoteMeta(wClean))
			}
		}
		if len(keywords) > 0 {
			regexPat = "(" + strings.Join(keywords, "|") + ")"
		} else {
			regexPat = regexp.QuoteMeta(input.ExamplePhrase)
		}
	}

	targetIntent := input.TargetIntent
	if targetIntent == "" {
		targetIntent = "UPDATE_CUSTOMER_NAME"
	}

	classification := input.Classification
	if classification == "" {
		classification = string(domain.ClassNeedsReview)
	}

	confidence := input.Confidence
	if confidence <= 0 {
		confidence = 0.95
	}

	learnedBy := input.LearnedBy
	if learnedBy == "" {
		learnedBy = "Supervisor (Chat Feedback)"
	}

	p := &domain.LearnedPattern{
		PatternName:    input.PatternName,
		ExamplePhrase:  input.ExamplePhrase,
		RegexPattern:   regexPat,
		TargetIntent:   targetIntent,
		Classification: classification,
		Confidence:     confidence,
		LearnedBy:      learnedBy,
		IsActive:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := h.patternRepo.CreatePattern(p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if h.sseHub != nil {
		h.sseHub.Broadcast("pattern_learned", p)
	}

	c.JSON(http.StatusCreated, p)
}

func (h *APIHandler) DeleteLearnedPattern(c *gin.Context) {
	if h.patternRepo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "pattern repository unavailable"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid pattern id"})
		return
	}

	if err := h.patternRepo.DeletePattern(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "pattern removed", "id": id})
}

