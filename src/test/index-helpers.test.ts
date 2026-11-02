import { describe, expect, it } from "vitest";
import {
  buildWhatsAppUrl,
  formatDate,
  stripMarkdownExcerpt,
  parseSearchQuery,
  matchesWorkshopSearch,
} from "@/lib/index-helpers";

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

  describe("parseSearchQuery", () => {
    it("handles empty or whitespace-only queries", () => {
      expect(parseSearchQuery("")).toEqual({
        rawQuery: "",
        effectiveTokens: [],
        isGenericOnly: false,
      });
      expect(parseSearchQuery("   ")).toEqual({
        rawQuery: "",
        effectiveTokens: [],
        isGenericOnly: false,
      });
    });

    it("identifies generic-only queries ('bengkel', 'mobil', 'bengkel mobil')", () => {
      const q1 = parseSearchQuery("bengkel");
      expect(q1.isGenericOnly).toBe(true);
      expect(q1.effectiveTokens).toEqual([]);

      const q2 = parseSearchQuery("  BENGKEL  ");
      expect(q2.isGenericOnly).toBe(true);
      expect(q2.effectiveTokens).toEqual([]);

      const q3 = parseSearchQuery("bengkel mobil");
      expect(q3.isGenericOnly).toBe(true);
      expect(q3.effectiveTokens).toEqual([]);

      const q4 = parseSearchQuery("mobil");
      expect(q4.isGenericOnly).toBe(true);
      expect(q4.effectiveTokens).toEqual([]);
    });

    it("extracts effective tokens when additional keywords are typed after 'bengkel'", () => {
      const q1 = parseSearchQuery("bengkel ac");
      expect(q1.isGenericOnly).toBe(false);
      expect(q1.effectiveTokens).toEqual(["ac"]);

      const q2 = parseSearchQuery("bengkel mobil sukun");
      expect(q2.isGenericOnly).toBe(false);
      expect(q2.effectiveTokens).toEqual(["sukun"]);

      const q3 = parseSearchQuery("bengkel cat oven batu");
      expect(q3.isGenericOnly).toBe(false);
      expect(q3.effectiveTokens).toEqual(["cat", "oven", "batu"]);
    });

    it("filters out stopwords regardless of word position", () => {
      const q = parseSearchQuery("cat oven bengkel batu");
      expect(q.isGenericOnly).toBe(false);
      expect(q.effectiveTokens).toEqual(["cat", "oven", "batu"]);
    });
  });

  describe("matchesWorkshopSearch", () => {
    const mockWorkshopA = {
      name: "Auto Service Sejahtera",
      address: "Jl. Soekarno Hatta No. 12",
      area: "Kota Malang",
      services: ["Servis AC", "Ganti Oli", "Tune Up"],
      description: "Spesialis servis AC dan kelistrikan mobil",
    };

    const mockWorkshopB = {
      name: "Bengkel 99 Sukun",
      address: "Jl. S. Supriadi No. 99",
      area: "Kota Malang",
      services: ["Cat & Body Repair", "Oven"],
      description: "Ahli perbaikan bodi mobil",
    };

    it("matches all workshops when search is empty", () => {
      const parsed = parseSearchQuery("");
      expect(matchesWorkshopSearch(mockWorkshopA, parsed)).toBe(true);
      expect(matchesWorkshopSearch(mockWorkshopB, parsed)).toBe(true);
    });

    it("matches all workshops when user searches only 'bengkel' or 'bengkel mobil'", () => {
      const parsedBengkel = parseSearchQuery("bengkel");
      expect(matchesWorkshopSearch(mockWorkshopA, parsedBengkel)).toBe(true);
      expect(matchesWorkshopSearch(mockWorkshopB, parsedBengkel)).toBe(true);

      const parsedBengkelMobil = parseSearchQuery("bengkel mobil");
      expect(matchesWorkshopSearch(mockWorkshopA, parsedBengkelMobil)).toBe(true);
      expect(matchesWorkshopSearch(mockWorkshopB, parsedBengkelMobil)).toBe(true);
    });

    it("matches only the relevant workshop when searching for subsequent keyword (e.g. 'bengkel ac')", () => {
      const parsedAc = parseSearchQuery("bengkel ac");
      expect(matchesWorkshopSearch(mockWorkshopA, parsedAc)).toBe(true);
      expect(matchesWorkshopSearch(mockWorkshopB, parsedAc)).toBe(false);
    });

    it("supports multi-token AND matching (e.g. 'bengkel 99 sukun')", () => {
      const parsed = parseSearchQuery("bengkel 99 sukun");
      expect(matchesWorkshopSearch(mockWorkshopA, parsed)).toBe(false);
      expect(matchesWorkshopSearch(mockWorkshopB, parsed)).toBe(true);
    });

    it("matches location and service in any token order", () => {
      const parsed = parseSearchQuery("bengkel soekarno ac");
      expect(matchesWorkshopSearch(mockWorkshopA, parsed)).toBe(true);
      expect(matchesWorkshopSearch(mockWorkshopB, parsed)).toBe(false);
    });
  });
});
