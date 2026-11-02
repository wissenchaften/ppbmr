import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  disabled?: boolean;
}

export function TagInput({
  value = [],
  onChange,
  maxTags = 10,
  placeholder = "Ketik tag lalu tekan Enter...",
  disabled = false,
}: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = (text: string) => {
    const cleaned = text.trim().replace(/^#+/, "").toLowerCase();

    if (!cleaned) return;

    if (value.includes(cleaned)) {
      toast.error(`Tag "${cleaned}" sudah ada`);
      setInput("");
      return;
    }

    if (value.length >= maxTags) {
      toast.error(`Maksimal ${maxTags} tag per artikel`);
      return;
    }

    onChange([...value, cleaned]);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const removeTag = (index: number) => {
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length >= maxTags ? "Maksimal tag tercapai" : placeholder}
          disabled={disabled || value.length >= maxTags}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => addTag(input)}
          disabled={disabled || !input.trim() || value.length >= maxTags}
          className="shrink-0"
        >
          <Plus className="mr-1 h-4 w-4" /> Tambah
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              #{tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(idx)}
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                  aria-label={`Hapus tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
