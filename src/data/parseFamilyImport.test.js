import { describe, it, expect } from 'vitest';
import { parseFamilyImport } from './parseFamilyImport';

describe('parseFamilyImport', () => {
  it('parses v2 bundle with defaults for missing arrays', () => {
    const model = parseFamilyImport({
      people: { a: { id: 'a', goesBy: 'Ann' } },
      unions: { u: { id: 'u' } },
    });
    expect(model.people.a.goesBy).toBe('Ann');
    expect(model.unions.u).toEqual({ id: 'u' });
    expect(model.unionSpouses).toEqual([]);
    expect(model.unionChildren).toEqual([]);
  });

  it('parses v2 bundle with junction rows', () => {
    const model = parseFamilyImport({
      people: { a: { id: 'a' }, b: { id: 'b' } },
      unions: { u: { id: 'u' } },
      unionSpouses: [{ unionId: 'u', personId: 'a', spouseOrder: 0 }],
      unionChildren: [{ unionId: 'u', childPersonId: 'b' }],
    });
    expect(model.unionSpouses).toHaveLength(1);
    expect(model.unionChildren).toHaveLength(1);
  });

  it('parses legacy React Flow export', () => {
    const model = parseFamilyImport({
      nodes: [
        {
          id: 'p1',
          type: 'personNode',
          data: { firstName: 'Pat', goesBy: 'Pat', gender: 'other' },
        },
        {
          id: 'c1',
          type: 'personNode',
          data: { firstName: 'Kid', goesBy: 'Kid', gender: 'other' },
        },
      ],
      edges: [{ id: 'e1', source: 'p1', target: 'c1', type: 'smoothstep' }],
    });
    expect(model.people.p1).toBeDefined();
    expect(model.people.c1).toBeDefined();
    expect(Object.keys(model.unions).length).toBeGreaterThanOrEqual(1);
    expect(model.unionChildren.some((x) => x.childPersonId === 'c1')).toBe(true);
  });

  it('throws on unrecognized format', () => {
    expect(() => parseFamilyImport({ people: 'bad' })).toThrow(/Unrecognized/);
    expect(() => parseFamilyImport({})).toThrow(/Unrecognized/);
  });
});
