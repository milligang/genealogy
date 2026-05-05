import { unionNodeRfId } from './familyModel';
import { spousesOfUnion, childrenOfUnion } from './familyMutations';

/** Build React Flow elements + Dagre edges: person → union → child. */
export function buildReactFlowGraph(model, themeConfig) {
  if (!themeConfig?.edgeStyles) {
    console.error(
      '[buildReactFlowGraph] themeConfig.edgeStyles is missing.',
      'Received themeConfig:', themeConfig,
    );
    return { nodes: [], edges: [] };
  }

  const { parentChild, spouse } = themeConfig.edgeStyles;

  if (!parentChild || !spouse) {
    console.error(
      '[buildReactFlowGraph] themeConfig.edgeStyles must have both `parentChild` and `spouse`.',
      'Got:', themeConfig.edgeStyles,
    );
    return { nodes: [], edges: [] };
  }

  if (!model?.people || !model?.unions) {
    console.error('[buildReactFlowGraph] model is missing people or unions.', model);
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];

  for (const person of Object.values(model.people)) {
    if (!person?.id) {
      console.warn('[buildReactFlowGraph] Skipping person with no id:', person);
      continue;
    }
    nodes.push({
      id: person.id,
      type: 'personNode',
      position: { x: 0, y: 0 },
      data: { ...person, id: person.id },
    });
  }

  for (const union of Object.values(model.unions)) {
    const uid = union?.id;
    if (!uid) {
      console.warn('[buildReactFlowGraph] Skipping union with no id:', union);
      continue;
    }

    const spouseIds = spousesOfUnion(model, uid);

    // Pass unionId and spouse names into the node so UnionNode can label
    // the "Add child" action and FamilyTree can route it correctly.
    const spouseNames = spouseIds
      .map((id) => {
        const p = model.people[id];
        return p ? (p.goesBy || p.firstName || 'Unnamed') : null;
      })
      .filter(Boolean);

    nodes.push({
      id: unionNodeRfId(uid),
      type: 'unionNode',
      position: { x: 0, y: 0 },
      draggable: false,
      selectable: false,
      data: { unionId: uid, spouseNames },
    });

    // Spouse edges: first spouse comes from the left, second from the right.
    // Both target the union node's horizontal handles so the line runs cleanly
    // into the sides of the diamond rather than through the top.
    spouseIds.forEach((personId, idx) => {
      if (!model.people[personId]) {
        console.warn(`[buildReactFlowGraph] Spouse ${personId} in union ${uid} not found in people.`);
        return;
      }
      const sourceHandle = idx === 0 ? 'spouse-right' : 'spouse-left';
      const targetHandle = idx === 0 ? 'spouse-in' : 'spouse-in-right';
      edges.push({
        id: `e-sp-${uid}-${personId}`,
        source: personId,
        target: unionNodeRfId(uid),
        sourceHandle,
        targetHandle,
        deletable: false,
        ...spouse,
        data: { kind: 'spouseUnion' },
      });
    });

    for (const childId of childrenOfUnion(model, uid)) {
      if (!model.people[childId]) {
        console.warn(`[buildReactFlowGraph] Child ${childId} in union ${uid} not found in people.`);
        continue;
      }
      edges.push({
        id: `e-pc-${uid}-${childId}`,
        source: unionNodeRfId(uid),
        target: childId,
        sourceHandle: 'child-out',
        targetHandle: 'parent-target',  // matches type="target" handle in PersonNode
        deletable: false,
        ...parentChild,
        data: { kind: 'unionChild' },
      });
    }
  }

  console.debug(
    `[buildReactFlowGraph] Built ${nodes.length} nodes, ${edges.length} edges.`,
    { nodes, edges },
  );

  return { nodes, edges };
}