// WhatsApp Message Extractor & Semantic Parser

export interface ExtractionResult {
    documentNo: string;
    proposedValue: string;
    fieldTarget: string;
    intent: string;
    confidence: number;
}

export function extractTicketData(text: string): ExtractionResult | null {
    if (!text) return null;

    // 1. Invoice Pattern Matching: e.g. INV/2026/001, INV-2026-001, NOTA/2026/012
    const docMatch = text.match(/\b(INV[\/\-]\d{4}[\/\-]\d{3}|NOTA[\/\-]\d{4}[\/\-]\d{3})\b/i);
    if (!docMatch) {
        return null;
    }

    const documentNo = docMatch[1].toUpperCase().replace(/-/g, "/");

    // 2. Detect Proposed Value patterns:
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

export function classifyMessage(text: string): "ACTIONABLE" | "NEEDS_REVIEW" | "CASUAL_BANTER" {
    if (!text) return "CASUAL_BANTER";
    const lower = text.toLowerCase();

    if (lower.includes("inv/") || lower.includes("inv-") || lower.includes("nota/")) {
        return "ACTIONABLE";
    }

    if (
        lower.includes("ubah") ||
        lower.includes("ganti") ||
        lower.includes("pt ") ||
        lower.includes("cv ") ||
        lower.includes("gambar") ||
        lower.includes("faktur")
    ) {
        return "NEEDS_REVIEW";
    }

    return "CASUAL_BANTER";
}
