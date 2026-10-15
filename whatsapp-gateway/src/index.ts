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

function formatWhatsAppJID(raw: string): string {
    let clean = (raw || "").trim();
    if (clean.includes("@")) {
        return clean;
    }
    // Remove non-digit characters (+, -, spaces, parentheses)
    clean = clean.replace(/\D/g, "");
    if (clean.startsWith("0")) {
        clean = "62" + clean.slice(1);
    } else if (clean.startsWith("8")) {
        clean = "62" + clean;
    }
    return `${clean}@s.whatsapp.net`;
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
                        test_recipient: process.env.WA_TEST_RECIPIENT || "081228632195",
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

                if ((url.pathname === "/api/shutdown" || url.pathname === "/shutdown") && req.method === "POST") {
                    console.log("[GATEWAY] Shutdown requested via WebUI.");
                    setTimeout(() => { process.exit(0); }, 300);
                    return new Response(JSON.stringify({ ok: true, message: "Gateway daemon shutting down..." }), { headers: corsHeaders });
                }

                if ((url.pathname === "/api/send" || url.pathname === "/send") && req.method === "POST") {
                    try {
                        const rawText = await req.text();
                        let body: any = {};
                        try {
                            body = JSON.parse(rawText);
                        } catch {}

                        const defaultRecipient = process.env.WA_TEST_RECIPIENT || "081228632195";
                        const targetPhone = (body.phone || defaultRecipient).trim();
                        const text = (body.message || "").trim();

                        if (!text) {
                            return new Response(JSON.stringify({
                                ok: false,
                                error: "Pesan (message) wajib diisi."
                            }), { status: 400, headers: corsHeaders });
                        }

                        const jid = formatWhatsAppJID(targetPhone);
                        appendGatewayLog("INFO", `[DISPATCH REQUEST] Outbound WhatsApp to ${jid} (${targetPhone}): "${text.slice(0, 80)}"`);

                        if (!activeSock) {
                            return new Response(JSON.stringify({
                                ok: false,
                                error: "Gateway socket offline. Silakan nyalakan gateway terlebih dahulu.",
                                recipient: jid,
                                phone: targetPhone
                            }), { status: 503, headers: corsHeaders });
                        }

                        if (!activeSock.user && !IS_SIMULATION) {
                            return new Response(JSON.stringify({
                                ok: false,
                                error: "Gateway belum terhubung ke WhatsApp. Tautkan akun via QR di menu Platforms atau Terminal.",
                                recipient: jid,
                                phone: targetPhone,
                                status: "AWAITING_HOOK"
                            }), { status: 400, headers: corsHeaders });
                        }

                        let sendResult: any = null;
                        if (activeSock && typeof activeSock.sendMessage === "function") {
                            sendResult = await activeSock.sendMessage(jid, { text });
                            appendGatewayLog("INFO", `[DISPATCH SUCCESS] Delivered to ${jid}`);
                        } else {
                            appendGatewayLog("WARN", `[DISPATCH MOCK] Simulation mode active. Dispatched to ${jid}`);
                        }

                        return new Response(JSON.stringify({
                            ok: true,
                            status: "SENT",
                            recipient: jid,
                            phone: targetPhone,
                            message: text,
                            delivery: sendResult ? "DELIVERED" : "SIMULATED",
                            timestamp: new Date().toISOString()
                        }), { headers: corsHeaders });
                    } catch (err: any) {
                        appendGatewayLog("ERROR", `[DISPATCH ERROR] Failed to send message: ${err.message}`);
                        return new Response(JSON.stringify({
                            ok: false,
                            error: err.message
                        }), { status: 500, headers: corsHeaders });
                    }
                }

                if ((url.pathname === "/api/exec" || url.pathname === "/exec") && req.method === "POST") {
                    try {
                        const rawText = await req.text();
                        let rawCmd = "";
                        try {
                            const parsed = JSON.parse(rawText);
                            rawCmd = (parsed.command || "").trim();
                        } catch {
                            rawCmd = rawText.trim().replace(/^"|"$/g, "");
                        }
                        const cmdLower = rawCmd.toLowerCase();
                        let output = "";

                        if (cmdLower === "ping") {
                            output = `PONG: Gateway daemon alive. Uptime: ${Math.floor(process.uptime())}s | Memory: ${(process.memoryUsage().rss / (1024 * 1024)).toFixed(1)} MB`;
                        } else if (cmdLower === "status") {
                            if (activeSock?.user) {
                                output = `CONNECTED: Logged in as ${activeSock.user.id} (${activeSock.user.name || "Baileys Multi-Device"}). Backend: ${BACKEND_URL}`;
                            } else {
                                output = `AWAITING_HOOK: Baileys socket initialized, awaiting phone connection.`;
                            }
                        } else if (cmdLower.startsWith("sales") || cmdLower.startsWith("mcp_sales")) {
                            const kw = rawCmd.replace(/^(sales|mcp_sales)\s*/i, "").trim() || "Baja";
                            const res = await queryMCPSalesRecords(kw);
                            output = formatSalesRecordReply(res);
                        } else if (cmdLower.startsWith("price") || cmdLower.startsWith("mcp_price")) {
                            const kw = rawCmd.replace(/^(price|mcp_price)\s*/i, "").trim() || "Pipa";
                            const res = await queryMCPProductPricing(kw);
                            output = formatPricingCatalogReply(res);
                        } else if (cmdLower.startsWith("simulate_inbound")) {
                            const text = rawCmd.replace(/^simulate_inbound\s*/i, "").trim() || "Halo cek penjualan SO/2026/001";
                            const isSales = text.toLowerCase().includes("penjualan") || text.toLowerCase().includes("so/2026");
                            const mockPayload: InboundPayload = {
                                platform: "whatsapp",
                                sender_id: "6281234567890@s.whatsapp.net",
                                sender_name: "Branch Staff Surabaya",
                                raw_message: text,
                                media_type: "text",
                                classification: isSales ? "ACTIONABLE" : "CASUAL_BANTER",
                                extracted_intent: isSales ? "MCP_SALES_QUERY" : "CHAT_INFO",
                                extracted_target: isSales ? "SO/2026/001" : ""
                            };
                            await submitInboundMessage(mockPayload);
                            output = `Simulated WhatsApp Inbound sent to Omnichannel Feed! (${mockPayload.raw_message})`;
                        } else if (cmdLower.startsWith("simulate_ocr")) {
                            const raw = rawCmd.replace(/^simulate_ocr\s*/i, "").trim() || "|NV / 2O26 / OO1 P.T. Sumber Makmur";
                            const cleaned = cleanAndNormalizeOCRText(raw);
                            output = `RAW OCR: "${raw}"\nNORMALIZED: "${cleaned}"`;
                        } else if (cmdLower === "test_log" || cmdLower === "test") {
                            console.log("[DIAGNOSTIC TEST] Manual diagnostic ping executed from Web Terminal.");
                            output = "Diagnostic message successfully recorded in terminal feed.";
                        } else if (cmdLower === "clear") {
                            logBuffer.length = 0;
                            output = "Terminal log buffer wiped.";
                        } else if (cmdLower === "qr" || cmdLower === "qr_status") {
                            if (fs.existsSync(QR_FILE)) {
                                const qrData = JSON.parse(fs.readFileSync(QR_FILE, "utf-8"));
                                output = `QR Status: ${qrData.status} (Updated: ${qrData.updatedAt})`;
                            } else {
                                output = "QR file not yet generated or already authenticated.";
                            }
                        } else if (cmdLower.startsWith("send")) {
                            const parts = rawCmd.replace(/^send\s*/i, "").trim();
                            let target = process.env.WA_TEST_RECIPIENT || "081228632195";
                            let msgBody = parts;
                            const match = parts.match(/^(\+?[0-9\-\s]+)\s+(.+)$/);
                            if (match) {
                                target = match[1].trim();
                                msgBody = match[2].trim();
                            }
                            const jid = formatWhatsAppJID(target);
                            if (activeSock?.user && typeof activeSock.sendMessage === "function") {
                                await activeSock.sendMessage(jid, { text: msgBody });
                                output = `SUCCESS: WhatsApp message delivered to ${jid} (${target}): "${msgBody}"`;
                            } else {
                                output = `WARNING: Active socket not connected to WhatsApp. Simulated dispatch to ${jid}: "${msgBody}"`;
                            }
                        } else if (cmdLower === "help") {
                            output = "Available commands: ping, status, send [phone] [txt], sales [kw], price [kw], simulate_inbound [txt], simulate_ocr [txt], qr_status, clear, help";
                        } else {
                            output = `Unknown command "${rawCmd}". Type "help" for available commands.`;
                        }

                        appendGatewayLog("EXEC", `> ${rawCmd} => ${output}`);

                        return new Response(JSON.stringify({
                            ok: true,
                            command: rawCmd,
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

/**
 * Intelligent OCR Text Normalizer:
 * Cleans typical Tesseract OCR artifacts on camera shots and thermal receipts:
 * - Fixes '|NV', '1NV', 'lNV', '!NV' -> 'INV'
 * - Cleans spaced slashes: 'INV / 2026 / 001' or 'SO - 2026 - 001' -> 'INV/2026/001'
 * - Replaces 'O' / 'o' with '0' inside year and document sequence digits
 * - Normalizes corporate entity prefixes: 'P.T.' -> 'PT ', 'C.V.' -> 'CV '
 */
export function cleanAndNormalizeOCRText(raw: string): string {
    if (!raw) return "";
    let s = raw;

    // 1. Normalize line breaks and multiple whitespace
    s = s.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ");

    // 2. Fix spaced slashes, OCR substitutions (|NV, 1NV, lNV) and letter O in document numbers
    // e.g. '|NV / 2O26 / OO1' -> 'INV/2026/001', '1NV-2026-001' -> 'INV/2026/001'
    s = s.replace(/(?:^|\b|[\s\(\[])([|!1liI]?NV|NOTA|SO)\s*[\/\\\|\.\-]\s*([0-9OoilI]{4})\s*[\/\\\|\.\-]\s*([0-9OoilI]{3,4})/gi, (_m, p, y, seq) => {
        const cleanP = p.toUpperCase().includes("SO") ? "SO" : (p.toUpperCase().includes("NOTA") ? "NOTA" : "INV");
        const cleanY = y.replace(/[Oo]/g, "0").replace(/[liI]/g, "1");
        const cleanSeq = seq.replace(/[Oo]/g, "0").replace(/[liI]/g, "1");
        return ` ${cleanP}/${cleanY}/${cleanSeq}`;
    });

    // 3. Fix standalone prefix artifacts
    s = s.replace(/(?:^|[\s\(\[])[|!1liI]NV(?=[\s\/\-\\_.,;:)]|$)/gi, " INV");
    s = s.replace(/\bN[0O]TA\b/gi, "NOTA");
    s = s.replace(/\bS[0O]\b/gi, "SO");
    s = s.replace(/\bS\.O\.\b/gi, "SO");

    // 4. Normalize corporate entity prefixes: "P.T. " -> "PT ", "C.V. " -> "CV "
    s = s.replace(/(?:^|[\s\(\[])P\.?\s*T\.?\s+/gi, " PT ");
    s = s.replace(/(?:^|[\s\(\[])C\.?\s*V\.?\s+/gi, " CV ");
    s = s.replace(/(?:^|[\s\(\[])U\.?\s*D\.?\s+/gi, " UD ");

    // 5. Clean common noise artifacts
    s = s.replace(/[~`^|—_]{2,}/g, " ");

    return s.replace(/[ \t]+/g, " ").trim();
}

function extractTicketData(text: string): ExtractionResult | null {
    const normalized = cleanAndNormalizeOCRText(text);

    // Invoice & Order Pattern Matching: e.g. INV/2026/001, NOTA/2026/012, SO/2026/001
    const docMatch = normalized.match(/\b(INV[\/\-]\d{4}[\/\-]\d{3,4}|NOTA[\/\-]\d{4}[\/\-]\d{3,4}|SO[\/\-]\d{4}[\/\-]\d{3,4})\b/i);
    if (!docMatch) {
        return null; // Not a targeted IT database change request
    }

    const documentNo = docMatch[1].toUpperCase().replace("-", "/");

    // Detect Proposed Value patterns:
    // "menjadi PT Sumber Makmur Abadi"
    // "ke CV Bintang Timur"
    // "to PT Karya Abadi Perkasa"
    // "koreksi jadi PT ..."
    let proposedValue = "";
    const targetMatch = normalized.match(/(?:menjadi|ke|to|ubah ke|ganti jadi|koreksi ke|koreksi jadi)\s+['"]?([^,\.\n\r"']+)['"]?/i);
    if (targetMatch && targetMatch[1]) {
        proposedValue = targetMatch[1].trim();
    } else {
        // Fallback: search for corporate suffixes PT/CV/UD
        const corpMatch = normalized.match(/\b(PT|CV|UD)\s+([A-Za-z0-9\s]{3,35})\b/i);
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

// 2.1 MCP Live Data Integration (Sales Orders & Pricing Catalog)
async function queryMCPSalesRecords(query: string): Promise<any> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/mcp/test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tool_name: "query_sales_records",
                parameters: { query: query.trim() }
            })
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (err: any) {
        console.error("[MCP SALES QUERY ERROR]", err.message);
    }
    return null;
}

async function queryMCPProductPricing(productOrCode: string): Promise<any> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/mcp/test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tool_name: "check_product_pricing_discount",
                parameters: { product_name_or_code: productOrCode.trim() }
            })
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (err: any) {
        console.error("[MCP PRICING QUERY ERROR]", err.message);
    }
    return null;
}

function fmtCurrencyIDR(val: number): string {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

function formatSalesRecordReply(data: any): string {
    const records = data?.result?.records || [];
    if (records.length === 0) {
        return `*[NovaPilot AI • Database MCP Penjualan]*\n\n` +
            `⚠️ Tidak ditemukan data pesanan penjualan yang cocok dalam database referensi PostgreSQL (novapilot_mcp_ref).\n` +
            `_Tips: Anda dapat mencari berdasarkan No Pesanan (misal: SO/2026/001), No Faktur (INV/2026/001), nama pelanggan (PT Sumber Makmur), atau produk (baja, pipa, semen)._`;
    }

    let text = `*[NovaPilot AI • Informasi Penjualan & Diskon]*\n`;
    text += `_Ditemukan ${records.length} transaksi resmi via Model Context Protocol (novapilot_mcp_ref):_\n`;

    records.slice(0, 3).forEach((r: any) => {
        text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `📋 *No Pesanan:* \`${r.order_no}\`\n`;
        text += `🧾 *No Faktur:* \`${r.invoice_no}\`\n`;
        text += `🏢 *Pelanggan:* ${r.customer_name} (\`${r.customer_code}\`)\n`;
        text += `🪪 *NPWP:* ${r.customer_tax_id}\n`;
        text += `📦 *Produk:* ${r.product_name} (\`${r.product_code}\`)\n`;
        text += `🏷️ *Kategori:* ${r.product_category}\n`;
        text += `🔢 *Volume:* ${r.quantity} ${r.unit} @ ${fmtCurrencyIDR(r.unit_price)}\n`;
        text += `💵 *Subtotal:* ${fmtCurrencyIDR(r.subtotal)}\n`;
        text += `🎯 *Diskon:* ${r.discount_percent}% (-${fmtCurrencyIDR(r.discount_amount)})\n`;
        text += `📑 *PPN (11%):* ${fmtCurrencyIDR(r.tax_amount)}\n`;
        text += `💰 *TOTAL AKHIR:* *${fmtCurrencyIDR(r.total_price)}*\n`;
        const payIcon = r.payment_status === "PAID" ? "✅ LUNAS" : (r.payment_status === "OVERDUE" ? "⚠️ JATUH TEMPO" : "⏳ BELUM DIBAYAR");
        text += `💳 *Status Bayar:* ${payIcon}\n`;
        text += `🚚 *Status Pengiriman:* ${r.order_status}\n`;
        text += `👤 *Sales Rep:* ${r.sales_rep} (Cabang: ${r.branch_code})\n`;
        if (r.notes) {
            text += `📝 *Catatan:* _${r.notes}_\n`;
        }
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Query dieksekusi secara aman & terisolasi (parameterized SQL, zero-raw risk)._`;
    return text;
}

function formatPricingCatalogReply(data: any): string {
    const products = data?.result?.products || [];
    if (products.length === 0) {
        return `*[NovaPilot AI • Katalog Harga & Plafon Diskon]*\n\n` +
            `⚠️ Produk tidak ditemukan dalam katalog resmi enterprise.\n` +
            `_Coba cari dengan kata kunci: Baja Ringan, Pipa Seamless, Gate Valve, Semen PCC, Plat Baja, Kawat Las._`;
    }

    let text = `*[NovaPilot AI • Katalog Harga & Plafon Diskon]*\n`;
    text += `_Daftar harga resmi enterprise & batas diskon yang diizinkan (novapilot_mcp_ref):_\n`;

    products.forEach((p: any) => {
        text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `📦 *${p.product_name}*\n`;
        text += `🏷️ *Kode SKU:* \`${p.product_code}\` | *Kategori:* ${p.product_category}\n`;
        text += `💰 *Harga Resmi:* *${fmtCurrencyIDR(p.unit_price)}* / ${p.unit}\n`;
        text += `🎯 *Plafon Maksimal Diskon:* *${p.max_allowed_discount_percent}%*\n`;
        text += `🔖 *Diskon Standar:* ${p.standard_discount_applied}%\n`;
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Diskon di atas plafon memerlukan persetujuan khusus supervisor/manager._`;
    return text;
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

// 5. Mock Simulation Runner (Comprehensive Test Suite without physical phone)
async function runMockSimulation() {
    console.log("=============================================================");
    console.log("   NovaPilot AI - Comprehensive ChatOps & MCP Test Suite");
    console.log("=============================================================\n");

    // Test 1: OCR Normalization & Document Extraction
    console.log("--- [TEST 1: OCR Normalization & Invoice Ticket Creation] ---");
    const noisyOCR = "Halo Tim IT On-Call Surabaya, tolong ubah nota |NV / 2O26 / OO1 customer P.T. Sumber Makmur menjadi PT Sumber Makmur Abadi. Bukti terlampir.";
    const cleanedOCR = cleanAndNormalizeOCRText(noisyOCR);
    console.log(`[OCR RAW]       : ${noisyOCR}`);
    console.log(`[OCR NORMALIZED]: ${cleanedOCR}`);
    const extracted = extractTicketData(cleanedOCR);

    if (!extracted) {
        console.error("❌ [TEST 1 FAILED] Extraction logic failed to parse OCR text.");
    } else {
        console.log("✅ [TEST 1 PASSED] Document:", extracted.documentNo, "-> Proposed:", extracted.proposedValue);
        const ticket = await submitTicketToBackend(noisyOCR, extracted, "120363028472918293@g.us", 1);
        if (ticket) {
            console.log(`   Ticket created: ${ticket.ticket_no} (Status: ${ticket.status})`);
        }
    }

    // Test 2: MCP Sales Order Query (PostgreSQL novapilot_mcp_ref)
    console.log("\n--- [TEST 2: MCP Sales Order Query (PostgreSQL novapilot_mcp_ref)] ---");
    const salesQuery = "SO/2026/001";
    console.log(`Querying MCP Tool 'query_sales_records' for: ${salesQuery}...`);
    const salesData = await queryMCPSalesRecords(salesQuery);
    if (salesData && salesData.ok) {
        console.log("✅ [TEST 2 PASSED] MCP Sales Query succeeded!");
        const reply = formatSalesRecordReply(salesData);
        console.log("\n[WhatsApp Formatted Reply]:\n" + reply + "\n");

        await submitInboundMessage({
            platform: "whatsapp",
            sender_id: "6281299887766@s.whatsapp.net",
            sender_name: "Budi Santoso (Cabang Surabaya)",
            raw_message: "Cek data penjualan SO/2026/001 baja ringan",
            media_type: "text",
            classification: "ACTIONABLE",
            extracted_doc: "SO/2026/001",
            extracted_intent: "MCP_SALES_QUERY",
            extracted_target: "SO/2026/001"
        });
    } else {
        console.error("❌ [TEST 2 FAILED] Could not fetch sales records via MCP.");
    }

    // Test 3: MCP Product Pricing & Plafon Diskon Query
    console.log("\n--- [TEST 3: MCP Pricing & Plafon Diskon Catalog] ---");
    const priceQuery = "Pipa";
    console.log(`Querying MCP Tool 'check_product_pricing_discount' for: ${priceQuery}...`);
    const pricingData = await queryMCPProductPricing(priceQuery);
    if (pricingData && pricingData.ok) {
        console.log("✅ [TEST 3 PASSED] MCP Pricing Query succeeded!");
        const reply = formatPricingCatalogReply(pricingData);
        console.log("\n[WhatsApp Formatted Reply]:\n" + reply + "\n");

        await submitInboundMessage({
            platform: "whatsapp",
            sender_id: "6281333444555@s.whatsapp.net",
            sender_name: "Dewi Lestari (Sales Staff)",
            raw_message: "Tolong cek harga dan batas diskon pipa seamless",
            media_type: "text",
            classification: "ACTIONABLE",
            extracted_doc: "PRD-PIPE-02",
            extracted_intent: "MCP_PRICING_QUERY",
            extracted_target: "Pipa Seamless Carbon Steel"
        });
    } else {
        console.error("❌ [TEST 3 FAILED] Could not fetch pricing data via MCP.");
    }

    console.log("\n=============================================================");
    console.log("🎉 All automated simulation tests completed!");
    console.log("Cockpit dashboard at http://localhost:3000/dashboard should now have fresh feed records and triggered sound!");
    console.log("=============================================================\n");
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
                            const rawOcr = (ocrResult.data?.text || "").trim();
                            ocrText = cleanAndNormalizeOCRText(rawOcr);
                            console.log(`[OCR SUCCESS] Extracted ${ocrText.length} characters (Normalized).`);
                            if (ocrText) {
                                console.log(`[OCR CLEANED]: ${ocrText.replace(/\s+/g, ' ').substring(0, 120)}...`);
                            }
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

            // Combine chat body + OCR text for unified semantic extraction
            const combinedText = `${body} ${ocrText}`.trim();
            const normalizedText = cleanAndNormalizeOCRText(combinedText);
            const extracted = extractTicketData(normalizedText);

            const lower = normalizedText.toLowerCase();

            // Detect Sales Orders Intent
            const isSalesQuery = 
                lower.includes("penjualan") || 
                lower.includes("sales order") || 
                lower.includes("so/2026") || 
                lower.includes("cek so") || 
                lower.includes("data so") || 
                lower.includes("status pesanan") ||
                lower.includes("order penjualan");

            // Detect Pricing & Plafon Diskon Intent
            const isPricingQuery = 
                !isSalesQuery &&
                (lower.includes("harga") || lower.includes("diskon") || lower.includes("pricelist") || lower.includes("plafon diskon") || lower.includes("katalog")) &&
                !lower.includes("ubah") && !lower.includes("ganti") && !lower.includes("revisi") && !lower.includes("koreksi");

            let classification = "CASUAL_BANTER";
            let fallbackIntent = "";
            let fallbackTarget = "";
            let mcpSalesReply = "";
            let mcpPricingReply = "";

            if (extracted) {
                classification = "ACTIONABLE";
            } else if (isSalesQuery) {
                classification = "ACTIONABLE";
                fallbackIntent = "MCP_SALES_QUERY";

                // Extract query target: SO/2026/..., INV/2026/..., or keyword (baja, pipa, semen, etc.)
                let searchKw = "";
                const docM = normalizedText.match(/\b(SO[\/\-]\d{4}[\/\-]\d{3,4}|INV[\/\-]\d{4}[\/\-]\d{3,4})\b/i);
                if (docM) {
                    searchKw = docM[1].toUpperCase().replace("-", "/");
                } else {
                    for (const kw of ["baja", "pipa", "valve", "semen", "plat", "kawat"]) {
                        if (lower.includes(kw)) {
                            searchKw = kw;
                            break;
                        }
                    }
                    if (!searchKw) {
                        const kwMatch = normalizedText.match(/(?:penjualan|sales order|order|cek|data)\s+['"]?([^,\.\n\r"']+)['"]?/i);
                        if (kwMatch && kwMatch[1]) {
                            searchKw = kwMatch[1].trim();
                        }
                    }
                }

                fallbackTarget = searchKw || "All Orders";
                console.log(`[MCP SALES QUERY]: Querying PostgreSQL novapilot_mcp_ref for "${searchKw}"...`);
                const mcpData = await queryMCPSalesRecords(searchKw);
                mcpSalesReply = formatSalesRecordReply(mcpData);

            } else if (isPricingQuery) {
                classification = "ACTIONABLE";
                fallbackIntent = "MCP_PRICING_QUERY";

                let productKw = "";
                for (const kw of ["baja", "pipa", "valve", "semen", "plat", "kawat"]) {
                    if (lower.includes(kw)) {
                        productKw = kw;
                        break;
                    }
                }
                if (!productKw) {
                    const priceM = normalizedText.match(/(?:harga|diskon|katalog)\s+['"]?([^,\.\n\r"']+)['"]?/i);
                    if (priceM && priceM[1]) productKw = priceM[1].trim();
                }

                fallbackTarget = productKw || "All Products";
                console.log(`[MCP PRICING QUERY]: Querying pricing catalog for "${productKw}"...`);
                const mcpData = await queryMCPProductPricing(productKw);
                mcpPricingReply = formatPricingCatalogReply(mcpData);

            } else {
                // Check against learned patterns from backend (Self-Learning Loop)
                const learnedPatterns = await fetchLearnedPatterns();
                let patternMatched = false;
                for (const pat of learnedPatterns) {
                    if (!pat.is_active || !pat.regex_pattern) continue;
                    try {
                        const regex = new RegExp(pat.regex_pattern, "i");
                        if (regex.test(normalizedText)) {
                            classification = pat.classification || "NEEDS_REVIEW";
                            fallbackIntent = pat.target_intent || "UPDATE_CUSTOMER_NAME";
                            patternMatched = true;
                            console.log(`[SELF-LEARNING MATCH] Matched learned pattern "${pat.pattern_name}"!`);
                            break;
                        }
                    } catch {}
                }

                if (!patternMatched) {
                    const hasMutationKeyword = lower.includes("ubah") || lower.includes("ganti") || lower.includes("revisi") || lower.includes("koreksi") || lower.includes("bisa diubah");
                    const hasCompanyKeyword = /\b(pt|cv|ud)\b/i.test(normalizedText);
                    const hasImageRef = isImage || lower.includes("gambar") || lower.includes("foto") || lower.includes("lampiran");

                    if (hasMutationKeyword || (hasCompanyKeyword && hasImageRef)) {
                        classification = "NEEDS_REVIEW";
                        fallbackIntent = "UPDATE_CUSTOMER_NAME";
                    }
                }

                const targetMatch = normalizedText.match(/(?:menjadi|ke|to|ubah ke|ganti jadi|koreksi jadi)\s+['"]?([^,\.\n\r"']+)['"]?/i);
                if (targetMatch && targetMatch[1]) {
                    fallbackTarget = targetMatch[1].trim();
                } else {
                    const corpMatch = normalizedText.match(/\b(PT|CV|UD)\s+([A-Za-z0-9\s]{3,35})\b/i);
                    if (corpMatch) {
                        fallbackTarget = `${corpMatch[1].toUpperCase()} ${corpMatch[2].trim()}`;
                    }
                }
            }

            // Ingest to Omnichannel Feed (Real-Time Ingestion for Dashboard Viewers - Triggers Cockpit SSE & Corporate Chime)
            await submitInboundMessage({
                platform: "whatsapp",
                sender_id: fromJid,
                sender_name: senderName,
                raw_message: body,
                media_type: mediaType,
                media_url: mediaUrl,
                ocr_text: ocrText,
                classification: classification,
                extracted_doc: extracted?.documentNo || (isSalesQuery ? fallbackTarget : ""),
                extracted_intent: extracted?.intent || fallbackIntent,
                extracted_target: extracted?.proposedValue || fallbackTarget
            });

            // Dispatch appropriate replies
            if (extracted) {
                console.log(`[DETECTED REQUEST]: Document ${extracted.documentNo} -> ${extracted.proposedValue}`);
                const ticket = await submitTicketToBackend(body, extracted, fromJid);

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
            } else if (mcpSalesReply && AUTO_REPLY) {
                await sock.sendMessage(fromJid, { text: mcpSalesReply });
                console.log(`[MCP SALES SENT] Sent sales records reply to ${fromJid}`);
            } else if (mcpPricingReply && AUTO_REPLY) {
                await sock.sendMessage(fromJid, { text: mcpPricingReply });
                console.log(`[MCP PRICING SENT] Sent pricing catalog reply to ${fromJid}`);
            } else {
                if (classification === "NEEDS_REVIEW") {
                    console.log(`[NEEDS REVIEW]: "${body}" contains mutation intent (${fallbackTarget || 'unknown'}) without full invoice number. Synced to Dashboard Feed for 1-click Staging.`);
                } else {
                    console.log(`[CASUAL BANTER]: "${body}" marked as general conversation.`);
                }
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
