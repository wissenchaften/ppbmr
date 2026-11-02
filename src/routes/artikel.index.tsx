import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Lock, Search, X, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { WorkshopLogo } from "@/components/WorkshopLogo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ArticleSearchParams {
  q?: string | undefined;
  category?: string | undefined;
}

export const Route = createFileRoute("/artikel/")({
  validateSearch: (search: Record<string, unknown>): ArticleSearchParams => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Artikel Bengkel — PPBMR Malang Raya" },
      {
        name: "description",
        content: "Tips, kabar, dan promo dari bengkel-bengkel anggota PPBMR.",
      },
      { property: "og:title", content: "Artikel Bengkel — PPBMR" },
      { property: "og:description", content: "Tulisan pilihan dari bengkel anggota PPBMR." },
    ],
  }),
  component: Articles,
});

function Articles() {
  const { session, isMember } = useAuth();
  const navigate = Route.useNavigate();
  const { q: initialQ = "", category: activeCategory = "" } = Route.useSearch();

  const [searchQuery, setSearchQuery] = useState(initialQ);

  // Sync state if URL changes externally
  useEffect(() => {
    setSearchQuery(initialQ);
  }, [initialQ]);

  // Debounced update to URL search params (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim() !== (initialQ || "").trim()) {
        navigate({
          search: (prev) => ({
            ...prev,
            q: searchQuery.trim() || undefined,
          }),
          replace: true,
        });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, initialQ, navigate]);

  const { data: articles = [], isLoading: isArticlesLoading } = useQuery({
    queryKey: ["articles", session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(
          "id,title,content,cover_url,visibility,tags,published_at,workshops(name,logo_url),article_categories(name,slug)",
        )
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["article-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleCategoryClick = (catSlug?: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        category: catSlug || undefined,
      }),
      replace: true,
    });
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchQuery(tag);
    navigate({
      search: (prev) => ({
        ...prev,
        q: tag,
      }),
      replace: true,
    });
  };

  const handleReset = () => {
    setSearchQuery("");
    navigate({
      search: () => ({}),
      replace: true,
    });
  };

  // Comprehensive Filter: Category + Full-text search (title, content, tags, workshop)
  const filtered = articles.filter((a) => {
    if (activeCategory && a.article_categories?.slug !== activeCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inTitle = a.title.toLowerCase().includes(q);
      const inContent = a.content.toLowerCase().includes(q);
      const inWorkshop = a.workshops?.name?.toLowerCase().includes(q);
      const inTags =
        Array.isArray(a.tags) && a.tags.some((t: string) => t.toLowerCase().includes(q));

      if (!inTitle && !inContent && !inWorkshop && !inTags) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div>
        <h1 className="text-4xl font-black text-primary">
          Artikel <span className="text-signal">bengkel</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isMember
            ? "Anda melihat artikel publik dan artikel khusus anggota."
            : "Masuk sebagai anggota untuk membaca artikel khusus anggota."}
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="mt-6 relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari artikel, tips servis, promo, nama bengkel, atau tag..."
          className="pl-10 pr-10 py-5 text-base rounded-xl shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
            aria-label="Bersihkan pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Horizontal Category Filter Pills */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => handleCategoryClick(undefined)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
            !activeCategory
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Semua Kategori
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleCategoryClick(c.slug)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              activeCategory === c.slug
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Articles Feed */}
      <div className="mt-6 space-y-4">
        {isArticlesLoading && <p className="text-muted-foreground py-4">Memuat artikel…</p>}

        {!isArticlesLoading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="text-lg font-bold text-foreground">Tidak ada artikel yang cocok</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || activeCategory
                ? "Coba gunakan kata kunci pencarian lain atau pilih kategori berbeda."
                : "Belum ada artikel yang diterbitkan."}
            </p>
            {(searchQuery || activeCategory) && (
              <Button size="sm" variant="outline" onClick={handleReset} className="mt-4">
                Reset Filter
              </Button>
            )}
          </div>
        )}

        {filtered.map((a) => (
          <Link
            key={a.id}
            to="/artikel/$id"
            params={{ id: a.id }}
            className="group flex flex-col gap-4 rounded-2xl border p-5 transition-all hover:border-primary hover:shadow-card sm:flex-row"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <WorkshopLogo
                  name={a.workshops?.name ?? "?"}
                  url={a.workshops?.logo_url}
                  className="h-5 w-5 text-[10px]"
                />
                <span className="font-semibold text-primary">{a.workshops?.name}</span>
                {a.published_at && (
                  <span>· {new Date(a.published_at).toLocaleDateString("id-ID")}</span>
                )}
                {a.article_categories?.name && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {a.article_categories.name}
                  </span>
                )}
                {a.visibility === "members" && (
                  <span className="flex items-center gap-1 rounded bg-signal px-1.5 py-0.5 text-[10px] font-bold text-signal-foreground">
                    <Lock className="h-3 w-3" /> Anggota
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-xl font-extrabold group-hover:text-primary transition-colors">
                {a.title}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                {a.content}
              </p>

              {/* Tags Pills */}
              {Array.isArray(a.tags) && a.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {a.tags.map((t: string) => (
                    <span
                      key={t}
                      onClick={(e) => handleTagClick(e, t)}
                      className="rounded bg-secondary/70 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {a.cover_url && (
              <img
                src={a.cover_url}
                alt=""
                className="h-32 w-full shrink-0 rounded-xl object-cover border border-border/50 sm:h-24 sm:w-36"
              />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
