import { cn } from "@/lib/utils";

export function WorkshopLogo({
  name,
  url,
  className,
}: {
  name: string;
  url?: string | null;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-primary bg-background font-display text-lg font-black text-primary",
        className ?? "h-14 w-14",
      )}
    >
      {url ? (
        <img src={url} alt={`Logo ${name}`} className="h-full w-full object-contain" />
      ) : (
        <span>
          {initials}
          <span className="text-signal">.</span>
        </span>
      )}
    </div>
  );
}
