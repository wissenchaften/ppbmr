import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "./imageCompression";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export interface UploadResult {
  url?: string;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
}

/**
 * Validates and uploads an article cover image to Supabase Storage.
 *
 * @param file - The File object to upload
 * @param userId - ID of the uploading user for namespace partitioning
 * @returns UploadResult containing either the public URL or an error message
 */
export async function uploadArticleCover(file: File, userId: string): Promise<UploadResult> {
  if (!file) {
    return { error: "File tidak ditemukan." };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      error: "Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WebP.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      error: "Ukuran gambar terlalu besar. Maksimal ukuran file adalah 5MB.",
    };
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);
  const filePath = `${userId}/${Date.now()}-${uniqueId}.${fileExt}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from("article-covers")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data } = supabase.storage.from("article-covers").getPublicUrl(filePath);

    return { url: data.publicUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah gambar.";
    return { error: message };
  }
}

/**
 * Removes an article cover image from Supabase Storage using its public URL.
 *
 * @param coverUrl - Public URL of the cover image
 * @returns boolean indicating success
 */
export async function deleteArticleCover(coverUrl: string): Promise<boolean> {
  if (!coverUrl) return false;
  try {
    const marker = "/article-covers/";
    const idx = coverUrl.indexOf(marker);
    if (idx === -1) return false;
    const rawPath = coverUrl.substring(idx + marker.length).split("?")[0];
    const filePath = decodeURIComponent(rawPath || "");
    if (!filePath) return false;

    const { error } = await supabase.storage.from("article-covers").remove([filePath]);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Validates, compresses, and uploads a workshop logo to Supabase Storage ('workshop-logos' bucket).
 * Client-side compression converts images to optimized WebP (max 512x512) preserving transparency.
 *
 * @param file - The raw File object from user input
 * @param workshopId - ID of the workshop for namespace folder structure
 * @param userId - ID of the authenticated user
 * @returns UploadResult with the public URL, error, and compression statistics
 */
export async function uploadWorkshopLogo(
  file: File,
  workshopId: string,
  _userId?: string,
): Promise<UploadResult> {
  if (!file) {
    return { error: "File logo tidak ditemukan." };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      error: "Format file tidak didukung. Harap unggah logo bertipe JPG, PNG, atau WebP.",
    };
  }

  if (file.size > MAX_LOGO_FILE_SIZE) {
    return {
      error: "Ukuran file logo terlalu besar. Maksimal ukuran file adalah 2MB.",
    };
  }

  try {
    // Client-side compression and conversion to 512x512 WebP
    const compression = await compressImage(file, {
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.85,
      mimeType: "image/webp",
    });

    const fileToUpload = compression.file;
    const uniqueId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);
    const filePath = `${workshopId}/${Date.now()}-${uniqueId}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("workshop-logos")
      .upload(filePath, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/webp",
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data } = supabase.storage.from("workshop-logos").getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      originalSize: compression.originalSize,
      compressedSize: compression.compressedSize,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah logo bengkel.";
    return { error: message };
  }
}
