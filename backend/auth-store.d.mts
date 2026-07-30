export interface AuthTokenRequest {
  flow: 'login' | 'register' | 'forgot';
  channel: 'email' | 'phone';
  identifier: string;
  fullname?: string;
  password?: string;
}

export interface AuthTokenResponse {
  requestId: string;
  flow: 'login' | 'register' | 'forgot';
  channel: 'email' | 'phone';
  identifier: string;
  expiresAt: number;
  deliveryMessage: string;
  token: string;
}

export interface AuthTokenConfirmationRequest {
  requestId: string;
  token: string;
}

export interface AuthTokenVerificationRequest {
  identifier: string;
  token: string;
}

export interface AuthUser {
  identifier: string;
  fullname: string;
  channel: 'email' | 'phone';
  verifiedAt: string;
  status: 'active';
  passwordResetAt: string | null;
}

export interface AuthSession {
  sessionId: string;
  identifier: string;
  normalizedIdentifier: string;
  channel: 'email' | 'phone';
  flow: 'login' | 'register' | 'forgot';
  confirmedAt: string;
}

export interface AuthRequestSnapshot extends AuthTokenResponse {
  displayIdentifier: string;
  fullname: string;
  createdAt: number;
}

export interface AuthSnapshot {
  users: AuthUser[];
  sessions: AuthSession[];
  activeRequests: AuthRequestSnapshot[];
}

export interface AuthConfirmRegistrationResponse {
  ok: true;
  flow: 'register';
  identifier: string;
  channel: 'email' | 'phone';
  confirmedAt: string;
  user: AuthUser;
}

export interface AuthConfirmForgotResponse {
  ok: true;
  flow: 'forgot';
  identifier: string;
  channel: 'email' | 'phone';
  confirmedAt: string;
  passwordReset: true;
  userExists: boolean;
}

export interface AuthConfirmLoginResponse {
  ok: true;
  flow: 'login';
  identifier: string;
  channel: 'email' | 'phone';
  confirmedAt: string;
  session: AuthSession;
}

export type AuthConfirmResponse = AuthConfirmRegistrationResponse | AuthConfirmForgotResponse | AuthConfirmLoginResponse;

export interface AuthVerifyResponse {
  ok: true;
  identifier: string;
  channel: 'email' | 'phone';
  flow: 'login' | 'register' | 'forgot';
  expiresAt: number;
}

export function requestAuthToken(request: AuthTokenRequest): AuthTokenResponse;
export function confirmAuthToken(request: AuthTokenConfirmationRequest): AuthConfirmResponse;
export function verifyAuthToken(request: AuthTokenVerificationRequest): AuthVerifyResponse;
export function getAuthSnapshot(): AuthSnapshot;
export function resetAuthStore(): void;