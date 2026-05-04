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
