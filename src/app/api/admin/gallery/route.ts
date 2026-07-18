// GET/POST /api/admin/gallery — list all gallery items / add a new one
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function GET() {
  const businessId = await getBusinessId();
  if (!businessId) return json({ items: [] });
  const items = await db.galleryItem.findMany({
    where: { businessId },
    orderBy: [{ isBeforeAfter: "desc" }, { sortOrder: "asc" }],
  });
  return json({ items });
}

export async function POST(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const body = await req.json();
  const { mediaUrl, mediaType, source, isBeforeAfter, pairId, pairRole, captionEs, captionEn, posterUrl, sortOrder, active } = body;
  if (!mediaUrl || !mediaType) return json({ error: "missing_fields" }, 400);
  const item = await db.galleryItem.create({
    data: {
      businessId,
      mediaUrl,
      mediaType,
      source: source ?? "upload",
      isBeforeAfter: isBeforeAfter ?? false,
      pairId: pairId ?? null,
      pairRole: pairRole ?? null,
      captionEs: captionEs ?? null,
      captionEn: captionEn ?? null,
      posterUrl: posterUrl ?? null,
      sortOrder: sortOrder ?? 0,
      active: active ?? true,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Agregó ${mediaType} a galería`, tableName: "gallery_items", recordId: item.id },
  });
  return json(item, 201);
}
