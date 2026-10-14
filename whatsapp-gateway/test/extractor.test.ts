import { describe, expect, it } from "bun:test";
import { extractTicketData, classifyMessage } from "../src/extractor";

describe("WhatsApp Extractor Unit Tests", () => {
    it("should correctly extract ticket data from standard chat format", () => {
        const text = "Halo Tim IT On-Call Surabaya, tolong ubah nama nota INV/2026/001 customer PT Sumber Makmur menjadi PT Sumber Makmur Abadi. Bukti terlampir.";
        const result = extractTicketData(text);

        expect(result).not.toBeNull();
        expect(result?.documentNo).toBe("INV/2026/001");
        expect(result?.proposedValue).toBe("PT Sumber Makmur Abadi");
        expect(result?.intent).toBe("UPDATE_CUSTOMER_NAME");
        expect(result?.fieldTarget).toBe("customer_name");
        expect(result?.confidence).toBeGreaterThan(0.9);
    });

    it("should normalize hyphenated invoice numbers to slash format", () => {
        const text = "Tolong perbaiki faktur INV-2026-004 ke PT Sentosa Raya Prima";
        const result = extractTicketData(text);

        expect(result).not.toBeNull();
        expect(result?.documentNo).toBe("INV/2026/004");
        expect(result?.proposedValue).toBe("PT Sentosa Raya Prima");
    });

    it("should support NOTA document prefix", () => {
        const text = "Nota NOTA/2026/012 tolong ubah ke CV Bintang Terang";
        const result = extractTicketData(text);

        expect(result).not.toBeNull();
        expect(result?.documentNo).toBe("NOTA/2026/012");
        expect(result?.proposedValue).toBe("CV Bintang Terang");
    });

    it("should return null if no invoice number is found", () => {
        const text = "Halo mas, kemarin server down ya?";
        const result = extractTicketData(text);
        expect(result).toBeNull();
    });

    it("should return null if no target proposed value is found", () => {
        const text = "Tolong cek status invoice INV/2026/001 apakah sudah lunas?";
        const result = extractTicketData(text);
        expect(result).toBeNull();
    });

    it("should classify messages accurately", () => {
        expect(classifyMessage("Tolong nota INV/2026/001")).toBe("ACTIONABLE");
        expect(classifyMessage("Tolong ganti nama di faktur gambar ini")).toBe("NEEDS_REVIEW");
        expect(classifyMessage("Pagi pak, mau tanya jadwal shift")).toBe("CASUAL_BANTER");
    });
});
