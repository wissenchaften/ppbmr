import React from "react";
import { extractYouTubeId, getYouTubeEmbedUrl } from "@/lib/youtube";

interface MarkdownViewProps {
  content: string;
  className?: string;
}

function renderInlineText(text: string): React.ReactNode {
  // Simple inline parser for bold, italic, and safe links
  // Pattern matching: **bold**, *italic*, [label](url)
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Check for bold: **text**
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      tokens.push(
        <strong key={key++} className="font-bold text-foreground">
          {boldMatch[2]}
        </strong>,
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Check for italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch) {
      tokens.push(
        <em key={key++} className="italic text-foreground">
          {italicMatch[2]}
        </em>,
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Check for link: [label](url)
    const linkMatch = remaining.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+|wa\.me\/[^\s)]+)\)/);
    if (linkMatch && linkMatch[1] !== undefined && linkMatch[2] !== undefined) {
      const rawUrl = linkMatch[2];
      const href = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
      tokens.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
        >
          {linkMatch[1]}
        </a>,
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Regular character
    const nextSpecial = remaining.search(/(\*\*|__|\*|_|\[)/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
}

export function MarkdownView({ content, className = "" }: MarkdownViewProps) {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let blockquoteLines: string[] = [];
  let elementKey = 0;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={elementKey++} className="my-3 list-disc space-y-1 pl-6 text-foreground">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineText(item)}
            </li>
          ))}
        </ul>,
      );
    } else {
      elements.push(
        <ol key={elementKey++} className="my-3 list-decimal space-y-1 pl-6 text-foreground">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineText(item)}
            </li>
          ))}
        </ol>,
      );
    }
    currentList = null;
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length === 0) return;
    elements.push(
      <blockquote
        key={elementKey++}
        className="my-3 border-l-4 border-primary/60 bg-muted/30 px-4 py-2 italic text-muted-foreground"
      >
        {blockquoteLines.map((line, idx) => (
          <p key={idx} className="leading-relaxed">
            {renderInlineText(line)}
          </p>
        ))}
      </blockquote>,
    );
    blockquoteLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine === undefined) continue;
    const trimmed = rawLine.trim();

    // YouTube embed syntax: @[youtube](URL) or standalone YouTube URL on its own line
    const ytExplicitMatch = trimmed.match(/^@\[youtube\]\((.+?)\)$/i);
    const isStandaloneYt =
      !ytExplicitMatch &&
      /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/[^\s]+$/i.test(trimmed);

    if (ytExplicitMatch || isStandaloneYt) {
      const targetUrl = ytExplicitMatch && ytExplicitMatch[1] ? ytExplicitMatch[1] : trimmed;
      const videoId = extractYouTubeId(targetUrl);
      if (videoId) {
        flushList();
        flushBlockquote();
        elements.push(
          <div
            key={elementKey++}
            className="my-5 w-full overflow-hidden rounded-2xl border border-border bg-black shadow-xs aspect-video"
          >
            <iframe
              src={getYouTubeEmbedUrl(videoId)}
              title="Video YouTube"
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>,
        );
        continue;
      }
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      flushList();
      blockquoteLines.push(trimmed.replace(/^>\s?/, ""));
      continue;
    } else {
      flushBlockquote();
    }

    // Bullet list (- or *)
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch && bulletMatch[1] !== undefined) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Numbered list (1. 2. etc)
    const numberMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numberMatch && numberMatch[1] !== undefined) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numberMatch[1]);
      continue;
    }

    // Normal non-list line: flush existing list
    flushList();

    // Empty lines
    if (!trimmed) {
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={elementKey++}
          className="mt-5 mb-2 text-xl font-bold tracking-tight text-foreground"
        >
          {renderInlineText(trimmed.slice(4))}
        </h3>,
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={elementKey++}
          className="mt-6 mb-3 text-2xl font-extrabold tracking-tight text-foreground"
        >
          {renderInlineText(trimmed.slice(3))}
        </h2>,
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1
          key={elementKey++}
          className="mt-7 mb-4 text-3xl font-black tracking-tight text-foreground"
        >
          {renderInlineText(trimmed.slice(2))}
        </h1>,
      );
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={elementKey++} className="my-2.5 leading-relaxed text-foreground/90">
        {renderInlineText(trimmed)}
      </p>,
    );
  }

  flushList();
  flushBlockquote();

  return <div className={`article-content space-y-1 ${className}`}>{elements}</div>;
}
