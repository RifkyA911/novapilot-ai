package main

import (
	"log"
	"net/http"
	"novapilot-ai/backend/internal/handler"
	"novapilot-ai/backend/internal/repository/postgres"
	"novapilot-ai/backend/internal/service"
	"os"
	"path/filepath"

	"github.com/gin-contrib/cors"
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
	apiHandler := handler.NewAPIHandler(ticketService, repo, repo, uploadDir)

	// 4. Setup Gin HTTP Engine
	router := gin.Default()

	// CORS Configuration (Allow SvelteKit frontend on Bun)
	router.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Serve uploaded files statically
	router.Static("/uploads", uploadDir)

	// API Routes
	api := router.Group("/api")
	{
		api.GET("/health", apiHandler.HealthCheck)
		api.GET("/events", sseHub.HandleSSE)

		// Tickets
		api.GET("/tickets", apiHandler.ListTickets)
		api.GET("/tickets/:id", apiHandler.GetTicket)
		api.POST("/tickets", apiHandler.CreateTicket)
		api.POST("/tickets/:id/approve", apiHandler.ApproveTicket)
		api.POST("/tickets/:id/reject", apiHandler.RejectTicket)

		// Invoices & Audit
		api.GET("/invoices", apiHandler.ListInvoices)
		api.GET("/audit-logs", apiHandler.ListAuditLogs)

		// Document / Attachment File Upload
		api.POST("/upload", apiHandler.UploadDocument)
	}

	log.Printf("[NOVAPILOT] Core Backend running at http://0.0.0.0:%s", port)
	if err := router.Run(":" + port); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to run: %v", err)
	}
}
