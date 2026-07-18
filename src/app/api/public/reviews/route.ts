// GET /api/public/reviews — visible reviews, top 5 by rating then date
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function GET() {
  const businessId = await getBusinessId();
  if (!businessId) return json({ reviews: [], average: 0, count: 0 });
  const reviews = await db.review.findMany({
    where: { businessId, visibleOnSite: true },
    orderBy: [{ starRating: "desc" }, { reviewDate: "desc" }],
    take: 6,
  });
  const allVisible = await db.review.findMany({
    where: { businessId, visibleOnSite: true },
    select: { starRating: true },
  });
  const count = allVisible.length;
  const average = count > 0 ? allVisible.reduce((s, r) => s + r.starRating, 0) / count : 0;
  return json({ reviews, average: Math.round(average * 10) / 10, count });
}
