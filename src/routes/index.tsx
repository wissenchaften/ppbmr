import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MapPin, Navigation, Search, Phone, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkshopLogo } from "@/components/WorkshopLogo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { directionsUrl, embedUrl } from "@/lib/maps";
import { DirectionsMenu } from "@/components/DirectionsMenu";
import logo from "@/assets/ppbmr-logo.webp.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daftar Bengkel Malang & Sekitarnya — PPBMR" },
      { name: "description", content: "Cari bengkel anggota PPBMR di Kota Malang, Kabupaten Malang, dan Batu. Lihat peta, rute, profil, dan benefit." },
      { property: "og:title", content: "Daftar Bengkel Malang & Sekitarnya — PPBMR" },
      { property: "og:description", content: "Direktori bengkel anggota PPBMR lengkap dengan peta dan petunjuk arah." },
    ],
  }),
  component: Index,
});

const AREAS = ["Semua", "Kota Malang", "Kabupaten Malang", "Kota Batu"];

function Index() {
  const { data: workshops = [], isLoading } = useQuery({
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
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [area, setArea] = useState("Semua");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      workshops.filter(
        (w) =>
          (area === "Semua" || w.area === area) &&
          (w.name + w.address + w.services.join(" ")).toLowerCase().includes(q.toLowerCase()),
      ),
    [workshops, q, area],
  );
  const selected = filtered.find((w) => w.id === selectedId) ?? filtered[0];

  return (
    <>
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-block rounded-full bg-signal px-3 py-1 text-xs font-bold uppercase tracking-wider">
              PPBMR
            </span>
            <h1 className="mt-4 text-4xl font-black md:text-6xl">
              Rekomendasi Bengkel Mobil terbaik.
            </h1>
            <p className="mt-4 max-w-xl opacity-85">
              {workshops.length} bengkel anggota PPBMR di Malang, Batu, dan sekitarnya. Klik nama bengkel untuk langsung
              membuka rute di Google Maps.
            </p>
          </div>
          <div className="hidden h-64 w-64 shrink-0 items-center justify-center rounded-full bg-background p-6 shadow-card md:flex">
            <img src={logo.url} alt="Logo PPBMR" width={320} height={167} className="h-auto w-full object-contain" />
          </div>
        </div>
        <div className="stripe-signal h-2 opacity-90" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama bengkel, alamat, atau layanan…"
              className="h-11 pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <Button key={a} size="sm" variant={area === a ? "default" : "outline"} onClick={() => setArea(a)}>
                {a}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_440px]">
          <ul className="space-y-3">
            {isLoading && <li className="text-muted-foreground">Memuat bengkel…</li>}
            {!isLoading && filtered.length === 0 && <li className="text-muted-foreground">Tidak ada bengkel yang cocok.</li>}
            {filtered.map((w) => (
              <li
                key={w.id}
                onMouseEnter={() => setSelectedId(w.id)}
                onClick={() => navigate({ to: "/bengkel/$slug", params: { slug: w.slug } })}
                className={`cursor-pointer rounded-2xl border bg-card p-4 transition-all hover:shadow-card ${
                  selected?.id === w.id ? "border-primary shadow-card" : ""
                }`}
              >
                <div className="flex gap-4">
                  <WorkshopLogo name={w.name} url={w.logo_url} />
                  <div className="min-w-0 flex-1">
                    <a
                      href={directionsUrl(w.lat, w.lng)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="group inline-flex items-center gap-1.5 font-display text-lg font-extrabold text-primary hover:text-signal"
                    >
                      {w.name}
                      <Navigation className="h-4 w-4 opacity-60 group-hover:opacity-100" />
                    </a>
                    <p className="mt-0.5 flex items-start gap-1 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" /> {w.address}, {w.area}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      {w.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{w.phone}</span>}
                      {w.hours && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{w.hours}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {w.services.map((s) => (
                        <span key={s} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="hidden flex-col gap-2 sm:flex">
                    <Button asChild size="sm">
                      <Link to="/bengkel/$slug" params={{ slug: w.slug }}>Profil</Link>
                    </Button>
                    <DirectionsMenu lat={w.lat} lng={w.lng} label="Rute" stopPropagation />
                  </div>
                </div>
                <Link to="/bengkel/$slug" params={{ slug: w.slug }} className="mt-3 block text-sm font-semibold text-primary sm:hidden">
                  Lihat profil & benefit →
                </Link>
              </li>
            ))}
          </ul>

          {selected && (
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="overflow-hidden rounded-2xl border shadow-card">
                <iframe
                  key={selected.id}
                  title={`Peta ${selected.name}`}
                  src={embedUrl(selected.lat, selected.lng)}
                  className="h-80 w-full border-0 lg:h-[420px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="flex items-center justify-between gap-2 bg-primary-deep p-4 text-primary-foreground">
                  <div>
                    <div className="text-xs opacity-75">Di peta</div>
                    <div className="font-display font-extrabold">{selected.name}</div>
                  </div>
                  <DirectionsMenu lat={selected.lat} lng={selected.lng} />
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>
    </>
  );
}
