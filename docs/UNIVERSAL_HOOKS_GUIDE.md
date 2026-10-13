# NovaPilot AI — Universal WhatsApp Hooks Ecosystem Guide
### Supporting Ferdium, Rambox, Web Browsers (Chrome/Edge/Firefox), and WhatsApp Desktop (PC WA)

This document provides complete instructions on how to hook and extract incoming factory database change requests across all major desktop messaging clients without requiring phone QR code rescans or third-party cloud bridges.

---

## 1. Ecosystem Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       WHATSAPP CLIENT INTERFACE LAYER                       │
├─────────────────┬─────────────────┬───────────────────┬─────────────────────┤
│   1. FERDIUM    │   2. RAMBOX     │  3. WEB BROWSERS  │  4. PC WA DESKTOP   │
│ (Electron App)  │ (Workspace App) │ (Chrome/Edge/Arc) │ (Windows WebView2)  │
│  webview.js     │  Custom JS Code │   Userscript      │   CDP Bridge Port   │
└────────┬────────┴────────┬────────┴─────────┬─────────┴──────────┬──────────┘
         │                 │                  │                    │
         └─────────────────┴────────┬─────────┴────────────────────┘
                                    │
                                    ▼
         ┌─────────────────────────────────────────────────────┐
         │     NON-INVASIVE CLIENT-SIDE HOOK INJECTION         │
         │  - MutationObserver on .selectable-text DOM nodes   │
         │  - Regex / Semantic Parser: INV/\d{4}/\d{3}         │
         │  - Discards private chats & unrelated noise         │
         └──────────────────────────┬──────────────────────────┘
                                    │ HTTP POST (Local LAN / 127.0.0.1:8088)
                                    ▼
         ┌─────────────────────────────────────────────────────┐
         │             NOVAPILOT GO API CORE :8088             │
         │  - Pre-check SELECT verification                    │
         │  - Parameterized DML prepared statement creation    │
         │  - Rollback query auto-generation                   │
         └──────────────────────────┬──────────────────────────┘
                                    │ Real-time SSE (:8088/api/events)
                                    ▼
         ┌─────────────────────────────────────────────────────┐
         │       HUMAN-IN-THE-LOOP COCKPIT (:3000/dashboard)   │
         │  - On-call engineer (John Doe) inspects plan        │
         │  - Single-click atomic execute or policy reject     │
         └─────────────────────────────────────────────────────┘
```

---

## 2. Platform Setup Guides

### 🟢 1. Ferdium App
**Path:** `integrations/ferdium/novapilot-hook.js`

1. **Auto-Injected:** Already copied and enabled at:
   ```text
   C:\Users\USER\AppData\Roaming\Ferdium\recipes\whatsapp\novapilot-hook.js
   ```
2. **Hook Execution:** Automatically injected via `C:\Users\USER\AppData\Roaming\Ferdium\recipes\whatsapp\webview.js`:
   ```javascript
   Ferdium.injectJSUnsafe(_path.default.join(__dirname, 'novapilot-hook.js'));
   ```
3. **Usage:** Simply press **Ctrl + R** on WhatsApp inside Ferdium.

---

### 🔵 2. Rambox App
**Path:** `integrations/rambox/novapilot-rambox.js`

1. Open **Rambox**.
2. Right-click your WhatsApp service icon in the left dock $\rightarrow$ **Edit**.
3. Scroll down and expand **Advanced Settings**.
4. In the **"Inject JavaScript code"** input box, paste the code from [`integrations/rambox/novapilot-rambox.js`](file:///C:/Works/Rifky%20Projects/Workspaces/novapilot-ai/integrations/rambox/novapilot-rambox.js).
5. Click **Save** and reload the service.

---

### 🟣 3. Web Browsers (Chrome, Microsoft Edge, Brave, Firefox, Arc)
**Path:** `integrations/browser/novapilot-whatsapp-web.user.js`

1. Install any popular userscript extension in your browser:
   - **Tampermonkey** ([tampermonkey.net](https://www.tampermonkey.net/))
   - **Violentmonkey** ([violentmonkey.github.io](https://violentmonkey.github.io/))
2. Open the extension dashboard $\rightarrow$ **Create a new script** (or Import).
3. Paste the contents of [`integrations/browser/novapilot-whatsapp-web.user.js`](file:///C:/Works/Rifky%20Projects/Workspaces/novapilot-ai/integrations/browser/novapilot-whatsapp-web.user.js).
4. Save the script.
5. Whenever you open [web.whatsapp.com](https://web.whatsapp.com), the hook executes automatically with an active console banner.

---

### 🟠 4. PC WhatsApp Desktop (Windows App / WebView2)
**Path:** `integrations/desktop-wa/novapilot-desktop-bridge.js`

1. Launch WhatsApp Desktop with remote debugging enabled:
   ```powershell
   Start-Process "WhatsApp.exe" -ArgumentList "--remote-debugging-port=9222"
   ```
2. Run the bridge:
   ```powershell
   node integrations/desktop-wa/novapilot-desktop-bridge.js
   ```
   *(Or alternatively, use the standalone Baileys background gateway `whatsapp-gateway/` which runs as a parallel linked device on the same PC).*

---

## 3. Visual SVG Process Diagram

You can view and interact with the **Live Animated SVG Visualizer** directly inside the WebUI:
1. **On-Call Dashboard:** Go to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) $\rightarrow$ Click the **Client Hooks (Ferdium, Rambox, Web)** tab.
2. **System Flow Page:** Go to [http://localhost:3000/flow](http://localhost:3000/flow) $\rightarrow$ Scroll down to the **Universal Hooks Ecosystem** section.
3. Click **"Test Hook Animation"** to see an animated packet traverse the vector paths from the chosen client into NovaPilot's Go Core!
