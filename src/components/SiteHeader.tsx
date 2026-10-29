import { Link, useNavigate } from "@tanstack/react-router";
import logo from "@/assets/ppbmr-logo.webp.asset.json";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { session, isAdmin, isMember } = useAuth();
  const navigate = useNavigate();
  const link = "text-sm font-semibold text-muted-foreground hover:text-primary";
  const active = { className: "text-primary" };
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="h-1 bg-signal" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo.url} alt="Logo PPBMR" width={80} height={42} className="h-10 w-auto" />
          <div className="leading-tight">
            <div className="font-display text-lg font-black text-primary">PPBMR</div>
            <div className="text-[11px] text-muted-foreground">Bengkel terbaik dan terpercaya l Malang Raya</div>
          </div>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-5">
          <Link to="/" className={link} activeProps={active} activeOptions={{ exact: true }}>
            Daftar Bengkel
          </Link>
          <Link to="/artikel" className={link} activeProps={active}>
            Artikel
          </Link>
          {isMember && (
            <Link to="/dashboard" className={link} activeProps={active}>
              Bengkel Saya
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className={link} activeProps={active}>
              Admin
            </Link>
          )}
        </nav>
        {session ? (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
          >
            Keluar
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link to="/auth">Masuk</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
