import { describe, expect, it } from "bun:test";
import { cn, formatCurrency, timeAgo, getNumberFormatter, getDateTimeFormatter } from "../src/lib/utils";

describe("Frontend Utilities & Intl Tests", () => {
    describe("cn (Tailwind class merger)", () => {
        it("should merge classes cleanly", () => {
            const result = cn("p-4", "text-red-500", "bg-white");
            expect(result).toBe("p-4 text-red-500 bg-white");
        });

        it("should resolve tailwind conflict overrides", () => {
            const result = cn("p-2", "p-4", "text-blue-500", "text-emerald-500");
            expect(result).toBe("p-4 text-emerald-500");
        });

        it("should handle conditional and falsy expressions", () => {
            const isDark = true;
            const isMobile = false;
            const result = cn("btn", isDark && "btn-dark", isMobile && "btn-mobile", null, undefined);
            expect(result).toBe("btn btn-dark");
        });
    });

    describe("formatCurrency & Formatter Caching", () => {
        it("should format IDR currency with proper formatting", () => {
            const formatted = formatCurrency(45000000);
            const clean = formatted.replace(/\u00a0/g, " ");
            expect(clean).toContain("Rp");
            expect(clean).toContain("45.000.000");
        });

        it("should handle zero amount", () => {
            const formatted = formatCurrency(0);
            const clean = formatted.replace(/\u00a0/g, " ");
            expect(clean).toContain("Rp");
            expect(clean).toContain("0");
        });

        it("should return identical cached formatter instance for same parameters", () => {
            const f1 = getNumberFormatter("id-ID");
            const f2 = getNumberFormatter("id-ID");
            expect(f1).toBe(f2); // Strict reference equality proves memoization works
        });

        it("should memoize DateTimeFormatter instances", () => {
            const d1 = getDateTimeFormatter("id-ID");
            const d2 = getDateTimeFormatter("id-ID");
            expect(d1).toBe(d2);
        });
    });

    describe("timeAgo with Intl localization", () => {
        it("should format relative seconds in English", () => {
            const recent = new Date(Date.now() - 30 * 1000).toISOString();
            expect(timeAgo(recent, "en")).toMatch(/^\d+s ago$/);
        });

        it("should format relative seconds in Indonesian", () => {
            const recent = new Date(Date.now() - 30 * 1000).toISOString();
            expect(timeAgo(recent, "id")).toMatch(/^\d+ dtk lalu$/);
        });

        it("should format relative minutes in Indonesian", () => {
            const minutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            expect(timeAgo(minutesAgo, "id")).toBe("5 mnt lalu");
        });

        it("should format relative hours in Indonesian", () => {
            const hoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
            expect(timeAgo(hoursAgo, "id")).toBe("3 jam lalu");
        });

        it("should format relative days in Indonesian", () => {
            const daysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
            expect(timeAgo(daysAgo, "id")).toBe("2 hari lalu");
        });
    });
});
