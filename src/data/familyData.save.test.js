import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getUser } = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock('../supabaseClient', () => ({
  default: {
    auth: { getUser },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      delete: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

import { saveFamilyData, SAVE_ERROR_CODES } from './familyData';

describe('saveFamilyData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects when expectedUserId is missing', async () => {
    const r = await saveFamilyData({});
    expect(r.ok).toBe(false);
    expect(r.code).toBe(SAVE_ERROR_CODES.MISSING_EXPECTED_USER);
    expect(r.userMessage).toBeTruthy();
    expect(getUser).not.toHaveBeenCalled();
  });

  it('rejects when not signed in', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const r = await saveFamilyData({}, { expectedUserId: 'u1' });
    expect(r.ok).toBe(false);
    expect(r.code).toBe(SAVE_ERROR_CODES.NOT_AUTHENTICATED);
    expect(r.userMessage).toContain('not signed in');
  });

  it('rejects when session user id does not match expectedUserId', async () => {
    getUser.mockResolvedValueOnce({
      data: { user: { id: 'alice' } },
      error: null,
    });
    const r = await saveFamilyData({}, { expectedUserId: 'bob' });
    expect(r.ok).toBe(false);
    expect(r.code).toBe(SAVE_ERROR_CODES.SESSION_MISMATCH);
  });
});
