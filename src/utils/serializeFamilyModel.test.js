import { describe, it, expect } from 'vitest';
import { serializeFamilyModel } from './serializeFamilyModel';

describe('serializeFamilyModel', () => {
  it('produces the same string regardless of union_spouses row order', () => {
    const base = {
      people: { a: { id: 'a', goesBy: 'A' }, b: { id: 'b', goesBy: 'B' } },
      unions: { u1: { id: 'u1' } },
      unionSpouses: [
        { unionId: 'u1', personId: 'b', spouseOrder: 1 },
        { unionId: 'u1', personId: 'a', spouseOrder: 0 },
      ],
      unionChildren: [],
    };
    const swapped = {
      ...base,
      unionSpouses: [...base.unionSpouses].reverse(),
    };
    expect(serializeFamilyModel(base)).toBe(serializeFamilyModel(swapped));
  });

  it('produces the same string regardless of union_children row order', () => {
    const base = {
      people: {
        p: { id: 'p', goesBy: 'P' },
        c1: { id: 'c1', goesBy: 'C1' },
        c2: { id: 'c2', goesBy: 'C2' },
      },
      unions: { u1: { id: 'u1' } },
      unionSpouses: [{ unionId: 'u1', personId: 'p', spouseOrder: 0 }],
      unionChildren: [
        { unionId: 'u1', childPersonId: 'c2' },
        { unionId: 'u1', childPersonId: 'c1' },
      ],
    };
    const swapped = {
      ...base,
      unionChildren: [...base.unionChildren].reverse(),
    };
    expect(serializeFamilyModel(base)).toBe(serializeFamilyModel(swapped));
  });

  it('changes when a person field changes', () => {
    const a = {
      people: { x: { id: 'x', goesBy: 'X' } },
      unions: {},
      unionSpouses: [],
      unionChildren: [],
    };
    const b = {
      ...a,
      people: { x: { id: 'x', goesBy: 'Y' } },
    };
    expect(serializeFamilyModel(a)).not.toBe(serializeFamilyModel(b));
  });
});
