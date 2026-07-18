// PUT /api/admin/staff/[id] — role change, active toggle
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const body = await req.json();
  const existing = await db.staffMember.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  const updated = await db.staffMember.update({
    where: { id },
    data: {
      role: body.role ?? existing.role,
      active: body.active ?? existing.active,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Owner", action: `Actualizó personal "${existing.name}" → ${updated.role}${updated.active ? "" : " (inactivo)"}`, tableName: "staff_members", recordId: id },
  });
  return json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const existing = await db.staffMember.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  await db.staffMember.delete({ where: { id } });
  await db.auditLog.create({
    data: { businessId, actorName: "Owner", action: `Eliminó personal "${existing.name}"`, tableName: "staff_members", recordId: id },
  });
  return json({ ok: true });
}

export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return [];
}
