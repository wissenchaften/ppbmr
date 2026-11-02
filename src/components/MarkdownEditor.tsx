import { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Eye,
  Edit3,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MarkdownView } from "@/components/MarkdownView";
import { extractYouTubeId, isValidYouTubeUrl } from "@/lib/youtube";
import { toast } from "sonner";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Tulis isi artikel Anda menggunakan format teks di atas...",
  rows = 10,
  required = false,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [ytOpen, setYtOpen] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertYouTube = () => {
    const videoId = extractYouTubeId(ytUrl);
    if (!videoId) {
      toast.error("URL YouTube tidak valid. Harap periksa kembali tautan Anda.");
      return;
    }

    const textarea = textareaRef.current;
    const insertText = `\n\n@[youtube](https://www.youtube.com/watch?v=${videoId})\n\n`;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = textarea.value;
      const nextValue = current.substring(0, start) + insertText + current.substring(end);
      onChange(nextValue);

      setTimeout(() => {
        textarea.focus();
        const nextPos = start + insertText.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 10);
    } else {
      onChange(value ? `${value}${insertText}` : insertText);
    }

    setYtUrl("");
    setYtOpen(false);
    toast.success("Video YouTube berhasil disisipkan!");
  };

  const applyFormat = (prefix: string, suffix: string = "", defaultText: string = "teks") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end) || defaultText;

    const replacement = `${prefix}${selected}${suffix}`;
    const nextValue = current.substring(0, start) + replacement + current.substring(end);
    onChange(nextValue);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  };

  const applyLinePrefix = (prefix: string, defaultText: string = "Item") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end);

    let replacement = "";
    if (selected.length > 0) {
      replacement = selected
        .split("\n")
        .map((line) => `${prefix} ${line}`)
        .join("\n");
    } else {
      replacement = `\n${prefix} ${defaultText}\n`;
    }

    const nextValue = current.substring(0, start) + replacement + current.substring(end);
    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
    }, 10);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Tebal (Bold)"
            onClick={() => applyFormat("**", "**", "teks tebal")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Miring (Italic)"
            onClick={() => applyFormat("*", "*", "teks miring")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Judul Bab (Heading 2)"
            onClick={() => applyLinePrefix("##", "Judul Bab")}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Sub Judul (Heading 3)"
            onClick={() => applyLinePrefix("###", "Sub Judul")}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Daftar Poin (Bullet List)"
            onClick={() => applyLinePrefix("-", "Poin")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Daftar Angka (Numbered List)"
            onClick={() => applyLinePrefix("1.", "Langkah")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Kutipan (Quote)"
            onClick={() => applyLinePrefix(">", "Kutipan atau tips penting...")}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Popover open={ytOpen} onOpenChange={setYtOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                title="Sisipkan Video YouTube"
              >
                <Video className="h-4 w-4 text-red-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-3" align="start">
              <div className="space-y-1">
                <h4 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                  <Video className="h-4 w-4 text-red-500" /> Sisipkan Video YouTube
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Mendukung link video YouTube standar, shortlink youtu.be, atau Shorts.
                </p>
              </div>
              <div className="space-y-1.5">
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleInsertYouTube();
                    }
                  }}
                  className="text-xs"
                  autoFocus
                />
                {ytUrl.trim() && !isValidYouTubeUrl(ytUrl) && (
                  <p className="text-[11px] font-medium text-destructive">
                    Format link YouTube belum valid
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-1 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setYtOpen(false)}
                  className="text-xs h-7 px-2.5"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="signal"
                  disabled={!ytUrl.trim() || !isValidYouTubeUrl(ytUrl)}
                  onClick={handleInsertYouTube}
                  className="text-xs h-7 px-3 font-bold"
                >
                  Sisipkan Video
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Tab Switcher: Tulis vs Pratinjau */}
        <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              tab === "write"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" /> Tulis
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              tab === "preview"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Pratinjau
          </button>
        </div>
      </div>

      {/* Editor Content Body */}
      {tab === "write" ? (
        <div className="p-2">
          <Textarea
            ref={textareaRef}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="border-0 shadow-none focus-visible:ring-0 resize-y p-3 text-base leading-relaxed"
          />
        </div>
      ) : (
        <div className="min-h-[200px] p-5 bg-background">
          {value.trim() ? (
            <MarkdownView content={value} />
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Belum ada tulisan untuk ditampilkan di pratinjau. Ketik sesuatu di tab "Tulis".
            </p>
          )}
        </div>
      )}
    </div>
  );
}
