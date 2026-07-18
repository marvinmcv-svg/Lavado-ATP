// GET /api/admin/dashboard — live KPIs + recent activity + quick charts
import { db } from "@/lib/db";
import { getBusinessId, json } from "@/lib/api";

export async function GET() {
  const businessId = await getBusinessId();
  if (!businessId) return json({ error: "not_configured" }, 404);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    pageViewsToday,
    whatsappClicksToday,
    quotesToday,
    bookingsPending,
    leadsNew,
    activeServices,
    recentActivity,
    bookingsByStatus,
    leadsBySource,
    pageViews7d,
    whatsappClicks7d,
    topServices,
    jobsPerDay,
  ] = await Promise.all([
    db.analyticsEvent.count({ where: { businessId, eventType: "page_view", createdAt: { gte: startOfToday } } }),
    db.analyticsEvent.count({ where: { businessId, eventType: "whatsapp_click", createdAt: { gte: startOfToday } } }),
    db.analyticsEvent.count({ where: { businessId, eventType: "quote_calculator_used", createdAt: { gte: startOfToday } } }),
    db.booking.count({ where: { businessId, status: "pending" } }),
    db.lead.count({ where: { businessId, status: "new" } }),
    db.service.count({ where: { businessId, available: true } }),
    db.auditLog.findMany({ where: { businessId }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.booking.groupBy({ by: ["status"], where: { businessId }, _count: true }),
    db.lead.groupBy({ by: ["source"], where: { businessId }, _count: true }),
    db.analyticsEvent.findMany({
      where: { businessId, eventType: "page_view", createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      select: { createdAt: true },
    }),
    db.analyticsEvent.findMany({
      where: { businessId, eventType: "whatsapp_click", createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      select: { createdAt: true, metadata: true },
    }),
    db.analyticsEvent.findMany({
      where: { businessId, eventType: "quote_calculator_used", createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      select: { metadata: true },
    }),
    db.booking.findMany({
      where: { businessId, scheduledAt: { gte: new Date(Date.now() - 6 * 86400000), lte: new Date(Date.now() + 13 * 86400000) } },
      select: { scheduledAt: true, status: true },
    }),
  ]);

  // bucket page views / wa clicks by day for the 7-day chart
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const pageViewsSeries = days7.map((d) => {
    const next = new Date(d.getTime() + 86400000);
    return {
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("es-BO", { weekday: "short", day: "numeric" }),
      pageViews: pageViews7d.filter((e) => e.createdAt >= d && e.createdAt < next).length,
      whatsapp: whatsappClicks7d.filter((e) => e.createdAt >= d && e.createdAt < next).length,
    };
  });

  // top services from quote_calculator_used metadata
  const serviceCount = new Map<string, number>();
  for (const e of topServices) {
    const m = e.metadata as { service?: string } | null;
    const name = m?.service ?? "Desconocido";
    serviceCount.set(name, (serviceCount.get(name) ?? 0) + 1);
  }
  const topServicesArr = Array.from(serviceCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // jobs per day for next 2 weeks
  const jobsSeries = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i - 6);
    const next = new Date(d.getTime() + 86400000);
    return {
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("es-BO", { day: "numeric", month: "short" }),
      jobs: jobsPerDay.filter((b) => b.scheduledAt >= d && b.scheduledAt < next).length,
    };
  });

  return json({
    kpis: {
      pageViewsToday,
      whatsappClicksToday,
      quotesToday,
      bookingsPending,
      leadsNew,
      activeServices,
    },
    recentActivity,
    bookingsByStatus,
    leadsBySource,
    pageViewsSeries,
    topServices: topServicesArr,
    jobsSeries,
  });
}
