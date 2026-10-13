// ==UserScript==
// @name         NovaPilot AI — WhatsApp Web ChatOps Ingestion Hook
// @namespace    https://github.com/RifkyA911/novapilot-ai
// @version      1.0.0
// @description  Automated ChatOps Hook for WhatsApp Web to NovaPilot On-Call Gatekeeper
// @author       John Doe
// @match        https://web.whatsapp.com/*
// @icon         https://raw.githubusercontent.com/RifkyA911/novapilot-ai/main/frontend/static/favicon.png
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const NOVAPILOT_BACKEND = "http://127.0.0.1:8088";
    const processedMessages = new Set();

    console.log("%c[NovaPilot AI Userscript]%c Initialized on WhatsApp Web.", "background:#059669; color:#fff; font-weight:bold; padding:2px 5px; border-radius:3px;", "color:#059669; font-weight:bold;");

    function parseMessage(text) {
        const docMatch = text.match(/\b(INV[\/\-]\d{4}[\/\-]\d{3}|NOTA[\/\-]\d{4}[\/\-]\d{3})\b/i);
        if (!docMatch) return null;

        const documentNo = docMatch[1].toUpperCase().replace("-", "/");

        let proposedValue = "";
        const targetMatch = text.match(/(?:menjadi|ke|to|ubah ke|ganti jadi)\s+['"]?([^,\.\n\r"']+)['"]?/i);
        if (targetMatch && targetMatch[1]) {
            proposedValue = targetMatch[1].trim();
        } else {
            const corpMatch = text.match(/\b(PT|CV|UD)\s+([A-Za-z0-9\s]{3,35})\b/i);
            if (corpMatch) proposedValue = `${corpMatch[1].toUpperCase()} ${corpMatch[2].trim()}`;
        }

        if (!proposedValue) return null;

        return {
            documentNo,
            proposedValue,
            fieldTarget: "customer_name",
            intent: "UPDATE_CUSTOMER_NAME",
            confidence: 0.98
        };
    }

    async function forwardToNovaPilot(rawText, parsed) {
        try {
            const res = await fetch(`${NOVAPILOT_BACKEND}/api/tickets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    raw_message: rawText,
                    extracted_intent: parsed.intent,
                    document_no: parsed.documentNo,
                    field_target: parsed.fieldTarget,
                    proposed_value: parsed.proposedValue,
                    branch_id: 1,
                    confidence_score: parsed.confidence
                })
            });

            if (res.ok) {
                const ticket = await res.json();
                console.log(`[NovaPilot] Ticket ${ticket.ticket_no} created successfully via Browser Userscript!`);
                return ticket;
            }
        } catch (err) {
            console.error("[NovaPilot] Failed to communicate with Go backend:", err);
        }
        return null;
    }

    function observeWhatsAppMessages() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        const textNodes = node.querySelectorAll ? node.querySelectorAll(".selectable-text, [data-pre-plain-text]") : [];
                        for (const el of textNodes) {
                            const text = el.textContent || "";
                            if (!text || processedMessages.has(text)) continue;

                            const parsed = parseMessage(text);
                            if (parsed) {
                                processedMessages.add(text);
                                forwardToNovaPilot(text, parsed).then((ticket) => {
                                    if (ticket) {
                                        const badge = document.createElement("span");
                                        badge.style.cssText = "display:inline-block; font-size:10px; background:#10b981; color:#fff; padding:2px 6px; border-radius:4px; margin-top:4px; font-family:monospace; font-weight:bold;";
                                        badge.textContent = `✓ NovaPilot Ticket: ${ticket.ticket_no}`;
                                        el.parentNode?.appendChild(badge);
                                    }
                                });
                            }
                        }
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        console.log("[NovaPilot AI] DOM Observer attached to WhatsApp Web.");
    }

    const checkInterval = setInterval(() => {
        if (document.querySelector("#app") || document.querySelector("#pane-side")) {
            clearInterval(checkInterval);
            observeWhatsAppMessages();
        }
    }, 1500);
})();
