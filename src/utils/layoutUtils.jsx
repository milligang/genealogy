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

  nodes.forEach((node) => {
    const { width, height } = getDagreSize(node);
    dagreGraph.setNode(node.id, { width, height });
  });

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply new positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const { width, height } = getDagreSize(node);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
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

  nodes.forEach((node) => {
    const { width, height } = getDagreSize(node);
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const { width, height } = getDagreSize(node);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};