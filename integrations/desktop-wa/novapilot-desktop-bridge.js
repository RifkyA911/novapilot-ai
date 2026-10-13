/**
 * NovaPilot AI — WhatsApp Desktop (PC WA) Automation Bridge
 * 
 * WhatsApp Desktop on Windows runs as a packaged Windows app (UWP / WebView2).
 * There are two supported approaches to hook PC WA:
 * 
 * Approach 1: WebView2 / Chrome Remote Debugging Port
 * Run WhatsApp Desktop with remote debugging enabled:
 *   powershell: Start-Process "WhatsApp.exe" -ArgumentList "--remote-debugging-port=9222"
 * Then this bridge script attaches via Chrome DevTools Protocol (CDP) and evaluates the hook!
 * 
 * Approach 2: Baileys Local Sidecar (Parallel Linked Device)
 * Runs simultaneously on the same laptop without modifying WhatsApp Desktop binaries.
 */

import http from "http";

const CDP_PORT = process.env.CDP_PORT || 9222;
const NOVAPILOT_BACKEND = process.env.NOVAPILOT_BACKEND || "http://127.0.0.1:8088";

console.log(`
=============================================================
  NovaPilot AI — WhatsApp Desktop (PC WA) Bridge
=============================================================
  Listening for PC WhatsApp on CDP Port : ${CDP_PORT}
  Target NovaPilot Backend              : ${NOVAPILOT_BACKEND}
=============================================================
`);

async function checkCDPConnection() {
    try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
        if (res.ok) {
            const targets = await res.json();
            console.log(`[CDP CONNECTED] Found ${targets.length} WebView2 targets in WhatsApp Desktop.`);
            return targets;
        }
    } catch (err) {
        console.log(`[WAITING] WhatsApp Desktop not running with --remote-debugging-port=${CDP_PORT}.`);
        console.log(`Tip: Launch PC WhatsApp using: Start-Process WhatsApp -ArgumentList "--remote-debugging-port=${CDP_PORT}"`);
    }
    return null;
}

checkCDPConnection();
