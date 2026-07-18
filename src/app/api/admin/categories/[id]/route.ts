// PUT/DELETE /api/admin/categories/[id]
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const body = await req.json();
  const existing = await db.serviceCategory.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  const updated = await db.serviceCategory.update({
    where: { id },
    data: {
      nameEs: body.nameEs ?? existing.nameEs,
      nameEn: body.nameEn ?? existing.nameEn,
      sortOrder: body.sortOrder ?? existing.sortOrder,
      active: body.active ?? existing.active,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Editó categoría ${existing.nameEs}`, tableName: "service_categories", recordId: id },
  });
  return json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const existing = await db.serviceCategory.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  // check for services in this category
  const count = await db.service.count({ where: { categoryId: id } });
  if (count > 0) return json({ error: "category_not_empty", count }, 409);
  await db.serviceCategory.delete({ where: { id } });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Eliminó categoría ${existing.nameEs}`, tableName: "service_categories", recordId: id },
  });
  return json({ ok: true });
}

export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return [];
}
