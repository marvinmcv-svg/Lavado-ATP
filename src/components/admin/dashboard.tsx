"use client";
// Module 4.1 — Dashboard: KPI cards + recent activity + 7-day chart + jobs bar chart + quick actions.
import * as React from "react";
import {
  Eye, MessageCircle, Calculator, CalendarClock, UserPlus, Wrench,
  Plus, ArrowRight, Activity,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Legend,
} from "recharts";
import { useLang, t } from "@/lib/i18n";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch, LoadingBlock, EmptyState, fmtRelative } from "./_shared";
import type { PublicData } from "@/lib/public-data";
import type { AuditLog } from "@/lib/types";

interface DashboardData {
  kpis: {
    pageViewsToday: number;
    whatsappClicksToday: number;
    quotesToday: number;
    bookingsPending: number;
    leadsNew: number;
    activeServices: number;
  };
  recentActivity: AuditLog[];
  bookingsByStatus: { status: string; _count: number }[];
  leadsBySource: { source: string; _count: number }[];
  pageViewsSeries: { date: string; label: string; pageViews: number; whatsapp: number }[];
  topServices: { name: string; count: number }[];
  jobsSeries: { date: string; label: string; jobs: number }[];
}

export function Dashboard({ data }: { data: PublicData }) {
  const lang = useLang((s) => s.lang);
  const [d, setD] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<DashboardData>("/api/admin/dashboard");
      setD(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      toast.error(lang === "en" ? "Failed to load dashboard" : "Error al cargar el panel");
    } finally {
      setLoading(false);
    }
  }, [lang]);

  React.useEffect(() => { void reload(); }, [reload]);

  const kpiCards = [
    { key: t(lang, "admin_kpi_pageviews"), value: d?.kpis.pageViewsToday ?? 0, icon: Eye },
    { key: t(lang, "admin_kpi_whatsapp"), value: d?.kpis.whatsappClicksToday ?? 0, icon: MessageCircle },
    { key: t(lang, "admin_kpi_quotes"), value: d?.kpis.quotesToday ?? 0, icon: Calculator },
    { key: t(lang, "admin_kpi_bookings"), value: d?.kpis.bookingsPending ?? 0, icon: CalendarClock },
    { key: t(lang, "admin_kpi_leads"), value: d?.kpis.leadsNew ?? 0, icon: UserPlus },
    { key: t(lang, "admin_kpi_services"), value: d?.kpis.activeServices ?? 0, icon: Wrench },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_dashboard")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "en" ? "Live snapshot of your business today." : "Resumen en vivo de tu negocio hoy."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void reload()}>
          <Activity className="size-4" />
          {lang === "en" ? "Refresh" : "Actualizar"}
        </Button>
      </div>

      {error ? (
        <Card><CardContent className="p-6 text-sm text-destructive">{error}</CardContent></Card>
      ) : null}

      {/* KPI grid */}
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : kpiCards.map((k) => {
              const Icon = k.icon;
              return (
                <Card key={k.key}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground line-clamp-2">{k.key}</span>
                      <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="size-3.5" />
                      </span>
                    </div>
                    <div className="mt-2 text-3xl font-bold tabular-nums">{k.value}</div>
                  </CardContent>
                </Card>
              );
            })}
      </section>

      {/* Charts row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {lang === "en" ? "Page views & WhatsApp (7 days)" : "Vistas y WhatsApp (7 días)"}
            </CardTitle>
            <CardDescription>
              {lang === "en" ? "Daily trend over the last week." : "Tendencia diaria de la última semana."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={d?.pageViewsSeries ?? []} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="pageViews" name={lang === "en" ? "Views" : "Vistas"} stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {lang === "en" ? "Jobs per day (2 weeks)" : "Trabajos por día (2 semanas)"}
            </CardTitle>
            <CardDescription>
              {lang === "en" ? "Scheduled jobs past 7 days and next 7 days." : "Trabajos pasados y próximos 7 días."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={d?.jobsSeries ?? []} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="jobs" name={lang === "en" ? "Jobs" : "Trabajos"} fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Activity + quick actions */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t(lang, "admin_activity")}</CardTitle>
            <CardDescription>
              {lang === "en" ? "Latest audit log entries." : "Últimas entradas del registro."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingBlock rows={6} />
            ) : (d?.recentActivity?.length ?? 0) === 0 ? (
              <EmptyState title={lang === "en" ? "No activity yet" : "Sin actividad aún"} />
            ) : (
              <ul className="max-h-96 overflow-y-auto scroll-thin divide-y divide-border">
                {(d?.recentActivity ?? []).map((log) => (
                  <li key={log.id} className="flex items-start gap-3 py-3">
                    <span className="mt-1.5 flex size-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{log.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.actorName ?? "—"} · {log.tableName ?? "—"} · {fmtRelative(log.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t(lang, "admin_quickactions")}</CardTitle>
            <CardDescription>
              {lang === "en" ? "Jump to a common task." : "Salta a una tarea común."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <QuickAction
              icon={<Plus className="size-4" />}
              label={t(lang, "admin_add_service")}
              hint={lang === "en" ? "Create a new service offering" : "Crea un nuevo servicio"}
              href="/?admin=1"
            />
            <QuickAction
              icon={<CalendarClock className="size-4" />}
              label={t(lang, "admin_new_booking")}
              hint={lang === "en" ? "Schedule a job" : "Programa un trabajo"}
              href="/?admin=1"
            />
            <QuickAction
              icon={<UserPlus className="size-4" />}
              label={t(lang, "admin_view_leads")}
              hint={lang === "en" ? "Manage the leads kanban" : "Gestiona el kanban de leads"}
              href="/?admin=1"
            />
            <QuickAction
              icon={<Wrench className="size-4" />}
              label={t(lang, "admin_open_editor")}
              hint={lang === "en" ? "Edit hero, announcement, gallery" : "Edita hero, anuncio, galería"}
              href="/?admin=1"
            />
          </CardContent>
        </Card>
      </section>

      {/* top services mini-list (uses seeded data) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {lang === "en" ? "Top services requested (30 days)" : "Servicios más solicitados (30 días)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingBlock rows={4} />
          ) : (d?.topServices?.length ?? 0) === 0 ? (
            <EmptyState title={lang === "en" ? "No quote activity yet" : "Sin cotizaciones aún"} />
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(d?.topServices ?? []).map((s) => (
                <li key={s.name} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <span className="text-sm font-medium truncate">{s.name}</span>
                  <span className="ml-2 text-sm font-bold tabular-nums text-primary">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* data provenance: business name */}
      <p className="text-xs text-muted-foreground text-center">
        {data.business?.name ?? "lavadoatp"} · {lang === "en" ? "Admin portal" : "Portal administrativo"}
      </p>
    </div>
  );
}

function QuickAction({ icon, label, hint, href }: { icon: React.ReactNode; label: string; hint: string; href: string }) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:bg-accent/40"
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>
        <span className="flex flex-col min-w-0">
          <span className="text-sm font-medium leading-tight truncate">{label}</span>
          <span className="text-xs text-muted-foreground truncate">{hint}</span>
        </span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </a>
  );
}
