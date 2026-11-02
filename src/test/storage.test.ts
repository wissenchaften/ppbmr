import { describe, it, expect } from "vitest";
import { deleteArticleCover } from "@/lib/storage";

describe("deleteArticleCover", () => {
  it("returns false for empty or invalid URL", async () => {
    expect(await deleteArticleCover("")).toBe(false);
    expect(await deleteArticleCover("https://example.com/some-image.jpg")).toBe(false);
  });
});
