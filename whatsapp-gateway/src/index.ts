import { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    proto
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";
import EventSource from "eventsource";
import fs from "fs";
import path from "path";

// 1. Load Configurations
const BACKEND_URL = process.env.NOVAPILOT_BACKEND_URL || "http://127.0.0.1:8088";
const WHITELISTED_GROUPS = (process.env.WHITELISTED_GROUPS || "").split(",").map(g => g.trim()).filter(Boolean);
const AUTO_REPLY = process.env.AUTO_REPLY_ENABLED !== "false";
const IS_SIMULATION = process.argv.includes("--mock") || process.env.SIMULATION_MODE === "true";
const AUTH_DIR = path.join(process.cwd(), ".baileys_auth");

const logger = pino({ level: "info" });

console.log(`
=============================================================
  NovaPilot AI - WhatsApp ChatOps Gateway & Extractor
=============================================================
  Core Backend URL   : ${BACKEND_URL}
  Whitelisted Groups : ${WHITELISTED_GROUPS.length > 0 ? WHITELISTED_GROUPS.join(", ") : "(ALL GROUPS ACCEPTED - DEV MODE)"}
  Auto-Reply Active  : ${AUTO_REPLY}
  Mode               : ${IS_SIMULATION ? "MOCK SIMULATION" : "LIVE WHATSAPP MULTI-DEVICE"}
=============================================================
`);

// 2. Structured Extraction Engine (Regex & Semantic Heuristics)
interface ExtractionResult {
    documentNo: string;
    proposedValue: string;
    fieldTarget: string;
    intent: string;
    confidence: number;
}

function extractTicketData(text: string): ExtractionResult | null {
    // Invoice Pattern Matching: e.g. INV/2026/001, INV-2026-001, NOTA/2026/012
    const docMatch = text.match(/\b(INV[\/\-]\d{4}[\/\-]\d{3}|NOTA[\/\-]\d{4}[\/\-]\d{3})\b/i);
    if (!docMatch) {
        return null; // Not a targeted IT database change request
    }

    const documentNo = docMatch[1].toUpperCase().replace("-", "/");

    // Detect Proposed Value patterns:
    // "menjadi PT Sumber Makmur Abadi"
    // "ke CV Bintang Timur"
    // "to PT Karya Abadi Perkasa"
    let proposedValue = "";
    const targetMatch = text.match(/(?:menjadi|ke|to|ubah ke|ganti jadi)\s+['"]?([^,\.\n\r"']+)['"]?/i);
    if (targetMatch && targetMatch[1]) {
        proposedValue = targetMatch[1].trim();
    } else {
        // Fallback: search for corporate suffixes PT/CV/UD
        const corpMatch = text.match(/\b(PT|CV|UD)\s+([A-Za-z0-9\s]{3,35})\b/i);
        if (corpMatch) {
            proposedValue = `${corpMatch[1].toUpperCase()} ${corpMatch[2].trim()}`;
        }
    }

    if (!proposedValue) {
        return null;
    }

    return {
        documentNo,
        proposedValue,
        fieldTarget: "customer_name",
        intent: "UPDATE_CUSTOMER_NAME",
        confidence: 0.96
    };
}

// 3. Connect to NovaPilot Golang Backend
async function submitTicketToBackend(rawMessage: string, extracted: ExtractionResult, groupJid: string, branchId: number = 1) {
    try {
        const payload = {
            raw_message: rawMessage,
            extracted_intent: extracted.intent,
            document_no: extracted.documentNo,
            field_target: extracted.fieldTarget,
            proposed_value: extracted.proposedValue,
            branch_id: branchId,
            confidence_score: extracted.confidence
        };

        const res = await fetch(`${BACKEND_URL}/api/tickets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Backend rejected ticket: ${err}`);
        }

        const createdTicket = await res.json();
        console.log(`[INGEST SUCCESS] Ticket ${createdTicket.ticket_no} generated for ${extracted.documentNo}`);
        return createdTicket;
    } catch (err: any) {
        console.error(`[INGEST ERROR] Failed to submit ticket:`, err.message);
        return null;
    }
}

// 4. Listen to Backend SSE Events to Dispatch WhatsApp Replies
function startSSEListener(sendMessageFn: (jid: string, text: string) => Promise<void>) {
    const sseUrl = `${BACKEND_URL}/api/events`;
    console.log(`[SSE] Subscribing to On-Call event stream: ${sseUrl}`);

    const es = new EventSource(sseUrl);

    es.addEventListener("ticket_updated", async (e: any) => {
        try {
            const ticket = JSON.parse(e.data);
            console.log(`[SSE EVENT] Ticket ${ticket.ticket_no} updated status: ${ticket.status}`);

            if (!AUTO_REPLY) return;

            let replyText = "";
            if (ticket.status === "EXECUTED") {
                replyText = `*[NovaPilot AI • Update Berhasil]*\n\n` +
                    `✅ *Nomor Dokumen:* ${ticket.document_no}\n` +
                    `🔄 *Nama Baru:* ${ticket.proposed_value}\n` +
                    `👤 *Petugas IT On-Call:* ${ticket.approved_by || "John Doe"}\n` +
                    `⏱️ *Waktu Eksekusi:* ${new Date().toLocaleTimeString()}\n\n` +
                    `_Perubahan telah diterapkan ke database Oracle/Postgres dengan aman._`;
            } else if (ticket.status === "REJECTED") {
                replyText = `*[NovaPilot AI • Permintaan Ditolak]*\n\n` +
                    `❌ *Nomor Dokumen:* ${ticket.document_no}\n` +
                    `⚠️ *Alasan:* ${ticket.rejection_reason || "Tidak memenuhi syarat SOP internal"}\n` +
                    `👤 *Verifikator:* ${ticket.approved_by || "John Doe"}\n\n` +
                    `_Silakan koordinasikan dengan supervisor cabang Anda._`;
            }

            if (replyText && WHITELISTED_GROUPS.length > 0) {
                // Send confirmation to the first whitelisted group or origin group
                await sendMessageFn(WHITELISTED_GROUPS[0], replyText);
            }
        } catch (err: any) {
            console.error("[SSE ERROR] Failed to parse ticket update:", err.message);
        }
    });

    es.onerror = (err) => {
        console.warn("[SSE WARN] Connection dropped, reconnecting in 5s...");
    };
}

// 5. Mock Simulation Runner (Test without physical phone)
async function runMockSimulation() {
    console.log("[SIMULATION] Running automated WhatsApp Chat Ingestion test...");

    const sampleChat = "Halo Tim IT On-Call Surabaya, tolong ubah nama nota INV/2026/001 customer PT Sumber Makmur menjadi PT Sumber Makmur Abadi. Bukti faktur pajak terlampir. Makasih!";
    const extracted = extractTicketData(sampleChat);

    if (!extracted) {
        console.error("[SIMULATION FAILED] Extraction logic failed to parse sample chat.");
        return;
    }

    console.log("[SIMULATION EXTRACTED]:", extracted);
    const result = await submitTicketToBackend(sampleChat, extracted, "120363028472918293@g.us", 1);
    
    if (result) {
        console.log(`\n🎉 [SIMULATION PASSED] Ticket created successfully!`);
        console.log(`Ticket ID   : ${result.id}`);
        console.log(`Ticket No   : ${result.ticket_no}`);
        console.log(`Status      : ${result.status}`);
        console.log(`View live in dashboard at http://localhost:3000/dashboard\n`);
    } else {
        console.log("[SIMULATION NOTE] Backend might require seeded database or already has ticket.");
    }
}

// 6. Live WhatsApp Multi-Device Connection (Baileys)
async function startLiveGateway() {
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\n[ACTION REQUIRED] Scan this QR Code using WhatsApp (Linked Devices):");
            qrcode.generate(qr, { small: true });
            console.log("Waiting for scan...\n");
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[WHATSAPP] Connection closed. Reconnecting: ${shouldReconnect}`);
            if (shouldReconnect) {
                startLiveGateway();
            }
        } else if (connection === "open") {
            console.log("✅ [WHATSAPP READY] Multi-Device session connected successfully!");
            console.log("Listening for incoming branch chat requests...\n");
        }
    });

    // Inbound Message Listener
    sock.ev.on("messages.upsert", async (m) => {
        for (const msg of m.messages) {
            if (!msg.message || msg.key.fromMe) continue;

            const fromJid = msg.key.remoteJid || "";
            const isGroup = fromJid.endsWith("@g.us");

            // Whitelist Check (Ignore irrelevant groups and private chats if configured)
            if (WHITELISTED_GROUPS.length > 0 && !WHITELISTED_GROUPS.includes(fromJid)) {
                continue; // Discard: Zero token waste, zero noise
            }

            // Extract text body
            const body = 
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                msg.message.imageMessage?.caption ||
                "";

            if (!body) continue;

            console.log(`[INCOMING CHAT from ${fromJid}]: ${body}`);

            // Semantic & Regex Intent Extraction
            const extracted = extractTicketData(body);
            if (!extracted) {
                // Not an actionable invoice or database update request
                continue;
            }

            console.log(`[DETECTED REQUEST]: Document ${extracted.documentNo} -> ${extracted.proposedValue}`);

            // Submit to NovaPilot Backend
            const ticket = await submitTicketToBackend(body, extracted, fromJid);

            // Send Acknowledgment back to WhatsApp group
            if (ticket && AUTO_REPLY) {
                const ackText = 
                    `*[NovaPilot AI • Permintaan Dicatat]*\n\n` +
                    `📋 *No Tiket:* ${ticket.ticket_no}\n` +
                    `📄 *Dokumen:* ${extracted.documentNo}\n` +
                    `✏️ *Nilai Baru:* ${extracted.proposedValue}\n` +
                    `🔒 *Status:* Menunggu Verifikasi IT On-Call\n\n` +
                    `_Sistem sedang melakukan pre-check database & menunggu approval on-call engineer._`;

                await sock.sendMessage(fromJid, { text: ackText });
                console.log(`[ACK SENT] Replied to ${fromJid}`);
            }
        }
    });

    // Start Outbound SSE listener
    startSSEListener(async (jid, text) => {
        try {
            await sock.sendMessage(jid, { text });
            console.log(`[OUTBOUND SENT] Confirmation delivered to ${jid}`);
        } catch (err: any) {
            console.error(`[OUTBOUND ERROR] Failed to send message to ${jid}:`, err.message);
        }
    });
}

// 7. Entry Point
if (IS_SIMULATION) {
    runMockSimulation();
} else {
    startLiveGateway().catch(err => {
        console.error("Fatal Gateway error:", err);
    });
}
