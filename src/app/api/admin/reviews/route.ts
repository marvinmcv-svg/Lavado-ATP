// GET/POST /api/admin/reviews
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";
import { reviewCreateSchema, validate } from "@/lib/validation";

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
  const raw = await req.json().catch(() => null);
  if (!raw) return json({ error: "invalid_body" }, 400);
  const result = validate(reviewCreateSchema, raw);
  if (!result.success) return json({ error: "validation_error", detail: result.error }, 400);
  const { reviewerName, starRating, reviewText, reviewDate, source, visibleOnSite } = result.data;
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
