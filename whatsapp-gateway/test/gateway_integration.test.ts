import { describe, expect, it } from "bun:test";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8088";

describe("Gateway to Backend Integration Test", () => {
    it("should successfully ping Backend /api/health", async () => {
        const res = await fetch(`${BACKEND_URL}/api/health`);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.status).toBe("UP");
        expect(data.service).toBe("NovaPilot AI Core");
    });

    it("should dispatch inbound chat message to Backend /api/inbound-messages and receive 201 Created", async () => {
        const payload = {
            platform: "whatsapp",
            sender_id: "6281122334455@s.whatsapp.net",
            sender_name: "Budi Santoso (Gateway Integration)",
            raw_message: "Halo admin, minta tolong ubah customer faktur INV/2026/003 menjadi CV Bintang Timur Gemilang",
            media_type: "text",
            classification: "ACTIONABLE",
            extracted_doc: "INV/2026/003",
            extracted_intent: "UPDATE_CUSTOMER_NAME",
            extracted_target: "CV Bintang Timur Gemilang"
        };

        const res = await fetch(`${BACKEND_URL}/api/inbound-messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        expect(res.status).toBe(201);
        const savedMsg = await res.json();

        expect(savedMsg.id).toBeGreaterThan(0);
        expect(savedMsg.platform).toBe("whatsapp");
        expect(savedMsg.extracted_doc).toBe("INV/2026/003");
        expect(savedMsg.extracted_target).toBe("CV Bintang Timur Gemilang");
        expect(savedMsg.classification).toBe("ACTIONABLE");
    });

    it("should retrieve the newly submitted inbound message from Backend List endpoint", async () => {
        const res = await fetch(`${BACKEND_URL}/api/inbound-messages?platform=whatsapp&limit=5`);
        expect(res.status).toBe(200);

        const list = await res.json();
        expect(Array.isArray(list)).toBe(true);
        expect(list.length).toBeGreaterThan(0);

        const hasTestMessage = list.some((m: any) => m.extracted_doc === "INV/2026/003");
        expect(hasTestMessage).toBe(true);
    });
});
