// POST /api/track — analytics event ingestion (fire-and-forget on server)
import { NextRequest } from "next/server";
import { getBusinessId, json } from "@/lib/api";
import { trackEvent } from "@/lib/track";

export async function POST(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ ok: false }, 404);
  let body: { eventType?: string; metadata?: Record<string, unknown> } = {};
  try {
    body = await req.json();
  } catch {
    return json({ ok: false }, 400);
  }
  const eventType = body.eventType;
  if (!eventType) return json({ ok: false }, 400);
  trackEvent(businessId, eventType, body.metadata, req.headers.get("user-agent") ?? undefined);
  return json({ ok: true });
}
