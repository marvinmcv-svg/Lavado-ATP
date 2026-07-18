"use client";
// Module 4.4 — Customer CRM: list with tags/visits/spend, detail panel with booking history.
import * as React from "react";
import { Users, MessageCircle, Phone, MapPin, Search, Tag, RefreshCw } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  adminFetch, LoadingBlock, EmptyState, StatusBadge, fmtMoney, fmtDate, fmtDateTime,
} from "./_shared";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/whatsapp";
import type { Customer, Booking } from "@/lib/types";

interface CustomerWithBookings extends Customer { bookings: Booking[] }
interface CustomersResponse { customers: CustomerWithBookings[] }

export function Customers() {
  const lang = useLang((s) => s.lang);
  const [customers, setCustomers] = React.useState<CustomerWithBookings[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState<string>("");
  const [selected, setSelected] = React.useState<CustomerWithBookings | null>(null);

  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    for (const c of customers) for (const tg of c.tags ?? []) set.add(tg);
    return Array.from(set).sort();
  }, [customers]);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<CustomersResponse>(`/api/admin/customers${tagFilter ? `?tag=${encodeURIComponent(tagFilter)}` : ""}`);
      setCustomers(res.customers);
    } catch (e) {
      toast.error(lang === "en" ? "Failed to load customers" : "Error al cargar clientes");
      void e;
    } finally {
      setLoading(false);
    }
  }, [tagFilter, lang]);

  React.useEffect(() => { void reload(); }, [reload]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q),
    );
  }, [customers, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_customers")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "en" ? "CRM with visit history and spend." : "CRM con historial y gasto."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void reload()}><RefreshCw className="size-4" />{lang === "en" ? "Refresh" : "Actualizar"}</Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "en" ? "Search name, phone, email…" : "Buscar nombre, teléfono, email…"}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="size-4 text-muted-foreground" />
            <button
              onClick={() => setTagFilter("")}
              className={`rounded-full border px-2.5 py-1 text-xs ${tagFilter === "" ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
            >
              {lang === "en" ? "All" : "Todos"}
            </button>
            {allTags.map((tg) => (
              <button
                key={tg}
                onClick={() => setTagFilter(tg)}
                className={`rounded-full border px-2.5 py-1 text-xs ${tagFilter === tg ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
              >
                {tg}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent><LoadingBlock rows={6} /></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent><EmptyState title={lang === "en" ? "No customers found" : "Sin clientes"} /></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-y-auto scroll-thin">
              <ul className="divide-y divide-border">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelected(c)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
                    >
                      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold uppercase">
                        {c.name.slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.phone} {c.email ? `· ${c.email}` : ""}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
                        {(c.tags ?? []).slice(0, 3).map((tg) => (
                          <Badge key={tg} variant="secondary" className="text-[10px]">{tg}</Badge>
                        ))}
                      </div>
                      <div className="hidden md:flex flex-col items-end text-right ml-2">
                        <span className="text-xs text-muted-foreground">{lang === "en" ? "Visits" : "Visitas"}</span>
                        <span className="text-sm font-semibold tabular-nums">{c.visitCount}</span>
                      </div>
                      <div className="hidden md:flex flex-col items-end text-right ml-3 min-w-[80px]">
                        <span className="text-xs text-muted-foreground">{lang === "en" ? "Spend" : "Gasto"}</span>
                        <span className="text-sm font-semibold tabular-nums">{fmtMoney(c.totalSpend, "BOB")}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto scroll-thin">
          {selected ? <CustomerDetail customer={selected} lang={lang} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CustomerDetail({ customer, lang }: { customer: CustomerWithBookings; lang: "es" | "en" }) {
  const waUrl = buildWhatsAppUrl(normalizePhone(customer.phone), lang === "en" ? "Hi, this is lavadoatp following up." : "Hola, soy de lavadoatp, le doy seguimiento.");
  return (
    <div className="flex flex-col gap-4">
      <SheetHeader>
        <SheetTitle className="text-xl">{customer.name}</SheetTitle>
        <SheetDescription>
          {lang === "en" ? "Customer since" : "Cliente desde"} {fmtDate(customer.createdAt)}
        </SheetDescription>
      </SheetHeader>

      <div className="px-4 flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /><span>{customer.phone}</span></div>
        {customer.email ? <div className="flex items-center gap-2"><MessageCircle className="size-4 text-muted-foreground" /><span className="truncate">{customer.email}</span></div> : null}
        {customer.address ? <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /><span className="truncate">{customer.address}</span></div> : null}
        <div className="flex items-center gap-2 flex-wrap">
          {(customer.tags ?? []).length === 0 ? (
            <span className="text-xs text-muted-foreground">{lang === "en" ? "No tags" : "Sin etiquetas"}</span>
          ) : (customer.tags ?? []).map((tg) => (
            <Badge key={tg} variant="secondary" className="text-[10px]">{tg}</Badge>
          ))}
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">{lang === "en" ? "Visits" : "Visitas"}</p>
            <p className="text-2xl font-bold tabular-nums">{customer.visitCount}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">{lang === "en" ? "Total spend" : "Gasto total"}</p>
            <p className="text-2xl font-bold tabular-nums">{fmtMoney(customer.totalSpend, "BOB")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="default" size="sm" className="flex-1">
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <a href={`tel:${customer.phone}`}><Phone className="size-4" /> {lang === "en" ? "Call" : "Llamar"}</a>
          </Button>
        </div>
        {customer.internalNotes ? (
          <div className="rounded-md bg-muted/40 p-3 text-xs">
            <p className="font-medium mb-1">{lang === "en" ? "Internal notes" : "Notas internas"}</p>
            <p className="text-muted-foreground">{customer.internalNotes}</p>
          </div>
        ) : null}
      </div>

      <Separator />

      <div className="px-4 pb-4">
        <h3 className="text-sm font-semibold mb-2">{lang === "en" ? "Booking history" : "Historial de reservas"}</h3>
        {customer.bookings.length === 0 ? (
          <EmptyState title={lang === "en" ? "No bookings yet" : "Sin reservas aún"} />
        ) : (
          <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto scroll-thin">
            {customer.bookings.map((b) => (
              <li key={b.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{fmtDateTime(b.scheduledAt)}</span>
                  <StatusBadge status={b.status} lang={lang} />
                </div>
                {b.quotedAmount != null ? (
                  <p className="text-xs text-muted-foreground mt-1">{fmtMoney(b.quotedAmount, "BOB")}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
