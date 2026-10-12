# NovaPilot AI — WhatsApp ChatOps Gateway & Extractor Guide

This document provides a comprehensive operational tutorial on how to configure, pair, and run the **WhatsApp Gateway** service (`whatsapp-gateway/`) to automatically ingest, extract, and respond to IT database change requests from regional branch WhatsApp groups.

---

## 1. System Architecture & Information Flow

```
┌─────────────────────────┐
│ Regional WhatsApp Group │  (e.g., "Surabaya Cabang Support")
│ (Branch Coordinator)    │
└───────────┬─────────────┘
            │  1. Incoming Chat: "Tolong ubah nama nota INV/2026/001 ke PT Sumber Makmur Abadi"
            ▼
┌─────────────────────────┐
│ whatsapp-gateway/       │  (Baileys Multi-Device Web Socket)
│ - Whitelist Filter      │── Discards irrelevant chatter / private DMs
│ - Semantic Extractor    │── Extracts: doc_no: INV/2026/001, proposed: PT Sumber Makmur Abadi
└───────────┬─────────────┘
            │  2. POST /api/tickets (JSON Payload)
            ▼
┌─────────────────────────┐
│ NovaPilot Go Backend    │  (Port 8088)
│ - Database Pre-Check    │── Verifies invoice exists in PostgreSQL 18 / Oracle 11g
│ - Guardrail Enforcement │── Ensures invoice is OPEN and validates constraints
└───────────┬─────────────┘
            │  3. SSE Broadcast: ticket_created
            ▼
┌─────────────────────────┐
│ Human On-Call Dashboard │  (Port 3000: http://localhost:3000/dashboard)
│ - Inspect AI Plan       │── On-call engineer inspects raw chat, SQL plan & rollback query
│ - Sign-Off / Approval   │── Engineer clicks "Approve & Execute"
└───────────┬─────────────┘
            │  4. Atomic DB Execution -> SSE Broadcast: ticket_updated (EXECUTED)
            ▼
┌─────────────────────────┐
│ whatsapp-gateway/       │
│ - SSE Event Consumer    │── Receives status update
│ - WhatsApp Socket Send  │── Dispatches formal execution receipt back to WhatsApp Group
└─────────────────────────┘
```

---

## 2. Directory Layout

The WhatsApp Gateway service is located inside your project root:

```text
novapilot-ai/
├── backend/                  # Golang Core API Engine (Port 8088)
├── frontend/                 # SvelteKit + Tailwind On-Call Dashboard (Port 3000)
├── mcp-server/               # Custom Model Context Protocol Server
└── whatsapp-gateway/         # WhatsApp ChatOps Gateway
    ├── .env.example          # Environment variables template
    ├── package.json          # Baileys, QRCode, Pino dependencies
    └── src/
        └── index.ts          # Socket listener, entity extractor, & SSE consumer
```

---

## 3. Step-by-Step Setup & Configuration

### Step 3.1: Install Dependencies
Open a PowerShell terminal in the `whatsapp-gateway` directory:

```powershell
cd "C:\Works\Rifky Projects\Workspaces\novapilot-ai\whatsapp-gateway"
bun install
```

### Step 3.2: Configure Environment (`.env`)
Copy the `.env.example` file to `.env`:

```powershell
cp .env.example .env
```

Edit `.env` to configure your settings:
```env
# 1. NovaPilot Backend URL
NOVAPILOT_BACKEND_URL=http://127.0.0.1:8088

# 2. Whitelisted WhatsApp Group JIDs (Comma-separated)
# Messages outside these groups are ignored to protect your API and prevent spam.
WHITELISTED_GROUPS=120363028472918293@g.us,120363098273645129@g.us

# 3. Notification Settings
AUTO_REPLY_ENABLED=true
SIMULATION_MODE=false
```

> [!TIP]
> **How to find your WhatsApp Group JID:**
> When the gateway runs for the first time, any incoming message will log its origin `remoteJid` to the console (e.g. `[INCOMING CHAT from 120363028472918293@g.us]`). Simply copy that JID into your `WHITELISTED_GROUPS` setting.

---

## 4. Running the Gateway

### Option A: Simulation Mode (No Physical Phone Required)
If you want to test the entire ingestion and backend processing pipeline without scanning a QR code:

```powershell
bun run mock
```

**Expected Console Output:**
```text
=============================================================
  NovaPilot AI - WhatsApp ChatOps Gateway & Extractor
=============================================================
  Core Backend URL   : http://127.0.0.1:8088
  Whitelisted Groups : 120363028472918293@g.us
  Auto-Reply Active  : true
  Mode               : MOCK SIMULATION
=============================================================

[SIMULATION] Running automated WhatsApp Chat Ingestion test...
[SIMULATION EXTRACTED]: {
  documentNo: 'INV/2026/001',
  proposedValue: 'PT Sumber Makmur Abadi',
  fieldTarget: 'customer_name',
  intent: 'UPDATE_CUSTOMER_NAME',
  confidence: 0.96
}
[INGEST SUCCESS] Ticket TK-2026-004 generated for INV/2026/001

🎉 [SIMULATION PASSED] Ticket created successfully!
Ticket ID   : 4
Ticket No   : TK-2026-004
Status      : PENDING_APPROVAL
View live in dashboard at http://localhost:3000/dashboard
```

---

### Option B: Live Multi-Device WhatsApp Mode (On-Call Shift)
When starting your on-call shift, launch the live gateway:

```powershell
bun run start
```

1. A QR code will render directly in your terminal.
2. Open WhatsApp on your mobile phone:
   - Go to **Settings** $\rightarrow$ **Linked Devices** $\rightarrow$ **Link a Device**.
   - Point your camera at the terminal QR code.
3. Once authenticated, credentials are encrypted and stored locally in `.baileys_auth/` (which is gitignored). You will not need to scan again unless you sign out.
4. The gateway is now actively listening for incoming branch requests.

---

## 5. End-to-End ChatOps Walkthrough

### 1. Branch Coordinator sends message in group:
> *"Halo IT Support, tolong ubah nama nota INV/2026/001 dari PT Sumber Makmur menjadi PT Sumber Makmur Abadi ya karena ada revisi faktur pajak cabang. Terima kasih!"*

### 2. Immediate Automated Acknowledgment from Gateway:
> 🤖 **[NovaPilot AI • Permintaan Dicatat]**
>
> 📋 **No Tiket:** `TK-2026-005`  
> 📄 **Dokumen:** `INV/2026/001`  
> ✏️ **Nilai Baru:** `PT Sumber Makmur Abadi`  
> 🔒 **Status:** `Menunggu Verifikasi IT On-Call`  
>
> _Sistem sedang melakukan pre-check database & menunggu approval staf piket._

### 3. IT On-Call Review on Dashboard:
1. Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
2. The new ticket `TK-2026-005` appears automatically in the queue via real-time Server-Sent Events.
3. Click **"Inspect AI Reasoning & SQL Plan"** to verify:
   - Extracted document and values.
   - Read-only pre-check result (`Current: PT Sumber Makmur`).
   - Prepared statement: `UPDATE invoices SET customer_name = ? WHERE invoice_no = ?;`
   - Generated rollback query.
4. Click **"Sign-Off & Execute"**.

### 4. Automated Execution Confirmation sent back to WhatsApp Group:
> 🤖 **[NovaPilot AI • Update Berhasil]**
>
> ✅ **Nomor Dokumen:** `INV/2026/001`  
> 🔄 **Nama Baru:** `PT Sumber Makmur Abadi`  
> 👤 **Petugas IT On-Call:** `John Doe`  
> ⏱️ **Waktu Eksekusi:** `15:45:12`  
>
> _Perubahan telah diterapkan ke database Oracle/Postgres dengan aman._

---

## 6. Anti-Banning & Security Best Practices

1. **Whitelisted Groups Only**: Never listen to or reply to unwhitelisted groups or individual DMs.
2. **Rate Limiting**: NovaPilot applies artificial typing delays (500ms - 1500ms) before sending messages to mimic natural human behavior.
3. **No Promotional Spam**: The bot only speaks when spoken to (reactive acknowledgment and execution callbacks only).
4. **Local Network Isolation**: The gateway runs strictly on your internal laptop/LAN during your on-call shift.
