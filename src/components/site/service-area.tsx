"use client";
// Service area / location — premium animated version.
// Map embed, coverage zones with staggered reveal, real-time hours,
// animated Abierto/Cerrado badge with pulse.
import { useEffect, useState } from "react";
import { MapPin, Clock, Navigation, CheckCircle2, Map as MapIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useLang, t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Business } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;

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
  const isOpen = !!(now && todayHours?.open && todayHours?.close);
  const dayLabels = lang === "en" ? DAY_LABELS_EN : DAY_LABELS_ES;

  const area = business.serviceArea;
  const zones = area?.zones ?? [];
  // Google Maps embed — no API key needed, uses the free embed endpoint
  const mapQuery = business.address
    ? encodeURIComponent(business.address)
    : (business.lat && business.lng
      ? `${business.lat},${business.lng}`
      : "Santa Cruz de la Sierra, Bolivia");
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&z=14&output=embed`;
  const directionsUrl = business.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`
    : "https://www.google.com/maps/place/Santa+Cruz+de+la+Sierra";

  return (
    <section id="area" className="py-16 sm:py-24 scroll-mt-16 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 -left-24 size-72 rounded-full bg-primary/8 blur-3xl float-slow" />
        <div className="absolute bottom-10 -right-20 size-80 rounded-full bg-accent/8 blur-3xl float-medium" style={{ animationDelay: "1.2s" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <Badge variant="secondary" className="mb-3 glass">
            <MapPin className="size-3.5 mr-1 text-accent" /> {lang === "en" ? "Coverage" : "Cobertura"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            <span className="text-gradient">{t(lang, "area_title")}</span>
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">{t(lang, "area_subtitle")}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          {/* Map with scale-in */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <Card className="overflow-hidden p-0 premium-card h-full">
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
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary link-underline"
                >
                  <Navigation className="size-4" /> {t(lang, "area_directions")}
                </a>
              </div>
            </Card>
          </motion.div>

          {/* Coverage + hours */}
          <div className="flex flex-col gap-6">
            {/* Zones — staggered reveal */}
            {zones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
              >
                <Card className="p-6 premium-card h-full">
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
                    {zones.map((z, i) => (
                      <motion.div
                        key={z}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.5, delay: 0.2 + i * 0.07, ease: EASE }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <motion.span
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.25 + i * 0.07 }}
                        >
                          <CheckCircle2 className="size-4 text-primary shrink-0" />
                        </motion.span>
                        <span>{z}</span>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Hours — fade-up */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
            >
              <Card className="p-6 premium-card h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Clock className="size-5 text-primary" />
                    {lang === "en" ? "Business hours" : "Horario de atención"}
                  </h3>
                  {/* Animated Abierto/Cerrado badge with pulse */}
                  {now && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Badge
                        variant={isOpen ? "default" : "secondary"}
                        className={cnDynamic(isOpen)}
                      >
                        <span className="relative flex size-1.5">
                          {isOpen && (
                            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" style={{ animationDuration: "1.5s" }} />
                          )}
                          <span className={`relative inline-flex rounded-full size-1.5 ${isOpen ? "bg-white" : "bg-muted-foreground"}`} />
                        </span>
                        {isOpen ? t(lang, "area_open") : t(lang, "area_closed")}
                      </Badge>
                    </motion.div>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {DAY_KEYS.map((dk, i) => {
                    const h = hours[dk];
                    const isToday = now && now.getDay() === i;
                    return (
                      <motion.li
                        key={dk}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: 0.05 + i * 0.04, ease: EASE }}
                        className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${isToday ? "bg-primary/10 font-semibold" : ""}`}
                      >
                        <span>{dayLabels[i]}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {h?.open && h?.close ? `${h.open} – ${h.close}` : (lang === "en" ? "Closed" : "Cerrado")}
                        </span>
                      </motion.li>
                    );
                  })}
                </ul>
                {now && todayHours?.open && todayHours?.close && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t(lang, "area_hours")}: {todayHours.open} – {todayHours.close}
                  </p>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Helper for the open/closed badge color (kept outside render for clarity). */
function cnDynamic(isOpen: boolean): string {
  return isOpen ? "bg-emerald-600 text-white" : "";
}
