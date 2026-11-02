export interface DirectionsOptions {
  origin?: { lat: number; lng: number } | undefined;
  destinationName?: string | undefined;
  address?: string | undefined;
  placeId?: string | undefined;
}

/**
 * Buat URL petunjuk arah Google Maps.
 * Mendukung tujuan berupa nama/alamat bisnis resmi (POI) atau koordinat gps.
 */
export function directionsUrl(
  lat: number,
  lng: number,
  options?: { lat: number; lng: number } | DirectionsOptions,
): string {
  let origin: { lat: number; lng: number } | undefined;
  let destinationName: string | undefined;
  let placeId: string | undefined;

  if (options) {
    if ("origin" in options || "destinationName" in options || "placeId" in options) {
      origin = options.origin;
      destinationName = options.destinationName;
      placeId = options.placeId;
    } else if ("lat" in options && "lng" in options) {
      origin = options;
    }
  }

  // Jika nama tempat tersedia, gunakan sebagai tujuan agar mengarah langsung ke titik profil bisnis di Google Maps
  const destParam = destinationName ? encodeURIComponent(destinationName) : `${lat},${lng}`;

  let url = `https://www.google.com/maps/dir/?api=1&destination=${destParam}`;
  if (placeId) {
    url += `&destination_place_id=${encodeURIComponent(placeId)}`;
  }
  if (origin) {
    url += `&origin=${origin.lat},${origin.lng}`;
  }
  return url;
}

/**
 * Buat URL embed peta Google Maps keyless.
 * Jika placeName tersedia, tampilkan pin dengan nama bisnis.
 */
export const embedUrl = (lat: number, lng: number, zoom = 15, placeName?: string) => {
  const query = placeName ? encodeURIComponent(`${placeName}, ${lat},${lng}`) : `${lat},${lng}`;
  return `https://maps.google.com/maps?q=${query}&z=${zoom}&output=embed`;
};

/**
 * URL untuk membuka titik bisnis bengkel di Google Maps secara presisi.
 * Memprioritaskan link Google Business/Maps yang sudah ada atau pencarian resmi nama & alamat bisnis.
 */
export function businessMapsUrl({
  mapsUrl,
  name,
  address,
  lat,
  lng,
}: {
  mapsUrl?: string | null;
  name?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
}): string {
  if (mapsUrl?.trim()) return mapsUrl.trim();

  if (name?.trim()) {
    const q = address?.trim() ? `${name.trim()}, ${address.trim()}` : name.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }

  if (lat != null && lng != null) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  return "https://maps.google.com";
}

export interface MapsInfo {
  lat: number | null;
  lng: number | null;
  placeName: string | null;
  placeId: string | null;
  isShortLink: boolean;
}

/**
 * Analisis mendalam URL Google Maps untuk mengekstrak koordinat titik bisnis, nama tempat, dan place_id.
 */
export function parseMapsInfo(link: string): MapsInfo {
  const trimmed = link.trim();
  if (!trimmed) {
    return { lat: null, lng: null, placeName: null, placeId: null, isShortLink: false };
  }

  const isShortLink = /(?:maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(trimmed);
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    /* gunakan raw string jika decode gagal */
  }

  // 1. Ekstrak nama tempat bisnis dari path /place/Nama+Tempat/...
  let placeName: string | null = null;
  const placeMatch = decoded.match(/\/maps\/place\/([^/@?]+)/i);
  if (placeMatch?.[1]) {
    placeName = placeMatch[1].replace(/\+/g, " ").trim();
  }

  // 2. Ekstrak Place ID jika ada
  let placeId: string | null = null;
  const placeIdParam = decoded.match(/(?:destination_place_id|query_place_id)=([^&]+)/i);
  if (placeIdParam?.[1]) {
    placeId = placeIdParam[1];
  } else {
    const cidMatch = decoded.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
    const chijMatch = decoded.match(/!1s(ChIJ[a-zA-Z0-9_-]+)/);
    if (chijMatch?.[1]) {
      placeId = chijMatch[1];
    } else if (cidMatch?.[1]) {
      placeId = cidMatch[1];
    }
  }

  // 3. Ekstrak koordinat:
  // Prioritas A: Koordinat spesifik POI pin (!3d<lat>!4d<lng>)
  const pinMatch = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pinMatch?.[1] && pinMatch?.[2]) {
    const lat = Number(pinMatch[1]);
    const lng = Number(pinMatch[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng, placeName, placeId, isShortLink };
    }
  }

  // Prioritas B: Query koordinat eksplisit (q=lat,lng atau query=lat,lng atau destination=lat,lng)
  const queryCoord = decoded.match(
    /[?&](?:q|query|destination|ll|center|sll)=(?:loc:)?(-?\d+(?:\.\d+)?)[+,\s]+(-?\d+(?:\.\d+)?)/i,
  );
  if (queryCoord?.[1] && queryCoord?.[2]) {
    const lat = Number(queryCoord[1]);
    const lng = Number(queryCoord[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng, placeName, placeId, isShortLink };
    }
  }

  // Prioritas C: Viewport / camera center (@lat,lng)
  const cameraMatch = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (cameraMatch?.[1] && cameraMatch?.[2]) {
    const lat = Number(cameraMatch[1]);
    const lng = Number(cameraMatch[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng, placeName, placeId, isShortLink };
    }
  }

  // Prioritas D: Plain coordinates "lat, lng"
  const plainMatch = decoded.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
  if (plainMatch?.[1] && plainMatch?.[2]) {
    const lat = Number(plainMatch[1]);
    const lng = Number(plainMatch[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng, placeName, placeId, isShortLink };
    }
  }

  return { lat: null, lng: null, placeName, placeId, isShortLink };
}

/** Ambil koordinat dari link Google Maps / Google Bisnisku. Kompatibilitas mundur. */
export function parseMapsLink(link: string): { lat: number; lng: number } | null {
  const info = parseMapsInfo(link);
  if (info.lat != null && info.lng != null) {
    return { lat: info.lat, lng: info.lng };
  }
  return null;
}
