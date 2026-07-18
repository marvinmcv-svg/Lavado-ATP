// Fire-and-forget analytics event ingestion helper.
import { db } from "@/lib/db";

export function trackEvent(
  businessId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
  userAgent?: string,
) {
  // never await — never block the caller
  db.analyticsEvent
    .create({
      data: { businessId, eventType, metadata: metadata ?? undefined, userAgent },
    })
    .catch(() => {
      /* swallow — analytics must never break the page */
    });
}
