import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEmptyFamilyModel } from './familyModel';
import {
  addPerson,
  connectSpouses,
  linkChildToParent,
  findUnionContainingBoth,
  deletePerson,
  unionForChild,
  applyConnectionsForNewPerson,
} from './familyMutations';

describe('familyMutations', () => {
  let uuidSeq = 0;
  beforeEach(() => {
    uuidSeq = 0;
    vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(() => {
      uuidSeq += 1;
      return `10000000-0000-4000-8000-${String(uuidSeq).padStart(12, '0')}`;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function minimalPerson(id, goesBy = id) {
    return { id, goesBy, firstName: goesBy, gender: 'other' };
  }

  it('addPerson assigns id when missing', () => {
    const m0 = createEmptyFamilyModel();
    const m1 = addPerson(m0, { goesBy: 'Zoe', firstName: 'Zoe', gender: 'other' });
    const id = Object.keys(m1.people)[0];
    expect(id.length).toBeGreaterThan(10);
    expect(m1.people[id].goesBy).toBe('Zoe');
  });

  it('connectSpouses creates a union containing both people', () => {
    let m = createEmptyFamilyModel();
    m = addPerson(m, minimalPerson('a', 'A'));
    m = addPerson(m, minimalPerson('b', 'B'));
    m = connectSpouses(m, 'a', 'b');
    const u = findUnionContainingBoth(m, 'a', 'b');
    expect(u).toBeTruthy();
    expect(m.unionSpouses.filter((s) => s.unionId === u)).toHaveLength(2);
  });

  it('connectSpouses is idempotent for the same pair', () => {
    let m = createEmptyFamilyModel();
    m = addPerson(m, minimalPerson('a'));
    m = addPerson(m, minimalPerson('b'));
    const once = connectSpouses(m, 'a', 'b');
    const twice = connectSpouses(once, 'a', 'b');
    expect(Object.keys(twice.unions).length).toBe(Object.keys(once.unions).length);
  });

  it('connectSpouses adds first spouse into sole-parent union so existing children stay one family', () => {
    let m = createEmptyFamilyModel();
    m = addPerson(m, minimalPerson('john', 'John'));
    m = addPerson(m, minimalPerson('kid', 'Kid'));
    m = addPerson(m, minimalPerson('sarah', 'Sarah'));
    m = linkChildToParent(m, 'kid', 'john');
    const birthUnion = unionForChild(m, 'kid');
    m = connectSpouses(m, 'john', 'sarah');
    expect(findUnionContainingBoth(m, 'john', 'sarah')).toBe(birthUnion);
    expect(unionForChild(m, 'kid')).toBe(birthUnion);
    const spouses = m.unionSpouses.filter((s) => s.unionId === birthUnion).map((s) => s.personId).sort();
    expect(spouses).toEqual(['john', 'sarah']);
    expect(Object.keys(m.unions)).toHaveLength(1);
  });

  it('connectSpouses merges two sole-spouse unions when each partner already has children', () => {
    let m = createEmptyFamilyModel();
    m = addPerson(m, minimalPerson('john'));
    m = addPerson(m, minimalPerson('jane'));
    m = addPerson(m, minimalPerson('kid1'));
    m = addPerson(m, minimalPerson('kid2'));
    m = linkChildToParent(m, 'kid1', 'john');
    m = linkChildToParent(m, 'kid2', 'jane');
    m = connectSpouses(m, 'john', 'jane');
    const u = findUnionContainingBoth(m, 'john', 'jane');
    expect(u).toBeTruthy();
    expect(unionForChild(m, 'kid1')).toBe(u);
    expect(unionForChild(m, 'kid2')).toBe(u);
    expect(Object.keys(m.unions)).toHaveLength(1);
  });

  it('linkChildToParent creates birth union with one parent', () => {
    let m = createEmptyFamilyModel();
    m = addPerson(m, minimalPerson('p', 'Parent'));
    m = addPerson(m, minimalPerson('c', 'Child'));
    m = linkChildToParent(m, 'c', 'p');
    const u = unionForChild(m, 'c');
    expect(u).toBeTruthy();
    expect(m.unionChildren).toContainEqual({ unionId: u, childPersonId: 'c' });
  });

  it('linkChildToParent adds second parent into same birth union', () => {
    let m = createEmptyFamilyModel();
    m = addPerson(m, minimalPerson('m', 'Mom'));
    m = addPerson(m, minimalPerson('d', 'Dad'));
    m = addPerson(m, minimalPerson('k', 'Kid'));
    m = linkChildToParent(m, 'k', 'm');
    m = linkChildToParent(m, 'k', 'd');
    const u = unionForChild(m, 'k');
    expect(m.unionSpouses.filter((s) => s.unionId === u).map((s) => s.personId).sort()).toEqual([
      'd',
      'm',
    ]);
  });

  it('deletePerson removes person and drops their spouse rows', () => {
    let m = createEmptyFamilyModel();
    m = addPerson(m, minimalPerson('a'));
    m = addPerson(m, minimalPerson('b'));
    m = connectSpouses(m, 'a', 'b');
    m = deletePerson(m, 'a');
    expect(m.people.a).toBeUndefined();
    expect(m.unionSpouses.some((s) => s.personId === 'a')).toBe(false);
    expect(m.people.b).toBeDefined();
  });

  it('deletePerson removes marriage union when one spouse remains and there are no children', () => {
    let m = createEmptyFamilyModel();
    m = addPerson(m, minimalPerson('john'));
    m = addPerson(m, minimalPerson('mary'));
    m = connectSpouses(m, 'john', 'mary');
    const u = findUnionContainingBoth(m, 'john', 'mary');
    m = deletePerson(m, 'mary');
    expect(findUnionContainingBoth(m, 'john', 'mary')).toBeNull();
    expect(m.unions[u]).toBeUndefined();
    expect(m.unionSpouses.some((s) => s.unionId === u)).toBe(false);
  });

  it('deletePerson keeps family union when one parent remains with children', () => {
    let m = createEmptyFamilyModel();
    m = addPerson(m, minimalPerson('john'));
    m = addPerson(m, minimalPerson('mary'));
    m = addPerson(m, minimalPerson('kid'));
    m = linkChildToParent(m, 'kid', 'john');
    m = linkChildToParent(m, 'kid', 'mary');
    const u = unionForChild(m, 'kid');
    m = deletePerson(m, 'mary');
    expect(unionForChild(m, 'kid')).toBe(u);
    expect(m.unions[u]).toBeDefined();
    expect(m.unionSpouses.filter((s) => s.unionId === u).map((s) => s.personId)).toEqual(['john']);
  });

  it('applyConnectionsForNewPerson wires spouse and parent links', () => {
    let m = createEmptyFamilyModel();
    m = addPerson(m, minimalPerson('existing', 'Ex'));
    const newbie = minimalPerson('newbie-id', 'Newbie');
    m = addPerson(m, newbie);
    m = applyConnectionsForNewPerson(m, 'newbie-id', [
      { type: 'spouse', personId: 'existing' },
      { type: 'parent', personId: 'existing' },
    ]);
    expect(findUnionContainingBoth(m, 'newbie-id', 'existing')).toBeTruthy();
    const birth = unionForChild(m, 'newbie-id');
    expect(birth).toBeTruthy();
    expect(m.unionSpouses.some((s) => s.unionId === birth && s.personId === 'existing')).toBe(true);
  });
});
