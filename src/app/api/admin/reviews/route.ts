// GET/POST /api/admin/reviews
import { NextRequest } from "next/server";
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

export async function POST(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const body = await req.json();
  const { reviewerName, starRating, reviewText, reviewDate, source, visibleOnSite } = body;
  if (!reviewerName || !reviewText || starRating == null) return json({ error: "missing_fields" }, 400);
  const review = await db.review.create({
    data: {
      businessId,
      reviewerName,
      starRating: Number(starRating),
      reviewText,
      reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
      source: source ?? "manual",
      visibleOnSite: visibleOnSite ?? true,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Agregó reseña de ${reviewerName}`, tableName: "reviews", recordId: review.id },
  });
  return json(review, 201);
}
