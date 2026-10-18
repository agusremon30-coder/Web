import { Link, useParams } from "react-router";
import { useState } from "react";
import { CalendarDays, UserCheck, UserPlus, BookOpen, Eye, Pencil } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { NovelCard } from "@/components/NovelCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { formatCompact } from "@/lib/format";
import { LOGIN_PATH } from "@/const";
import { toast } from "sonner";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const { isAuthenticated, refresh } = useAuth();
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.profile.byId.useQuery({ id: userId });
  const [open, setOpen] = useState(false);
  const [penName, setPenName] = useState("");
  const [bio, setBio] = useState("");

  const follow = trpc.social.toggleFollow.useMutation({
    onSuccess: (r) => {
      toast.success(r.following ? "Mengikuti penulis ini" : "Berhenti mengikuti");
      utils.profile.byId.invalidate({ id: userId });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMe = trpc.profile.updateMe.useMutation({
    onSuccess: async () => {
      toast.success("Profil diperbarui");
      setOpen(false);
      await refresh();
      utils.profile.byId.invalidate({ id: userId });
      utils.novel.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading)
    return <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6"><div className="h-60 animate-pulse rounded-lg bg-muted" /></div>;

  if (error || !data)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="font-serif text-2xl font-bold">Pengguna tidak ditemukan</p>
        <Button asChild className="mt-6"><Link to="/">Kembali ke Beranda</Link></Button>
      </div>
    );

  const { user: u, works, followerCount, isFollowing, isMe } = data;
  const totalViews = works.reduce((s, w) => s + w.viewCount, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Kepala profil */}
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:p-8">
        <Avatar className="h-24 w-24 border-2 border-primary/30">
          <AvatarImage src={u.avatar ?? undefined} />
          <AvatarFallback className="bg-accent font-serif text-3xl font-bold text-accent-foreground">
            {(u.penName || u.name || "?").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-3xl font-bold">{u.penName || u.name}</h1>
          {u.penName && u.name && u.penName !== u.name && (
            <p className="text-sm text-muted-foreground">{u.name}</p>
          )}
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            Bergabung {new Date(u.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </p>
          {u.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{u.bio}</p>}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" /> {works.length} karya
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-primary" /> {formatCompact(totalViews)} total pembaca
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-primary" /> {formatCompact(followerCount)} pengikut
            </span>
          </div>
        </div>
        <div className="shrink-0">
          {isMe ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={() => {
                    setPenName(u.penName ?? "");
                    setBio(u.bio ?? "");
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Sunting Profil
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif">Sunting Profil</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateMe.mutate({ penName: penName.trim() || undefined, bio: bio.trim() || undefined });
                  }}
                >
                  <div>
                    <Label htmlFor="pen">Nama Pena</Label>
                    <Input
                      id="pen"
                      value={penName}
                      onChange={(e) => setPenName(e.target.value)}
                      placeholder="Nama yang tampil di sampul novelmu"
                      className="mt-2 h-11"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Ceritakan sedikit tentang dirimu sebagai penulis…"
                      className="mt-2"
                      rows={4}
                      maxLength={1000}
                    />
                  </div>
                  <Button type="submit" className="h-11 w-full" disabled={updateMe.isPending}>
                    {updateMe.isPending ? "Menyimpan…" : "Simpan"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              variant={isFollowing ? "secondary" : "default"}
              className="h-11"
              disabled={follow.isPending}
              onClick={() => {
                if (!isAuthenticated) {
                  window.location.href = LOGIN_PATH;
                  return;
                }
                follow.mutate({ authorId: userId });
              }}
            >
              {isFollowing ? (
                <><UserCheck className="mr-2 h-4 w-4" /> Mengikuti</>
              ) : (
                <><UserPlus className="mr-2 h-4 w-4" /> Ikuti</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Karya */}
      <section className="mt-12" aria-label="Karya penulis">
        <h2 className="font-serif text-xl font-bold">Karya {isMe ? "Saya" : u.penName || u.name}</h2>
        {works.length > 0 ? (
          <div className="mt-5 grid grid-cols-3 gap-x-5 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
            {works.map((w) => (
              <NovelCard
                key={w.id}
                novel={{
                  ...w,
                  authorName: u.name,
                  authorPenName: u.penName,
                  authorId: u.id,
                }}
              />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-lg border border-dashed py-14 text-center text-sm text-muted-foreground">
            {isMe ? (
              <>Kamu belum menerbitkan novel. <Link to="/studio/baru" className="font-medium text-primary hover:underline">Mulai menulis</Link>.</>
            ) : (
              "Penulis ini belum menerbitkan karya."
            )}
          </p>
        )}
      </section>
    </div>
  );
}
