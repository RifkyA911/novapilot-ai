import { describe, expect, it } from "bun:test";
import { cn, formatCurrency, timeAgo } from "../src/lib/utils";

describe("Frontend Utilities Unit Tests", () => {
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

    describe("formatCurrency", () => {
        it("should format IDR currency with proper formatting", () => {
            const formatted = formatCurrency(45000000);
            // Replace non-breaking spaces (\u00a0) if present
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
    });

    describe("timeAgo", () => {
        it("should format relative seconds", () => {
            const recent = new Date(Date.now() - 30 * 1000).toISOString();
            expect(timeAgo(recent)).toMatch(/^\d+s ago$/);
        });

        it("should format relative minutes", () => {
            const minutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            expect(timeAgo(minutesAgo)).toMatch(/^\d+m ago$/);
        });

        it("should format relative hours", () => {
            const hoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
            expect(timeAgo(hoursAgo)).toMatch(/^\d+h ago$/);
        });

        it("should format relative days", () => {
            const daysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
            expect(timeAgo(daysAgo)).toMatch(/^\d+d ago$/);
        });
    });
});
