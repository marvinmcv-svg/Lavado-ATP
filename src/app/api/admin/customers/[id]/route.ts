// PUT/DELETE /api/admin/customers/[id]
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const body = await req.json();
  const existing = await db.customer.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  const updated = await db.customer.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      phone: body.phone ?? existing.phone,
      email: body.email !== undefined ? body.email : existing.email,
      propertyType: body.propertyType ?? existing.propertyType,
      address: body.address !== undefined ? body.address : existing.address,
      tags: body.tags !== undefined ? body.tags : existing.tags,
      internalNotes: body.internalNotes !== undefined ? body.internalNotes : existing.internalNotes,
      visitCount: body.visitCount ?? existing.visitCount,
      totalSpend: body.totalSpend ?? existing.totalSpend,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Editó cliente ${existing.name}`, tableName: "customers", recordId: id },
  });
  return json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const existing = await db.customer.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  await db.customer.delete({ where: { id } });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Eliminó cliente ${existing.name}`, tableName: "customers", recordId: id },
  });
  return json({ ok: true });
}

export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return [];
}
