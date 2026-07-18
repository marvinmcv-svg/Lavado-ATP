"use client";
// Service area / location (Step 3.6) — map embed, coverage zones, real-time hours.
import { useEffect, useState } from "react";
import { MapPin, Clock, Navigation, CheckCircle2, Map as MapIcon } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Business } from "@/lib/types";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_LABELS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAY_LABELS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ServiceArea({ business }: { business: Business }) {
  const lang = useLang((s) => s.lang);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // initialize client-side clock (avoids SSR hydration mismatch)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const hours = (business.openingHours ?? {}) as Record<string, { open: string | null; close: string | null }>;
  const todayKey = now ? DAY_KEYS[now.getDay()] : "mon";
  const todayHours = hours[todayKey];
  const isOpen = now && todayHours?.open && todayHours?.close;
  const dayLabels = lang === "en" ? DAY_LABELS_EN : DAY_LABELS_ES;

  const area = business.serviceArea;
  const zones = area?.zones ?? [];
  const mapSrc = business.lat && business.lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${business.lng! - 0.08}%2C${business.lat! - 0.06}%2C${business.lng! + 0.08}%2C${business.lat! + 0.06}&layer=mapnik&marker=${business.lat}%2C${business.lng}`
    : "https://www.openstreetmap.org/export/embed.html?bbox=-63.25%2C-17.86%2C-63.10%2C-17.70&layer=mapnik&marker=-17.7833%2C-63.1821";
  const directionsUrl = business.address
    ? `https://www.google.com/maps/?daddr=${encodeURIComponent(business.address)}`
    : "https://www.google.com/maps/place/Santa+Cruz+de+la+Sierra";

  return (
    <section id="area" className="py-16 sm:py-24 scroll-mt-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="secondary" className="mb-3">
            <MapPin className="size-3.5 mr-1" /> {lang === "en" ? "Coverage" : "Cobertura"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">{t(lang, "area_title")}</h2>
          <p className="mt-3 text-muted-foreground text-lg">{t(lang, "area_subtitle")}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          {/* Map */}
          <Card className="overflow-hidden p-0">
            <iframe
              title="Mapa de cobertura"
              src={mapSrc}
              className="w-full h-[320px] sm:h-[420px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-4 flex items-center justify-between gap-3 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <MapIcon className="size-4 text-primary" />
                <span className="font-medium">{business.address ?? "Santa Cruz de la Sierra, Bolivia"}</span>
              </div>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <Navigation className="size-4" /> {t(lang, "area_directions")}
              </a>
            </div>
          </Card>

          {/* Coverage + hours */}
          <div className="flex flex-col gap-6">
            {/* Zones */}
            {zones.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <MapPin className="size-5 text-primary" />
                    {lang === "en" ? "Zones we serve" : "Zonas que atendemos"}
                  </h3>
                  {area?.mode === "radius" && area.radius_km && (
                    <Badge variant="outline" className="gap-1">
                      <Navigation className="size-3" /> {t(lang, "area_radius")}: {area.radius_km} km
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {zones.map((z) => (
                    <div key={z} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-primary shrink-0" />
                      <span>{z}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Hours */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Clock className="size-5 text-primary" />
                  {lang === "en" ? "Business hours" : "Horario de atención"}
                </h3>
                {now && (
                  <Badge variant={isOpen ? "default" : "secondary"} className={isOpen ? "bg-emerald-600 text-white" : ""}>
                    <span className={`size-1.5 rounded-full ${isOpen ? "bg-white animate-pulse" : "bg-muted-foreground"}`} />
                    {isOpen ? t(lang, "area_open") : t(lang, "area_closed")}
                  </Badge>
                )}
              </div>
              <ul className="space-y-1.5">
                {DAY_KEYS.map((dk, i) => {
                  const h = hours[dk];
                  const isToday = now && now.getDay() === i;
                  return (
                    <li
                      key={dk}
                      className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${isToday ? "bg-primary/10 font-semibold" : ""}`}
                    >
                      <span>{dayLabels[i]}</span>
                      <span className="text-muted-foreground">
                        {h?.open && h?.close ? `${h.open} – ${h.close}` : (lang === "en" ? "Closed" : "Cerrado")}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {now && todayHours?.open && todayHours?.close && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t(lang, "area_hours")}: {todayHours.open} – {todayHours.close}
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
