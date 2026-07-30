import { createHash, randomInt, randomUUID } from 'node:crypto';

const TOKEN_TTL_MS = 5 * 60 * 1000;
const RESET_TTL_MS = 8 * 60 * 1000;

const authState = {
  requests: new Map(),
  users: new Map(),
  sessions: new Map()
};

function normalizeIdentifier(identifier) {
  return identifier.trim().replace(/\s+/g, ' ').toLowerCase();
}

function hashSecret(secret) {
  return createHash('sha256').update(secret).digest('hex');
}

function createToken() {
  return String(randomInt(100000, 1000000));
}

function createRequestMessage(flow, channel, identifier, token) {
  const channelLabel = channel === 'email' ? 'e-mail' : 'SMS';

  if (flow === 'register') {
    return `Code d'inscription envoyé par ${channelLabel} à ${identifier}. Token: ${token}.`;
  }

  if (flow === 'forgot') {
    return `Code de récupération envoyé par ${channelLabel} à ${identifier}. Token: ${token}.`;
  }

  return `Code de connexion envoyé par ${channelLabel} à ${identifier}. Token: ${token}.`;
}

function buildPublicRequest(request) {
  return {
    requestId: request.requestId,
    flow: request.flow,
    channel: request.channel,
    identifier: request.identifier,
    expiresAt: request.expiresAt,
    deliveryMessage: request.deliveryMessage,
    token: request.token
  };
}

function cleanupExpiredRequests() {
  const now = Date.now();
  for (const [requestId, request] of authState.requests.entries()) {
    if (request.expiresAt <= now) {
      authState.requests.delete(requestId);
    }
  }
}

function ensureRequest(requestId) {
  cleanupExpiredRequests();
  const request = authState.requests.get(requestId);

  if (!request) {
    const error = new Error('REQUEST_NOT_FOUND');
    error.statusCode = 404;
    throw error;
  }

  if (request.expiresAt <= Date.now()) {
    authState.requests.delete(requestId);
    const error = new Error('TOKEN_EXPIRED');
    error.statusCode = 410;
    throw error;
  }

  return request;
}

export function requestAuthToken({ flow, channel, identifier, fullname = '', password = '' }) {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!flow || !channel || !normalizedIdentifier) {
    const error = new Error('INVALID_AUTH_REQUEST');
    error.statusCode = 400;
    throw error;
  }

  const request = {
    requestId: randomUUID(),
    flow,
    channel,
    identifier: normalizedIdentifier,
    displayIdentifier: identifier.trim(),
    fullname: fullname.trim(),
    passwordHash: password ? hashSecret(password) : '',
    token: createToken(),
    expiresAt: Date.now() + (flow === 'forgot' ? RESET_TTL_MS : TOKEN_TTL_MS),
    createdAt: Date.now(),
    deliveryMessage: ''
  };

  request.deliveryMessage = createRequestMessage(flow, channel, request.displayIdentifier, request.token);
  authState.requests.set(request.requestId, request);

  return buildPublicRequest(request);
}

export function confirmAuthToken({ requestId, token }) {
  if (!requestId || !token) {
    const error = new Error('INVALID_CONFIRMATION');
    error.statusCode = 400;
    throw error;
  }

  const request = ensureRequest(requestId);

  if (request.token !== String(token).trim()) {
    const error = new Error('TOKEN_INVALID');
    error.statusCode = 401;
    throw error;
  }

  authState.requests.delete(requestId);

  const confirmedAt = new Date().toISOString();
  const normalizedIdentifier = request.identifier;

  if (request.flow === 'register') {
    const existingUser = authState.users.get(normalizedIdentifier);
    const user = {
      identifier: request.displayIdentifier,
      normalizedIdentifier,
      fullname: request.fullname || existingUser?.fullname || '',
      channel: request.channel,
      passwordHash: request.passwordHash || existingUser?.passwordHash || '',
      verifiedAt: confirmedAt,
      status: 'active'
    };
    authState.users.set(normalizedIdentifier, user);

    return {
      ok: true,
      flow: request.flow,
      identifier: request.displayIdentifier,
      channel: request.channel,
      confirmedAt,
      user
    };
  }

  if (request.flow === 'forgot') {
    const existingUser = authState.users.get(normalizedIdentifier);
    if (existingUser) {
      existingUser.passwordResetAt = confirmedAt;
      authState.users.set(normalizedIdentifier, existingUser);
    }

    return {
      ok: true,
      flow: request.flow,
      identifier: request.displayIdentifier,
      channel: request.channel,
      confirmedAt,
      passwordReset: true,
      userExists: Boolean(existingUser)
    };
  }

  const session = {
    sessionId: randomUUID(),
    identifier: request.displayIdentifier,
    normalizedIdentifier,
    channel: request.channel,
    flow: request.flow,
    confirmedAt
  };

  authState.sessions.set(session.sessionId, session);

  return {
    ok: true,
    flow: request.flow,
    identifier: request.displayIdentifier,
    channel: request.channel,
    confirmedAt,
    session
  };
}

export function verifyAuthToken({ identifier, token }) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const normalizedToken = String(token).trim();
  cleanupExpiredRequests();

  for (const request of authState.requests.values()) {
    if (request.identifier === normalizedIdentifier && request.token === normalizedToken) {
      return {
        ok: true,
        identifier: request.displayIdentifier,
        channel: request.channel,
        flow: request.flow,
        expiresAt: request.expiresAt
      };
    }
  }

  const error = new Error('TOKEN_NOT_FOUND');
  error.statusCode = 404;
  throw error;
}

export function getAuthSnapshot() {
  cleanupExpiredRequests();

  return {
    users: Array.from(authState.users.values()).map((user) => ({
      identifier: user.identifier,
      fullname: user.fullname,
      channel: user.channel,
      verifiedAt: user.verifiedAt,
      status: user.status,
      passwordResetAt: user.passwordResetAt ?? null
    })),
    sessions: Array.from(authState.sessions.values()),
    activeRequests: Array.from(authState.requests.values()).map((request) => buildPublicRequest(request))
  };
}

export function resetAuthStore() {
  authState.requests.clear();
  authState.users.clear();
  authState.sessions.clear();
}
