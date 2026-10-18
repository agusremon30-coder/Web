import { Outlet } from "react-router";
import { SiteHeader, SiteFooter, MobileNav } from "./SiteChrome";

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
