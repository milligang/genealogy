import { describe, it, expect } from 'vitest';
import { repairFamilyModel } from './repairFamilyModel';

describe('repairFamilyModel', () => {
  it('returns empty model for non-object input', () => {
    expect(repairFamilyModel(null).people).toEqual({});
    expect(repairFamilyModel(undefined).unionSpouses).toEqual([]);
  });

  it('keeps valid people and drops broken junction rows', () => {
    const m = repairFamilyModel({
      people: { a: { id: 'a', goesBy: 'A' }, b: { id: 'b', goesBy: 'B' } },
      unions: { u: { id: 'u' } },
      unionSpouses: [
        { unionId: 'u', personId: 'a' },
        { unionId: 'u', personId: 'ghost' },
      ],
      unionChildren: [{ unionId: 'u', childPersonId: 'b' }],
    });
    expect(Object.keys(m.people)).toEqual(['a', 'b']);
    expect(m.unionSpouses).toEqual([{ unionId: 'u', personId: 'a' }]);
    expect(m.unionChildren).toEqual([{ unionId: 'u', childPersonId: 'b' }]);
  });

  it('removes unions with no junction rows after filtering', () => {
    const m = repairFamilyModel({
      people: { a: { id: 'a' } },
      unions: { orphan: { id: 'orphan' }, u: { id: 'u' } },
      unionSpouses: [{ unionId: 'u', personId: 'a' }],
      unionChildren: [],
    });
    expect(m.unions.orphan).toBeUndefined();
    expect(m.unions.u).toBeUndefined();
    expect(m.unionSpouses).toEqual([]);
  });

  it('keeps a couple union with no children (two spouses)', () => {
    const m = repairFamilyModel({
      people: { a: { id: 'a' }, b: { id: 'b' } },
      unions: { u: { id: 'u' } },
      unionSpouses: [
        { unionId: 'u', personId: 'a' },
        { unionId: 'u', personId: 'b' },
      ],
      unionChildren: [],
    });
    expect(m.unions.u).toBeDefined();
    expect(m.unionSpouses).toHaveLength(2);
  });

  it('keeps solo parent union when there are children', () => {
    const m = repairFamilyModel({
      people: { a: { id: 'a' }, c: { id: 'c' } },
      unions: { u: { id: 'u' } },
      unionSpouses: [{ unionId: 'u', personId: 'a' }],
      unionChildren: [{ unionId: 'u', childPersonId: 'c' }],
    });
    expect(m.unions.u).toBeDefined();
  });

  it('dedupes duplicate spouse rows and duplicate child assignments', () => {
    const m = repairFamilyModel({
      people: { a: { id: 'a' }, b: { id: 'b' } },
      unions: { u: { id: 'u' } },
      unionSpouses: [
        { unionId: 'u', personId: 'a' },
        { unionId: 'u', personId: 'a' },
      ],
      unionChildren: [
        { unionId: 'u', childPersonId: 'b' },
        { unionId: 'u', childPersonId: 'b' },
      ],
    });
    expect(m.unionSpouses).toHaveLength(1);
    expect(m.unionChildren).toHaveLength(1);
  });
});
