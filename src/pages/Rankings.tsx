import { useState } from "react";
import { Link } from "react-router";
import { Trophy, Eye, Star, Bookmark, TrendingUp } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { NovelCover } from "@/components/NovelCover";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NovelCardData } from "@/types/novel";

const TABS = [
  { key: "popular", label: "Terpopuler", icon: Eye, hint: "pembaca" },
  { key: "topRated", label: "Rating Tertinggi", icon: Star, hint: "rating" },
  { key: "bookmarked", label: "Paling Dikoleksi", icon: Bookmark, hint: "koleksi" },
] as const;

export default function Rankings() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("popular");
  const sort = tab === "popular" ? "popular" : tab === "topRated" ? "topRated" : "bookmarked";
  const { data, isLoading } = trpc.novel.browse.useQuery({ sort, page: 1, pageSize: 24 });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">Peringkat</h1>
          <p className="mt-1 text-sm text-muted-foreground">Novel-novel terbaik pilihan pembaca Lentera</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <ol className="mt-8 space-y-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))
          : data?.items.map((n: NovelCardData, i: number) => (
              <li key={n.id}>
                <Link
                  to={`/novel/${n.slug}`}
                  className="group flex items-center gap-4 rounded-lg border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-6 sm:p-4"
                >
                  <span
                    className={cn(
                      "w-10 shrink-0 text-center font-serif text-3xl font-bold",
                      i === 0 && "text-primary",
                      i === 1 && "text-primary/80",
                      i === 2 && "text-primary/60",
                      i > 2 && "text-muted-foreground/40"
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="w-16 shrink-0 sm:w-20">
                    <NovelCover compact title={n.title} style={n.coverStyle} coverUrl={n.coverUrl} author={n.authorPenName || n.authorName} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-lg font-semibold group-hover:text-primary transition-colors">
                      {n.title}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {n.authorPenName || n.authorName}
                      {n.genres && n.genres.length > 0 && <> · {n.genres.map((g) => g.name).join(", ")}</>}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        {n.ratingAvg > 0 ? `${n.ratingAvg.toFixed(1)} (${n.ratingCount ?? 0})` : "Belum ada rating"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> {formatCompact(n.viewCount)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bookmark className="h-3.5 w-3.5" /> {formatCompact(n.bookmarkCount ?? 0)}
                      </span>
                      {i < 3 && tab === "popular" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                          <TrendingUp className="h-3 w-3" /> Naik daun
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
      </ol>
    </div>
  );
}
