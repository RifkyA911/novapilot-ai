import "dotenv/config";
import { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    downloadMediaMessage,
    proto
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import QRCode from "qrcode";
import pino from "pino";
import EventSource from "eventsource";
import fs from "fs";
import path from "path";
import Tesseract from "tesseract.js";

// 1. Load Configurations
const BACKEND_URL = process.env.NOVAPILOT_BACKEND_URL || "http://127.0.0.1:8088";
const WHITELISTED_GROUPS = (process.env.WHITELISTED_GROUPS || "").split(",").map(g => g.trim()).filter(Boolean);
const AUTO_REPLY = process.env.AUTO_REPLY_ENABLED !== "false";
const IS_SIMULATION = process.argv.includes("--mock") || process.env.SIMULATION_MODE === "true";
const AUTH_DIR = path.join(process.cwd(), ".baileys_auth");
const UPLOAD_DIR = path.resolve(process.cwd(), "..", "uploads");
const WA_ATTACHMENTS_DIR = path.join(UPLOAD_DIR, "wa_attachments");
const QR_FILE = path.join(UPLOAD_DIR, "whatsapp_qr.json");

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(WA_ATTACHMENTS_DIR)) {
    fs.mkdirSync(WA_ATTACHMENTS_DIR, { recursive: true });
}

const logger = pino({ level: "info" });

// 1.1 In-Memory Real-Time Log Buffer & Terminal Interceptor
export interface GatewayLogEntry {
    id: string;
    time: string;
    level: "INFO" | "WARN" | "ERROR" | "EXEC";
    text: string;
}

const logBuffer: GatewayLogEntry[] = [];
let logSeq = 0;
let activeSock: any = null;

function appendGatewayLog(level: "INFO" | "WARN" | "ERROR" | "EXEC", ...args: any[]) {
    const text = args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    logSeq++;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("id-ID", { hour12: false }) + "." + String(now.getMilliseconds()).padStart(3, "0");
    const entry: GatewayLogEntry = {
        id: `wa-log-${Date.now()}-${logSeq}`,
        time: timeStr,
        level,
        text
    };
    logBuffer.push(entry);
    if (logBuffer.length > 300) {
        logBuffer.shift();
    }
}

const origConsoleLog = console.log;
const origConsoleWarn = console.warn;
const origConsoleError = console.error;

console.log = (...args: any[]) => {
    origConsoleLog(...args);
    appendGatewayLog("INFO", ...args);
};

console.warn = (...args: any[]) => {
    origConsoleWarn(...args);
    appendGatewayLog("WARN", ...args);
};

console.error = (...args: any[]) => {
    origConsoleError(...args);
    appendGatewayLog("ERROR", ...args);
};

// 1.2 Start Lightweight HTTP Exec & Log Streaming Daemon via Bun
const WA_PORT = Number(process.env.WA_GATEWAY_PORT || 3002);
try {
    // @ts-ignore
    if (typeof Bun !== "undefined" && Bun.serve) {
        // @ts-ignore
        Bun.serve({
            port: WA_PORT,
            async fetch(req: Request) {
                const url = new URL(req.url);
                const corsHeaders = {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Content-Type": "application/json"
                };

                if (req.method === "OPTIONS") {
                    return new Response(null, { status: 204, headers: corsHeaders });
                }

                if (url.pathname === "/api/status" || url.pathname === "/status") {
                    const isConnected = !!(activeSock && activeSock.user);
                    return new Response(JSON.stringify({
                        service: "NovaPilot WhatsApp ChatOps Gateway",
                        port: WA_PORT,
                        status: isConnected ? "CONNECTED" : "AWAITING_HOOK",
                        user: activeSock?.user || null,
                        mode: IS_SIMULATION ? "MOCK_SIMULATION" : "LIVE_BAILEYS",
                        uptime_seconds: Math.floor(process.uptime()),
                        memory_rss_mb: (process.memoryUsage().rss / (1024 * 1024)).toFixed(1),
                        whitelisted_groups: WHITELISTED_GROUPS,
                        timestamp: new Date().toISOString()
                    }), { headers: corsHeaders });
                }

                if (url.pathname === "/api/logs" || url.pathname === "/logs") {
                    const isConnected = !!(activeSock && activeSock.user);
                    return new Response(JSON.stringify({
                        ok: true,
                        status: isConnected ? "CONNECTED" : "AWAITING_HOOK",
                        user: activeSock?.user || null,
                        uptime: Math.floor(process.uptime()),
                        logs: logBuffer
                    }), { headers: corsHeaders });
                }

                if ((url.pathname === "/api/exec" || url.pathname === "/exec") && req.method === "POST") {
                    try {
                        const rawText = await req.text();
                        let cmd = "";
                        try {
                            const parsed = JSON.parse(rawText);
                            cmd = (parsed.command || "").trim().toLowerCase();
                        } catch {
                            cmd = rawText.trim().replace(/^"|"$/g, "").toLowerCase();
                        }
                        let output = "";

                        if (cmd === "ping") {
                            output = `PONG: Gateway daemon alive. Uptime: ${Math.floor(process.uptime())}s | Memory: ${(process.memoryUsage().rss / (1024 * 1024)).toFixed(1)} MB`;
                        } else if (cmd === "status") {
                            if (activeSock?.user) {
                                output = `CONNECTED: Logged in as ${activeSock.user.id} (${activeSock.user.name || "Baileys Multi-Device"}). Backend: ${BACKEND_URL}`;
                            } else {
                                output = `AWAITING_HOOK: Baileys socket initialized, awaiting phone connection.`;
                            }
                        } else if (cmd === "test_log" || cmd === "test") {
                            console.log("[DIAGNOSTIC TEST] Manual diagnostic ping executed from Web Terminal.");
                            output = "Diagnostic message successfully recorded in terminal feed.";
                        } else if (cmd === "clear") {
                            logBuffer.length = 0;
                            output = "Terminal log buffer wiped.";
                        } else if (cmd === "qr" || cmd === "qr_status") {
                            if (fs.existsSync(QR_FILE)) {
                                const qrData = JSON.parse(fs.readFileSync(QR_FILE, "utf-8"));
                                output = `QR Status: ${qrData.status} (Updated: ${qrData.updatedAt})`;
                            } else {
                                output = "QR file not yet generated or already authenticated.";
                            }
                        } else if (cmd === "help") {
                            output = "Available commands: ping, status, test_log, qr_status, clear, help";
                        } else {
                            output = `Unknown command "${cmd}". Type "help" for available commands.`;
                        }

                        appendGatewayLog("EXEC", `> ${cmd} => ${output}`);

                        return new Response(JSON.stringify({
                            ok: true,
                            command: cmd,
                            output,
                            timestamp: new Date().toISOString()
                        }), { headers: corsHeaders });
                    } catch (e: any) {
                        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 400, headers: corsHeaders });
                    }
                }

                return new Response(JSON.stringify({ message: "NovaPilot WhatsApp Gateway Daemon v1.0" }), { headers: corsHeaders });
            }
        });
        origConsoleLog(`[HTTP SERVER] WhatsApp Gateway Terminal API listening on http://127.0.0.1:${WA_PORT}`);
    }
} catch (err: any) {
    origConsoleError("[HTTP SERVER ERROR] Could not bind WA daemon HTTP port:", err.message);
}

console.log(`
=============================================================
  NovaPilot AI - WhatsApp ChatOps Gateway & Extractor
=============================================================
  Core Backend URL   : ${BACKEND_URL}
  Whitelisted Groups : ${WHITELISTED_GROUPS.length > 0 ? WHITELISTED_GROUPS.join(", ") : "(ALL GROUPS ACCEPTED - DEV MODE)"}
  Auto-Reply Active  : ${AUTO_REPLY}
  Mode               : ${IS_SIMULATION ? "MOCK SIMULATION" : "LIVE WHATSAPP MULTI-DEVICE"}
  Terminal API Port  : http://127.0.0.1:${WA_PORT}
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

interface InboundPayload {
    platform: string;
    sender_id: string;
    sender_name: string;
    raw_message: string;
    media_type: string;
    media_url?: string;
    ocr_text?: string;
    classification: string;
    extracted_doc?: string;
    extracted_intent?: string;
    extracted_target?: string;
}

async function fetchLearnedPatterns(): Promise<any[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/learned-patterns`);
        if (res.ok) {
            return await res.json();
        }
    } catch {}
    return [];
}

async function submitInboundMessage(payload: InboundPayload) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/inbound-messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const data = await res.json();
            console.log(`[INBOUND STORED] Message #${data.id} recorded in Omnichannel Feed (${payload.classification})`);
            return data;
        }
    } catch (err: any) {
        console.error(`[INBOUND STORE ERROR]`, err.message);
    }
    return null;
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

    activeSock = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            QRCode.toDataURL(qr, { width: 320, margin: 2 }).then((dataUrl) => {
                try {
                    fs.writeFileSync(QR_FILE, JSON.stringify({
                        status: "WAITING_SCAN",
                        qr,
                        qrDataUrl: dataUrl,
                        updatedAt: new Date().toISOString()
                    }, null, 2));
                    console.log("[WHATSAPP QR] Fresh QR code generated and synced to Web Dashboard (/uploads/whatsapp_qr.json)");
                } catch (err: any) {
                    console.error("[WHATSAPP QR SAVE ERROR]", err.message);
                }
            }).catch((err) => {
                console.error("[QR GENERATION ERROR]", err);
            });
        }

        if (connection === "close") {
            const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`[WHATSAPP] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
            
            try {
                fs.writeFileSync(QR_FILE, JSON.stringify({
                    status: "DISCONNECTED",
                    statusCode,
                    updatedAt: new Date().toISOString()
                }, null, 2));
            } catch {}

            if (shouldReconnect) {
                startLiveGateway();
            } else {
                console.log("[WHATSAPP] Session logged out or expired. Resetting auth directory for a fresh QR scan...");
                try {
                    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                } catch {}
                startLiveGateway();
            }
        } else if (connection === "open") {
            console.log("✅ [WHATSAPP READY] Multi-Device session connected successfully!");
            try {
                fs.writeFileSync(QR_FILE, JSON.stringify({
                    status: "CONNECTED",
                    updatedAt: new Date().toISOString()
                }, null, 2));
            } catch {}
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

            // Unwrap nested message contents (Ephemeral, ViewOnce, DocumentWithCaption)
            const msgContent = 
                msg.message?.ephemeralMessage?.message ||
                msg.message?.viewOnceMessage?.message ||
                msg.message?.viewOnceMessageV2?.message ||
                msg.message?.documentWithCaptionMessage?.message ||
                msg.message;

            // Check media types
            const isImage = !!msgContent?.imageMessage;
            const isDocument = !!msgContent?.documentMessage;
            let mediaType = "text";
            if (isImage) mediaType = "image";
            if (isDocument) mediaType = "document";

            let mediaUrl = "";
            let ocrText = "";

            if (isImage || isDocument) {
                try {
                    console.log(`[ATTACHMENT DETECTED] Downloading ${mediaType} from ${msg.pushName || fromJid}...`);
                    const downloadTarget = {
                        key: msg.key,
                        message: msgContent
                    };
                    const buffer = await downloadMediaMessage(
                        downloadTarget as any,
                        "buffer",
                        {},
                        {
                            logger: pino({ level: "silent" }),
                            reuploadRequest: sock.updateMediaMessage
                        }
                    );

                    if (buffer && Buffer.isBuffer(buffer)) {
                        const ext = isImage ? "jpg" : (msgContent?.documentMessage?.fileName?.split(".").pop() || "bin");
                        const filename = `wa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
                        const filePath = path.join(WA_ATTACHMENTS_DIR, filename);
                        fs.writeFileSync(filePath, buffer);
                        mediaUrl = `/uploads/wa_attachments/${filename}`;
                        console.log(`[ATTACHMENT SAVED] Stored at ${mediaUrl}`);

                        // Run OCR if it is an image
                        if (isImage) {
                            console.log(`[OCR PIPELINE] Running Tesseract on image attachment...`);
                            const ocrResult = await Tesseract.recognize(buffer, "eng+ind");
                            ocrText = (ocrResult.data?.text || "").trim();
                            console.log(`[OCR SUCCESS] Extracted ${ocrText.length} characters from attachment.`);
                        }
                    }
                } catch (mediaErr: any) {
                    console.error(`[MEDIA DOWNLOAD/OCR ERROR]:`, mediaErr.message);
                }
            }

            // Extract text body
            let body = 
                msgContent?.conversation ||
                msgContent?.extendedTextMessage?.text ||
                msgContent?.imageMessage?.caption ||
                msgContent?.documentMessage?.caption ||
                "";

            if (!body && (isImage || isDocument)) {
                body = isImage ? "[Lampiran Gambar Faktur/Nota]" : "[Lampiran Dokumen PDF]";
            }

            if (!body && !ocrText) continue;

            const senderName = msg.pushName || fromJid.split("@")[0] || "Branch Staff";
            console.log(`[INCOMING CHAT from ${fromJid} (${senderName})]: ${body}`);
            if (ocrText) {
                console.log(`[OCR EXTRACTED TEXT]: ${ocrText.replace(/\s+/g, ' ').substring(0, 100)}...`);
            }

            // Combine chat body + OCR text for unified semantic extraction
            const combinedText = `${body} ${ocrText}`.trim();
            const extracted = extractTicketData(combinedText);

            // Classification & heuristic detection for messages without full invoice pattern
            let classification = "CASUAL_BANTER";
            let fallbackIntent = "";
            let fallbackTarget = "";

            if (extracted) {
                classification = "ACTIONABLE";
            } else {
                // Check against learned patterns from backend (Self-Learning Loop)
                const learnedPatterns = await fetchLearnedPatterns();
                let patternMatched = false;
                for (const pat of learnedPatterns) {
                    if (!pat.is_active || !pat.regex_pattern) continue;
                    try {
                        const regex = new RegExp(pat.regex_pattern, "i");
                        if (regex.test(combinedText)) {
                            classification = pat.classification || "NEEDS_REVIEW";
                            fallbackIntent = pat.target_intent || "UPDATE_CUSTOMER_NAME";
                            patternMatched = true;
                            console.log(`[SELF-LEARNING MATCH] Matched learned pattern "${pat.pattern_name}"!`);
                            break;
                        }
                    } catch {}
                }

                if (!patternMatched) {
                    const lower = combinedText.toLowerCase();
                    const hasMutationKeyword = lower.includes("ubah") || lower.includes("ganti") || lower.includes("revisi") || lower.includes("koreksi") || lower.includes("bisa diubah");
                    const hasCompanyKeyword = /\b(pt|cv|ud)\b/i.test(combinedText);
                    const hasImageRef = isImage || lower.includes("gambar") || lower.includes("foto") || lower.includes("lampiran");

                    if (hasMutationKeyword || (hasCompanyKeyword && hasImageRef)) {
                        classification = "NEEDS_REVIEW";
                        fallbackIntent = "UPDATE_CUSTOMER_NAME";
                    }
                }

                const targetMatch = combinedText.match(/(?:menjadi|ke|to|ubah ke|ganti jadi)\s+['"]?([^,\.\n\r"']+)['"]?/i);
                if (targetMatch && targetMatch[1]) {
                    fallbackTarget = targetMatch[1].trim();
                } else {
                    const corpMatch = combinedText.match(/\b(PT|CV|UD)\s+([A-Za-z0-9\s]{3,35})\b/i);
                    if (corpMatch) {
                        fallbackTarget = `${corpMatch[1].toUpperCase()} ${corpMatch[2].trim()}`;
                    }
                }
            }

            // Ingest to Omnichannel Feed (Real-Time Ingestion for Dashboard Viewers)
            await submitInboundMessage({
                platform: "whatsapp",
                sender_id: fromJid,
                sender_name: senderName,
                raw_message: body,
                media_type: mediaType,
                media_url: mediaUrl,
                ocr_text: ocrText,
                classification: classification,
                extracted_doc: extracted?.documentNo || "",
                extracted_intent: extracted?.intent || fallbackIntent,
                extracted_target: extracted?.proposedValue || fallbackTarget
            });

            if (!extracted) {
                if (classification === "NEEDS_REVIEW") {
                    console.log(`[NEEDS REVIEW]: "${body}" contains mutation intent (${fallbackTarget || 'unknown'}) without full invoice number. Synced to Dashboard Feed for 1-click Staging.`);
                } else {
                    console.log(`[CASUAL BANTER]: "${body}" marked as general conversation.`);
                }
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
