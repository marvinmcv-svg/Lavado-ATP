// GET/POST /api/admin/bookings
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";
import { bookingCreateSchema, validate } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ bookings: [] });
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const where: Record<string, unknown> = { businessId };
  if (from || to) {
    where.scheduledAt = {};
    if (from) (where.scheduledAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.scheduledAt as Record<string, unknown>).lte = new Date(to);
  }
  const bookings = await db.booking.findMany({
    where: where as never,
    orderBy: { scheduledAt: "asc" },
    include: { service: true, customer: true },
  });
  return json({ bookings });
}

export async function POST(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const raw = await req.json().catch(() => null);
  if (!raw) return json({ error: "invalid_body" }, 400);
  const result = validate(bookingCreateSchema, raw);
  if (!result.success) return json({ error: "validation_error", detail: result.error }, 400);
  const { customerName, customerPhone, serviceId, propertyAddress, propertySizeSqm, scheduledAt, crewAssigned, quotedAmount, specialRequests, zone, depositAmount } = result.data;

  // Validate date is parseable
  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return json({ error: "validation_error", detail: "scheduledAt: invalid date" }, 400);
  }

  // upsert customer by phone
  let customer = await db.customer.findFirst({ where: { businessId, phone: customerPhone } });
  if (!customer) {
    customer = await db.customer.create({
      data: { businessId, name: customerName, phone: customerPhone, propertyType: "residential", address: propertyAddress ?? null, tags: ["Primera vez"] },
    });
  } else {
    customer = await db.customer.update({
      where: { id: customer.id },
      data: { visitCount: { increment: 1 } },
    });
  }

  const booking = await db.booking.create({
    data: {
      businessId,
      customerId: customer.id,
      customerName,
      customerPhone,
      serviceId: serviceId ?? null,
      propertyAddress: propertyAddress ?? "",
      propertySizeSqm: propertySizeSqm ?? null,
      scheduledAt: scheduledDate,
      status: "pending",
      crewAssigned: crewAssigned ?? null,
      quotedAmount: quotedAmount ?? null,
      specialRequests: specialRequests ?? null,
      zone: zone ?? null,
      depositAmount: depositAmount ?? 0,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Creó reserva para ${customerName}`, tableName: "bookings", recordId: booking.id },
  });
  return json(booking, 201);
}
