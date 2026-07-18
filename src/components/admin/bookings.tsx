"use client";
// Module 4.3 — Bookings: date-grouped list with status badges, crew dropdown, WhatsApp confirm.
import * as React from "react";
import {
  CalendarDays, Plus, MessageCircle, ChevronLeft, ChevronRight, RefreshCw,
} from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  adminFetch, LoadingBlock, EmptyState, StatusBadge, fmtMoney, Spinner,
} from "./_shared";
import { buildWhatsAppUrl, normalizePhone, bookingConfirmMessage } from "@/lib/whatsapp";
import type { PublicData } from "@/lib/public-data";
import type { Booking, BookingStatus, Service, StaffMember } from "@/lib/types";

interface BookingsResponse { bookings: Booking[] }
interface SettingsResponse { business: { phone: string | null }; staff: StaffMember[] }

const STATUS_FLOW: BookingStatus[] = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

function nextStatus(s: BookingStatus): BookingStatus | null {
  const i = STATUS_FLOW.indexOf(s);
  if (i === -1 || i >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1];
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  // Monday as start
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function Bookings({ data }: { data: PublicData }) {
  const lang = useLang((s) => s.lang);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [weekStart, setWeekStart] = React.useState<Date>(() => startOfWeek(new Date()));
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [filter, setFilter] = React.useState<BookingStatus | "all">("all");

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const from = isoDate(weekStart);
      const to = isoDate(addDays(weekStart, 7));
      const [bk, sv, st] = await Promise.all([
        adminFetch<BookingsResponse>(`/api/admin/bookings?from=${from}&to=${to}`),
        adminFetch<{ services: Service[] }>("/api/admin/services"),
        adminFetch<SettingsResponse>("/api/admin/settings"),
      ]);
      setBookings(bk.bookings);
      setServices(sv.services ?? []);
      setStaff(st.staff ?? []);
    } catch (e) {
      toast.error(lang === "en" ? "Failed to load bookings" : "Error al cargar reservas");
      void e;
    } finally {
      setLoading(false);
    }
  }, [weekStart, lang]);

  React.useEffect(() => { void reload(); }, [reload]);

  // group by date
  const byDate = React.useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = isoDate(new Date(b.scheduledAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    for (const list of map.values()) list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    return map;
  }, [bookings]);

  const filtered = (list: Booking[]) => filter === "all" ? list : list.filter((b) => b.status === filter);

  const updateBooking = async (id: string, patch: Partial<Booking>, msg?: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    try {
      await adminFetch(`/api/admin/bookings/${id}`, { method: "PUT", body: JSON.stringify(patch) });
      if (msg) toast.success(msg);
    } catch {
      toast.error(lang === "en" ? "Update failed" : "Error al actualizar");
      void reload();
    }
  };

  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${weekStart.toLocaleDateString("es-BO", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("es-BO", { day: "numeric", month: "short" })}`;
  const todayKey = isoDate(new Date());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_bookings")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "en" ? "Week grid view with status workflow." : "Vista semanal con flujo de estados."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void reload()}><RefreshCw className="size-4" />{lang === "en" ? "Refresh" : "Actualizar"}</Button>
          <Button size="sm" onClick={() => setCreating(true)}><Plus className="size-4" />{t(lang, "admin_new_booking")}</Button>
        </div>
      </div>

      {/* Week nav + status filter */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="prev"><ChevronLeft className="size-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>{lang === "en" ? "Today" : "Hoy"}</Button>
            <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="next"><ChevronRight className="size-4" /></Button>
            <span className="ml-2 text-sm font-semibold">{weekLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">{lang === "en" ? "Filter" : "Filtro"}</Label>
            <Select value={filter} onValueChange={(v) => setFilter(v as BookingStatus | "all")}>
              <SelectTrigger className="h-8 w-40" size="sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "en" ? "All" : "Todos"}</SelectItem>
                {STATUS_FLOW.map((s) => (
                  <SelectItem key={s} value={s}>{lang === "en" ? s.replace("_", " ") : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent><LoadingBlock rows={6} /></CardContent></Card>
      ) : bookings.length === 0 ? (
        <Card><CardContent><EmptyState title={lang === "en" ? "No bookings this week" : "Sin reservas esta semana"} hint={lang === "en" ? "Try another week or create one." : "Prueba otra semana o crea una."} /></CardContent></Card>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = addDays(weekStart, i);
            const key = isoDate(d);
            const list = filtered(byDate.get(key) ?? []);
            if (list.length === 0) return null;
            const isToday = key === todayKey;
            return (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarDays className="size-4 text-primary" />
                    <span>{d.toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "short" })}</span>
                    {isToday ? <Badge variant="default" className="text-[10px]">{lang === "en" ? "Today" : "Hoy"}</Badge> : null}
                    <Badge variant="secondary" className="text-[10px]">{list.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="flex flex-col gap-2">
                    {list.map((b) => (
                      <BookingRow
                        key={b.id}
                        booking={b}
                        services={services}
                        staff={staff}
                        lang={lang}
                        onUpdate={(patch, msg) => void updateBooking(b.id, patch, msg)}
                      />
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NewBookingDialog
        open={creating}
        lang={lang}
        services={services}
        defaultDate={weekStart}
        onOpenChange={(o) => setCreating(o)}
        onCreated={() => { setCreating(false); void reload(); }}
      />
    </div>
  );
}

function BookingRow({
  booking, services, staff, lang, onUpdate,
}: {
  booking: Booking;
  services: Service[];
  staff: StaffMember[];
  lang: "es" | "en";
  onUpdate: (patch: Partial<Booking>, msg?: string) => void;
}) {
  const svc = booking.service ?? services.find((s) => s.id === booking.serviceId) ?? null;
  const svcName = svc ? (lang === "en" ? svc.nameEn : svc.nameEs) : (lang === "en" ? "General" : "General");
  const time = new Date(booking.scheduledAt).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
  const next = nextStatus(booking.status);
  const crewOptions = staff.filter((s) => s.active);

  const waUrl = (() => {
    const phone = booking.customerPhone;
    if (!phone) return "#";
    const d = new Date(booking.scheduledAt);
    return buildWhatsAppUrl(
      normalizePhone(phone),
      bookingConfirmMessage({
        name: booking.customerName,
        service: svcName,
        date: d.toLocaleDateString("es-BO", { day: "2-digit", month: "short" }),
        time: d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" }),
        lang,
      }),
    );
  })();

  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-sm font-bold tabular-nums text-primary">{time}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{booking.customerName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {svcName} · {booking.propertyAddress || (lang === "en" ? "No address" : "Sin dirección")}
            {booking.zone ? ` · ${booking.zone}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={booking.status} lang={lang} />
        {booking.quotedAmount != null ? (
          <Badge variant="outline" className="text-[10px]">{fmtMoney(booking.quotedAmount, "BOB")}</Badge>
        ) : null}
        <Select
          value={booking.crewAssigned ?? "__none__"}
          onValueChange={(v) => onUpdate({ crewAssigned: v === "__none__" ? null : v }, lang === "en" ? "Crew updated" : "Equipo actualizado")}
        >
          <SelectTrigger className="h-8 w-32" size="sm">
            <SelectValue placeholder={lang === "en" ? "Crew" : "Equipo"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{lang === "en" ? "Unassigned" : "Sin asignar"}</SelectItem>
            {crewOptions.map((s) => (
              <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {next ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdate({ status: next }, `${lang === "en" ? "Status →" : "Estado →"} ${next}`)}
          >
            {lang === "en" ? `→ ${next.replace("_", " ")}` : `→ ${next.replace("_", " ")}`}
          </Button>
        ) : null}
        <Select
          value={booking.status}
          onValueChange={(v) => onUpdate({ status: v as BookingStatus }, `${lang === "en" ? "Status →" : "Estado →"} ${v}`)}
        >
          <SelectTrigger className="h-8 w-32" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FLOW.map((s) => (
              <SelectItem key={s} value={s}>{lang === "en" ? s.replace("_", " ") : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" asChild>
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" />
            {lang === "en" ? "Confirm" : "Confirmar"}
          </a>
        </Button>
      </div>
    </li>
  );
}

function NewBookingDialog({
  open, lang, services, defaultDate, onOpenChange, onCreated,
}: {
  open: boolean;
  lang: "es" | "en";
  services: Service[];
  defaultDate: Date;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [serviceId, setServiceId] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [crew, setCrew] = React.useState("");
  const [quoted, setQuoted] = React.useState("");
  const [zone, setZone] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(""); setPhone(""); setServiceId(""); setAddress("");
    const d = new Date(defaultDate);
    d.setHours(9, 0, 0, 0);
    setScheduledAt(d.toISOString().slice(0, 16));
    setCrew(""); setQuoted(""); setZone("");
  }, [open, defaultDate]);

  const onSave = async () => {
    if (!name.trim() || !phone.trim() || !scheduledAt) {
      toast.error(lang === "en" ? "Name, phone and date required" : "Nombre, teléfono y fecha requeridos");
      return;
    }
    setSaving(true);
    try {
      await adminFetch("/api/admin/bookings", {
        method: "POST",
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          serviceId: serviceId || null,
          propertyAddress: address.trim(),
          scheduledAt: new Date(scheduledAt).toISOString(),
          crewAssigned: crew || null,
          quotedAmount: quoted.trim() === "" ? null : Number(quoted),
          zone: zone.trim() || null,
        }),
      });
      toast.success(lang === "en" ? "Booking created" : "Reserva creada");
      onCreated();
    } catch (e) {
      toast.error(lang === "en" ? "Create failed" : "Error al crear");
      void e;
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t(lang, "admin_new_booking")}</DialogTitle>
          <DialogDescription>{lang === "en" ? "Schedule a new job." : "Programa un nuevo trabajo."}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Customer name" : "Nombre cliente"}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Phone" : "Teléfono"}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+591 7..." />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{lang === "en" ? "Service" : "Servicio"}</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={lang === "en" ? "Optional" : "Opcional"} /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{lang === "en" ? s.nameEn : s.nameEs}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{lang === "en" ? "Address" : "Dirección"}</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Date & time" : "Fecha y hora"}</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Zone" : "Zona"}</Label>
            <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Equipetrol" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Quoted amount" : "Monto cotizado"}</Label>
            <Input type="number" value={quoted} onChange={(e) => setQuoted(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={saving}>{lang === "en" ? "Cancel" : "Cancelar"}</Button></DialogClose>
          <Button onClick={() => void onSave()} disabled={saving}>
            {saving ? <Spinner className="mr-2" /> : null}
            {lang === "en" ? "Create" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
