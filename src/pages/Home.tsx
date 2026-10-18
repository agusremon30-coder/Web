import { Link } from "react-router";
import { ArrowRight, BookOpen, Eye, Flame, PenLine, Star, TrendingUp, Clock, Sparkles } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { NovelCard, NovelCardSkeleton, Stars } from "@/components/NovelCard";
import { NovelCover } from "@/components/NovelCover";
import { Button } from "@/components/ui/button";
import { formatCompact, STATUS_LABEL } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import type { NovelCardData } from "@/types/novel";

function SectionHeader({ icon: Icon, title, subtitle, to }: { icon: React.ElementType; title: string; subtitle?: string; to?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 font-serif text-2xl font-bold sm:text-3xl">
          <Icon className="h-6 w-6 text-primary" aria-hidden />
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
          Lihat semua
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function Hero({ novel }: { novel: NovelCardData }) {
  return (
    <section className="relative overflow-hidden border-b">
      {/* latar samar dari warna sampul */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_70%_30%,hsl(var(--accent)/0.55),transparent)]" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-center md:gap-14 md:py-20">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            <Flame className="h-3.5 w-3.5" /> Sorotan Pekan Ini
          </p>
          <h1 className="font-serif text-4xl font-bold leading-[1.05] text-balance sm:text-5xl md:text-6xl">
            {novel.title}
          </h1>
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            oleh{" "}
            <Link to={`/penulis/${novel.authorId}`} className="text-foreground underline-offset-4 hover:underline">
              {novel.authorPenName || novel.authorName}
            </Link>{" "}
            · {novel.genres?.map((g) => g.name).join(" · ")} · {STATUS_LABEL[novel.status]}
          </p>
          <p className="mt-5 line-clamp-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {novel.synopsis?.split("\n")[0]}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Stars value={novel.ratingAvg} /> {novel.ratingAvg > 0 ? novel.ratingAvg.toFixed(1) : "Belum ada rating"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4" /> {formatCompact(novel.viewCount)} pembaca
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> {novel.chapterCount} bab
            </span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 px-6">
              <Link to={`/novel/${novel.slug}`}>
                <BookOpen className="mr-2 h-4 w-4" /> Mulai Membaca
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6">
              <Link to="/jelajah">Jelajahi Semua Cerita</Link>
            </Button>
          </div>
        </div>
        <Link
          to={`/novel/${novel.slug}`}
          className="mx-auto block w-44 outline-none transition-transform duration-300 hover:-translate-y-2 focus-visible:ring-2 focus-visible:ring-ring rounded-md sm:w-56 md:w-64"
        >
          <NovelCover title={novel.title} author={novel.authorPenName || novel.authorName} style={novel.coverStyle} coverUrl={novel.coverUrl} />
        </Link>
      </div>
    </section>
  );
}

function Rail({ novels }: { novels: NovelCardData[] }) {
  return (
    <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      {novels.map((n) => (
        <div key={n.id} className="w-36 shrink-0 snap-start sm:w-44">
          <NovelCard novel={n} />
        </div>
      ))}
    </div>
  );
}

function RankedList({ novels }: { novels: NovelCardData[] }) {
  return (
    <ol className="divide-y">
      {novels.slice(0, 8).map((n, i) => (
        <li key={n.id}>
          <Link
            to={`/novel/${n.slug}`}
            className="group flex items-center gap-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <span
              className={
                "w-8 shrink-0 text-center font-serif text-2xl font-bold " +
                (i < 3 ? "text-primary" : "text-muted-foreground/50")
              }
            >
              {i + 1}
            </span>
            <div className="w-12 shrink-0">
              <NovelCover compact title={n.title} style={n.coverStyle} coverUrl={n.coverUrl} author={n.authorPenName || n.authorName} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif font-semibold leading-snug group-hover:text-primary transition-colors">{n.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {n.authorPenName || n.authorName} · {formatCompact(n.viewCount)} pembaca
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              {n.ratingAvg > 0 ? n.ratingAvg.toFixed(1) : "—"}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default function Home() {
  const { data, isLoading } = trpc.novel.home.useQuery();
  const { data: genres } = trpc.novel.genres.useQuery();
  const { isAuthenticated } = useAuth();

  const featured = data?.featured?.[0] ?? data?.trending?.[0];

  return (
    <div>
      {isLoading ? (
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-14 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-8 grid grid-cols-3 gap-5 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <NovelCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {featured && <Hero novel={featured} />}

          <div className="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:px-6">
            {/* Trending */}
            <section aria-labelledby="trending">
              <SectionHeader
                icon={TrendingUp}
                title="Sedang Dibaca"
                subtitle="Paling banyak dilirik pembaca"
                to="/jelajah?sort=popular"
              />
              <Rail novels={data?.trending ?? []} />
            </section>

            {/* Terbaru + Peringkat */}
            <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
              <section aria-labelledby="latest">
                <SectionHeader icon={Clock} title="Rilisan Terbaru" to="/jelajah?sort=latest" />
                <div className="grid grid-cols-3 gap-x-5 gap-y-8 sm:grid-cols-4">
                  {(data?.latest ?? []).slice(0, 8).map((n) => (
                    <NovelCard key={n.id} novel={n} />
                  ))}
                </div>
              </section>
              <section aria-labelledby="toprated" className="rounded-lg border bg-card p-5">
                <SectionHeader icon={Sparkles} title="Rating Tertinggi" to="/peringkat" />
                <RankedList novels={data?.topRated ?? []} />
              </section>
            </div>

            {/* Genre */}
            {genres && genres.length > 0 && (
              <section aria-labelledby="genres">
                <SectionHeader icon={BookOpen} title="Telusuri Genre" subtitle="Dari hujan romantis sampai misteri yang bikin merinding" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {genres.map((g) => (
                    <Link
                      key={g.id}
                      to={`/jelajah?genre=${g.slug}`}
                      className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <p className="font-serif font-semibold group-hover:text-primary transition-colors">{g.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{g.count} novel</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* CTA menulis */}
            <section className="relative overflow-hidden rounded-xl border bg-[linear-gradient(150deg,hsl(30_7%_10%),hsl(28_18%_15%))] px-6 py-12 text-center sm:px-12 md:py-16">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              <Flame className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-4 font-serif text-3xl font-bold text-[hsl(44_30%_92%)] sm:text-4xl text-balance">
                Ceritamu layak dibaca dunia.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[hsl(40_10%_65%)]">
                Terbitkan novelmu bab demi bab, kumpulkan pembaca setia, dan pantau perkembangannya
                dari Studio Menulis — semuanya gratis untuk dimulai.
              </p>
              <Button asChild size="lg" className="mt-7 h-12 px-8">
                <Link to={isAuthenticated ? "/studio/baru" : "/login"}>
                  <PenLine className="mr-2 h-4 w-4" /> Mulai Menulis Sekarang
                </Link>
              </Button>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
