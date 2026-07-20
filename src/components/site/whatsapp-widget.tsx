"use client";
// Proper WhatsApp chat widget (Step 3.2 — real wa.me click-to-chat, not a fake chat UI).
// Floating bubble → opens a WhatsApp-style chat panel with greeting + CTA button.
import { useEffect, useState } from "react";
import { MessageCircle, X, Send, CheckCheck, Droplets } from "lucide-react";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/whatsapp";
import { useLang, t } from "@/lib/i18n";
import type { Business, SiteSettings } from "@/lib/types";

export function WhatsAppWidget({ business, settings }: { business: Business | null; settings: SiteSettings | null }) {
  const lang = useLang((s) => s.lang);
  const [open, setOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    // Show a subtle pulse hint after 3s if user hasn't opened the widget
    const seen = typeof window !== "undefined" && window.sessionStorage.getItem("wa_opened");
    if (!seen) {
      const tmr = setTimeout(() => setShowPulse(true), 3000);
      return () => clearTimeout(tmr);
    }
  }, []);

  const phone = business?.phone ?? null;
  const greeting = lang === "en" ? (settings?.whatsappGreetingEn ?? "Hi! How can we help?") : (settings?.whatsappGreetingEs ?? "Hola! ¿Cómo podemos ayudarte?");
  const businessName = business?.name ?? "Lavado ATP";

  const href = phone ? buildWhatsAppUrl(normalizePhone(phone), greeting) : "#";
  const disabled = !phone;

  const handleOpen = () => {
    setOpen((o) => !o);
    setShowPulse(false);
    if (typeof window !== "undefined") window.sessionStorage.setItem("wa_opened", "1");
  };

  const handleChatClick = () => {
    if (!phone) return;
    // fire-and-forget analytics + lead capture
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType: "whatsapp_click", metadata: { source: "chat_widget" } }),
    }).catch(() => {});
    fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "whatsapp_widget", message: "Opened chat from WhatsApp widget" }),
    }).catch(() => {});
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString(lang === "en" ? "en-US" : "es-BO", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Chat panel */}
      {open && !disabled && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm animate-fade-up">
          <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
            {/* Header */}
            <div className="flex items-center gap-3 bg-[#075E54] text-white px-4 py-3">
              <div className="relative">
                <div className="size-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                  {business?.logoUrl ? (
                    <img src={business.logoUrl} alt="" className="size-full rounded-full object-cover" />
                  ) : (
                    <Droplets className="size-5" />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-400 border-2 border-[#075E54]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight">{businessName}</p>
                <p className="text-[11px] text-white/80 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-green-300" />
                  {lang === "en" ? "Online" : "En línea"}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white p-1" aria-label="Cerrar">
                <X className="size-5" />
              </button>
            </div>

            {/* Chat body — WhatsApp-style wallpaper */}
            <div
              className="flex-1 px-3 py-4 min-h-[180px] flex flex-col gap-2 justify-end"
              style={{
                backgroundColor: "#ECE5DD",
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4cdc0' fill-opacity='0.15'%3E%3Cpath d='M20 0L40 20L20 40L0 20Z'/%3E%3C/g%3E%3C/svg%3E\")",
              }}
            >
              {/* Incoming message bubble */}
              <div className="max-w-[85%] self-start">
                <div className="relative bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
                  <p className="text-sm text-gray-800 leading-relaxed">{greeting}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-gray-400">{timeStr}</span>
                    <CheckCheck className="size-3.5 text-blue-500" />
                  </div>
                  {/* tail */}
                  <span className="absolute -left-2 top-0 size-0 border-t-8 border-r-8 border-t-white border-r-transparent" />
                </div>
              </div>

              {/* Quick-reply hint */}
              <div className="max-w-[85%] self-start">
                <div className="bg-white/90 rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
                  <p className="text-xs text-gray-600">
                    {lang === "en" ? "Tap below to start chatting on WhatsApp →" : "Toca abajo para chatear por WhatsApp →"}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA bar */}
            <div className="bg-[#F0F0F0] p-3 border-t border-border">
              <button
                onClick={handleChatClick}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold py-2.5 px-4 text-sm transition-colors shadow-sm"
              >
                <Send className="size-4" />
                {lang === "en" ? "Start chat on WhatsApp" : "Chatear por WhatsApp"}
              </button>
              <p className="text-center text-[10px] text-muted-foreground mt-1.5">
                {lang === "en" ? "Opens WhatsApp in a new tab" : "Abre WhatsApp en una nueva pestaña"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={handleOpen}
        aria-label={t(lang, "wa_tooltip")}
        title={disabled ? (lang === "en" ? "Configure WhatsApp in Admin" : "Configurar WhatsApp en Admin") : t(lang, "wa_tooltip")}
        className={`fixed bottom-5 right-4 sm:right-6 z-50 flex items-center gap-2 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 ${
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : open
              ? "bg-card text-foreground border border-border"
              : "bg-[#25D366] text-white hover:bg-[#1ebe5b]"
        } px-4 py-3 sm:px-5 sm:py-4`}
      >
        {disabled ? (
          <Droplets className="size-6" />
        ) : open ? (
          <X className="size-6" />
        ) : (
          <MessageCircle className="size-6 fill-white/20" />
        )}
        {!open && (
          <span className="hidden sm:inline font-semibold text-sm">
            {disabled ? (lang === "en" ? "Setup needed" : "Sin configurar") : t(lang, "hero_cta")}
          </span>
        )}
        {/* Pulse hint dot */}
        {showPulse && !open && !disabled && (
          <span className="absolute -top-1 -right-1 flex size-4">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex size-4 rounded-full bg-red-500 items-center justify-center text-[8px] font-bold text-white">1</span>
          </span>
        )}
      </button>
    </>
  );
}
