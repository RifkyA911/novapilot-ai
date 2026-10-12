# NovaPilot AI — Ferdium Integration Guide

This guide explains how to connect **Ferdium** (Desktop Multi-Messaging App) with **NovaPilot AI** for seamless WhatsApp ChatOps during your on-call plant IT shifts.

---

## Why Integrate with Ferdium?

As an IT on-call engineer, you likely use [Ferdium](https://ferdium.org/) to organize all regional branch WhatsApp groups in one desktop window. You have two flexible ways to integrate:

| Method | Setup Effort | QR Scan Required? | How It Operates |
| :--- | :--- | :--- | :--- |
| **Method 1: Sidecar Daemon** *(Recommended)* | 1 Command | Yes (1-time Baileys QR) | `whatsapp-gateway` runs headlessly in background as an extra Linked Device. |
| **Method 2: Native Ferdium Recipe Hook** | Copy 1 file | **No** (Uses active Ferdium session) | An injected user script inside Ferdium hooks incoming chat messages directly into NovaPilot. |

---

## Method 1: Sidecar Daemon (Recommended)

WhatsApp Multi-Device allows up to **4 concurrent linked sessions** on one phone number.

1. You keep Ferdium open to read and interact with chats normally.
2. In the terminal, run the NovaPilot gateway:
   ```powershell
   cd "C:\Works\Rifky Projects\Workspaces\novapilot-ai\whatsapp-gateway"
   bun run start
   ```
3. Scan the terminal QR code with your phone once.
4. When incoming requests arrive, the background daemon captures them, creates tickets in NovaPilot, and when you approve in the dashboard, sends replies that appear right inside your Ferdium chat window in real-time.

---

## Method 2: Native Ferdium Recipe Hook (Zero QR Code)

If you are **already logged into WhatsApp Web inside Ferdium**, you can inject the NovaPilot hook so Ferdium itself sends requests directly to the Go backend (`http://localhost:8088/api/tickets`).

### Step-by-Step Hook Installation:

1. Locate Ferdium's WhatsApp recipe directory on your laptop:
   ```text
   C:\Users\USER\AppData\Roaming\Ferdium\recipes\whatsapp\
   ```

2. Copy the NovaPilot hook file:
   ```powershell
   Copy-Item "C:\Works\Rifky Projects\Workspaces\novapilot-ai\integrations\ferdium\novapilot-hook.js" `
             "$env:APPDATA\Ferdium\recipes\whatsapp\novapilot-hook.js"
   ```

3. Open `$env:APPDATA\Ferdium\recipes\whatsapp\webview.js` in your editor, and add this line near the bottom (before `};`):
   ```javascript
   Ferdium.injectJSUnsafe(_path.default.join(__dirname, 'novapilot-hook.js'));
   ```

4. Reload the WhatsApp service in Ferdium (**Ctrl+R** or right-click service tab $\rightarrow$ Reload Service).

### How it works:
* As soon as a branch coordinator posts a chat containing invoice updates (e.g. `INV/2026/001 ke PT Sumber Makmur Abadi`), the script inside Ferdium automatically sends a `POST` request to `http://127.0.0.1:8088/api/tickets`.
* A subtle green badge appears right below the message in Ferdium:  
  `✓ NovaPilot Ticket: TK-2026-xxx`
* You can then open your on-call dashboard at `http://localhost:3000/dashboard` to review and approve the database change!
