# 🗺️ Implementation Roadmap — NovaPilot AI

---

## 📅 Structured Phased Execution Plan (Sprint Slices)

```
[ Phase 1: Core Clean Architecture & Local Prototyping ]
                           │
                           ▼
[ Phase 2: SvelteKit 5 + Better Auth & VibeUI Dashboard ]
                           │
                           ▼
[ Phase 3: PostgreSQL 18 Local & Oracle 11g Enterprise Adapter ]
                           │
                           ▼
[ Phase 4: Custom MCP Server with File Upload & SOP Knowledge ]
                           │
                           ▼
[ Phase 5: Production Hardening, Live Pilot & Portfolio Showcase ]
```

---

### 🟢 Phase 1: Core Clean Architecture & Local Prototyping
> **Focus:** Establish clean Domain-Driven Architecture in Golang with deterministic AI schema parsers and mock state repositories.

- [x] Initialize Git repository with cross-platform `.gitattributes` and security `.gitignore`.
- [x] Build Clean Architecture folders in Go (`domain`, `repository`, `service`, `handler`).
- [x] Implement structured AI output schemas for chat entity extraction.
- [x] Configure Gin REST API and real-time Server-Sent Events (SSE) hub.
- [x] Implement automated PostgreSQL migration and dummy seed runner (`cmd/seed/main.go`).

---

### 🔵 Phase 2: SvelteKit 5 + Better Auth & VibeUI Dashboard
> **Focus:** Build a modern, reactive on-call approval cockpit following VibeUI and shadcn design standards.

- [x] Scaffold SvelteKit 5 with Bun runtime, Tailwind CSS, and Lucide icons.
- [x] Integrate **Better Auth** with Google OAuth social provider and internal credentials.
- [x] Develop high-contrast Side-by-Side Diff cards for invoice revisions.
- [x] Build modal dialogs for request approvals and policy rejection reason tracking.
- [x] Verify zero TypeScript errors via `svelte-check` and bundle production build.

---

### 🟡 Phase 3: Database Engine & Transaction Safety
> **Focus:** Provide seamless dual database support (PostgreSQL for prototyping, Oracle 11g for enterprise plants).

- [x] PostgreSQL 18 connection pool adapter with prepared statements (`$1, $2`).
- [x] Pre-check verification logic (check existence, closing dates, and posted state).
- [x] Oracle 11g adapter architecture utilizing `TNS_ADMIN` and Instant Client.
- [x] Transaction isolation with automatic rollback on database timeouts.

---

### 🟣 Phase 4: Custom MCP Server & File Uploads
> **Focus:** Implement a dedicated Model Context Protocol server exposing tools, knowledge, and document uploads.

- [x] Build `@modelcontextprotocol/sdk` server in TypeScript with Bun.
- [x] Expose tools: `check_invoice`, `stage_invoice_update`, `upload_document`, `list_pending_tickets`.
- [x] Expose resources: `novapilot://sop/factory-rules` and `novapilot://branches/directory`.
- [x] Implement multipart document attachment handling (PDF, photo receipts).

---

### 🏆 Phase 5: Production Hardening & Portfolio Polish
> **Focus:** Package the repository as a flagship GitHub portfolio project and deploy to plant on-call laptops.

- [x] Translate all documentation, comments, and UI text to 100% monolingual English.
- [x] Settle on VibeUI aesthetic for landing, authentication, and dashboard screens.
- [ ] Record interactive walkthrough GIF demonstrating real-time chat ingestion to approval.
- [ ] Publish case study: *"Reducing On-Call Ticket Resolution from 15 Minutes to 30 Seconds with Gated Human Approval."*
