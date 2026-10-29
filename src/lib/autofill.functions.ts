import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findLinks(html: string) {
  const urls = Array.from(new Set(html.match(/https?:\/\/[^\s"'<>\\)]+/g) ?? []));
  const pick = (re: RegExp) => urls.find((u) => re.test(u)) ?? "";
  return {
    instagram: pick(/instagram\.com\/(?!p\/|explore)/i),
    facebook: pick(/facebook\.com\/(?!sharer|tr\b|plugins)/i),
    youtube: pick(/youtube\.com\/(@|channel|c\/)/i),
    tiktok: pick(/tiktok\.com\/@/i),
    whatsapp: pick(/(wa\.me|api\.whatsapp\.com)\//i),
  };
}

export const autofillFromMaps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ mapsUrl: z.string().url().max(2000), website: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Layanan AI belum tersedia");

    // 1. Buka link Google Maps (link pendek ikut diarahkan ke link panjang)
    let resolvedUrl = data.mapsUrl;
    let mapsText = "";
    try {
      const r = await fetch(data.mapsUrl, { redirect: "follow", headers: { "User-Agent": UA, "Accept-Language": "id-ID,id" } });
      resolvedUrl = r.url || data.mapsUrl;
      const html = await r.text();
      mapsText = html.slice(0, 200000);
    } catch { /* abaikan */ }

    // 2. Cari website bengkel
    let website = data.website?.trim() || "";
    if (!website) {
      const cands = (mapsText.match(/https?:\/\/(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}[^\s"'\\<>]*/gi) ?? [])
        .filter((u) => !/google|gstatic|ggpht|googleapis|schema\.org|w3\.org|youtube\.com|facebook\.com|instagram\.com/i.test(u));
      website = cands[0]?.replace(/\\u003d/g, "=").replace(/\\u0026/g, "&") ?? "";
    }

    let siteText = "";
    let links = { instagram: "", facebook: "", youtube: "", tiktok: "", whatsapp: "" };
    if (website) {
      try {
        const r = await fetch(website, { redirect: "follow", headers: { "User-Agent": UA } });
        const html = await r.text();
        links = findLinks(html);
        siteText = htmlToText(html).slice(0, 12000);
      } catch { website = ""; }
    }

    const titleMatch = mapsText.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
    const descMatch = mapsText.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);

    // 3. Minta AI menyusun isian profil
    const prompt = `Susun profil bengkel dalam Bahasa Indonesia dari data berikut. Jangan mengarang data faktual (telepon, alamat, jam) yang tidak ada; kosongkan jika tidak ada.
Link Google Maps: ${resolvedUrl}
Judul Maps: ${titleMatch?.[1] ?? ""}
Deskripsi Maps: ${descMatch?.[1] ?? ""}
Website: ${website || "(tidak ada)"}
Isi website: ${siteText || "(tidak ada)"}`;

    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "isi_profil",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" }, address: { type: "string" }, phone: { type: "string" }, hours: { type: "string" },
                services: { type: "array", items: { type: "string" } },
                benefits: { type: "array", items: { type: "string" } },
                organization_profile: { type: "string" }, description: { type: "string" },
                profile_article: { type: "string", description: "Artikel profil 2-4 paragraf" },
                promo_title: { type: "string" }, promo_text: { type: "string" },
              },
              required: ["name"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "isi_profil" } },
      }),
    });
    if (ai.status === 429) throw new Error("Terlalu banyak permintaan, coba lagi sebentar.");
    if (ai.status === 402) throw new Error("Kuota AI habis.");
    if (!ai.ok) throw new Error(`AI gagal [${ai.status}]: ${await ai.text()}`);
    const json = await ai.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : {};

    return { ...parsed, website, ...links, resolvedUrl } as Record<string, string | string[] | undefined>;
  });
