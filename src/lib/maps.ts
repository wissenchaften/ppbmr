export const directionsUrl = (lat: number, lng: number, origin?: { lat: number; lng: number }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` +
  (origin ? `&origin=${origin.lat},${origin.lng}` : "");

export const embedUrl = (lat: number, lng: number, zoom = 15) =>
  `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;

/** Ambil koordinat dari link Google Maps / Google Bisnisku (link panjang). Link pendek maps.app.goo.gl tidak berisi koordinat. */
export function parseMapsLink(link: string): { lat: number; lng: number } | null {
  const s = decodeURIComponent(link.trim());
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|destination|ll|center)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}
