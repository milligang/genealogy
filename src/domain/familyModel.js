/** @typedef {{ id: string, label?: string }} UnionRecord */

/**
 * @typedef {{
 *   people: Record<string, Record<string, unknown>>,
 *   unions: Record<string, UnionRecord>,
 *   unionSpouses: Array<{ unionId: string, personId: string, spouseOrder: number }>,
 *   unionChildren: Array<{ unionId: string, childPersonId: string }>,
 * }} FamilyModel
 */

/**
 * Canonical family graph (client + Supabase).
 * - people: id -> display + metadata (camelCase, matches PersonNode form data + id)
 * - unions: id -> UnionRecord
 * - unionSpouses: spouse membership (spouseOrder: 0 = first, 1 = second)
 * - unionChildren: child belongs to one union (one birth family per child in MVP)
 */
export function createEmptyFamilyModel() {
  return {
    people: {},
    unions: {},
    unionSpouses: [],
    unionChildren: [],
  };
}

export function cloneFamilyModel(model) {
  return {
    people: { ...model.people },
    unions: { ...model.unions },
    unionSpouses: model.unionSpouses.map((r) => ({ ...r })),
    unionChildren: model.unionChildren.map((r) => ({ ...r })),
  };
}

export function unionNodeRfId(unionId) {
  return `union:${unionId}`;
}

export function parseUnionRfId(nodeId) {
  if (typeof nodeId !== 'string' || !nodeId.startsWith('union:')) return null;
  return nodeId.slice('union:'.length);
}
