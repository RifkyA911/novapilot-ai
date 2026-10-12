# 🧭 CLAUDE.md — Claude Code & AI Coding Guidelines for NovaPilot AI

---

## 1. Quick Reference & Commands

### Backend (Golang)
```bash
# Navigate to backend
cd backend

# Download dependencies
go mod download
go mod tidy

# Run server
go run cmd/server/main.go

# Run all unit tests with race detection & coverage
go test -v -race -cover ./...

# Seed local PostgreSQL database
go run cmd/seed/main.go
```

### Frontend (SvelteKit + Bun)
```bash
# Navigate to frontend
cd frontend

# Install dependencies using Bun
bun install

# Run dev server
bun run dev --host 0.0.0.0

# Build for production
bun run build

# Run frontend tests
bun run test
```

### Custom MCP Server
```bash
cd mcp-server
bun install
bun run start
```

---

## 2. Code Conventions & Standards

### Golang
- Follow idiomatic Go conventions (`golangci-lint` clean).
- Package organization must adhere to Clean Architecture:
  - `domain`: Pure structs, interfaces, domain errors. No external database or network imports.
  - `repository`: Implementation of domain interfaces (PostgreSQL / Oracle).
  - `service`: Business logic, ticket orchestration, AI parsing invocation.
  - `handler`: HTTP transport, JSON serialization, SSE stream publishers.
- Errors must be wrapped with context: `fmt.Errorf("failed to execute invoice precheck: %w", err)`.
- All database mutations must be executed within transactional blocks with prepared statements.

### SvelteKit & Frontend
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) wherever applicable.
- Styling must use Tailwind CSS utility classes aligned with **shadcn-svelte** tokens (`bg-background`, `text-foreground`, `border-border`, etc.).
- Responsive design is mandatory: mobile view (375px–430px) for smartphone approval on factory Wi-Fi, desktop view for on-call laptops.

### Internationalization & Language
- Default project language: **English** across all files, code comments, UI labels, API responses, and Git commit messages.

---

## 3. Security Checkpoints
- Prior to committing any code:
  1. Verify `.env` is never staged or committed.
  2. Confirm no factory IP addresses, internal domains, or private credentials exist in test files.
  3. Ensure all user inputs from chat or web are sanitized and validated against schemas.
