import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@mui/material';

import { PersonNode } from '../nodes/PersonNode';
import { UnionNode } from '../nodes/UnionNode';
import { PersonForm } from '../editing/PersonForm';
import { EditPanel } from '../editing/EditPanel';
import { Sidebar } from '../layout/Sidebar';
import { SpouseEdge } from '../edges/SpouseEdge';
import { SpouseConnectionLine } from '../edges/SpouseConnection';
import { ParentChildConnectionLine } from '../edges/ParentChildConnection';
import { ComingSoonDialog } from '../dialogs/ComingSoonDialog';
import { FeedbackDialog } from '../dialogs/FeedbackDialog';

import {
  loadFamilyData,
  saveFamilyData,
  createSeedFamilyModel,
  clearFamilyData,
} from '../../data/familyData';
import { getLayoutedElements } from '../../utils/layoutUtils';
import getThemeConfig from '../../theme';
import { initPlusUtil, handleAddPerson } from '../../utils/handleAddPerson';
import { createPersonFromFormData } from '../../utils/appHelpers';
import { useModalBlur } from '../../hooks/useModalBlur';
import { buildReactFlowGraph } from '../../domain/buildReactFlowGraph';
import {
  addPerson,
  applyConnectionsForNewPerson,
  connectSpouses,
  linkChildToParent,
  deletePerson,
} from '../../domain/familyMutations';

const nodeTypes = { personNode: PersonNode, unionNode: UnionNode };
const edgeTypes = { spouse: SpouseEdge };

export const FamilyTree = ({ currentTheme, onThemeToggle }) => {
  const themeConfig = getThemeConfig(currentTheme);
  const openModal = useModalBlur();

  const [familyModel, setFamilyModel] = useState(() => createSeedFamilyModel());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isDraggingSpouse, setIsDraggingSpouse] = useState(false);

  const [addPersonState, setAddPersonState] = useState({
    open: false,
    data: null,
    connections: [],
    onAddPerson: null,
  });
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleAddPersonRef = useRef(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId && n.type === 'personNode') ?? null,
    [nodes, selectedId],
  );

  const availablePeople = useMemo(
    () =>
      Object.values(familyModel.people).map((p) => ({
        id: p.id,
        label: p.goesBy || p.firstName || 'Unnamed',
      })),
    [familyModel.people],
  );

  useEffect(() => {
    initPlusUtil((open, payload) => setAddPersonState({ open, ...payload }));
  }, []);

  const handleNodeClick = useCallback(
    (nodeId) => {
      setNodes((currentNodes) => {
        const live = currentNodes.find((n) => n.id === nodeId);
        if (live?.type === 'personNode') {
          openModal(() => setSelectedId(nodeId));
        }
        return currentNodes;
      });
    },
    [openModal, setNodes],
  );

  const attachNodeCallbacks = useCallback(
    (node) => {
      if (node.type === 'unionNode') return node;
      return {
        ...node,
        data: {
          ...node.data,
          onClick: () => handleNodeClick(node.id),
          addPersonCallback: (connections) => {
            openModal(() =>
              setAddPersonState({ open: true, data: null, connections, onAddPerson: null }),
            );
          },
        },
      };
    },
    [handleNodeClick, openModal],
  );

  const rebuildFlow = useCallback(() => {
    const { nodes: rawNodes, edges: rawEdges } = buildReactFlowGraph(familyModel, themeConfig);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);
    setNodes(layoutedNodes.map(attachNodeCallbacks));
    setEdges(layoutedEdges);
  }, [familyModel, themeConfig, attachNodeCallbacks, setNodes, setEdges]);

  useEffect(() => {
    rebuildFlow();
  }, [rebuildFlow]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const model = await loadFamilyData();
        setFamilyModel(model);
      } catch (err) {
        console.error('Failed to load family data:', err);
        setFamilyModel(createSeedFamilyModel());
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading && hasLoadedOnce) {
      try {
        saveFamilyData(familyModel);
      } catch (err) {
        console.error('Failed to save family data:', err);
      }
    }
  }, [familyModel, isLoading, hasLoadedOnce]);

  const updateModel = useCallback((fn) => {
    setFamilyModel((m) => fn(m));
  }, []);

  const handleAddPersonLocal = useCallback(
    ({ formData, connections = [] }) => {
      const person = createPersonFromFormData(formData);
      setFamilyModel((m) => {
        let next = addPerson(m, person);
        next = applyConnectionsForNewPerson(next, person.id, connections);
        return next;
      });
      setAddPersonState({ open: false, data: null, connections: [], onAddPerson: null });
    },
    [],
  );

  handleAddPersonRef.current = handleAddPersonLocal;

  const handleDeletePerson = useCallback((personId) => {
    setFamilyModel((m) => deletePerson(m, personId));
    setSelectedId(null);
  }, []);

  const onConnectStart = useCallback((_, { handleId }) => {
    setIsDraggingSpouse(handleId?.startsWith('spouse') ?? false);
  }, []);

  const onConnectEnd = useCallback(() => {
    setIsDraggingSpouse(false);
  }, []);

  const isValidConnection = useCallback((connection) => {
    if (connection.source === connection.target) return false;
    const tid = String(connection.target || '');
    return !tid.startsWith('union:');
  }, []);

  const onConnect = useCallback(
    (params) => {
      const isSpouse = params.sourceHandle?.startsWith('spouse');
      const isParent = params.sourceHandle === 'parent-source';

      if (isSpouse) {
        const a = params.source;
        const b = params.target;
        setFamilyModel((m) => connectSpouses(m, a, b));
      } else if (isParent) {
        const parentId = params.target;
        const childId = params.source;
        setFamilyModel((m) => linkChildToParent(m, childId, parentId));
      } else {
        const parentId = params.source;
        const childId = params.target;
        setFamilyModel((m) => linkChildToParent(m, childId, parentId));
      }
      setIsDraggingSpouse(false);
    },
    [],
  );

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      await clearFamilyData();
      setFamilyModel(createSeedFamilyModel());
      setSelectedId(null);
    }
  };

  const handleAutoLayout = () => {
    rebuildFlow();
  };

  const handleImport = (model) => {
    setFamilyModel(model);
    saveFamilyData(model);
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex' }}>
      <Sidebar
        onAddPerson={() =>
          openModal(() =>
            handleAddPerson({
              onAddPerson: (...args) => handleAddPersonRef.current?.(...args),
            }),
          )
        }
        onAutoLayout={handleAutoLayout}
        onReset={handleReset}
        familyModel={familyModel}
        onImport={handleImport}
        currentTheme={currentTheme}
        onThemeToggle={onThemeToggle}
        onOpenFeedback={() => openModal(() => setFeedbackOpen(true))}
        onOpenComingSoon={() => openModal(() => setComingSoonOpen(true))}
      />

      <Box sx={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineComponent={
            isDraggingSpouse ? SpouseConnectionLine : ParentChildConnectionLine
          }
          deleteKeyCode={null}
          connectionMode="loose"
          fitView
        >
          <Controls />
          <MiniMap />
          <Background {...themeConfig.flowBackgroundConfig} />
        </ReactFlow>
      </Box>

      {selectedNode && (
        <EditPanel
          selectedNode={selectedNode}
          onClose={() => setSelectedId(null)}
          onSave={(updatedNode) => {
            setFamilyModel((m) => ({
              ...m,
              people: {
                ...m.people,
                [updatedNode.id]: { ...m.people[updatedNode.id], ...updatedNode.data, id: updatedNode.id },
              },
            }));
          }}
          onDelete={handleDeletePerson}
          familyModel={familyModel}
          onUpdateModel={updateModel}
        />
      )}

      <PersonForm
        open={addPersonState.open}
        initialData={addPersonState.data}
        initialConnections={addPersonState.connections ?? []}
        availablePeople={availablePeople}
        onClose={() =>
          setAddPersonState({ open: false, data: null, connections: [], onAddPerson: null })
        }
        onSave={({ formData, connections }) => {
          handleAddPersonLocal({ formData, connections });
        }}
      />

      <ComingSoonDialog open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} />
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </Box>
  );
};
