// GET /api/public/gallery — grouped gallery: beforeAfterPairs, general, reels
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function GET() {
  const businessId = await getBusinessId();
  if (!businessId) return json({ pairs: [], general: [], reels: [] });
  const items = await db.galleryItem.findMany({
    where: { businessId, active: true },
    orderBy: { sortOrder: "asc" },
  });

  // group before/after by pairId, ensure each pair has before+after
  const pairMap = new Map<string, { before?: typeof items[number]; after?: typeof items[number] }>();
  for (const it of items) {
    if (!it.isBeforeAfter || !it.pairId) continue;
    const p = pairMap.get(it.pairId) ?? {};
    if (it.pairRole === "before") p.before = it;
    if (it.pairRole === "after") p.after = it;
    pairMap.set(it.pairId, p);
  }
  const pairs = Array.from(pairMap.entries())
    .filter(([, p]) => p.before && p.after)
    .map(([pairId, p]) => ({ pairId, before: p.before!, after: p.after! }));

  const general = items.filter((i) => !i.isBeforeAfter && i.mediaType === "photo");
  const reels = items.filter((i) => !i.isBeforeAfter && i.mediaType === "video");

  return json({ pairs, general, reels });
}
