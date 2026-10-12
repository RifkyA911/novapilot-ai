# 📋 Product Requirements Document (PRD) — NovaPilot AI

---

## 1. Problem Statement & Background

### 1.1 As-Is State
- Plant IT Support teams are assigned rotating on-call shifts (at least twice per month) to monitor dozens of regional branch WhatsApp support groups.
- Over 80% of incoming branch requests follow repetitive operational patterns:
  - *Correcting typographical errors on customer/entity names in invoices.*
  - *Checking document and invoice posting statuses.*
  - *Amending metadata on unclosed transactions.*
- The current resolution process is fully manual and stressful:
  1. The on-call engineer reads incoming messages across multiple WhatsApp groups.
  2. The engineer opens a laptop, authenticates via factory VPN, and launches DBeaver/PLSQL Developer.
  3. The engineer runs manual `SELECT` queries against the database (Oracle/Postgres).
  4. The engineer writes manual `UPDATE` queries, risking syntax errors or unintended `WHERE` clauses on production tables.
  5. The engineer types a confirmation reply back to the branch chat group.
- **Business Impact:** Disturbed work-life balance for on-call engineers, delayed response times when engineers are away from their workstations, and high potential for human error in production databases.

### 1.2 To-Be State
- Branch WhatsApp messages are captured automatically via an ingestion gateway.
- AI (LLMs) extracts the intent and key entities (Document Number, Requested Name, Origin Branch, Reason).
- The system pre-validates data against the database (verifies existence and checks whether the transaction is eligible for alteration).
- Results are presented on a **Real-Time WebUI Approval Dashboard** accessible via local LAN/Wi-Fi on laptops or smartphones.
- The on-call engineer reviews the side-by-side visual diff and taps **"Approve & Mutate"**.
- Safe parameterized queries execute within transaction blocks, audit trails are logged, and automatic confirmation is dispatched back to WhatsApp.

---

## 2. Target Personas

| Persona | Role | Core Requirement |
| :--- | :--- | :--- |
| **Rifky (On-Call IT Engineer)** | Primary operator responsible for system stability during off-hours shifts. | Avoid manual SQL typing; review and sign off requests with 1-click from a phone without opening database IDEs. |
| **Branch Coordinator / Admin** | Initiator requesting data corrections via branch WhatsApp groups. | Fast turnarounds and transparent feedback regarding request status or policy rejections. |
| **IT Lead & Security Auditor** | Oversees database compliance, data integrity, and access controls. | Strict assurance of zero credential leaks, comprehensive audit trails, and zero arbitrary unverified AI mutations. |

---

## 3. Scope of System

### ✅ In-Scope:
1. **WhatsApp Ingestion & Group Filtering:** Monitoring messages strictly from whitelisted branch groups.
2. **AI Intent & Entity Parsing:** Translating informal conversational chat into strict structured JSON.
3. **Database Pre-Check:** Running read-only queries to verify document existence and status before allowing mutation.
4. **Approval Gate (WebUI):** Visual interface showing pending queue cards, side-by-side diffs, Approve/Reject modals, and audit logs.
5. **Safe Mutation Execution:** Parameterized SQL execution solely when tickets reach the `APPROVED` state.
6. **File Attachments via MCP:** Uploading supporting proof documents (PDFs, photo receipts, delivery orders) linked to tickets.
7. **Comprehensive Audit Logging:** Tracking ticket timestamp, WhatsApp sender, approving engineer, and state diff.

### ❌ Out-of-Scope:
1. Zero-Touch autonomous mutation without human approval (Strictly prohibited).
2. Direct execution of arbitrary raw DDL statements (`DROP`, `ALTER`, `TRUNCATE`).
3. Total replacement of primary ERP/accounting core systems.

---

## 4. Functional Requirements (FR)

### FR-01: WhatsApp Ingestion & Whitelisting
- Ingest messages in real-time via WhatsApp Web session listener.
- Filter strictly by whitelisted WhatsApp Group IDs and discard irrelevant chatter.

### FR-02: Structured AI Extraction
- Pass filtered chat messages to the AI engine with enterprise SOP guidelines.
- Enforce strict JSON output with fields: `intent`, `document_type`, `document_number`, `field_target`, `new_value`, `branch_origin`, and `confidence_score`.

### FR-03: Database Pre-Verification
- Execute read-only queries to verify whether the document exists in the database.
- Verify status constraints (e.g. `status != 'CLOSED'` and `is_posted = FALSE`).
- Automatically flag invalid requests as `INVALID_DOCUMENT` with descriptive error feedback.

### FR-04: Real-Time WebUI Approval Dashboard
- Display pending approval cards with live Server-Sent Events (SSE) updates without page refresh.
- Present high-contrast side-by-side diffs: current database value vs proposed AI extracted value.
- Provide one-click action buttons: **[Approve & Mutate]** and **[Reject Request]** (with reason prompt).

### FR-05: Gated Transactional Execution
- When the on-call engineer clicks **[Approve]**:
  - Execute parameterized mutation within a database transaction block.
  - Automatically dispatch confirmation back to the branch chat group upon commit.
  - Rollback transaction and set status to `FAILED` if any database conflict occurs.

---

## 5. Non-Functional Requirements (NFR)

1. **Security & Data Isolation:**
   - Database credentials and connection strings must remain strictly isolated within local environment variables; never exposed to AI model contexts.
   - WebUI accessible strictly within internal LAN/intranet networks.
2. **Performance:**
   - End-to-end pipeline from chat ingestion to WebUI card appearance under 3 seconds.
   - Database connection pooling to maintain zero-latency responsiveness.
3. **Monolingual English Standard:**
   - All documentation, code comments, UI labels, API payloads, and error messages must default strictly to English.
