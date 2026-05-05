import { unionNodeRfId } from '../domain/familyModel';
import { spousesOfUnion } from '../domain/familyMutations';

/** Match Dagre / manual layout assumptions (see layoutUtils). */
export const DAGRE_PERSON_W = 220;
export const DAGRE_PERSON_H = 100;
export const DAGRE_UNION_W = 80;
export const DAGRE_UNION_H = 80;

function computeUnionTopLeft(spouseNodes) {
  const centersX = spouseNodes.map((sn) => sn.position.x + DAGRE_PERSON_W / 2);
  const midX = centersX.reduce((a, b) => a + b, 0) / centersX.length;
  const bottomY = Math.max(...spouseNodes.map((sn) => sn.position.y + DAGRE_PERSON_H));
  const gap = 20;
  return {
    x: midX - DAGRE_UNION_W / 2,
    y: bottomY + gap,
  };
}

/** Place each union node under the midpoint of its spouse person nodes. */
export function layoutUnionNodesFromSpouses(model, nodes) {
  const byId = new Map(nodes.map((n) => [n.id, { ...n }]));

  for (const u of Object.values(model.unions)) {
    const rfId = unionNodeRfId(u.id);
    const unionN = byId.get(rfId);
    if (!unionN) continue;

    const sns = spousesOfUnion(model, u.id)
      .map((id) => byId.get(id))
      .filter(Boolean);
    if (sns.length === 0) continue;

    unionN.position = computeUnionTopLeft(sns);
  }

  return nodes.map((n) => byId.get(n.id));
}

/** Same geometry using only edges (for Dagre output before callbacks). */
export function layoutUnionNodesFromEdges(nodes, edges) {
  const byId = new Map(nodes.map((n) => [n.id, { ...n }]));
  const spousesByUnion = new Map();

  for (const e of edges) {
    const t = e.target;
    if (typeof t !== 'string' || !t.startsWith('union:')) continue;
    const srcNode = byId.get(e.source);
    if (!srcNode || srcNode.type !== 'personNode') continue;
    if (!spousesByUnion.has(t)) spousesByUnion.set(t, []);
    spousesByUnion.get(t).push(srcNode);
  }

  for (const [unionRfId, spouseNodes] of spousesByUnion) {
    const unionN = byId.get(unionRfId);
    if (!unionN || unionN.type !== 'unionNode') continue;
    if (spouseNodes.length === 0) continue;
    unionN.position = computeUnionTopLeft(spouseNodes);
  }

  return nodes.map((n) => byId.get(n.id));
}
