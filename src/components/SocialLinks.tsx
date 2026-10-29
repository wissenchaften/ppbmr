import { FaInstagram, FaFacebookF, FaYoutube, FaTiktok, FaWhatsapp, FaGlobe } from "react-icons/fa6";
import type { IconType } from "react-icons";

type Socials = {
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  whatsapp?: string | null;
};

const ITEMS: { key: keyof Socials; label: string; Icon: IconType; className: string }[] = [
  { key: "instagram", label: "Instagram", Icon: FaInstagram, className: "bg-signal text-signal-foreground" },
  { key: "facebook", label: "Facebook", Icon: FaFacebookF, className: "bg-primary text-primary-foreground" },
  { key: "youtube", label: "YouTube", Icon: FaYoutube, className: "bg-signal text-signal-foreground" },
  { key: "tiktok", label: "TikTok", Icon: FaTiktok, className: "bg-foreground text-background" },
  { key: "whatsapp", label: "WhatsApp", Icon: FaWhatsapp, className: "bg-primary text-primary-foreground" },
  { key: "website", label: "Website", Icon: FaGlobe, className: "bg-secondary text-secondary-foreground" },
];

export function SocialLinks({ w }: { w: Socials }) {
  const items = ITEMS.filter((i) => w[i.key]);
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ key, label, Icon, className }) => (
        <a
          key={key}
          href={w[key]!}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-transform hover:scale-105 ${className}`}
        >
          <Icon className="h-4 w-4" /> {label}
        </a>
      ))}
    </div>
  );
}
