// Server-side data fetcher for the public page (direct Prisma queries).
import { db } from "@/lib/db";
import type {
  Business, SiteSettings, ServiceCategory, Service,
  BeforeAfterPair, GalleryItem, Review,
} from "@/lib/types";

export interface PublicData {
  business: Business | null;
  settings: SiteSettings | null;
  categories: ServiceCategory[];
  services: Service[];
  pairs: BeforeAfterPair[];
  generalGallery: GalleryItem[];
  reels: GalleryItem[];
  reviews: Review[];
  reviewAverage: number;
}

export async function getPublicData(): Promise<PublicData> {
  const business = await db.business.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!business) {
    return { business: null, settings: null, categories: [], services: [], pairs: [], generalGallery: [], reels: [], reviews: [], reviewAverage: 0 };
  }
  const [settings, categories, services, galleryItems, reviews] = await Promise.all([
    db.siteSettings.findUnique({ where: { businessId: business.id } }),
    db.serviceCategory.findMany({ where: { businessId: business.id, active: true }, orderBy: { sortOrder: "asc" } }),
    db.service.findMany({ where: { businessId: business.id, available: true }, orderBy: { sortOrder: "asc" } }),
    db.galleryItem.findMany({ where: { businessId: business.id, active: true }, orderBy: { sortOrder: "asc" } }),
    db.review.findMany({ where: { businessId: business.id, visibleOnSite: true }, orderBy: [{ starRating: "desc" }, { reviewDate: "desc" }] }),
  ]);

  // group before/after by pairId
  const pairMap = new Map<string, { before?: GalleryItem; after?: GalleryItem }>();
  for (const it of galleryItems) {
    if (!it.isBeforeAfter || !it.pairId) continue;
    const p = pairMap.get(it.pairId) ?? {};
    if (it.pairRole === "before") p.before = it as unknown as GalleryItem;
    if (it.pairRole === "after") p.after = it as unknown as GalleryItem;
    pairMap.set(it.pairId, p);
  }
  const pairs: BeforeAfterPair[] = Array.from(pairMap.entries())
    .filter(([, p]) => p.before && p.after)
    .map(([pairId, p]) => ({ pairId, before: p.before!, after: p.after! }));

  const generalGallery = galleryItems.filter((i) => !i.isBeforeAfter && i.mediaType === "photo") as unknown as GalleryItem[];
  const reels = galleryItems.filter((i) => !i.isBeforeAfter && i.mediaType === "video") as unknown as GalleryItem[];

  const count = reviews.length;
  const reviewAverage = count > 0 ? reviews.reduce((s, r) => s + r.starRating, 0) / count : 0;

  return {
    business: business as unknown as Business,
    settings: settings as unknown as SiteSettings | null,
    categories: categories as unknown as ServiceCategory[],
    services: services as unknown as Service[],
    pairs,
    generalGallery,
    reels,
    reviews: reviews as unknown as Review[],
    reviewAverage: Math.round(reviewAverage * 10) / 10,
  };
}
