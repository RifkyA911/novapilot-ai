package main

import (
	"log"
	"net/http"
	"novapilot-ai/backend/internal/handler"
	"novapilot-ai/backend/internal/llm"
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
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8088"
	}

	pgHost := os.Getenv("SYSTEM_DB_HOST")
	if pgHost == "" {
		pgHost = os.Getenv("POSTGRES_HOST")
	}
	if pgHost == "" {
		pgHost = "localhost"
	}
	pgPort := os.Getenv("SYSTEM_DB_PORT")
	if pgPort == "" {
		pgPort = os.Getenv("POSTGRES_PORT")
	}
	if pgPort == "" {
		pgPort = "5432"
	}
	pgUser := os.Getenv("SYSTEM_DB_USER")
	if pgUser == "" {
		pgUser = os.Getenv("POSTGRES_USER")
	}
	if pgUser == "" {
		pgUser = "postgres"
	}
	pgPass := os.Getenv("SYSTEM_DB_PASSWORD")
	if pgPass == "" {
		pgPass = os.Getenv("POSTGRES_PASSWORD")
	}
	if pgPass == "" {
		pgPass = "postgres"
	}
	pgDB := os.Getenv("SYSTEM_DB_NAME")
	if pgDB == "" {
		pgDB = os.Getenv("POSTGRES_DB")
	}
	if pgDB == "" {
		pgDB = "novapilot_db"
	}
	sslMode := os.Getenv("SYSTEM_DB_SSLMODE")
	if sslMode == "" {
		sslMode = os.Getenv("POSTGRES_SSLMODE")
	}
	if sslMode == "" {
		sslMode = "disable"
	}

	// 2. Initialize Database Connection (System Database 1)
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
	apiHandler := handler.NewAPIHandler(ticketService, repo, repo, repo, repo, repo, sseHub, uploadDir, db)
	hermesAdapter := llm.NewHermesAdapter(llm.DefaultConfig())
	apiHandler.SetHermesAdapter(hermesAdapter)

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

		// Whitelisted Channels & Contact Directory
		api.GET("/channels", apiHandler.ListChannels)
		api.POST("/channels", apiHandler.CreateChannel)
		api.DELETE("/channels/:id", apiHandler.DeleteChannel)
		api.PATCH("/channels/:id/toggle-whitelist", apiHandler.ToggleChannelWhitelist)

		// Omnichannel Webhooks
		api.POST("/webhooks/telegram", apiHandler.HandleTelegramWebhook)
		api.POST("/webhooks/discord", apiHandler.HandleDiscordWebhook)

		// Learned Patterns (Self-Learning Loop)
		api.GET("/learned-patterns", apiHandler.ListLearnedPatterns)
		api.POST("/learned-patterns", apiHandler.CreateLearnedPattern)
		api.DELETE("/learned-patterns/:id", apiHandler.DeleteLearnedPattern)

		// Invoices & Audit
		api.GET("/invoices", apiHandler.ListInvoices)
		api.GET("/audit-logs", apiHandler.ListAuditLogs)

		// Document / Attachment File Upload & Storage Management
		api.POST("/upload", apiHandler.UploadDocument)
		api.GET("/storage/config", apiHandler.GetStorageConfig)
		api.POST("/storage/config", apiHandler.UpdateStorageConfig)
		api.POST("/storage/test", apiHandler.TestStorageConnection)

		// Database Configuration & Connectivity
		api.GET("/database/config", apiHandler.GetDatabaseConfig)
		api.POST("/database/test", apiHandler.TestDatabaseConnection)
		api.POST("/database/apply", apiHandler.ApplyDatabaseConfig)

		// MCP Tool Catalog & Manifest Upload
		api.GET("/mcp/tools", apiHandler.ListMCPTools)
		api.POST("/mcp/tools", apiHandler.UploadMCPTool)
		api.POST("/mcp/test", apiHandler.ExecuteMCPToolTest)

		// Hermes 3 Agentic LLM Engine
		api.GET("/llm/config", apiHandler.GetLLMConfig)
		api.POST("/llm/config", apiHandler.UpdateLLMConfig)
		api.POST("/llm/process", apiHandler.ProcessLLMMessage)

		// WhatsApp Gateway Lifecycle Management (:3002)
		api.GET("/gateway/status", apiHandler.GetGatewayStatus)
		api.POST("/gateway/start", apiHandler.StartGateway)
		api.POST("/gateway/restart", apiHandler.RestartGateway)
		api.POST("/gateway/stop", apiHandler.StopGateway)
		api.POST("/gateway/send", apiHandler.SendGatewayMessage)
	}

	// 5. Connect MCP Reference Database (Database 2 - Enterprise ERP Source)
	mcpHost := os.Getenv("MCP_REF_DB_HOST")
	if mcpHost == "" {
		mcpHost = "localhost"
	}
	mcpPort := os.Getenv("MCP_REF_DB_PORT")
	if mcpPort == "" {
		mcpPort = "5432"
	}
	mcpUser := os.Getenv("MCP_REF_DB_USER")
	if mcpUser == "" {
		mcpUser = "postgres"
	}
	mcpPass := os.Getenv("MCP_REF_DB_PASSWORD")
	if mcpPass == "" {
		mcpPass = "postgres"
	}
	mcpDBName := os.Getenv("MCP_REF_DB_NAME")
	if mcpDBName == "" {
		mcpDBName = "novapilot_mcp_ref"
	}
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
