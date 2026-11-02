import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { WorkshopLogo } from "@/components/WorkshopLogo";
import { MarkdownView } from "@/components/MarkdownView";

export const Route = createFileRoute("/artikel/$id")({
  head: () => ({
    meta: [
      { title: "Artikel — PPBMR Malang Raya" },
      { name: "description", content: "Artikel dari bengkel anggota PPBMR Malang Raya." },
      { property: "og:title", content: "Artikel — PPBMR Malang Raya" },
      { property: "og:description", content: "Baca artikel dari bengkel anggota PPBMR." },
    ],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const { id } = Route.useParams();
  const { session, loading } = useAuth();
  const { data: a, isLoading } = useQuery({
    queryKey: ["article", id, session?.user.id],
    enabled: !loading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*,workshops(name,slug,logo_url),article_categories(name,slug)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading || loading)
    return <div className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">Memuat…</div>;
  if (!a)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        Artikel tidak tersedia atau khusus anggota.{" "}
        {!session && (
          <Link to="/auth" className="font-semibold text-primary">
            Masuk
          </Link>
        )}
      </div>
    );
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {a.workshops && (
          <Link
            to="/bengkel/$slug"
            params={{ slug: a.workshops.slug }}
            className="flex items-center gap-3"
          >
            <WorkshopLogo
              name={a.workshops.name}
              url={a.workshops.logo_url}
              className="h-10 w-10 text-xs"
            />
            <div>
              <span className="font-semibold text-primary block">{a.workshops.name}</span>
              {a.published_at && (
                <span className="text-xs text-muted-foreground">
                  {new Date(a.published_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </Link>
        )}
        {a.article_categories?.name && (
          <Link
            to="/artikel"
            search={{ category: a.article_categories.slug }}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
          >
            {a.article_categories.name}
          </Link>
        )}
      </div>

      <h1 className="mt-6 text-4xl font-black">{a.title}</h1>
      {a.status !== "published" && (
        <p className="mt-2 text-sm font-semibold text-signal">Status: {a.status}</p>
      )}
      {a.cover_url && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-xs">
          <img src={a.cover_url} alt={a.title} className="w-full max-h-[460px] object-cover" />
        </div>
      )}
      <div className="mt-6">
        <MarkdownView content={a.content} className="text-base sm:text-lg leading-relaxed" />
      </div>

      {Array.isArray(a.tags) && a.tags.length > 0 && (
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Topik Terkait
          </p>
          <div className="flex flex-wrap gap-2">
            {a.tags.map((t: string) => (
              <Link
                key={t}
                to="/artikel"
                search={{ q: t }}
                className="rounded-lg bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                #{t}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
