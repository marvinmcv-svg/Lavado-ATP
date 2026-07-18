// Shared types for client/server data contracts.

export type Lang = "es" | "en";
export type PriceType = "fixed" | "starting_at" | "quote_only";
export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "closed";
export type LeadSource = "whatsapp_widget" | "contact_form" | "quote_calculator" | "direct_call";
export type StaffRole = "owner" | "manager" | "crew";

export interface ServiceArea {
  mode: "radius" | "zones";
  radius_km?: number;
  center_lat?: number;
  center_lng?: number;
  zones?: string[];
}

export interface OpeningHours {
  mon?: { open: string | null; close: string | null };
  tue?: { open: string | null; close: string | null };
  wed?: { open: string | null; close: string | null };
  thu?: { open: string | null; close: string | null };
  fri?: { open: string | null; close: string | null };
  sat?: { open: string | null; close: string | null };
  sun?: { open: string | null; close: string | null };
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  googleMapsUrl: string | null;
  serviceArea: ServiceArea | null;
  openingHours: OpeningHours | null;
  serviceType: string | null;
  languages: string[] | null;
  brandColors: { primary: string; secondary: string; accent: string } | null;
  logoUrl: string | null;
  timezone: string;
  currency: string;
  instagramUrl: string | null;
}

export interface SiteSettings {
  id: string;
  businessId: string;
  heroHeadlineEs: string;
  heroHeadlineEn: string;
  heroSubheadlineEs: string;
  heroSubheadlineEn: string;
  heroImageUrl: string | null;
  heroVideoUrl: string | null;
  heroVideoPosterUrl: string | null;
  ctaTextEs: string;
  ctaTextEn: string;
  announcementBarTextEs: string | null;
  announcementBarTextEn: string | null;
  announcementBarActive: boolean;
  whatsappGreetingEs: string;
  whatsappGreetingEn: string;
  quoteCalculatorConfig: { tiers: { label: string; labelEn: string; sqmMax: number; multiplier: number }[] } | null;
  gaTrackingId: string | null;
  metaPixelId: string | null;
}

export interface ServiceCategory {
  id: string;
  businessId: string;
  nameEs: string;
  nameEn: string;
  sortOrder: number;
  active: boolean;
}

export interface Service {
  id: string;
  categoryId: string;
  businessId: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  priceType: PriceType;
  price: number | null;
  currency: string;
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  videoUrl: string | null;
  videoPosterUrl: string | null;
  available: boolean;
  sortOrder: number;
}

export interface GalleryItem {
  id: string;
  businessId: string;
  mediaUrl: string;
  mediaType: "photo" | "video";
  source: "instagram" | "upload";
  isBeforeAfter: boolean;
  pairId: string | null;
  pairRole: "before" | "after" | null;
  captionEs: string | null;
  captionEn: string | null;
  posterUrl: string | null;
  serviceId: string | null;
  sortOrder: number;
  active: boolean;
}

export interface BeforeAfterPair {
  pairId: string;
  before: GalleryItem;
  after: GalleryItem;
}

export interface Review {
  id: string;
  businessId: string;
  source: string;
  reviewerName: string;
  starRating: number;
  reviewText: string;
  reviewDate: string;
  visibleOnSite: boolean;
  flagged: boolean;
  replyDraft: string | null;
}

export interface Booking {
  id: string;
  businessId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  serviceId: string | null;
  propertyAddress: string;
  propertySizeSqm: number | null;
  scheduledAt: string;
  status: BookingStatus;
  crewAssigned: string | null;
  specialRequests: string | null;
  quotedAmount: number | null;
  depositAmount: number;
  depositPaid: boolean;
  zone: string | null;
  service?: Service | null;
  customer?: Customer | null;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string | null;
  propertyType: "residential" | "commercial";
  address: string | null;
  visitCount: number;
  totalSpend: number;
  tags: string[] | null;
  internalNotes: string | null;
  createdAt: string;
  bookings?: Booking[];
}

export interface Lead {
  id: string;
  businessId: string;
  source: LeadSource;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  zone: string | null;
  serviceType: string | null;
  propertySize: string | null;
  status: LeadStatus;
  assignedTo: string | null;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  businessId: string;
  userId: string;
  role: StaffRole;
  name: string;
  email: string;
  active: boolean;
}

export interface AuditLog {
  id: string;
  businessId: string;
  actorName: string | null;
  action: string;
  tableName: string | null;
  recordId: string | null;
  createdAt: string;
}
