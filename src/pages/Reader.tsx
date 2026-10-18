import { Link, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Settings2,
  Type,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { CommentSection } from "@/components/Comments";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { readingMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

const READER_THEMES = [
  { key: "paper", label: "Kertas", cls: "reader-paper" },
  { key: "sepia", label: "Sepia", cls: "reader-sepia" },
  { key: "night", label: "Malam", cls: "reader-night" },
] as const;

export default function Reader() {
  const { slug, number } = useParams<{ slug: string; number: string }>();
  const num = Number(number);
  const { data, isLoading, error } = trpc.chapter.read.useQuery(
    { slug: slug!, number: num },
    { retry: false }
  );

  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem("lentera-reader-size")) || 18);
  const [theme, setTheme] = useState<(typeof READER_THEMES)[number]["key"]>(
    () => (localStorage.getItem("lentera-reader-theme") as "paper" | "sepia" | "night") || "paper"
  );
  const [progress, setProgress] = useState(0);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("lentera-reader-size", String(fontSize));
  }, [fontSize]);
  useEffect(() => {
    localStorage.setItem("lentera-reader-theme", theme);
  }, [theme]);

  // progress baca dari posisi scroll
  useEffect(() => {
    function onScroll() {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight + 200;
      const read = Math.min(Math.max(-rect.top + 120, 0), total);
      setProgress(total > 0 ? Math.round((read / total) * 100) : 100);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [data]);

  // scroll ke atas saat ganti bab
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [slug, number]);

  if (isLoading)
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );

  if (error || !data)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="font-serif text-2xl font-bold">Bab tidak ditemukan</p>
        <p className="mt-2 text-sm text-muted-foreground">Mungkin bab ini masih berupa draf atau sudah dihapus.</p>
        <Button asChild className="mt-6">
          <Link to={slug ? `/novel/${slug}` : "/"}>Kembali ke Novel</Link>
        </Button>
      </div>
    );

  const themeCls = READER_THEMES.find((t) => t.key === theme)!.cls;
  const paragraphs = (data.chapter.content ?? "").split(/\n+/).filter(Boolean);

  return (
    <div
      className={cn(themeCls, "-mt-px")}
      style={{
        backgroundColor: "hsl(var(--reader-bg))",
        color: "hsl(var(--reader-fg))",
      }}
    >
      {/* Progress bar */}
      <div className="sticky top-16 z-30 h-0.5 w-full bg-transparent md:top-16">
        <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      <div ref={articleRef} className="mx-auto max-w-[42rem] px-5 pb-10 pt-8 sm:px-6">
        {/* Nav atas */}
        <div className="flex items-center justify-between gap-2" style={{ color: "hsl(var(--reader-muted))" }}>
          <Link
            to={`/novel/${data.novel.slug}`}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md text-sm transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="max-w-[10rem] truncate sm:max-w-xs">{data.novel.title}</span>
          </Link>
          <div className="flex items-center gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 text-inherit hover:bg-black/5 dark:hover:bg-white/5" aria-label="Daftar bab">
                  <ListOrdered className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetTitle className="font-serif">Daftar Bab</SheetTitle>
                <ChapterList slug={data.novel.slug} current={num} />
              </SheetContent>
            </Sheet>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 text-inherit hover:bg-black/5 dark:hover:bg-white/5" aria-label="Pengaturan baca">
                  <Settings2 className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Type className="h-4 w-4" /> Ukuran Huruf
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs">A</span>
                  <Slider
                    value={[fontSize]}
                    min={15}
                    max={24}
                    step={1}
                    onValueChange={([v]) => setFontSize(v)}
                    aria-label="Ukuran huruf"
                  />
                  <span className="text-lg">A</span>
                </div>
                <p className="mt-5 text-sm font-semibold">Tema Baca</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {READER_THEMES.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTheme(t.key)}
                      className={cn(
                        "h-11 rounded-md border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        t.cls,
                        theme === t.key && "ring-2 ring-primary"
                      )}
                      style={{ backgroundColor: "hsl(var(--reader-bg))", color: "hsl(var(--reader-fg))" }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Isi bab */}
        <header className="mt-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "hsl(var(--reader-muted))" }}>
            Bab {data.chapter.number} dari {data.totalChapters}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl">
            {data.chapter.title}
          </h1>
          <p className="mt-3 text-xs" style={{ color: "hsl(var(--reader-muted))" }}>
            {data.chapter.wordCount} kata · ±{readingMinutes(data.chapter.wordCount)} menit baca
          </p>
          <div className="mx-auto mt-6 h-px w-24" style={{ backgroundColor: "hsl(var(--reader-muted) / 0.4)" }} />
        </header>

        <article
          className="reader-dropcap mt-10 font-serif"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.85 }}
        >
          {paragraphs.map((p, i) => (
            <p key={i} className="mb-6">
              {p}
            </p>
          ))}
        </article>

        <div className="mt-4 text-center text-2xl tracking-[0.5em]" style={{ color: "hsl(var(--reader-muted) / 0.5)" }} aria-hidden>
          ❦
        </div>

        {/* Nav bawah */}
        <nav className="mt-10 grid grid-cols-2 gap-3">
          {data.prev ? (
            <Button asChild variant="outline" className="h-12 bg-transparent">
              <Link to={`/novel/${data.novel.slug}/bab/${data.prev.number}`}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                <span className="truncate">Bab {data.prev.number}</span>
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {data.next ? (
            <Button asChild className="h-12">
              <Link to={`/novel/${data.novel.slug}/bab/${data.next.number}`}>
                <span className="truncate">Bab {data.next.number}</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="h-12 bg-transparent">
              <Link to={`/novel/${data.novel.slug}`}>Selesai · Kembali</Link>
            </Button>
          )}
        </nav>

        {/* Komentar bab */}
        <div className="mt-8 border-t pt-2" style={{ borderColor: "hsl(var(--reader-muted) / 0.25)" }}>
          <CommentSection novelId={data.novel.id} chapterId={data.chapter.id} />
        </div>
      </div>
    </div>
  );
}

function ChapterList({ slug, current }: { slug: string; current: number }) {
  const { data } = trpc.novel.bySlug.useQuery({ slug });
  if (!data) return <div className="mt-6 h-40 animate-pulse rounded bg-muted" />;
  return (
    <ol className="mt-4 max-h-[70vh] space-y-1 overflow-y-auto">
      {data.chapters.map((c) => (
        <li key={c.id}>
          <Link
            to={`/novel/${slug}/bab/${c.number}`}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
              c.number === current && "bg-accent font-semibold text-accent-foreground"
            )}
          >
            <span className="w-7 text-center font-serif text-muted-foreground">{c.number}</span>
            <span className="truncate">{c.title}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
