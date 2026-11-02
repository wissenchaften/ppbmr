import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MarkdownView } from "@/components/MarkdownView";

describe("MarkdownView YouTube Embeds", () => {
  it("renders an iframe for @[youtube](URL) syntax", () => {
    const content =
      "Berikut adalah video tutorial:\n\n@[youtube](https://www.youtube.com/watch?v=dQw4w9WgXcQ)\n\nSemoga bermanfaat.";
    const { container } = render(<MarkdownView content={content} />);

    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
    );
    expect(iframe?.getAttribute("loading")).toBe("lazy");
  });

  it("renders an iframe for a standalone YouTube URL on its own line", () => {
    const content = "Tonton video:\n\nhttps://youtu.be/dQw4w9WgXcQ\n\nPenjelasan lengkap di atas.";
    const { container } = render(<MarkdownView content={content} />);

    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
    );
  });

  it("does not render iframe for non-YouTube links", () => {
    const content = "Kunjungi website kami di https://google.com untuk informasi lebih lanjut.";
    const { container } = render(<MarkdownView content={content} />);

    const iframe = container.querySelector("iframe");
    expect(iframe).toBeNull();
  });
});
