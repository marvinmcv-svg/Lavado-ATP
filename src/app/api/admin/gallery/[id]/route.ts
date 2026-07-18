// PUT/DELETE /api/admin/gallery/[id]
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const body = await req.json();
  const existing = await db.galleryItem.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  const updated = await db.galleryItem.update({
    where: { id },
    data: {
      mediaUrl: body.mediaUrl ?? existing.mediaUrl,
      mediaType: body.mediaType ?? existing.mediaType,
      captionEs: body.captionEs !== undefined ? body.captionEs : existing.captionEs,
      captionEn: body.captionEn !== undefined ? body.captionEn : existing.captionEn,
      posterUrl: body.posterUrl !== undefined ? body.posterUrl : existing.posterUrl,
      isBeforeAfter: body.isBeforeAfter ?? existing.isBeforeAfter,
      pairId: body.pairId !== undefined ? body.pairId : existing.pairId,
      pairRole: body.pairRole !== undefined ? body.pairRole : existing.pairRole,
      sortOrder: body.sortOrder ?? existing.sortOrder,
      active: body.active ?? existing.active,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Editó item de galería`, tableName: "gallery_items", recordId: id },
  });
  return json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const existing = await db.galleryItem.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  await db.galleryItem.delete({ where: { id } });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Eliminó item de galería`, tableName: "gallery_items", recordId: id },
  });
  return json({ ok: true });
}

export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return [];
}
