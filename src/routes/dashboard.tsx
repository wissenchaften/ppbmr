import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  BookOpen,
  Sparkles,
  ExternalLink,
  Plus,
  MapPin,
  Clock,
  Phone,
  Share2,
  FileText,
  AlertCircle,
  ArrowLeft,
  Edit3,
  Trash2,
  Info,
} from "lucide-react";
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
import { ImageUploader } from "@/components/ImageUploader";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { TagInput } from "@/components/TagInput";
import { WorkshopLogoUploader } from "@/components/WorkshopLogoUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteArticleCover } from "@/lib/storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DashboardSearchParams {
  tab?: "profile" | "articles";
  sub?: "list" | "write";
}

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): DashboardSearchParams => ({
    tab: search["tab"] === "articles" ? "articles" : "profile",
    sub: search["sub"] === "write" ? "write" : "list",
  }),
  head: () => ({
    meta: [
      { title: "Bengkel Saya — PPBMR" },
      {
        name: "description",
        content: "Kelola profil bengkel dan kirim artikel untuk ditinjau admin.",
      },
      { property: "og:title", content: "Bengkel Saya — PPBMR" },
      { property: "og:description", content: "Dasbor anggota bengkel PPBMR." },
    ],
  }),
  component: Dashboard,
});

const DEFAULT_STATUS = {
  label: "Menunggu Review",
  className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
} as const;

const STATUS: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draf",
    className: "bg-muted text-muted-foreground border-border",
  },
  pending: DEFAULT_STATUS,
  published: {
    label: "Terbit",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  rejected: {
    label: "Ditolak",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

function Dashboard() {
  const { session, loading } = useAuth();
  const navigate = Route.useNavigate();
  const { tab = "profile", sub = "list" } = Route.useSearch();
  const uid = session?.user.id;

  const { data: mine = [] } = useQuery({
    queryKey: ["my-workshops", uid],
    enabled: !!uid,
    queryFn: async () =>
      (await supabase.from("workshops").select("*").eq("owner_id", uid!)).data ?? [],
  });

  const [activeId, setActiveId] = useState<string>();
  const active = mine.find((w) => w.id === activeId) ?? mine[0];

  const handleTabChange = (nextTab: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        tab: nextTab === "articles" ? "articles" : "profile",
      }),
      replace: true,
    });
  };

  const handleSubChange = (nextSub: "list" | "write") => {
    navigate({
      search: (prev) => ({
        ...prev,
        tab: "articles",
        sub: nextSub,
      }),
      replace: true,
    });
  };

  if (loading) return null;
  if (!session)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-primary">Akses Terbatas</h1>
        <p className="mt-2 text-muted-foreground">
          Silakan masuk terlebih dahulu untuk mengelola bengkel Anda.
        </p>
        <Link to="/auth" className="mt-4 inline-block font-semibold text-primary underline">
          Masuk Sekarang →
        </Link>
      </div>
    );

  if (mine.length === 0)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-3xl font-black text-primary">Bengkel Belum Terhubung</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Akun Anda (<span className="font-semibold text-foreground">{session.user.email}</span>)
          belum dihubungkan ke bengkel terdaftar. Silakan hubungi pengurus PPBMR agar akun Anda
          diberi akses.
        </p>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      {/* Workshop Switcher (if user owns multiple workshops) */}
      {mine.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-2">
          <span className="text-xs font-bold text-muted-foreground pl-2">Pilih Bengkel:</span>
          {mine.map((w) => (
            <Button
              key={w.id}
              size="sm"
              variant={active?.id === w.id ? "default" : "ghost"}
              onClick={() => setActiveId(w.id)}
              className="text-xs font-bold"
            >
              {w.name}
            </Button>
          ))}
        </div>
      )}

      {/* Hero Summary Card */}
      {active && (
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <WorkshopLogo
                name={active.name}
                url={active.logo_url}
                className="h-16 w-16 rounded-2xl shadow-xs shrink-0"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-foreground">
                    {active.name}
                  </h1>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    Anggota PPBMR
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {active.area}
                  </span>
                  {active.hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {active.hours}
                    </span>
                  )}
                  {active.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {active.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 self-start sm:self-center font-bold"
            >
              <Link to="/bengkel/$slug" params={{ slug: active.slug }}>
                Lihat Halaman Publik <ExternalLink className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 p-1 rounded-2xl bg-muted/60 h-12">
          <TabsTrigger
            value="profile"
            className="rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs"
          >
            <Building2 className="mr-2 h-4 w-4" /> Profil & Informasi Bengkel
          </TabsTrigger>
          <TabsTrigger
            value="articles"
            className="rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs"
          >
            <BookOpen className="mr-2 h-4 w-4" /> Artikel Bengkel
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profil Bengkel */}
        <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
          {active && <ProfileForm w={active} uid={uid!} />}
        </TabsContent>

        {/* Tab 2: Artikel Bengkel */}
        <TabsContent value="articles" className="mt-0 focus-visible:outline-none">
          {active && (
            <ArticleSection w={active} uid={uid!} sub={sub} onSubChange={handleSubChange} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const AREAS = ["Kota Malang", "Kabupaten Malang", "Kota Batu"];

function ProfileForm({ w, uid }: { w: Tables<"workshops">; uid: string }) {
  const qc = useQueryClient();
  const empty = {
    name: "",
    address: "",
    area: "Kota Malang",
    services: "",
    maps_url: "",
    logo_url: "",
    organization_profile: "",
    description: "",
    benefits: "",
    phone: "",
    hours: "",
    website: "",
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
    whatsapp: "",
    profile_article: "",
    promo_title: "",
    promo_text: "",
  };

  const [f, setF] = useState(empty);
  const [isSaving, setIsSaving] = useState(false);

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
      const r = await runAutofill({
        data: { mapsUrl: f.maps_url.trim(), website: f.website.trim() || undefined },
      });
      const s = (k: string) => (typeof r[k] === "string" && (r[k] as string).trim()) || "";
      const a = (k: string) => (Array.isArray(r[k]) ? (r[k] as string[]).join("\n") : "");
      setResolved(s("resolvedUrl"));
      setF((p) => ({
        ...p,
        name: s("name") || p.name,
        address: s("address") || p.address,
        phone: s("phone") || p.phone,
        hours: s("hours") || p.hours,
        services: a("services") || p.services,
        benefits: a("benefits") || p.benefits,
        organization_profile: s("organization_profile") || p.organization_profile,
        description: s("description") || p.description,
        profile_article: s("profile_article") || p.profile_article,
        promo_title: s("promo_title") || p.promo_title,
        promo_text: s("promo_text") || p.promo_text,
        website: s("website") || p.website,
        instagram: s("instagram") || p.instagram,
        facebook: s("facebook") || p.facebook,
        youtube: s("youtube") || p.youtube,
        tiktok: s("tiktok") || p.tiktok,
        whatsapp: s("whatsapp") || p.whatsapp,
      }));
      toast.success(
        s("website")
          ? "Profil berhasil diisi otomatis dari Google Maps & website bengkel!"
          : "Website bengkel tidak ditemukan; profil diisi dari Google Maps saja.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengisi otomatis");
    } finally {
      setFilling(false);
    }
  }

  async function save() {
    setIsSaving(true);
    let lat = w.lat;
    let lng = w.lng;
    if (f.maps_url.trim()) {
      if (f.maps_url.trim() !== (w.maps_url ?? "").trim() || lat == null || lng == null) {
        const point = parseMapsLink(f.maps_url) ?? (resolved ? parseMapsLink(resolved) : null);
        if (!point) {
          toast.error(
            'Link peta tidak berisi titik lokasi. Klik "Isi otomatis" dulu atau tempel link Google Maps yang panjang.',
          );
          setIsSaving(false);
          return;
        }
        lat = point.lat;
        lng = point.lng;
      } else if (resolved) {
        const point = parseMapsLink(resolved);
        if (point) {
          lat = point.lat;
          lng = point.lng;
        }
      }
    }

    const { error } = await supabase
      .from("workshops")
      .update({
        name: f.name.trim() || w.name,
        address: f.address.trim() || w.address,
        area: f.area,
        services: f.services
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        maps_url: f.maps_url.trim() || null,
        lat,
        lng,
        logo_url: f.logo_url || null,
        organization_profile: f.organization_profile,
        description: f.description,
        benefits: f.benefits
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
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
      })
      .eq("id", w.id);

    setIsSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profil bengkel berhasil disimpan!");
    qc.invalidateQueries();
  }

  return (
    <div className="space-y-8">
      {/* Kartu 1: Identitas & Lokasi */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Identitas & Lokasi Bengkel</h2>
            <p className="text-xs text-muted-foreground">
              Informasi nama resmi, logo, wilayah, dan titik koordinat peta.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">Nama Bengkel</Label>
            <Input
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              placeholder="Nama bengkel Anda"
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Wilayah / Area</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={f.area}
              onChange={(e) => setF({ ...f, area: e.target.value })}
            >
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Alamat Lengkap</Label>
            <Input
              value={f.address}
              onChange={(e) => setF({ ...f, address: e.target.value })}
              placeholder="Contoh: Jl. Soekarno Hatta No. 12, Lowokwaru"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <Label>Link Google Maps / Google Bisnisku</Label>
              <span className="text-xs text-muted-foreground">Otomatis mengisi data bengkel</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="https://maps.app.goo.gl/… atau https://www.google.com/maps/place/…"
                value={f.maps_url}
                onChange={(e) => setF({ ...f, maps_url: e.target.value })}
                onBlur={() => {
                  if (f.maps_url.trim() && f.maps_url !== (w.maps_url ?? "")) void autofill();
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={filling || !f.maps_url.trim()}
                onClick={() => void autofill()}
                className="shrink-0 gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-signal" />
                {filling ? "Mengisi…" : "Isi Otomatis"}
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Tempel link Google Maps untuk menentukan titik arah navigasi. Jika bengkel Anda
              memiliki Google Business Profile, sistem akan mengekstrak informasi secara otomatis.
            </p>
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Logo Bengkel</Label>
            <WorkshopLogoUploader
              value={f.logo_url}
              onChange={(url) => setF({ ...f, logo_url: url })}
              workshopId={w.id}
              userId={uid}
              workshopName={f.name || w.name}
              disabled={isSaving}
            />
          </div>
        </div>
      </section>

      {/* Kartu 2: Layanan & Jam Operasional */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Layanan & Jam Operasional</h2>
            <p className="text-xs text-muted-foreground">
              Jadwal buka dan daftar spesialisasi servis yang ditawarkan.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">Jam Operasional</Label>
            <Input
              placeholder="Contoh: 08.00–17.00"
              value={f.hours}
              onChange={(e) => setF({ ...f, hours: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Deskripsi Singkat / Slogan</Label>
            <Input
              placeholder="Contoh: Spesialis kaki-kaki & AC mobil terpercaya"
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Layanan Unggulan (Satu layanan per baris)</Label>
            <Textarea
              rows={4}
              value={f.services}
              onChange={(e) => setF({ ...f, services: e.target.value })}
              placeholder={"Ganti Oli & Filter\nTune Up Mesin\nSpooring & Balancing\nServis AC"}
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">
              Fasilitas & Keuntungan Pelanggan (Satu per baris)
            </Label>
            <Textarea
              rows={3}
              value={f.benefits}
              onChange={(e) => setF({ ...f, benefits: e.target.value })}
              placeholder={
                "Garansi Servis 14 Hari\nRuang Tunggu Ber-AC & WiFi\nGratis Cek 20 Titik Kendaraan"
              }
            />
          </div>
        </div>
      </section>

      {/* Kartu 3: Kontak & Media Sosial */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Kontak & Media Sosial</h2>
            <p className="text-xs text-muted-foreground">
              Kanal komunikasi agar calon pelanggan dapat berkonsultasi atau memesan jadwal.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">WhatsApp (Format: https://wa.me/628...)</Label>
            <Input
              placeholder="https://wa.me/628123456789"
              value={f.whatsapp}
              onChange={(e) => setF({ ...f, whatsapp: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Nomor Telepon Kantor / Bengkel</Label>
            <Input
              placeholder="0341-555101"
              value={f.phone}
              onChange={(e) => setF({ ...f, phone: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Website Resmi</Label>
            <Input
              placeholder="https://bengkelanda.com"
              value={f.website}
              onChange={(e) => setF({ ...f, website: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Instagram</Label>
            <Input
              placeholder="https://instagram.com/bengkelanda"
              value={f.instagram}
              onChange={(e) => setF({ ...f, instagram: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Facebook</Label>
            <Input
              placeholder="https://facebook.com/bengkelanda"
              value={f.facebook}
              onChange={(e) => setF({ ...f, facebook: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">YouTube</Label>
            <Input
              placeholder="https://youtube.com/@bengkelanda"
              value={f.youtube}
              onChange={(e) => setF({ ...f, youtube: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">TikTok</Label>
            <Input
              placeholder="https://tiktok.com/@bengkelanda"
              value={f.tiktok}
              onChange={(e) => setF({ ...f, tiktok: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Kartu 4: Promo Hari Ini & Cerita Profil */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Promo Hari Ini & Cerita Bengkel</h2>
            <p className="text-xs text-muted-foreground">
              Sorotan penawaran spesial dan artikel narasi profil bengkel Anda.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Judul Promo Spesial</Label>
            <Input
              placeholder="Contoh: Diskon 20% Tune Up & Cek Rem Gratis!"
              value={f.promo_title}
              onChange={(e) => setF({ ...f, promo_title: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Detail Isi Promo</Label>
            <Textarea
              rows={3}
              placeholder="Rincian syarat dan ketentuan promo yang sedang berlangsung..."
              value={f.promo_text}
              onChange={(e) => setF({ ...f, promo_text: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Artikel Profil Bengkel (Cerita & Sejarah)</Label>
            <Textarea
              rows={6}
              placeholder="Ceritakan sejarah bengkel, keahlian para mekanik, komitmen kepuasan pelanggan, dan fasilitas unggulan..."
              value={f.profile_article}
              onChange={(e) => setF({ ...f, profile_article: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Profil Organisasi PPBMR</Label>
            <Textarea
              rows={3}
              placeholder="Catatan keanggotaan dan sertifikasi PPBMR..."
              value={f.organization_profile}
              onChange={(e) => setF({ ...f, organization_profile: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Action Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          variant="signal"
          onClick={save}
          disabled={isSaving}
          className="font-bold px-8 shadow-xs"
        >
          {isSaving ? "Menyimpan Perubahan…" : "Simpan Profil Bengkel"}
        </Button>
      </div>
    </div>
  );
}

interface ArticleSectionProps {
  w: Tables<"workshops">;
  uid: string;
  sub: "list" | "write";
  onSubChange: (sub: "list" | "write") => void;
}

type ArticleItem = Tables<"articles"> & {
  article_categories?: { name: string } | null;
};

function ArticleSection({ w, uid, sub, onSubChange }: ArticleSectionProps) {
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["article-categories"],
    queryFn: async () =>
      (
        await supabase
          .from("article_categories")
          .select("*")
          .order("sort_order", { ascending: true })
      ).data ?? [],
  });

  const { data: list = [], isLoading } = useQuery<ArticleItem[]>({
    queryKey: ["my-articles", w.id],
    queryFn: async () =>
      (
        await supabase
          .from("articles")
          .select("*,article_categories(name)")
          .eq("workshop_id", w.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const [filterStatus, setFilterStatus] = useState<
    "all" | "draft" | "pending" | "published" | "rejected"
  >("all");
  const [editingArticle, setEditingArticle] = useState<Tables<"articles"> | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<Tables<"articles"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [cover, setCover] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function startEdit(a: Tables<"articles">) {
    setEditingArticle(a);
    setTitle(a.title);
    setCategoryId(a.category_id ?? "");
    setTags(a.tags ?? []);
    setContent(a.content);
    setCover(a.cover_url ?? "");
    onSubChange("write");
  }

  function cancelEdit() {
    setEditingArticle(null);
    setTitle("");
    setCategoryId("");
    setTags([]);
    setContent("");
    setCover("");
    onSubChange("list");
  }

  function startNewArticle() {
    setEditingArticle(null);
    setTitle("");
    setCategoryId("");
    setTags([]);
    setContent("");
    setCover("");
    onSubChange("write");
  }

  async function submitArticle(targetStatus: "draft" | "pending") {
    if (!title.trim()) {
      toast.error("Judul artikel tidak boleh kosong");
      return;
    }
    if (!categoryId) {
      toast.error("Harap pilih Kategori Utama artikel");
      return;
    }
    if (!content.trim()) {
      toast.error("Isi konten artikel tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);
    if (editingArticle) {
      const { error } = await supabase
        .from("articles")
        .update({
          title: title.trim(),
          category_id: categoryId,
          tags,
          content,
          cover_url: cover || null,
          status: targetStatus,
        })
        .eq("id", editingArticle.id);

      setIsSubmitting(false);
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(
        targetStatus === "draft"
          ? "Draf artikel berhasil diperbarui!"
          : "Artikel berhasil diperbarui dan diajukan ke admin!",
      );
    } else {
      const { error } = await supabase.from("articles").insert({
        workshop_id: w.id,
        author_id: uid,
        title: title.trim(),
        category_id: categoryId,
        tags,
        content,
        cover_url: cover || null,
        status: targetStatus,
      });

      setIsSubmitting(false);
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(
        targetStatus === "draft"
          ? "Draf artikel berhasil disimpan!"
          : "Artikel berhasil dikirim! Menunggu peninjauan admin.",
      );
    }

    cancelEdit();
    qc.invalidateQueries({ queryKey: ["my-articles", w.id] });
  }

  async function confirmDelete() {
    if (!articleToDelete) return;
    setIsDeleting(true);

    if (articleToDelete.cover_url) {
      await deleteArticleCover(articleToDelete.cover_url);
    }

    const { error } = await supabase.from("articles").delete().eq("id", articleToDelete.id);
    setIsDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Artikel berhasil dihapus.");
    setArticleToDelete(null);
    qc.invalidateQueries({ queryKey: ["my-articles", w.id] });
  }

  const counts = {
    all: list.length,
    draft: list.filter((a) => a.status === "draft").length,
    pending: list.filter((a) => a.status === "pending").length,
    published: list.filter((a) => a.status === "published").length,
    rejected: list.filter((a) => a.status === "rejected").length,
  };

  const filteredList =
    filterStatus === "all" ? list : list.filter((a) => a.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Switcher & Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={sub === "list" ? "default" : "outline"}
            onClick={() => onSubChange("list")}
            className="rounded-xl font-bold"
          >
            Artikel Saya ({list.length})
          </Button>
          <Button
            size="sm"
            variant={sub === "write" && !editingArticle ? "default" : "outline"}
            onClick={startNewArticle}
            className="rounded-xl font-bold gap-1.5"
          >
            <Plus className="h-4 w-4" /> Tulis Artikel Baru
          </Button>
        </div>

        {sub === "write" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelEdit}
            className="text-xs text-muted-foreground hover:text-foreground self-start"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Kembali ke Daftar Artikel
          </Button>
        )}
      </div>

      {/* Sub-View 1: Daftar Artikel Saya */}
      {sub === "list" && (
        <div className="space-y-4">
          {/* Status Filter Chips */}
          {list.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              {(
                [
                  { id: "all", label: "Semua", count: counts.all },
                  { id: "draft", label: "Draf", count: counts.draft },
                  { id: "pending", label: "Menunggu Review", count: counts.pending },
                  { id: "published", label: "Terbit", count: counts.published },
                  { id: "rejected", label: "Ditolak", count: counts.rejected },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilterStatus(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    filterStatus === item.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      filterStatus === item.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-background text-foreground"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {isLoading && <p className="text-sm text-muted-foreground py-6">Memuat artikel…</p>}

          {!isLoading && list.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">Belum Ada Artikel</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Bagikan tips perawatan mobil, info promo bengkel, atau kabar terkini untuk dibaca
                oleh ribuan pemilik mobil di Malang Raya.
              </p>
              <Button variant="signal" onClick={startNewArticle} className="mt-5 font-bold gap-1.5">
                <Plus className="h-4 w-4" /> Tulis Artikel Pertama
              </Button>
            </div>
          )}

          {!isLoading && list.length > 0 && filteredList.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground text-sm">
              Tidak ada artikel dengan status &quot;{STATUS[filterStatus]?.label ?? filterStatus}
              &quot;.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {filteredList.map((a) => {
              const statusCfg = STATUS[a.status] ?? DEFAULT_STATUS;
              const canDelete = a.status === "draft" || a.status === "rejected";
              return (
                <div
                  key={a.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-card space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusCfg.className}`}
                      >
                        {statusCfg.label}
                        {a.status === "published"
                          ? ` · ${a.visibility === "public" ? "Semua" : "Anggota"}`
                          : ""}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {a.cover_url && (
                      <div className="h-32 w-full overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                        <img
                          src={a.cover_url}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    )}

                    <div>
                      <h3 className="font-extrabold text-base leading-snug line-clamp-2">
                        {a.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {a.content}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {a.article_categories?.name && (
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          {a.article_categories.name}
                        </span>
                      )}
                      {Array.isArray(a.tags) &&
                        a.tags.map((t: string) => (
                          <span
                            key={t}
                            className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
                          >
                            #{t}
                          </span>
                        ))}
                    </div>

                    {a.admin_note && (
                      <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-2.5 text-xs text-muted-foreground border border-border/60">
                        <AlertCircle className="h-4 w-4 text-signal shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-foreground">Catatan Admin:</span>{" "}
                          {a.admin_note}
                        </div>
                      </div>
                    )}

                    {/* Card Actions: Edit & Delete */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(a)}
                        className="gap-1.5 text-xs font-bold h-8"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-primary" /> Edit
                      </Button>

                      {canDelete ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setArticleToDelete(a)}
                          className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hapus
                        </Button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/75"
                          title="Artikel yang sedang direview atau sudah terbit tidak dapat dihapus sepihak. Hubungi admin untuk penghapusan."
                        >
                          <Info className="h-3 w-3" /> Hubungi admin untuk hapus
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-View 2: Form Editor (Tulis Baru / Edit Mode) */}
      {sub === "write" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitArticle("pending");
          }}
          className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-primary">
                  {editingArticle ? "Edit Artikel" : "Tulis Artikel Baru"}
                </h2>
                {editingArticle && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                      (STATUS[editingArticle.status] ?? DEFAULT_STATUS).className
                    }`}
                  >
                    {(STATUS[editingArticle.status] ?? DEFAULT_STATUS).label}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {editingArticle
                  ? "Perbarui draf atau ajukan ulang perubahan artikel ke admin."
                  : "Artikel akan ditinjau oleh Admin PPBMR sebelum diterbitkan ke publik atau khusus anggota."}
              </p>
            </div>

            {editingArticle && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelEdit}
                className="text-xs self-start"
              >
                Batal Edit
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Judul Artikel</Label>
              <Input
                required
                placeholder="Contoh: Tips Merawat Sistem AC Mobil Agar Tetap Dingin Maksimal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Kategori Utama</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Pilih Kategori...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="mb-1.5 block">Tags Terkait (Maksimal 10 tag)</Label>
                <TagInput value={tags} onChange={setTags} placeholder="Ketik tag, tekan Enter..." />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Gambar Sampul / Banner (Opsional)</Label>
              <ImageUploader value={cover} onChange={setCover} userId={uid} />
            </div>

            <div>
              <Label className="mb-1.5 block">Isi Konten Artikel</Label>
              <MarkdownEditor
                value={content}
                onChange={setContent}
                required
                rows={12}
                placeholder="Tulis artikel lengkap menggunakan toolbar pemformatan tebal, miring, heading, YouTube, atau daftar poin di atas..."
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSubmitting}>
              Batal
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => void submitArticle("draft")}
                className="font-bold border-border"
              >
                {isSubmitting ? "Menyimpan…" : "Simpan sebagai Draf"}
              </Button>
              <Button
                type="button"
                variant="signal"
                disabled={isSubmitting}
                onClick={() => void submitArticle("pending")}
                className="font-bold px-6"
              >
                {isSubmitting
                  ? "Mengirim ke Admin…"
                  : editingArticle
                    ? "Perbarui & Ajukan ke Admin"
                    : "Kirim Artikel ke Admin"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!articleToDelete}
        onOpenChange={(open) => !open && setArticleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Artikel Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Artikel &quot;{articleToDelete?.title}&quot; akan dihapus secara permanen beserta
              berkas sampulnya. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
            >
              {isDeleting ? "Menghapus…" : "Ya, Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
