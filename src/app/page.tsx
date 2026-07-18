import { getPublicData } from "@/lib/public-data";
import { AppShell } from "@/components/app-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "lavadoatp — Lavado a presión profesional en Santa Cruz",
  description:
    "Lavado a presión profesional en Santa Cruz de la Sierra, Bolivia. Driveways, fachadas, techos, flotas comerciales. Cotización gratis por WhatsApp.",
  keywords: [
    "lavado a presión",
    "pressure washing",
    "lavado de driveway",
    "lavado de fachadas",
    "Santa Cruz Bolivia",
    "lavadoatp",
    "power washing",
  ],
  authors: [{ name: "lavadoatp" }],
  openGraph: {
    title: "lavadoatp — Lavado a presión profesional",
    description:
      "Recupera el brillo de tu propiedad. Lavado a presión profesional en Santa Cruz, Bolivia.",
    type: "website",
    locale: "es_BO",
  },
};

// Force dynamic rendering — data is DB-backed and changes on admin edits.
export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getPublicData();
  if (!data.business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-2">lavadoatp</h1>
          <p className="text-muted-foreground">
            Sitio en configuración. Ejecuta <code className="rounded bg-muted px-1.5 py-0.5 text-sm">bun run scripts/seed.ts</code> para inicializar.
          </p>
        </div>
      </div>
    );
  }
  return <AppShell data={data} />;
}
