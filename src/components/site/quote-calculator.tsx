"use client";
// Quote calculator (Step 3.9) — service + size → estimated range → WhatsApp handoff.
import { useMemo, useState } from "react";
import { Calculator, Droplets, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { buildWhatsAppUrl, normalizePhone, quoteHandoffMessage } from "@/lib/whatsapp";
import { computeEstimate, formatPrice, SIZE_PRESETS, type QuoteConfig } from "@/lib/quote";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Business, Service, SiteSettings } from "@/lib/types";

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
      {/* decorative */}
      <div className="absolute inset-0 bg-water-texture opacity-30 pointer-events-none" />
      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <Badge className="mb-3 bg-accent text-accent-foreground hover:bg-accent">
            <Calculator className="size-3.5 mr-1" /> {lang === "en" ? "Free estimate" : "Estimación gratis"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">{t(lang, "quote_title")}</h2>
          <p className="mt-3 text-primary-foreground/80 text-lg">{t(lang, "quote_subtitle")}</p>
        </div>

        <Card className="max-w-2xl mx-auto p-6 sm:p-8 bg-card text-card-foreground shadow-2xl">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <div className={cn("flex size-8 items-center justify-center rounded-full text-sm font-bold transition-all", step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {step > n ? <Check className="size-4" /> : n}
                </div>
                {n < 3 && <div className={cn("w-8 sm:w-16 h-0.5 rounded", step > n ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>

          {/* Step 1: service */}
          {step === 1 && (
            <div className="animate-fade-up">
              <h3 className="font-bold text-lg mb-4">{t(lang, "quote_step_service")}</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {calculable.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setServiceId(s.id); setStep(2); }}
                    className="text-left rounded-lg border border-border p-3 hover:border-primary hover:bg-primary/5 transition-all flex items-start gap-3"
                  >
                    {s.afterPhotoUrl ? (
                      <img src={s.afterPhotoUrl} alt="" className="size-12 rounded-md object-cover shrink-0" />
                    ) : (
                      <div className="size-12 rounded-md bg-primary/10 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{lang === "en" ? s.nameEn : s.nameEs}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.priceType === "fixed" ? formatPrice(s.price!, s.currency) : `${t(lang, "services_from")} ${formatPrice(s.price!, s.currency)}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: size */}
          {step === 2 && (
            <div className="animate-fade-up">
              <h3 className="font-bold text-lg mb-1">{t(lang, "quote_step_size")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {lang === "en" ? "Selected:" : "Seleccionado:"} <span className="font-semibold text-foreground">{lang === "en" ? selectedService?.nameEn : selectedService?.nameEs}</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {SIZE_PRESETS.map((sz) => (
                  <button
                    key={sz.id}
                    onClick={() => { setSizeId(sz.id); setStep(3); }}
                    className={cn(
                      "rounded-lg border-2 p-4 text-center transition-all",
                      sizeId === sz.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="font-bold text-base">{lang === "en" ? sz.labelEn : sz.labelEs}</div>
                    <div className="text-xs text-muted-foreground mt-1">~{sz.sqm} m²</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" /> {lang === "en" ? "Back" : "Atrás"}
              </button>
            </div>
          )}

          {/* Step 3: result */}
          {step === 3 && estimate && selectedService && selectedSize && (
            <div className="animate-fade-up text-center">
              <h3 className="font-bold text-lg mb-4">{t(lang, "quote_step_result")}</h3>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 mb-4">
                <p className="text-sm text-muted-foreground">{t(lang, "quote_estimate")} · {lang === "en" ? selectedSize.labelEn : selectedSize.labelEs}</p>
                <p className="text-4xl sm:text-5xl font-black text-primary mt-1">
                  {formatPrice(estimate.low, estimate.currency)} – {formatPrice(estimate.high, estimate.currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{t(lang, "quote_range")}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-5 flex items-center justify-center gap-1.5">
                <Sparkles className="size-3.5" /> {t(lang, "quote_disclaimer")}
              </p>

              {business.phone ? (
                <Button onClick={onConfirmWhatsApp} size="lg" className="w-full gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white">
                  <Droplets className="size-5" /> {t(lang, "quote_confirm")}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">{lang === "en" ? "Contact us to confirm." : "Contáctanos para confirmar."}</p>
              )}

              <div className="mt-6 flex items-center justify-between">
                <button onClick={() => setStep(2)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="size-4" /> {lang === "en" ? "Change size" : "Cambiar tamaño"}
                </button>
                <button onClick={reset} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  {lang === "en" ? "Start over" : "Empezar de nuevo"} <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
