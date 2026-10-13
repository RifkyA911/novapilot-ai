# Contributing to NovaPilot AI

Thank you for your interest in contributing to **NovaPilot AI**! We welcome bug reports, feature suggestions, architectural improvements, and code contributions from engineers and researchers worldwide.

---

## 1. Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please treat all contributors with respect and professionalism.

---

## 2. Core Architectural Principles to Respect

Before proposing any code changes, ensure your modifications adhere to the fundamental security invariants of NovaPilot AI:
1. **Zero Raw SQL Invariant:**
   - ChatOps, LLM prompt responses, and webhook handlers must **NEVER** construct raw, unparameterized SQL queries against enterprise databases.
   - All mutations to **Database 2 (Enterprise ERP / Oracle / SAP)** must pass exclusively through Model Context Protocol (MCP) tool schemas.
2. **Dual-Database Boundary:**
   - **Database 1 (System Operational Store - PostgreSQL 18 Local :5432):** Houses raw omnichannel ingress staging (`inbound_messages`), ticket approval state machine (`tickets`), immutable audit trails (`audit_logs`), and active learning weights (`learned_patterns`).
   - **Database 2 (Enterprise Business Data Source):** Enterprise production database holding official financial ledgers and customer master records.
3. **Mandatory Human-in-the-Loop:**
   - High-impact database mutations (UPDATE, DELETE, payment confirmations) **MUST ALWAYS** require explicit cryptographic or web-session sign-off by on-call personnel before invocation of MCP mutation tools.

---

## 3. Development Workflow

### Prerequisites
- **Go 1.22+** (Backend Core)
- **Bun 1.1+** (Frontend & WhatsApp Gateway)
- **Node.js 20+** (Optional runtime)
- **PostgreSQL 18** (Local database instance on port `5432`)
- **Git**

### Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/RifkyA911/novapilot-ai.git
   cd novapilot-ai
   ```
2. Setup PostgreSQL database:
   ```bash
   psql -U postgres -h 127.0.0.1 -p 5432 -c "CREATE DATABASE novapilot_db;"
   psql -U postgres -h 127.0.0.1 -p 5432 -d novapilot_db -f backend/scripts/mock_db/01_schema.sql
   psql -U postgres -h 127.0.0.1 -p 5432 -d novapilot_db -f backend/scripts/mock_db/02_test_data.sql
   psql -U postgres -h 127.0.0.1 -p 5432 -d novapilot_db -f backend/scripts/mock_db/03_learned_patterns.sql
   ```
3. Run the Go Backend (:8088):
   ```bash
   cd backend
   go run ./cmd/server
   ```
4. Run the SvelteKit 5 Frontend (:3000):
   ```bash
   cd frontend
   bun install
   bun run dev
   ```
5. (Optional) Run the WhatsApp Gateway (:3002):
   ```bash
   cd whatsapp-gateway
   bun install
   bun run src/index.ts
   ```

---

## 4. Submitting Pull Requests

1. **Create a topic branch:**
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```
2. **Verify code quality:**
   - In `frontend/`: run `bun run check` to ensure zero SvelteKit/TypeScript errors.
   - In `backend/`: run `go test ./...` and `go vet ./...`.
3. **Commit your changes:**
   Follow Conventional Commits:
   - `feat: add telegram webhook batch processor`
   - `fix: resolve sse reconnect buffer drop in cockpit`
   - `docs: update dual-db mcp architecture specification`
4. **Push and Open a PR:**
   - Push to your fork or branch and submit a Pull Request to `main`.
   - Provide clear reproduction steps or screenshots for UI changes.

---

## 5. Security Vulnerabilities

If you discover a security vulnerability, please **DO NOT** open a public issue. Disclose responsibly by contacting the maintainers directly or opening a private security advisory on GitHub.
