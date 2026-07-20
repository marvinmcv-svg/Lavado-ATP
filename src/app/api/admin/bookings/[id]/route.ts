// PUT /api/admin/bookings/[id] — status, crew, reschedule, deposit
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const body = await req.json();
  const existing = await db.booking.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  const updated = await db.booking.update({
    where: { id },
    data: {
      status: body.status ?? existing.status,
      crewAssigned: body.crewAssigned !== undefined ? body.crewAssigned : existing.crewAssigned,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : existing.scheduledAt,
      quotedAmount: body.quotedAmount !== undefined ? body.quotedAmount : existing.quotedAmount,
      depositAmount: body.depositAmount !== undefined ? body.depositAmount : existing.depositAmount,
      depositPaid: body.depositPaid !== undefined ? body.depositPaid : existing.depositPaid,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Actualizó reserva #${id.slice(-6)} → ${updated.status}`, tableName: "bookings", recordId: id, oldValue: existing as unknown as Prisma.InputJsonValue, newValue: updated as unknown as Prisma.InputJsonValue },
  });
  return json(updated);
}

export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return [];
}
