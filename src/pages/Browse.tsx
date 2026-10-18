import { useSearchParams } from "react-router";
import { useState } from "react";
import { SearchX, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { NovelCard, NovelCardSkeleton } from "@/components/NovelCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "latest", label: "Terbaru" },
  { value: "popular", label: "Terpopuler" },
  { value: "topRated", label: "Rating Tertinggi" },
  { value: "bookmarked", label: "Paling Dikoleksi" },
] as const;

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const genre = params.get("genre") ?? "";
  const status = params.get("status") ?? "";
  const sort = (params.get("sort") ?? "latest") as (typeof SORTS)[number]["value"];
  const page = Number(params.get("page") ?? "1");
  const [input, setInput] = useState(q);

  const { data: genres } = trpc.novel.genres.useQuery();
  const { data, isLoading, isFetching } = trpc.novel.browse.useQuery({
    q: q || undefined,
    genre: genre || undefined,
    status: (status as "ongoing" | "completed" | "hiatus") || undefined,
    sort,
    page,
    pageSize: 12,
  });

  function update(next: Record<string, string>) {
    const merged = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) merged.set(k, v);
      else merged.delete(k);
    }
    if (!("page" in next)) merged.delete("page");
    setParams(merged);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-bold sm:text-4xl">Jelajahi Cerita</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {data ? `${data.total} novel ditemukan` : "Memuat…"}
        {q && (
          <>
            {" "}untuk kata kunci <span className="font-medium text-foreground">“{q}”</span>
          </>
        )}
      </p>

      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: input.trim() });
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Cari judul atau sinopsis…"
            className="h-11 pl-9"
          />
        </form>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex">
          <Select value={genre || "all"} onValueChange={(v) => update({ genre: v === "all" ? "" : v })}>
            <SelectTrigger className="h-11 lg:w-40" aria-label="Filter genre">
              <SelectValue placeholder="Semua Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Genre</SelectItem>
              {genres?.map((g) => (
                <SelectItem key={g.id} value={g.slug}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status || "all"} onValueChange={(v) => update({ status: v === "all" ? "" : v })}>
            <SelectTrigger className="h-11 lg:w-40" aria-label="Filter status">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="ongoing">Berlangsung</SelectItem>
              <SelectItem value="completed">Tamat</SelectItem>
              <SelectItem value="hiatus">Hiatus</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => update({ sort: v })}>
            <SelectTrigger className="h-11 lg:w-44" aria-label="Urutkan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hasil */}
      <div className={cn("mt-8 transition-opacity", isFetching && "opacity-60")}>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-x-5 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <NovelCardSkeleton key={i} />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <div className="grid grid-cols-3 gap-x-5 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
            {data.items.map((n) => (
              <NovelCard key={n.id} novel={n} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-20 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground/50" />
            <p className="font-serif text-xl font-semibold">Tidak ada cerita yang cocok</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Coba kata kunci lain, atau longgarkan filter genre dan statusnya.
            </p>
            <Button variant="outline" className="mt-2" onClick={() => { setInput(""); setParams({}); }}>
              Hapus Semua Filter
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            disabled={page <= 1}
            onClick={() => update({ page: String(page - 1) })}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            disabled={page >= totalPages}
            onClick={() => update({ page: String(page + 1) })}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
