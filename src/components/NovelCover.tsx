import { cn } from "@/lib/utils";

/**
 * Sampul novel yang digenerate — gaya tipografi literer.
 * Setiap coverStyle punya palet & motif sendiri; kalau ada coverUrl
 * (upload penulis ke storage), gambar itu yang dipakai.
 */

type CoverProps = {
  title: string;
  author?: string | null;
  style?: string | null;
  coverUrl?: string | null;
  className?: string;
  compact?: boolean;
};

const STYLES: Record<
  string,
  { bg: string; fg: string; sub: string; motif: "flame" | "moon" | "wave" | "leaf" | "key" | "star" | "coffee" }
> = {
  ember: { bg: "linear-gradient(160deg,#2a1a12 0%,#4a2415 55%,#7a3a1a 100%)", fg: "#f5e6cf", sub: "#d9a05b", motif: "flame" },
  goldleaf: { bg: "linear-gradient(160deg,#1c1710 0%,#33270f 55%,#54401a 100%)", fg: "#f2e3bd", sub: "#cd9b1f", motif: "star" },
  noir: { bg: "linear-gradient(160deg,#12100e 0%,#221f1b 60%,#35312a 100%)", fg: "#e8e2d4", sub: "#9a8f79", motif: "key" },
  cream: { bg: "linear-gradient(160deg,#efe3c8 0%,#e2d0ab 60%,#c9b184 100%)", fg: "#3a2d1a", sub: "#7a5f36", motif: "coffee" },
  abyss: { bg: "linear-gradient(160deg,#0b1520 0%,#122638 55%,#1d4258 100%)", fg: "#d9ecf5", sub: "#7fb3cc", motif: "wave" },
  verdant: { bg: "linear-gradient(160deg,#101c12 0%,#1c3320 55%,#2f5230 100%)", fg: "#e4efd9", sub: "#9bbd7e", motif: "leaf" },
  sepia: { bg: "linear-gradient(160deg,#2b2018 0%,#4a3826 55%,#6b5236 100%)", fg: "#f0e4cc", sub: "#c2a575", motif: "moon" },
};

function Motif({ kind, color, className }: { kind: string; color: string; className?: string }) {
  const common = { fill: "none", stroke: color, strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className };
  switch (kind) {
    case "flame":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 3c1 3-3 5-3 9a3 3 0 0 0 6 0c0-2-1-3-1-3s3 1.5 3 5a5 5 0 0 1-10 0C7 8 12 7 12 3z" />
        </svg>
      );
    case "moon":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M19 13.5A7.5 7.5 0 1 1 10.5 5a6 6 0 0 0 8.5 8.5z" />
        </svg>
      );
    case "wave":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
        </svg>
      );
    case "leaf":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19c3-6 7-10 12-12" />
        </svg>
      );
    case "key":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="8" cy="8" r="4" />
          <path d="M11 11l9 9M17 17l3-3M14 14l2-2" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />
        </svg>
      );
    case "coffee":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h2a2 2 0 0 1 0 4h-2M8 5c0-1 2-1 2-2M12 5c0-1 2-1 2-2" />
        </svg>
      );
    default:
      return null;
  }
}

export function NovelCover({ title, author, style, coverUrl, className, compact }: CoverProps) {
  const s = STYLES[style ?? "ember"] ?? STYLES.ember;
  if (coverUrl) {
    return (
      <div className={cn("relative aspect-[2/3] w-full overflow-hidden rounded-sm bg-muted", className)}>
        <img src={coverUrl} alt={`Sampul ${title}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 cover-shadow rounded-sm pointer-events-none" />
      </div>
    );
  }
  return (
    <div
      className={cn("cover-grain cover-shadow relative aspect-[2/3] w-full overflow-hidden rounded-sm", className)}
      style={{ background: s.bg }}
    >
      {/* bingkai tipis */}
      <div className="absolute inset-2 border opacity-40" style={{ borderColor: s.sub }} />
      <div className="absolute inset-0 flex flex-col items-center justify-between p-3 text-center">
        <Motif kind={s.motif} color={s.sub} className={cn("mt-2", compact ? "h-4 w-4" : "h-7 w-7")} />
        <div className="px-1">
          <p
            className={cn(
              "font-serif font-bold leading-tight text-balance",
              compact ? "text-[11px] line-clamp-3" : "text-base sm:text-lg line-clamp-4"
            )}
            style={{ color: s.fg }}
          >
            {title}
          </p>
        </div>
        <p
          className={cn("mb-1 font-sans uppercase tracking-[0.18em] truncate max-w-full", compact ? "text-[7px]" : "text-[10px]")}
          style={{ color: s.sub }}
        >
          {author || "Tanpa Nama"}
        </p>
      </div>
    </div>
  );
}
