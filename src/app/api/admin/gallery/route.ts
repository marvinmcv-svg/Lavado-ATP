// GET /api/admin/gallery — all gallery items (incl. inactive) for the site editor
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
