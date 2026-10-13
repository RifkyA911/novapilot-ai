/**
 * NovaPilot AI — Rambox WhatsApp Service Injection Hook
 * 
 * Instructions:
 * 1. Open Rambox.
 * 2. Right-click your WhatsApp service tab -> Edit.
 * 3. Expand the "Advanced" settings section.
 * 4. Paste this entire script into the "Inject JavaScript code" box.
 * 5. Save changes and reload the service.
 */

(function () {
    const NOVAPILOT_BACKEND = "http://127.0.0.1:8088";
    const processedMessages = new Set();

    console.log("%c[NovaPilot AI]%c Rambox WhatsApp ChatOps Hook Active.", "background:#059669; color:#fff; padding:2px 4px; border-radius:3px; font-weight:bold;", "color:#059669;");

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
                console.log(`[NovaPilot] Ticket ${ticket.ticket_no} created from Rambox!`);
                return ticket;
            }
        } catch (err) {
            console.error("[NovaPilot] Failed to communicate with local Go backend:", err);
        }
        return null;
    }

    function observeMessages() {
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
        console.log("[NovaPilot AI] Rambox DOM Observer attached.");
    }

    const checkInterval = setInterval(() => {
        if (document.querySelector("#app") || document.querySelector("#pane-side")) {
            clearInterval(checkInterval);
            observeMessages();
        }
    }, 1500);
})();
