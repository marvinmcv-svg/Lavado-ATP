// POST/PUT/DELETE /api/admin/customers (POST here; PUT/DELETE on /[id])
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function GET(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ customers: [] });
  const tag = req.nextUrl.searchParams.get("tag");
  const where: Record<string, unknown> = { businessId };
  if (tag) where.tags = { string_contains: tag };
  const customers = await db.customer.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" },
    include: { bookings: { select: { id: true, scheduledAt: true, status: true, serviceId: true, quotedAmount: true }, orderBy: { scheduledAt: "desc" } } },
  });
  return json({ customers });
}

export async function POST(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const body = await req.json();
  const { name, phone, email, propertyType, address, tags, internalNotes } = body;
  if (!name || !phone) return json({ error: "missing_fields" }, 400);
  const customer = await db.customer.create({
    data: {
      businessId,
      name,
      phone,
      email: email ?? null,
      propertyType: propertyType ?? "residential",
      address: address ?? null,
      tags: tags ?? ["Primera vez"],
      internalNotes: internalNotes ?? null,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Creó cliente ${name}`, tableName: "customers", recordId: customer.id },
  });
  return json(customer, 201);
}
