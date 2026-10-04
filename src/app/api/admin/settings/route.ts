// GET/PUT /api/admin/settings — business + site settings (owner-configurable)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusiness, getBusinessId, json } from "@/lib/api";

export async function GET() {
  const business = await getBusiness();
  if (!business) return json({ error: "not_configured" }, 404);
  const settings = await db.siteSettings.findUnique({ where: { businessId: business.id } });
  const staff = await db.staffMember.findMany({ where: { businessId: business.id }, orderBy: { role: "asc" } });
  return json({ business, settings, staff });
}

export async function PUT(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const body = await req.json();
  const { business, settings } = body as {
    business?: Record<string, unknown>;
    settings?: Record<string, unknown>;
  };

  if (business) {
    await db.business.update({
      where: { id: businessId },
      data: {
        phone: business.phone ?? undefined,
        address: business.address ?? undefined,
        serviceArea: business.serviceArea ?? undefined,
        openingHours: business.openingHours ?? undefined,
        languages: business.languages ?? undefined,
        timezone: business.timezone ?? undefined,
        currency: business.currency ?? undefined,
        googleMapsUrl: business.googleMapsUrl ?? undefined,
      } as never,
    });
  }
  if (settings) {
    await db.siteSettings.update({
      where: { businessId },
      data: {
        heroHeadlineEs: settings.heroHeadlineEs ?? undefined,
        heroHeadlineEn: settings.heroHeadlineEn ?? undefined,
        heroSubheadlineEs: settings.heroSubheadlineEs ?? undefined,
        heroSubheadlineEn: settings.heroSubheadlineEn ?? undefined,
        heroImageUrl: settings.heroImageUrl === "" ? null : (settings.heroImageUrl ?? undefined),
        heroVideoUrl: settings.heroVideoUrl === "" ? null : (settings.heroVideoUrl ?? undefined),
        heroVideoPosterUrl: settings.heroVideoPosterUrl === "" ? null : (settings.heroVideoPosterUrl ?? undefined),
        ctaTextEs: settings.ctaTextEs ?? undefined,
        ctaTextEn: settings.ctaTextEn ?? undefined,
        announcementBarTextEs: settings.announcementBarTextEs ?? undefined,
        announcementBarTextEn: settings.announcementBarTextEn ?? undefined,
        announcementBarActive: settings.announcementBarActive ?? undefined,
        whatsappGreetingEs: settings.whatsappGreetingEs ?? undefined,
        whatsappGreetingEn: settings.whatsappGreetingEn ?? undefined,
        quoteCalculatorConfig: settings.quoteCalculatorConfig ?? undefined,
        gaTrackingId: settings.gaTrackingId ?? undefined,
        metaPixelId: settings.metaPixelId ?? undefined,
      } as never,
    });
  }
  await db.auditLog.create({
    data: { businessId, actorName: "Admin", action: "Actualizó configuración del sitio", tableName: "site_settings" },
  });
  return json({ ok: true });
}
