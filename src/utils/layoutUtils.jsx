import dagre from 'dagre';

const PERSON_W = 220;
const PERSON_H = 100;
const UNION_W = 36;
const UNION_H = 28;

function getDagreSize(node) {
  if (node.type === 'unionNode') {
    return { width: UNION_W, height: UNION_H };
  }
  return { width: PERSON_W, height: PERSON_H };
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
    rankdir: 'TB', // Top to Bottom
    nodesep: 80,   // Horizontal spacing between nodes
    ranksep: 120,  // Vertical spacing between generations
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

  return { nodes: layoutedNodes, edges: safeEdges };
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