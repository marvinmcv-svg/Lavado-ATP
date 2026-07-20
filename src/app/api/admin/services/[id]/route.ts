// PUT/DELETE /api/admin/services/[id]
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const body = await req.json();
  const existing = await db.service.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  const updated = await db.service.update({
    where: { id },
    data: {
      nameEs: body.nameEs ?? existing.nameEs,
      nameEn: body.nameEn ?? existing.nameEn,
      descriptionEs: body.descriptionEs ?? existing.descriptionEs,
      descriptionEn: body.descriptionEn ?? existing.descriptionEn,
      priceType: body.priceType ?? existing.priceType,
      price: body.price !== undefined ? body.price : existing.price,
      currency: body.currency ?? existing.currency,
      available: body.available ?? existing.available,
      beforePhotoUrl: body.beforePhotoUrl ?? existing.beforePhotoUrl,
      afterPhotoUrl: body.afterPhotoUrl ?? existing.afterPhotoUrl,
      videoUrl: body.videoUrl ?? existing.videoUrl,
      videoPosterUrl: body.videoPosterUrl ?? existing.videoPosterUrl,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Editó servicio "${updated.nameEs}"`, tableName: "services", recordId: id, newValue: updated as unknown as Prisma.InputJsonValue },
  });
  return json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const existing = await db.service.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  await db.service.delete({ where: { id } });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Eliminó servicio "${existing.nameEs}"`, tableName: "services", recordId: id },
  });
  return json({ ok: true });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
// avoid static optimization warning
export function generateStaticParams() {
  return [];
}
