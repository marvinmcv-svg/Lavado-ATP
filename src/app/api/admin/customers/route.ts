// GET /api/admin/customers — list with bookings + spend
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
