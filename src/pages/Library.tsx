import { Link } from "react-router";
import { BookOpen, History, Library as LibraryIcon, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { NovelCover } from "@/components/NovelCover";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { STATUS_LABEL, STATUS_COLOR } from "@/lib/format";
import { LOGIN_PATH } from "@/const";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Library() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: LOGIN_PATH });
  const utils = trpc.useUtils();
  const { data: library, isLoading } = trpc.social.myLibrary.useQuery(undefined, { enabled: isAuthenticated });
  const { data: cont } = trpc.social.continueReading.useQuery(undefined, { enabled: isAuthenticated });

  const toggle = trpc.social.toggleLibrary.useMutation({
    onSuccess: () => {
      utils.social.myLibrary.invalidate();
      toast.success("Dihapus dari pustaka");
    },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading || !user)
    return <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6"><div className="h-60 animate-pulse rounded-lg bg-muted" /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-3 font-serif text-3xl font-bold sm:text-4xl">
        <LibraryIcon className="h-8 w-8 text-primary" /> Pustakaku
      </h1>

      {/* Lanjutkan membaca */}
      {cont && cont.length > 0 && (
        <section className="mt-10" aria-label="Lanjutkan membaca">
          <h2 className="flex items-center gap-2 font-serif text-xl font-bold">
            <History className="h-5 w-5 text-primary" /> Lanjutkan Membaca
          </h2>
          <div className="scrollbar-none -mx-4 mt-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {cont.map((p) => {
              const pct = p.chapterCount > 0 ? Math.round((p.chapterNumber / p.chapterCount) * 100) : 0;
              return (
                <Link
                  key={p.novelId}
                  to={`/novel/${p.slug}/bab/${p.chapterNumber}`}
                  className="group w-64 shrink-0 snap-start rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex gap-3">
                    <div className="w-14 shrink-0">
                      <NovelCover compact title={p.title} style={p.coverStyle} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-serif font-semibold group-hover:text-primary transition-colors">{p.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        Bab {p.chapterNumber}: {p.chapterTitle}
                      </p>
                    </div>
                  </div>
                  <Progress value={pct} className="mt-3 h-1.5" />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{pct}% selesai</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Koleksi */}
      <section className="mt-12" aria-label="Koleksi novel">
        <h2 className="font-serif text-xl font-bold">Koleksi Saya {library ? <span className="text-sm font-normal text-muted-foreground">({library.length})</span> : null}</h2>
        {isLoading ? (
          <div className="mt-4 grid grid-cols-3 gap-5 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-sm bg-muted" />
            ))}
          </div>
        ) : library && library.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-x-5 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
            {library.map((n) => (
              <div key={n.id} className="group relative flex flex-col gap-2.5">
                <Link to={`/novel/${n.slug}`} className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
                  <NovelCover title={n.title} author={n.authorPenName || n.authorName} style={n.coverStyle} coverUrl={n.coverKey ? undefined : null} />
                </Link>
                <button
                  onClick={() => toggle.mutate({ novelId: n.id })}
                  aria-label={`Hapus ${n.title} dari pustaka`}
                  className="absolute right-1.5 top-1.5 rounded-full bg-background/85 p-2 text-muted-foreground opacity-100 shadow-sm backdrop-blur transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div>
                  <Link to={`/novel/${n.slug}`}>
                    <h3 className="line-clamp-2 font-serif text-[15px] font-semibold leading-snug hover:text-primary transition-colors">
                      {n.title}
                    </h3>
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className={cn("rounded-full px-1.5 py-0.5 font-medium", STATUS_COLOR[n.status])}>
                      {STATUS_LABEL[n.status]}
                    </span>
                    <span>{n.chapterCount} bab</span>
                    {n.progressChapter && <span className="text-primary">· Bab {n.progressChapter}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-serif text-xl font-semibold">Pustakamu masih kosong</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Simpan novel yang kamu suka agar mudah dilanjutkan kapan saja.
            </p>
            <Button asChild className="mt-2">
              <Link to="/jelajah">Cari Novel</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
