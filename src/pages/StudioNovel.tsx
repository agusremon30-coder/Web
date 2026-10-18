import { Link, useParams } from "react-router";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  ImagePlus,
  ListOrdered,
  Pencil,
  Plus,
  Settings,
  Trash2,
  EyeOff,
  Eye,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { NovelCover } from "@/components/NovelCover";
import { COVER_STYLES } from "./NewNovel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { readingMinutes, timeAgo } from "@/lib/format";
import { LOGIN_PATH } from "@/const";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StudioNovel() {
  const { id } = useParams<{ id: string }>();
  const novelId = Number(id);
  const { user, isLoading: authLoading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: LOGIN_PATH });
  const utils = trpc.useUtils();
  const { data: novels, isLoading } = trpc.novel.mine.useQuery(undefined, { enabled: !!user });
  const novel = novels?.find((n) => n.id === novelId);
  const { data: detail } = trpc.novel.bySlug.useQuery(
    { slug: novel?.slug ?? "" },
    { enabled: !!novel }
  );
  const { data: genres } = trpc.novel.genres.useQuery();

  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [status, setStatus] = useState<"ongoing" | "completed" | "hiatus">("ongoing");
  const [coverStyle, setCoverStyle] = useState("ember");
  const fileRef = useRef<HTMLInputElement>(null);

  const update = trpc.novel.update.useMutation({
    onSuccess: () => {
      toast.success("Perubahan tersimpan");
      setEditOpen(false);
      utils.novel.mine.invalidate();
      utils.novel.bySlug.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.novel.remove.useMutation({
    onSuccess: () => {
      toast.success("Novel dihapus");
      window.location.href = "/studio";
    },
    onError: (e) => toast.error(e.message),
  });
  const uploadCover = trpc.storage.uploadCover.useMutation({
    onSuccess: () => {
      toast.success("Sampul berhasil diunggah");
      utils.novel.mine.invalidate();
      utils.novel.bySlug.invalidate();
    },
    onError: (e) => toast.error(`Gagal mengunggah: ${e.message}`),
  });
  const delChapter = trpc.chapter.remove.useMutation({
    onSuccess: () => {
      toast.success("Bab dihapus");
      utils.novel.bySlug.invalidate();
      utils.novel.mine.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading || isLoading)
    return <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6"><div className="h-60 animate-pulse rounded-lg bg-muted" /></div>;

  if (!novel)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="font-serif text-2xl font-bold">Novel tidak ditemukan</p>
        <p className="mt-2 text-sm text-muted-foreground">Ini bukan novel milikmu, atau sudah dihapus.</p>
        <Button asChild className="mt-6"><Link to="/studio">Kembali ke Studio</Link></Button>
      </div>
    );

  function openEdit() {
    if (!novel || !detail) return;
    setTitle(novel.title);
    setSynopsis(novel.synopsis ?? "");
    setGenreIds(detail.genres.map((g) => g.id));
    setStatus(novel.status as typeof status);
    setCoverStyle(novel.coverStyle);
    setEditOpen(true);
  }

  async function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 8 MB");
      return;
    }
    const b64 = await toBase64(file);
    uploadCover.mutate({ novelId, name: file.name, contentBase64: b64, contentType: file.type });
    e.target.value = "";
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/studio" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Studio
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[200px_1fr]">
        {/* Sampul + aksi sampul */}
        <div className="mx-auto w-40 md:w-full">
          <NovelCover title={novel.title} author={user?.penName || user?.name} style={novel.coverStyle} coverUrl={novel.coverUrl} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickCover} />
          <Button
            variant="outline"
            className="mt-3 h-11 w-full"
            disabled={uploadCover.isPending}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            {uploadCover.isPending ? "Mengunggah…" : "Unggah Sampul"}
          </Button>
          {novel.coverUrl && (
            <Button
              variant="ghost"
              className="mt-1 h-11 w-full text-muted-foreground"
              onClick={() => toast.info("Hapus sampul kustom dengan memilih gaya tipografi di pengaturan.")}
            >
              Sampul kustom aktif
            </Button>
          )}
        </div>

        {/* Info + aksi */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-3xl font-bold leading-tight">{novel.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {novel.chapterCount} bab · {novel.wordCount.toLocaleString("id-ID")} kata ·{" "}
                {novel.viewCount.toLocaleString("id-ID")} pembaca
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="h-11">
                <Link to={`/novel/${novel.slug}`}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Lihat Halaman
                </Link>
              </Button>
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-11" onClick={openEdit}>
                    <Settings className="mr-2 h-4 w-4" /> Pengaturan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle className="font-serif">Pengaturan Novel</DialogTitle>
                  </DialogHeader>
                  <form
                    className="space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      update.mutate({ id: novelId, title: title.trim(), synopsis: synopsis.trim(), genreIds, status, coverStyle });
                    }}
                  >
                    <div>
                      <Label htmlFor="e-title">Judul</Label>
                      <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 h-11" maxLength={200} required />
                    </div>
                    <div>
                      <Label htmlFor="e-syn">Sinopsis</Label>
                      <Textarea id="e-syn" value={synopsis} onChange={(e) => setSynopsis(e.target.value)} className="mt-2 min-h-[140px]" maxLength={5000} required />
                    </div>
                    <div>
                      <Label>Genre (1–3)</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {genres?.map((g) => {
                          const active = genreIds.includes(g.id);
                          return (
                            <button
                              type="button"
                              key={g.id}
                              onClick={() =>
                                setGenreIds((ids) => (active ? ids.filter((x) => x !== g.id) : ids.length < 3 ? [...ids, g.id] : ids))
                              }
                              className={cn(
                                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
                                active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                              )}
                            >
                              {active && <Check className="h-3 w-3" />}
                              {g.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                        <SelectTrigger className="mt-2 h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ongoing">Berlangsung</SelectItem>
                          <SelectItem value="completed">Tamat</SelectItem>
                          <SelectItem value="hiatus">Hiatus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Gaya Sampul Tipografi</Label>
                      <div className="mt-2 grid grid-cols-7 gap-1.5">
                        {COVER_STYLES.map((s) => (
                          <button
                            type="button"
                            key={s.key}
                            onClick={() => setCoverStyle(s.key)}
                            aria-label={s.label}
                            className={cn("rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", coverStyle === s.key && "ring-2 ring-primary")}
                          >
                            <NovelCover compact title="Aa" author={s.label} style={s.key} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button type="submit" className="h-11 w-full" disabled={update.isPending}>
                      {update.isPending ? "Menyimpan…" : "Simpan Perubahan"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="h-10"
              onClick={() => update.mutate({ id: novelId, isPublished: !novel.isPublished })}
            >
              {novel.isPublished ? (
                <><EyeOff className="mr-2 h-4 w-4" /> Sembunyikan dari Publik</>
              ) : (
                <><Eye className="mr-2 h-4 w-4" /> Terbitkan ke Publik</>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="h-10 text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Hapus Novel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus “{novel.title}”?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Seluruh bab, komentar, dan rating novel ini akan ikut terhapus permanen. Tindakan ini tidak bisa dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => remove.mutate({ id: novelId })}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Ya, Hapus Permanen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Daftar bab */}
      <div className="mt-12 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-serif text-xl font-bold">
          <ListOrdered className="h-5 w-5 text-primary" /> Bab
        </h2>
        <Button asChild className="h-11">
          <Link to={`/studio/${novelId}/bab/baru`}>
            <Plus className="mr-2 h-4 w-4" /> Bab Baru
          </Link>
        </Button>
      </div>
      {detail && detail.chapters.length > 0 ? (
        <ol className="mt-4 divide-y rounded-lg border">
          {detail.chapters.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="w-8 shrink-0 text-center font-serif text-lg font-semibold text-muted-foreground">{c.number}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {c.title}
                  {c.status === "draft" && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">draf</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.wordCount} kata · ±{readingMinutes(c.wordCount)} mnt · {timeAgo(c.publishedAt)}
                </p>
              </div>
              <Button asChild variant="ghost" size="icon" className="h-10 w-10" aria-label={`Sunting bab ${c.number}`}>
                <Link to={`/studio/${novelId}/bab/${c.id}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive" aria-label={`Hapus bab ${c.number}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Bab {c.number} — {c.title}?</AlertDialogTitle>
                    <AlertDialogDescription>Komentar pembaca di bab ini ikut terhapus. Tidak bisa dibatalkan.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => delChapter.mutate({ id: c.id })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed py-14 text-center">
          <p className="font-serif text-lg font-semibold">Belum ada bab</p>
          <p className="mt-1 text-sm text-muted-foreground">Tulis bab pertamamu dan terbitkan ke dunia.</p>
        </div>
      )}
    </div>
  );
}
