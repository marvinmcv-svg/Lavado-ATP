// GET/POST /api/admin/staff
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";
import { staffCreateSchema, validate } from "@/lib/validation";

export async function GET() {
  const businessId = await getBusinessId();
  if (!businessId) return json({ staff: [] });
  const staff = await db.staffMember.findMany({ where: { businessId }, orderBy: [{ role: "asc" }, { name: "asc" }] });
  return json({ staff });
}

export async function POST(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const raw = await req.json().catch(() => null);
  if (!raw) return json({ error: "invalid_body" }, 400);
  const result = validate(staffCreateSchema, raw);
  if (!result.success) return json({ error: "validation_error", detail: result.error }, 400);
  const { name, email, role } = result.data;
  const member = await db.staffMember.create({
    data: { businessId, name, email, role, userId: `staff-${Date.now()}`, active: true },
  });
  await db.auditLog.create({
    data: { businessId, actorName: "Owner", action: `Invitó a ${name} (${role})`, tableName: "staff_members", recordId: member.id },
  });
  return json(member, 201);
}
