// GET /api/public/business — public-safe business + site settings
import { NextRequest } from "next/server";
import { getPublicBusinessPayload, json } from "@/lib/api";

export async function GET(req: NextRequest) {
  const payload = await getPublicBusinessPayload();
  if (!payload) return json({ error: "not_configured" }, 404);
  return json(payload);
}
