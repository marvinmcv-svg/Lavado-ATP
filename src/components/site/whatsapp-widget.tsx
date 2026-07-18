"use client";
// WhatsApp floating widget (Step 3.2) — real wa.me click-to-chat, never a fake chat UI.
import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/whatsapp";
import { useLang, t } from "@/lib/i18n";
import type { Business, SiteSettings } from "@/lib/types";

export function WhatsAppWidget({ business, settings }: { business: Business | null; settings: SiteSettings | null }) {
  const lang = useLang((s) => s.lang);
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const seen = typeof window !== "undefined" && window.sessionStorage.getItem("wa_hint_seen");
    if (!seen) {
      const tmr = setTimeout(() => setShowHint(true), 2500);
      return () => clearTimeout(tmr);
    }
  }, []);

  const phone = business?.phone ?? null;
  const greeting = lang === "en" ? settings?.whatsappGreetingEn : settings?.whatsappGreetingEs;
  const href = phone ? buildWhatsAppUrl(normalizePhone(phone), greeting ?? "") : "#";

  const handleClick = () => {
    if (!phone) return;
    // fire-and-forget analytics
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType: "whatsapp_click", metadata: { source: "floating_widget" } }),
    }).catch(() => {});
    if (typeof window !== "undefined") window.sessionStorage.setItem("wa_hint_seen", "1");
    setShowHint(false);
  };

  const disabled = !phone;

  return (
    <>
      {/* Hint bubble */}
      {showHint && !disabled && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 max-w-[260px] animate-fade-up">
          <div className="relative rounded-2xl bg-card border border-border shadow-xl p-4 pr-8">
            <button
              onClick={() => { setShowHint(false); window.sessionStorage.setItem("wa_hint_seen", "1"); }}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
            <p className="text-sm font-medium text-foreground">
              {lang === "en" ? "💬 Need a quote?" : "💬 ¿Necesitas una cotización?"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === "en" ? "Chat with us on WhatsApp — fast response." : "Escríbenos por WhatsApp — respuesta rápida."}
            </p>
          </div>
          <div className="absolute -bottom-2 right-8 size-4 rotate-45 bg-card border-r border-b border-border" />
        </div>
      )}

      {/* Floating button */}
      <a
        href={href}
        target={disabled ? undefined : "_blank"}
        rel={disabled ? undefined : "noopener noreferrer"}
        onClick={handleClick}
        aria-label={t(lang, "wa_tooltip")}
        title={disabled ? (lang === "en" ? "Configure WhatsApp in Admin" : "Configurar WhatsApp en Admin") : t(lang, "wa_tooltip")}
        className={`fixed bottom-5 right-4 sm:right-6 z-50 flex items-center gap-2 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 ${
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-[#25D366] text-white hover:bg-[#1ebe5b]"
        } px-4 py-3 sm:px-5 sm:py-4`}
      >
        <MessageCircle className="size-6 sm:size-7 fill-white/20" />
        <span className="hidden sm:inline font-semibold text-sm">
          {disabled ? (lang === "en" ? "Setup needed" : "Sin configurar") : t(lang, "hero_cta")}
        </span>
      </a>
    </>
  );
}
