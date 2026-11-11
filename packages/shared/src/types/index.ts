// =============================================================================
// Domain types — mirror the database schema in 001_initial_schema.sql
// =============================================================================

export type GuestPhase =
  | "UNKNOWN_CONTACT"
  | "ACQUIRING"
  | "BOOKING_RECEIVED"
  | "WELCOME_SENT"
  | "INFO_SENT"
  | "IDLE"
  | "UPSELL"
  | "PRE_CHECKIN"
  | "CHECKIN_DAY"
  | "IN_HOUSE"
  | "POST_STAY"
  | "ESCALATED";

export const GUEST_PHASES: readonly GuestPhase[] = [
  "UNKNOWN_CONTACT", "ACQUIRING", "BOOKING_RECEIVED",
  "WELCOME_SENT", "INFO_SENT", "IDLE", "UPSELL",
  "PRE_CHECKIN", "CHECKIN_DAY", "IN_HOUSE", "POST_STAY",
  "ESCALATED",
] as const;

export type VipLevel = "NONE" | "SILVER" | "GOLD" | "PLATINUM";
export type PmsType = "qloapps" | "mews" | "cloudbeds" | "apaleo" | "custom";
export type ReservationStatus =
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED"
  | "NO_SHOW";

export type IdentityDocumentType =
  | "PASSPORT"
  | "NATIONAL_ID"
  | "DRIVERS_LICENSE"
  | "OTHER";

export type AuditAction =
  | "READ"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "DSR_EXPORT"
  | "DSR_DELETE"
  | "SYNC";

export type UserRole = "Admin" | "RegionalManager" | "Receptionist";

export interface Tenant {
  tenantId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface User {
  userId: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  groups: UserRole[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Guest {
  guestId: string;
  tenantId: string;
  sourceRef: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  dateOfBirth: Date | null;
  nationality: string | null;
  language: string;
  addressLine1: string | null;
  addressLine2: string | null;
  addressLine3: string | null;
  addressLine4: string | null;
  city: string | null;
  state: string | null;
  province: string | null;
  county: string | null;
  postalCode: string | null;
  country: string | null;
  preferences: Record<string, unknown>;
  commPrefs: CommPrefs;
  vipLevel: VipLevel;
  totalStays: number;
  totalSpend: number;
  lastStayDate: Date | null;
  tags: string[] | null;
  mergedFromIds: string[] | null;
  guestPhase: GuestPhase;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CommPrefs {
  emailOptIn: boolean;
  smsOptIn: boolean;
  pushOptIn: boolean;
  marketingOptIn: boolean;
}

export interface Reservation {
  reservationId: string;
  guestId: string;
  tenantId: string;
  sourceRef: string | null;
  checkIn: Date;
  checkOut: Date;
  roomType: string | null;
  status: ReservationStatus;
  numGuests: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface GuestIdentityDocument {
  documentId: string;
  guestId: string;
  tenantId: string;
  type: IdentityDocumentType;
  documentNumber: Buffer;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface LoyaltyProfile {
  loyaltyId: string;
  guestId: string;
  tenantId: string;
  tier: VipLevel;
  pointsBalance: number;
  totalStays: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AuditLog {
  logId: string;
  tenantId: string;
  actorUserId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: Date;
}

export interface SyncState {
  tenantId: string;
  tableName: string;
  lastSeenXmin: bigint;
  whereClause: string | null;
  updatedAt: Date;
}

export interface AdapterConnection {
  connectionId: string;
  tenantId: string;
  pmsType: PmsType;
  connectionUrlEncrypted: Buffer;
  isReadOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
