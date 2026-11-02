import { describe, it, expect } from "vitest";
import { extractYouTubeId, getYouTubeEmbedUrl, isValidYouTubeUrl } from "@/lib/youtube";

describe("extractYouTubeId", () => {
  const expectedId = "dQw4w9WgXcQ";

  it("extracts from standard desktop URL", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(expectedId);
    expect(extractYouTubeId("http://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(expectedId);
  });

  it("extracts from URL with extra query parameters", () => {
    expect(
      extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=share"),
    ).toBe(expectedId);
    expect(extractYouTubeId("https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ")).toBe(
      expectedId,
    );
  });

  it("extracts from shortlink (youtu.be)", () => {
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe(expectedId);
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe(expectedId);
  });

  it("extracts from YouTube Shorts", () => {
    expect(extractYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(expectedId);
  });

  it("extracts from mobile and embed URLs", () => {
    expect(extractYouTubeId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(expectedId);
    expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(expectedId);
  });

  it("accepts bare 11-character video ID", () => {
    expect(extractYouTubeId("dQw4w9WgXcQ")).toBe(expectedId);
  });

  it("returns null for non-YouTube or invalid URLs", () => {
    expect(extractYouTubeId("https://vimeo.com/123456789")).toBeNull();
    expect(extractYouTubeId("https://google.com")).toBeNull();
    expect(extractYouTubeId("not-a-youtube-url")).toBeNull();
    expect(extractYouTubeId("")).toBeNull();
  });
});

describe("getYouTubeEmbedUrl", () => {
  it("formats privacy-friendly youtube-nocookie embed URL", () => {
    expect(getYouTubeEmbedUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
    );
  });
});

describe("isValidYouTubeUrl", () => {
  it("returns true for valid YouTube URLs", () => {
    expect(isValidYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    expect(isValidYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
  });

  it("returns false for invalid inputs", () => {
    expect(isValidYouTubeUrl("https://instagram.com")).toBe(false);
    expect(isValidYouTubeUrl("")).toBe(false);
  });
});
