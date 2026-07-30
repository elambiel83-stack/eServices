import { describe, expect, it, beforeEach } from 'vitest';
import {
  confirmAuthToken,
  getAuthSnapshot,
  requestAuthToken,
  resetAuthStore,
  verifyAuthToken
} from '../backend/auth-store.mjs';

beforeEach(() => {
  resetAuthStore();
});

describe('auth-store', () => {
  it('génère un token pour une demande de connexion', () => {
    const request = requestAuthToken({
      flow: 'login',
      channel: 'email',
      identifier: 'utilisateur@exemple.com'
    });

    expect(request.requestId).toBeTypeOf('string');
    expect(request.token).toHaveLength(6);
    expect(getAuthSnapshot().activeRequests).toHaveLength(1);
  });

  it('valide une inscription et crée un utilisateur', () => {
    const request = requestAuthToken({
      flow: 'register',
      channel: 'phone',
      identifier: '+33 6 12 34 56 78',
      fullname: 'Ada Lovelace',
      password: 'secret123'
    });

    const result = confirmAuthToken({
      requestId: request.requestId,
      token: request.token
    });

    expect(result.ok).toBe(true);
    expect(getAuthSnapshot().users).toHaveLength(1);
  });

  it('refuse un token invalide', () => {
    const request = requestAuthToken({
      flow: 'login',
      channel: 'email',
      identifier: 'client@exemple.com'
    });

    expect(() => confirmAuthToken({ requestId: request.requestId, token: '000000' })).toThrow('TOKEN_INVALID');
  });

  it('permet de vérifier un token par identifiant', () => {
    const request = requestAuthToken({
      flow: 'forgot',
      channel: 'email',
      identifier: 'client@exemple.com'
    });

    const verification = verifyAuthToken({
      identifier: 'client@exemple.com',
      token: request.token
    });

    expect(verification.ok).toBe(true);
  });
});
