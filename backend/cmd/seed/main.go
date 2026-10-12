package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Try loading root or local .env
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load(".env")

	host := os.Getenv("POSTGRES_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("POSTGRES_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("POSTGRES_USER")
	if user == "" {
		user = "postgres"
	}
	password := os.Getenv("POSTGRES_PASSWORD")
	if password == "" {
		password = "postgres"
	}
	dbname := os.Getenv("POSTGRES_DB")
	if dbname == "" {
		dbname = "postgres" // Default db to connect or create novapilot_db
	}
	sslmode := os.Getenv("POSTGRES_SSLMODE")
	if sslmode == "" {
		sslmode = "disable"
	}

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode)

	log.Printf("[SEEDER] Connecting to PostgreSQL at %s:%s (db: %s, user: %s)...", host, port, dbname, user)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("[SEEDER] Failed to open database handle: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Printf("[SEEDER] Warning: Unable to connect to PostgreSQL with credentials (%v)", err)
		log.Println("[SEEDER] Please ensure PostgreSQL is running and credentials in .env are correct.")
		return
	}

	log.Println("[SEEDER] Successfully connected to PostgreSQL!")

	// Execute Schema SQL
	schemaPath := filepath.Join("scripts", "mock_db", "01_schema.sql")
	schemaSQL, err := os.ReadFile(schemaPath)
	if err != nil {
		// Fallback for running from different directories
		schemaPath = filepath.Join("backend", "scripts", "mock_db", "01_schema.sql")
		schemaSQL, err = os.ReadFile(schemaPath)
		if err != nil {
			log.Fatalf("[SEEDER] Error reading schema SQL: %v", err)
		}
	}

	log.Println("[SEEDER] Applying 01_schema.sql...")
	if _, err := db.Exec(string(schemaSQL)); err != nil {
		log.Fatalf("[SEEDER] Failed to execute schema: %v", err)
	}

	// Execute Seed SQL
	seedPath := filepath.Join("scripts", "mock_db", "02_seed.sql")
	seedSQL, err := os.ReadFile(seedPath)
	if err != nil {
		seedPath = filepath.Join("backend", "scripts", "mock_db", "02_seed.sql")
		seedSQL, err = os.ReadFile(seedPath)
		if err != nil {
			log.Fatalf("[SEEDER] Error reading seed SQL: %v", err)
		}
	}

	log.Println("[SEEDER] Applying 02_seed.sql...")
	if _, err := db.Exec(string(seedSQL)); err != nil {
		log.Fatalf("[SEEDER] Failed to execute seed data: %v", err)
	}

	log.Println("[SEEDER] ✅ Database schema and dummy seed data successfully applied!")
}
