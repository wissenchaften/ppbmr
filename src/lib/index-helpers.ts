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
