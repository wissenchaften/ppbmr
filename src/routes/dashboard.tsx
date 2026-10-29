import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WorkshopLogo } from "@/components/WorkshopLogo";
import { parseMapsLink } from "@/lib/maps";
import { useServerFn } from "@tanstack/react-start";
import { autofillFromMaps } from "@/lib/autofill.functions";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Bengkel Saya — PPBMR" },
      { name: "description", content: "Kelola profil bengkel dan kirim artikel untuk ditinjau admin." },
      { property: "og:title", content: "Bengkel Saya — PPBMR" },
      { property: "og:description", content: "Dasbor anggota bengkel PPBMR." },
    ],
  }),
  component: Dashboard,
});

const STATUS: Record<string, string> = { pending: "Menunggu review", published: "Terbit", rejected: "Ditolak" };

function Dashboard() {
  const { session, loading } = useAuth();
  const uid = session?.user.id;
  const { data: mine = [] } = useQuery({
    queryKey: ["my-workshops", uid],
    enabled: !!uid,
    queryFn: async () => (await supabase.from("workshops").select("*").eq("owner_id", uid!)).data ?? [],
  });
  const [activeId, setActiveId] = useState<string>();
  const active = mine.find((w) => w.id === activeId) ?? mine[0];

  if (loading) return null;
  if (!session)
    return <div className="mx-auto max-w-3xl px-4 py-12">Silakan <Link to="/auth" className="text-primary font-semibold">masuk</Link> dulu.</div>;
  if (mine.length === 0)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-black text-primary">Bengkel Saya</h1>
        <p className="mt-3 text-muted-foreground">Akun Anda ({session.user.email}) belum terhubung ke bengkel mana pun. Hubungi admin PPBMR untuk menghubungkannya.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-3xl font-black text-primary">Bengkel Saya</h1>
        {mine.length > 1 && mine.map((w) => (
          <Button key={w.id} size="sm" variant={active?.id === w.id ? "default" : "outline"} onClick={() => setActiveId(w.id)}>{w.name}</Button>
        ))}
      </div>
      {active && <ProfileForm w={active} />}
      {active && <ArticleSection w={active} uid={uid!} />}
    </div>
  );
}

const AREAS = ["Kota Malang", "Kabupaten Malang", "Kota Batu"];

function ProfileForm({ w }: { w: Tables<"workshops"> }) {
  const qc = useQueryClient();
  const empty = { name: "", address: "", area: "Kota Malang", services: "", maps_url: "", logo_url: "", organization_profile: "", description: "", benefits: "", phone: "", hours: "", website: "", instagram: "", facebook: "", youtube: "", tiktok: "", whatsapp: "", profile_article: "", promo_title: "", promo_text: "" };
  const [f, setF] = useState(empty);
  useEffect(() => {
    setF({
      name: w.name,
      address: w.address,
      area: w.area,
      services: w.services.join("\n"),
      maps_url: w.maps_url ?? "",
      logo_url: w.logo_url ?? "",
      organization_profile: w.organization_profile ?? "",
      description: w.description ?? "",
      benefits: w.benefits.join("\n"),
      phone: w.phone ?? "",
      hours: w.hours ?? "",
      website: w.website ?? "",
      instagram: w.instagram ?? "",
      facebook: w.facebook ?? "",
      youtube: w.youtube ?? "",
      tiktok: w.tiktok ?? "",
      whatsapp: w.whatsapp ?? "",
      profile_article: w.profile_article ?? "",
      promo_title: w.promo_title ?? "",
      promo_text: w.promo_text ?? "",
    });
  }, [w]);
  const runAutofill = useServerFn(autofillFromMaps);
  const [filling, setFilling] = useState(false);
  const [resolved, setResolved] = useState("");
  async function autofill() {
    setFilling(true);
    try {
      const r = await runAutofill({ data: { mapsUrl: f.maps_url.trim(), website: f.website.trim() || undefined } });
      const s = (k: string) => (typeof r[k] === "string" && (r[k] as string).trim()) || "";
      const a = (k: string) => (Array.isArray(r[k]) ? (r[k] as string[]).join("\n") : "");
      setResolved(s("resolvedUrl"));
      setF((p) => ({
        ...p,
        name: s("name") || p.name, address: s("address") || p.address, phone: s("phone") || p.phone, hours: s("hours") || p.hours,
        services: a("services") || p.services, benefits: a("benefits") || p.benefits,
        organization_profile: s("organization_profile") || p.organization_profile, description: s("description") || p.description,
        profile_article: s("profile_article") || p.profile_article, promo_title: s("promo_title") || p.promo_title, promo_text: s("promo_text") || p.promo_text,
        website: s("website") || p.website, instagram: s("instagram") || p.instagram, facebook: s("facebook") || p.facebook,
        youtube: s("youtube") || p.youtube, tiktok: s("tiktok") || p.tiktok, whatsapp: s("whatsapp") || p.whatsapp,
      }));
      toast.success(s("website") ? "Profil diisi dari Google Maps & website bengkel. Periksa lalu simpan." : "Website bengkel tidak ditemukan; profil diisi dari Google Maps saja.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengisi otomatis");
    } finally { setFilling(false); }
  }
  async function save() {
    let lat = w.lat;
    let lng = w.lng;
    if (f.maps_url.trim()) {
      const point = parseMapsLink(f.maps_url) ?? (resolved ? parseMapsLink(resolved) : null);
      if (!point) {
        toast.error("Link peta tidak berisi titik lokasi. Klik \"Isi otomatis\" dulu atau tempel link Google Maps yang panjang.");
        return;
      }
      lat = point.lat;
      lng = point.lng;
    }
    const { error } = await supabase.from("workshops").update({
      name: f.name.trim() || w.name,
      address: f.address.trim() || w.address,
      area: f.area,
      services: f.services.split("\n").map((s) => s.trim()).filter(Boolean),
      maps_url: f.maps_url.trim() || null,
      lat,
      lng,
      logo_url: f.logo_url || null,
      organization_profile: f.organization_profile,
      description: f.description,
      benefits: f.benefits.split("\n").map((s) => s.trim()).filter(Boolean),
      phone: f.phone,
      hours: f.hours,
      website: f.website.trim() || null,
      instagram: f.instagram.trim() || null,
      facebook: f.facebook.trim() || null,
      youtube: f.youtube.trim() || null,
      tiktok: f.tiktok.trim() || null,
      whatsapp: f.whatsapp.trim() || null,
      profile_article: f.profile_article.trim() || null,
      promo_title: f.promo_title.trim() || null,
      promo_text: f.promo_text.trim() || null,
    }).eq("id", w.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profil disimpan");
    qc.invalidateQueries();
  }
  return (
    <section className="rounded-2xl border p-6">
      <div className="flex items-center gap-4">
        <WorkshopLogo name={f.name || w.name} url={f.logo_url} className="h-16 w-16" />
        <div>
          <h2 className="text-xl font-extrabold">{w.name}</h2>
          <Link to="/bengkel/$slug" params={{ slug: w.slug }} className="text-sm text-primary">Lihat halaman publik →</Link>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div><Label>Nama bengkel</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div>
          <Label>Wilayah</Label>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })}>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2"><Label>Alamat</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
        <div className="sm:col-span-2">
          <Label>Link Google Maps / Google Bisnisku (untuk titik peta)</Label>
          <div className="flex gap-2">
            <Input placeholder="https://www.google.com/maps/place/…" value={f.maps_url} onChange={(e) => setF({ ...f, maps_url: e.target.value })} onBlur={() => { if (f.maps_url.trim() && f.maps_url !== (w.maps_url ?? "")) void autofill(); }} />
            <Button type="button" variant="outline" disabled={filling || !f.maps_url.trim()} onClick={() => void autofill()}>{filling ? "Mengisi…" : "Isi otomatis"}</Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Tempel link Google Maps bengkel. Jika bengkel punya website, profil, layanan, benefit, artikel, promo, dan media sosial diisi otomatis — tetap bisa Anda ubah sebelum menyimpan.</p>
        </div>
        <div className="sm:col-span-2"><Label>URL logo bengkel</Label><Input placeholder="https://…/logo.png" value={f.logo_url} onChange={(e) => setF({ ...f, logo_url: e.target.value })} /></div>
        <div><Label>Telepon</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div><Label>Jam buka</Label><Input value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Layanan (satu per baris)</Label><Textarea rows={3} value={f.services} onChange={(e) => setF({ ...f, services: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Profil organisasi</Label><Textarea rows={4} value={f.organization_profile} onChange={(e) => setF({ ...f, organization_profile: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Deskripsi singkat</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Benefit (satu per baris)</Label><Textarea rows={4} value={f.benefits} onChange={(e) => setF({ ...f, benefits: e.target.value })} /></div>
        <div><Label>Website</Label><Input placeholder="https://…" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></div>
        <div><Label>Instagram</Label><Input placeholder="https://…" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} /></div>
        <div><Label>Facebook</Label><Input placeholder="https://…" value={f.facebook} onChange={(e) => setF({ ...f, facebook: e.target.value })} /></div>
        <div><Label>YouTube</Label><Input placeholder="https://…" value={f.youtube} onChange={(e) => setF({ ...f, youtube: e.target.value })} /></div>
        <div><Label>TikTok</Label><Input placeholder="https://…" value={f.tiktok} onChange={(e) => setF({ ...f, tiktok: e.target.value })} /></div>
        <div><Label>WhatsApp (mis. https://wa.me/62812…)</Label><Input placeholder="https://…" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Artikel profil bengkel</Label><Textarea rows={8} value={f.profile_article} onChange={(e) => setF({ ...f, profile_article: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Judul promo hari ini</Label><Input value={f.promo_title} onChange={(e) => setF({ ...f, promo_title: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Isi promo hari ini</Label><Textarea rows={3} value={f.promo_text} onChange={(e) => setF({ ...f, promo_text: e.target.value })} /></div>
      </div>
      <Button className="mt-4" onClick={save}>Simpan profil</Button>
    </section>
  );
}

function ArticleSection({ w, uid }: { w: Tables<"workshops">; uid: string }) {
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({
    queryKey: ["my-articles", w.id],
    queryFn: async () => (await supabase.from("articles").select("*").eq("workshop_id", w.id).order("created_at", { ascending: false })).data ?? [],
  });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("articles").insert({ workshop_id: w.id, author_id: uid, title, content, cover_url: cover || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Artikel dikirim, menunggu review admin");
    setTitle(""); setContent(""); setCover("");
    qc.invalidateQueries({ queryKey: ["my-articles", w.id] });
  }
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border-2 border-primary/20 p-6">
        <h2 className="text-xl font-extrabold text-primary">Tulis artikel</h2>
        <p className="text-sm text-muted-foreground">Artikel akan ditinjau admin sebelum terbit.</p>
        <div><Label>Judul</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><Label>URL gambar sampul (opsional)</Label><Input value={cover} onChange={(e) => setCover(e.target.value)} /></div>
        <div><Label>Isi artikel</Label><Textarea required rows={8} value={content} onChange={(e) => setContent(e.target.value)} /></div>
        <Button variant="signal">Kirim ke admin</Button>
      </form>
      <div className="space-y-3">
        <h2 className="text-xl font-extrabold">Artikel saya</h2>
        {list.length === 0 && <p className="text-sm text-muted-foreground">Belum ada artikel.</p>}
        {list.map((a) => (
          <div key={a.id} className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">{a.title}</span>
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${a.status === "published" ? "bg-primary text-primary-foreground" : a.status === "rejected" ? "bg-signal text-signal-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {STATUS[a.status]}{a.status === "published" ? ` · ${a.visibility === "public" ? "Semua" : "Anggota"}` : ""}
              </span>
            </div>
            {a.admin_note && <p className="mt-1 text-xs text-muted-foreground">Catatan admin: {a.admin_note}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
