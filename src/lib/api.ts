// Shared helpers for API routes. Single-tenant: there is one business (lavadoatp).

import { db } from "@/lib/db";

export async function getBusiness() {
  return db.business.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

export async function getBusinessId() {
  const b = await getBusiness();
  return b?.id;
}

export async function getSettings(businessId: string) {
  return db.siteSettings.findUnique({ where: { businessId } });
}

export function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

// Public-safe business payload (no secrets).
export async function getPublicBusinessPayload() {
  const business = await getBusiness();
  if (!business) return null;
  const settings = await getSettings(business.id);
  return { business, settings };
}
