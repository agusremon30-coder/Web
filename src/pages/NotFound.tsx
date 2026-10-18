import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="font-serif text-7xl font-bold text-primary">404</p>
        <h1 className="mt-4 font-serif text-2xl font-bold">Halaman ini belum ditulis</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tautan yang kamu tuju tidak ada — mungkin babnya masih dalam draf semesta.
        </p>
        <Button asChild className="mt-6 h-11">
          <Link to="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </div>
  );
}
