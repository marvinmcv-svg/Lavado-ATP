// PUT /api/admin/leads/[id] — move status / assign
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const body = await req.json();
  const existing = await db.lead.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  const updated = await db.lead.update({
    where: { id },
    data: {
      status: body.status ?? existing.status,
      assignedTo: body.assignedTo !== undefined ? body.assignedTo : existing.assignedTo,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Movió lead "${existing.name ?? existing.phone}" → ${updated.status}`, tableName: "leads", recordId: id, oldValue: { status: existing.status } as unknown as Prisma.InputJsonValue, newValue: { status: updated.status } as unknown as Prisma.InputJsonValue },
  });
  return json(updated);
}

export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return [];
}
