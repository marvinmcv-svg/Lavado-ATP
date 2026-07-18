// POST /api/leads — create a lead (quote calculator, contact form, whatsapp)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";
import { trackEvent } from "@/lib/track";

export async function POST(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  let body: {
    source?: string;
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
    zone?: string;
    serviceType?: string;
    propertySize?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  const validSources = ["whatsapp_widget", "contact_form", "quote_calculator", "direct_call"];
  const source = validSources.includes(body.source ?? "") ? body.source! : "whatsapp_widget";
  const lead = await db.lead.create({
    data: {
      businessId,
      source,
      name: body.name ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      message: body.message ?? null,
      zone: body.zone ?? null,
      serviceType: body.serviceType ?? null,
      propertySize: body.propertySize ?? null,
      status: "new",
    },
  });
  trackEvent(businessId, "lead_created", { leadId: lead.id, source });
  return json({ ok: true, id: lead.id });
}
