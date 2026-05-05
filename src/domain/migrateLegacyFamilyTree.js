import dayjs from 'dayjs';
import { createEmptyFamilyModel } from './familyModel';
import { addPerson, connectSpouses, linkChildToParent } from './familyMutations';
import { repairFamilyModel } from './repairFamilyModel';

function isSpouseEdge(edge) {
  return edge?.data?.type === 'spouse' || edge?.type === 'spouse';
}

function isParentChildEdge(edge) {
  const t = edge?.data?.type;
  return t === 'parent-child' || t === 'parentChild';
}

/**
 * Convert legacy React Flow export { nodes, edges } into union-centric model.
 */
export function migrateLegacyFamilyTree(legacy) {
  const model = createEmptyFamilyModel();
  if (!legacy?.nodes?.length) return model;

  let m = model;

  for (const node of legacy.nodes) {
    if (node.type !== 'personNode' && node.type !== undefined) continue;
    const id = String(node.id);
    const d = node.data || {};
    m = addPerson(m, {
      id,
      firstName: d.firstName ?? '',
      middleName: d.middleName ?? '',
      lastName: d.lastName ?? '',
      goesBy: d.goesBy ?? d.firstName ?? 'Person',
      gender: d.gender ?? '',
      birthDate: d.birthDate ?? null,
      deathDate: d.deathDate ?? null,
      photo: d.photo ?? '',
      notes: d.notes ?? '',
    });
  }

  const edges = Array.isArray(legacy.edges) ? legacy.edges : [];

  for (const edge of edges) {
    if (isSpouseEdge(edge)) {
      m = connectSpouses(m, String(edge.source), String(edge.target));
    }
  }

  for (const edge of edges) {
    if (isSpouseEdge(edge)) continue;
    if (isParentChildEdge(edge)) {
      m = linkChildToParent(m, String(edge.target), String(edge.source));
    } else {
      // Legacy edges without data.type (treat as parent → child like initialFamilyData)
      m = linkChildToParent(m, String(edge.target), String(edge.source));
    }
  }

  return repairFamilyModel(finalizeSoloParentUnions(m));
}

/** Combine unions that share exactly one spouse and no co-spouse, to reduce duplicate union nodes */
export function finalizeSoloParentUnions(model) {
  const soloByParent = new Map();
  for (const u of Object.keys(model.unions)) {
    const spouses = model.unionSpouses.filter((s) => s.unionId === u);
    const kids = model.unionChildren.filter((c) => c.unionId === u);
    if (spouses.length === 1 && kids.length > 0) {
      const p = spouses[0].personId;
      if (!soloByParent.has(p)) soloByParent.set(p, []);
      soloByParent.get(p).push(u);
    }
  }

  let m = model;
  for (const [, unionIds] of soloByParent) {
    if (unionIds.length <= 1) continue;
    const [keep, ...rest] = unionIds;
    for (const drop of rest) {
      m = mergeUnionInto(m, drop, keep);
    }
  }
  return m;
}

function mergeUnionInto(model, fromUnionId, intoUnionId) {
  const m = {
    people: { ...model.people },
    unions: { ...model.unions },
    unionSpouses: model.unionSpouses.map((r) => ({ ...r })),
    unionChildren: model.unionChildren.map((r) => ({ ...r })),
  };

  for (const row of m.unionSpouses) {
    if (row.unionId === fromUnionId) row.unionId = intoUnionId;
  }
  for (const row of m.unionChildren) {
    if (row.unionId === fromUnionId) row.unionId = intoUnionId;
  }

  delete m.unions[fromUnionId];

  const dedupeChildren = [];
  const seen = new Set();
  for (const c of m.unionChildren) {
    const k = `${c.unionId}:${c.childPersonId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    dedupeChildren.push(c);
  }
  m.unionChildren = dedupeChildren;

  const dedupeSpouses = [];
  seen.clear();
  for (const s of m.unionSpouses) {
    const k = `${s.unionId}:${s.personId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    dedupeSpouses.push(s);
  }
  m.unionSpouses = dedupeSpouses;

  return m;
}

/** @deprecated demo seed — use createSeedFamilyModel from familyData */
export function legacyInitialLikeJson() {
  return {
    nodes: [
      {
        id: '1',
        type: 'personNode',
        position: { x: 250, y: 100 },
        data: {
          firstName: 'John',
          middleName: 'Robert',
          lastName: 'Smith',
          goesBy: 'John',
          gender: 'male',
          birthDate: dayjs('1950-01-15').toISOString(),
          deathDate: null,
          photo: '',
          notes: 'Family patriarch',
        },
      },
      {
        id: '2',
        type: 'personNode',
        position: { x: 100, y: 280 },
        data: {
          firstName: 'Sarah',
          middleName: 'Marie',
          lastName: 'Smith',
          goesBy: 'Sarah',
          gender: 'female',
          birthDate: dayjs('1975-05-20').toISOString(),
          deathDate: null,
          photo: '',
          notes: '',
        },
      },
      {
        id: '3',
        type: 'personNode',
        position: { x: 400, y: 280 },
        data: {
          firstName: 'Michael',
          middleName: 'James',
          lastName: 'Smith',
          goesBy: 'Mike',
          gender: 'male',
          birthDate: dayjs('1978-08-10').toISOString(),
          deathDate: null,
          photo: '',
          notes: '',
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: false },
      { id: 'e1-3', source: '1', target: '3', type: 'smoothstep', animated: false },
    ],
  };
}
