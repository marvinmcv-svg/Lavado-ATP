"use client";
// Official WhatsApp click-to-chat button — the authentic green WhatsApp widget.
// Floating bubble that links directly to wa.me with pre-filled greeting.
import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/whatsapp";
import { useLang } from "@/lib/i18n";
import type { Business, SiteSettings } from "@/lib/types";

export function WhatsAppWidget({ business, settings }: { business: Business | null; settings: SiteSettings | null }) {
  const lang = useLang((s) => s.lang);
  const [showLabel, setShowLabel] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    // Show a subtle pulse hint after 3s if user hasn't clicked
    const seen = typeof window !== "undefined" && window.sessionStorage.getItem("wa_clicked");
    if (!seen) {
      const tmr = setTimeout(() => setShowPulse(true), 3000);
      return () => clearTimeout(tmr);
    }
  }, []);

  const phone = business?.phone ?? null;
  const greeting = lang === "en"
    ? (settings?.whatsappGreetingEn ?? "Hi! How can we help?")
    : (settings?.whatsappGreetingEs ?? "Hola! ¿Cómo podemos ayudarte?");

  const href = phone ? buildWhatsAppUrl(normalizePhone(phone), greeting) : "#";
  const disabled = !phone;

  const handleClick = () => {
    if (typeof window !== "undefined") window.sessionStorage.setItem("wa_clicked", "1");
    setShowPulse(false);
    if (!phone) return;
    // fire-and-forget analytics + lead capture
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType: "whatsapp_click", metadata: { source: "whatsapp_widget" } }),
    }).catch(() => {});
    fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "whatsapp_widget", message: "Clicked WhatsApp widget" }),
    }).catch(() => {});
  };

  return (
    <>
      {/* Floating WhatsApp button — authentic green official style */}
      <a
        href={href}
        target={disabled ? undefined : "_blank"}
        rel={disabled ? undefined : "noopener noreferrer"}
        onClick={handleClick}
        aria-label="WhatsApp"
        className={`fixed bottom-5 right-4 sm:right-6 z-50 flex items-center gap-2 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 ${
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-[#25D366] hover:bg-[#1ebe5b]"
        } px-4 py-3 sm:px-5 sm:py-4 group`}
        onMouseEnter={() => setShowLabel(true)}
        onMouseLeave={() => setShowLabel(false)}
      >
        {/* Official WhatsApp SVG logo */}
        <svg
          className="size-6 sm:size-7 fill-white"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="hidden sm:inline font-semibold text-sm text-white">
          {disabled
            ? (lang === "en" ? "Setup needed" : "Sin configurar")
            : showLabel
              ? (lang === "en" ? "Chat now" : "Chatear ahora")
              : (lang === "en" ? "WhatsApp" : "WhatsApp")
          }
        </span>
        {/* Pulse hint dot */}
        {showPulse && !disabled && (
          <span className="absolute -top-1 -right-1 flex size-4">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex size-4 rounded-full bg-red-500 items-center justify-center text-[8px] font-bold text-white">1</span>
          </span>
        )}
      </a>
    </>
  );
}
