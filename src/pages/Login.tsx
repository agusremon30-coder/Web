import { Button } from "@/components/ui/button";
import { Logo } from "@/components/SiteChrome";
import { BookOpen, PenLine, Users } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-card p-8 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="mt-6 font-serif text-2xl font-bold">Selamat datang di Lentera</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Masuk untuk membaca tanpa batas, menyimpan koleksi, memberi rating, dan menerbitkan novelmu sendiri.
          </p>
          <Button
            className="mt-7 h-12 w-full text-base"
            onClick={() => {
              window.location.href = getOAuthUrl();
            }}
          >
            Masuk dengan Kimi
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Satu akun untuk membaca dan menulis. Pendaftaran otomatis saat pertama masuk.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: BookOpen, label: "Ribuan bab gratis dibaca" },
            { icon: PenLine, label: "Terbitkan karyamu sendiri" },
            { icon: Users, label: "Komunitas pembaca aktif" },
          ].map((f) => (
            <div key={f.label} className="rounded-lg border bg-card/60 p-3">
              <f.icon className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
