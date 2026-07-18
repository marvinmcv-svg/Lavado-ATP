"use client";
// Module 4.4 — Customer CRM: list with tags/visits/spend, detail panel with booking history.
// Task ID 6 — upgraded: create + edit + delete customer actions.
import * as React from "react";
import { MessageCircle, Phone, MapPin, Search, Tag, RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  adminFetch, LoadingBlock, EmptyState, StatusBadge, fmtMoney, fmtDate, fmtDateTime, Spinner,
} from "./_shared";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/whatsapp";
import type { Customer, Booking } from "@/lib/types";

interface CustomerWithBookings extends Customer { bookings: Booking[] }
interface CustomersResponse { customers: CustomerWithBookings[] }

type PropertyType = "residential" | "commercial";

export function Customers() {
  const lang = useLang((s) => s.lang);
  const [customers, setCustomers] = React.useState<CustomerWithBookings[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState<string>("");
  const [selected, setSelected] = React.useState<CustomerWithBookings | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<CustomerWithBookings | null>(null);

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

  const handleDelete = async (c: CustomerWithBookings) => {
    if (!window.confirm(lang === "en" ? `Delete customer "${c.name}"?` : `¿Eliminar cliente "${c.name}"?`)) return;
    setCustomers((prev) => prev.filter((it) => it.id !== c.id));
    try {
      await adminFetch(`/api/admin/customers/${c.id}`, { method: "DELETE" });
      toast.success(lang === "en" ? "Customer deleted" : "Cliente eliminado");
    } catch (e) {
      toast.error(lang === "en" ? "Delete failed" : "Error al eliminar");
      void e;
      void reload();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_customers")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "en" ? "CRM with visit history and spend." : "CRM con historial y gasto."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void reload()}><RefreshCw className="size-4" />{lang === "en" ? "Refresh" : "Actualizar"}</Button>
          <Button size="sm" onClick={() => setCreating(true)}><Plus className="size-4" />{lang === "en" ? "New customer" : "Nuevo cliente"}</Button>
        </div>
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
                  <li key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
                    <button
                      onClick={() => setSelected(c)}
                      className="flex flex-1 items-center gap-3 text-left min-w-0"
                      aria-label={lang === "en" ? `Open ${c.name}` : `Abrir ${c.name}`}
                    >
                      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold uppercase shrink-0">
                        {c.name.slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.phone} {c.email ? `· ${c.email}` : ""}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end shrink-0">
                        {(c.tags ?? []).slice(0, 3).map((tg) => (
                          <Badge key={tg} variant="secondary" className="text-[10px]">{tg}</Badge>
                        ))}
                      </div>
                      <div className="hidden md:flex flex-col items-end text-right ml-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{lang === "en" ? "Visits" : "Visitas"}</span>
                        <span className="text-sm font-semibold tabular-nums">{c.visitCount}</span>
                      </div>
                      <div className="hidden md:flex flex-col items-end text-right ml-3 min-w-[80px] shrink-0">
                        <span className="text-xs text-muted-foreground">{lang === "en" ? "Spend" : "Gasto"}</span>
                        <span className="text-sm font-semibold tabular-nums">{fmtMoney(c.totalSpend, "BOB")}</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(c)} aria-label="edit"><Pencil className="size-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => void handleDelete(c)} aria-label="delete" className="text-destructive hover:text-destructive"><Trash2 className="size-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto scroll-thin">
          {selected ? <CustomerDetail customer={selected} lang={lang} onEdit={() => { setEditing(selected); setSelected(null); }} /> : null}
        </SheetContent>
      </Sheet>

      {/* Create dialog */}
      <CustomerDialog
        open={creating}
        customer={null}
        lang={lang}
        onOpenChange={(o) => setCreating(o)}
        onSaved={() => { setCreating(false); void reload(); }}
      />

      {/* Edit dialog */}
      <CustomerDialog
        open={!!editing}
        customer={editing}
        lang={lang}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        onSaved={() => { setEditing(null); void reload(); }}
      />
    </div>
  );
}

function CustomerDetail({
  customer, lang, onEdit,
}: {
  customer: CustomerWithBookings;
  lang: "es" | "en";
  onEdit: () => void;
}) {
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
          <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="size-4" />{lang === "en" ? "Edit" : "Editar"}</Button>
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

function CustomerDialog({
  open, customer, lang, onOpenChange, onSaved,
}: {
  open: boolean;
  customer: CustomerWithBookings | null;
  lang: "es" | "en";
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = !!customer;
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [propertyType, setPropertyType] = React.useState<PropertyType>("residential");
  const [address, setAddress] = React.useState("");
  const [tagsInput, setTagsInput] = React.useState("");
  const [internalNotes, setInternalNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(customer?.name ?? "");
    setPhone(customer?.phone ?? "");
    setEmail(customer?.email ?? "");
    setPropertyType((customer?.propertyType as PropertyType) ?? "residential");
    setAddress(customer?.address ?? "");
    setTagsInput((customer?.tags ?? []).join(", "));
    setInternalNotes(customer?.internalNotes ?? "");
  }, [open, customer]);

  const onSave = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error(lang === "en" ? "Name and phone required" : "Nombre y teléfono requeridos");
      return;
    }
    setSaving(true);
    try {
      const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const body = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        propertyType,
        address: address.trim() || null,
        tags,
        internalNotes: internalNotes.trim() || null,
      };
      if (isEdit && customer) {
        await adminFetch(`/api/admin/customers/${customer.id}`, { method: "PUT", body: JSON.stringify(body) });
        toast.success(lang === "en" ? "Customer updated" : "Cliente actualizado");
      } else {
        await adminFetch("/api/admin/customers", { method: "POST", body: JSON.stringify(body) });
        toast.success(lang === "en" ? "Customer created" : "Cliente creado");
      }
      onSaved();
    } catch (e) {
      toast.error(lang === "en" ? "Save failed" : "Error al guardar");
      void e;
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? (lang === "en" ? "Edit customer" : "Editar cliente") : (lang === "en" ? "New customer" : "Nuevo cliente")}
          </DialogTitle>
          <DialogDescription>{lang === "en" ? "Contact info, property type, tags." : "Contacto, tipo de propiedad, etiquetas."}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Name" : "Nombre"}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Phone" : "Teléfono"}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+591 7..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Property type" : "Tipo de propiedad"}</Label>
            <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">{lang === "en" ? "Residential" : "Residencial"}</SelectItem>
                <SelectItem value="commercial">{lang === "en" ? "Commercial" : "Comercial"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{lang === "en" ? "Address" : "Dirección"}</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, zona, ciudad" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{lang === "en" ? "Tags (comma-separated)" : "Etiquetas (separadas por coma)"}</Label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="VIP, Recurrente, Equipetrol" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{lang === "en" ? "Internal notes" : "Notas internas"}</Label>
            <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>{lang === "en" ? "Cancel" : "Cancelar"}</Button>
          </DialogClose>
          <Button onClick={() => void onSave()} disabled={saving}>
            {saving ? <Spinner className="mr-2" /> : null}
            {isEdit ? (lang === "en" ? "Save" : "Guardar") : (lang === "en" ? "Create" : "Crear")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
