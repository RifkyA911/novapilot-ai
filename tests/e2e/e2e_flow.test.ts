import { describe, expect, it } from "bun:test";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8088";
const GATEWAY_URL = process.env.WA_GATEWAY_URL || "http://localhost:3002";

describe("NovaPilot AI — Full Omnichannel E2E System Test", () => {
    describe("Service Liveness & Health Verification", () => {
        it("Frontend Web Server should be serving HTTP 200 OK", async () => {
            const res = await fetch(FRONTEND_URL);
            expect(res.status).toBe(200);
            const html = await res.text();
            expect(html.length).toBeGreaterThan(100);
            expect(html.toLowerCase()).toContain("<!doctype html>");
        });

        it("Go Core Backend API should be healthy", async () => {
            const res = await fetch(`${BACKEND_URL}/api/health`);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.status).toBe("UP");
            expect(data.service).toBe("NovaPilot AI Core");
        });

        it("WhatsApp Gateway Daemon should be active and running", async () => {
            const res = await fetch(`${GATEWAY_URL}/api/health`);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.message).toContain("WhatsApp Gateway Daemon");
        });

        it("Backend Telemetry should report host network and DB status", async () => {
            const res = await fetch(`${BACKEND_URL}/api/telemetry`);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.lan_ip).toBeDefined();
            expect(data.database).toBeDefined();
        });

        it("Hermes LLM Extraction Engine should process unstructured natural language chat", async () => {
            const res = await fetch(`${BACKEND_URL}/api/llm/process`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: "Halo tim IT on-call, tolong ubah customer nota INV/2026/001 jadi PT Sumber Makmur Abadi ya.",
                    branch_context: "Surabaya Regional Hub"
                })
            });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.tool_call).toBeDefined();
            expect(data.tool_call.name).toBe("stage_invoice_update");
            expect(data.tool_call.arguments.document_no).toBe("INV/2026/001");
            expect(data.thought).toBeDefined();
        }, 15000);
    });

    describe("End-to-End ChatOps Approval & Mutation Workflow", () => {
        let createdMessageId: number;
        let createdTicketId: number;
        let ticketNumber: string;

        it("Phase 1: WhatsApp Inbound Message Ingestion", async () => {
            const inboundPayload = {
                platform: "whatsapp",
                sender_id: "6281987654321@s.whatsapp.net",
                sender_name: "Surabaya Store Admin (E2E Test)",
                raw_message: "Halo tim IT On-Call, tolong ubah nama nota INV/2026/002 menjadi PT Karya Abadi Sentosa Bersama. Makasih!",
                media_type: "text",
                classification: "ACTIONABLE",
                extracted_doc: "INV/2026/002",
                extracted_intent: "UPDATE_CUSTOMER_NAME",
                extracted_target: "PT Karya Abadi Sentosa Bersama"
            };

            const res = await fetch(`${BACKEND_URL}/api/inbound-messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inboundPayload)
            });

            expect(res.status).toBe(201);
            const data = await res.json();
            expect(data.id).toBeGreaterThan(0);
            expect(data.extracted_doc).toBe("INV/2026/002");
            expect(data.extracted_target).toBe("PT Karya Abadi Sentosa Bersama");

            createdMessageId = data.id;
        });

        it("Phase 2: Stage Approval Ticket from Inbound Message", async () => {
            expect(createdMessageId).toBeGreaterThan(0);

            const stagePayload = {
                document_no: "INV/2026/002",
                proposed_value: "PT Karya Abadi Sentosa Bersama",
                branch_id: 1
            };

            const res = await fetch(`${BACKEND_URL}/api/inbound-messages/${createdMessageId}/stage-ticket`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(stagePayload)
            });

            expect(res.status).toBe(201);
            const ticket = await res.json();

            expect(ticket.id).toBeGreaterThan(0);
            expect(ticket.document_no).toBe("INV/2026/002");
            expect(ticket.status).toBe("PENDING_APPROVAL");
            expect(ticket.proposed_value).toBe("PT Karya Abadi Sentosa Bersama");

            createdTicketId = ticket.id;
            ticketNumber = ticket.ticket_no;
        });

        it("Phase 3: Supervisor Approval & Atomic Database Mutation", async () => {
            expect(createdTicketId).toBeGreaterThan(0);

            const approvePayload = {
                approver_name: "Chief IT Auditor (E2E Test)"
            };

            const res = await fetch(`${BACKEND_URL}/api/tickets/${createdTicketId}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(approvePayload)
            });

            expect(res.status).toBe(200);
            const executedTicket = await res.json();

            expect(executedTicket.status).toBe("EXECUTED");
            expect(executedTicket.approved_by).toBe("Chief IT Auditor (E2E Test)");
        });

        it("Phase 4: Database State Verification (Invoice mutated safely)", async () => {
            const res = await fetch(`${BACKEND_URL}/api/invoices`);
            expect(res.status).toBe(200);

            const invoices = await res.json();
            const targetInvoice = invoices.find((inv: any) => inv.invoice_no === "INV/2026/002");

            expect(targetInvoice).toBeDefined();
            expect(targetInvoice.customer_name).toBe("PT Karya Abadi Sentosa Bersama");
        });

        it("Phase 5: Audit Log Trail Verification", async () => {
            const res = await fetch(`${BACKEND_URL}/api/audit-logs`);
            expect(res.status).toBe(200);

            const logs = await res.json();
            const auditEntry = logs.find(
                (l: any) => l.ticket_id === createdTicketId && l.action === "APPROVED_AND_MUTATED"
            );

            expect(auditEntry).toBeDefined();
            expect(auditEntry.performed_by).toBe("Chief IT Auditor (E2E Test)");
            expect(auditEntry.new_state).toContain("PT Karya Abadi Sentosa Bersama");
        });
    });
});
