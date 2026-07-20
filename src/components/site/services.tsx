"use client";
// Live services section — premium version with 3D card tilts, staggered reveal, glow effects.
import { useMemo, useState } from "react";
import { Sparkles, MessageCircle, Lock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang, t } from "@/lib/i18n";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/quote";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Business, Service, ServiceCategory } from "@/lib/types";

export function Services({
  business,
  categories,
  services,
}: {
  business: Business;
  categories: ServiceCategory[];
  services: Service[];
}) {
  const lang = useLang((s) => s.lang);
  const [activeCat, setActiveCat] = useState<string>(categories[0]?.id ?? "");
  const effectiveCat = categories.find((c) => c.id === activeCat) ? activeCat : (categories[0]?.id ?? "");

  const filtered = useMemo(
    () => services.filter((s) => s.categoryId === effectiveCat),
    [services, effectiveCat],
  );

  const onCategoryClick = (catId: string, catName: string) => {
    setActiveCat(catId);
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType: "service_section_view", metadata: { category: catName } }),
    }).catch(() => {});
  };

  const greeting = lang === "en" ? "Hola, vi su página web y quisiera una cotización..." : "Hola, vi su página web y quisiera una cotización...";

  return (
    <section id="services" className="py-16 sm:py-24 bg-secondary/40 scroll-mt-16 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute -top-20 -left-20 size-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 size-64 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <Badge variant="secondary" className="mb-3 glass">
            <Sparkles className="size-3.5 mr-1 text-accent" /> {lang === "en" ? "Our services" : "Nuestros servicios"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            {t(lang, "services_title")}
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            {t(lang, "services_subtitle")}
          </p>
        </motion.div>

        {/* Category tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex gap-1 rounded-xl bg-muted p-1 overflow-x-auto no-scrollbar max-w-full">
            {categories.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                onClick={() => onCategoryClick(c.id, lang === "en" ? c.nameEn : c.nameEs)}
                className={cn(
                  "rounded-lg px-4 sm:px-6 py-2 text-sm font-semibold whitespace-nowrap transition-all relative",
                  effectiveCat === c.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {lang === "en" ? c.nameEn : c.nameEs}
                {effectiveCat === c.id && (
                  <motion.div
                    layoutId="activeCatPill"
                    className="absolute inset-0 -z-10 rounded-lg bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Service grid with staggered reveal */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <ServiceCard service={s} business={business} greeting={greeting} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            {lang === "en" ? "No services in this category yet." : "Sin servicios en esta categoría."}
          </p>
        )}
      </div>
    </section>
  );
}

function ServiceCard({ service, business, greeting }: { service: Service; business: Business; greeting: string }) {
  const lang = useLang((s) => s.lang);
  const name = lang === "en" ? service.nameEn : service.nameEs;
  const desc = lang === "en" ? service.descriptionEn : service.descriptionEs;
  const photo = service.afterPhotoUrl ?? service.beforePhotoUrl;
  const [hover, setHover] = useState(false);

  const priceLabel = (() => {
    if (service.priceType === "quote_only" || service.price == null) {
      return <Badge variant="outline" className="border-accent text-accent-foreground bg-accent/10">{t(lang, "services_quote")}</Badge>;
    }
    if (service.priceType === "starting_at") {
      return (
        <span className="text-sm text-muted-foreground">
          {t(lang, "services_from")} <span className="text-2xl font-black text-gradient">{formatPrice(service.price, service.currency)}</span>
        </span>
      );
    }
    return (
      <span className="text-sm text-muted-foreground">
        {t(lang, "services_fixed")}: <span className="text-2xl font-black text-gradient">{formatPrice(service.price, service.currency)}</span>
      </span>
    );
  })();

  const waHref = business.phone
    ? buildWhatsAppUrl(normalizePhone(business.phone), `${greeting}\n\nServicio: ${name}`)
    : "#";

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "premium-card group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm h-full",
        !service.available && "opacity-75",
      )}
    >
      {/* Image with zoom + overlay */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className={cn(
              "size-full object-cover transition-transform duration-700 group-hover:scale-110",
              !service.available && "grayscale",
            )}
            loading="lazy"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-primary/20 to-accent/20" />
        )}
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Available badge */}
        {!service.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/40 backdrop-blur-[1px]">
            <Badge variant="secondary" className="gap-1 glass">
              <Lock className="size-3" /> {t(lang, "services_unavailable")}
            </Badge>
          </div>
        )}

        {/* Price tag floating on image (desktop) */}
        {service.price != null && service.priceType !== "quote_only" && (
          <div className="absolute bottom-3 left-3 glass rounded-lg px-3 py-1.5 shadow-lg">
            <span className="text-xs font-bold text-white">
              {service.priceType === "starting_at" ? `${t(lang, "services_from")} ` : ""}
              {formatPrice(service.price, service.currency)}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5 relative z-10">
        <h3 className="font-bold text-lg leading-tight">{name}</h3>
        <p className="mt-2 text-sm text-muted-foreground flex-1 line-clamp-3">{desc}</p>

        {/* Price */}
        <div className="mt-4">{priceLabel}</div>

        {/* CTA */}
        {service.available && business.phone && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventType: "whatsapp_click", metadata: { source: "service_card", service: name } }) }).catch(() => {})}
            className="mt-4 inline-flex items-center justify-between gap-2 rounded-lg bg-primary/10 text-primary px-4 py-2.5 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-all group/btn"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="size-4" />
              {t(lang, "services_request")}
            </span>
            <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
          </a>
        )}
      </div>
    </article>
  );
}
