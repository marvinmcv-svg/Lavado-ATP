// PUT /api/admin/services/reorder — persist new sort order [{id, sortOrder}]
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function PUT(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const body = (await req.json()) as { id: string; sortOrder: number }[];
  await db.$transaction(
    body.map((item) =>
      db.service.updateMany({
        where: { id: item.id, businessId },
        data: { sortOrder: item.sortOrder },
      }),
    ),
  );
  return json({ ok: true });
}
