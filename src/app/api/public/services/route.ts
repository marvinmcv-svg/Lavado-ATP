// GET /api/public/services — categories + available services, ordered
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function GET() {
  const businessId = await getBusinessId();
  if (!businessId) return json({ categories: [], services: [] });
  const [categories, services] = await Promise.all([
    db.serviceCategory.findMany({
      where: { businessId, active: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.service.findMany({
      where: { businessId, available: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  return json({ categories, services });
}
