// POST /api/leads — create a lead (quote calculator, contact form, whatsapp)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";
import { leadCreateSchema, validate } from "@/lib/validation";
import { trackEvent } from "@/lib/track";

export async function POST(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const raw = await req.json().catch(() => null);
  if (!raw) return json({ error: "invalid_body" }, 400);
  const result = validate(leadCreateSchema, raw);
  if (!result.success) return json({ error: "validation_error", detail: result.error }, 400);
  const source = result.data.source ?? "whatsapp_widget";
  const lead = await db.lead.create({
    data: {
      businessId,
      source,
      name: result.data.name ?? null,
      phone: result.data.phone ?? null,
      email: result.data.email ?? null,
      message: result.data.message ?? null,
      zone: result.data.zone ?? null,
      serviceType: result.data.serviceType ?? null,
      propertySize: result.data.propertySize ?? null,
      status: "new",
    },
  });
  trackEvent(businessId, "lead_created", { leadId: lead.id, source });
  return json({ ok: true, id: lead.id });
}
