import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("lentera-theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    applyTheme(dark);
    localStorage.setItem("lentera-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
      className="h-11 w-11"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

/** Init theme before paint (avoid flash) */
export function initTheme() {
  const saved = localStorage.getItem("lentera-theme");
  applyTheme(saved ? saved === "dark" : true);
}
