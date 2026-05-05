import { describe, it, expect, vi } from 'vitest';

vi.mock('../supabaseClient', () => ({
  default: {
    auth: { getUser: vi.fn(), getSession: vi.fn() },
    from: vi.fn(),
  },
}));

import { createSeedFamilyModel } from './familyData';
import { countPeople } from '../config/treePolicy';

describe('createSeedFamilyModel', () => {
  it('provides three sample people for first-time UX', () => {
    const m = createSeedFamilyModel();
    expect(countPeople(m)).toBe(3);
    expect(m.people).toMatchObject({
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001': expect.objectContaining({ goesBy: 'John' }),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002': expect.objectContaining({ goesBy: 'Sarah' }),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0003': expect.objectContaining({ goesBy: 'Mike' }),
    });
  });
});
