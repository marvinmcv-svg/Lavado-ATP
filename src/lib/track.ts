// Fire-and-forget analytics event ingestion helper.
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export function trackEvent(
  businessId: string,
  eventType: string,
  metadata?: Prisma.InputJsonValue,
  userAgent?: string,
) {
  // never await — never block the caller
  db.analyticsEvent
    .create({
      data: { businessId, eventType, metadata, userAgent },
    })
    .catch(() => {
      /* swallow — analytics must never break the page */
    });
}
