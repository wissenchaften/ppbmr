import { useEffect, useRef, useState } from "react";
import { Navigation, LocateFixed, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { directionsUrl } from "@/lib/maps";
import { toast } from "sonner";

type Props = {
  lat: number;
  lng: number;
  label?: string;
  size?: "sm" | "default" | "lg";
  variant?: "signal" | "default" | "outline";
  className?: string;
  stopPropagation?: boolean;
};

/** Tombol petunjuk arah: pengunjung memilih titik awal — lokasi saat ini (izin lokasi) atau tentukan sendiri di Google Maps. */
export function DirectionsMenu({ lat, lng, label = "Petunjuk arah", size = "sm", variant = "signal", className, stopPropagation }: Props) {
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const openDirections = (origin?: { lat: number; lng: number }) => {
    window.open(directionsUrl(lat, lng, origin), "_blank", "noreferrer");
    setOpen(false);
  };

  const fromMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Peramban tidak mendukung lokasi. Pilih titik awal sendiri di Google Maps.");
      openDirections();
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        openDirections({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        toast.error("Izin lokasi tidak diberikan. Silakan tentukan titik awal sendiri.");
        openDirections();
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div ref={ref} className={`relative ${className ?? ""}`} onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}>
      <Button size={size} variant={variant} onClick={() => setOpen((v) => !v)} disabled={locating}>
        {locating ? <Loader2 className="animate-spin" /> : <Navigation />} {label}
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-card">
          <button
            type="button"
            onClick={fromMyLocation}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-secondary"
          >
            <LocateFixed className="h-4 w-4 shrink-0 text-signal" />
            Dari lokasi saya saat ini
          </button>
          <button
            type="button"
            onClick={() => openDirections()}
            className="flex w-full items-center gap-2 border-t px-4 py-3 text-left text-sm font-medium hover:bg-secondary"
          >
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            Tentukan titik awal sendiri
          </button>
        </div>
      )}
    </div>
  );
}
