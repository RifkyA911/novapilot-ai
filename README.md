# 🚀 NovaPilot AI
### *Autonomous ChatOps & Human-in-the-Loop Enterprise Database Gatekeeper*

---

## 📌 Executive Summary

**NovaPilot AI** is an enterprise-grade **Human-in-the-Loop IT Operations Copilot** designed to automate repetitive, off-hours technical requests (such as invoice amendments, customer master data updates, and operational tickets) originating from instant messaging channels (e.g. Regional Branch WhatsApp Groups).

The platform bridges the gap between unstructured branch conversations and mission-critical enterprise databases (**PostgreSQL 18** and **Oracle Database 11g**), while maintaining an absolute security invariant: **AI never executes mutative database queries (UPDATE/DELETE) without verified human authorization.**

---

## 🌟 Key Architecture & Value Proposition

- **1-Click On-Call Sign-Off:** Transforms late-night on-call duties from "open laptop, connect VPN, open DBeaver, type manual SQL" into a **single tap on your phone or laptop WebUI**.
- **Zero Raw Dynamic SQL:** All database mutations use parameterized prepared statements (`$1, $2` or `:1, :2`) within transaction blocks with automatic rollback on error.
- **Active Learning Agent Loop:** Manual corrections made by engineers in the WebUI are automatically persisted to `data/training/ground_truth.jsonl` and dynamically injected as few-shot prompts for future queries.
- **Custom Model Context Protocol (MCP) Server:** Standalone MCP server in [`mcp-server/`](./mcp-server) exposing database verification tools, factory SOP resources, and **multipart file upload support**.
- **Ultra-Lightweight SvelteKit 5 + Bun Frontend:** Consumes only ~30MB of RAM with native reactivity, Server-Sent Events (SSE) streaming, and high-contrast VibeUI styling.

---

## 🛠️ Technology Stack

- **Backend Core:** Go (Golang) 1.22+
  - Clean Architecture: `domain`, `repository`, `service`, `handler`
  - High-performance REST engine & Server-Sent Events (SSE) hub
  - Database support: PostgreSQL 18 (Local Prototyping) & Oracle 11g (Factory Production)
- **Frontend WebUI:** SvelteKit 5 + Bun Runtime + Tailwind CSS + shadcn-svelte + VibeUI aesthetics
  - Authentication: **Better Auth** with Google OAuth and internal credential support
  - Real-time updates: Native EventSource (SSE) stream
  - Responsive: Optimized for desktop workstations and smartphone browsers via internal LAN Wi-Fi
- **Custom MCP Server:** TypeScript + Bun using `@modelcontextprotocol/sdk`
  - Domain Tools: `check_invoice`, `stage_invoice_update`, `upload_document`, `list_pending_tickets`
  - Knowledge Resources: `novapilot://sop/factory-rules`, `novapilot://branches/directory`
- **Developer Tooling:** Integrated with **Context7 MCP** for live documentation lookups

---

## 📁 Project Documentation (`/docs`)

All architectural specifications, security rules, and implementation blueprints are available in English in [**`/docs`**](./docs):

1. [**`docs/PRD.md`**](./docs/PRD.md) — Product Requirements Document, Persona Analysis, and Functional Specs.
2. [**`docs/ARCHITECTURE.md`**](./docs/ARCHITECTURE.md) — System Architecture, Sequence Diagrams, and State Machine.
3. [**`docs/SECURITY_AND_COMPLIANCE.md`**](./docs/SECURITY_AND_COMPLIANCE.md) — WhatsApp ToS Compliance, Anti-Ban Mitigation, and NDA Sanitization.
4. [**`docs/ROADMAP.md`**](./docs/ROADMAP.md) — Phased Implementation Sprints (Phases 1 through 5).
5. [**`docs/TESTING.md`**](./docs/TESTING.md) — Testing Pyramid: Go Unit Tests, Mock SQL, AI Accuracy Benchmarks, and E2E Tests.
6. [**`docs/AI_SPECIFICATION_AND_TRAINING.md`**](./docs/AI_SPECIFICATION_AND_TRAINING.md) — Supported AI Models, Hyperparameters, and Active Learning Loop.
7. [**`docs/WHATSAPP_GATEWAY_TUTORIAL.md`**](./docs/WHATSAPP_GATEWAY_TUTORIAL.md) — Complete Step-by-Step Guide for WhatsApp Baileys Gateway & Group Extractor.
8. [**`AGENT.md`**](./AGENT.md) — Official Agent Instructions and Coding Guidelines.
9. [**`CLAUDE.md`**](./CLAUDE.md) — Quick CLI Commands and Developer Reference.

---

## 🚀 Quickstart Guide

### 1. Clone & Setup Configuration
```bash
git clone https://github.com/<your-username>/novapilot-ai.git
cd novapilot-ai

# Copy environment template
cp .env.example .env
```

### 2. Seed Local PostgreSQL Database
```bash
bun run seed:db
```

### 3. Start Backend Server (Go)
```bash
bun run dev:backend
# Core API running at http://0.0.0.0:8080
```

### 4. Start WebUI Dashboard (SvelteKit + Bun)
```bash
bun run dev:frontend
# Access dashboard at http://localhost:3000
```

### 5. Start Custom MCP Server (Optional)
```bash
bun run dev:mcp
```
