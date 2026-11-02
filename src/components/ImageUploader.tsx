import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadArticleCover } from "@/lib/storage";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  userId: string;
  disabled?: boolean;
}

export function ImageUploader({ value, onChange, userId, disabled = false }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadArticleCover(file, userId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        onChange(result.url);
        toast.success("Gambar sampul berhasil diunggah!");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengunggah gambar.");
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
    const file = files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const file = files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={onFileChange}
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className="relative group overflow-hidden rounded-xl border border-border bg-muted/20">
          <img
            src={value}
            alt="Sampul artikel"
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-background/90 hover:bg-background"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <ImageIcon className="mr-1.5 h-4 w-4" /> Ganti Gambar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || isUploading}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Hapus
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Mengunggah gambar...</p>
              <p className="text-xs text-muted-foreground">Mohon tunggu sebentar</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-2">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Klik untuk unggah atau seret file ke sini
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, JPEG, atau WebP (Maksimal 5MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
