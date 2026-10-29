import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { WorkshopLogo } from "@/components/WorkshopLogo";

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
        .select("*,workshops(name,slug,logo_url)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading || loading) return <div className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">Memuat…</div>;
  if (!a)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        Artikel tidak tersedia atau khusus anggota.{" "}
        {!session && <Link to="/auth" className="font-semibold text-primary">Masuk</Link>}
      </div>
    );
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {a.workshops && (
        <Link to="/bengkel/$slug" params={{ slug: a.workshops.slug }} className="flex items-center gap-3">
          <WorkshopLogo name={a.workshops.name} url={a.workshops.logo_url} className="h-10 w-10 text-xs" />
          <span className="font-semibold text-primary">{a.workshops.name}</span>
        </Link>
      )}
      <h1 className="mt-6 text-4xl font-black">{a.title}</h1>
      {a.status !== "published" && <p className="mt-2 text-sm font-semibold text-signal">Status: {a.status}</p>}
      {a.cover_url && <img src={a.cover_url} alt="" className="mt-6 w-full rounded-2xl" />}
      <div className="mt-6 whitespace-pre-line leading-relaxed">{a.content}</div>
    </article>
  );
}
