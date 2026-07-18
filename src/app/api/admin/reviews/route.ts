// GET /api/admin/reviews
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function GET() {
  const businessId = await getBusinessId();
  if (!businessId) return json({ reviews: [] });
  const reviews = await db.review.findMany({
    where: { businessId },
    orderBy: { reviewDate: "desc" },
  });
  return json({ reviews });
}
