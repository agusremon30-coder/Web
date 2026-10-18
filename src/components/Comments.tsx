import { useState } from "react";
import { Link } from "react-router";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";
import { LOGIN_PATH } from "@/const";
import { toast } from "sonner";

export function CommentSection({ novelId, chapterId }: { novelId: number; chapterId?: number }) {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.social.comments.useQuery({ novelId, chapterId, page: 1, pageSize: 50 });
  const [text, setText] = useState("");

  const add = trpc.social.addComment.useMutation({
    onSuccess: () => {
      setText("");
      utils.social.comments.invalidate({ novelId, chapterId });
    },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.social.deleteComment.useMutation({
    onSuccess: () => utils.social.comments.invalidate({ novelId, chapterId }),
    onError: (e) => toast.error(e.message),
  });

  return (
    <section aria-label="Komentar" className="mt-10">
      <h3 className="flex items-center gap-2 font-serif text-xl font-bold">
        <MessageSquare className="h-5 w-5 text-primary" />
        Komentar {data ? <span className="text-sm font-normal text-muted-foreground">({data.total})</span> : null}
      </h3>

      {isAuthenticated ? (
        <form
          className="mt-4 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) add.mutate({ novelId, chapterId, content: text.trim() });
          }}
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={chapterId ? "Bagaimana pendapatmu tentang bab ini?" : "Bagaimana pendapatmu tentang novel ini?"}
            rows={3}
            maxLength={2000}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!text.trim() || add.isPending} className="h-10">
              <Send className="mr-2 h-4 w-4" /> Kirim
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <Link to={LOGIN_PATH} className="font-medium text-primary hover:underline">
            Masuk
          </Link>{" "}
          untuk ikut berdiskusi.
        </p>
      )}

      <ul className="mt-6 space-y-5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <li key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)
        ) : data && data.items.length > 0 ? (
          data.items.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className="h-9 w-9 shrink-0 border">
                <AvatarImage src={c.userAvatar ?? undefined} />
                <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                  {(c.userPenName || c.userName || "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link to={`/penulis/${c.userId}`} className="text-sm font-semibold hover:text-primary transition-colors">
                    {c.userPenName || c.userName}
                  </Link>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                  {(user?.id === c.userId || user?.role === "admin") && (
                    <button
                      onClick={() => del.mutate({ id: c.id })}
                      className="ml-auto rounded p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Hapus komentar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{c.content}</p>
              </div>
            </li>
          ))
        ) : (
          <li className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            Belum ada komentar. Jadilah yang pertama bersuara.
          </li>
        )}
      </ul>
    </section>
  );
}
