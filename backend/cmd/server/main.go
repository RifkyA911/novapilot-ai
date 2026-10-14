package main

import (
	"log"
	"net/http"
	"novapilot-ai/backend/internal/handler"
	"novapilot-ai/backend/internal/repository/postgres"
	"novapilot-ai/backend/internal/service"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 1. Load Environment Configuration
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load(".env")

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8088"
	}

	pgHost := os.Getenv("POSTGRES_HOST")
	if pgHost == "" {
		pgHost = "localhost"
	}
	pgPort := os.Getenv("POSTGRES_PORT")
	if pgPort == "" {
		pgPort = "5432"
	}
	pgUser := os.Getenv("POSTGRES_USER")
	if pgUser == "" {
		pgUser = "postgres"
	}
	pgPass := os.Getenv("POSTGRES_PASSWORD")
	if pgPass == "" {
		pgPass = "postgres"
	}
	pgDB := os.Getenv("POSTGRES_DB")
	if pgDB == "" {
		pgDB = "postgres"
	}
	sslMode := os.Getenv("POSTGRES_SSLMODE")
	if sslMode == "" {
		sslMode = "disable"
	}

	// 2. Initialize Database Connection
	db, err := postgres.NewConnection(postgres.Config{
		Host:     pgHost,
		Port:     pgPort,
		User:     pgUser,
		Password: pgPass,
		DBName:   pgDB,
		SSLMode:  sslMode,
	})
	if err != nil {
		log.Printf("[WARNING] PostgreSQL connection error: %v", err)
		log.Println("[INFO] Backend will start, but database operations may fail until DB is seeded.")
	}

	// 3. Initialize Repositories & Services
	repo := postgres.NewRepository(db)
	sseHub := handler.NewSSEHub()
	ticketService := service.NewTicketService(repo, repo, repo, repo, sseHub)

	uploadDir := filepath.Join("..", "uploads")
	if _, err := os.Stat("uploads"); err == nil {
		uploadDir = "uploads"
	}
	apiHandler := handler.NewAPIHandler(ticketService, repo, repo, repo, repo, sseHub, uploadDir, db)

	// 4. Setup Gin HTTP Engine
	router := gin.Default()

	// CORS Configuration (Allow SvelteKit frontend on Bun)
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Serve uploaded files statically
	router.Static("/uploads", uploadDir)

	// API Routes
	api := router.Group("/api")
	{
		api.GET("/health", apiHandler.HealthCheck)
		api.GET("/telemetry", apiHandler.GetTelemetry)
		api.GET("/events", sseHub.HandleSSE)

		// Tickets
		api.GET("/tickets", apiHandler.ListTickets)
		api.GET("/tickets/:id", apiHandler.GetTicket)
		api.POST("/tickets", apiHandler.CreateTicket)
		api.POST("/tickets/:id/approve", apiHandler.ApproveTicket)
		api.POST("/tickets/:id/reject", apiHandler.RejectTicket)

		// Inbound Messages & Omnichannel Feed
		api.GET("/inbound-messages", apiHandler.ListInboundMessages)
		api.POST("/inbound-messages", apiHandler.CreateInboundMessage)
		api.POST("/inbound-messages/:id/stage-ticket", apiHandler.StageTicketFromMessage)

		// Learned Patterns (Self-Learning Loop)
		api.GET("/learned-patterns", apiHandler.ListLearnedPatterns)
		api.POST("/learned-patterns", apiHandler.CreateLearnedPattern)
		api.DELETE("/learned-patterns/:id", apiHandler.DeleteLearnedPattern)

		// Invoices & Audit
		api.GET("/invoices", apiHandler.ListInvoices)
		api.GET("/audit-logs", apiHandler.ListAuditLogs)

		// Document / Attachment File Upload
		api.POST("/upload", apiHandler.UploadDocument)

		// Database Configuration & Connectivity
		api.GET("/database/config", apiHandler.GetDatabaseConfig)
		api.POST("/database/test", apiHandler.TestDatabaseConnection)

		// MCP Tool Catalog & Manifest Upload
		api.GET("/mcp/tools", apiHandler.ListMCPTools)
		api.POST("/mcp/tools", apiHandler.UploadMCPTool)
		api.POST("/mcp/test", apiHandler.ExecuteMCPToolTest)
	}

	// Optional: Connect MCP Reference Database if distinct configuration provided
	mcpHost := os.Getenv("MCP_REF_DB_HOST")
	mcpPort := os.Getenv("MCP_REF_DB_PORT")
	mcpUser := os.Getenv("MCP_REF_DB_USER")
	mcpPass := os.Getenv("MCP_REF_DB_PASSWORD")
	mcpDBName := os.Getenv("MCP_REF_DB_NAME")
	mcpSSL := os.Getenv("MCP_REF_DB_SSLMODE")
	if mcpSSL == "" {
		mcpSSL = "disable"
	}

	if mcpHost != "" && mcpDBName != "" {
		mcpDB, err := postgres.NewConnection(postgres.Config{
			Host:     mcpHost,
			Port:     mcpPort,
			User:     mcpUser,
			Password: mcpPass,
			DBName:   mcpDBName,
			SSLMode:  mcpSSL,
		})
		if err == nil {
			apiHandler.SetMCPRefDB(mcpDB)
			log.Printf("[MCP-DB] Connected to MCP Reference Database at %s:%s/%s", mcpHost, mcpPort, mcpDBName)
		} else {
			log.Printf("[MCP-DB] Standby (could not auto-connect: %v)", err)
		}
	}

	log.Printf("[NOVAPILOT] Core Backend running at http://0.0.0.0:%s", port)
	if err := router.Run(":" + port); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to run: %v", err)
	}
}
