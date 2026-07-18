// PUT /api/admin/reviews/[id] — toggle visible, flag, reply draft
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const { id } = await params;
  const body = await req.json();
  const existing = await db.review.findFirst({ where: { id, businessId } });
  if (!existing) return json({ error: "not_found" }, 404);
  const updated = await db.review.update({
    where: { id },
    data: {
      visibleOnSite: body.visibleOnSite ?? existing.visibleOnSite,
      flagged: body.flagged ?? existing.flagged,
      replyDraft: body.replyDraft !== undefined ? body.replyDraft : existing.replyDraft,
    },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: `Editó reseña de ${existing.reviewerName}`, tableName: "reviews", recordId: id },
  });
  return json(updated);
}

export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return [];
}
