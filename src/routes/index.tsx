import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  MapPin,
  Search,
  Phone,
  Clock,
  Sparkles,
  ShieldCheck,
  Wrench,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  X,
  FileText,
  Tag,
  Map,
  List,
  ExternalLink,
  Users,
  Navigation,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkshopLogo } from "@/components/WorkshopLogo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { embedUrl } from "@/lib/maps";
import { DirectionsMenu } from "@/components/DirectionsMenu";
import {
  buildWhatsAppUrl,
  formatDate,
  stripMarkdownExcerpt,
  parseSearchQuery,
  matchesWorkshopSearch,
} from "@/lib/index-helpers";
import logo from "@/assets/ppbmr-logo.webp.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daftar Bengkel Malang & Sekitarnya — PPBMR" },
      {
        name: "description",
        content:
          "Cari bengkel mobil terverifikasi anggota PPBMR di Kota Malang, Kabupaten Malang, dan Kota Batu. Lengkap dengan peta, promo hari ini, rute Google Maps, dan kontak langsung.",
      },
      { property: "og:title", content: "Daftar Bengkel Malang & Sekitarnya — PPBMR" },
      {
        property: "og:description",
        content:
          "Direktori resmi bengkel anggota PPBMR dengan teknisi berpengalaman, rute peta, dan kontak langsung.",
      },
    ],
  }),
  component: Index,
});

const AREAS = ["Semua", "Kota Malang", "Kabupaten Malang", "Kota Batu"] as const;

const POPULAR_SERVICES = [
  "Semua Layanan",
  "Ganti Oli",
  "Tune Up",
  "Servis AC",
  "Kaki-kaki",
  "Spooring & Balancing",
  "Overhaul Mesin",
  "Cat & Body Repair",
  "Emergency 24 Jam",
] as const;

function Index() {
  const navigate = useNavigate();

  // 1. Query Data Bengkel
  const { data: workshops = [], isLoading: isWorkshopsLoading } = useQuery({
    queryKey: ["workshops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // 2. Query 3 Artikel Edukasi Publik Terkini
  const { data: latestArticles = [] } = useQuery({
    queryKey: ["latest-articles-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(
          "id,title,content,cover_url,published_at,workshops(name,logo_url),article_categories(name,slug)",
        )
        .eq("status", "published")
        .eq("visibility", "public")
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  // State Filter & Pencarian
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string>("Semua");
  const [selectedService, setSelectedService] = useState<string>("Semua Layanan");
  const [promoOnly, setPromoOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // Counter Per Wilayah
  const areaCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Semua: workshops.length,
      "Kota Malang": 0,
      "Kabupaten Malang": 0,
      "Kota Batu": 0,
    };
    for (const w of workshops) {
      if (w.area && counts[w.area] !== undefined) {
        counts[w.area] = (counts[w.area] ?? 0) + 1;
      }
    }
    return counts;
  }, [workshops]);

  // Jumlah Bengkel dengan Promo Aktif
  const promoCount = useMemo(() => {
    return workshops.filter((w) => Boolean(w.promo_title && w.promo_title.trim())).length;
  }, [workshops]);

  // Parsing Kata Kunci Pencarian (Smart Keyword & Category Stopwords)
  const parsedSearch = useMemo(() => parseSearchQuery(q), [q]);

  // Hasil Filter Komprehensif
  const filtered = useMemo(() => {
    return workshops.filter((w) => {
      // Filter Wilayah
      if (area !== "Semua" && w.area !== area) return false;

      // Filter Promo
      if (promoOnly && (!w.promo_title || !w.promo_title.trim())) return false;

      // Filter Layanan Khusus
      if (selectedService !== "Semua Layanan") {
        const hasService = w.services.some((s) =>
          s.toLowerCase().includes(selectedService.toLowerCase()),
        );
        if (!hasService) return false;
      }

      // Filter Teks Cerdas (Multi-Token AND dengan Stopword Kategori)
      if (!matchesWorkshopSearch(w, parsedSearch)) return false;

      return true;
    });
  }, [workshops, area, promoOnly, selectedService, parsedSearch]);

  // Bengkel Terpilih untuk Peta
  const selected = filtered.find((w) => w.id === selectedId) ?? filtered[0];

  const hasActiveFilters =
    q.trim() !== "" || area !== "Semua" || selectedService !== "Semua Layanan" || promoOnly;

  const handleResetFilters = () => {
    setQ("");
    setArea("Semua");
    setSelectedService("Semua Layanan");
    setPromoOnly(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* =========================================================================
          1. HERO SECTION & VALUE PROPOSITION PPBMR
      ========================================================================== */}
      <section className="relative overflow-hidden bg-hero text-primary-foreground">
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-signal px-3.5 py-1 text-xs font-black uppercase tracking-wider text-signal-foreground shadow-sm">
                <ShieldCheck className="h-4 w-4" /> Paguyuban Resmi PPBMR
              </div>

              <h1 className="mt-4 font-display text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                Direktori Resmi Bengkel Mobil Terpercaya se-Malang Raya.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed opacity-90 sm:text-lg">
                Jaringan {workshops.length} bengkel mobil anggota PPBMR di Kota Malang, Kabupaten
                Malang, dan Kota Batu. Terstandarisasi, teknisi berpengalaman, dan terhubung
                langsung dengan rute Google Maps.
              </p>

              {/* 3 Pilar Kepercayaan (Trust Pillars) */}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xs">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signal/20 text-signal">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Terverifikasi Resmi</h2>
                    <p className="mt-0.5 text-xs text-white/70">
                      Standar legalitas dan etika usaha PPBMR terjamin.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xs">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signal/20 text-signal">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Teknisi Berpengalaman</h2>
                    <p className="mt-0.5 text-xs text-white/70">
                      Mekanik handal, diagnosa teliti, dan pengerjaan rapi.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xs">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signal/20 text-signal">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Rute & Kontak Cepat</h2>
                    <p className="mt-0.5 text-xs text-white/70">
                      1-klik buka rute Google Maps dan chat WhatsApp bengkel.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Search Box di Hero */}
              <div className="mt-8 max-w-2xl">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari nama, wilayah, atau layanan (contoh: 'bengkel ac', 'spooring batu', 'sukun')…"
                    className="h-13 rounded-2xl bg-card pl-11 pr-10 text-foreground placeholder:text-muted-foreground shadow-lg text-base border-primary/20 focus-visible:ring-signal"
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ("")}
                      className="absolute right-3.5 p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Bersihkan pencarian"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Emblem Logo Paguyuban */}
            <div className="hidden h-60 w-60 shrink-0 items-center justify-center rounded-3xl bg-background/95 p-6 shadow-2xl backdrop-blur-sm md:flex lg:h-72 lg:w-72">
              <img
                src={logo.url}
                alt="Logo Resmi PPBMR"
                width={320}
                height={167}
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        </div>
        <div className="stripe-signal h-2.5 opacity-95" />
      </section>

      {/* =========================================================================
          2. FILTER SECTION & DIREKTORI BENGKEL
      ========================================================================== */}
      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Bar Filter Wilayah */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-signal" />
              <span className="text-sm font-bold text-foreground">Wilayah Operasional:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {AREAS.map((a) => {
                const count = areaCounts[a] ?? 0;
                const isActive = area === a;
                return (
                  <Button
                    key={a}
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setArea(a)}
                    className="h-9 rounded-xl font-medium"
                  >
                    {a}
                    <span
                      className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Bar Filter Layanan Populer & Toggle Promo */}
          <div className="flex flex-col gap-3 pt-1 border-t sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs sm:pb-0 scrollbar-none">
              <span className="mr-1 shrink-0 font-semibold text-muted-foreground">Layanan:</span>
              {POPULAR_SERVICES.map((s) => {
                const isSelected = selectedService === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedService(s)}
                    className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            {/* Toggle Promo Spesial */}
            <button
              type="button"
              onClick={() => setPromoOnly(!promoOnly)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                promoOnly
                  ? "border-signal bg-signal text-signal-foreground shadow-sm"
                  : "border-signal/40 bg-signal/10 text-signal hover:bg-signal/20"
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Ada Promo Spesial</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                  promoOnly ? "bg-white/20 text-white" : "bg-signal/20 text-signal"
                }`}
              >
                {promoCount}
              </span>
            </button>
          </div>

          {/* Status Hasil & Tombol Reset Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-sm text-muted-foreground">
            <div>
              <p>
                Menampilkan <span className="font-bold text-foreground">{filtered.length}</span>{" "}
                bengkel
                {area !== "Semua" && (
                  <>
                    {" "}
                    di <span className="font-semibold text-foreground">{area}</span>
                  </>
                )}
                {selectedService !== "Semua Layanan" && (
                  <>
                    {" "}
                    dengan layanan{" "}
                    <span className="font-semibold text-foreground">{selectedService}</span>
                  </>
                )}
                {promoOnly && (
                  <>
                    {" "}
                    dengan <span className="font-semibold text-signal">Promo Spesial</span>
                  </>
                )}
                {parsedSearch.effectiveTokens.length > 0 && (
                  <>
                    {" "}
                    untuk kata kunci{" "}
                    <span className="font-semibold text-foreground">
                      &quot;{parsedSearch.effectiveTokens.join(" ")}&quot;
                    </span>
                  </>
                )}
              </p>

              {parsedSearch.isGenericOnly && (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-signal">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  Menampilkan semua bengkel — ketik layanan, nama, atau wilayah lanjutan untuk
                  mempersempit hasil.
                </p>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 h-3.5 w-3.5" /> Reset Semua Filter
              </Button>
            )}
          </div>
        </div>

        {/* =========================================================================
            3. DAFTAR KARTU BENGKEL & STICKY PETA (DESKTOP & MOBILE)
        ========================================================================== */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Kolom Daftar Bengkel (Desktop selalu tampil, di mobile conditional) */}
          <div className={`${mobileView === "map" ? "hidden lg:block" : "block"}`}>
            {isWorkshopsLoading && (
              <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground shadow-2xs">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Memuat daftar bengkel resmi PPBMR…
              </div>
            )}

            {!isWorkshopsLoading && filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <h3 className="mt-3 font-display text-lg font-bold">
                  Tidak ada bengkel yang cocok
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Coba sesuaikan kata kunci pencarian atau reset filter wilayah dan layanan.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="mt-4 rounded-xl"
                >
                  Reset Filter
                </Button>
              </div>
            )}

            <ul className="space-y-4">
              {filtered.map((w) => {
                const isCardSelected = selected?.id === w.id;
                const waUrl = buildWhatsAppUrl(w.whatsapp || w.phone, w.name);
                const hasPromo = Boolean(w.promo_title && w.promo_title.trim());

                return (
                  <li
                    key={w.id}
                    onMouseEnter={() => setSelectedId(w.id)}
                    className={`group relative rounded-2xl border bg-card p-4 sm:p-5 transition-all hover:shadow-card ${
                      isCardSelected ? "border-primary ring-2 ring-primary/20 shadow-card" : ""
                    }`}
                  >
                    {/* Badge Promo Spesial di Kartu */}
                    {hasPromo && (
                      <div className="mb-3 flex items-center justify-between rounded-xl bg-signal/10 px-3 py-1.5 text-xs font-semibold text-signal border border-signal/20">
                        <span className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 shrink-0" />
                          <span>Promo Hari Ini: {w.promo_title}</span>
                        </span>
                        {w.promo_text && (
                          <span className="hidden text-[11px] opacity-80 sm:inline truncate max-w-[200px]">
                            {w.promo_text}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex shrink-0 items-start gap-3">
                        <WorkshopLogo
                          name={w.name}
                          url={w.logo_url}
                          className="h-16 w-16 text-lg sm:h-18 sm:w-18"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to="/bengkel/$slug"
                            params={{ slug: w.slug }}
                            className="font-display text-lg font-black text-primary transition-colors hover:text-signal sm:text-xl"
                          >
                            {w.name}
                          </Link>
                          <Badge
                            variant="secondary"
                            className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold"
                          >
                            <ShieldCheck className="mr-1 h-3 w-3 text-primary" /> Terverifikasi
                            PPBMR
                          </Badge>
                        </div>

                        <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                          <span>
                            {w.address},{" "}
                            <span className="font-semibold text-foreground/80">{w.area}</span>
                          </span>
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {w.phone && (
                            <span className="flex items-center gap-1 font-medium text-foreground/85">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {w.phone}
                            </span>
                          )}
                          {w.hours && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              {w.hours}
                            </span>
                          )}
                        </div>

                        {/* Layanan Chips (Maksimal 4, sisanya +N lainnya) */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {w.services.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                            >
                              {s}
                            </span>
                          ))}
                          {w.services.length > 4 && (
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              +{w.services.length - 4} lainnya
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bar Tombol Aksi Cepat */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {waUrl && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 text-xs font-semibold"
                          >
                            <a href={waUrl} target="_blank" rel="noreferrer">
                              <MessageSquare className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                              Chat WhatsApp
                            </a>
                          </Button>
                        )}

                        <DirectionsMenu
                          lat={w.lat}
                          lng={w.lng}
                          name={w.name}
                          address={w.address}
                          mapsUrl={w.maps_url ?? undefined}
                          label="Rute Google Maps"
                          size="sm"
                          stopPropagation
                        />
                      </div>

                      <Button asChild size="sm" className="h-8 rounded-xl text-xs font-semibold">
                        <Link to="/bengkel/$slug" params={{ slug: w.slug }}>
                          Lihat Profil
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Kolom Peta (Desktop Sticky & Mobile Map Mode) */}
          <div className={`${mobileView === "list" ? "hidden lg:block" : "block"}`}>
            {selected && (
              <aside className="lg:sticky lg:top-24 lg:h-fit">
                <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
                  <div className="relative">
                    <iframe
                      key={selected.id}
                      title={`Peta Lokasi ${selected.name}`}
                      src={embedUrl(selected.lat, selected.lng, 15, selected.name)}
                      className="h-80 w-full border-0 sm:h-96 lg:h-[400px]"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <div className="border-t bg-primary-deep p-4 text-primary-foreground">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-signal-light">
                          <MapPin className="h-3 w-3" /> Titik Terpilih di Peta
                        </div>
                        <h4 className="mt-1 truncate font-display text-base font-extrabold sm:text-lg">
                          {selected.name}
                        </h4>
                        <p className="mt-0.5 truncate text-xs opacity-80">{selected.address}</p>
                      </div>

                      <DirectionsMenu
                        lat={selected.lat}
                        lng={selected.lng}
                        name={selected.name}
                        address={selected.address}
                        mapsUrl={selected.maps_url ?? undefined}
                        size="sm"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                      <span className="opacity-75">
                        {selected.phone ? `Telp: ${selected.phone}` : "Anggota Resmi PPBMR"}
                      </span>
                      <Link
                        to="/bengkel/$slug"
                        params={{ slug: selected.slug }}
                        className="font-bold text-signal hover:underline inline-flex items-center gap-1"
                      >
                        Buka Halaman Profil <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>

        {/* Mobile Floating Bar untuk Beralih List & Map */}
        <div className="fixed bottom-6 inset-x-0 mx-auto w-fit z-30 lg:hidden">
          <div className="flex items-center gap-1 rounded-full border border-primary/20 bg-background/95 p-1.5 shadow-xl backdrop-blur-md">
            <Button
              size="sm"
              variant={mobileView === "list" ? "default" : "ghost"}
              onClick={() => setMobileView("list")}
              className="h-9 rounded-full px-4 text-xs font-bold"
            >
              <List className="mr-1.5 h-4 w-4" /> Daftar ({filtered.length})
            </Button>
            <Button
              size="sm"
              variant={mobileView === "map" ? "default" : "ghost"}
              onClick={() => setMobileView("map")}
              className="h-9 rounded-full px-4 text-xs font-bold"
            >
              <Map className="mr-1.5 h-4 w-4" /> Lihat Peta
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SECTION ARTIKEL & EDUKASI OTOMOTIF TERKINI
      ========================================================================== */}
      {latestArticles.length > 0 && (
        <section className="border-t bg-muted/40 py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <FileText className="h-3.5 w-3.5" /> Edukasi & Informasi
                </div>
                <h2 className="mt-2 font-display text-2xl font-black text-primary md:text-3xl">
                  Kabar & Tips Otomotif Terbaru
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Wawasan teknis, edukasi perawatan kendaraan, dan informasi dari teknisi PPBMR.
                </p>
              </div>

              <Button asChild variant="outline" size="sm" className="w-fit rounded-xl">
                <Link to="/artikel">
                  Lihat Semua Artikel <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestArticles.map((article) => {
                const excerpt = stripMarkdownExcerpt(article.content, 110);
                const categoryName = article.article_categories?.name;
                const authorName = article.workshops?.name;

                return (
                  <article
                    key={article.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xs transition-all hover:shadow-card"
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      {article.cover_url ? (
                        <img
                          src={article.cover_url}
                          alt={article.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary/40">
                          <Wrench className="h-10 w-10" />
                        </div>
                      )}
                      {categoryName && (
                        <span className="absolute left-3 top-3 rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-bold text-foreground backdrop-blur-xs shadow-xs">
                          {categoryName}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="text-xs text-muted-foreground">
                        {formatDate(article.published_at)}
                      </div>

                      <h3 className="mt-2 font-display text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                        <Link to="/artikel/$id" params={{ id: article.id }}>
                          {article.title}
                        </Link>
                      </h3>

                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {excerpt}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                        <span className="truncate font-medium text-foreground/80">
                          {authorName ? `Oleh ${authorName}` : "PPBMR Malang Raya"}
                        </span>
                        <Link
                          to="/artikel/$id"
                          params={{ id: article.id }}
                          className="font-bold text-primary group-hover:text-signal inline-flex items-center gap-1"
                        >
                          Baca <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          5. SECTION KEUNGGULAN ASOSIASI PPBMR & STATISTIK DIREKTORI
      ========================================================================== */}
      <section className="border-t py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-block rounded-full bg-signal/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-signal">
              Mengapa Memilih Bengkel PPBMR?
            </span>
            <h2 className="mt-3 font-display text-2xl font-black text-primary md:text-3xl">
              Standar Pelayanan Terbaik untuk Kendaraan Anda
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              PPBMR mewadahi para pemilik bengkel mobil profesional di Malang Raya dengan tujuan
              meningkatkan etika bisnis, transparansi tarif, dan kepuasan pelanggan.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border bg-card p-6 shadow-2xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">Standarisasi & Sertifikasi</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Setiap bengkel anggota menjalani evaluasi kelayakan peralatan kerja dan kualifikasi
                mekanik guna memastikan hasil servis yang aman.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-2xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-signal/10 text-signal">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">
                Transparansi Biaya & Suku Cadang
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Mengutamakan estimasi biaya yang jelas di awal pengerjaan, penggunaan suku cadang
                asli / berkualitas, serta garansi hasil perbaikan.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-2xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">
                Jejaring Solutif se-Malang Raya
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Saling berkoordinasi dalam pengadaan suku cadang langka, diagnosa masalah rumit,
                hingga layanan bantuan darurat di jalan.
              </p>
            </div>
          </div>

          {/* Statistik Direktori */}
          <div className="mt-8 rounded-2xl border bg-primary p-6 text-primary-foreground sm:p-8">
            <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              <div>
                <div className="font-display text-3xl font-black sm:text-4xl text-signal-light">
                  {workshops.length}+
                </div>
                <div className="mt-1 text-xs sm:text-sm opacity-85">Bengkel Anggota Resmi</div>
              </div>
              <div>
                <div className="font-display text-3xl font-black sm:text-4xl text-signal-light">
                  3
                </div>
                <div className="mt-1 text-xs sm:text-sm opacity-85">Wilayah Malang Raya</div>
              </div>
              <div>
                <div className="font-display text-3xl font-black sm:text-4xl text-signal-light">
                  {promoCount}
                </div>
                <div className="mt-1 text-xs sm:text-sm opacity-85">Promo Aktif Spesial</div>
              </div>
              <div>
                <div className="font-display text-3xl font-black sm:text-4xl text-signal-light">
                  100%
                </div>
                <div className="mt-1 text-xs sm:text-sm opacity-85">Terverifikasi Paguyuban</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. BANNER CTA PENDAFTARAN PEMILIK BENGKEL (JOIN PPBMR)
      ========================================================================== */}
      <section className="border-t bg-hero text-primary-foreground py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm md:flex-row md:text-left">
            <div className="max-w-2xl">
              <span className="inline-block rounded-full bg-signal px-3 py-1 text-xs font-bold uppercase tracking-wider text-signal-foreground">
                Keanggotaan PPBMR
              </span>
              <h2 className="mt-3 font-display text-2xl font-black sm:text-3xl">
                Punya Bengkel Mobil di Malang Raya?
              </h2>
              <p className="mt-2 text-sm leading-relaxed opacity-90 sm:text-base">
                Mari bergabung bersama Paguyuban Pengusaha Bengkel Mobil Malang Raya. Dapatkan akses
                direktori digital, pelatihan berkala untuk teknisi, serta perluasan jejaring bisnis.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-2xl bg-signal font-bold text-signal-foreground hover:bg-signal/90 shadow-md"
              >
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Pengurus%20PPBMR,%20saya%20pemilik%20bengkel%20di%20Malang%20dan%20tertarik%20bergabung%20dengan%20paguyuban."
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> Hubungi Sekretariat
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <Link to="/auth">
                  Login Pemilik Bengkel
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
