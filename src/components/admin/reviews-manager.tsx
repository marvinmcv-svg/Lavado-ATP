"use client";
// Module 4.8 — Reviews: list with visible toggle (optimistic), flag, reply draft,
// request-review link, + Task ID 6: "Nueva reseña" create dialog.
import * as React from "react";
import { Star, Flag, Eye, EyeOff, MessageCircle, RefreshCw, Send, Plus } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { adminFetch, LoadingBlock, EmptyState, Spinner, fmtDate } from "./_shared";
import { buildWhatsAppUrl, normalizePhone, reviewRequestMessage } from "@/lib/whatsapp";
import type { PublicData } from "@/lib/public-data";
import type { Review } from "@/lib/types";

interface ReviewsResponse { reviews: Review[] }

type ReviewSource = "google" | "facebook" | "manual";

export function ReviewsManager({ data }: { data: PublicData }) {
  const lang = useLang((s) => s.lang);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [reqName, setReqName] = React.useState("");
  const [reqPhone, setReqPhone] = React.useState("");
  const [reqLink, setReqLink] = React.useState("https://g.page/r/lavadoatp/review");

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<ReviewsResponse>("/api/admin/reviews");
      setReviews(res.reviews);
    } catch (e) {
      toast.error(lang === "en" ? "Failed to load reviews" : "Error al cargar reseñas");
      void e;
    } finally {
      setLoading(false);
    }
  }, [lang]);

  React.useEffect(() => { void reload(); }, [reload]);

  const update = async (id: string, patch: Partial<Review>, msg?: string) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    try {
      await adminFetch(`/api/admin/reviews/${id}`, { method: "PUT", body: JSON.stringify(patch) });
      if (msg) toast.success(msg);
    } catch {
      toast.error(lang === "en" ? "Update failed" : "Error al actualizar");
      void reload();
    }
  };

  const avgRating = reviews.length === 0 ? 0 : reviews.reduce((s, r) => s + r.starRating, 0) / reviews.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_reviews")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {reviews.length} {lang === "en" ? "reviews" : "reseñas"} · {lang === "en" ? "avg" : "prom"} {avgRating.toFixed(1)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void reload()}><RefreshCw className="size-4" />{lang === "en" ? "Refresh" : "Actualizar"}</Button>
          <Button size="sm" onClick={() => setCreating(true)}><Plus className="size-4" />{lang === "en" ? "New review" : "Nueva reseña"}</Button>
        </div>
      </div>

      {/* Request review generator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Send className="size-4 text-primary" />{lang === "en" ? "Request a review" : "Pedir una reseña"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{lang === "en" ? "Customer name" : "Nombre cliente"}</Label>
              <Input value={reqName} onChange={(e) => setReqName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{lang === "en" ? "Phone" : "Teléfono"}</Label>
              <Input value={reqPhone} onChange={(e) => setReqPhone(e.target.value)} placeholder="+591 7..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{lang === "en" ? "Review link" : "Link de reseña"}</Label>
              <Input value={reqLink} onChange={(e) => setReqLink(e.target.value)} />
            </div>
          </div>
          <Button asChild className="mt-3" disabled={!reqPhone.trim()}>
            <a
              href={buildWhatsAppUrl(normalizePhone(reqPhone), reviewRequestMessage({ name: reqName || (lang === "en" ? "there" : ""), reviewLink: reqLink, lang }))}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" /> {lang === "en" ? "Open in WhatsApp" : "Abrir en WhatsApp"}
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Review list */}
      {loading ? (
        <Card><CardContent><LoadingBlock rows={5} /></CardContent></Card>
      ) : reviews.length === 0 ? (
        <Card><CardContent><EmptyState title={lang === "en" ? "No reviews" : "Sin reseñas"} /></CardContent></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} lang={lang} onUpdate={(patch, msg) => void update(r.id, patch, msg)} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {data.business?.name ?? "lavadoatp"}
      </p>

      {/* Task ID 6 — Create dialog */}
      <NewReviewDialog
        open={creating}
        lang={lang}
        onOpenChange={(o) => setCreating(o)}
        onCreated={() => { setCreating(false); void reload(); }}
      />
    </div>
  );
}

function ReviewCard({
  review, lang, onUpdate,
}: {
  review: Review;
  lang: "es" | "en";
  onUpdate: (patch: Partial<Review>, msg?: string) => void;
}) {
  const [draft, setDraft] = React.useState(review.replyDraft ?? "");
  React.useEffect(() => setDraft(review.replyDraft ?? ""), [review.replyDraft]);
  const [savingDraft, setSavingDraft] = React.useState(false);

  const saveDraft = async () => {
    setSavingDraft(true);
    await onUpdate({ replyDraft: draft }, lang === "en" ? "Reply saved" : "Respuesta guardada");
    setSavingDraft(false);
  };

  return (
    <Card className={review.flagged ? "border-rose-300" : ""}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{review.reviewerName}</span>
              <Badge variant="outline" className="text-[10px]">{review.source}</Badge>
              <span className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`size-3.5 ${i < review.starRating ? "fill-amber-400" : "text-muted-foreground/30"}`} />
                ))}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">{fmtDate(review.reviewDate)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.reviewText}</p>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 sm:w-44 shrink-0">
            <div className="flex items-center gap-2">
              <Switch
                id={`vis-${review.id}`}
                checked={review.visibleOnSite}
                onCheckedChange={(v) => onUpdate({ visibleOnSite: v }, v ? (lang === "en" ? "Now visible" : "Visible") : (lang === "en" ? "Hidden" : "Oculto"))}
              />
              <Label htmlFor={`vis-${review.id}`} className="text-xs">
                {review.visibleOnSite
                  ? (<span className="flex items-center gap-1"><Eye className="size-3.5" />{lang === "en" ? "Visible" : "Visible"}</span>)
                  : (<span className="flex items-center gap-1"><EyeOff className="size-3.5" />{lang === "en" ? "Hidden" : "Oculto"}</span>)}
              </Label>
            </div>
            <Button
              size="sm"
              variant={review.flagged ? "destructive" : "outline"}
              onClick={() => onUpdate({ flagged: !review.flagged }, review.flagged ? (lang === "en" ? "Unflagged" : "Desmarcado") : (lang === "en" ? "Flagged" : "Marcado"))}
            >
              <Flag className="size-3.5" />
              {review.flagged ? (lang === "en" ? "Flagged" : "Marcado") : (lang === "en" ? "Flag" : "Marcar")}
            </Button>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="flex flex-col gap-1.5">
          <Label>{lang === "en" ? "Reply draft" : "Borrador de respuesta"}</Label>
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder={lang === "en" ? "Draft a reply…" : "Escribe una respuesta…"} />
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => void saveDraft()} disabled={savingDraft}>
              {savingDraft ? <Spinner className="mr-2" /> : null}
              {lang === "en" ? "Save draft" : "Guardar borrador"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewReviewDialog({
  open, lang, onOpenChange, onCreated,
}: {
  open: boolean;
  lang: "es" | "en";
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [reviewerName, setReviewerName] = React.useState("");
  const [starRating, setStarRating] = React.useState(5);
  const [reviewText, setReviewText] = React.useState("");
  const [reviewDate, setReviewDate] = React.useState("");
  const [source, setSource] = React.useState<ReviewSource>("manual");
  const [visibleOnSite, setVisibleOnSite] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setReviewerName("");
    setStarRating(5);
    setReviewText("");
    setReviewDate(new Date().toISOString().slice(0, 10));
    setSource("manual");
    setVisibleOnSite(true);
  }, [open]);

  const onSave = async () => {
    if (!reviewerName.trim() || !reviewText.trim()) {
      toast.error(lang === "en" ? "Name and text required" : "Nombre y texto requeridos");
      return;
    }
    setSaving(true);
    try {
      await adminFetch("/api/admin/reviews", {
        method: "POST",
        body: JSON.stringify({
          reviewerName: reviewerName.trim(),
          starRating,
          reviewText: reviewText.trim(),
          reviewDate: reviewDate ? new Date(reviewDate).toISOString() : new Date().toISOString(),
          source,
          visibleOnSite,
        }),
      });
      toast.success(lang === "en" ? "Review created" : "Reseña creada");
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lang === "en" ? "New review" : "Nueva reseña"}</DialogTitle>
          <DialogDescription>{lang === "en" ? "Manually add a customer review." : "Agrega manualmente una reseña de cliente."}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{lang === "en" ? "Reviewer name" : "Nombre del revisor"}</Label>
            <Input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="María Pérez" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Star rating" : "Calificación"}</Label>
            <Select value={String(starRating)} onValueChange={(v) => setStarRating(Number(v))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {"★".repeat(n)}{"☆".repeat(5 - n)} ({n})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Source" : "Origen"}</Label>
            <Select value={source} onValueChange={(v) => setSource(v as ReviewSource)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="manual">{lang === "en" ? "Manual" : "Manual"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{lang === "en" ? "Date" : "Fecha"}</Label>
            <Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{lang === "en" ? "Review text" : "Texto de la reseña"}</Label>
            <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3} />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch id="rev-visible" checked={visibleOnSite} onCheckedChange={setVisibleOnSite} />
            <Label htmlFor="rev-visible">{lang === "en" ? "Visible on site" : "Visible en el sitio"}</Label>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>{lang === "en" ? "Cancel" : "Cancelar"}</Button>
          </DialogClose>
          <Button onClick={() => void onSave()} disabled={saving}>
            {saving ? <Spinner className="mr-2" /> : null}
            {lang === "en" ? "Create" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
