"use client";
// Social proof (Step 3.7) — visible reviews + average rating.
import { Star, Quote, MessageCircle } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Review } from "@/lib/types";

function StarRow({ rating, size = "size-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export function Reviews({ reviews, average }: { reviews: Review[]; average: number }) {
  const lang = useLang((s) => s.lang);

  if (reviews.length === 0) return null;

  return (
    <section id="reviews" className="py-16 sm:py-24 scroll-mt-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="secondary" className="mb-3">
            <Star className="size-3.5 mr-1 fill-amber-400 text-amber-400" /> {lang === "en" ? "Reviews" : "Reseñas"}
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">{t(lang, "reviews_title")}</h2>
          <p className="mt-3 text-muted-foreground text-lg">{t(lang, "reviews_subtitle")}</p>

          {/* Average */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-secondary px-5 py-2.5">
            <span className="text-3xl font-black">{average.toFixed(1)}</span>
            <div className="flex flex-col items-start">
              <StarRow rating={Math.round(average)} />
              <span className="text-xs text-muted-foreground mt-0.5">
                {t(lang, "reviews_based_on")} {reviews.length} {t(lang, "reviews_count")}
              </span>
            </div>
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {reviews.map((r) => (
            <Card key={r.id} className="p-6 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <Quote className="size-8 text-primary/20" />
                <StarRow rating={r.starRating} />
              </div>
              <p className="text-sm text-foreground leading-relaxed flex-1">“{r.reviewText}”</p>
              <div className="mt-4 flex items-center gap-3 pt-4 border-t border-border">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {r.reviewerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{r.reviewerName}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {r.source} · {new Date(r.reviewDate).toLocaleDateString(lang === "en" ? "en-US" : "es-BO", { month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-muted-foreground mb-3">{lang === "en" ? "Become our next happy customer" : "Sé nuestro próximo cliente feliz"}</p>
          <a href="#quote" className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors">
            <MessageCircle className="size-5" /> {lang === "en" ? "Get your free quote" : "Pide tu cotización gratis"}
          </a>
        </div>
      </div>
    </section>
  );
}
