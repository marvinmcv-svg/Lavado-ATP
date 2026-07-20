"use client";
// Quote calculator — premium animated version.
// AnimatePresence step transitions (slide in/out), spring step indicator,
// glow pulse on estimate, animated count-up for price range, hover effects.
import { useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Droplets, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang, t } from "@/lib/i18n";
import { buildWhatsAppUrl, normalizePhone, quoteHandoffMessage } from "@/lib/whatsapp";
import { computeEstimate, formatPrice, SIZE_PRESETS, type QuoteConfig } from "@/lib/quote";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Business, Service, SiteSettings } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Animated number that counts up smoothly whenever `target` changes. */
function useAnimatedNumber(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Skip animation; defer state update outside the effect body to satisfy
      // react-hooks/set-state-in-effect rule.
      prevRef.current = target;
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }
    const startVal = prevRef.current;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prevRef.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export function QuoteCalculator({
  business,
  settings,
  services,
}: {
  business: Business;
  settings: SiteSettings | null;
  services: Service[];
}) {
  const lang = useLang((s) => s.lang);
  // only services with a numeric base price are calculable
  const calculable = useMemo(() => services.filter((s) => s.priceType !== "quote_only" && s.price != null && s.available), [services]);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const config: QuoteConfig = (settings?.quoteCalculatorConfig as unknown as QuoteConfig) ?? { tiers: [] };
  const selectedService = calculable.find((s) => s.id === serviceId) ?? null;
  const selectedSize = SIZE_PRESETS.find((s) => s.id === sizeId) ?? null;

  const estimate = useMemo(() => {
    if (!selectedService || selectedService.price == null || !selectedSize) return null;
    return computeEstimate({
      basePrice: selectedService.price,
      sqm: selectedSize.sqm,
      config,
      currency: selectedService.currency,
    });
  }, [selectedService, selectedSize, config]);

  const reset = () => { setServiceId(null); setSizeId(null); setStep(1); };

  const onConfirmWhatsApp = () => {
    if (!selectedService || !selectedSize || !estimate || !business.phone) return;
    fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventType: "whatsapp_click", metadata: { source: "quote_calculator", service: selectedService.nameEn } }) }).catch(() => {});
    fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "quote_calculator",
        message: `${lang === "en" ? "Quote calc" : "Cotizador"}: ${selectedService.nameEs} / ${selectedSize.labelEs} → ${formatPrice(estimate.low, estimate.currency)}–${formatPrice(estimate.high, estimate.currency)}`,
        serviceType: selectedService.nameEn,
        propertySize: selectedSize.labelEn,
      }),
    }).catch(() => {});
    const msg = quoteHandoffMessage({
      serviceName: lang === "en" ? selectedService.nameEn : selectedService.nameEs,
      sizeLabel: lang === "en" ? selectedSize.labelEn : selectedSize.labelEs,
      estimateLow: estimate.low,
      estimateHigh: estimate.high,
      currency: estimate.currency,
      lang,
    });
    window.open(buildWhatsAppUrl(normalizePhone(business.phone), msg), "_blank", "noopener,noreferrer");
  };

  return (
    <section id="quote" className="py-16 sm:py-24 bg-primary text-primary-foreground scroll-mt-16 relative overflow-hidden">
      {/* Decorative water + blobs */}
      <div className="absolute inset-0 bg-water-texture opacity-30 pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 size-72 rounded-full bg-accent/20 blur-3xl float-slow" />
        <div className="absolute -bottom-24 -left-20 size-80 rounded-full bg-accent/15 blur-3xl float-medium" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="max-w-2xl mx-auto text-center mb-10"
        >
          <Badge className="mb-3 bg-accent text-accent-foreground hover:bg-accent">
            <Calculator className="size-3.5 mr-1" /> {lang === "en" ? "Free estimate" : "Estimación gratis"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            <span className="text-gradient">{t(lang, "quote_title")}</span>
          </h2>
          <p className="mt-3 text-primary-foreground/80 text-lg">{t(lang, "quote_subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        >
          <Card className="max-w-2xl mx-auto p-6 sm:p-8 bg-card text-card-foreground shadow-2xl premium-card">
            {/* Steps indicator with spring physics */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <motion.div
                    layout
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                      step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                    animate={step === n ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    <AnimatePresence mode="wait">
                      {step > n ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 18 }}
                        >
                          <Check className="size-4" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key={n}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          {n}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  {n < 3 && (
                    <div className="relative w-8 sm:w-16 h-0.5 rounded bg-muted overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-primary rounded"
                        initial={false}
                        animate={{ width: step > n ? "100%" : "0%" }}
                        transition={{ duration: 0.4, ease: EASE }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Animated step content */}
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" custom={step}>
                {/* Step 1: service */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <h3 className="font-bold text-lg mb-4">{t(lang, "quote_step_service")}</h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {calculable.map((s, i) => (
                        <motion.button
                          key={s.id}
                          onClick={() => { setServiceId(s.id); setStep(2); }}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.05 + i * 0.05, ease: EASE }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="text-left rounded-lg border border-border p-3 hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all flex items-start gap-3 relative overflow-hidden group"
                        >
                          {/* Shine on hover */}
                          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: "linear-gradient(135deg, transparent 30%, color-mix(in oklch, var(--accent) 12%, transparent) 50%, transparent 70%)" }} />
                          {s.afterPhotoUrl ? (
                            <img src={s.afterPhotoUrl} alt="" className="size-12 rounded-md object-cover shrink-0" />
                          ) : (
                            <div className="size-12 rounded-md bg-primary/10 shrink-0" />
                          )}
                          <div className="min-w-0 relative">
                            <p className="font-semibold text-sm leading-tight">{lang === "en" ? s.nameEn : s.nameEs}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {s.priceType === "fixed" ? formatPrice(s.price!, s.currency) : `${t(lang, "services_from")} ${formatPrice(s.price!, s.currency)}`}
                            </p>
                          </div>
                          <ArrowRight className="size-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: size */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <h3 className="font-bold text-lg mb-1">{t(lang, "quote_step_size")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {lang === "en" ? "Selected:" : "Seleccionado:"} <span className="font-semibold text-foreground">{lang === "en" ? selectedService?.nameEn : selectedService?.nameEs}</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {SIZE_PRESETS.map((sz, i) => (
                        <motion.button
                          key={sz.id}
                          onClick={() => { setSizeId(sz.id); setStep(3); }}
                          initial={{ opacity: 0, y: 16, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.05 + i * 0.08, ease: EASE }}
                          whileHover={{ scale: 1.04, y: -3 }}
                          whileTap={{ scale: 0.97 }}
                          className={cn(
                            "rounded-lg border-2 p-4 text-center transition-colors relative overflow-hidden group",
                            sizeId === sz.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                          )}
                        >
                          {/* Shine on hover */}
                          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: "linear-gradient(135deg, transparent 30%, color-mix(in oklch, var(--accent) 10%, transparent) 50%, transparent 70%)" }} />
                          <div className="font-bold text-base relative">{lang === "en" ? sz.labelEn : sz.labelEs}</div>
                          <div className="text-xs text-muted-foreground mt-1 relative">~{sz.sqm} m²</div>
                        </motion.button>
                      ))}
                    </div>
                    <button onClick={() => setStep(1)} className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowLeft className="size-4" /> {lang === "en" ? "Back" : "Atrás"}
                    </button>
                  </motion.div>
                )}

                {/* Step 3: result */}
                {step === 3 && estimate && selectedService && selectedSize && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="text-center"
                  >
                    <h3 className="font-bold text-lg mb-4">{t(lang, "quote_step_result")}</h3>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
                      className="rounded-xl bg-primary/5 border border-primary/20 p-6 mb-4 glow-pulse"
                    >
                      <p className="text-sm text-muted-foreground">{t(lang, "quote_estimate")} · {lang === "en" ? selectedSize.labelEn : selectedSize.labelEs}</p>
                      <AnimatedPriceRange low={estimate.low} high={estimate.high} currency={estimate.currency} />
                      <p className="text-xs text-muted-foreground mt-2">{t(lang, "quote_range")}</p>
                    </motion.div>
                    <p className="text-xs text-muted-foreground mb-5 flex items-center justify-center gap-1.5">
                      <Sparkles className="size-3.5" /> {t(lang, "quote_disclaimer")}
                    </p>

                    {business.phone ? (
                      <Button onClick={onConfirmWhatsApp} size="lg" className="w-full gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white btn-shine">
                        <Droplets className="size-5" /> {t(lang, "quote_confirm")}
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">{lang === "en" ? "Contact us to confirm." : "Contáctanos para confirmar."}</p>
                    )}

                    <div className="mt-6 flex items-center justify-between">
                      <button onClick={() => setStep(2)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="size-4" /> {lang === "en" ? "Change size" : "Cambiar tamaño"}
                      </button>
                      <button onClick={reset} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {lang === "en" ? "Start over" : "Empezar de nuevo"} <ArrowRight className="size-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

/** Animated low–high price range that counts up when values change. */
function AnimatedPriceRange({ low, high, currency }: { low: number; high: number; currency: string }) {
  const lowNum = useAnimatedNumber(low);
  const highNum = useAnimatedNumber(high);
  return (
    <p className="text-4xl sm:text-5xl font-black text-primary mt-1 stat-glow tabular-nums">
      {formatPrice(lowNum, currency)} – {formatPrice(highNum, currency)}
    </p>
  );
}
