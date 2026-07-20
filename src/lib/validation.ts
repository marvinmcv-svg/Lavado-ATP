// Zod validation schemas for all API boundaries (Phase 2 requirement).
import { z } from "zod";

export const serviceCreateSchema = z.object({
  categoryId: z.string().min(1),
  nameEs: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
  descriptionEs: z.string().max(500).optional().default(""),
  descriptionEn: z.string().max(500).optional().default(""),
  priceType: z.enum(["fixed", "starting_at", "quote_only"]).default("starting_at"),
  price: z.number().min(0).nullable().optional(),
  currency: z.string().max(5).default("BOB"),
  available: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  beforePhotoUrl: z.string().url().nullable().optional(),
  afterPhotoUrl: z.string().url().nullable().optional(),
});

export const serviceUpdateSchema = z.object({
  nameEs: z.string().min(1).max(120).optional(),
  nameEn: z.string().min(1).max(120).optional(),
  descriptionEs: z.string().max(500).optional(),
  descriptionEn: z.string().max(500).optional(),
  priceType: z.enum(["fixed", "starting_at", "quote_only"]).optional(),
  price: z.number().min(0).nullable().optional(),
  currency: z.string().max(5).optional(),
  available: z.boolean().optional(),
  beforePhotoUrl: z.string().url().nullable().optional(),
  afterPhotoUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  videoPosterUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const bookingCreateSchema = z.object({
  customerName: z.string().min(1).max(120),
  customerPhone: z.string().min(1).max(30),
  serviceId: z.string().nullable().optional(),
  propertyAddress: z.string().max(300).optional().default(""),
  propertySizeSqm: z.number().min(0).nullable().optional(),
  scheduledAt: z.string().or(z.date()),
  crewAssigned: z.string().nullable().optional(),
  quotedAmount: z.number().min(0).nullable().optional(),
  specialRequests: z.string().max(500).nullable().optional(),
  zone: z.string().max(80).nullable().optional(),
  depositAmount: z.number().min(0).optional().default(0),
});

export const bookingUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled"]).optional(),
  crewAssigned: z.string().nullable().optional(),
  scheduledAt: z.string().or(z.date()).optional(),
  quotedAmount: z.number().min(0).nullable().optional(),
  depositAmount: z.number().min(0).optional(),
  depositPaid: z.boolean().optional(),
});

export const customerCreateSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(1).max(30),
  email: z.string().email().nullable().optional(),
  propertyType: z.enum(["residential", "commercial"]).default("residential"),
  address: z.string().max(300).nullable().optional(),
  tags: z.array(z.string()).optional(),
  internalNotes: z.string().max(1000).nullable().optional(),
});

export const customerUpdateSchema = customerCreateSchema.partial();

export const reviewCreateSchema = z.object({
  reviewerName: z.string().min(1).max(120),
  starRating: z.number().int().min(1).max(5),
  reviewText: z.string().min(1).max(1000),
  reviewDate: z.string().or(z.date()).optional(),
  source: z.string().max(30).default("manual"),
  visibleOnSite: z.boolean().default(true),
});

export const leadCreateSchema = z.object({
  source: z.enum(["whatsapp_widget", "contact_form", "quote_calculator", "direct_call"]).default("whatsapp_widget"),
  name: z.string().max(120).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().nullable().optional(),
  message: z.string().max(1000).nullable().optional(),
  zone: z.string().max(80).nullable().optional(),
  serviceType: z.string().max(80).nullable().optional(),
  propertySize: z.string().max(40).nullable().optional(),
});

export const leadUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "converted", "closed"]).optional(),
  assignedTo: z.string().nullable().optional(),
});

export const categoryCreateSchema = z.object({
  nameEs: z.string().min(1).max(60),
  nameEn: z.string().min(1).max(60),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const galleryCreateSchema = z.object({
  mediaUrl: z.string().min(1).max(500),
  mediaType: z.enum(["photo", "video"]),
  source: z.enum(["instagram", "upload"]).default("upload"),
  isBeforeAfter: z.boolean().default(false),
  pairId: z.string().nullable().optional(),
  pairRole: z.enum(["before", "after"]).nullable().optional(),
  captionEs: z.string().max(200).nullable().optional(),
  captionEn: z.string().max(200).nullable().optional(),
  posterUrl: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const staffCreateSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  role: z.enum(["owner", "manager", "crew"]),
});

export const trackEventSchema = z.object({
  eventType: z.string().min(1).max(60),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function validate<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.issues[0];
  return {
    success: false,
    error: `${firstError.path.join(".")}: ${firstError.message}`,
  };
}
