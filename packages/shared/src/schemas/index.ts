import { z } from "zod";

export const guestPhaseSchema = z.enum([
  "UNKNOWN_CONTACT", "ACQUIRING", "BOOKING_RECEIVED",
  "WELCOME_SENT", "INFO_SENT", "IDLE", "UPSELL",
  "PRE_CHECKIN", "CHECKIN_DAY", "IN_HOUSE", "POST_STAY",
  "ESCALATED",
]);

export const vipLevelSchema = z.enum(["NONE", "SILVER", "GOLD", "PLATINUM"]);

export const pmsTypeSchema = z.enum([
  "qloapps", "mews", "cloudbeds", "apaleo", "custom",
]);

export const reservationStatusSchema = z.enum([
  "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW",
]);

export const identityDocumentTypeSchema = z.enum([
  "PASSPORT", "NATIONAL_ID", "DRIVERS_LICENSE", "OTHER",
]);

export const auditActionSchema = z.enum([
  "READ", "CREATE", "UPDATE", "DELETE", "DSR_EXPORT", "DSR_DELETE", "SYNC",
]);

export const userRoleSchema = z.enum(["Admin", "RegionalManager", "Receptionist"]);

export const createGuestRequestSchema = z.object({
  firstName: z.string().min(1).max(32),
  lastName: z.string().min(1).max(32),
  email: z.string().email().max(128),
  phone: z.string().max(32).optional(),
  dateOfBirth: z.string().date().optional(),
  preferences: z.record(z.unknown()).optional(),
  commPrefs: z.object({
    emailOptIn: z.boolean().optional().default(true),
    smsOptIn: z.boolean().optional().default(false),
    pushOptIn: z.boolean().optional().default(false),
    marketingOptIn: z.boolean().optional().default(false),
  }).optional(),
});

export type CreateGuestRequest = z.infer<typeof createGuestRequestSchema>;

export const updateGuestRequestSchema = createGuestRequestSchema.partial();

export type UpdateGuestRequest = z.infer<typeof updateGuestRequestSchema>;

export const registerUserRequestSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(12).max(128),
  groups: z.array(userRoleSchema).min(1),
  tenantId: z.string().uuid(),
});

export type RegisterUserRequest = z.infer<typeof registerUserRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  metadata?: { page?: number; limit?: number; total?: number };
}

export const SENSITIVE_GUEST_FIELDS = [
  "identity_doc_type",
  "identity_doc_number",
  "identity_doc_expiry",
] as const;
