import { createEmptyFamilyModel } from './familyModel';

/**
 * Normalize and strip invalid references so React Flow graph building never sees dangling ids.
 * Does not invent relationships — only drops bad rows and orphan unions.
 */
export function repairFamilyModel(input) {
  const base = createEmptyFamilyModel();
  if (!input || typeof input !== 'object') return base;

  const people = {};
  if (input.people && typeof input.people === 'object') {
    for (const [key, p] of Object.entries(input.people)) {
      if (!p || typeof p !== 'object') continue;
      const id = typeof p.id === 'string' && p.id.length > 0 ? p.id : typeof key === 'string' ? key : '';
      if (!id) continue;
      people[id] = { ...p, id };
    }
  }

  const unions = {};
  if (input.unions && typeof input.unions === 'object') {
    for (const [key, u] of Object.entries(input.unions)) {
      if (!u || typeof u !== 'object') continue;
      const id = typeof u.id === 'string' && u.id.length > 0 ? u.id : typeof key === 'string' ? key : '';
      if (!id) continue;
      unions[id] = { id, ...(u.label !== undefined && u.label !== null ? { label: u.label } : {}) };
    }
  }

  let unionSpouses = Array.isArray(input.unionSpouses) ? input.unionSpouses : [];
  unionSpouses = unionSpouses.filter(
    (s) =>
      s &&
      typeof s.unionId === 'string' &&
      typeof s.personId === 'string' &&
      unions[s.unionId] &&
      people[s.personId],
  );

  const seenSpouse = new Set();
  unionSpouses = unionSpouses.filter((s) => {
    const k = `${s.unionId}:${s.personId}`;
    if (seenSpouse.has(k)) return false;
    seenSpouse.add(k);
    return true;
  });

  let unionChildren = Array.isArray(input.unionChildren) ? input.unionChildren : [];
  unionChildren = unionChildren.filter(
    (c) =>
      c &&
      typeof c.unionId === 'string' &&
      typeof c.childPersonId === 'string' &&
      unions[c.unionId] &&
      people[c.childPersonId],
  );

  const seenChild = new Set();
  unionChildren = unionChildren.filter((c) => {
    if (seenChild.has(c.childPersonId)) return false;
    seenChild.add(c.childPersonId);
    return true;
  });

  const referencedUnionIds = new Set([
    ...unionSpouses.map((s) => s.unionId),
    ...unionChildren.map((c) => c.unionId),
  ]);
  for (const uid of Object.keys(unions)) {
    if (!referencedUnionIds.has(uid)) delete unions[uid];
  }

  return {
    people,
    unions,
    unionSpouses,
    unionChildren,
  };
}
