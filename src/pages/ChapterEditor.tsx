import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Send } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOGIN_PATH } from "@/const";
import { toast } from "sonner";

export default function ChapterEditor() {
  const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
  const novelId = Number(id);
  const isNew = chapterId === "baru";
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: LOGIN_PATH });

  const { data: editData, isLoading: loadingEdit } = trpc.chapter.forEdit.useQuery(
    { id: Number(chapterId) },
    { enabled: !!user && !isNew }
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (editData && !loaded) {
      setTitle(editData.chapter.title);
      setContent(editData.chapter.content ?? "");
      setLoaded(true);
    }
  }, [editData, loaded]);

  const create = trpc.chapter.create.useMutation({
    onSuccess: () => {
      toast.success("Bab tersimpan");
      navigate(`/studio/${novelId}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.chapter.update.useMutation({
    onSuccess: () => {
      toast.success("Perubahan tersimpan");
      navigate(`/studio/${novelId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading || !user || (!isNew && loadingEdit))
    return <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6"><div className="h-96 animate-pulse rounded-lg bg-muted" /></div>;

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const valid = title.trim().length >= 1 && content.trim().length >= 10;
  const pending = create.isPending || update.isPending;

  function save(status: "draft" | "published") {
    if (!valid) return;
    if (isNew) create.mutate({ novelId, title: title.trim(), content: content.trim(), status });
    else update.mutate({ id: Number(chapterId), title: title.trim(), content: content.trim(), status });
  }

  const backTo = `/studio/${novelId}`;
  const novelTitle = editData?.novel.title;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {novelTitle ? <span className="max-w-[16rem] truncate">{novelTitle}</span> : "Kembali"}
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-11" disabled={!valid || pending} onClick={() => save("draft")}>
            <Save className="mr-2 h-4 w-4" /> Simpan Draf
          </Button>
          <Button className="h-11" disabled={!valid || pending} onClick={() => save("published")}>
            <Send className="mr-2 h-4 w-4" /> {pending ? "Menyimpan…" : "Terbitkan"}
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <Label htmlFor="ch-title" className="sr-only">Judul bab</Label>
        <Input
          id="ch-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul bab…"
          className="h-14 border-none bg-transparent px-0 font-serif text-2xl font-bold shadow-none focus-visible:ring-0 sm:text-3xl"
          maxLength={200}
        />
        <div className="mt-1 h-px bg-border" />
      </div>

      <div className="mt-6">
        <Label htmlFor="ch-content" className="sr-only">Isi bab</Label>
        <textarea
          id="ch-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"Mulailah menulis…\n\nPisahkan paragraf dengan baris kosong. Paragraf pertama akan otomatis mendapat huruf pembuka besar (drop cap) di halaman baca."}
          className="min-h-[55vh] w-full resize-y rounded-md bg-transparent font-serif text-lg leading-[1.85] outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
        />
      </div>

      <div className="sticky bottom-0 mt-4 flex items-center justify-between border-t bg-background/95 py-3 backdrop-blur">
        <p className="text-sm text-muted-foreground">
          {words.toLocaleString("id-ID")} kata · ±{Math.max(1, Math.round(words / 220))} menit baca
        </p>
        <p className="text-xs text-muted-foreground">
          {content.trim().length >= 10 ? "Siap diterbitkan" : "Minimal 10 karakter untuk menyimpan"}
        </p>
      </div>
    </div>
  );
}
