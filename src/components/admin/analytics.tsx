"use client";
// Module 4.6 — Analytics: date range, page-views line chart, WhatsApp CTR, top services, funnel, zones.
import * as React from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell,
} from "recharts";
import { BarChart3, TrendingUp, MousePointerClick, Percent, MapPin } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch, sourceLabel } from "./_shared";
import type { LeadSource } from "@/lib/types";

interface AnalyticsData {
  series: { date: string; label: string; pageViews: number; whatsapp: number; quotes: number }[];
  topServices: { name: string; count: number }[];
  zones: { name: string; count: number }[];
  leadsBySource: { source: LeadSource; _count: number }[];
  funnel: { stage: string; value: number; labelEs: string; labelEn: string }[];
  ctr: number;
  totals: { pageViews: number; whatsapp: number; quotes: number };
}

const RANGES = [7, 30, 90] as const;
const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function Analytics() {
  const lang = useLang((s) => s.lang);
  const [days, setDays] = React.useState<number>(30);
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(async (range: number) => {
    setLoading(true);
    try {
      const res = await adminFetch<AnalyticsData>(`/api/admin/analytics?days=${range}`);
      setData(res);
    } catch (e) {
      toast.error(lang === "en" ? "Failed to load analytics" : "Error al cargar analítica");
      void e;
    } finally {
      setLoading(false);
    }
  }, [lang]);

  React.useEffect(() => { void reload(days); }, [days, reload]);

  const funnelData = (data?.funnel ?? []).map((f) => ({
    name: lang === "en" ? f.labelEn : f.labelEs,
    value: f.value,
  }));

  const sourcePie = (data?.leadsBySource ?? []).map((s, i) => ({
    name: sourceLabel(s.source, lang),
    value: s._count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_analytics")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "en" ? "Traffic, conversions and zones." : "Tráfico, conversiones y zonas."}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${days === r ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              {r} {lang === "en" ? "days" : "días"}
            </button>
          ))}
        </div>
      </div>

      {/* Totals + CTR */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiBlock
          icon={<TrendingUp className="size-4" />}
          label={lang === "en" ? "Page views" : "Vistas de página"}
          value={data?.totals.pageViews ?? 0}
          loading={loading}
        />
        <KpiBlock
          icon={<MousePointerClick className="size-4" />}
          label={lang === "en" ? "WhatsApp clicks" : "Clics WhatsApp"}
          value={data?.totals.whatsapp ?? 0}
          loading={loading}
        />
        <KpiBlock
          icon={<BarChart3 className="size-4" />}
          label={lang === "en" ? "Quotes" : "Cotizaciones"}
          value={data?.totals.quotes ?? 0}
          loading={loading}
        />
        <KpiBlock
          icon={<Percent className="size-4" />}
          label={lang === "en" ? "WhatsApp CTR" : "CTR WhatsApp"}
          value={`${data?.ctr ?? 0}%`}
          loading={loading}
        />
      </section>

      {/* Line chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{lang === "en" ? "Page views & WhatsApp (daily)" : "Vistas y WhatsApp (diario)"}</CardTitle>
          <CardDescription>{lang === "en" ? `Last ${days} days.` : `Últimos ${days} días.`}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data?.series ?? []} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="pageViews" name={lang === "en" ? "Views" : "Vistas"} stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="quotes" name={lang === "en" ? "Quotes" : "Cotizaciones"} stroke="var(--chart-3)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top services horizontal bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{lang === "en" ? "Top services" : "Servicios top"}</CardTitle>
            <CardDescription>{lang === "en" ? "By category views." : "Por vistas de categoría."}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (data?.topServices?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{lang === "en" ? "No data" : "Sin datos"}</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data?.topServices ?? []} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={90} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" name={lang === "en" ? "Views" : "Vistas"} fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{lang === "en" ? "Quote-request funnel" : "Embudo de cotizaciones"}</CardTitle>
            <CardDescription>{lang === "en" ? "From page view to WhatsApp." : "De vista a WhatsApp."}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={funnelData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" interval={0} angle={-12} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" name={lang === "en" ? "Count" : "Cantidad"} fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              {lang === "en" ? "Service-area zones" : "Zonas de servicio"}
            </CardTitle>
            <CardDescription>{lang === "en" ? "Leads by zone." : "Leads por zona."}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (data?.zones?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{lang === "en" ? "No data" : "Sin datos"}</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data?.zones ?? []} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" name={lang === "en" ? "Leads" : "Leads"} fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Lead sources pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{lang === "en" ? "Lead sources" : "Fuentes de leads"}</CardTitle>
            <CardDescription>{lang === "en" ? "Distribution by source." : "Distribución por fuente."}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : sourcePie.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{lang === "en" ? "No data" : "Sin datos"}</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={sourcePie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {sourcePie.map((s, i) => (
                      <Cell key={i} fill={s.color ?? PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function KpiBlock({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: number | string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground line-clamp-2">{label}</span>
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-16" />
        ) : (
          <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
