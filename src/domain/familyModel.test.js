import { describe, it, expect } from 'vitest';
import { unionNodeRfId, parseUnionRfId, createEmptyFamilyModel } from './familyModel';

describe('familyModel', () => {
  it('createEmptyFamilyModel returns empty structures', () => {
    const m = createEmptyFamilyModel();
    expect(m.people).toEqual({});
    expect(m.unions).toEqual({});
    expect(m.unionSpouses).toEqual([]);
    expect(m.unionChildren).toEqual([]);
  });

  it('unionNodeRfId and parseUnionRfId round-trip', () => {
    const id = 'abc-123-union';
    const rf = unionNodeRfId(id);
    expect(rf.startsWith('union:')).toBe(true);
    expect(parseUnionRfId(rf)).toBe(id);
    expect(parseUnionRfId('person-only-id')).toBeNull();
  });
});
