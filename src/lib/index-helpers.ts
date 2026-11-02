/**
 * Helper functions for the main workshop directory / home page (/index.tsx).
 */

/**
 * Normalizes phone or WhatsApp string to a direct WhatsApp API URL with a polite inquiry message.
 */
export function buildWhatsAppUrl(
  phoneOrWa: string | null | undefined,
  workshopName: string = "Bengkel",
): string | null {
  if (!phoneOrWa) return null;
  const digits = phoneOrWa.trim().replace(/\D/g, "");
  if (!digits) return null;
  const fullNumber = digits.startsWith("62")
    ? digits
    : digits.startsWith("0")
      ? `62${digits.slice(1)}`
      : digits;
  const message = encodeURIComponent(
    `Halo ${workshopName}, saya melihat informasi bengkel Anda di portal PPBMR Malang Raya. Saya ingin konsultasi / servis kendaraan.`,
  );
  return `https://wa.me/${fullNumber}?text=${message}`;
}

/**
 * Formats an ISO date string to Indonesian localized date format.
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Strips markdown symbols from article content and generates a clean excerpt.
 */
export function stripMarkdownExcerpt(content: string, maxLen = 120): string {
  if (!content) return "";
  const plain = content
    .replace(/[#*`_~>[\]]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLen ? `${plain.slice(0, maxLen)}…` : plain;
}

/**
 * Generic directory category stopwords.
 * Typing these alone will display all workshops, and typing them followed by
 * another keyword will strip them and match on the subsequent keywords.
 */
export const CATEGORY_STOPWORDS = new Set(["bengkel", "mobil"]);

export interface ParsedSearchQuery {
  rawQuery: string;
  effectiveTokens: string[];
  isGenericOnly: boolean;
}

/**
 * Parses user search query:
 * - Lowercases and trims input.
 * - Extracts tokens.
 * - Identifies whether the search contains only generic category stopwords.
 * - Isolates effective search tokens.
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return { rawQuery: "", effectiveTokens: [], isGenericOnly: false };
  }

  const allTokens = trimmed.split(/\s+/).filter(Boolean);
  const effectiveTokens = allTokens.filter((token) => !CATEGORY_STOPWORDS.has(token));

  const isGenericOnly = allTokens.length > 0 && effectiveTokens.length === 0;

  return {
    rawQuery: trimmed,
    effectiveTokens,
    isGenericOnly,
  };
}

/**
 * Checks if a workshop matches the parsed search query using flexible multi-token AND logic.
 */
export function matchesWorkshopSearch(
  workshop: {
    name: string;
    address: string;
    area?: string | null;
    services: string[];
    description?: string | null;
  },
  parsed: ParsedSearchQuery,
): boolean {
  // If query is empty or purely generic stopwords ("bengkel", "mobil", "bengkel mobil"),
  // all workshops match!
  if (parsed.effectiveTokens.length === 0) {
    return true;
  }

  const searchableText =
    `${workshop.name} ${workshop.address} ${workshop.area ?? ""} ${workshop.services.join(" ")} ${workshop.description ?? ""}`.toLowerCase();

  // Multi-token AND logic: every effective token must be present in the workshop details
  return parsed.effectiveTokens.every((token) => searchableText.includes(token));
}
