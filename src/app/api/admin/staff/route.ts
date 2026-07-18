// GET/POST /api/admin/staff
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function GET() {
  const businessId = await getBusinessId();
  if (!businessId) return json({ staff: [] });
  const staff = await db.staffMember.findMany({ where: { businessId }, orderBy: [{ role: "asc" }, { name: "asc" }] });
  return json({ staff });
}

export async function POST(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const body = await req.json();
  const { name, email, role } = body;
  if (!name || !email || !role) return json({ error: "missing_fields" }, 400);
  const member = await db.staffMember.create({
    data: { businessId, name, email, role, userId: `staff-${Date.now()}`, active: true },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Owner", action: `Invitó a ${name} (${role})`, tableName: "staff_members", recordId: member.id },
  });
  return json(member, 201);
}
