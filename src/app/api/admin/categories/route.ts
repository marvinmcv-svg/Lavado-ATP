// GET/POST /api/admin/categories
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";
import { categoryCreateSchema, validate } from "@/lib/validation";

export async function GET() {
  const businessId = await getBusinessId();
  if (!businessId) return json({ categories: [] });
  const categories = await db.serviceCategory.findMany({
    where: { businessId },
    orderBy: { sortOrder: "asc" },
  });
  return json({ categories });
}

export async function POST(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const raw = await req.json().catch(() => null);
  if (!raw) return json({ error: "invalid_body" }, 400);
  const result = validate(categoryCreateSchema, raw);
  if (!result.success) return json({ error: "validation_error", detail: result.error }, 400);
  const { nameEs, nameEn, sortOrder, active } = result.data;
  const cat = await db.serviceCategory.create({
    data: { businessId, nameEs, nameEn, sortOrder: sortOrder ?? 0, active: active ?? true },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Creó categoría ${nameEs}`, tableName: "service_categories", recordId: cat.id },
  });
  return json(cat, 201);
}
