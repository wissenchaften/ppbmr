import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Globe,
  Lock,
  Plus,
  Trash2,
  X,
  Eye,
  Search,
  AlertCircle,
  Undo2,
  ExternalLink,
  Clock,
  CheckCircle2,
  Building2,
  Tag,
  UserCheck,
  UserX,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkshopLogo } from "@/components/WorkshopLogo";
import { MarkdownView } from "@/components/MarkdownView";
import { deleteArticleCover } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — PPBMR" },
      { name: "description", content: "Moderasi artikel dan pengelolaan anggota bengkel PPBMR." },
      { property: "og:title", content: "Admin — PPBMR" },
      { property: "og:description", content: "Panel admin PPBMR." },
    ],
  }),
  component: Admin,
});

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draf",
    className: "bg-muted text-muted-foreground border-border",
  },
  pending: {
    label: "Menunggu Review",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  published: {
    label: "Terbit",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  rejected: {
    label: "Ditolak",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

type AdminArticleItem = Tables<"articles"> & {
  workshops?: { name: string; logo_url: string | null; slug: string } | null;
  article_categories?: { name: string } | null;
};

function Admin() {
  const { isAdmin, loading } = useAuth();

  // 4 Top KPI Operational Metrics
  const { data: stats } = useQuery({
    queryKey: ["admin-kpi-stats"],
    queryFn: async () => {
      const [{ count: pending }, { count: published }, { data: workshops }, { count: categories }] =
        await Promise.all([
          supabase
            .from("articles")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("articles")
            .select("*", { count: "exact", head: true })
            .eq("status", "published"),
          supabase.from("workshops").select("id,owner_id"),
          supabase.from("article_categories").select("*", { count: "exact", head: true }),
        ]);

      const totalWorkshops = workshops?.length ?? 0;
      const assignedWorkshops = workshops?.filter((w) => !!w.owner_id).length ?? 0;

      return {
        pending: pending ?? 0,
        published: published ?? 0,
        totalWorkshops,
        assignedWorkshops,
        categories: categories ?? 0,
      };
    },
  });

  if (loading) return null;
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-primary">Akses Terbatas</h1>
        <p className="mt-2 text-muted-foreground">Halaman ini khusus pengurus / Admin PPBMR.</p>
        <Link to="/auth" className="mt-4 inline-block font-semibold text-primary underline">
          Masuk Sekarang →
        </Link>
      </div>
    );

  const pendingCount = stats?.pending ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-primary">
          Panel <span className="text-signal">Admin</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pusat kendali moderasi artikel, manajemen kategori, dan penugasan pemilik bengkel PPBMR.
        </p>
      </div>

      {/* 4 KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Perlu Review
            </span>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-800 dark:text-amber-300">
            {stats?.pending ?? 0}
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
            {stats?.pending && stats.pending > 0
              ? "Menunggu tindakan moderasi"
              : "Semua artikel telah ditinjau"}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Artikel Terbit
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-300">
            {stats?.published ?? 0}
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
            Aktif & dapat dibaca publik
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary">Bengkel Anggota</span>
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">
            {stats?.totalWorkshops ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground">
            <span className="font-bold text-primary">{stats?.assignedWorkshops ?? 0}</span> sudah
            terhubung pemilik
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Kategori Aktif</span>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">
            {stats?.categories ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Taksonomi artikel aktif</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="review" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 p-1 rounded-2xl bg-muted/60 h-auto">
          <TabsTrigger value="review" className="rounded-xl font-bold py-2.5">
            Review Artikel
            {pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.2 text-xs font-extrabold">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-xl font-bold py-2.5">
            Semua Artikel
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-xl font-bold py-2.5">
            Kategori Artikel
          </TabsTrigger>
          <TabsTrigger value="members" className="rounded-xl font-bold py-2.5">
            Pemilik Bengkel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="mt-0 focus-visible:outline-none">
          <ArticleList status="pending" />
        </TabsContent>
        <TabsContent value="all" className="mt-0 focus-visible:outline-none">
          <ArticleList />
        </TabsContent>
        <TabsContent value="categories" className="mt-0 focus-visible:outline-none">
          <CategoryManagement />
        </TabsContent>
        <TabsContent value="members" className="mt-0 focus-visible:outline-none">
          <Owners />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ArticleList({ status }: { status?: "pending" }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "pending" | "published" | "rejected"
  >("all");
  const [previewArticle, setPreviewArticle] = useState<AdminArticleItem | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<AdminArticleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const { data: articles = [], isLoading } = useQuery<AdminArticleItem[]>({
    queryKey: ["admin-articles", status],
    queryFn: async () => {
      let q = supabase
        .from("articles")
        .select("*,workshops(name,logo_url,slug),article_categories(name)")
        .order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      return (await q).data ?? [];
    },
  });

  async function act(
    id: string,
    patch: { status: "published" | "rejected" | "pending"; visibility?: "public" | "members" },
  ) {
    setActingId(id);
    const noteText = notes[id]?.trim() || null;
    const { error } = await supabase
      .from("articles")
      .update({ ...patch, admin_note: noteText })
      .eq("id", id);
    setActingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      patch.status === "published"
        ? `Artikel berhasil diterbitkan untuk ${patch.visibility === "public" ? "Semua Pembaca" : "Khusus Anggota"}`
        : patch.status === "rejected"
          ? "Artikel ditolak dengan catatan untuk bengkel"
          : "Artikel ditarik kembali ke status peninjauan (Pending)",
    );

    if (previewArticle && previewArticle.id === id) {
      setPreviewArticle(null);
    }

    qc.invalidateQueries({ queryKey: ["admin-articles"] });
    qc.invalidateQueries({ queryKey: ["admin-kpi-stats"] });
    qc.invalidateQueries({ queryKey: ["admin-pending-count"] });
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

    toast.success(`Artikel "${articleToDelete.title}" berhasil dihapus secara permanen.`);
    setArticleToDelete(null);
    qc.invalidateQueries({ queryKey: ["admin-articles"] });
    qc.invalidateQueries({ queryKey: ["admin-kpi-stats"] });
    qc.invalidateQueries({ queryKey: ["admin-pending-count"] });
  }

  // Filter and search logic
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      // Status filter (only applicable when not in specific review tab)
      if (!status && statusFilter !== "all" && a.status !== statusFilter) {
        return false;
      }

      // Search query (matches title or workshop name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = a.title.toLowerCase().includes(q);
        const workshopMatch = (a.workshops?.name ?? "").toLowerCase().includes(q);
        if (!titleMatch && !workshopMatch) return false;
      }

      return true;
    });
  }, [articles, status, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: articles.length,
      draft: articles.filter((a) => a.status === "draft").length,
      pending: articles.filter((a) => a.status === "pending").length,
      published: articles.filter((a) => a.status === "published").length,
      rejected: articles.filter((a) => a.status === "rejected").length,
    };
  }, [articles]);

  return (
    <div className="space-y-6">
      {/* Search and Filters (Tab Semua Artikel) */}
      {!status && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari artikel berdasarkan judul atau nama bengkel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
                onClick={() => setStatusFilter(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  statusFilter === item.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    statusFilter === item.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background text-foreground"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground py-6">Memuat data artikel…</p>}

      {!isLoading && filteredArticles.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground space-y-2">
          {status === "pending" ? (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500/60" />
              <p className="font-extrabold text-foreground text-base">
                Semua artikel telah selesai ditinjau!
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Tidak ada artikel baru yang sedang menunggu moderasi. Artikel baru dari bengkel akan
                muncul di sini setelah diajukan.
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="font-semibold text-foreground text-base">
                Tidak ada artikel yang sesuai dengan filter pencarian.
              </p>
              <p className="text-xs text-muted-foreground">
                Coba ubah kata kunci atau pilih filter status lainnya.
              </p>
            </>
          )}
        </div>
      )}

      {/* Review Tab: 2-Column Structured Moderation Cards */}
      {status === "pending" && (
        <div className="grid gap-5">
          {filteredArticles.map((a) => (
            <div
              key={a.id}
              className="grid lg:grid-cols-12 gap-5 rounded-2xl border border-amber-500/25 bg-card p-5 shadow-xs transition-shadow hover:shadow-card"
            >
              {/* Left Column: Workshop & Article Details */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                {/* Workshop Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div className="flex items-center gap-2.5">
                    <WorkshopLogo
                      name={a.workshops?.name ?? "Bengkel"}
                      url={a.workshops?.logo_url ?? null}
                      className="h-9 w-9 rounded-xl text-xs shadow-2xs"
                    />
                    <div>
                      <span className="font-bold text-sm text-foreground block">
                        {a.workshops?.name ?? "Bengkel"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Diajukan:{" "}
                        {new Date(a.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {a.article_categories?.name && (
                      <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                        {a.article_categories.name}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                      Menunggu Review
                    </span>
                  </div>
                </div>

                {/* Article Content & Cover Preview */}
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {a.cover_url && (
                    <div className="h-32 w-48 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-2xs">
                      <img src={a.cover_url} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <h3 className="font-black text-lg leading-snug text-foreground">{a.title}</h3>
                    <p className="line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                      {a.content}
                    </p>

                    {Array.isArray(a.tags) && a.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {a.tags.map((t: string) => (
                          <span
                            key={t}
                            className="rounded-md bg-secondary px-1.5 py-0.2 text-[10px] font-medium text-secondary-foreground"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {a.admin_note && (
                  <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-2.5 text-xs text-muted-foreground border border-border/60">
                    <AlertCircle className="h-4 w-4 text-signal shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-foreground">Catatan Terakhir:</span>{" "}
                      {a.admin_note}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Moderation Action Panel */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between rounded-xl bg-muted/40 p-4 border border-border/60 space-y-3.5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Tindakan Moderasi
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewArticle(a)}
                      className="gap-1.5 text-xs font-bold h-7.5 px-2.5 bg-background shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5" /> Pratinjau Penuh
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor={`note-${a.id}`}
                      className="text-[11px] font-semibold text-muted-foreground block"
                    >
                      Catatan Revisi / Masukan (opsional):
                    </label>
                    <Textarea
                      id={`note-${a.id}`}
                      placeholder="Tulis alasan jika menolak atau saran perbaikan..."
                      value={notes[a.id] ?? ""}
                      onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                      rows={2}
                      className="text-xs resize-none bg-background shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  <Button
                    size="sm"
                    variant="signal"
                    disabled={actingId === a.id}
                    onClick={() => act(a.id, { status: "published", visibility: "public" })}
                    className="w-full gap-1.5 text-xs font-bold h-9 shadow-xs"
                  >
                    <Globe className="h-4 w-4" /> Publish untuk Semua
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === a.id}
                      onClick={() => act(a.id, { status: "published", visibility: "members" })}
                      className="gap-1 text-xs font-bold h-8.5 bg-background"
                    >
                      <Lock className="h-3.5 w-3.5" /> Anggota
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actingId === a.id}
                      onClick={() => act(a.id, { status: "rejected" })}
                      className="gap-1 text-xs font-bold h-8.5"
                    >
                      <X className="h-3.5 w-3.5" /> Tolak
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Articles Tab: Full Article List */}
      {!status && (
        <div className="grid gap-4">
          {filteredArticles.map((a) => {
            const statusCfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG["pending"];
            return (
              <div
                key={a.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-card space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <WorkshopLogo
                        name={a.workshops?.name ?? "Bengkel"}
                        url={a.workshops?.logo_url ?? null}
                        className="h-8 w-8 rounded-lg text-xs"
                      />
                      <div>
                        <span className="font-bold text-sm text-foreground block">
                          {a.workshops?.name ?? "Bengkel"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {a.article_categories?.name && (
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {a.article_categories.name}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusCfg?.className}`}
                      >
                        {statusCfg?.label}
                        {a.status === "published"
                          ? ` · ${a.visibility === "public" ? "Semua" : "Anggota"}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {a.cover_url && (
                      <div className="h-28 w-44 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                        <img src={a.cover_url} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <h3 className="font-black text-lg leading-snug">{a.title}</h3>
                      <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {a.content}
                      </p>

                      {Array.isArray(a.tags) && a.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {a.tags.map((t: string) => (
                            <span
                              key={t}
                              className="rounded-md bg-secondary px-1.5 py-0.2 text-[10px] font-medium text-secondary-foreground"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {a.admin_note && (
                    <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-2.5 text-xs text-muted-foreground border border-border/60">
                      <AlertCircle className="h-4 w-4 text-signal shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-foreground">Catatan Terakhir:</span>{" "}
                        {a.admin_note}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="space-y-3 border-t pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewArticle(a)}
                        className="gap-1.5 text-xs font-bold h-8"
                      >
                        <Eye className="h-3.5 w-3.5" /> Pratinjau Penuh
                      </Button>

                      {a.status === "published" && a.workshops?.slug && (
                        <Button asChild size="sm" variant="ghost" className="gap-1 text-xs h-8">
                          <Link to="/artikel/$id" params={{ id: a.id }}>
                            Buka Artikel <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Action when published: Unpublish */}
                      {a.status === "published" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => act(a.id, { status: "pending" })}
                          className="gap-1.5 text-xs font-bold h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                          title="Tarik kembali artikel ini ke antrean review"
                        >
                          <Undo2 className="h-3.5 w-3.5" /> Tarik Publikasi (Unpublish)
                        </Button>
                      )}

                      {/* Admin Delete Button on All Articles */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setArticleToDelete(a)}
                        className="gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
                        title="Hapus artikel secara permanen"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Preview Dialog */}
      <Dialog open={!!previewArticle} onOpenChange={(open) => !open && setPreviewArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          {previewArticle && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span className="font-bold text-foreground">
                    {previewArticle.workshops?.name ?? "Bengkel"}
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(previewArticle.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {previewArticle.article_categories?.name && (
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                      {previewArticle.article_categories.name}
                    </span>
                  )}
                </div>
                <DialogTitle className="text-2xl font-black text-foreground">
                  {previewArticle.title}
                </DialogTitle>
              </DialogHeader>

              {previewArticle.cover_url && (
                <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted/20">
                  <img
                    src={previewArticle.cover_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="rounded-2xl border border-border/80 bg-muted/10 p-5">
                <MarkdownView content={previewArticle.content} />
              </div>

              {Array.isArray(previewArticle.tags) && previewArticle.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-xs font-bold text-muted-foreground">Tags:</span>
                  {previewArticle.tags.map((t: string) => (
                    <span
                      key={t}
                      className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Moderation Actions Inside Dialog */}
              <div className="border-t pt-4 space-y-3">
                <Input
                  placeholder="Tulis catatan untuk bengkel (opsional)..."
                  value={notes[previewArticle.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [previewArticle.id]: e.target.value })}
                  className="text-xs"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewArticle(null)}
                  >
                    Tutup Pratinjau
                  </Button>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actingId === previewArticle.id}
                      onClick={() => act(previewArticle.id, { status: "rejected" })}
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Tolak
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === previewArticle.id}
                      onClick={() =>
                        act(previewArticle.id, {
                          status: "published",
                          visibility: "members",
                        })
                      }
                    >
                      <Lock className="mr-1 h-3.5 w-3.5" /> Publish Anggota
                    </Button>
                    <Button
                      size="sm"
                      variant="signal"
                      disabled={actingId === previewArticle.id}
                      onClick={() =>
                        act(previewArticle.id, {
                          status: "published",
                          visibility: "public",
                        })
                      }
                      className="font-bold"
                    >
                      <Globe className="mr-1 h-3.5 w-3.5" /> Publish Semua
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!articleToDelete}
        onOpenChange={(open) => !open && setArticleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Artikel Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Artikel &quot;{articleToDelete?.title}&quot; milik bengkel &quot;
              {articleToDelete?.workshops?.name}&quot; akan dihapus secara permanen beserta berkas
              sampulnya dari penyimpanan.
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

function Owners() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unassigned" | "assigned">("all");
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: ws = [], isLoading: isLoadingWs } = useQuery({
    queryKey: ["admin-workshops"],
    queryFn: async () =>
      (await supabase.from("workshops").select("id,name,owner_id").order("name")).data ?? [],
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => (await supabase.from("profiles").select("id,email")).data ?? [],
  });

  // Map of profile id to email
  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => {
      if (p.email) map.set(p.id, p.email);
    });
    return map;
  }, [profiles]);

  // Counts for filter chips
  const counts = useMemo(() => {
    const unassigned = ws.filter((w) => !w.owner_id).length;
    const assigned = ws.filter((w) => !!w.owner_id).length;
    return {
      all: ws.length,
      unassigned,
      assigned,
    };
  }, [ws]);

  // Filtered workshops based on search and status chip
  const filteredWorkshops = useMemo(() => {
    return ws.filter((w) => {
      // Status filter
      if (statusFilter === "unassigned" && w.owner_id) return false;
      if (statusFilter === "assigned" && !w.owner_id) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const currentEmail = (w.owner_id ? profileMap.get(w.owner_id) : "")?.toLowerCase() ?? "";
        const nameMatch = w.name.toLowerCase().includes(q);
        const emailMatch = currentEmail.includes(q);
        if (!nameMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [ws, statusFilter, searchQuery, profileMap]);

  async function assign(id: string, targetEmail?: string) {
    setSavingId(id);
    const emailToSave = targetEmail !== undefined ? targetEmail : (emails[id] ?? "");
    const { error } = await supabase.rpc("assign_workshop_owner", {
      _workshop_id: id,
      _email: emailToSave.trim(),
    });
    setSavingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(emailToSave.trim() ? "Pemilik bengkel berhasil diperbarui" : "Pemilik dilepas");
    qc.invalidateQueries({ queryKey: ["admin-workshops"] });
    qc.invalidateQueries({ queryKey: ["admin-kpi-stats"] });
  }

  return (
    <div className="space-y-6">
      {/* Search and Status Filters */}
      <div className="space-y-3.5 rounded-2xl border border-border bg-card p-4 shadow-2xs">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-bold text-foreground">Panduan Penugasan:</span> Pemilik bengkel
          harus mendaftar akun di PPBMR terlebih dahulu. Masukkan email mereka di bawah untuk
          memberikan hak kelola bengkel & artikel. Kosongkan email untuk melepas akses kepemilikan.
        </p>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari bengkel berdasarkan nama atau email pemilik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>Semua Bengkel</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                statusFilter === "all"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-foreground"
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("unassigned")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
              statusFilter === "unassigned"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
            }`}
          >
            <span>Belum Ada Pemilik</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                statusFilter === "unassigned"
                  ? "bg-white/20 text-white"
                  : "bg-amber-500/20 text-amber-800 dark:text-amber-300"
              }`}
            >
              {counts.unassigned}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("assigned")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
              statusFilter === "assigned"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            <span>Sudah Terhubung</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                statusFilter === "assigned"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
              }`}
            >
              {counts.assigned}
            </span>
          </button>
        </div>
      </div>

      {/* Datalist for registered user emails autocomplete */}
      <datalist id="registered-emails">
        {profiles.map((p) => (p.email ? <option key={p.id} value={p.email} /> : null))}
      </datalist>

      {isLoadingWs && <p className="text-sm text-muted-foreground py-6">Memuat daftar bengkel…</p>}

      {!isLoadingWs && filteredWorkshops.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground text-base">Tidak ada bengkel ditemukan</p>
          <p className="text-xs text-muted-foreground">
            Coba sesuaikan kata kunci pencarian atau ganti filter status di atas.
          </p>
        </div>
      )}

      {/* Workshops Grid */}
      <div className="grid gap-3">
        {filteredWorkshops.map((w) => {
          const currentEmail = w.owner_id ? profileMap.get(w.owner_id) : null;
          const inputValue = emails[w.id] ?? currentEmail ?? "";
          const hasOwner = !!currentEmail;

          return (
            <div
              key={w.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs transition-shadow hover:shadow-card md:flex-row md:items-center md:justify-between"
            >
              <div className="md:w-72 space-y-1">
                <div className="font-extrabold text-base text-foreground leading-tight">
                  {w.name}
                </div>
                <div>
                  {hasOwner ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <UserCheck className="h-3.5 w-3.5" /> Terhubung:{" "}
                      <span className="font-mono">{currentEmail}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <UserX className="h-3.5 w-3.5" /> Belum Ada Pemilik
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  list="registered-emails"
                  placeholder="Ketik email pemilik (auto-suggest)..."
                  value={inputValue}
                  onChange={(e) => setEmails({ ...emails, [w.id]: e.target.value })}
                  className="text-xs flex-1"
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    disabled={savingId === w.id}
                    onClick={() => assign(w.id)}
                    className="h-9 px-4 font-bold text-xs"
                  >
                    {savingId === w.id ? "Menyimpan…" : "Simpan"}
                  </Button>

                  {hasOwner && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={savingId === w.id}
                      onClick={() => {
                        setEmails({ ...emails, [w.id]: "" });
                        void assign(w.id, "");
                      }}
                      className="h-9 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Lepas pemilik dari bengkel ini"
                    >
                      Lepas
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryManagement() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-article-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const slug = slugify(cleanName);
    if (!slug) {
      toast.error("Nama kategori tidak valid");
      return;
    }

    setIsSubmitting(true);
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);
    const { error } = await supabase.from("article_categories").insert({
      name: cleanName,
      slug,
      sort_order: maxOrder + 1,
    });
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Kategori "${cleanName}" berhasil ditambahkan`);
    setName("");
    qc.invalidateQueries({ queryKey: ["admin-article-categories"] });
    qc.invalidateQueries({ queryKey: ["article-categories"] });
    qc.invalidateQueries({ queryKey: ["admin-kpi-stats"] });
  }

  async function confirmDeleteCategory() {
    if (!categoryToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from("article_categories")
      .delete()
      .eq("id", categoryToDelete.id);
    setIsDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Kategori "${categoryToDelete.name}" berhasil dihapus.`);
    setCategoryToDelete(null);
    qc.invalidateQueries({ queryKey: ["admin-article-categories"] });
    qc.invalidateQueries({ queryKey: ["article-categories"] });
    qc.invalidateQueries({ queryKey: ["admin-kpi-stats"] });
  }

  const previewSlug = slugify(name);

  return (
    <div className="space-y-6">
      {/* Add Category Form Card */}
      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-3"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-black text-lg text-primary">Tambah Kategori Baru</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Kategori digunakan oleh pemilik bengkel untuk mengelompokkan artikel edukasi dan tips
          otomotif.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Input
            placeholder="Contoh: Perawatan Berkala, Sistem Pendingin..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1 text-sm"
          />
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="font-bold shrink-0"
          >
            <Plus className="mr-1.5 h-4 w-4" /> {isSubmitting ? "Menyimpan…" : "Tambah Kategori"}
          </Button>
        </div>

        {name.trim() && (
          <p className="text-xs text-muted-foreground pt-0.5">
            Pratinjau slug URL:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-primary font-bold">
              /{previewSlug || "slug-otomatis"}
            </code>
          </p>
        )}
      </form>

      {/* Category List Cards */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-black text-lg text-foreground">Daftar Kategori Artikel</h3>
            <p className="text-xs text-muted-foreground">
              Total {categories.length} kategori aktif tersedia di sistem.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {categories.length} Kategori
          </span>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground py-4">Memuat kategori...</p>}

        {!isLoading && categories.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">Belum ada kategori artikel.</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3.5 hover:bg-muted/40 transition-colors"
            >
              <div className="space-y-1">
                <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary border border-primary/20">
                  {c.name}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                  <span>/{c.slug}</span>
                  <span>·</span>
                  <span>Urutan #{c.sort_order}</span>
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title={`Hapus kategori "${c.name}"`}
                onClick={() => setCategoryToDelete({ id: c.id, name: c.name })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Category Alert Dialog */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori Artikel?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori &quot;{categoryToDelete?.name}&quot; akan dihapus. Artikel yang saat ini
              menggunakan kategori ini mungkin perlu disesuaikan kembali kategorinya oleh bengkel
              terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDeleteCategory();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
            >
              {isDeleting ? "Menghapus…" : "Ya, Hapus Kategori"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
