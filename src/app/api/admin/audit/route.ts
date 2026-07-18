// GET /api/admin/audit
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function GET(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ logs: [] });
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "50");
  const logs = await db.auditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return json({ logs });
}
