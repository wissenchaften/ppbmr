import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Globe, Lock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

function Admin() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <div className="mx-auto max-w-3xl px-4 py-12">Halaman ini khusus admin. <Link to="/auth" className="text-primary">Masuk</Link></div>;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black text-primary">Panel <span className="text-signal">Admin</span></h1>
      <Tabs defaultValue="review" className="mt-6">
        <TabsList>
          <TabsTrigger value="review">Review artikel</TabsTrigger>
          <TabsTrigger value="all">Semua artikel</TabsTrigger>
          <TabsTrigger value="members">Pemilik bengkel</TabsTrigger>
        </TabsList>
        <TabsContent value="review"><ArticleList status="pending" /></TabsContent>
        <TabsContent value="all"><ArticleList /></TabsContent>
        <TabsContent value="members"><Owners /></TabsContent>
      </Tabs>
    </div>
  );
}

function ArticleList({ status }: { status?: "pending" }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-articles", status],
    queryFn: async () => {
      let q = supabase.from("articles").select("*,workshops(name)").order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      return (await q).data ?? [];
    },
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  async function act(id: string, patch: { status: "published" | "rejected"; visibility?: "public" | "members" }) {
    const { error } = await supabase.from("articles").update({ ...patch, admin_note: notes[id] || null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(patch.status === "published" ? "Artikel diterbitkan" : "Artikel ditolak");
    qc.invalidateQueries();
  }
  if (data.length === 0) return <p className="mt-6 text-muted-foreground">Tidak ada artikel.</p>;
  return (
    <div className="mt-6 space-y-4">
      {data.map((a) => (
        <div key={a.id} className="rounded-2xl border p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-primary">{a.workshops?.name}</span>
            <span>· {new Date(a.created_at).toLocaleString("id-ID")}</span>
            <span className="rounded bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
              {a.status}{a.status === "published" ? ` · ${a.visibility}` : ""}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-extrabold">{a.title}</h3>
          <p className="mt-2 max-h-40 overflow-auto whitespace-pre-line text-sm">{a.content}</p>
          <Input className="mt-3" placeholder="Catatan untuk bengkel (opsional)" value={notes[a.id] ?? ""} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => act(a.id, { status: "published", visibility: "public" })}><Globe /> Publish untuk semua</Button>
            <Button size="sm" variant="outline" onClick={() => act(a.id, { status: "published", visibility: "members" })}><Lock /> Publish untuk anggota</Button>
            <Button size="sm" variant="signal" onClick={() => act(a.id, { status: "rejected" })}><X /> Tolak</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Owners() {
  const qc = useQueryClient();
  const { data: ws = [] } = useQuery({
    queryKey: ["admin-workshops"],
    queryFn: async () => (await supabase.from("workshops").select("id,name,owner_id").order("name")).data ?? [],
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => (await supabase.from("profiles").select("id,email")).data ?? [],
  });
  const [emails, setEmails] = useState<Record<string, string>>({});
  async function assign(id: string) {
    const { error } = await supabase.rpc("assign_workshop_owner", { _workshop_id: id, _email: emails[id] ?? "" });
    if (error) { toast.error(error.message); return; }
    toast.success("Pemilik diperbarui");
    qc.invalidateQueries();
  }
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-muted-foreground">Pemilik bengkel harus mendaftar akun dulu, lalu masukkan emailnya di sini. Kosongkan untuk melepas.</p>
      {ws.map((w) => {
        const current = profiles.find((p) => p.id === w.owner_id)?.email;
        return (
          <div key={w.id} className="flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-center">
            <div className="md:w-60">
              <div className="font-bold">{w.name}</div>
              <div className="text-xs text-muted-foreground">{current ?? "Belum ada pemilik"}</div>
            </div>
            <Input placeholder="email pemilik" value={emails[w.id] ?? current ?? ""} onChange={(e) => setEmails({ ...emails, [w.id]: e.target.value })} />
            <Button size="sm" onClick={() => assign(w.id)}>Simpan</Button>
          </div>
        );
      })}
    </div>
  );
}
