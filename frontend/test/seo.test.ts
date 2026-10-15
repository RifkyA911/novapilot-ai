import { describe, expect, it } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

describe("SEO, Metadata & PWA Integrity Tests", () => {
    const staticDir = resolve(__dirname, "../static");
    const appHtmlPath = resolve(__dirname, "../src/app.html");

    it("should have valid favicon.svg with vector attributes", () => {
        const faviconPath = resolve(staticDir, "favicon.svg");
        expect(existsSync(faviconPath)).toBe(true);

        const content = readFileSync(faviconPath, "utf-8");
        expect(content).toContain("<svg");
        expect(content).toContain("xmlns=\"http://www.w3.org/2000/svg\"");
        expect(content).toContain("viewBox=\"0 0 128 128\"");
    });

    it("should have valid og-image.svg with 1200x630 dimensions", () => {
        const ogPath = resolve(staticDir, "og-image.svg");
        expect(existsSync(ogPath)).toBe(true);

        const content = readFileSync(ogPath, "utf-8");
        expect(content).toContain("width=\"1200\"");
        expect(content).toContain("height=\"630\"");
        expect(content).toContain("NovaPilot");
    });

    it("should have valid robots.txt with crawling directives and sitemap", () => {
        const robotsPath = resolve(staticDir, "robots.txt");
        expect(existsSync(robotsPath)).toBe(true);

        const content = readFileSync(robotsPath, "utf-8");
        expect(content).toContain("User-agent: *");
        expect(content).toContain("Allow: /");
        expect(content).toContain("Disallow: /api/");
        expect(content).toContain("Sitemap: https://novapilot.internal/sitemap.xml");
    });

    it("should have valid sitemap.xml with XML urlset and proper priority scores", () => {
        const sitemapPath = resolve(staticDir, "sitemap.xml");
        expect(existsSync(sitemapPath)).toBe(true);

        const content = readFileSync(sitemapPath, "utf-8");
        expect(content).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        expect(content).toContain("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"");
        expect(content).toContain("<loc>https://novapilot.internal/</loc>");
        expect(content).toContain("<loc>https://novapilot.internal/dashboard</loc>");
        expect(content).toContain("<loc>https://novapilot.internal/flow</loc>");
        expect(content).toContain("<priority>1.0</priority>");
    });

    it("should have valid and parseable site.webmanifest", () => {
        const manifestPath = resolve(staticDir, "site.webmanifest");
        expect(existsSync(manifestPath)).toBe(true);

        const content = readFileSync(manifestPath, "utf-8");
        const json = JSON.parse(content);
        expect(json.name).toContain("NovaPilot AI");
        expect(json.short_name).toBe("NovaPilot");
        expect(json.display).toBe("standalone");
        expect(json.icons.length).toBeGreaterThan(0);
    });

    it("should have app.html equipped with OpenGraph, Twitter, and JSON-LD structured data", () => {
        const content = readFileSync(appHtmlPath, "utf-8");
        expect(content).toContain("<meta property=\"og:title\"");
        expect(content).toContain("<meta property=\"og:image\" content=\"/og-image.svg\"");
        expect(content).toContain("<meta name=\"twitter:card\" content=\"summary_large_image\"");
        expect(content).toContain("<meta name=\"twitter:creator\" content=\"@RifkyA911\"");
        expect(content).toContain("application/ld+json");
        expect(content).toContain("\"@type\": \"SoftwareApplication\"");
        expect(content).toContain("\"name\": \"NovaPilot AI\"");
        expect(content).toContain("<link rel=\"icon\" type=\"image/svg+xml\" href=\"/favicon.svg\"");
        expect(content).toContain("<link rel=\"manifest\" href=\"/site.webmanifest\"");
    });
});
