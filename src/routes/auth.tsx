import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/ppbmr-logo.webp.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — PPBMR" },
      { name: "description", content: "Masuk atau daftar sebagai anggota bengkel PPBMR." },
      { property: "og:title", content: "Masuk — PPBMR" },
      { property: "og:description", content: "Akses akun anggota PPBMR." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/" });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const id = email.trim().toLowerCase();
      const loginEmail = id.includes("@") ? id : id === "pbmr malang raya" ? "admin@ppbmr-malangraya.id" : id;
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      if (error) toast.error(error.message);
      else toast.success("Cek email Anda untuk konfirmasi akun.");
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(String(r.error.message ?? r.error));
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border p-8 shadow-card">
        <img src={logo.url} alt="Logo PPBMR" width={128} height={67} className="mx-auto h-16 w-auto" />
        <h1 className="mt-4 text-center text-2xl font-black text-primary">{mode === "in" ? "Masuk" : "Daftar akun"}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Pemilik bengkel: daftar dulu, lalu admin akan menghubungkan akun Anda ke bengkel.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "up" && (
            <div><Label>Nama</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          )}
          <div><Label>{mode === "in" ? "Email atau username" : "Email"}</Label><Input type={mode === "in" ? "text" : "email"} value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><Label>Kata sandi</Label><Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <Button className="w-full" disabled={busy}>{mode === "in" ? "Masuk" : "Daftar"}</Button>
        </form>
        <Button variant="outline" className="mt-3 w-full" onClick={google}>Lanjut dengan Google</Button>
        <button className="mt-4 w-full text-sm text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </div>
    </div>
  );
}
