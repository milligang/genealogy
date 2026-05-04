import { unionNodeRfId } from './familyModel';
import { spousesOfUnion, childrenOfUnion } from './familyMutations';

/** Build React Flow elements + Dagre edges: person → union → child. */
export function buildReactFlowGraph(model, themeConfig) {
  const { parentChild, spouse } = themeConfig.edgeStyles;
  const nodes = [];
  const edges = [];

  for (const person of Object.values(model.people)) {
    nodes.push({
      id: person.id,
      type: 'personNode',
      position: { x: 0, y: 0 },
      data: { ...person, id: person.id },
    });
  }

  for (const union of Object.values(model.unions)) {
    const uid = union.id;
    nodes.push({
      id: unionNodeRfId(uid),
      type: 'unionNode',
      position: { x: 0, y: 0 },
      draggable: false,
      selectable: false,
      data: {},
    });

    const spouseIds = spousesOfUnion(model, uid);
    spouseIds.forEach((personId, idx) => {
      const sourceHandle = idx === 0 ? 'spouse-right' : 'spouse-left';
      edges.push({
        id: `e-sp-${uid}-${personId}`,
        source: personId,
        target: unionNodeRfId(uid),
        sourceHandle,
        targetHandle: 'spouse-in',
        deletable: false,
        ...spouse,
        data: { kind: 'spouseUnion' },
      });
    });

    for (const childId of childrenOfUnion(model, uid)) {
      edges.push({
        id: `e-pc-${uid}-${childId}`,
        source: unionNodeRfId(uid),
        target: childId,
        sourceHandle: 'child-out',
        targetHandle: 'parent-source',
        deletable: false,
        ...parentChild,
        data: { kind: 'unionChild' },
      });
    }
  }

  return { nodes, edges };
}
