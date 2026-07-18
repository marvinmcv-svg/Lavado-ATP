"use client";
// Shared helpers and small components used across the admin portal.
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { BookingStatus, LeadStatus, StaffRole } from "@/lib/types";

/** Fetch helper that throws on non-2xx and returns parsed JSON (typed via generic). */
export async function adminFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

/** Format currency BOB. */
export function fmtMoney(value: number | null | undefined, currency = "BOB"): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-BO", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

/** Format ISO date string to short date. */
export function fmtDate(iso: string | Date, opts: Intl.DateTimeFormatOptions = {}): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric", ...opts });
}

/** Format ISO date+time. */
export function fmtDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("es-BO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Relative time-ago in Spanish. */
export function fmtRelative(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `hace ${diffD} d`;
  return fmtDate(d);
}

const BOOKING_STATUS_META: Record<BookingStatus, { labelEs: string; labelEn: string; className: string }> = {
  pending: { labelEs: "Pendiente", labelEn: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  confirmed: { labelEs: "Confirmado", labelEn: "Confirmed", className: "bg-teal-100 text-teal-800 border-teal-200" },
  in_progress: { labelEs: "En progreso", labelEn: "In progress", className: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  completed: { labelEs: "Completado", labelEn: "Completed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { labelEs: "Cancelado", labelEn: "Cancelled", className: "bg-rose-100 text-rose-800 border-rose-200" },
};

export function StatusBadge({ status, lang }: { status: BookingStatus; lang: "es" | "en" }) {
  const meta = BOOKING_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn("font-medium", meta.className)}>
      {lang === "en" ? meta.labelEn : meta.labelEs}
    </Badge>
  );
}

const LEAD_STATUS_META: Record<LeadStatus, { labelEs: string; labelEn: string; className: string }> = {
  new: { labelEs: "Nuevo", labelEn: "New", className: "bg-amber-100 text-amber-800 border-amber-200" },
  contacted: { labelEs: "Contactado", labelEn: "Contacted", className: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  qualified: { labelEs: "Calificado", labelEn: "Qualified", className: "bg-teal-100 text-teal-800 border-teal-200" },
  converted: { labelEs: "Convertido", labelEn: "Converted", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  closed: { labelEs: "Cerrado", labelEn: "Closed", className: "bg-slate-200 text-slate-700 border-slate-300" },
};

export function LeadStatusBadge({ status, lang }: { status: LeadStatus; lang: "es" | "en" }) {
  const meta = LEAD_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn("font-medium", meta.className)}>
      {lang === "en" ? meta.labelEn : meta.labelEs}
    </Badge>
  );
}

export const LEAD_STATUS_FLOW: LeadStatus[] = ["new", "contacted", "qualified", "converted", "closed"];

const STAFF_ROLE_META: Record<StaffRole, { labelEs: string; labelEn: string; className: string }> = {
  owner: { labelEs: "Propietario", labelEn: "Owner", className: "bg-teal-100 text-teal-800 border-teal-200" },
  manager: { labelEs: "Gerente", labelEn: "Manager", className: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  crew: { labelEs: "Equipo", labelEn: "Crew", className: "bg-amber-100 text-amber-800 border-amber-200" },
};

export function RoleBadge({ role, lang }: { role: StaffRole; lang: "es" | "en" }) {
  const meta = STAFF_ROLE_META[role];
  return (
    <Badge variant="outline" className={cn("font-medium", meta.className)}>
      {lang === "en" ? meta.labelEn : meta.labelEs}
    </Badge>
  );
}

export function sourceLabel(source: string, lang: "es" | "en"): string {
  const map: Record<string, { es: string; en: string }> = {
    whatsapp_widget: { es: "WhatsApp", en: "WhatsApp" },
    contact_form: { es: "Formulario", en: "Contact form" },
    quote_calculator: { es: "Cotizador", en: "Quote calculator" },
    direct_call: { es: "Llamada", en: "Direct call" },
  };
  return (map[source]?.[lang] ?? source);
}

/** Inline loading spinner. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
      role="status"
      aria-label="Cargando"
    />
  );
}

/** Card skeleton block for loading states. */
export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

/** Empty state placeholder. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {hint ? <p className="text-xs text-muted-foreground/70">{hint}</p> : null}
    </div>
  );
}

/** Local-state mutation hook with optimistic update + rollback. */
export function useOptimisticList<T extends { id: string }>(initial: T[]) {
  const [items, setItems] = React.useState<T[]>(initial);
  React.useEffect(() => setItems(initial), [initial]);
  const update = React.useCallback((id: string, patch: Partial<T>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);
  const remove = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);
  const replace = React.useCallback((next: T[]) => setItems(next), []);
  return { items, setItems, update, remove, replace };
}

/** Stable id generator (client-only). */
export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
