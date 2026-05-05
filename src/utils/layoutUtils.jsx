import dagre from 'dagre';
import {
  DAGRE_PERSON_W as PERSON_W,
  DAGRE_PERSON_H as PERSON_H,
  DAGRE_UNION_W as UNION_W,
  DAGRE_UNION_H as UNION_H,
  layoutUnionNodesFromEdges,
} from './unionNodeLayout';

function getDagreSize(node) {
  if (node.type === 'unionNode') {
    return { width: UNION_W, height: UNION_H };
  }
  return { width: PERSON_W, height: PERSON_H };
}

/**
 * Dagre TB sometimes stacks the two parents vertically; force side‑by‑side when both marry into the same union.
 * Exported for FamilyTree sync so couples align without running full Dagre.
 */
export function snapMarriageRowsHorizontal(nodes, edges) {
  const byId = new Map(nodes.map((n) => [n.id, { ...n }]));
  const spousesByUnion = new Map();

  for (const e of edges) {
    const t = e.target;
    if (typeof t !== 'string' || !t.startsWith('union:')) continue;
    const src = byId.get(e.source);
    if (!src || src.type !== 'personNode') continue;
    if (!spousesByUnion.has(t)) spousesByUnion.set(t, []);
    const arr = spousesByUnion.get(t);
    if (!arr.includes(e.source)) arr.push(e.source);
  }

  const GAP = 56;

  for (const [, spouseSourceIds] of spousesByUnion) {
    const ids = [...new Set(spouseSourceIds)];
    if (ids.length !== 2) continue;
    const idA = ids[0];
    const idB = ids[1];
    const nA = byId.get(idA);
    const nB = byId.get(idB);
    if (!nA || !nB) continue;

    const y = Math.min(nA.position.y, nB.position.y);
    const left = Math.min(nA.position.x, nB.position.x);

    if (nA.position.x <= nB.position.x) {
      nA.position = { x: left, y };
      nB.position = { x: left + PERSON_W + GAP, y };
    } else {
      nB.position = { x: left, y };
      nA.position = { x: left + PERSON_W + GAP, y };
    }
  }

  return nodes.map((n) => byId.get(n.id));
}

// Add this helper to trigger layout on connection changes
export const autoLayoutOnConnect = (nodes, edges, setNodes, setEdges) => {
  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
  setNodes(layoutedNodes);
  setEdges(layoutedEdges);
};

export const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Configure layout direction and spacing
  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 140,
    ranksep: 110,
    edgesep: 36,
    marginx: 24,
    marginy: 24,
  });

  const nodeIds = new Set(nodes.map((n) => n.id));

  nodes.forEach((node) => {
    const { width, height } = getDagreSize(node);
    dagreGraph.setNode(node.id, { width, height });
  });

  const safeEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  safeEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply new positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const { width, height } = getDagreSize(node);
    if (!nodeWithPosition || typeof nodeWithPosition.x !== 'number') {
      console.warn('[getLayoutedElements] Dagre produced no position for node', node.id);
      const fallback =
        node.position && typeof node.position.x === 'number' ? node.position : { x: 0, y: 0 };
      return { ...node, position: fallback };
    }
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  let aligned = snapMarriageRowsHorizontal(layoutedNodes, safeEdges);
  aligned = layoutUnionNodesFromEdges(aligned, safeEdges);

  return { nodes: aligned, edges: safeEdges };
};

export const getLayoutedElementsLR = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ 
    rankdir: 'LR', // Left to Right
    nodesep: 80,
    ranksep: 150,
    edgesep: 50,
  });

  const nodeIds = new Set(nodes.map((n) => n.id));

  nodes.forEach((node) => {
    const { width, height } = getDagreSize(node);
    dagreGraph.setNode(node.id, { width, height });
  });

  const safeEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  safeEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const { width, height } = getDagreSize(node);
    if (!nodeWithPosition || typeof nodeWithPosition.x !== 'number') {
      console.warn('[getLayoutedElementsLR] Dagre produced no position for node', node.id);
      const fallback =
        node.position && typeof node.position.x === 'number' ? node.position : { x: 0, y: 0 };
      return { ...node, position: fallback };
    }
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges: safeEdges };
};