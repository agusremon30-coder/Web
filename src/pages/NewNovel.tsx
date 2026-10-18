import { useNavigate, Link } from "react-router";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NovelCover } from "@/components/NovelCover";
import { LOGIN_PATH } from "@/const";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const COVER_STYLES = [
  { key: "ember", label: "Bara" },
  { key: "goldleaf", label: "Daun Emas" },
  { key: "noir", label: "Noir" },
  { key: "cream", label: "Krem" },
  { key: "abyss", label: "Samudra" },
  { key: "verdant", label: "Rimbun" },
  { key: "sepia", label: "Sepia" },
];

export default function NewNovel() {
  const { user, isLoading: authLoading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: LOGIN_PATH });
  const { data: genres } = trpc.novel.genres.useQuery();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [status, setStatus] = useState<"ongoing" | "completed" | "hiatus">("ongoing");
  const [coverStyle, setCoverStyle] = useState("ember");

  const create = trpc.novel.create.useMutation({
    onSuccess: (r) => {
      toast.success("Novel berhasil dibuat! Sekarang tulis bab pertamamu.");
      navigate(`/studio/${r.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading || !user)
    return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6"><div className="h-60 animate-pulse rounded-lg bg-muted" /></div>;

  const valid = title.trim().length >= 3 && synopsis.trim().length >= 20 && genreIds.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/studio" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Studio
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">Novel Baru</h1>
      <p className="mt-1 text-sm text-muted-foreground">Isi identitas karyamu. Sampul bisa diganti kapan saja.</p>

      <form
        className="mt-8 grid gap-8 md:grid-cols-[1fr_220px]"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) create.mutate({ title: title.trim(), synopsis: synopsis.trim(), genreIds, status, coverStyle });
        }}
      >
        <div className="space-y-6">
          <div>
            <Label htmlFor="title">Judul Novel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul yang membuat orang penasaran…"
              className="mt-2 h-12 text-base"
              maxLength={200}
              required
            />
          </div>
          <div>
            <Label htmlFor="synopsis">
              Sinopsis <span className="text-xs font-normal text-muted-foreground">(minimal 20 karakter)</span>
            </Label>
            <Textarea
              id="synopsis"
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Ceritakan gambaran besar novelmu. Pisahkan paragraf dengan baris kosong…"
              className="mt-2 min-h-[160px]"
              maxLength={5000}
              required
            />
          </div>
          <div>
            <Label>Genre <span className="text-xs font-normal text-muted-foreground">(pilih 1–3)</span></Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {genres?.map((g) => {
                const active = genreIds.includes(g.id);
                return (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() =>
                      setGenreIds((ids) =>
                        active ? ids.filter((x) => x !== g.id) : ids.length < 3 ? [...ids, g.id] : ids
                      )
                    }
                    className={cn(
                      "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label htmlFor="status">Status Penerbitan</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger id="status" className="mt-2 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ongoing">Berlangsung — bab baru akan menyusul</SelectItem>
                <SelectItem value="completed">Tamat — cerita sudah selesai</SelectItem>
                <SelectItem value="hiatus">Hiatus — berhenti sementara</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pratinjau sampul */}
        <div>
          <Label>Sampul</Label>
          <div className="mt-2">
            <NovelCover title={title || "Judul Novelmu"} author={user.penName || user.name} style={coverStyle} />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {COVER_STYLES.map((s) => (
              <button
                type="button"
                key={s.key}
                onClick={() => setCoverStyle(s.key)}
                aria-label={`Gaya sampul ${s.label}`}
                className={cn(
                  "rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  coverStyle === s.key && "ring-2 ring-primary"
                )}
              >
                <NovelCover compact title="Aa" author={s.label} style={s.key} />
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Setelah novel dibuat, kamu juga bisa mengunggah gambar sampul sendiri.
          </p>
        </div>

        <div className="md:col-span-2">
          <Button type="submit" size="lg" className="h-12 w-full sm:w-auto" disabled={!valid || create.isPending}>
            {create.isPending ? "Membuat…" : "Buat Novel"}
          </Button>
        </div>
      </form>
    </div>
  );
}
