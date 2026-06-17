export interface ApiError {
  code: string;
  message: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  requestId: string;
  error?: ApiError;
}

export type UserRole = 'traveler' | 'operator' | 'admin';
export type UserStatus = 'pending' | 'active' | 'disabled';
export type ContentStatus = 'draft' | 'published';
export type ContentReviewState = 'draft' | 'approved';

export interface HealthPayload {
  service: 'visepanda-api';
  status: 'ok';
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSessionPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
}

export interface SessionVerificationPayload {
  isValid: true;
  sessionId: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
}

export type AuthTokenPurpose = 'email_verification' | 'password_reset';
export type AuthTokenStatus = 'pending' | 'used';

export interface AuthTokenPayload {
  purpose: AuthTokenPurpose;
  token: string;
  tokenStatus: AuthTokenStatus;
}

export interface EmailVerificationResultPayload {
  verified: true;
  tokenStatus: 'used';
}

export interface PasswordResetResultPayload {
  passwordReset: true;
  tokenStatus: 'used';
}

export interface DestinationSummary {
  id: string;
  slug: string;
  name: string;
  summary: string;
  locale: string;
}

export interface DestinationDetail extends DestinationSummary {
  body: string;
  highlights: string[];
  versionNo: number;
  publishedAt: string | null;
}

export interface ToolGuideSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  locale: string;
}

export interface ToolGuideDetail extends ToolGuideSummary {
  body: string;
  tags: string[];
  versionNo: number;
  publishedAt: string | null;
}

export type AITaskType = 'chat_travel_advice' | 'trip_planning';
export type AIModelStatus = 'active' | 'disabled';

export interface AIChatRequest {
  message: string;
  locale?: string;
  tripContextId?: string;
  promptTemplateVersion?: string;
}

export interface AITripPlanRequest {
  destination: string;
  days: number;
  interests?: string[];
  locale?: string;
  promptTemplateVersion?: string;
}

export interface AIInvocationPayload {
  answer: string;
  taskType: AITaskType;
  model: string;
  provider: string;
  routePolicy: string;
  promptTemplateVersion: string;
  logId: string;
  fallbackUsed: boolean;
  attemptCount: number;
}

export type AIChatPayload = AIInvocationPayload;
export type AITripPlanPayload = AIInvocationPayload;

export interface AIModelSummary {
  id: string;
  provider: string;
  model: string;
  capabilities: string[];
  priority: number;
  status: AIModelStatus;
}

export interface AIRouteSummary {
  taskType: AITaskType;
  routePolicy: string;
  primaryModelId: string;
  fallbackModelIds: string[];
  promptTemplateVersion: string;
}

export type TripStatus = 'draft' | 'active' | 'archived';
export type TripSourceType = 'chat' | 'task';

export interface TripItemPayload {
  id: string;
  type: string;
  title: string;
  startTime: string;
  endTime: string;
  notes: string;
}

export interface TripDayPayload {
  id: string;
  dayNumber: number;
  title: string;
  items: TripItemPayload[];
}

export interface GenerationRecordPayload {
  id: string;
  sourceType: TripSourceType;
  invocationLogId: string;
  taskType: AITaskType;
}

export interface TripSummary {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  dayCount: number;
  isFavorite: boolean;
  updatedAt: string;
}

export interface TripDetail {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  aiSummary: string;
  isFavorite: boolean;
  snapshotCount: number;
  latestSnapshotId: string | null;
  days: TripDayPayload[];
  generationRecord: GenerationRecordPayload | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripSnapshotSummary {
  id: string;
  tripId: string;
  version: number;
  reason: string | null;
  createdAt: string;
}
