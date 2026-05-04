import { describe, it, expect } from 'vitest';
import {
  isInvalidAuthStorageError,
  humanAuthErrorMessage,
} from './authSessionRecovery';

describe('isInvalidAuthStorageError', () => {
  it('returns true for AuthApiError invalid refresh token', () => {
    expect(
      isInvalidAuthStorageError({
        name: 'AuthApiError',
        message: 'Invalid Refresh Token: Refresh Token Not Found',
      }),
    ).toBe(true);
  });

  it('returns true for refresh_token_not_found code', () => {
    expect(
      isInvalidAuthStorageError({
        code: 'refresh_token_not_found',
        message: 'x',
      }),
    ).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isInvalidAuthStorageError({ message: 'Rate limited' })).toBe(false);
    expect(isInvalidAuthStorageError(null)).toBe(false);
  });
});

describe('humanAuthErrorMessage', () => {
  it('maps invalid refresh to friendly copy', () => {
    const m = humanAuthErrorMessage({
      name: 'AuthApiError',
      message: 'Invalid Refresh Token: Refresh Token Not Found',
    });
    expect(m).toContain('no longer valid');
  });

  it('maps network-ish errors', () => {
    expect(humanAuthErrorMessage({ message: 'Failed to fetch' })).toContain('connection');
  });

  it('maps 404 hints', () => {
    expect(humanAuthErrorMessage({ message: 'Request failed with status 404' })).toContain('404');
  });
});
