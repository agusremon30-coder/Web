import { Link } from "react-router";
import { BookOpen, Bookmark, Eye, PenLine, Plus, Users, Type } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { NovelCover } from "@/components/NovelCover";
import { Button } from "@/components/ui/button";
import { formatCompact, STATUS_LABEL, STATUS_COLOR } from "@/lib/format";
import { LOGIN_PATH } from "@/const";
import { cn } from "@/lib/utils";

export default function Studio() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: LOGIN_PATH });
  const { data: stats } = trpc.profile.myStats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: novels, isLoading } = trpc.novel.mine.useQuery(undefined, { enabled: isAuthenticated });

  if (authLoading || !user)
    return <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6"><div className="h-40 animate-pulse rounded-lg bg-muted" /></div>;

  const statCards = [
    { icon: BookOpen, label: "Novel", value: stats?.novelCount ?? 0 },
    { icon: Eye, label: "Total Pembaca", value: stats?.totalViews ?? 0 },
    { icon: Bookmark, label: "Dikoleksi", value: stats?.totalBookmarks ?? 0 },
    { icon: Type, label: "Kata Ditulis", value: stats?.totalWords ?? 0 },
    { icon: Users, label: "Pengikut", value: stats?.followerCount ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">Studio Menulis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Halo, {user.penName || user.name}. Ini perkembangan karyamu.
          </p>
        </div>
        <Button asChild className="h-11">
          <Link to="/studio/baru">
            <Plus className="mr-2 h-4 w-4" /> Novel Baru
          </Link>
        </Button>
      </div>

      {/* Statistik */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <s.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 font-serif text-2xl font-bold">{formatCompact(s.value)}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Daftar karya */}
      <h2 className="mt-12 font-serif text-xl font-bold">Karyaku</h2>
      {isLoading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : novels && novels.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {novels.map((n) => (
            <Link
              key={n.id}
              to={`/studio/${n.id}`}
              className="group flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="w-16 shrink-0">
                <NovelCover compact title={n.title} style={n.coverStyle} coverUrl={n.coverUrl} author={n.authorPenName || n.authorName} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-serif font-semibold group-hover:text-primary transition-colors">{n.title}</p>
                  {!n.isPublished && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">disembunyikan</span>
                  )}
                </div>
                <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLOR[n.status])}>
                  {STATUS_LABEL[n.status]}
                </span>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{n.chapterCount} bab</span>
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{formatCompact(n.viewCount)}</span>
                  <span className="inline-flex items-center gap-1"><Bookmark className="h-3 w-3" />{formatCompact(n.bookmarkCount)}</span>
                </div>
              </div>
              <PenLine className="h-4 w-4 shrink-0 self-center text-muted-foreground/50 transition-colors group-hover:text-primary" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <PenLine className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-serif text-xl font-semibold">Belum ada karya</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Setiap novel besar dimulai dari satu bab pertama. Nyalakan lenteramu sekarang.
          </p>
          <Button asChild className="mt-2">
            <Link to="/studio/baru">
              <Plus className="mr-2 h-4 w-4" /> Tulis Novel Pertamamu
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
