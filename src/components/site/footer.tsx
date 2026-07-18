"use client";
// Footer — NAP consistency, hours, social, copyright. Sticky-to-bottom.
import { Droplets, Phone, MapPin, Clock, Instagram, MessageCircle, Mail } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/whatsapp";
import type { Business, SiteSettings } from "@/lib/types";

export function Footer({ business, settings }: { business: Business; settings: SiteSettings | null }) {
  const lang = useLang((s) => s.lang);
  const hours = (business.openingHours ?? {}) as Record<string, { open: string | null; close: string | null }>;
  const dayLabels = lang === "en"
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const waHref = business.phone ? buildWhatsAppUrl(normalizePhone(business.phone), lang === "en" ? settings?.whatsappGreetingEn ?? "" : settings?.whatsappGreetingEs ?? "") : "#";

  return (
    <footer className="mt-auto bg-foreground text-background">
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Droplets className="size-5" />
              </span>
              <span className="font-extrabold text-lg">
                lavado<span className="text-primary">atp</span>
              </span>
            </div>
            <p className="text-sm text-background/70 leading-relaxed">
              {t(lang, "footer_about")}
            </p>
            <div className="flex gap-2 mt-4">
              {business.instagramUrl && (
                <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex size-9 items-center justify-center rounded-lg bg-background/10 hover:bg-primary transition-colors" aria-label="Instagram">
                  <Instagram className="size-4" />
                </a>
              )}
              {business.phone && (
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex size-9 items-center justify-center rounded-lg bg-background/10 hover:bg-[#25D366] transition-colors" aria-label="WhatsApp">
                  <MessageCircle className="size-4" />
                </a>
              )}
            </div>
          </div>

          {/* Contact (NAP) */}
          <div>
            <h3 className="font-bold mb-3">{t(lang, "footer_contact")}</h3>
            <ul className="space-y-2.5 text-sm text-background/80">
              {business.phone && (
                <li className="flex items-start gap-2">
                  <Phone className="size-4 mt-0.5 shrink-0 text-primary" />
                  <a href={`tel:${business.phone}`} className="hover:text-background">{business.phone}</a>
                </li>
              )}
              {business.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="size-4 mt-0.5 shrink-0 text-primary" />
                  <span>{business.address}</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <Mail className="size-4 mt-0.5 shrink-0 text-primary" />
                <span>hola@lavadoatp.com</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-bold mb-3">{t(lang, "footer_hours")}</h3>
            <ul className="space-y-1.5 text-sm text-background/80">
              {dayKeys.map((dk, i) => {
                const h = hours[dk];
                return (
                  <li key={dk} className="flex justify-between gap-3">
                    <span>{dayLabels[i]}</span>
                    <span>{h?.open && h?.close ? `${h.open}–${h.close}` : (lang === "en" ? "Closed" : "Cerrado")}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold mb-3">{t(lang, "footer_links")}</h3>
            <ul className="space-y-2 text-sm text-background/80">
              <li><a href="#services" className="hover:text-background">{t(lang, "nav_services")}</a></li>
              <li><a href="#before-after" className="hover:text-background">{t(lang, "nav_beforeafter")}</a></li>
              <li><a href="#quote" className="hover:text-background">{t(lang, "nav_quote")}</a></li>
              <li><a href="#area" className="hover:text-background">{t(lang, "nav_area")}</a></li>
              <li><a href="#reviews" className="hover:text-background">{t(lang, "nav_reviews")}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-background/60">
          <p>© {new Date().getFullYear()} lavadoatp. {t(lang, "footer_rights")}</p>
          <p className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {lang === "en" ? "Santa Cruz de la Sierra, Bolivia" : "Santa Cruz de la Sierra, Bolivia"}
          </p>
        </div>
      </div>
    </footer>
  );
}
