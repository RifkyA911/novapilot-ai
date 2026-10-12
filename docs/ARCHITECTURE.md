# 🏛️ System Architecture & Technical Design — NovaPilot AI

---

## 1. High-Level Architecture Overview

NovaPilot AI adopts a **Decoupled Micro-Component Architecture** separating chat ingestion, AI orchestration, human sign-off gates, and transactional database executors.

```mermaid
flowchart TB
    subgraph ExternalChannels ["📡 WhatsApp Branch Channels"]
        WA1["East Java Branch Group"]
        WA2["Medan Hub Group"]
        WA3["Makassar Hub Group"]
    end

    subgraph ChatGateway ["🔌 WhatsApp Gateway Service (Node/Bun)"]
        WAListener["WhatsApp Session Listener\n(Baileys / WA-Web.js)"]
        WAFilter["Group Whitelist & Anti-Spam Filter"]
    end

    subgraph CoreBackend ["⚡ NovaPilot Core Engine (Golang)"]
        APIHandler["REST API & SSE Hub"]
        WorkerPool["Goroutine Worker Queue"]
        Orchestrator["Ticket Orchestrator"]
        LLMClient["AI Parser & Intent Extractor\n(Gemini / OpenAI API / Local Ollama)"]
        AuditLogger["Audit Trail & State Store\n(PostgreSQL / SQLite)"]
        DBRepo["Enterprise Database Adapter\n(PostgreSQL 18 & Oracle 11g)"]
    end

    subgraph HumanGate ["🧑‍💻 Human Approval Gate (WebUI)"]
        ViteApp["Bun + SvelteKit 5 + Tailwind WebUI\n(Accessible via Local LAN IP)"]
        Approver["On-Call IT Engineer (John Doe)"]
    end

    subgraph DatabaseLayer ["🗄️ Enterprise Data Storage"]
        TargetDB[("Production Enterprise DB\n(PostgreSQL / Oracle 11g via TNS)")]
    end

    WA1 & WA2 & WA3 -->|Incoming Message| WAListener
    WAListener --> WAFilter
    WAFilter -->|HTTP Webhook / JSON| APIHandler
    APIHandler --> WorkerPool
    WorkerPool --> Orchestrator
    Orchestrator <-->|Prompt & JSON Schema| LLMClient
    Orchestrator -->|Read-Only Pre-check| DBRepo
    DBRepo <-->|SELECT Query| TargetDB
    Orchestrator -->|Save Draft Ticket| AuditLogger
    AuditLogger -->|SSE Stream Push| ViteApp
    ViteApp <-->|Interactive Review & 1-Click Approval| Approver
    ViteApp -->|POST /api/tickets/:id/approve| APIHandler
    APIHandler -->|Trigger Safe Execution| DBRepo
    DBRepo -->|UPDATE with Prepared Statement| TargetDB
    DBRepo -->|Success Callback| WAListener
    WAListener -->|Reply Confirmation| WA1 & WA2 & WA3
```

---

## 2. Sequence Diagram (Ticket Lifecycle & Approval Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Branch as Branch Admin (WhatsApp)
    participant GW as WA Gateway
    participant BE as Golang Backend
    participant AI as AI LLM Engine
    participant DB as Enterprise DB (Postgres / Oracle)
    actor JohnDoe as John Doe (On-Call IT / WebUI)

    Branch->>GW: "Please change customer name on invoice INV/2026/001 to PT SUMBER MAKMUR ABADI"
    GW->>GW: Verify group whitelist & rate limit
    GW->>BE: POST /api/tickets (Raw Chat Payload)
    BE->>AI: Extract Intent & Entities (Structured JSON)
    AI-->>BE: Return JSON: {intent: "UPDATE_CUSTOMER_NAME", doc_no: "INV/2026/001", new_val: "PT SUMBER MAKMUR ABADI"}
    
    BE->>DB: Pre-check: SELECT * FROM invoices WHERE invoice_no = 'INV/2026/001'
    DB-->>BE: Record Found: Current Name = 'PT Sumber Makmur', Status = 'OPEN'
    
    BE->>BE: Create Ticket: Status = PENDING_APPROVAL
    BE->>JohnDoe: Real-time SSE Push Notification to WebUI (Desktop / Mobile)
    
    Note over JohnDoe: John Doe inspects ticket card in WebUI:<br/>- Originating Branch<br/>- Red Diff: PT Sumber Makmur<br/>- Green Diff: PT Sumber Makmur Abadi
    
    alt Approval Granted
        JohnDoe->>BE: Clicks [Approve & Mutate] in WebUI
        BE->>DB: Execute Transaction: UPDATE invoices SET customer_name = $1 WHERE invoice_no = $2
        DB-->>BE: Commit Success (1 row updated)
        BE->>GW: Dispatch Success Callback
        GW->>Branch: "✅ Ticket #TK-101 processed. Invoice INV/2026/001 has been updated."
        BE->>BE: Update Ticket Status -> EXECUTED
    else Approval Rejected
        JohnDoe->>BE: Clicks [Reject Request] with Reason: "Invoice is in closed accounting period"
        BE->>GW: Dispatch Rejection Callback
        GW->>Branch: "❌ Request rejected: Invoice is in closed accounting period."
        BE->>BE: Update Ticket Status -> REJECTED
    end
```

---

## 3. Component Details & Clean Architecture

### 3.1 Backend: Golang Clean Architecture
The backend is structured strictly following Domain-Driven Clean Architecture:

```
backend/
├── cmd/
│   ├── server/main.go           # Server entrypoint & dependency injection
│   └── seed/main.go             # Automated PostgreSQL database seeder
├── internal/
│   ├── domain/                  # Pure enterprise domain entities & interfaces
│   │   ├── ticket.go            # Ticket lifecycle model & status enums
│   │   ├── invoice.go           # Invoice entity & repository contract
│   │   ├── document.go          # Document upload attachments contract
│   │   └── audit.go             # Audit logging model
│   ├── service/                 # Core business logic & orchestration
│   │   └── ticket_service.go    # State machine validation & execution flow
│   ├── repository/
│   │   └── postgres/            # PostgreSQL adapter (prototyping & production)
│   │       ├── connector.go     # Connection pooling setup
│   │       └── repository.go    # Safe parameterized SQL operations
│   └── handler/                 # HTTP transport & event streaming
│       ├── api_handler.go       # REST endpoints & file upload multipart handler
│       └── sse_hub.go           # Real-time SSE event broadcaster
└── scripts/mock_db/             # Schema definition & seed scripts
```

### 3.2 Enterprise Database Strategy (PostgreSQL & Oracle 11g)
- **Local Prototyping:** Powered by PostgreSQL 18 with connection pooling and automated migration scripts.
- **Factory Production:** Easily swapped to Oracle 11g via the repository interface. Utilizes `TNS_ADMIN` resolution, Oracle Instant Client, and strictly parameterized SQL (`:1, :2` or `$1, $2`).
- **Zero Raw Dynamic SQL Rule:** Dynamic string concatenation for mutation queries is strictly prohibited to guarantee 100% protection against SQL injection and hallucinations.

### 3.3 SvelteKit 5 + Bun Approval Dashboard
- **Reactive Engine:** Svelte 5 runes (`$state`, `$derived`, `$props`) provide instant reactivity with zero Virtual DOM overhead.
- **Ultra-Low Memory Footprint:** Consumes only ~30MB of RAM, making it ideal for on-call engineers operating on resource-constrained laptops with VPN and database tools active.
- **Responsive LAN Accessibility:** Binds to `0.0.0.0:3000`, allowing engineers to review tickets and commit mutations directly from their mobile smartphones connected to factory Wi-Fi.

---

## 4. Operational State Machine

```
[ INCOMING_MSG ]
       │
       ▼
[ PARSING_AI ] ──(Extraction Failure / Irrelevant)──> [ IGNORED / DROPPED ]
       │
       ▼
[ VERIFYING_DB ] ──(Invoice Not Found / Closed Period)──> [ INVALID_DOCUMENT ]
       │
       ▼
[ PENDING_APPROVAL ] ──(Rejected by Engineer)──> [ REJECTED ]
       │
  (Approval Signed Off)
       ▼
[ EXECUTING_DB ] ──(DB Timeout / Conflict)──> [ EXECUTION_FAILED ]
       │
  (Commit Success)
       ▼
[ EXECUTED ] ──> [ WA_CONFIRMATION_DISPATCHED ]
```
