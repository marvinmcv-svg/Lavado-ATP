"use client";
// Public site assembly — composes all public sections from server-fetched data.
import { AnnouncementBar } from "./announcement-bar";
import { Header } from "./header";
import { Hero } from "./hero";
import { Services } from "./services";
import { BeforeAfter } from "./before-after";
import { VideoReels } from "./video-reels";
import { QuoteCalculator } from "./quote-calculator";
import { ServiceArea } from "./service-area";
import { Reviews } from "./reviews";
import { Footer } from "./footer";
import { WhatsAppWidget } from "./whatsapp-widget";
import type { Business, ServiceCategory, Service, BeforeAfterPair, GalleryItem, Review, SiteSettings } from "@/lib/types";

export function PublicSite({
  business,
  settings,
  categories,
  services,
  pairs,
  reels,
  reviews,
  reviewAverage,
  onAdminClick,
}: {
  business: Business;
  settings: SiteSettings | null;
  categories: ServiceCategory[];
  services: Service[];
  pairs: BeforeAfterPair[];
  reels: GalleryItem[];
  reviews: Review[];
  reviewAverage: number;
  onAdminClick: () => void;
}) {
  const heroImage = pairs[0]?.after.mediaUrl ?? services.find((s) => s.afterPhotoUrl)?.afterPhotoUrl ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar settings={settings} />
      <Header onAdminClick={onAdminClick} business={business} />
      <main className="flex-1">
        <Hero
          business={business}
          settings={settings}
          reviews={reviews}
          heroImage={heroImage}
        />
        <Services business={business} categories={categories} services={services} />
        {pairs.length > 0 && <BeforeAfter pairs={pairs} />}
        {reels.length > 0 && <VideoReels reels={reels} />}
        <QuoteCalculator business={business} settings={settings} services={services} />
        <ServiceArea business={business} />
        {reviews.length > 0 && <Reviews reviews={reviews} average={reviewAverage} />}
      </main>
      <Footer business={business} settings={settings} />
      <WhatsAppWidget business={business} settings={settings} />
    </div>
  );
}
