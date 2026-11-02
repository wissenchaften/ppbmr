import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl, formatDate, stripMarkdownExcerpt } from "@/lib/index-helpers";

describe("index-helpers", () => {
  describe("buildWhatsAppUrl", () => {
    it("returns null when phone/wa is empty or undefined", () => {
      expect(buildWhatsAppUrl(null)).toBeNull();
      expect(buildWhatsAppUrl(undefined)).toBeNull();
      expect(buildWhatsAppUrl("")).toBeNull();
      expect(buildWhatsAppUrl("   ")).toBeNull();
    });

    it("formats 08xx number to 628xx with prefilled inquiry message", () => {
      const url = buildWhatsAppUrl("081234567890", "Bengkel Berkah");
      expect(url).toContain("https://wa.me/6281234567890?text=");
      expect(url).toContain(encodeURIComponent("Halo Bengkel Berkah"));
    });

    it("keeps 62xx prefix when already present", () => {
      const url = buildWhatsAppUrl("+62 812-9876-5432", "Bengkel Maju");
      expect(url).toContain("https://wa.me/6281298765432");
      expect(url).toContain(encodeURIComponent("Bengkel Maju"));
    });

    it("strips parentheses, dashes, and extra whitespace correctly", () => {
      const url = buildWhatsAppUrl("(0341) 555-123", "Bengkel Malang");
      expect(url).toContain("https://wa.me/62341555123");
    });
  });

  describe("formatDate", () => {
    it("returns empty string for null or undefined", () => {
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
      expect(formatDate("invalid-date")).toBe("");
    });

    it("formats valid ISO date into Indonesian format", () => {
      const formatted = formatDate("2026-11-03T10:00:00Z");
      // Expecting day, month (Nov), and year (2026)
      expect(formatted).toContain("2026");
      expect(formatted).toMatch(/Nov/i);
    });
  });

  describe("stripMarkdownExcerpt", () => {
    it("returns empty string for empty input", () => {
      expect(stripMarkdownExcerpt("")).toBe("");
    });

    it("strips markdown headers, bold, italics, and links", () => {
      const raw =
        "### Tips Merawat Mesin\n\nSelalu ganti oli secara **rutin** dan gunakan [filter berkualitas](https://example.com).";
      const excerpt = stripMarkdownExcerpt(raw, 200);
      expect(excerpt).not.toContain("###");
      expect(excerpt).not.toContain("**");
      expect(excerpt).not.toContain("https://example.com");
      expect(excerpt).toContain("Tips Merawat Mesin");
      expect(excerpt).toContain("rutin");
    });

    it("truncates content with ellipsis when exceeding maxLen", () => {
      const longText =
        "Ini adalah artikel yang sangat panjang tentang bagaimana cara merawat mobil Anda di musim hujan agar tidak mudah berkarat pada bagian kolong dan roda.";
      const excerpt = stripMarkdownExcerpt(longText, 40);
      expect(excerpt.endsWith("…")).toBe(true);
      expect(excerpt.length).toBeLessThanOrEqual(42);
    });
  });
});
