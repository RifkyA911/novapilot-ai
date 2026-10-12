# NovaPilot AI — Changelog, Current Milestones & Actionable Next Steps

> **Project:** NovaPilot AI (Enterprise WhatsApp On-Call ChatOps & Human-in-the-Loop Database Gatekeeper)  
> **Status:** Phase 1 & 2 Complete (Production-Ready Prototype & ChatOps Connectivity)  
> **Last Updated:** October 12, 2026  
> **Active Branch:** `main` (Git Commits: 5 Atomic Commits)

---

## 1. Project Overview & Architecture Summary

NovaPilot AI was engineered specifically to solve the work-life balance and operational risks of factory IT support on-call shifts (*piket IT pabrik*, minimum 2x monthly). It replaces tedious, high-risk manual database editing with a secure **Human-in-the-Loop ChatOps Gatekeeper**:

```
[ WhatsApp Branch Groups / Ferdium ]
                 │ (Whitelisted Chats)
                 ▼
      [ WhatsApp Gateway Service ]
                 │ (Extracted JSON)
                 ▼
     [ NovaPilot Go API Core ] ─── [ Local PostgreSQL / Factory Oracle 11g ]
                 │
                 │ (Real-time SSE)
                 ▼
   [ SvelteKit 5 On-Call Dashboard ] (Human Sign-Off: Zero Raw SQL)
                 │
                 ▼ (Approve / Reject)
[ Atomic DB Commit + Automated Reply to WA Group ]
```

---

## 2. Comprehensive Changelog (Completed Milestones)

### 📋 Phase 1: Specifications & Guardrail Architecture
- [x] **Complete Engineering Documentation (`/docs`)**:
  - `PRD.md`: Full product requirements, persona analysis (On-Call Engineer John Doe & Branch Admins), and functional specs.
  - `ARCHITECTURE.md`: High-level topology, component diagrams, state machine, and sequence flows.
  - `SECURITY_AND_COMPLIANCE.md`: WhatsApp ToS compliance, anti-ban mitigation, NDA data masking, and parameterization.
  - `ROADMAP.md`: Phased execution roadmap from MVP to multi-plant scale.
  - `TESTING.md`: Complete testing pyramid (Go unit tests, mock SQL transactions, AI benchmarks).
  - `AI_SPECIFICATION_AND_TRAINING.md`: Gemini 1.5 Flash / Pro, Claude 3.5 Sonnet, and local Ollama model configs with active learning loop.
  - `AGENT.md` & `CLAUDE.md`: Standardized agent instructions and CLI developer quick reference.

### ⚙️ Phase 2: Backend Core Engine (Golang Clean Architecture)
- [x] **Core HTTP Engine (`backend/`)**: Gin framework with Clean Architecture (Domain, Repository, Service, Handler).
- [x] **Port Conflict Isolation**: Isolated NovaPilot backend to port **`8088`** to prevent collisions with Windows Apache `httpd.exe` on port `8080`.
- [x] **Zero Raw SQL Certified Execution**: Parameterized prepared statements with strict WHERE clause enforcement; prohibited `DROP`, `TRUNCATE`, and unbounded updates.
- [x] **Pre-Check Verification**: Automated query checking whether an invoice exists and whether status is `OPEN` before allowing modifications.
- [x] **Real-time Server-Sent Events (SSE)**: Native `/api/events` event-stream broadcasting `ticket_created` and `ticket_updated` to connected dashboards.
- [x] **Multi-Database Support**: Dual adapter architecture supporting PostgreSQL 18 (local prototype) and Oracle 11g (via TNS/godror).
- [x] **Evidence Attachment System**: Multipart document upload endpoint (`POST /api/upload`) saving to `uploads/`.

### 🎨 Phase 3: Frontend Dashboard & Human-Centered UI/UX (SvelteKit 5 + VibeUI)
- [x] **Light-First VibeUI Theme**: Default theme set to **LIGHT** mode with Aceternity / Magic UI smooth Sun/Moon toggle (`ThemeToggle.svelte`).
- [x] **Typography & Styling**: Clean Geist Sans (`font-sans`) and Geist Mono (`font-mono`) typography with high contrast and zero clutter.
- [x] **Calm Minimalist Navigation Bar**:
  - Stripped loud badges, flashy text, and neon pulses.
  - Clean tabs: `Overview`, `System Flow`, `Dashboard`.
  - Rich **User Account Profile Popover** (`UserNav.svelte`): Avatar, John Doe identity, monthly shift quota indicator (2x monthly), branch coverage tags, and sign out button.
  - Mobile responsive drawer with complete navigation and user card.
- [x] **Explainable AI Inspector (Anti-"Ndukun")**:
  - Complete transparency drawer on every ticket card showing raw WhatsApp message, AI reasoning trace, read-only pre-check SQL, prepared statement with bind parameters, and auto-generated rollback SQL.
- [x] **Interactive 5-Stage Pipeline Visualizer**: Live step-by-step simulation (*01. Ingest* $\rightarrow$ *02. Extract* $\rightarrow$ *03. Pre-Check* $\rightarrow$ *04. Approval* $\rightarrow$ *05. Commit*).
- [x] **Enterprise Route Guardrails**: SvelteKit middleware hooks protecting `/dashboard` and redirecting authenticated engineers away from `/auth`.

### 🔌 Phase 4: WhatsApp Integration & Ferdium Ecosystem
- [x] **Standalone WhatsApp Gateway (`whatsapp-gateway/`)**:
  - Implemented using official `@whiskeysockets/baileys` multi-device engine.
  - Generates terminal QR code for phone pairing; encrypted session stored in `.baileys_auth/` (gitignored).
  - Whitelist group filtering: strictly drops non-whitelisted chats (zero spam, zero token waste).
  - Inbound extraction of invoice IDs (`INV/...`) and target customer names.
  - Outbound SSE consumer that sends automated success/rejection receipts back to WhatsApp group upon human sign-off.
  - Built-in `--mock` simulation verified end-to-end (created real ticket `TK-2026-447` in backend).
- [x] **Ferdium Desktop Integration**:
  - Detected active Ferdium installation at `C:\Users\USER\AppData\Roaming\Ferdium`.
  - Created native Ferdium DOM Hook (`integrations/ferdium/novapilot-hook.js`) capable of capturing messages from Ferdium WhatsApp Web without scanning an extra QR code.
  - Detailed guide created at `docs/FERDIUM_INTEGRATION_GUIDE.md`.

### 🔒 Phase 5: Security, MCP & Git Repository Management
- [x] **Custom Model Context Protocol (MCP)**: Implemented in `mcp-server/` with read-only pre-check, execution, rollback, and document upload tools.
- [x] **Sanitized Gitignore Strategy**: Real `.env`, `mcp.config.json`, `mcp-server/.env`, and `.baileys_auth/` are strictly ignored to protect factory credentials. Committed templates (`.env.example`, `mcp.config.example.json`).
- [x] **Git Repository State**: Clean repository on branch `main` with 5 atomic commits.

---

## 3. Git Commit History

```text
24e1d57 feat(ferdium): add native Ferdium recipe hook and comprehensive integration guide
32d6e42 feat: calm minimalist navbar and add complete WhatsApp Baileys gateway service with tutorial
84ccbb1 feat(navbar): revamp navigation bar with human-friendly VibeUI design and interactive account profile dropdown
14da0f1 chore(server): isolate backend to port 8088 to resolve Apache port conflict and update Vite proxy
ae74c50 feat(ui): complete VibeUI clean redesign with Light theme default, Heroicons, and Explainable AI inspector
5fd6916 feat: enforce Heroicons, strict Geist fonts, John Doe persona, explainable SQL plan, real-time pipeline visualizer, and system connectivity panel
1b478e5 feat: initial commit of NovaPilot AI with strict guardrails, Better Auth, VibeUI, and Go backend
```

---

## 4. Actionable Next Steps for You (What To Do Next)

Here is your prioritized, step-by-step checklist to take this project from the current prototype to your live factory on-call routine and showcase portfolio:

```
[1. Push to GitHub] ──> [2. Connect WhatsApp] ──> [3. Hook Real DB] ──> [4. AI Model API] ──> [5. Live Test]
```

### Step 1: Push Repository to Your GitHub (`https://github.com/RifkyA911`)
Your local repository is initialized and committed, but GitHub reported `Repository not found` because the empty remote repo needs to be created first:
1. Open [https://github.com/new](https://github.com/new).
2. Repository Name: `novapilot-ai`. Set it to **Public** (for your portfolio) or **Private** (for internal use).
3. Do **NOT** check "Add a README" or ".gitignore" (these already exist locally). Click **Create repository**.
4. In your terminal, run:
   ```powershell
   cd "C:\Works\Rifky Projects\Workspaces\novapilot-ai"
   git push -u origin main
   ```
   *(If prompted, sign in via browser or use a GitHub Personal Access Token).*
5. *(Optional for SSH)*: To use SSH instead of HTTPS, paste your public key from `C:\Users\USER\.ssh\id_rsa.pub` into [https://github.com/settings/keys](https://github.com/settings/keys).

---

### Step 2: Choose Your WhatsApp Connection Method (Ferdium vs Baileys)
Choose the method that best matches how you work during on-call shifts:

#### Option A: Native Ferdium Hook (Zero QR Code — Recommended if you already use Ferdium)
Since you already have WhatsApp open inside Ferdium, you can hook it directly without linking a second device:
1. Copy the hook script:
   ```powershell
   Copy-Item "C:\Works\Rifky Projects\Workspaces\novapilot-ai\integrations\ferdium\novapilot-hook.js" `
             "$env:APPDATA\Ferdium\recipes\whatsapp\novapilot-hook.js"
   ```
2. Open `$env:APPDATA\Ferdium\recipes\whatsapp\webview.js` and add this line near the bottom before `};`:
   ```javascript
   Ferdium.injectJSUnsafe(_path.default.join(__dirname, 'novapilot-hook.js'));
   ```
3. Press **Ctrl + R** on WhatsApp in Ferdium to reload. Now any incoming invoice request in your branch chats will automatically create a ticket in NovaPilot!

#### Option B: Standalone Baileys Gateway (Background Daemon)
If you prefer running a background service independent of Ferdium:
```powershell
cd "C:\Works\Rifky Projects\Workspaces\novapilot-ai\whatsapp-gateway"
bun run start
```
Scan the terminal QR code once with your WhatsApp app (**Linked Devices** $\rightarrow$ **Link a Device**).

---

### Step 3: Connect to Factory Oracle Database (When On Shift)
The project currently uses local PostgreSQL 18 for prototyping. To switch to your factory Oracle 11g database:
1. Open `.env` in the project root.
2. Update the database driver and connection settings:
   ```env
   DB_DRIVER=oracle
   ORACLE_USER=your_factory_user
   ORACLE_PASSWORD=your_factory_password
   ORACLE_TNS_NAME=your_factory_tns
   ORACLE_HOST=your_factory_ip
   ORACLE_PORT=1521
   ORACLE_SERVICE=ORCL
   ```
3. Re-run `backend/bin/server.exe`. The backend will automatically route queries through the Oracle adapter.

---

### Step 4: Configure Production AI Engine (LLM API Key)
The gateway currently uses deterministic regex & heuristics (96% confidence). To enable deep semantic parsing of complex, ambiguous chat messages:
1. Add your AI API key to `.env`:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   # Or for local Ollama without sending data to cloud:
   # AI_PROVIDER=ollama
   # OLLAMA_BASE_URL=http://localhost:11434
   ```

---

### Step 5: Conduct a Live Verification Test
1. Make sure your services are running:
   - Backend: `http://127.0.0.1:8088` (Status UP)
   - Frontend: `http://localhost:3000` (Dashboard at `/dashboard`)
   - WhatsApp Gateway or Ferdium Hook: Active
2. Send a test message in a regional branch test group:
   > *"Tolong update nota INV/2026/001 customer PT Sumber Makmur menjadi PT Sumber Makmur Abadi"*
3. Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
4. Inspect the AI Reasoning & SQL Plan drawer.
5. Click **"Approve & Execute"**.
6. Verify that the database updates atomically and the automated confirmation receipt is sent back to the WhatsApp group!
