"use client";
// Module 4.10 — Settings: WhatsApp phone + greeting, service-area mode + zones, quote tiers,
// language default, timezone, currency, GA/Pixel IDs.
import * as React from "react";
import { Save, Settings as SettingsIcon, MessageCircle, MapPin, Calculator, Globe, BarChart, Building2 } from "lucide-react";
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
import { adminFetch, LoadingBlock, Spinner } from "./_shared";
import type { PublicData } from "@/lib/public-data";
import type { Business, SiteSettings, ServiceArea } from "@/lib/types";

interface SettingsResponse {
  business: Business;
  settings: SiteSettings;
}

interface Tier { label: string; labelEn: string; sqmMax: number; multiplier: number }

const DEFAULT_TIERS: Tier[] = [
  { label: "Pequeño", labelEn: "Small", sqmMax: 50, multiplier: 1 },
  { label: "Mediano", labelEn: "Medium", sqmMax: 150, multiplier: 1.4 },
  { label: "Grande", labelEn: "Large", sqmMax: 400, multiplier: 1.8 },
];

const TIMEZONES = ["America/La_Paz", "America/New_York", "Europe/Madrid", "UTC"];
const CURRENCIES = ["BOB", "USD", "EUR"];

export function Settings({ data }: { data: PublicData }) {
  const lang = useLang((s) => s.lang);
  const [business, setBusiness] = React.useState<Business | null>(data.business ?? null);
  const [settings, setSettings] = React.useState<SiteSettings | null>(data.settings ?? null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<SettingsResponse>("/api/admin/settings");
      setBusiness(res.business);
      setSettings(res.settings);
    } catch (e) {
      toast.error(lang === "en" ? "Failed to load settings" : "Error al cargar configuración");
      void e;
    } finally {
      setLoading(false);
    }
  }, [lang]);

  React.useEffect(() => { void reload(); }, [reload]);

  const saveAll = async () => {
    if (!business || !settings) return;
    setSaving(true);
    try {
      await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          business: {
            phone: business.phone,
            address: business.address,
            googleMapsUrl: business.googleMapsUrl,
            instagramUrl: business.instagramUrl,
            timezone: business.timezone,
            currency: business.currency,
            serviceArea: business.serviceArea,
          },
          settings: {
            whatsappGreetingEs: settings.whatsappGreetingEs,
            whatsappGreetingEn: settings.whatsappGreetingEn,
            quoteCalculatorConfig: settings.quoteCalculatorConfig,
            gaTrackingId: settings.gaTrackingId,
            metaPixelId: settings.metaPixelId,
          },
        }),
      });
      toast.success(lang === "en" ? "Settings saved" : "Configuración guardada");
    } catch (e) {
      toast.error(lang === "en" ? "Save failed" : "Error al guardar");
      void e;
    } finally {
      setSaving(false);
    }
  };

  if (loading || !business || !settings) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_settings")}</h1>
        <Card><CardContent><LoadingBlock rows={6} /></CardContent></Card>
      </div>
    );
  }

  const sa: ServiceArea = business.serviceArea ?? { mode: "zones", zones: [] };
  const tiers: Tier[] = (settings.quoteCalculatorConfig?.tiers as Tier[] | undefined) ?? DEFAULT_TIERS;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_settings")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "en" ? "Business, WhatsApp, calculator and integrations." : "Negocio, WhatsApp, cotizador e integraciones."}
          </p>
        </div>
        <Button onClick={() => void saveAll()} disabled={saving}>
          {saving ? <Spinner className="mr-2" /> : <Save className="size-4" />}
          {lang === "en" ? "Save all" : "Guardar todo"}
        </Button>
      </div>

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><MessageCircle className="size-4 text-primary" />WhatsApp</CardTitle>
          <CardDescription>{lang === "en" ? "Business phone and pre-filled greeting." : "Teléfono y saludo prellenado."}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{lang === "en" ? "Phone (E.164 or local)" : "Teléfono (E.164 o local)"}</Label>
              <Input value={business.phone ?? ""} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} placeholder="+591 707 ..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{lang === "en" ? "Currency" : "Moneda"}</Label>
              <Select value={business.currency} onValueChange={(v) => setBusiness({ ...business, currency: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{lang === "en" ? "Greeting (ES)" : "Saludo (ES)"}</Label>
              <Textarea rows={2} value={settings.whatsappGreetingEs} onChange={(e) => setSettings({ ...settings, whatsappGreetingEs: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Greeting (EN)</Label>
              <Textarea rows={2} value={settings.whatsappGreetingEn} onChange={(e) => setSettings({ ...settings, whatsappGreetingEn: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business profile (Task ID 6 — address / maps / instagram) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="size-4 text-primary" />{lang === "en" ? "Business profile" : "Perfil del negocio"}</CardTitle>
          <CardDescription>{lang === "en" ? "Address, maps, and social links." : "Dirección, mapas y redes sociales."}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{lang === "en" ? "Address" : "Dirección"}</Label>
            <Input value={business.address ?? ""} onChange={(e) => setBusiness({ ...business, address: e.target.value })} placeholder={lang === "en" ? "Av. San Martín 1234, Santa Cruz" : "Av. San Martín 1234, Santa Cruz"} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Google Maps URL" : "URL de Google Maps"}</Label>
            <Input value={business.googleMapsUrl ?? ""} onChange={(e) => setBusiness({ ...business, googleMapsUrl: e.target.value })} placeholder="https://maps.app.goo.gl/..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Instagram URL</Label>
            <Input value={business.instagramUrl ?? ""} onChange={(e) => setBusiness({ ...business, instagramUrl: e.target.value })} placeholder="https://instagram.com/lavadoatp" />
          </div>
        </CardContent>
      </Card>

      {/* Service area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><MapPin className="size-4 text-primary" />{lang === "en" ? "Service area" : "Zona de servicio"}</CardTitle>
          <CardDescription>{lang === "en" ? "Radius or named zones." : "Radio o zonas nombradas."}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="sa-mode"
                checked={sa.mode === "zones"}
                onChange={() => setBusiness({ ...business, serviceArea: { ...sa, mode: "zones" } })}
              />
              {lang === "en" ? "Zones (list)" : "Zonas (lista)"}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="sa-mode"
                checked={sa.mode === "radius"}
                onChange={() => setBusiness({ ...business, serviceArea: { ...sa, mode: "radius" } })}
              />
              {lang === "en" ? "Radius (km)" : "Radio (km)"}
            </label>
          </div>

          {sa.mode === "radius" ? (
            <div className="flex flex-col gap-1.5 sm:max-w-xs">
              <Label>{lang === "en" ? "Radius (km)" : "Radio (km)"}</Label>
              <Input
                type="number"
                value={String(sa.radius_km ?? "")}
                onChange={(e) => setBusiness({ ...business, serviceArea: { ...sa, mode: "radius", radius_km: Number(e.target.value) || 0 } })}
              />
            </div>
          ) : (
            <ZonesEditor zones={sa.zones ?? []} lang={lang} onChange={(zones) => setBusiness({ ...business, serviceArea: { ...sa, mode: "zones", zones } })} />
          )}
        </CardContent>
      </Card>

      {/* Quote calculator tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Calculator className="size-4 text-primary" />{lang === "en" ? "Quote calculator tiers" : "Niveles del cotizador"}</CardTitle>
          <CardDescription>{lang === "en" ? "Size buckets with multipliers." : "Rangos por tamaño con multiplicadores."}</CardDescription>
        </CardHeader>
        <CardContent>
          <TiersEditor
            tiers={tiers}
            lang={lang}
            onChange={(next) => setSettings({ ...settings, quoteCalculatorConfig: { tiers: next } })}
          />
        </CardContent>
      </Card>

      {/* Localization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="size-4 text-primary" />{lang === "en" ? "Localization" : "Localización"}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Default language" : "Idioma por defecto"}</Label>
            <Select value={(business.languages?.[0] ?? "es")} onValueChange={(v) => setBusiness({ ...business, languages: [v, v === "es" ? "en" : "es"] })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Timezone" : "Zona horaria"}</Label>
            <Select value={business.timezone} onValueChange={(v) => setBusiness({ ...business, timezone: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tracking IDs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><BarChart className="size-4 text-primary" />{lang === "en" ? "Tracking integrations" : "Integraciones de tracking"}</CardTitle>
          <CardDescription>{lang === "en" ? "Analytics IDs (optional)." : "IDs de analítica (opcional)."}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Google Analytics ID</Label>
            <Input value={settings.gaTrackingId ?? ""} onChange={(e) => setSettings({ ...settings, gaTrackingId: e.target.value })} placeholder="G-XXXXXXX" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Meta Pixel ID</Label>
            <Input value={settings.metaPixelId ?? ""} onChange={(e) => setSettings({ ...settings, metaPixelId: e.target.value })} placeholder="1234567890" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => void saveAll()} disabled={saving}>
          {saving ? <Spinner className="mr-2" /> : <Save className="size-4" />}
          {lang === "en" ? "Save all" : "Guardar todo"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
        <SettingsIcon className="size-3" />
        {data.business?.name ?? "lavadoatp"} · {lang === "en" ? "Settings" : "Configuración"}
      </p>
    </div>
  );
}

function ZonesEditor({ zones, lang, onChange }: { zones: string[]; lang: "es" | "en"; onChange: (z: string[]) => void }) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (zones.includes(v)) { setDraft(""); return; }
    onChange([...zones, v]);
    setDraft("");
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={lang === "en" ? "Zone name (e.g. Equipetrol)" : "Nombre de zona (p.ej. Equipetrol)"}
        />
        <Button type="button" variant="outline" onClick={add}>{lang === "en" ? "Add" : "Añadir"}</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {zones.length === 0 ? (
          <p className="text-sm text-muted-foreground">{lang === "en" ? "No zones yet." : "Sin zonas aún."}</p>
        ) : zones.map((z) => (
          <Badge key={z} variant="secondary" className="gap-1 pr-1">
            <MapPin className="size-3" />
            {z}
            <button
              onClick={() => onChange(zones.filter((x) => x !== z))}
              className="ml-1 rounded-full hover:bg-background/60 px-1"
              aria-label={lang === "en" ? `Remove ${z}` : `Quitar ${z}`}
            >×</button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

function TiersEditor({ tiers, lang, onChange }: { tiers: Tier[]; lang: "es" | "en"; onChange: (t: Tier[]) => void }) {
  const upd = (i: number, patch: Partial<Tier>) => {
    onChange(tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
        <span className="col-span-3">{lang === "en" ? "Label (ES)" : "Etiqueta (ES)"}</span>
        <span className="col-span-3">Label (EN)</span>
        <span className="col-span-3">{lang === "en" ? "Max sqm" : "m² máx"}</span>
        <span className="col-span-3">{lang === "en" ? "Multiplier" : "Multiplicador"}</span>
      </div>
      <Separator />
      {tiers.map((t, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <Input className="sm:col-span-3" value={t.label} onChange={(e) => upd(i, { label: e.target.value })} />
          <Input className="sm:col-span-3" value={t.labelEn} onChange={(e) => upd(i, { labelEn: e.target.value })} />
          <Input className="sm:col-span-3" type="number" value={String(t.sqmMax)} onChange={(e) => upd(i, { sqmMax: Number(e.target.value) || 0 })} />
          <Input className="sm:col-span-3" type="number" step="0.1" value={String(t.multiplier)} onChange={(e) => upd(i, { multiplier: Number(e.target.value) || 0 })} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => onChange([...tiers, { label: "", labelEn: "", sqmMax: 0, multiplier: 1 }])}>
        {lang === "en" ? "Add tier" : "Añadir nivel"}
      </Button>
    </div>
  );
}
