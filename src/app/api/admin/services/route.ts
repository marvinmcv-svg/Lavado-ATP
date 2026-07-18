// GET/POST /api/admin/services  — list all (incl. unavailable) / create
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

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
  const body = await req.json();
  const { categoryId, nameEs, nameEn, descriptionEs, descriptionEn, priceType, price, currency, available, sortOrder, beforePhotoUrl, afterPhotoUrl } = body;
  if (!categoryId || !nameEs || !nameEn) return json({ error: "missing_fields" }, 400);
  const svc = await db.service.create({
    data: {
      businessId,
      categoryId,
      nameEs,
      nameEn,
      descriptionEs: descriptionEs ?? "",
      descriptionEn: descriptionEn ?? "",
      priceType: priceType ?? "starting_at",
      price: typeof price === "number" ? price : null,
      currency: currency ?? "BOB",
      available: available ?? true,
      sortOrder: sortOrder ?? 0,
      beforePhotoUrl: beforePhotoUrl ?? null,
      afterPhotoUrl: afterPhotoUrl ?? null,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Creó servicio "${nameEs}"`, tableName: "services", recordId: svc.id },
  });
  return json(svc, 201);
}
