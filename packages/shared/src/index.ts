// =============================================================================
// @gps/shared — public exports
// =============================================================================
// Re-export everything from the submodules. Explicit named exports (rather
// than `export *`) make the module's surface statically known to bundlers
// like Turbopack/webpack, which avoids "module has no exports" errors.

// Types
export type {
  GuestPhase,
  VipLevel,
  PmsType,
  ReservationStatus,
  IdentityDocumentType,
  AuditAction,
  UserRole,
  Tenant,
  TenantSettings,
  User,
  Guest,
  CommPrefs,
  Reservation,
  GuestVisit,
  GuestIdentityDocument,
  LoyaltyProfile,
  AuditLog,
  SyncState,
  AdapterConnection,
} from "./types/index";

export { GUEST_PHASES } from "./types/index";

// Schemas (Zod)
export {
  guestPhaseSchema,
  vipLevelSchema,
  pmsTypeSchema,
  reservationStatusSchema,
  identityDocumentTypeSchema,
  auditActionSchema,
  userRoleSchema,
  createGuestRequestSchema,
  updateGuestRequestSchema,
  registerUserRequestSchema,
  loginRequestSchema,
  SENSITIVE_GUEST_FIELDS,
} from "./schemas/index";

export type {
  CreateGuestRequest,
  UpdateGuestRequest,
  RegisterUserRequest,
  LoginRequest,
  ApiResponse,
} from "./schemas/index";

// Auth
export { hashPassword, verifyPassword, getHashOptions } from "./auth/password";
export { issueJwt, verifyJwt, getExpiresInSeconds } from "./auth/jwt";
export type { JwtClaims } from "./auth/jwt";
export { resolveTenantScope, verifyTenantAccess, ForbiddenError } from "./auth/tenant-scope";
export type { TenantScope } from "./auth/tenant-scope";

// DB
export { getDb, closeDb } from "./db/client";
export type { Db } from "./db/client";
