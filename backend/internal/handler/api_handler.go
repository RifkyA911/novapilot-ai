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
	"runtime"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type APIHandler struct {
	ticketService *service.TicketService
	invoiceRepo   domain.InvoiceRepository
	auditRepo     domain.AuditRepository
	uploadDir     string
	db            *sql.DB
	startTime     time.Time
}

func NewAPIHandler(
	ticketService *service.TicketService,
	invoiceRepo domain.InvoiceRepository,
	auditRepo domain.AuditRepository,
	uploadDir string,
	db *sql.DB,
) *APIHandler {
	_ = os.MkdirAll(uploadDir, 0755)
	return &APIHandler{
		ticketService: ticketService,
		invoiceRepo:   invoiceRepo,
		auditRepo:     auditRepo,
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
