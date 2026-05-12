export { calculateTripCost } from './cost/calculator';
export { COST_DEFAULTS } from './cost/constants';
export { IRISH_TOLLS } from './cost/tolls';
export {
  CIVIL_SERVICE_RATES,
  classifyEngine,
  classifyBand,
  getBenchmarkPerKm,
} from './cost/benchmark';
export type { EngineClass, BandId } from './cost/benchmark';
export type {
  CostInput,
  CostBreakdown,
  CeilingBreakdown,
  PerKmComponents,
  VehicleProfile,
  TollItem,
} from './cost/types';

export { haversineDistance } from './geo/distance';

export { vehicleSchema } from './validation/vehicle';
export type { VehicleInput } from './validation/vehicle';
export { createTripSchema } from './validation/trip';
export type { CreateTripInput } from './validation/trip';
export { createBookingSchema } from './validation/booking';
export type { CreateBookingInput } from './validation/booking';
export { updateProfileSchema, registerSchema } from './validation/user';
export type { UpdateProfileInput, RegisterInput } from './validation/user';
export {
  recurrencePatternSchema,
  createRecurringTripSchema,
} from './validation/recurrence';
export type {
  RecurrencePatternInput,
  CreateRecurringTripInput,
} from './validation/recurrence';

export {
  generateRecurrenceInstances,
  IRISH_SCHOOL_TERMS,
  DEFAULT_TIMEZONE,
} from './recurrence';
export type {
  RecurrencePattern,
  RecurrenceInstance,
  RecurrenceCategory,
  DayOfWeek,
} from './recurrence';

export {
  DRIVER_DECLARATIONS,
  ACTIVITY_LIMITS,
  checkPublishGuards,
  checkBookingArrangement,
} from './compliance';
export type { ActivitySnapshot, GuardOutcome } from './compliance';

export {
  googleMapsDirections,
  wazeNavigate,
  appleMapsDirections,
  buildDirectionsForProvider,
} from './maps';
export type { LatLng, DeepLink, MapsProvider } from './maps';

export {
  VERIFICATION_PROVIDERS,
  providersFor,
  VERIFICATION_POLICY,
  bestRecord,
  findGapsForAction,
  canPerformAction,
} from './identity';
export type {
  VerificationProvider,
  VerificationProviderId,
  VerificationRecord,
  VerificationStatus,
  VerificationSubject,
  Action,
  VerificationGap,
} from './identity';

export {
  transition,
  isTerminal,
  isOpen,
  describePhase,
  PLATFORM_FEE_EUR,
  feeAppliesTo,
  computeSettlement,
} from './booking';
export type {
  EscrowPhase,
  EscrowState,
  EscrowEvent,
  EscrowActor,
  BookingFinancials,
  Settlement,
} from './booking';

export { DEFAULT_CHARITIES, activeCharities } from './charity';
export type { Charity } from './charity';

export {
  aggregateRatings,
  trustScore,
  isRoleSuspended,
  RATING_THRESHOLDS,
} from './ratings';
export type {
  Rating,
  RatingInput,
  RatingDirection,
  AggregateRating,
} from './ratings';

export {
  CO2_G_PER_KM_PRIVATE_CAR,
  carbonAvoidedKg,
  equivalentTreesPlanted,
  summariseDriverImpact,
  ACTIVITY_THRESHOLDS,
  isActivityVerified,
  activityProgress,
} from './metrics';
export type { ImpactSummary, ActivityProfile } from './metrics';

export {
  DRIVER_PLANS,
  planById,
  DRIVER_TRIP_FEE_EUR,
  MIN_INVOICE_TOTAL_EUR,
  STRIPE_FEES,
  summariseFeeAccruals,
  shouldInvoiceNow,
  estimateStripeFee,
  TOPUP_PACKS_EUR,
  MIN_TOPUP_EUR,
  AUTO_TOPUP_THRESHOLD_EUR,
  FREE_DRIVER_TRIPS,
  WALLET_INACTIVITY_EXPIRY_MONTHS,
  REFUND_ADMIN_FEE_EUR,
  newWallet,
  shouldAutoTopUp,
  effectivePerTripCost,
  freeTripsRemaining,
  topUpBonusFor,
  topUpCreditFor,
  quoteWalletRefund,
  walletHasExpired,
} from './billing';
export type {
  DriverPlan,
  FeeAccrual,
  DriverFeeSummary,
  BillingMechanism,
  BillingMandate,
  FeeEstimate,
  Wallet,
  TopUpEvent,
  TopUpAmount,
  RefundQuote,
} from './billing';

export type { FuelType, TripStatus, BookingStatus } from './types/enums';
export type * from './types/api';
