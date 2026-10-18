export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}rb`;
  return `${n}`;
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} minggu lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 220));
}

export const STATUS_LABEL: Record<string, string> = {
  ongoing: "Berlangsung",
  completed: "Tamat",
  hiatus: "Hiatus",
};

export const STATUS_COLOR: Record<string, string> = {
  ongoing: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400",
  completed: "bg-sky-600/15 text-sky-700 dark:text-sky-400",
  hiatus: "bg-amber-600/15 text-amber-700 dark:text-amber-400",
};
