"use client";
// Module 4.7 — Site Editor: hero (es/en) live preview, hero media uploads,
// announcement bar, gallery CRUD (Task ID 6), hours grid.
import * as React from "react";
import {
  Save, Megaphone, Images, Clock, Droplets, Plus, Pencil, Trash2,
  ArrowUp, ArrowDown, Film, Image as ImageIcon,
} from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { adminFetch, LoadingBlock, EmptyState, Spinner } from "./_shared";
import { MediaDropzone } from "./media-dropzone";
import type { PublicData } from "@/lib/public-data";
import type { Business, SiteSettings, GalleryItem, OpeningHours } from "@/lib/types";

interface SettingsResponse {
  business: Business;
  settings: SiteSettings;
}
interface GalleryResponse { items: GalleryItem[] }

const DAY_KEYS_RAW = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_LABELS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type GalleryTab = "photos" | "before-after" | "videos";

export function SiteEditor({ data }: { data: PublicData }) {
  const lang = useLang((s) => s.lang);
  const [business, setBusiness] = React.useState<Business | null>(data.business ?? null);
  const [settings, setSettings] = React.useState<SiteSettings | null>(data.settings ?? null);
  const [gallery, setGallery] = React.useState<GalleryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const [s, g] = await Promise.all([
        adminFetch<SettingsResponse>("/api/admin/settings"),
        adminFetch<GalleryResponse>("/api/admin/gallery"),
      ]);
      setBusiness(s.business);
      setSettings(s.settings);
      setGallery(g.items ?? []);
    } catch (e) {
      toast.error(lang === "en" ? "Failed to load editor data" : "Error al cargar el editor");
      void e;
    } finally {
      setLoading(false);
    }
  }, [lang]);

  React.useEffect(() => { void reload(); }, [reload]);

  const save = async (section: string, payload: Record<string, unknown>, label: string) => {
    setSaving((s) => ({ ...s, [section]: true }));
    try {
      await adminFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify(payload) });
      toast.success(label);
    } catch (e) {
      toast.error(lang === "en" ? "Save failed" : "Error al guardar");
      void e;
    } finally {
      setSaving((s) => ({ ...s, [section]: false }));
    }
  };

  if (loading || !business || !settings) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_editor")}</h1>
        <Card><CardContent><LoadingBlock rows={6} /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_editor")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {lang === "en" ? "Edit live content with bilingual preview." : "Edita contenido en vivo con vista bilingüe."}
        </p>
      </div>

      {/* HERO COPY */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Droplets className="size-4 text-primary" />{lang === "en" ? "Hero copy" : "Texto Hero"}</CardTitle>
          <CardDescription>{lang === "en" ? "Headline, subheadline and CTA." : "Titular, subtítulo y CTA."}</CardDescription>
        </CardHeader>
        <CardContent>
          <HeroEditor settings={settings} lang={lang} saving={!!saving.hero} onChange={setSettings} onSave={() => void save("hero", { settings: pickHero(settings) }, lang === "en" ? "Hero saved" : "Hero guardado")} />
        </CardContent>
      </Card>

      {/* HERO MEDIA (Task ID 6) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Film className="size-4 text-primary" />{lang === "en" ? "Hero media" : "Medios del Hero"}</CardTitle>
          <CardDescription>
            {lang === "en"
              ? "Desktop image and mobile video (with optional poster). Mobile shows the video, desktop shows the image."
              : "Imagen de escritorio y video de móvil (con póster opcional). El móvil muestra el video; el escritorio, la imagen."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HeroMediaEditor settings={settings} lang={lang} saving={!!saving.heroMedia} onChange={setSettings} onSave={() => void save("heroMedia", { settings: pickHeroMedia(settings) }, lang === "en" ? "Hero media saved" : "Medios del hero guardados")} />
        </CardContent>
      </Card>

      {/* ANNOUNCEMENT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Megaphone className="size-4 text-primary" />{lang === "en" ? "Announcement bar" : "Barra de anuncio"}</CardTitle>
          <CardDescription>{lang === "en" ? "Top promo banner." : "Banner superior."}</CardDescription>
        </CardHeader>
        <CardContent>
          <AnnouncementEditor settings={settings} lang={lang} saving={!!saving.announce} onChange={setSettings} onSave={() => void save("announce", { settings: pickAnnouncement(settings) }, lang === "en" ? "Announcement saved" : "Anuncio guardado")} />
        </CardContent>
      </Card>

      {/* GALLERY (Task ID 6 — full CRUD) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Images className="size-4 text-primary" />{lang === "en" ? "Gallery" : "Galería"}</CardTitle>
          <CardDescription>
            {lang === "en"
              ? "Add, edit, delete, reorder, and toggle visibility."
              : "Agrega, edita, elimina, reordena y cambia visibilidad."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GalleryManager items={gallery} lang={lang} onUpdated={setGallery} onReload={() => void reload()} />
        </CardContent>
      </Card>

      {/* HOURS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Clock className="size-4 text-primary" />{lang === "en" ? "Business hours" : "Horario"}</CardTitle>
          <CardDescription>{lang === "en" ? "7-day grid." : "Grilla de 7 días."}</CardDescription>
        </CardHeader>
        <CardContent>
          <HoursEditor business={business} lang={lang} saving={!!saving.hours} onChange={setBusiness} onSave={() => void save("hours", { business: { openingHours: business.openingHours } }, lang === "en" ? "Hours saved" : "Horario guardado")} />
        </CardContent>
      </Card>
    </div>
  );
}

function pickHero(s: SiteSettings) {
  return {
    heroHeadlineEs: s.heroHeadlineEs,
    heroHeadlineEn: s.heroHeadlineEn,
    heroSubheadlineEs: s.heroSubheadlineEs,
    heroSubheadlineEn: s.heroSubheadlineEn,
    ctaTextEs: s.ctaTextEs,
    ctaTextEn: s.ctaTextEn,
  };
}

function pickHeroMedia(s: SiteSettings) {
  // Send empty string (not null) so PUT can clear existing values.
  return {
    heroImageUrl: s.heroImageUrl ?? "",
    heroVideoUrl: s.heroVideoUrl ?? "",
    heroVideoPosterUrl: s.heroVideoPosterUrl ?? "",
  };
}

function pickAnnouncement(s: SiteSettings) {
  return {
    announcementBarTextEs: s.announcementBarTextEs,
    announcementBarTextEn: s.announcementBarTextEn,
    announcementBarActive: s.announcementBarActive,
  };
}

function HeroEditor({
  settings, lang, saving, onChange, onSave,
}: {
  settings: SiteSettings;
  lang: "es" | "en";
  saving: boolean;
  onChange: (s: SiteSettings) => void;
  onSave: () => void;
}) {
  const upd = (patch: Partial<SiteSettings>) => onChange({ ...settings, ...patch });
  const headline = lang === "en" ? settings.heroHeadlineEn : settings.heroHeadlineEs;
  const sub = lang === "en" ? settings.heroSubheadlineEn : settings.heroSubheadlineEs;
  const cta = lang === "en" ? settings.ctaTextEn : settings.ctaTextEs;

  return (
    <div className="flex flex-col gap-5">
      {/* Preview */}
      <div className="relative overflow-hidden rounded-xl border border-border">
        <div className="absolute inset-0 bg-water-texture bg-primary" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 to-black/55" />
        <div className="relative p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{headline || "—"}</h2>
          <p className="mt-2 text-sm text-white/85 max-w-xl">{sub || "—"}</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent text-accent-foreground px-4 py-2.5 text-sm font-bold">
            <Droplets className="size-4" />{cta || "—"}
          </span>
        </div>
      </div>

      {/* Editors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{lang === "en" ? "Headline (ES)" : "Titular (ES)"}</Label>
          <Input value={settings.heroHeadlineEs} onChange={(e) => upd({ heroHeadlineEs: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Headline (EN)</Label>
          <Input value={settings.heroHeadlineEn} onChange={(e) => upd({ heroHeadlineEn: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{lang === "en" ? "Subheadline (ES)" : "Subtítulo (ES)"}</Label>
          <Textarea rows={2} value={settings.heroSubheadlineEs} onChange={(e) => upd({ heroSubheadlineEs: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Subheadline (EN)</Label>
          <Textarea rows={2} value={settings.heroSubheadlineEn} onChange={(e) => upd({ heroSubheadlineEn: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{lang === "en" ? "CTA text (ES)" : "Texto CTA (ES)"}</Label>
          <Input value={settings.ctaTextEs} onChange={(e) => upd({ ctaTextEs: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>CTA text (EN)</Label>
          <Input value={settings.ctaTextEn} onChange={(e) => upd({ ctaTextEn: e.target.value })} />
        </div>
      </div>

      <Button onClick={onSave} disabled={saving} className="self-start">
        {saving ? <Spinner className="mr-2" /> : <Save className="size-4" />}
        {lang === "en" ? "Save hero copy" : "Guardar texto hero"}
      </Button>
    </div>
  );
}

function HeroMediaEditor({
  settings, lang, saving, onChange, onSave,
}: {
  settings: SiteSettings;
  lang: "es" | "en";
  saving: boolean;
  onChange: (s: SiteSettings) => void;
  onSave: () => void;
}) {
  const upd = (patch: Partial<SiteSettings>) => {
    const next = { ...settings, ...patch };
    onChange(next);
    // Auto-save after upload — user doesn't need to click Save separately
    if (patch.heroImageUrl !== undefined || patch.heroVideoUrl !== undefined || patch.heroVideoPosterUrl !== undefined) {
      setTimeout(() => {
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            settings: {
              heroImageUrl: next.heroImageUrl || null,
              heroVideoUrl: next.heroVideoUrl || null,
              heroVideoPosterUrl: next.heroVideoPosterUrl || null,
            },
          }),
        }).then(() => {
          toast.success(lang === "en" ? "Media saved — landing page updated" : "Medios guardados — página actualizada");
        }).catch(() => {
          toast.error(lang === "en" ? "Save failed" : "Error al guardar");
        });
      }, 100);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MediaDropzone
          label={lang === "en" ? "Hero image (desktop)" : "Imagen hero (escritorio)"}
          value={settings.heroImageUrl}
          mediaType="image"
          onChange={(url) => upd({ heroImageUrl: url })}
        />
        <MediaDropzone
          label={lang === "en" ? "Hero video (mobile)" : "Video hero (móvil)"}
          value={settings.heroVideoUrl}
          mediaType="video"
          onChange={(url) => upd({ heroVideoUrl: url })}
        />
        <MediaDropzone
          label={lang === "en" ? "Video poster image" : "Póster del video"}
          value={settings.heroVideoPosterUrl}
          mediaType="image"
          onChange={(url) => upd({ heroVideoPosterUrl: url })}
        />
      </div>

      {/* Live preview */}
      <div className="rounded-md border border-border overflow-hidden">
        <div className="text-xs text-muted-foreground p-2 bg-muted/30">
          {lang === "en" ? "Preview — left: desktop (image), right: mobile (video)" : "Vista previa — izq: escritorio (imagen), der: móvil (video)"}
        </div>
        <div className="grid grid-cols-2 gap-1 p-2">
          <div className="aspect-video relative bg-muted overflow-hidden rounded">
            {settings.heroImageUrl ? (
              <img src={settings.heroImageUrl} alt="hero desktop" className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-xs text-muted-foreground">—</div>
            )}
            <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white px-1.5 rounded">Desktop</span>
          </div>
          <div className="aspect-video relative bg-muted overflow-hidden rounded">
            {settings.heroVideoUrl ? (
              <video
                src={settings.heroVideoUrl}
                poster={settings.heroVideoPosterUrl ?? undefined}
                className="size-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : settings.heroVideoPosterUrl ? (
              <img src={settings.heroVideoPosterUrl} alt="hero mobile poster" className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-xs text-muted-foreground">—</div>
            )}
            <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white px-1.5 rounded">Mobile</span>
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-t border-border flex items-center justify-between gap-3 z-10">
        <p className="text-xs text-muted-foreground hidden sm:block">
          {lang === "en" ? "Changes auto-save after upload. Click to save manual edits." : "Los cambios se guardan automáticamente tras subir. Clic para guardar ediciones manuales."}
        </p>
        <div className="flex gap-2 ml-auto">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent/40 transition-colors"
          >
            {lang === "en" ? "View site" : "Ver sitio"}
          </a>
          <Button onClick={onSave} disabled={saving} className="btn-shine">
            {saving ? <Spinner className="mr-2" /> : <Save className="size-4 mr-1" />}
            {lang === "en" ? "Save hero media" : "Guardar medios del hero"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementEditor({
  settings, lang, saving, onChange, onSave,
}: {
  settings: SiteSettings;
  lang: "es" | "en";
  saving: boolean;
  onChange: (s: SiteSettings) => void;
  onSave: () => void;
}) {
  const upd = (patch: Partial<SiteSettings>) => onChange({ ...settings, ...patch });
  return (
    <div className="flex flex-col gap-4">
      {settings.announcementBarActive ? (
        <div className="rounded-md bg-accent/30 border border-accent/40 px-3 py-2 text-sm text-accent-foreground">
          <Megaphone className="inline size-4 mr-1.5" />
          {lang === "en" ? (settings.announcementBarTextEn || "—") : (settings.announcementBarTextEs || "—")}
        </div>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{lang === "en" ? "Text (ES)" : "Texto (ES)"}</Label>
          <Input value={settings.announcementBarTextEs ?? ""} onChange={(e) => upd({ announcementBarTextEs: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Text (EN)</Label>
          <Input value={settings.announcementBarTextEn ?? ""} onChange={(e) => upd({ announcementBarTextEn: e.target.value })} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="ann-active" checked={settings.announcementBarActive} onCheckedChange={(v) => upd({ announcementBarActive: v })} />
        <Label htmlFor="ann-active">{lang === "en" ? "Active on site" : "Activo en el sitio"}</Label>
      </div>
      <Button onClick={onSave} disabled={saving} className="self-start">
        {saving ? <Spinner className="mr-2" /> : <Save className="size-4" />}
        {lang === "en" ? "Save" : "Guardar"}
      </Button>
    </div>
  );
}

// ─── Gallery (Task ID 6 — full CRUD with sub-tabs) ───────────────────────────

function GalleryManager({
  items, lang, onUpdated, onReload,
}: {
  items: GalleryItem[];
  lang: "es" | "en";
  onUpdated: (next: GalleryItem[]) => void;
  onReload: () => void;
}) {
  const [tab, setTab] = React.useState<GalleryTab>("photos");
  const [editing, setEditing] = React.useState<GalleryItem | null>(null);
  const [creating, setCreating] = React.useState<GalleryTab | null>(null);

  // existing before/after pairs (for the pair selector)
  const pairs = React.useMemo(() => {
    const map = new Map<string, { pairId: string; before?: GalleryItem; after?: GalleryItem }>();
    for (const it of items) {
      if (!it.isBeforeAfter || !it.pairId) continue;
      const p = map.get(it.pairId) ?? { pairId: it.pairId };
      if (it.pairRole === "before") p.before = it;
      if (it.pairRole === "after") p.after = it;
      map.set(it.pairId, p);
    }
    return Array.from(map.values());
  }, [items]);

  // items in current tab (sorted)
  const tabItems = React.useMemo(() => {
    let list: GalleryItem[] = items;
    if (tab === "photos") list = items.filter((it) => !it.isBeforeAfter && it.mediaType === "photo");
    if (tab === "before-after") list = items.filter((it) => it.isBeforeAfter);
    if (tab === "videos") list = items.filter((it) => !it.isBeforeAfter && it.mediaType === "video");
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [items, tab]);

  // CRUD handlers
  const toggleActive = async (item: GalleryItem, active: boolean) => {
    onUpdated(items.map((it) => (it.id === item.id ? { ...it, active } : it)));
    try {
      await adminFetch(`/api/admin/gallery/${item.id}`, { method: "PUT", body: JSON.stringify({ active }) });
      toast.success(active ? (lang === "en" ? "Visible" : "Visible") : (lang === "en" ? "Hidden" : "Oculto"));
    } catch {
      toast.error(lang === "en" ? "Update failed" : "Error al actualizar");
      onReload();
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!window.confirm(lang === "en" ? "Delete this gallery item?" : "¿Eliminar este item de galería?")) return;
    onUpdated(items.filter((it) => it.id !== item.id));
    try {
      await adminFetch(`/api/admin/gallery/${item.id}`, { method: "DELETE" });
      toast.success(lang === "en" ? "Item deleted" : "Item eliminado");
    } catch {
      toast.error(lang === "en" ? "Delete failed" : "Error al eliminar");
      onReload();
    }
  };

  const move = async (item: GalleryItem, dir: -1 | 1) => {
    const list = tabItems;
    const idx = list.findIndex((it) => it.id === item.id);
    const newIdx = idx + dir;
    if (idx === -1 || newIdx < 0 || newIdx >= list.length) return;
    const reordered = [...list];
    const tmp = reordered[idx];
    reordered[idx] = reordered[newIdx];
    reordered[newIdx] = tmp;
    const renumbered = reordered.map((it, i) => ({ ...it, sortOrder: i }));
    // optimistic: patch sortOrder for those items in the parent `items` array
    const map = new Map(renumbered.map((it) => [it.id, it.sortOrder]));
    onUpdated(items.map((it) => (map.has(it.id) ? { ...it, sortOrder: map.get(it.id)! } : it)));
    try {
      await Promise.all(
        renumbered.map((it) =>
          adminFetch(`/api/admin/gallery/${it.id}`, { method: "PUT", body: JSON.stringify({ sortOrder: it.sortOrder }) }),
        ),
      );
      toast.success(lang === "en" ? "Order saved" : "Orden guardado");
    } catch {
      toast.error(lang === "en" ? "Save failed" : "Error al guardar");
      onReload();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as GalleryTab)}>
        <TabsList>
          <TabsTrigger value="photos"><ImageIcon className="size-3.5" />{lang === "en" ? "Photos" : "Fotos generales"}</TabsTrigger>
          <TabsTrigger value="before-after">{lang === "en" ? "Before/After" : "Antes y Después"}</TabsTrigger>
          <TabsTrigger value="videos"><Film className="size-3.5" />{lang === "en" ? "Videos" : "Videos"}</TabsTrigger>
        </TabsList>

        {(["photos", "before-after", "videos"] as GalleryTab[]).map((tb) => {
          const list = tb === "photos"
            ? items.filter((it) => !it.isBeforeAfter && it.mediaType === "photo")
            : tb === "before-after"
              ? items.filter((it) => it.isBeforeAfter)
              : items.filter((it) => !it.isBeforeAfter && it.mediaType === "video");
          const sorted = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
          return (
            <TabsContent key={tb} value={tb} className="mt-3">
              <div className="flex justify-end mb-2">
                <Button size="sm" onClick={() => setCreating(tb)}>
                  <Plus className="size-4" />
                  {lang === "en" ? "Add item" : "Añadir item"}
                </Button>
              </div>
              {sorted.length === 0 ? (
                <EmptyState title={lang === "en" ? "No items yet" : "Sin items"} hint={lang === "en" ? "Click \"Add item\" to upload one." : "Haz clic en \"Añadir item\" para subir uno."} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto scroll-thin pr-1">
                  {sorted.map((it, i) => (
                    <GalleryCard
                      key={it.id}
                      item={it}
                      lang={lang}
                      index={i}
                      total={sorted.length}
                      onEdit={() => setEditing(it)}
                      onDelete={() => void handleDelete(it)}
                      onToggle={(v) => void toggleActive(it, v)}
                      onMove={(dir) => void move(it, dir)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Edit dialog */}
      <GalleryItemDialog
        open={!!editing}
        item={editing}
        mode={editing ? modeOfItem(editing) : "photos"}
        pairs={pairs}
        lang={lang}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        onSaved={() => { setEditing(null); onReload(); }}
      />

      {/* Create dialog */}
      <GalleryItemDialog
        open={!!creating}
        item={null}
        mode={creating ?? "photos"}
        pairs={pairs}
        lang={lang}
        onOpenChange={(o) => { if (!o) setCreating(null); }}
        onSaved={() => { setCreating(null); onReload(); }}
      />
    </div>
  );
}

function modeOfItem(item: GalleryItem): GalleryTab {
  if (item.isBeforeAfter) return "before-after";
  if (item.mediaType === "video") return "videos";
  return "photos";
}

function GalleryCard({
  item, lang, index, total, onEdit, onDelete, onToggle, onMove,
}: {
  item: GalleryItem;
  lang: "es" | "en";
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const isVideo = item.mediaType === "video";
  const isBA = item.isBeforeAfter;
  const badgeLabel = isBA
    ? (item.pairRole === "before" ? (lang === "en" ? "Before" : "Antes") : (lang === "en" ? "After" : "Después"))
    : (isVideo ? (lang === "en" ? "Video" : "Video") : (lang === "en" ? "Photo" : "Foto"));

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-background">
      <div className="relative aspect-video bg-muted">
        {isVideo ? (
          <video
            src={item.mediaUrl}
            poster={item.posterUrl ?? undefined}
            className={`size-full object-cover ${item.active ? "" : "opacity-40 grayscale"}`}
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={item.mediaUrl} alt={item.captionEs ?? ""} className={`size-full object-cover ${item.active ? "" : "opacity-40 grayscale"}`} />
        )}
        <div className="absolute top-1.5 left-1.5 flex gap-1">
          <Badge variant="secondary" className="text-[9px]">{badgeLabel}</Badge>
          {!item.active ? <Badge variant="outline" className="text-[9px]">{lang === "en" ? "Hidden" : "Oculto"}</Badge> : null}
        </div>
        <div className="absolute top-1.5 right-1.5 flex gap-0.5">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="size-6 rounded bg-black/50 text-white flex items-center justify-center hover:bg-black/70 disabled:opacity-30"
            aria-label={lang === "en" ? "Move up" : "Subir"}
          >
            <ArrowUp className="size-3" />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="size-6 rounded bg-black/50 text-white flex items-center justify-center hover:bg-black/70 disabled:opacity-30"
            aria-label={lang === "en" ? "Move down" : "Bajar"}
          >
            <ArrowDown className="size-3" />
          </button>
          <button
            onClick={onEdit}
            className="size-6 rounded bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            aria-label={lang === "en" ? "Edit" : "Editar"}
          >
            <Pencil className="size-3" />
          </button>
          <button
            onClick={onDelete}
            className="size-6 rounded bg-black/50 text-rose-300 flex items-center justify-center hover:bg-rose-900/70"
            aria-label={lang === "en" ? "Delete" : "Eliminar"}
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
      <div className="p-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground truncate flex-1">
          {lang === "en" ? (item.captionEn ?? item.captionEs ?? "—") : (item.captionEs ?? item.captionEn ?? "—")}
        </p>
        <Switch checked={item.active} onCheckedChange={onToggle} aria-label="active" />
      </div>
    </div>
  );
}

function GalleryItemDialog({
  open, item, mode, pairs, lang, onOpenChange, onSaved,
}: {
  open: boolean;
  item: GalleryItem | null;
  mode: GalleryTab;
  pairs: { pairId: string; before?: GalleryItem; after?: GalleryItem }[];
  lang: "es" | "en";
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isVideo = mode === "videos" || (item?.mediaType === "video") === true;
  const isBA = mode === "before-after" || (item?.isBeforeAfter ?? false);

  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);
  const [posterUrl, setPosterUrl] = React.useState<string | null>(null);
  const [captionEs, setCaptionEs] = React.useState("");
  const [captionEn, setCaptionEn] = React.useState("");
  const [pairMode, setPairMode] = React.useState<"new" | "existing">("new");
  const [pairId, setPairId] = React.useState<string>("");
  const [pairRole, setPairRole] = React.useState<"before" | "after">("before");
  const [active, setActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setMediaUrl(item?.mediaUrl ?? null);
    setPosterUrl(item?.posterUrl ?? null);
    setCaptionEs(item?.captionEs ?? "");
    setCaptionEn(item?.captionEn ?? "");
    if (item?.pairId) {
      setPairMode("existing");
      setPairId(item.pairId);
      setPairRole((item.pairRole === "after" ? "after" : "before"));
    } else {
      setPairMode("new");
      setPairId("");
      setPairRole("before");
    }
    setActive(item?.active ?? true);
  }, [open, item]);

  const onSave = async () => {
    if (!mediaUrl) {
      toast.error(lang === "en" ? "Media is required" : "El medio es obligatorio");
      return;
    }
    if (isBA && pairMode === "existing" && !pairId) {
      toast.error(lang === "en" ? "Pick a pair" : "Elige un par");
      return;
    }
    setSaving(true);
    try {
      const finalPairId = isBA
        ? (pairMode === "new" ? `pair-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : pairId)
        : null;
      const body = {
        mediaUrl,
        mediaType: (isVideo ? "video" : "photo") as "video" | "photo",
        source: "upload",
        isBeforeAfter: isBA,
        pairId: finalPairId,
        pairRole: isBA ? pairRole : null,
        captionEs: captionEs.trim() || null,
        captionEn: captionEn.trim() || null,
        posterUrl: isVideo ? (posterUrl ?? null) : null,
        sortOrder: item?.sortOrder ?? 0,
        active,
      };
      if (item) {
        await adminFetch(`/api/admin/gallery/${item.id}`, { method: "PUT", body: JSON.stringify(body) });
        toast.success(lang === "en" ? "Item updated" : "Item actualizado");
      } else {
        await adminFetch("/api/admin/gallery", { method: "POST", body: JSON.stringify(body) });
        toast.success(lang === "en" ? "Item created" : "Item creado");
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
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle>
            {item
              ? (lang === "en" ? "Edit gallery item" : "Editar item de galería")
              : (lang === "en" ? "Add gallery item" : "Añadir item de galería")}
          </DialogTitle>
          <DialogDescription>
            {isBA
              ? (lang === "en" ? "Before/After pair photo." : "Foto de par Antes/Después.")
              : isVideo
                ? (lang === "en" ? "Video reel." : "Video reel.")
                : (lang === "en" ? "General gallery photo." : "Foto general de galería.")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <MediaDropzone
            label={isVideo ? (lang === "en" ? "Video file" : "Archivo de video") : (lang === "en" ? "Photo" : "Foto")}
            value={mediaUrl}
            mediaType={isVideo ? "video" : "image"}
            onChange={(url) => setMediaUrl(url)}
          />

          {isVideo ? (
            <MediaDropzone
              label={lang === "en" ? "Poster image (optional)" : "Póster (opcional)"}
              value={posterUrl}
              mediaType="image"
              onChange={(url) => setPosterUrl(url)}
              compact
            />
          ) : null}

          {isBA ? (
            <div className="flex flex-col gap-3 rounded-md border border-border p-3 bg-muted/30">
              <Label className="text-xs font-semibold">{lang === "en" ? "Pair assignment" : "Asignación de par"}</Label>
              <RadioGroup
                value={pairMode}
                onValueChange={(v) => setPairMode(v as "new" | "existing")}
                className="grid grid-cols-2 gap-2"
              >
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="new" />
                  {lang === "en" ? "New pair" : "Par nuevo"}
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="existing" disabled={pairs.length === 0} />
                  {lang === "en" ? "Existing pair" : "Par existente"}
                </label>
              </RadioGroup>
              {pairMode === "existing" ? (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{lang === "en" ? "Select pair" : "Selecciona par"}</Label>
                  <select
                    value={pairId}
                    onChange={(e) => setPairId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">{lang === "en" ? "— Pick —" : "— Elegir —"}</option>
                    {pairs.map((p) => (
                      <option key={p.pairId} value={p.pairId}>
                        {p.pairId.slice(0, 12)}… ({p.before ? "✓" : "—"}/{p.after ? "✓" : "—"})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">{lang === "en" ? "This photo is the…" : "Esta foto es el…"}</Label>
                <RadioGroup
                  value={pairRole}
                  onValueChange={(v) => setPairRole(v as "before" | "after")}
                  className="grid grid-cols-2 gap-2"
                >
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="before" />
                    {lang === "en" ? "Before" : "Antes"}
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="after" />
                    {lang === "en" ? "After" : "Después"}
                  </label>
                </RadioGroup>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{lang === "en" ? "Caption (ES)" : "Descripción (ES)"}</Label>
              <Input value={captionEs} onChange={(e) => setCaptionEs(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Caption (EN)</Label>
              <Input value={captionEn} onChange={(e) => setCaptionEn(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="gi-active" checked={active} onCheckedChange={setActive} />
            <Label htmlFor="gi-active">{lang === "en" ? "Visible on site" : "Visible en el sitio"}</Label>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>{lang === "en" ? "Cancel" : "Cancelar"}</Button>
          </DialogClose>
          <Button onClick={() => void onSave()} disabled={saving}>
            {saving ? <Spinner className="mr-2" /> : null}
            {item ? (lang === "en" ? "Save" : "Guardar") : (lang === "en" ? "Create" : "Crear")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HoursEditor({
  business, lang, saving, onChange, onSave,
}: {
  business: Business;
  lang: "es" | "en";
  saving: boolean;
  onChange: (b: Business) => void;
  onSave: () => void;
}) {
  const hours: OpeningHours = business.openingHours ?? {};
  const upd = (day: typeof DAY_KEYS_RAW[number], field: "open" | "close", value: string) => {
    const next: OpeningHours = { ...hours, [day]: { ...(hours[day] ?? { open: null, close: null }), [field]: value || null } };
    onChange({ ...business, openingHours: next });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {DAY_KEYS_RAW.map((day, i) => {
          const h = hours[day] ?? { open: null, close: null };
          return (
            <div key={day} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
              <span className="text-sm font-medium w-24 shrink-0">{lang === "en" ? DAY_LABELS_EN[i] : DAY_LABELS_ES[i]}</span>
              <Separator orientation="vertical" className="h-6" />
              <Input type="time" value={h.open ?? ""} onChange={(e) => upd(day, "open", e.target.value)} className="h-8 w-28" aria-label={`${day} open`} />
              <span className="text-xs text-muted-foreground">–</span>
              <Input type="time" value={h.close ?? ""} onChange={(e) => upd(day, "close", e.target.value)} className="h-8 w-28" aria-label={`${day} close`} />
            </div>
          );
        })}
      </div>
      <Button onClick={onSave} disabled={saving} className="self-start">
        {saving ? <Spinner className="mr-2" /> : <Save className="size-4" />}
        {lang === "en" ? "Save hours" : "Guardar horario"}
      </Button>
    </div>
  );
}
