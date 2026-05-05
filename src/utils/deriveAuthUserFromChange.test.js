import { describe, it, expect } from 'vitest';
import { deriveAuthUserFromChange } from './deriveAuthUserFromChange';

describe('deriveAuthUserFromChange', () => {
  it('clears on SIGNED_OUT', () => {
    expect(deriveAuthUserFromChange('SIGNED_OUT', null)).toEqual({ kind: 'clear' });
  });

  it('sets user when session present', () => {
    const u = { id: 'x', email: 'a@b.c' };
    expect(deriveAuthUserFromChange('SIGNED_IN', { user: u })).toEqual({ kind: 'set', user: u });
    expect(deriveAuthUserFromChange('TOKEN_REFRESHED', { user: u })).toEqual({ kind: 'set', user: u });
  });

  it('skips on INITIAL_SESSION null', () => {
    expect(deriveAuthUserFromChange('INITIAL_SESSION', null)).toEqual({ kind: 'skip' });
  });

  it('skips on other null sessions', () => {
    expect(deriveAuthUserFromChange('USER_UPDATED', null)).toEqual({ kind: 'skip' });
  });
});
