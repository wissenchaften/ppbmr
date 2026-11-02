import { useState, useRef } from "react";
import { UploadCloud, Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkshopLogo } from "@/components/WorkshopLogo";
import { uploadWorkshopLogo } from "@/lib/storage";
import { formatFileSize } from "@/lib/imageCompression";
import { toast } from "sonner";

interface WorkshopLogoUploaderProps {
  value: string;
  onChange: (url: string) => void;
  workshopId: string;
  userId: string;
  workshopName: string;
  disabled?: boolean;
}

export function WorkshopLogoUploader({
  value,
  onChange,
  workshopId,
  userId,
  workshopName,
  disabled = false,
}: WorkshopLogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setStats(null);
    try {
      const result = await uploadWorkshopLogo(file, workshopId, userId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        onChange(result.url);
        if (result.originalSize && result.compressedSize) {
          setStats({
            original: result.originalSize,
            compressed: result.compressedSize,
          });
          const reduction = Math.round(
            ((result.originalSize - result.compressedSize) / result.originalSize) * 100,
          );
          toast.success(
            `Logo berhasil diunggah! Ukuran dioptimasi ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (-${reduction}%).`,
          );
        } else {
          toast.success("Logo bengkel berhasil diunggah!");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengunggah logo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) handleFile(file);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) handleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setStats(null);
    toast.info("Logo dihapus. Jangan lupa klik 'Simpan Profil Bengkel' untuk menerapkan.");
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={onFileChange}
        disabled={disabled || isUploading}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl border border-border bg-card p-4 shadow-2xs">
        {/* Logo Preview Square */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`relative group flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
            isDragging
              ? "border-primary bg-primary/10 scale-102"
              : "border-border hover:border-primary/50 bg-muted/20"
          }`}
          title="Klik atau seret gambar ke sini untuk mengganti logo"
        >
          {/* Logo or Initials */}
          <WorkshopLogo
            name={workshopName || "Bengkel"}
            url={value || null}
            className="h-full w-full rounded-none border-0 text-2xl"
          />

          {/* Uploading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="mt-1 text-[10px] font-bold text-muted-foreground">Kompresi…</span>
            </div>
          )}

          {/* Hover Overlay */}
          {!isUploading && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-center text-[11px] font-bold text-white px-1">
                {value ? "Ganti Logo" : "Pilih Logo"}
              </span>
            </div>
          )}
        </div>

        {/* Details & Actions */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 font-bold"
            >
              <UploadCloud className="h-4 w-4" />
              {value ? "Ganti Logo Bengkel" : "Unggah Logo"}
            </Button>

            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isUploading}
                onClick={handleRemove}
                className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Logo
              </Button>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Format: <span className="font-semibold text-foreground">PNG, JPG, WebP</span> (Maks.
              2MB). Rasio kotak 1:1 direkomendasikan.
            </p>
            <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-signal inline" />
              Gambar otomatis dikompresi & dikonversi ke format WebP ringan agar cepat dimuat.
            </p>
          </div>

          {stats && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              Ukuran berkurang dari {formatFileSize(stats.original)} menjadi{" "}
              {formatFileSize(stats.compressed)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
