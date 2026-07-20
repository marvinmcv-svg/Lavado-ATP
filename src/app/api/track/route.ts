// POST /api/track — analytics event ingestion (fire-and-forget on server)
import { NextRequest } from "next/server";
import { getBusinessId, json } from "@/lib/api";
import { trackEvent } from "@/lib/track";
import { trackEventSchema, validate } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ ok: false }, 404);
  const raw = await req.json().catch(() => null);
  if (!raw) return json({ ok: false }, 400);
  const result = validate(trackEventSchema, raw);
  if (!result.success) return json({ ok: false, error: result.error }, 400);
  trackEvent(businessId, result.data.eventType, result.data.metadata as never, req.headers.get("user-agent") ?? undefined);
  return json({ ok: true });
}
