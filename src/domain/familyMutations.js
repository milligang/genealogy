import { cloneFamilyModel } from './familyModel';

function newId() {
  return crypto.randomUUID();
}

function omitUnion(model, unionId) {
  const unions = { ...model.unions };
  delete unions[unionId];
  return {
    ...model,
    unions,
    unionSpouses: model.unionSpouses.filter((s) => s.unionId !== unionId),
    unionChildren: model.unionChildren.filter((c) => c.unionId !== unionId),
  };
}

export function findUnionContainingBoth(model, personAId, personBId) {
  const byUnion = new Map();
  for (const s of model.unionSpouses) {
    if (!byUnion.has(s.unionId)) byUnion.set(s.unionId, new Set());
    byUnion.get(s.unionId).add(s.personId);
  }
  for (const [unionId, set] of byUnion) {
    if (set.has(personAId) && set.has(personBId)) return unionId;
  }
  return null;
}

/** Union where this person appears as a spouse */
export function unionsForSpouse(model, personId) {
  return [...new Set(model.unionSpouses.filter((s) => s.personId === personId).map((s) => s.unionId))];
}

/** Union that lists this person as a child (MVP: at most one) */
export function unionForChild(model, childId) {
  return model.unionChildren.find((c) => c.childPersonId === childId)?.unionId ?? null;
}

export function spousesOfUnion(model, unionId) {
  return model.unionSpouses
    .filter((s) => s.unionId === unionId)
    .sort((a, b) => a.spouseOrder - b.spouseOrder)
    .map((s) => s.personId);
}

export function childrenOfUnion(model, unionId) {
  return model.unionChildren.filter((c) => c.unionId === unionId).map((c) => c.childPersonId);
}

/**
 * @returns {Array<{ relation: 'spouse'|'parent'|'child', otherId: string, unionId: string, edgeKey: string }>}
 */
export function listRelationsForPerson(model, personId) {
  const out = [];
  const seen = new Set();

  for (const unionId of unionsForSpouse(model, personId)) {
    for (const pid of spousesOfUnion(model, unionId)) {
      if (pid === personId) continue;
      const key = `spouse:${[personId, pid].sort().join(':')}:${unionId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ relation: 'spouse', otherId: pid, unionId, edgeKey: key });
    }
    for (const cid of childrenOfUnion(model, unionId)) {
      const key = `child:${unionId}:${cid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ relation: 'child', otherId: cid, unionId, edgeKey: key });
    }
  }

  const birthUnion = unionForChild(model, personId);
  if (birthUnion) {
    for (const pid of spousesOfUnion(model, birthUnion)) {
      const key = `parent:${birthUnion}:${pid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ relation: 'parent', otherId: pid, unionId: birthUnion, edgeKey: key });
    }
  }

  return out;
}

export function addPerson(model, person) {
  const m = cloneFamilyModel(model);
  const id = person.id || newId();
  m.people[id] = { ...person, id };
  return m;
}

/** Marriage / partnership: new union with exactly these two spouses */
export function connectSpouses(model, personAId, personBId) {
  if (personAId === personBId) return model;
  if (!model.people[personAId] || !model.people[personBId]) return model;
  if (findUnionContainingBoth(model, personAId, personBId)) return model;

  const m = cloneFamilyModel(model);
  const unionId = newId();
  m.unions[unionId] = { id: unionId };
  m.unionSpouses.push(
    { unionId, personId: personAId, spouseOrder: 0 },
    { unionId, personId: personBId, spouseOrder: 1 },
  );
  return m;
}

/**
 * Link parent to child (child may already have a birth union with 0–1 parents).
 * MVP: one birth union per child.
 */
export function linkChildToParent(model, childId, parentId) {
  if (childId === parentId) return model;
  if (!model.people[childId] || !model.people[parentId]) return model;

  const m = cloneFamilyModel(model);
  let birthUnion = unionForChild(m, childId);

  if (!birthUnion) {
    birthUnion = newId();
    m.unions[birthUnion] = { id: birthUnion };
    m.unionSpouses.push({ unionId: birthUnion, personId: parentId, spouseOrder: 0 });
    m.unionChildren.push({ unionId: birthUnion, childPersonId: childId });
    return m;
  }

  const spouses = m.unionSpouses.filter((s) => s.unionId === birthUnion);
  if (spouses.some((s) => s.personId === parentId)) return model;
  if (spouses.length >= 2) {
    console.warn('linkChildToParent: child already has two parents in their birth union');
    return model;
  }
  const maxOrder = spouses.reduce((acc, s) => Math.max(acc, s.spouseOrder), -1);
  m.unionSpouses.push({ unionId: birthUnion, personId: parentId, spouseOrder: maxOrder + 1 });
  return m;
}

export function removeSpousePartnership(model, personAId, personBId) {
  const unionId = findUnionContainingBoth(model, personAId, personBId);
  if (!unionId) return model;

  const m = cloneFamilyModel(model);
  m.unionSpouses = m.unionSpouses.filter(
    (s) => !(s.unionId === unionId && (s.personId === personAId || s.personId === personBId)),
  );
  const remainingSpouses = m.unionSpouses.filter((s) => s.unionId === unionId);
  if (remainingSpouses.length === 0) {
    return omitUnion(m, unionId);
  }
  return m;
}

export function unlinkParentFromChild(model, childId, parentId) {
  const birthUnion = unionForChild(model, childId);
  if (!birthUnion) return model;

  const m = cloneFamilyModel(model);
  m.unionSpouses = m.unionSpouses.filter(
    (s) => !(s.unionId === birthUnion && s.personId === parentId),
  );
  const remaining = m.unionSpouses.filter((s) => s.unionId === birthUnion);
  if (remaining.length === 0) {
    return omitUnion(m, birthUnion);
  }
  return m;
}

/** Remove child from a union that includes `parentId` as a spouse (first match). */
export function unlinkChildFromUnion(model, parentId, childId) {
  const parentUnionIds = new Set(
    model.unionSpouses.filter((s) => s.personId === parentId).map((s) => s.unionId),
  );
  const hit = model.unionChildren.find(
    (c) => c.childPersonId === childId && parentUnionIds.has(c.unionId),
  );
  if (!hit) return model;

  const m = cloneFamilyModel(model);
  m.unionChildren = m.unionChildren.filter(
    (c) => !(c.unionId === hit.unionId && c.childPersonId === childId),
  );
  return m;
}

export function deletePerson(model, personId) {
  const m = cloneFamilyModel(model);
  delete m.people[personId];

  const unionIdsTouched = new Set();
  m.unionSpouses = m.unionSpouses.filter((s) => {
    if (s.personId === personId) {
      unionIdsTouched.add(s.unionId);
      return false;
    }
    return true;
  });
  m.unionChildren = m.unionChildren.filter((c) => {
    if (c.childPersonId === personId) {
      unionIdsTouched.add(c.unionId);
      return false;
    }
    return true;
  });

  let result = m;
  for (const uid of unionIdsTouched) {
    const hasSpouse = result.unionSpouses.some((s) => s.unionId === uid);
    const hasChild = result.unionChildren.some((c) => c.unionId === uid);
    if (!hasSpouse && !hasChild) {
      result = omitUnion(result, uid);
    }
  }
  return result;
}

/**
 * Apply PersonForm-style connections after adding `personId`.
 * type: spouse | child (new person is parent) | parent (new person is child)
 */
export function applyConnectionsForNewPerson(model, personId, connections) {
  let m = model;
  for (const c of connections) {
    if (c.type === 'spouse') m = connectSpouses(m, personId, c.personId);
    else if (c.type === 'child') m = linkChildToParent(m, c.personId, personId);
    else if (c.type === 'parent') m = linkChildToParent(m, personId, c.personId);
  }
  return m;
}
