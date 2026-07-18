"use client";
// Module 4.2 — Services Manager: grouped list, CRUD, dnd-kit reorder, before/after photos, optimistic available.
// Task ID 6 — upgraded: MediaDropzone uploads + inline category manager (CRUD) + videoPosterUrl field.
import * as React from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Pencil, Trash2, Wrench, FolderPlus } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { adminFetch, LoadingBlock, EmptyState, Spinner, fmtMoney } from "./_shared";
import { MediaDropzone } from "./media-dropzone";
import type { PublicData } from "@/lib/public-data";
import type { Service, ServiceCategory, PriceType } from "@/lib/types";

interface ServicesResponse { categories: ServiceCategory[]; services: Service[] }

const PRICE_TYPES: PriceType[] = ["fixed", "starting_at", "quote_only"];

function priceTypeLabel(pt: PriceType, lang: "es" | "en"): string {
  if (pt === "fixed") return lang === "en" ? "Fixed price" : "Precio fijo";
  if (pt === "starting_at") return lang === "en" ? "Starting at" : "Desde";
  return lang === "en" ? "Quote only" : "Solo cotización";
}

export function ServicesManager({ data }: { data: PublicData }) {
  const lang = useLang((s) => s.lang);
  const [categories, setCategories] = React.useState<ServiceCategory[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<Service | null>(null);
  const [creating, setCreating] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<ServicesResponse>("/api/admin/services");
      setCategories(res.categories);
      setServices(res.services);
    } catch (e) {
      toast.error(lang === "en" ? "Failed to load services" : "Error al cargar servicios");
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

  // group services by category
  const grouped = React.useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const c of categories) map.set(c.id, []);
    for (const s of services) {
      if (!map.has(s.categoryId)) map.set(s.categoryId, []);
      map.get(s.categoryId)!.push(s);
    }
    for (const list of map.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);
    return map;
  }, [categories, services]);

  const onDragEnd = async (catId: string, e: DragEndEvent) => {
    const list = grouped.get(catId) ?? [];
    const oldIndex = list.findIndex((s) => s.id === e.active.id);
    const newIndex = list.findIndex((s) => s.id === e.over?.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    const reordered = arrayMove(list, oldIndex, newIndex);
    // optimistic update
    const newOrder = reordered.map((s, i) => ({ ...s, sortOrder: i }));
    setServices((prev) => {
      const others = prev.filter((s) => s.categoryId !== catId);
      return [...others, ...newOrder];
    });
    try {
      await adminFetch("/api/admin/services/reorder", {
        method: "PUT",
        body: JSON.stringify(newOrder.map((s, i) => ({ id: s.id, sortOrder: i }))),
      });
      toast.success(lang === "en" ? "Order saved" : "Orden guardado");
    } catch {
      toast.error(lang === "en" ? "Failed to save order" : "Error al guardar orden");
      void reload();
    }
  };

  const toggleAvailable = async (svc: Service, next: boolean) => {
    setServices((prev) => prev.map((s) => (s.id === svc.id ? { ...s, available: next } : s)));
    try {
      await adminFetch(`/api/admin/services/${svc.id}`, {
        method: "PUT",
        body: JSON.stringify({ available: next }),
      });
      toast.success(lang === "en" ? "Service updated" : "Servicio actualizado");
    } catch {
      toast.error(lang === "en" ? "Failed to update" : "Error al actualizar");
      setServices((prev) => prev.map((s) => (s.id === svc.id ? { ...s, available: svc.available } : s)));
    }
  };

  const handleDelete = async (svc: Service) => {
    if (!window.confirm(lang === "en" ? `Delete "${svc.nameEs}"?` : `¿Eliminar "${svc.nameEs}"?`)) return;
    setServices((prev) => prev.filter((s) => s.id !== svc.id));
    try {
      await adminFetch(`/api/admin/services/${svc.id}`, { method: "DELETE" });
      toast.success(lang === "en" ? "Service deleted" : "Servicio eliminado");
    } catch {
      toast.error(lang === "en" ? "Failed to delete" : "Error al eliminar");
      void reload();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_services")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "en" ? "Edit, reorder, and toggle availability." : "Edita, reordena y cambia disponibilidad."}
          </p>
        </div>
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus className="size-4" />
          {t(lang, "admin_add_service")}
        </Button>
      </div>

      {/* Category manager (Task ID 6 — inline CRUD) */}
      <CategoriesManager categories={categories} lang={lang} onChanged={() => void reload()} />

      {loading ? (
        <Card><CardContent><LoadingBlock rows={5} /></CardContent></Card>
      ) : categories.length === 0 ? (
        <Card><CardContent><EmptyState title={lang === "en" ? "No categories yet — create one above" : "Crea una categoría arriba"} /></CardContent></Card>
      ) : (
        <div className="flex flex-col gap-6">
          {categories.map((cat) => {
            const list = grouped.get(cat.id) ?? [];
            return (
              <Card key={cat.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="size-4 text-primary" />
                    {lang === "en" ? cat.nameEn : cat.nameEs}
                    <Badge variant="secondary" className="ml-1">{list.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {list.length === 0 ? (
                    <EmptyState title={lang === "en" ? "No services in this category" : "Sin servicios en esta categoría"} />
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => void onDragEnd(cat.id, e)}
                    >
                      <SortableContext items={list.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                        <ul className="flex flex-col gap-2">
                          {list.map((svc) => (
                            <SortableRow
                              key={svc.id}
                              svc={svc}
                              lang={lang}
                              onEdit={() => setEditing(svc)}
                              onDelete={() => void handleDelete(svc)}
                              onToggle={(next) => void toggleAvailable(svc, next)}
                            />
                          ))}
                        </ul>
                      </SortableContext>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <ServiceEditDialog
        open={!!editing}
        service={editing}
        categories={categories}
        lang={lang}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        onSaved={() => { setEditing(null); void reload(); }}
      />

      {/* Create dialog */}
      <ServiceEditDialog
        open={creating}
        service={null}
        categories={categories}
        lang={lang}
        onOpenChange={(o) => { if (!o) setCreating(false); }}
        onSaved={() => { setCreating(false); void reload(); }}
      />
    </div>
  );
}

/** Task ID 6 — Inline category CRUD: add / edit names / delete (409 → toast). */
function CategoriesManager({
  categories, lang, onChanged,
}: {
  categories: ServiceCategory[];
  lang: "es" | "en";
  onChanged: () => void;
}) {
  const [newEs, setNewEs] = React.useState("");
  const [newEn, setNewEn] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  const add = async () => {
    if (!newEs.trim() || !newEn.trim()) {
      toast.error(lang === "en" ? "Both names required" : "Ambos nombres requeridos");
      return;
    }
    setAdding(true);
    try {
      await adminFetch("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({ nameEs: newEs.trim(), nameEn: newEn.trim(), sortOrder: categories.length, active: true }),
      });
      toast.success(lang === "en" ? "Category created" : "Categoría creada");
      setNewEs(""); setNewEn("");
      onChanged();
    } catch (e) {
      toast.error(lang === "en" ? "Failed to create category" : "Error al crear categoría");
      void e;
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FolderPlus className="size-4 text-primary" />
          {lang === "en" ? "Categories" : "Categorías"}
        </CardTitle>
        <CardDescription>
          {lang === "en"
            ? "Add, rename, or delete service categories. Delete is blocked if a category has services."
            : "Agrega, renombra o elimina categorías. No se puede eliminar una categoría con servicios."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <EmptyState title={lang === "en" ? "No categories yet" : "Sin categorías"} hint={lang === "en" ? "Add the first one below." : "Agrega la primera abajo."} />
        ) : (
          <ul className="flex flex-col gap-2 mb-4">
            {categories.map((cat) => (
              <CategoryRow key={cat.id} cat={cat} lang={lang} onChanged={onChanged} />
            ))}
          </ul>
        )}
        <Separator className="my-3" />
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{lang === "en" ? "Name (ES)" : "Nombre (ES)"}</Label>
            <Input value={newEs} onChange={(e) => setNewEs(e.target.value)} placeholder="Ej. Lavado residencial" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Name (EN)</Label>
            <Input value={newEn} onChange={(e) => setNewEn(e.target.value)} placeholder="e.g. Residential washing" />
          </div>
          <Button onClick={() => void add()} disabled={adding} className="h-9">
            {adding ? <Spinner className="mr-2" /> : <Plus className="size-4" />}
            {lang === "en" ? "Add category" : "Añadir categoría"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryRow({
  cat, lang, onChanged,
}: {
  cat: ServiceCategory;
  lang: "es" | "en";
  onChanged: () => void;
}) {
  const [nameEs, setNameEs] = React.useState(cat.nameEs);
  const [nameEn, setNameEn] = React.useState(cat.nameEn);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { setNameEs(cat.nameEs); setNameEn(cat.nameEn); }, [cat.id, cat.nameEs, cat.nameEn]);
  const dirty = nameEs.trim() !== cat.nameEs || nameEn.trim() !== cat.nameEn;

  const save = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/categories/${cat.id}`, {
        method: "PUT",
        body: JSON.stringify({ nameEs: nameEs.trim(), nameEn: nameEn.trim() }),
      });
      toast.success(lang === "en" ? "Category updated" : "Categoría actualizada");
      onChanged();
    } catch (e) {
      toast.error(lang === "en" ? "Save failed" : "Error al guardar");
      void e;
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!window.confirm(lang === "en" ? `Delete category "${cat.nameEs}"?` : `¿Eliminar categoría "${cat.nameEs}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        toast.error(
          lang === "en"
            ? `Cannot delete: has ${body.count ?? ""} services`
            : `No se puede eliminar: tiene ${body.count ?? ""} servicios`,
        );
        return;
      }
      if (!res.ok) throw new Error("delete_failed");
      toast.success(lang === "en" ? "Category deleted" : "Categoría eliminada");
      onChanged();
    } catch (e) {
      toast.error(lang === "en" ? "Delete failed" : "Error al eliminar");
      void e;
    }
  };

  return (
    <li className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center rounded-md border border-border px-3 py-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-muted-foreground sm:hidden">ES</span>
        <Input value={nameEs} onChange={(e) => setNameEs(e.target.value)} className="h-8" aria-label="Nombre ES" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-muted-foreground sm:hidden">EN</span>
        <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="h-8" aria-label="Name EN" />
      </div>
      <Button size="sm" variant="outline" onClick={() => void save()} disabled={!dirty || saving} className="h-8">
        {saving ? <Spinner /> : null}
        {lang === "en" ? "Save" : "Guardar"}
      </Button>
      <Button size="icon" variant="ghost" onClick={() => void del()} aria-label="delete" className="text-destructive hover:text-destructive">
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}

function SortableRow({
  svc, lang, onEdit, onDelete, onToggle,
}: {
  svc: Service;
  lang: "es" | "en";
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (next: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: svc.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };
  const name = lang === "en" ? svc.nameEn : svc.nameEs;
  const priceStr = svc.priceType === "quote_only"
    ? (lang === "en" ? "Quote" : "Cotización")
    : svc.priceType === "starting_at"
      ? `${lang === "en" ? "From" : "Desde"} ${fmtMoney(svc.price, svc.currency)}`
      : fmtMoney(svc.price, svc.currency);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 ${isDragging ? "shadow-lg opacity-80" : ""}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        aria-label={lang === "en" ? "Drag to reorder" : "Arrastrar para reordenar"}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold truncate ${svc.available ? "" : "line-through text-muted-foreground"}`}>{name}</span>
          <Badge variant="outline" className="text-[10px]">{priceTypeLabel(svc.priceType, lang)}</Badge>
          {!svc.available ? <Badge variant="secondary" className="text-[10px]">{lang === "en" ? "Hidden" : "Oculto"}</Badge> : null}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{priceStr}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <Switch checked={svc.available} onCheckedChange={onToggle} aria-label="available" />
        <Button size="icon" variant="ghost" onClick={onEdit} aria-label="edit"><Pencil className="size-4" /></Button>
        <Button size="icon" variant="ghost" onClick={onDelete} aria-label="delete" className="text-destructive hover:text-destructive"><Trash2 className="size-4" /></Button>
      </div>
    </li>
  );
}

function ServiceEditDialog({
  open, service, categories, lang, onOpenChange, onSaved,
}: {
  open: boolean;
  service: Service | null;
  categories: ServiceCategory[];
  lang: "es" | "en";
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = !!service;
  const [nameEs, setNameEs] = React.useState("");
  const [nameEn, setNameEn] = React.useState("");
  const [descriptionEs, setDescriptionEs] = React.useState("");
  const [descriptionEn, setDescriptionEn] = React.useState("");
  const [priceType, setPriceType] = React.useState<PriceType>("starting_at");
  const [price, setPrice] = React.useState<string>("");
  const [currency, setCurrency] = React.useState("BOB");
  const [available, setAvailable] = React.useState(true);
  const [categoryId, setCategoryId] = React.useState("");
  const [beforePhoto, setBeforePhoto] = React.useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = React.useState<string | null>(null);
  const [videoPoster, setVideoPoster] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // sync form when opened
  React.useEffect(() => {
    if (!open) return;
    setNameEs(service?.nameEs ?? "");
    setNameEn(service?.nameEn ?? "");
    setDescriptionEs(service?.descriptionEs ?? "");
    setDescriptionEn(service?.descriptionEn ?? "");
    setPriceType(service?.priceType ?? "starting_at");
    setPrice(service?.price != null ? String(service.price) : "");
    setCurrency(service?.currency ?? "BOB");
    setAvailable(service?.available ?? true);
    setCategoryId(service?.categoryId ?? categories[0]?.id ?? "");
    setBeforePhoto(service?.beforePhotoUrl ?? null);
    setAfterPhoto(service?.afterPhotoUrl ?? null);
    setVideoPoster(service?.videoPosterUrl ?? null);
  }, [open, service, categories]);

  const onSave = async () => {
    if (!categoryId) { toast.error(lang === "en" ? "Pick a category" : "Elige una categoría"); return; }
    if (!nameEs.trim() || !nameEn.trim()) { toast.error(lang === "en" ? "Name required (ES + EN)" : "Nombre requerido (ES + EN)"); return; }
    setSaving(true);
    try {
      const body = {
        categoryId,
        nameEs: nameEs.trim(),
        nameEn: nameEn.trim(),
        descriptionEs: descriptionEs.trim(),
        descriptionEn: descriptionEn.trim(),
        priceType,
        price: price.trim() === "" ? null : Number(price),
        currency,
        available,
        // Send empty string (not null) so PUT can clear existing values
        beforePhotoUrl: beforePhoto ?? "",
        afterPhotoUrl: afterPhoto ?? "",
        videoPosterUrl: videoPoster ?? "",
      };
      if (isEdit && service) {
        await adminFetch(`/api/admin/services/${service.id}`, { method: "PUT", body: JSON.stringify(body) });
        toast.success(lang === "en" ? "Service updated" : "Servicio actualizado");
      } else {
        await adminFetch("/api/admin/services", { method: "POST", body: JSON.stringify({ ...body, sortOrder: 0 }) });
        toast.success(lang === "en" ? "Service created" : "Servicio creado");
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? (lang === "en" ? "Edit service" : "Editar servicio")
              : t(lang, "admin_add_service")}
          </DialogTitle>
          <DialogDescription>
            {lang === "en" ? "Bilingual fields (ES / EN)." : "Campos bilingües (ES / EN)."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nombre (ES)</Label>
            <Input value={nameEs} onChange={(e) => setNameEs(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Name (EN)</Label>
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Descripción (ES)</Label>
            <Textarea value={descriptionEs} onChange={(e) => setDescriptionEs(e.target.value)} rows={2} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Description (EN)</Label>
            <Textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Category" : "Categoría"}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={lang === "en" ? "Pick" : "Elegir"} /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{lang === "en" ? c.nameEn : c.nameEs}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Price type" : "Tipo de precio"}</Label>
            <Select value={priceType} onValueChange={(v) => setPriceType(v as PriceType)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRICE_TYPES.map((pt) => (
                  <SelectItem key={pt} value={pt}>{priceTypeLabel(pt, lang)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Price" : "Precio"}</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={priceType === "quote_only"}
              placeholder={priceType === "quote_only" ? "—" : "0"}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Currency" : "Moneda"}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BOB">BOB</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Task ID 6 — MediaDropzone for before / after / video poster */}
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
            <MediaDropzone
              label={lang === "en" ? "Before photo" : "Foto Antes"}
              value={beforePhoto}
              mediaType="image"
              onChange={(url) => setBeforePhoto(url)}
            />
            <MediaDropzone
              label={lang === "en" ? "After photo" : "Foto Después"}
              value={afterPhoto}
              mediaType="image"
              onChange={(url) => setAfterPhoto(url)}
            />
            <MediaDropzone
              label={lang === "en" ? "Video poster" : "Póster de video"}
              value={videoPoster}
              mediaType="image"
              onChange={(url) => setVideoPoster(url)}
            />
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch id="avail" checked={available} onCheckedChange={setAvailable} />
            <Label htmlFor="avail">{lang === "en" ? "Available on site" : "Disponible en el sitio"}</Label>
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
