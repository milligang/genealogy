import { unionNodeRfId } from './familyModel';
import { spousesOfUnion, childrenOfUnion } from './familyMutations';

/** Build React Flow elements + Dagre edges: person → union → child. */
export function buildReactFlowGraph(model, themeConfig) {
  // ── Guard: missing or malformed themeConfig ──────────────────────────────
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

  // ── Guard: missing or malformed model ────────────────────────────────────
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
      if (!model.people[personId]) {
        console.warn(`[buildReactFlowGraph] Spouse ${personId} in union ${uid} not found in people.`);
        return;
      }
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
      if (!model.people[childId]) {
        console.warn(`[buildReactFlowGraph] Child ${childId} in union ${uid} not found in people.`);
        continue;
      }
      edges.push({
        id: `e-pc-${uid}-${childId}`,
        source: unionNodeRfId(uid),
        target: childId,
        sourceHandle: 'child-out',
        // 'parent-target' matches the type="target" Handle in PersonNode
        targetHandle: 'parent-target',
        deletable: false,
        ...parentChild,
        data: { kind: 'unionChild' },
      });
    }
  }

  return { nodes, edges };
}