import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { WorkshopLogo } from "@/components/WorkshopLogo";

export const Route = createFileRoute("/artikel/")({
  head: () => ({
    meta: [
      { title: "Artikel Bengkel — PPBMR Malang Raya" },
      { name: "description", content: "Tips, kabar, dan promo dari bengkel-bengkel anggota PPBMR." },
      { property: "og:title", content: "Artikel Bengkel — PPBMR" },
      { property: "og:description", content: "Tulisan pilihan dari bengkel anggota PPBMR." },
    ],
  }),
  component: Articles,
});

function Articles() {
  const { session, isMember } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["articles", session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id,title,content,visibility,published_at,workshops(name,logo_url)")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-4xl font-black text-primary">Artikel <span className="text-signal">bengkel</span></h1>
      <p className="mt-2 text-muted-foreground">
        {isMember ? "Anda melihat artikel publik dan artikel khusus anggota." : "Masuk sebagai anggota untuk membaca artikel khusus anggota."}
      </p>
      <div className="mt-8 space-y-4">
        {isLoading && <p className="text-muted-foreground">Memuat…</p>}
        {!isLoading && data.length === 0 && <p className="text-muted-foreground">Belum ada artikel.</p>}
        {data.map((a) => (
          <Link key={a.id} to="/artikel/$id" params={{ id: a.id }} className="flex gap-4 rounded-2xl border p-5 hover:border-primary hover:shadow-card">
            <WorkshopLogo name={a.workshops?.name ?? "?"} url={a.workshops?.logo_url} className="h-12 w-12 text-sm" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">{a.workshops?.name}</span>
                {a.published_at && <span>· {new Date(a.published_at).toLocaleDateString("id-ID")}</span>}
                {a.visibility === "members" && (
                  <span className="flex items-center gap-1 rounded bg-signal px-1.5 py-0.5 text-[10px] font-bold text-signal-foreground"><Lock className="h-3 w-3" /> Anggota</span>
                )}
              </div>
              <h2 className="mt-1 text-xl font-extrabold">{a.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.content}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
