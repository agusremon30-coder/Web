import { Link, useParams } from "react-router";
import { useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Eye,
  ListOrdered,
  PenLine,
  Play,
  Star,
  History,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { NovelCover } from "@/components/NovelCover";
import { CommentSection } from "@/components/Comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCompact, readingMinutes, STATUS_LABEL, STATUS_COLOR, timeAgo } from "@/lib/format";
import { LOGIN_PATH } from "@/const";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function RatingInput({ novelId, myRating }: { novelId: number; myRating: number | null }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [score, setScore] = useState(myRating ?? 0);

  const rate = trpc.social.rate.useMutation({
    onSuccess: () => {
      toast.success("Rating tersimpan. Terima kasih!");
      utils.novel.bySlug.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated)
    return (
      <p className="text-sm text-muted-foreground">
        <Link to={LOGIN_PATH} className="font-medium text-primary hover:underline">
          Masuk
        </Link>{" "}
        untuk memberi rating.
      </p>
    );

  return (
    <div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(0)}
            onClick={() => setScore(i)}
            className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Beri rating ${i} dari 5`}
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                i <= (hover || score) ? "fill-primary text-primary" : "text-muted-foreground/40"
              )}
            />
          </button>
        ))}
        {score > 0 && <span className="ml-2 text-sm text-muted-foreground">{score}/5</span>}
      </div>
      {score > 0 && (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            rate.mutate({ novelId, score, review: review.trim() || undefined });
          }}
        >
          <Textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tulis ulasan singkat (opsional)…"
            rows={2}
            maxLength={2000}
          />
          <Button type="submit" disabled={rate.isPending} className="h-10 self-end">
            {rate.isPending ? "Menyimpan…" : "Kirim Rating"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function NovelDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: novel, isLoading, error } = trpc.novel.bySlug.useQuery({ slug: slug! });
  const { data: reviews } = trpc.social.reviews.useQuery(
    { novelId: novel?.id ?? 0 },
    { enabled: !!novel }
  );

  const toggleLib = trpc.social.toggleLibrary.useMutation({
    onSuccess: (r) => {
      toast.success(r.inLibrary ? "Ditambahkan ke pustakamu" : "Dihapus dari pustaka");
      utils.novel.bySlug.invalidate({ slug: slug! });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[240px_1fr]">
          <div className="aspect-[2/3] animate-pulse rounded-sm bg-muted" />
          <div className="space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-32 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );

  if (error || !novel)
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="font-serif text-2xl font-bold">Novel tidak ditemukan</p>
        <p className="mt-2 text-sm text-muted-foreground">Mungkin sudah dihapus atau tautannya keliru.</p>
        <Button asChild className="mt-6">
          <Link to="/jelajah">Kembali Menjelajah</Link>
        </Button>
      </div>
    );

  const firstChapter = novel.chapters.find((c) => c.status === "published") ?? novel.chapters[0];
  const continueChapter = novel.myProgress
    ? novel.chapters.find((c) => c.number === novel.myProgress!.chapterNumber) ?? firstChapter
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Kepala novel */}
      <div className="grid gap-8 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">
        <div className="mx-auto w-44 sm:w-52 md:w-full">
          <NovelCover
            title={novel.title}
            author={novel.authorPenName || novel.authorName}
            style={novel.coverStyle}
            coverUrl={novel.coverUrl}
          />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_COLOR[novel.status])}>
              {STATUS_LABEL[novel.status]}
            </span>
            {novel.genres.map((g) => (
              <Link
                key={g.id}
                to={`/jelajah?genre=${g.slug}`}
                className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {g.name}
              </Link>
            ))}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl">
            {novel.title}
          </h1>
          <Link
            to={`/penulis/${novel.authorId}`}
            className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Avatar className="h-6 w-6 border">
              <AvatarImage src={novel.authorAvatar ?? undefined} />
              <AvatarFallback className="bg-accent text-[10px] font-semibold text-accent-foreground">
                {(novel.authorPenName || novel.authorName || "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {novel.authorPenName || novel.authorName}
          </Link>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="flex items-center gap-1.5 font-semibold">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {novel.ratingAvg > 0 ? novel.ratingAvg.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">{novel.ratingCount} rating</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-semibold">
                <Eye className="h-4 w-4" /> {formatCompact(novel.viewCount)}
              </p>
              <p className="text-xs text-muted-foreground">pembaca</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-semibold">
                <ListOrdered className="h-4 w-4" /> {novel.chapterCount}
              </p>
              <p className="text-xs text-muted-foreground">bab · {formatCompact(novel.wordCount)} kata</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-semibold">
                <Bookmark className="h-4 w-4" /> {formatCompact(novel.bookmarkCount)}
              </p>
              <p className="text-xs text-muted-foreground">koleksi</p>
            </div>
          </div>

          {/* Aksi */}
          <div className="mt-7 flex flex-wrap gap-3">
            {novel.isOwner ? (
              <>
                <Button asChild size="lg" className="h-12">
                  <Link to={`/studio/${novel.id}`}>
                    <PenLine className="mr-2 h-4 w-4" /> Kelola Novel
                  </Link>
                </Button>
                {firstChapter && (
                  <Button asChild variant="outline" size="lg" className="h-12">
                    <Link to={`/novel/${novel.slug}/bab/${firstChapter.number}`}>
                      <BookOpen className="mr-2 h-4 w-4" /> Pratinjau Baca
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                {continueChapter ? (
                  <Button asChild size="lg" className="h-12">
                    <Link to={`/novel/${novel.slug}/bab/${continueChapter.number}`}>
                      <History className="mr-2 h-4 w-4" /> Lanjut Bab {continueChapter.number}
                    </Link>
                  </Button>
                ) : firstChapter ? (
                  <Button asChild size="lg" className="h-12">
                    <Link to={`/novel/${novel.slug}/bab/${firstChapter.number}`}>
                      <Play className="mr-2 h-4 w-4" /> Mulai Membaca
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" className="h-12" disabled>
                    Belum ada bab
                  </Button>
                )}
                <Button
                  variant={novel.inLibrary ? "secondary" : "outline"}
                  size="lg"
                  className="h-12"
                  disabled={toggleLib.isPending}
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.location.href = LOGIN_PATH;
                      return;
                    }
                    toggleLib.mutate({ novelId: novel.id });
                  }}
                >
                  {novel.inLibrary ? (
                    <>
                      <BookmarkCheck className="mr-2 h-4 w-4" /> Di Pustaka
                    </>
                  ) : (
                    <>
                      <Bookmark className="mr-2 h-4 w-4" /> Simpan ke Pustaka
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Sinopsis */}
          <div className="mt-8">
            <h2 className="font-serif text-lg font-bold">Sinopsis</h2>
            <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
              {novel.synopsis?.split("\n").filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daftar bab + rating */}
      <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_340px]">
        <section aria-label="Daftar bab">
          <h2 className="flex items-center gap-2 font-serif text-xl font-bold">
            <ListOrdered className="h-5 w-5 text-primary" /> Daftar Bab
            <span className="text-sm font-normal text-muted-foreground">({novel.chapters.length})</span>
          </h2>
          {novel.chapters.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              Penulis belum menerbitkan bab apa pun.
            </p>
          ) : (
            <ol className="mt-4 divide-y rounded-lg border">
              {novel.chapters.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/novel/${novel.slug}/bab/${c.number}`}
                    className={cn(
                      "group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                      c.status === "draft" && "opacity-60"
                    )}
                  >
                    <span className="w-8 shrink-0 text-center font-serif text-lg font-semibold text-muted-foreground group-hover:text-primary">
                      {c.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium group-hover:text-primary transition-colors">
                        {c.title}
                        {c.status === "draft" && <span className="ml-2 text-xs text-muted-foreground">(draf)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {readingMinutes(c.wordCount)} mnt baca · {timeAgo(c.publishedAt)}
                      </p>
                    </div>
                    {novel.myProgress?.chapterNumber === c.number && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Terakhir dibaca
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          )}

          <CommentSection novelId={novel.id} />
        </section>

        {/* Rating & ulasan */}
        <aside className="space-y-8">
          <section className="rounded-lg border bg-card p-5" aria-label="Beri rating">
            <h3 className="font-serif text-lg font-bold">Nilai Novel Ini</h3>
            <div className="mt-3">
              <RatingInput novelId={novel.id} myRating={novel.myRating} />
            </div>
          </section>

          <section aria-label="Ulasan pembaca">
            <h3 className="font-serif text-lg font-bold">Ulasan Pembaca</h3>
            <div className="mt-4 space-y-4">
              {reviews && reviews.length > 0 ? (
                reviews.map((r) => (
                  <article key={r.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border">
                        <AvatarImage src={r.userAvatar ?? undefined} />
                        <AvatarFallback className="bg-accent text-[10px] font-semibold text-accent-foreground">
                          {(r.userPenName || r.userName || "?").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Link to={`/penulis/${r.userId}`} className="text-sm font-semibold hover:text-primary transition-colors">
                        {r.userPenName || r.userName}
                      </Link>
                      <span className="ml-auto inline-flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i <= r.score ? "fill-primary text-primary" : "text-muted-foreground/30"}
                          />
                        ))}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.review}</p>
                    <p className="mt-2 text-xs text-muted-foreground/70">{timeAgo(r.createdAt)}</p>
                  </article>
                ))
              ) : (
                <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  Belum ada ulasan tertulis.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
