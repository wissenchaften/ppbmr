export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg" | "image/png";
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
}

/**
 * Format bytes to readable string (e.g. "1.2 MB" or "45 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compresses an image file on the client side using HTML5 Canvas.
 * Automatically resizes to max dimensions (default 512x512) and converts
 * to high-quality WebP, preserving alpha transparency.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<CompressionResult> {
  const { maxWidth = 512, maxHeight = 512, quality = 0.85, mimeType = "image/webp" } = options;

  // SSR, headless test environments (jsdom without canvas), or non-browser fallback
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    (typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom"))
  ) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    let resolved = false;
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        URL.revokeObjectURL(objectUrl);
      }
    };

    // Safety timeout in case browser stalls image decode
    const timer = setTimeout(() => {
      cleanup();
      resolve({ file, originalSize: file.size, compressedSize: file.size });
    }, 4000);

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Proportional resize if larger than bounds
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          return resolve({ file, originalSize: file.size, compressedSize: file.size });
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              return resolve({ file, originalSize: file.size, compressedSize: file.size });
            }

            const ext =
              mimeType === "image/webp" ? "webp" : mimeType === "image/png" ? "png" : "jpg";
            const baseName =
              file.name.substring(0, file.name.lastIndexOf(".")) || "compressed_image";
            const compressedFile = new File([blob], `${baseName}.${ext}`, {
              type: blob.type || mimeType,
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: compressedFile.size,
            });
          },
          mimeType,
          quality,
        );
      } catch {
        cleanup();
        resolve({ file, originalSize: file.size, compressedSize: file.size });
      }
    };

    img.onerror = () => {
      cleanup();
      resolve({ file, originalSize: file.size, compressedSize: file.size });
    };

    img.src = objectUrl;
  });
}
