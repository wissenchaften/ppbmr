import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ChipInputProps {
  items: string[];
  onChange: (items: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function ChipInput({
  items,
  onChange,
  suggestions = [],
  placeholder = "Ketik item lalu tekan Enter...",
  disabled = false,
}: ChipInputProps) {
  const [inputVal, setInputVal] = useState("");

  const addItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Prevent duplicate entries (case-insensitive)
    const exists = items.some((item) => item.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setInputVal("");
      return;
    }
    onChange([...items, trimmed]);
    setInputVal("");
  };

  const removeItem = (indexToRemove: number) => {
    onChange(items.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(inputVal);
    }
  };

  // Available suggestions that haven't been added yet
  const availableSuggestions = suggestions.filter(
    (s) => !items.some((item) => item.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      {/* Active Selected Chips */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {items.map((item, idx) => (
            <span
              key={`${item}-${idx}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary shadow-2xs transition-all animate-in fade-in-50 duration-150"
            >
              <span>{item}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeItem(idx)}
                className="rounded p-0.5 text-primary/70 hover:bg-primary/20 hover:text-primary transition-colors focus:outline-none"
                aria-label={`Hapus ${item}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Field with Add Button */}
      <div className="flex gap-2">
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !inputVal.trim()}
          onClick={() => addItem(inputVal)}
          className="shrink-0 gap-1 text-xs font-bold h-9 px-3"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah
        </Button>
      </div>

      {/* Quick Suggestion Pills */}
      {availableSuggestions.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-muted-foreground block">
            Saran Cepat Populer (klik untuk menambahkan):
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {availableSuggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                disabled={disabled}
                onClick={() => addItem(sug)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <Plus className="h-2.5 w-2.5" />
                <span>{sug}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
