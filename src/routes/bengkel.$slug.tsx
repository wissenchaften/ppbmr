import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MapPin, Phone, Clock, Lock, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkshopLogo } from "@/components/WorkshopLogo";
import { SocialLinks } from "@/components/SocialLinks";
import { Button } from "@/components/ui/button";
import { embedUrl } from "@/lib/maps";
import { DirectionsMenu } from "@/components/DirectionsMenu";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/bengkel/$slug")({
  head: ({ params }) => {
    const name = params.slug.split("-").map((s) => (s[0] ?? "").toUpperCase() + s.slice(1)).join(" ");
    return {
      meta: [
        { title: `${name} — Profil Bengkel PPBMR` },
        { name: "description", content: `Profil, benefit, peta, dan artikel dari ${name}, anggota PPBMR Malang Raya.` },
        { property: "og:title", content: `${name} — Profil Bengkel PPBMR` },
        { property: "og:description", content: `Profil dan benefit ${name} di Malang Raya.` },
      ],
    };
  },
  component: WorkshopPage,
});

function WorkshopPage() {
  const { slug } = Route.useParams();
  const { session } = useAuth();
  const { data: w, isLoading } = useQuery({
    queryKey: ["workshop", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("workshops").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: articles = [] } = useQuery({
    queryKey: ["workshop-articles", w?.id, session?.user.id],
    enabled: !!w,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id,title,content,visibility,published_at")
        .eq("workshop_id", w!.id)
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="mx-auto max-w-6xl px-4 py-12 text-muted-foreground">Memuat…</div>;
  if (!w)
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        Bengkel tidak ditemukan. <Link to="/" className="text-primary">Kembali</Link>
      </div>
    );

  return (
    <div>
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center">
          <WorkshopLogo name={w.name} url={w.logo_url} className="h-24 w-24 text-3xl" />
          <div className="flex-1">
            <span className="rounded-full bg-signal px-3 py-1 text-xs font-bold uppercase">{w.area}</span>
            <h1 className="mt-3 text-3xl font-black md:text-5xl">{w.name}</h1>
            <p className="mt-2 flex items-center gap-1 opacity-85"><MapPin className="h-4 w-4" /> {w.address}</p>
          </div>
          <DirectionsMenu lat={w.lat} lng={w.lng} size="lg" />
        </div>
        <div className="stripe-signal h-2" />
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-extrabold text-primary">Profil Bengkel</h2>
            <p className="mt-3 leading-relaxed">{w.organization_profile || w.description}</p>
            {w.description && w.organization_profile && <p className="mt-2 text-muted-foreground">{w.description}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {w.services.map((s) => (
                <span key={s} className="rounded-md bg-secondary px-2.5 py-1 text-sm font-medium text-secondary-foreground">{s}</span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border-2 border-signal/30 bg-card p-6">
            <h2 className="text-2xl font-extrabold text-primary">Benefit <span className="text-signal">bengkel</span></h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {w.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-signal" /> {b}
                </li>
              ))}
            </ul>
          </section>

          {(w.profile_article || w.promo_title || w.promo_text) && (
            <section className="grid gap-4 md:grid-cols-[1fr_260px]">
              <article className="rounded-2xl border bg-card p-6">
                <h2 className="text-2xl font-extrabold text-primary">Tentang {w.name}</h2>
                <div className="mt-3 whitespace-pre-line leading-relaxed">{w.profile_article || w.description}</div>
              </article>
              {(w.promo_title || w.promo_text) && (
                <div className="h-fit rounded-2xl bg-signal p-5 text-signal-foreground shadow-card">
                  <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider"><Tag className="h-3.5 w-3.5" /> Promo hari ini</span>
                  <h3 className="mt-2 text-xl font-black">{w.promo_title || "Promo spesial"}</h3>
                  {w.promo_text && <p className="mt-2 text-sm opacity-95">{w.promo_text}</p>}
                  {w.whatsapp && (
                    <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                      <a href={w.whatsapp} target="_blank" rel="noreferrer">Ambil promo</a>
                    </Button>
                  )}
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className="text-2xl font-extrabold text-primary">Artikel dari bengkel</h2>
            {articles.length === 0 && <p className="mt-3 text-muted-foreground">Belum ada artikel yang dipublikasikan.</p>}
            <div className="mt-4 space-y-3">
              {articles.map((a) => (
                <Link key={a.id} to="/artikel/$id" params={{ id: a.id }} className="block rounded-xl border p-4 hover:border-primary">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{a.title}</h3>
                    {a.visibility === "members" && (
                      <span className="flex items-center gap-1 rounded bg-signal px-1.5 py-0.5 text-[10px] font-bold text-signal-foreground"><Lock className="h-3 w-3" /> Anggota</span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.content}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="overflow-hidden rounded-2xl border shadow-card">
            <iframe title={`Peta ${w.name}`} src={embedUrl(w.lat, w.lng, 16)} className="h-80 w-full border-0" loading="lazy" />
          </div>
          <div className="space-y-2 rounded-2xl border p-4 text-sm">
            {w.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {w.phone}</p>}
            {w.hours && <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {w.hours}</p>}
          </div>
          <div className="rounded-2xl border p-4">
            <h3 className="mb-3 text-sm font-bold text-primary">Media sosial</h3>
            <SocialLinks w={w} />
          </div>
        </aside>
      </div>
    </div>
  );
}
