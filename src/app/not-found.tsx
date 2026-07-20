import Link from "next/link";
import { Droplets, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg mb-6">
        <Droplets className="size-8" />
      </div>
      <h1 className="text-6xl font-black text-primary mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-6 max-w-md">
        Esta página no existe o fue movida. Quizás el agua se la llevó.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
      >
        <Home className="size-5" />
        Volver al inicio
      </Link>
    </div>
  );
}
