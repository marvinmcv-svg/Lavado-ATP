// GET /api/admin/leads
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function GET() {
  const businessId = await getBusinessId();
  if (!businessId) return json({ leads: [] });
  const leads = await db.lead.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
  return json({ leads });
}
