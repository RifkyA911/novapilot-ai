/**
 * NovaPilot AI — Ferdium WhatsApp Web Integration Hook
 * 
 * Injected into Ferdium's WhatsApp recipe (webview.js).
 * Automatically detects invoice modification requests in WhatsApp Web chats
 * and forwards them to NovaPilot AI Go Backend (http://localhost:8088/api/tickets).
 */

(function () {
    const NOVAPILOT_BACKEND = "http://127.0.0.1:8088";
    const processedMessages = new Set();

    console.log("[NovaPilot AI] Ferdium ChatOps Hook initialized.");

    // Extract invoice pattern and requested change
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

    // Submit to NovaPilot Backend
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
                console.log(`[NovaPilot] Ticket ${ticket.ticket_no} created successfully via Ferdium!`);
                return ticket;
            }
        } catch (err) {
            console.error("[NovaPilot] Failed to send ticket to local backend:", err);
        }
        return null;
    }

    // Attach DOM Observer to WhatsApp Web messages container in Ferdium
    function observeWhatsAppMessages() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        // Find message text elements in WhatsApp Web DOM
                        const textNodes = node.querySelectorAll ? node.querySelectorAll(".selectable-text, [data-pre-plain-text]") : [];
                        for (const el of textNodes) {
                            const text = el.textContent || "";
                            if (!text || processedMessages.has(text)) continue;

                            const parsed = parseMessage(text);
                            if (parsed) {
                                processedMessages.add(text);
                                forwardToNovaPilot(text, parsed).then((ticket) => {
                                    if (ticket) {
                                        // Visual badge indicator inside Ferdium
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
        console.log("[NovaPilot AI] DOM Observer attached to WhatsApp Web inside Ferdium.");
    }

    // Wait until WhatsApp Web is loaded in Ferdium
    const checkInterval = setInterval(() => {
        if (document.querySelector("#app") || document.querySelector("#pane-side")) {
            clearInterval(checkInterval);
            observeWhatsAppMessages();
        }
    }, 1500);
})();
