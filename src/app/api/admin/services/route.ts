// GET/POST /api/admin/services  — list all (incl. unavailable) / create
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";
import { serviceCreateSchema, validate } from "@/lib/validation";

export async function GET() {
  const businessId = await getBusinessId();
  if (!businessId) return json({ categories: [], services: [] });
  const [categories, services] = await Promise.all([
    db.serviceCategory.findMany({ where: { businessId }, orderBy: { sortOrder: "asc" } }),
    db.service.findMany({ where: { businessId }, orderBy: { sortOrder: "asc" } }),
  ]);
  return json({ categories, services });
}

export async function POST(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const raw = await req.json().catch(() => null);
  if (!raw) return json({ error: "invalid_body" }, 400);
  const result = validate(serviceCreateSchema, raw);
  if (!result.success) return json({ error: "validation_error", detail: result.error }, 400);
  const { categoryId, nameEs, nameEn, descriptionEs, descriptionEn, priceType, price, currency, available, sortOrder, beforePhotoUrl, afterPhotoUrl } = result.data;
  // Verify category exists for this business
  const category = await db.serviceCategory.findFirst({ where: { id: categoryId, businessId } });
  if (!category) return json({ error: "category_not_found" }, 400);
  const svc = await db.service.create({
    data: {
      businessId,
      categoryId,
      nameEs,
      nameEn,
      descriptionEs,
      descriptionEn,
      priceType,
      price: typeof price === "number" ? price : null,
      currency,
      available,
      sortOrder,
      beforePhotoUrl: beforePhotoUrl ?? null,
      afterPhotoUrl: afterPhotoUrl ?? null,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Creó servicio "${nameEs}"`, tableName: "services", recordId: svc.id },
  });
  return json(svc, 201);
}
