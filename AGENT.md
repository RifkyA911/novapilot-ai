# 🤖 AGENT.md — Developer & AI Agent Guidelines for NovaPilot AI

---

## 1. Project Overview & Vision
**NovaPilot AI** is an enterprise-grade, Human-in-the-Loop ChatOps and Database Gatekeeper designed for IT on-call engineers. It ingests unorganized branch communication (such as WhatsApp group messages), extracts operational requests using structured LLM outputs, pre-validates against enterprise databases, stages changes in an approval queue, and enforces human sign-off before executing parameterized mutations.

### Dual Purpose:
1. **Internal Factory Production Utility:** Runs securely within private LAN/intranet networks, executing safe mutations on production databases (Oracle 11g / PostgreSQL).
2. **Flagship GitHub Open-Source Portfolio:** Showcases clean architecture in Golang, modern frontend engineering with SvelteKit 5 + Bun, custom Model Context Protocol (MCP) servers, robust testing suites, and safe AI agent workflows.

---

## 2. Core Architecture & Tech Stack
- **Default Language:** English (all code, comments, documentation, commit messages, and UI text).
- **Backend:** Golang 1.22+ (`/backend`)
  - Clean Architecture: `internal/domain`, `internal/service`, `internal/repository`, `internal/handler`.
  - Database Support: PostgreSQL (default local prototyping) + Oracle 11g Adapter (enterprise production).
  - Concurrency: Goroutine worker channels for asynchronous chat message processing.
- **Frontend:** SvelteKit + Bun Runtime + Tailwind CSS + shadcn-svelte (`/frontend`)
  - Key Routes:
    - `/` — Modern enterprise landing page.
    - `/auth/login`, `/auth/register`, `/auth/callback` — Authentication flow via **Better Auth** with Google OAuth and email/password support.
    - `/dashboard` — Real-time on-call ticket queue with side-by-side diffs, one-click approvals, and audit trails.
- **Custom MCP Server:** (`/mcp-server`)
  - Implements Model Context Protocol for AI agents.
  - Exposes domain tools: `check_invoice`, `stage_invoice_update`, `upload_document` (file uploads for PDF/invoice image attachments), and `get_sop_knowledge`.
- **Database Engine for Local Prototyping:** PostgreSQL 18 (with automated seeding and migration scripts).

---

## 3. Strict Development Rules for Agents

### 3.1 Security & Database Safety Rules
- **Rule 1 (Zero Raw SQL):** NEVER write concatenated string queries for SQL mutations. Always use parameterized queries / prepared statements (`$1, $2` in Postgres, `:1, :2` in Oracle).
- **Rule 2 (No Unchecked Autonomous Mutations):** Direct execution of `UPDATE` or `DELETE` without human approval in the state machine is strictly forbidden.
- **Rule 3 (Zero Secret Leakage):** Never hardcode connection strings, database credentials, or API keys. Always read from environment variables via `.env`.

### 3.2 Frontend & UI Standards
- Follow the **shadcn-svelte** design aesthetic: high-contrast dark/light mode, clean typography, neutral zinc/slate palette, accessible modals, and micro-animations.
- Use **Server-Sent Events (SSE)** for real-time ticket streaming rather than heavy full-page reloads.

### 3.3 Context7 MCP Usage
- When researching dependencies, framework updates, or official SDK docs, leverage the `context7` MCP tools:
  - `resolve-library-id`: to lookup correct library IDs.
  - `query-docs`: to retrieve up-to-date documentation for Go, SvelteKit, Bun, and Better Auth.

---

## 4. Directory Structure Map

```
novapilot-ai/
├── .env.example              # Environment variable template
├── .gitattributes            # Cross-platform line-ending normalization
├── .gitignore                # Security-focused git ignore patterns
├── README.md                 # English repository showcase & setup guide
├── AGENT.md                  # This agent guidance document
├── CLAUDE.md                 # Claude Code & CLI reference guide
├── docs/                     # Technical specifications & architecture
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY_AND_COMPLIANCE.md
│   ├── ROADMAP.md
│   ├── TESTING.md
│   └── AI_SPECIFICATION_AND_TRAINING.md
├── backend/                  # Golang Clean Architecture server
│   ├── cmd/server/
│   ├── internal/
│   │   ├── domain/
│   │   ├── repository/
│   │   ├── service/
│   │   └── handler/
│   └── scripts/mock_db/      # PostgreSQL seed & schema scripts
├── frontend/                 # SvelteKit + Bun + Tailwind + shadcn-svelte
│   └── src/
│       ├── routes/
│       │   ├── +page.svelte           # Landing Page (/)
│       │   ├── auth/                  # Better Auth routes (/auth/*)
│       │   └── dashboard/             # Approval Dashboard (/dashboard)
│       └── lib/
└── mcp-server/               # Custom MCP Server (Tools & File Upload)
```
