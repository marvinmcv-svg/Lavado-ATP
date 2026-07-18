// GET /api/admin/analytics — date-range analytics for the analytics module
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function GET(req: NextRequest) {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);
  const days = Number(req.nextUrl.searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 86400000);

  const [pageViews, whatsappClicks, quotes, serviceViews, leadsByZone, leadsBySource] = await Promise.all([
    db.analyticsEvent.findMany({ where: { businessId, eventType: "page_view", createdAt: { gte: since } }, select: { createdAt: true } }),
    db.analyticsEvent.findMany({ where: { businessId, eventType: "whatsapp_click", createdAt: { gte: since } }, select: { createdAt: true, metadata: true } }),
    db.analyticsEvent.findMany({ where: { businessId, eventType: "quote_calculator_used", createdAt: { gte: since } }, select: { createdAt: true, metadata: true } }),
    db.analyticsEvent.findMany({ where: { businessId, eventType: "service_section_view", createdAt: { gte: since } }, select: { metadata: true } }),
    db.lead.findMany({ where: { businessId }, select: { zone: true, source: true, status: true } }),
    db.lead.groupBy({ by: ["source"], where: { businessId }, _count: true }),
  ]);

  // page-views + whatsapp series by day
  const dayBuckets = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1 - i));
    return d;
  });
  const series = dayBuckets.map((d) => {
    const next = new Date(d.getTime() + 86400000);
    return {
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("es-BO", { day: "numeric", month: "short" }),
      pageViews: pageViews.filter((e) => e.createdAt >= d && e.createdAt < next).length,
      whatsapp: whatsappClicks.filter((e) => e.createdAt >= d && e.createdAt < next).length,
      quotes: quotes.filter((e) => e.createdAt >= d && e.createdAt < next).length,
    };
  });

  // top services from service_section_view + quote_calculator_used
  const svcCount = new Map<string, number>();
  for (const e of serviceViews) {
    const m = e.metadata as { category?: string } | null;
    const name = m?.category ?? "Otro";
    svcCount.set(name, (svcCount.get(name) ?? 0) + 1);
  }
  const topServices = Array.from(svcCount.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  // leads by zone (heatmap-ish)
  const zoneCount = new Map<string, number>();
  for (const l of leadsByZone) {
    const z = l.zone ?? "Sin zona";
    zoneCount.set(z, (zoneCount.get(z) ?? 0) + 1);
  }
  const zones = Array.from(zoneCount.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  // funnel
  const totalPV = pageViews.length;
  const totalQuotes = quotes.length;
  const totalWA = whatsappClicks.length;
  const funnel = [
    { stage: "page_view", value: totalPV, labelEs: "Vistas de página", labelEn: "Page views" },
    { stage: "service_section_view", value: serviceViews.length, labelEs: "Vistas de servicios", labelEn: "Service views" },
    { stage: "quote_calculator_used", value: totalQuotes, labelEs: "Cotizaciones", labelEn: "Quotes" },
    { stage: "whatsapp_click", value: totalWA, labelEs: "Clics WhatsApp", labelEn: "WhatsApp clicks" },
  ];

  const ctr = totalPV > 0 ? Math.round((totalWA / totalPV) * 1000) / 10 : 0;

  return json({ series, topServices, zones, leadsBySource, funnel, ctr, totals: { pageViews: totalPV, whatsapp: totalWA, quotes: totalQuotes } });
}
