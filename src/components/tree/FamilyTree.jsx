import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@mui/material';

import { PersonNode } from '../nodes/PersonNode';
import { PersonForm } from '../editing/PersonForm';
import { EditPanel } from '../editing/EditPanel';
import { Sidebar } from '../layout/Sidebar';
import { SpouseEdge } from '../edges/SpouseEdge';
import { SpouseConnectionLine } from '../edges/SpouseConnection';
import { ComingSoonDialog } from '../dialogs/ComingSoonDialog';
import { FeedbackDialog } from '../dialogs/FeedbackDialog';

import {
  loadFamilyData,
  saveFamilyData,
  initialFamilyData,
  clearFamilyData,
} from '../../data/people';
import { getLayoutedElements } from '../../utils/layoutUtils';
import getThemeConfig from '../../theme';
import { initPlusUtil, handleAddPerson } from '../../utils/handleAddPerson';
import { createEdgesFromConnections, createNodeFromFormData } from '../../utils/appHelpers';
import { useModalBlur } from '../../hooks/useModalBlur';

// Defined outside component to satisfy the React Flow nodeTypes stability requirement
const nodeTypes = { personNode: PersonNode };
const edgeTypes = { spouse: SpouseEdge };

export const FamilyTree = ({ currentTheme, onThemeToggle }) => {
  const themeConfig = getThemeConfig(currentTheme);
  const openModal = useModalBlur();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [addPersonState, setAddPersonState] = useState({
    open: false,
    data: null,
    connections: [],
    onAddPerson: null,
  });
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Stable ref so node callbacks always call the latest handler
  const handleAddPersonRef = useRef(null);

  // Initialize plus-button util
  useEffect(() => {
    initPlusUtil((open, payload) => setAddPersonState({ open, ...payload }));
  }, []);

  // Node click handler — looks up the live node by id so it's never stale
  const handleNodeClick = useCallback((nodeId) => {
    setNodes((currentNodes) => {
      const live = currentNodes.find((n) => n.id === nodeId);
      if (live) {
        // Blur before "opening" the edit panel so aria-hidden on #root
        // doesn't trap the still-focused React Flow node
        openModal(() => setSelectedNode(live));
      }
      return currentNodes;
    });
  }, [openModal]);

  // Attach stable callbacks to a node's data
  const attachNodeCallbacks = useCallback(
    (node) => ({
      ...node,
      data: {
        ...node.data,
        onClick: () => handleNodeClick(node.id),
        addPersonCallback: (connections) => {
          openModal(() =>
            setAddPersonState({ open: true, data: null, connections, onAddPerson: null })
          );
        },
      },
    }),
    [handleNodeClick, openModal]
  );

  useEffect(() => {
    setNodes((nds) => nds.map(attachNodeCallbacks));
  }, [attachNodeCallbacks]);

  // Load saved tree or initial tree
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = await loadFamilyData();
        const sourceNodes = Array.isArray(savedData.nodes)
          ? savedData.nodes
          : initialFamilyData.nodes;
        const safeEdges = Array.isArray(savedData.edges)
          ? savedData.edges
          : initialFamilyData.edges;

        setNodes(sourceNodes.map(attachNodeCallbacks));
        setEdges(safeEdges);
      } catch (err) {
        console.error('Failed to load family data:', err);
        setNodes(initialFamilyData.nodes.map(attachNodeCallbacks));
        setEdges(initialFamilyData.edges);
      } finally {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    };
    loadData();
  }, []);

  // Save nodes & edges whenever they change (after initial load)
  useEffect(() => {
    if (!isLoading && hasLoadedOnce) {
      try {
        saveFamilyData(nodes, edges);
      } catch (err) {
        console.error('Failed to save family data:', err);
      }
    }
  }, [nodes, edges, isLoading, hasLoadedOnce]);

  // Add person handler
  const handleAddPersonLocal = useCallback(
    ({ formData, connections = [] }) => {
      const baseNode = createNodeFromFormData(formData);
      const newNode = attachNodeCallbacks({
        ...baseNode,
        data: { ...baseNode.data, ...formData },
      });

      const newEdges = connections.length
        ? createEdgesFromConnections(newNode.id, connections, themeConfig)
        : [];

      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [...eds, ...newEdges]);
      setAddPersonState({ open: false, data: null, connections: [], onAddPerson: null });
    },
    [attachNodeCallbacks, themeConfig]
  );

  handleAddPersonRef.current = handleAddPersonLocal;

  const handleDeleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  // Derive edge type from which handle was dragged — no toggle needed
  const onConnect = useCallback(
    (params) => {
      const isSpouse = params.sourceHandle?.startsWith('spouse');
      const edgeType = isSpouse ? 'spouse' : 'parentChild';
      const edgeConfig = themeConfig.edgeStyles[edgeType];
      setEdges((eds) => addEdge({ ...params, ...edgeConfig }, eds));
    },
    [setEdges, themeConfig.edgeStyles]
  );

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      await clearFamilyData();
      setNodes(initialFamilyData.nodes.map(attachNodeCallbacks));
      setEdges(initialFamilyData.edges);
      setSelectedNode(null);
    }
  };

  const handleAutoLayout = () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  };

  const handleImport = (newNodes, newEdges) => {
    const nodesWithCallbacks = newNodes.map(attachNodeCallbacks);
    setNodes(nodesWithCallbacks);
    setEdges(newEdges);
    saveFamilyData(nodesWithCallbacks, newEdges);
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex' }}>
      <Sidebar
        onAddPerson={() =>
          openModal(() =>
            handleAddPerson({
              onAddPerson: (...args) => handleAddPersonRef.current?.(...args),
            })
          )
        }
        onAutoLayout={handleAutoLayout}
        onReset={handleReset}
        nodes={nodes}
        edges={edges}
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
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineComponent={SpouseConnectionLine}
          deleteKeyCode={null}
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
          onClose={() => setSelectedNode(null)}
          onSave={(updatedNode) =>
            setNodes((nds) =>
              nds.map((n) =>
                n.id === updatedNode.id
                  ? attachNodeCallbacks({ ...n, data: updatedNode.data })
                  : n
              )
            )
          }
          onDelete={handleDeleteNode}
          nodes={nodes}
          edges={edges}
          onUpdateConnections={(newEdges) => setEdges(newEdges)}
        />
      )}

      <PersonForm
        open={addPersonState.open}
        initialData={addPersonState.data}
        initialConnections={addPersonState.connections ?? []}
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