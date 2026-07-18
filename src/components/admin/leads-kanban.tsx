"use client";
// Module 4.5 — Leads Kanban: 5 columns, dnd-kit between columns, source pie chart, slide-over detail.
import * as React from "react";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors, useDraggable,
  useDroppable, closestCorners, type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { MessageCircle, RefreshCw, X, KanbanSquare } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  adminFetch, LoadingBlock, EmptyState, LeadStatusBadge, LEAD_STATUS_FLOW, sourceLabel, fmtRelative, Spinner,
} from "./_shared";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/whatsapp";
import type { Lead, LeadStatus, LeadSource, StaffMember } from "@/lib/types";

interface LeadsResponse { leads: Lead[] }
interface SettingsResponse { staff: StaffMember[] }

const COLUMN_COLORS: Record<LeadStatus, string> = {
  new: "var(--chart-2)",
  contacted: "var(--chart-3)",
  qualified: "var(--chart-1)",
  converted: "var(--chart-4)",
  closed: "var(--chart-5)",
};

const COLUMN_META: Record<LeadStatus, { es: string; en: string }> = {
  new: { es: "Nuevo", en: "New" },
  contacted: { es: "Contactado", en: "Contacted" },
  qualified: { es: "Calificado", en: "Qualified" },
  converted: { es: "Convertido", en: "Converted" },
  closed: { es: "Cerrado", en: "Closed" },
};

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function LeadsKanban() {
  const lang = useLang((s) => s.lang);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Lead | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const [lr, sr] = await Promise.all([
        adminFetch<LeadsResponse>("/api/admin/leads"),
        adminFetch<SettingsResponse>("/api/admin/settings"),
      ]);
      setLeads(lr.leads);
      setStaff(sr.staff ?? []);
    } catch (e) {
      toast.error(lang === "en" ? "Failed to load leads" : "Error al cargar leads");
      void e;
    } finally {
      setLoading(false);
    }
  }, [lang]);

  React.useEffect(() => { void reload(); }, [reload]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byStatus = React.useMemo(() => {
    const m: Record<LeadStatus, Lead[]> = { new: [], contacted: [], qualified: [], converted: [], closed: [] };
    for (const l of leads) m[l.status]?.push(l);
    for (const list of Object.values(m)) list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return m;
  }, [leads]);

  const sourcePie = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const l of leads) m.set(l.source, (m.get(l.source) ?? 0) + 1);
    return Array.from(m.entries()).map(([source, count]) => ({ name: sourceLabel(source, lang), value: count, source }));
  }, [leads, lang]);

  const activeLead = activeId ? leads.find((l) => l.id === activeId) ?? null : null;

  const onDragStart = (e: DragStartEvent) => { setActiveId(String(e.active.id)); };
  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const leadId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const target = LEAD_STATUS_FLOW.find((s) => s === overId);
    if (!target) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === target) return;
    // optimistic
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: target } : l)));
    try {
      await adminFetch(`/api/admin/leads/${leadId}`, { method: "PUT", body: JSON.stringify({ status: target }) });
      toast.success(`${lang === "en" ? "Moved to" : "Movido a"} ${COLUMN_META[target][lang]}`);
    } catch {
      toast.error(lang === "en" ? "Move failed" : "Error al mover");
      void reload();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_leads")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "en" ? "Drag leads between columns." : "Arrastra leads entre columnas."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void reload()}><RefreshCw className="size-4" />{lang === "en" ? "Refresh" : "Actualizar"}</Button>
      </div>

      {/* source pie */}
      {sourcePie.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{lang === "en" ? "Lead sources" : "Fuentes de leads"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourcePie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {sourcePie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <Card><CardContent><LoadingBlock rows={6} /></CardContent></Card>
      ) : leads.length === 0 ? (
        <Card><CardContent><EmptyState title={lang === "en" ? "No leads yet" : "Sin leads aún"} /></CardContent></Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={(e) => void onDragEnd(e)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {LEAD_STATUS_FLOW.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                lang={lang}
                leads={byStatus[status]}
                onCardClick={(l) => setSelected(l)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLead ? (
              <LeadCard lead={activeLead} lang={lang} dragging onClick={() => {}} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <LeadDetailSheet
        lead={selected}
        lang={lang}
        staff={staff}
        onOpenChange={(o) => { if (!o) setSelected(null); }}
        onUpdated={(patch) => {
          if (!selected) return;
          setLeads((prev) => prev.map((l) => (l.id === selected.id ? { ...l, ...patch } : l)));
          setSelected((prev) => (prev ? { ...prev, ...patch } : prev));
        }}
      />
    </div>
  );
}

function KanbanColumn({
  status, lang, leads, onCardClick,
}: {
  status: LeadStatus;
  lang: "es" | "en";
  leads: Lead[];
  onCardClick: (l: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border border-border bg-muted/30 ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: COLUMN_COLORS[status] }} />
          <span className="text-sm font-semibold">{COLUMN_META[status][lang]}</span>
        </div>
        <Badge variant="secondary" className="text-[10px]">{leads.length}</Badge>
      </div>
      <div className="flex flex-col gap-2 p-2 max-h-[60vh] overflow-y-auto scroll-thin min-h-[100px]">
        {leads.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
            {lang === "en" ? "Drop leads here" : "Suelta leads aquí"}
          </div>
        ) : (
          leads.map((l) => (
            <DraggableLeadCard key={l.id} lead={l} lang={lang} onClick={() => onCardClick(l)} />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableLeadCard({ lead, lang, onClick }: { lead: Lead; lang: "es" | "en"; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} lang={lang} onClick={onClick} />
    </div>
  );
}

function LeadCard({
  lead, lang, dragging, onClick,
}: {
  lead: Lead;
  lang: "es" | "en";
  dragging?: boolean;
  onClick: () => void;
}) {
  const name = lead.name ?? lead.phone ?? (lang === "en" ? "Anonymous" : "Anónimo");
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border border-border bg-background p-2.5 shadow-sm hover:shadow-md transition-shadow ${dragging ? "cursor-grabbing shadow-lg" : "cursor-pointer"}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm font-semibold truncate">{name}</span>
        <Badge variant="outline" className="text-[9px] shrink-0">{sourceLabel(lead.source, lang)}</Badge>
      </div>
      {lead.message ? (
        <p className="text-xs text-muted-foreground line-clamp-2">{lead.message}</p>
      ) : null}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground">{fmtRelative(lead.createdAt)}</span>
        {lead.assignedTo ? <span className="text-[10px] text-primary">· {lead.assignedTo}</span> : null}
      </div>
    </button>
  );
}

function LeadDetailSheet({
  lead, lang, staff, onOpenChange, onUpdated,
}: {
  lead: Lead | null;
  lang: "es" | "en";
  staff: StaffMember[];
  onOpenChange: (o: boolean) => void;
  onUpdated: (patch: Partial<Lead>) => void;
}) {
  const [reply, setReply] = React.useState("");
  const [savingStatus, setSavingStatus] = React.useState(false);

  React.useEffect(() => {
    if (!lead) return;
    setReply(lead.message ?? "");
  }, [lead]);

  if (!lead) {
    return (
      <Sheet open={false} onOpenChange={onOpenChange}>
        <SheetContent side="right" />
      </Sheet>
    );
  }

  const waUrl = lead.phone
    ? buildWhatsAppUrl(normalizePhone(lead.phone), reply || (lang === "en" ? "Hi, this is lavadoatp." : "Hola, soy de lavadoatp."))
    : "#";

  const setStatus = async (status: LeadStatus) => {
    setSavingStatus(true);
    onUpdated({ status });
    try {
      await adminFetch(`/api/admin/leads/${lead.id}`, { method: "PUT", body: JSON.stringify({ status }) });
      toast.success(`${lang === "en" ? "Status →" : "Estado →"} ${status}`);
    } catch {
      toast.error(lang === "en" ? "Update failed" : "Error al actualizar");
    } finally {
      setSavingStatus(false);
    }
  };

  const setAssigned = async (assignedTo: string | null) => {
    onUpdated({ assignedTo });
    try {
      await adminFetch(`/api/admin/leads/${lead.id}`, { method: "PUT", body: JSON.stringify({ assignedTo }) });
      toast.success(lang === "en" ? "Assigned" : "Asignado");
    } catch {
      toast.error(lang === "en" ? "Assign failed" : "Error al asignar");
    }
  };

  return (
    <Sheet open={!!lead} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto scroll-thin">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <KanbanSquare className="size-4 text-primary" />
            {lead.name ?? lead.phone ?? (lang === "en" ? "Lead" : "Lead")}
          </SheetTitle>
          <SheetDescription>
            {sourceLabel(lead.source, lang)} · {fmtRelative(lead.createdAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 flex flex-col gap-4 text-sm">
          <div className="flex items-center gap-2">
            <LeadStatusBadge status={lead.status} lang={lang} />
          </div>

          <div className="grid grid-cols-1 gap-2">
            {lead.phone ? <div><span className="text-xs text-muted-foreground">{lang === "en" ? "Phone" : "Teléfono"}</span><p className="font-medium">{lead.phone}</p></div> : null}
            {lead.email ? <div><span className="text-xs text-muted-foreground">Email</span><p className="font-medium truncate">{lead.email}</p></div> : null}
            {lead.zone ? <div><span className="text-xs text-muted-foreground">{lang === "en" ? "Zone" : "Zona"}</span><p className="font-medium">{lead.zone}</p></div> : null}
            {lead.serviceType ? <div><span className="text-xs text-muted-foreground">{lang === "en" ? "Service" : "Servicio"}</span><p className="font-medium">{lead.serviceType}</p></div> : null}
            {lead.propertySize ? <div><span className="text-xs text-muted-foreground">{lang === "en" ? "Property size" : "Tamaño"}</span><p className="font-medium">{lead.propertySize}</p></div> : null}
          </div>

          {lead.message ? (
            <div className="rounded-md bg-muted/40 p-3 text-xs">
              <p className="font-medium mb-1">{lang === "en" ? "Message" : "Mensaje"}</p>
              <p className="text-muted-foreground">{lead.message}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "WhatsApp reply" : "Respuesta WhatsApp"}</Label>
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} />
            <Button asChild disabled={!lead.phone}>
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" /> {lang === "en" ? "Send on WhatsApp" : "Enviar por WhatsApp"}
              </a>
            </Button>
            {!lead.phone ? <p className="text-xs text-muted-foreground">{lang === "en" ? "No phone on this lead." : "Sin teléfono en este lead."}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Assign to" : "Asignar a"}</Label>
            <Select
              value={lead.assignedTo ?? "__none__"}
              onValueChange={(v) => void setAssigned(v === "__none__" ? null : v)}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder={lang === "en" ? "Unassigned" : "Sin asignar"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{lang === "en" ? "Unassigned" : "Sin asignar"}</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Move to status" : "Cambiar estado"}</Label>
            <div className="flex flex-wrap gap-1.5">
              {LEAD_STATUS_FLOW.map((s) => (
                <button
                  key={s}
                  onClick={() => void setStatus(s)}
                  disabled={savingStatus || lead.status === s}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${lead.status === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent/40"}`}
                >
                  {COLUMN_META[s][lang]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
