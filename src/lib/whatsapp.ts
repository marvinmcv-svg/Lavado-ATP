// WhatsApp wa.me link builder (Step 3.2 of the master prompt)
// Real click-to-chat button — never a fake chat UI.

/**
 * Build a wa.me deep link. Phone must be E.164 digits only (country code,
 * no '+', no spaces). Returns a fully-encoded URL safe for <a href>.
 */
export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string {
  if (!phone) return "#";
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Normalize a raw phone string into E.164-ish digits for wa.me.
 * Bolivia default country code +591 if no leading country code is present.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  // Bolivia numbers are 8 digits starting with 6/7/2/3. Prefix 591 if missing.
  if (digits.length === 8) return `591${digits}`;
  return digits;
}

/**
 * Pre-fill the quote-confirmation message used by the quote calculator handoff.
 */
export function quoteHandoffMessage(opts: {
  serviceName: string;
  sizeLabel: string;
  estimateLow: number;
  estimateHigh: number;
  currency: string;
  lang: "es" | "en";
}): string {
  if (opts.lang === "en") {
    return [
      `Hi! I used the quote calculator on your website.`,
      `Service: ${opts.serviceName}`,
      `Property size: ${opts.sizeLabel}`,
      `Estimated range: ${opts.currency} ${opts.estimateLow}–${opts.estimateHigh}`,
      `I'd like to confirm a booking. When are you available?`,
    ].join("\n");
  }
  return [
    `Hola! Usé el cotizador en su página web.`,
    `Servicio: ${opts.serviceName}`,
    `Tamaño de propiedad: ${opts.sizeLabel}`,
    `Rango estimado: ${opts.currency} ${opts.estimateLow}–${opts.estimateHigh}`,
    `Quisiera confirmar una reserva. ¿Qué días tienen disponibles?`,
  ].join("\n");
}

/**
 * Booking-confirmation message used by admin → customer WhatsApp.
 */
export function bookingConfirmMessage(opts: {
  name: string;
  service: string;
  date: string;
  time: string;
  lang: "es" | "en";
}): string {
  if (opts.lang === "en") {
    return `Hi ${opts.name}, your ${opts.service} service on ${opts.date} at ${opts.time} is CONFIRMED. We'll see you then! — lavadoatp`;
  }
  return `Hola ${opts.name}, su servicio de ${opts.service} el ${opts.date} a las ${opts.time} está CONFIRMADO. ¡Nos vemos pronto! — lavadoatp`;
}

/**
 * Review-request message (Step 4.8).
 */
export function reviewRequestMessage(opts: {
  name: string;
  reviewLink: string;
  lang: "es" | "en";
}): string {
  if (opts.lang === "en") {
    return `Hi ${opts.name}, thank you for trusting us! Could you leave us a Google review? ${opts.reviewLink}`;
  }
  return `Hola ${opts.name}, muchas gracias por confiar en nosotros. ¿Podría dejarnos una reseña en Google? ${opts.reviewLink}`;
}
