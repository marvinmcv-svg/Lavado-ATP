"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Droplets, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg mb-6">
        <Droplets className="size-8" />
      </div>
      <h1 className="text-3xl font-black mb-2">Algo salió mal</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="size-5" />
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 font-semibold hover:bg-accent/40 transition-colors"
        >
          <Home className="size-5" />
          Inicio
        </Link>
      </div>
    </div>
  );
}
