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

func runSQLFile(db *sql.DB, path string) error {
	content, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("reading file %s: %w", path, err)
	}
	if _, err := db.Exec(string(content)); err != nil {
		return fmt.Errorf("executing SQL in %s: %w", path, err)
	}
	return nil
}

func findScriptPath(filename string) string {
	candidates := []string{
		filepath.Join("scripts", "mock_db", filename),
		filepath.Join("backend", "scripts", "mock_db", filename),
		filepath.Join("..", "scripts", "mock_db", filename),
		filepath.Join("..", "backend", "scripts", "mock_db", filename),
	}
	for _, p := range candidates {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return filepath.Join("scripts", "mock_db", filename)
}

func main() {
	// Try loading root or local .env
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	host := os.Getenv("SYSTEM_DB_HOST")
	if host == "" {
		host = os.Getenv("POSTGRES_HOST")
	}
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("SYSTEM_DB_PORT")
	if port == "" {
		port = os.Getenv("POSTGRES_PORT")
	}
	if port == "" {
		port = "5432"
	}

	user := os.Getenv("SYSTEM_DB_USER")
	if user == "" {
		user = os.Getenv("POSTGRES_USER")
	}
	if user == "" {
		user = "postgres"
	}

	password := os.Getenv("SYSTEM_DB_PASSWORD")
	if password == "" {
		password = os.Getenv("POSTGRES_PASSWORD")
	}
	if password == "" {
		password = "postgres"
	}

	sysDBName := os.Getenv("SYSTEM_DB_NAME")
	if sysDBName == "" {
		sysDBName = os.Getenv("POSTGRES_DB")
	}
	if sysDBName == "" {
		sysDBName = "novapilot_db"
	}

	mcpDBName := os.Getenv("MCP_REF_DB_NAME")
	if mcpDBName == "" {
		mcpDBName = "novapilot_mcp_ref"
	}

	sslmode := os.Getenv("SYSTEM_DB_SSLMODE")
	if sslmode == "" {
		sslmode = os.Getenv("POSTGRES_SSLMODE")
	}
	if sslmode == "" {
		sslmode = "disable"
	}

	// =========================================================================
	// 1. SEED SYSTEM DATABASE (novapilot_db)
	// =========================================================================
	sysConnStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, sysDBName, sslmode)

	log.Printf("[SEEDER] Connecting to System Database 1 at %s:%s (db: %s, user: %s)...", host, port, sysDBName, user)
	sysDB, err := sql.Open("postgres", sysConnStr)
	if err != nil {
		log.Fatalf("[SEEDER] Failed to open System DB handle: %v", err)
	}
	defer sysDB.Close()

	if err := sysDB.Ping(); err != nil {
		log.Fatalf("[SEEDER] Error connecting to System DB %s: %v", sysDBName, err)
	}
	log.Printf("[SEEDER] Connected to System DB: %s", sysDBName)

	sysScripts := []string{
		"01_schema.sql",
		"02_seed.sql",
		"03_learned_patterns.sql",
		"05_sales_orders_table.sql",
		"06_channels_table.sql",
	}

	for _, s := range sysScripts {
		p := findScriptPath(s)
		log.Printf("[SEEDER DB1] Applying %s (%s)...", s, p)
		if err := runSQLFile(sysDB, p); err != nil {
			log.Fatalf("[SEEDER DB1] Failed on %s: %v", s, err)
		}
	}
	log.Printf("[SEEDER DB1] Successfully migrated and seeded %s!", sysDBName)

	// =========================================================================
	// 2. SEED MCP REFERENCE DATABASE (novapilot_mcp_ref)
	// =========================================================================
	mcpConnStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, mcpDBName, sslmode)

	log.Printf("[SEEDER] Connecting to MCP Reference Database 2 at %s:%s (db: %s)...", host, port, mcpDBName)
	mcpDB, err := sql.Open("postgres", mcpConnStr)
	if err != nil {
		log.Fatalf("[SEEDER] Failed to open MCP DB handle: %v", err)
	}
	defer mcpDB.Close()

	if err := mcpDB.Ping(); err != nil {
		log.Fatalf("[SEEDER] Error connecting to MCP DB %s: %v", mcpDBName, err)
	}
	log.Printf("[SEEDER] Connected to MCP DB: %s", mcpDBName)

	mcpScripts := []string{
		"04_mcp_reference_db.sql",
		"05_sales_orders_table.sql",
	}

	for _, s := range mcpScripts {
		p := findScriptPath(s)
		log.Printf("[SEEDER DB2] Applying %s (%s)...", s, p)
		if err := runSQLFile(mcpDB, p); err != nil {
			log.Fatalf("[SEEDER DB2] Failed on %s: %v", s, err)
		}
	}
	log.Printf("[SEEDER DB2] Successfully migrated and seeded %s!", mcpDBName)

	log.Println("[SEEDER] ALL DUAL-DATABASES SUCCESSFULLY MIGRATED AND SEEDED! 🚀")
}
