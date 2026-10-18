import { Link } from "react-router";
import { Eye, Star, BookOpen } from "lucide-react";
import { NovelCover } from "./NovelCover";
import { formatCompact, STATUS_LABEL, STATUS_COLOR } from "@/lib/format";
import type { NovelCardData } from "@/types/novel";
import { cn } from "@/lib/utils";

export function Stars({ value, className, size = 14 }: { value: number; className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Rating ${value} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground/40"}
        />
      ))}
    </span>
  );
}

export function NovelCard({ novel, className }: { novel: NovelCardData; className?: string }) {
  return (
    <Link
      to={`/novel/${novel.slug}`}
      className={cn(
        "group flex flex-col gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md",
        className
      )}
    >
      <div className="relative transition-transform duration-300 ease-out group-hover:-translate-y-1.5">
        <NovelCover
          title={novel.title}
          author={novel.authorPenName || novel.authorName}
          style={novel.coverStyle}
          coverUrl={novel.coverUrl}
        />
      </div>
      <div className="min-w-0">
        <h3 className="font-serif font-semibold leading-snug line-clamp-2 text-[15px] group-hover:text-primary transition-colors">
          {novel.title}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">
          {novel.authorPenName || novel.authorName}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star size={11} className="fill-primary text-primary" />
            {novel.ratingAvg > 0 ? novel.ratingAvg.toFixed(1) : "—"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={11} />
            {formatCompact(novel.viewCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen size={11} />
            {novel.chapterCount}
          </span>
          <span className={cn("ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium", STATUS_COLOR[novel.status])}>
            {STATUS_LABEL[novel.status]}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function NovelCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="aspect-[2/3] w-full animate-pulse rounded-sm bg-muted" />
      <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
      <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
    </div>
  );
}
