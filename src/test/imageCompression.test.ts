import { describe, it, expect } from "vitest";
import { formatFileSize, compressImage } from "@/lib/imageCompression";

describe("formatFileSize", () => {
  it("formats bytes under 1KB correctly", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats bytes in KB range correctly", () => {
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(50 * 1024)).toBe("50 KB");
  });

  it("formats bytes in MB range correctly", () => {
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});

describe("compressImage", () => {
  it("gracefully handles node/mock environment by returning file", async () => {
    const dummyBlob = new Blob(["fake-image-bytes"], { type: "image/png" });
    const dummyFile = new File([dummyBlob], "logo.png", { type: "image/png" });

    const result = await compressImage(dummyFile);
    expect(result).toBeDefined();
    expect(result.file).toBeDefined();
    expect(result.originalSize).toBe(dummyFile.size);
  });
});
