import { Link, NavLink, useNavigate } from "react-router";
import { useState } from "react";
import { Search, PenLine, Library, User as UserIcon, LogOut, Menu, Home, Compass, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded", className)}>
      <svg viewBox="0 0 24 24" className="h-7 w-7 text-primary" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2c1.2 3.4-3.5 5.6-3.5 10a3.5 3.5 0 0 0 7 0c0-2.2-1.2-3.4-1.2-3.4s3.5 1.7 3.5 5.7a5.5 5.5 0 0 1-11 0C6.8 8.6 12 7.4 12 2z" />
        <path d="M8.5 21h7" />
      </svg>
      <span className="font-serif text-xl font-bold tracking-tight">
        Lentera<span className="text-primary">.</span>
      </span>
    </Link>
  );
}

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/jelajah", label: "Jelajah" },
  { to: "/peringkat", label: "Peringkat" },
];

export function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    navigate(query ? `/jelajah?q=${encodeURIComponent(query)}` : "/jelajah");
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-11 w-11 md:hidden" aria-label="Buka menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
            <div className="mt-2 mb-6">
              <Logo />
            </div>
            <form onSubmit={submitSearch} className="mb-6">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari judul atau penulis…"
                className="h-11"
              />
            </form>
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-3 text-sm font-medium transition-colors",
                      isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    )
                  }
                >
                  {n.label}
                </NavLink>
              ))}
              <NavLink
                to="/pustaka"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn("rounded-md px-3 py-3 text-sm font-medium transition-colors", isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted")
                }
              >
                Pustakaku
              </NavLink>
              <NavLink
                to="/studio"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn("rounded-md px-3 py-3 text-sm font-medium transition-colors", isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted")
                }
              >
                Studio Menulis
              </NavLink>
            </nav>
          </SheetContent>
        </Sheet>

        <Logo />

        {/* Desktop nav */}
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                  isActive && "text-primary"
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Desktop search */}
          <form onSubmit={submitSearch} className="relative hidden lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari novel…"
              className="h-10 w-56 pl-9 transition-all focus:w-72"
            />
          </form>
          <ThemeToggle />
          {isAuthenticated && user ? (
            <>
              <Button asChild className="hidden sm:inline-flex h-10">
                <Link to="/studio">
                  <PenLine className="mr-2 h-4 w-4" /> Menulis
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Menu akun">
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage src={user.avatar ?? undefined} />
                      <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                        {(user.penName || user.name || "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-2">
                    <p className="text-sm font-semibold truncate">{user.penName || user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/penulis/${user.id}`} className="cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" /> Profil Saya
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/pustaka" className="cursor-pointer">
                      <Library className="mr-2 h-4 w-4" /> Pustakaku
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/studio" className="cursor-pointer">
                      <PenLine className="mr-2 h-4 w-4" /> Studio Menulis
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild className="h-10">
              <Link to="/login">Masuk</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

/** Bottom nav khusus mobile */
export function MobileNav() {
  const { isAuthenticated } = useAuth();
  const items = [
    { to: "/", icon: Home, label: "Beranda" },
    { to: "/jelajah", icon: Compass, label: "Jelajah" },
    { to: "/peringkat", icon: Trophy, label: "Peringkat" },
    { to: "/pustaka", icon: Library, label: "Pustaka" },
    { to: "/studio", icon: PenLine, label: "Menulis" },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
            onClick={(e) => {
              if ((it.to === "/pustaka" || it.to === "/studio") && !isAuthenticated) {
                e.preventDefault();
                window.location.href = "/login";
              }
            }}
          >
            <it.icon className="h-5 w-5" />
            {it.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 pb-24 sm:px-6 md:grid-cols-3 md:pb-12">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Rumah bagi cerita-cerita Indonesia. Baca karya penulis lokal, terbitkan novelmu sendiri,
            dan temukan pembaca pertamamu di sini.
          </p>
        </div>
        <div>
          <h4 className="font-serif font-semibold">Jelajahi</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground transition-colors" to="/jelajah">Semua Novel</Link></li>
            <li><Link className="hover:text-foreground transition-colors" to="/peringkat">Peringkat</Link></li>
            <li><Link className="hover:text-foreground transition-colors" to="/jelajah?status=completed">Novel Tamat</Link></li>
            <li><Link className="hover:text-foreground transition-colors" to="/jelajah?sort=popular">Paling Populer</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif font-semibold">Untuk Penulis</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground transition-colors" to="/studio">Studio Menulis</Link></li>
            <li><Link className="hover:text-foreground transition-colors" to="/studio/baru">Terbitkan Novel Baru</Link></li>
            <li><Link className="hover:text-foreground transition-colors" to="/pustaka">Pustakaku</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 pb-20 md:pb-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lentera — Nyalakan ceritamu.
      </div>
    </footer>
  );
}
