// Schema.org JSON-LD — HomeAndConstructionBusiness (Step 3.6).
import type { Business, SiteSettings, Review } from "@/lib/types";

export function SchemaOrg({ business, settings, reviews }: { business: Business; settings: SiteSettings | null; reviews: Review[] }) {
  const hours = business.openingHours as Record<string, { open: string | null; close: string | null }> | null;
  const dayMap: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
  const openingHoursSpec = hours
    ? Object.entries(hours)
        .filter(([, v]) => v?.open && v?.close)
        .map(([day, v]) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: dayMap[day] ?? day,
          opens: v!.open!,
          closes: v!.close!,
        }))
    : [];

  const areaServed =
    business.serviceArea?.mode === "zones" && business.serviceArea.zones
      ? business.serviceArea.zones.map((z) => ({ "@type": "Place", name: z }))
      : business.serviceArea?.mode === "radius"
        ? [{ "@type": "Place", name: `Santa Cruz de la Sierra (within ${business.serviceArea?.radius_km}km)` }]
        : [];

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.starRating, 0) / reviews.length : 0;

  const json = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": "#business",
    name: business.name,
    description: settings?.heroSubheadlineEs ?? "Lavado a presión profesional",
    url: "/",
    telephone: business.phone ?? undefined,
    image: business.logoUrl ?? undefined,
    priceRange: "$$",
    address: business.address
      ? {
          "@type": "PostalAddress",
          streetAddress: business.address,
          addressLocality: "Santa Cruz de la Sierra",
          addressCountry: "BO",
        }
      : undefined,
    geo: business.lat && business.lng ? { "@type": "GeoCoordinates", latitude: business.lat, longitude: business.lng } : undefined,
    areaServed: areaServed.length ? areaServed : undefined,
    openingHoursSpecification: openingHoursSpec.length ? openingHoursSpec : undefined,
    sameAs: business.instagramUrl ? [business.instagramUrl] : undefined,
    aggregateRating: reviews.length
      ? { "@type": "AggregateRating", ratingValue: Math.round(avgRating * 10) / 10, reviewCount: reviews.length }
      : undefined,
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.reviewerName },
      reviewRating: { "@type": "Rating", ratingValue: r.starRating, bestRating: 5 },
      reviewBody: r.reviewText,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
