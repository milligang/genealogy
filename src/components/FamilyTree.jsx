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

import { PersonNode } from './PersonNode';
import { PersonForm } from './PersonForm';
import { EditPanel } from './EditPanel';
import { Sidebar } from './Sidebar';
import { ComingSoonDialog } from './ComingSoonDialog';
import { FeedbackDialog } from './FeedbackDialog';

import {
  loadFamilyData,
  saveFamilyData,
  initialFamilyData,
  clearFamilyData,
} from '../data/people';
import { getLayoutedElements } from '../utils/layoutUtils';
import getThemeConfig from '../theme';
import { initPlusUtil, handleAddPerson } from '../utils/handleAddPerson';
import { createEdgesFromConnections, createNodeFromFormData } from '../utils/appHelpers';

const nodeTypes = { personNode: PersonNode };

export const FamilyTree = ({ currentTheme, onThemeToggle }) => {
  const themeConfig = getThemeConfig(currentTheme);

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
      if (live) setSelectedNode(live);
      return currentNodes;
    });
  }, []);

  // Attach stable callbacks to a node's data — centralised so it's consistent everywhere
  const attachNodeCallbacks = useCallback(
    (node) => ({
      ...node,
      data: {
        ...node.data,
        onClick: () => handleNodeClick(node.id),
        addPersonCallback: (...args) => handleAddPersonRef.current?.(...args),
      },
    }),
    [handleNodeClick]
  );

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

  // Save nodes & edges
  useEffect(() => {
    if (!isLoading && hasLoadedOnce) {
      try {
        saveFamilyData(nodes, edges);
      } catch (err) {
        console.error('Failed to save family data:', err);
      }
    }
  }, [nodes, edges, isLoading, hasLoadedOnce]);

  // Add person handler — stored in ref so node callbacks are never stale
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

  // Keep ref in sync with latest handler
  handleAddPersonRef.current = handleAddPersonLocal;

  const handleDeleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  const onConnect = useCallback(
    (params) => {
      const edgeType = params.data?.type === 'spouse' ? 'spouse' : 'parentChild';
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
          handleAddPerson({
            onAddPerson: (...args) => handleAddPersonRef.current?.(...args),
          })
        }
        onAutoLayout={handleAutoLayout}
        onReset={handleReset}
        nodes={nodes}
        edges={edges}
        onImport={handleImport}
        currentTheme={currentTheme}
        onThemeToggle={onThemeToggle}
        onOpenFeedback={() => setFeedbackOpen(true)}
        onOpenComingSoon={() => setComingSoonOpen(true)}
      />

      <Box sx={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
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
          if (addPersonState.onAddPerson) {
            addPersonState.onAddPerson({ formData, connections });
          }
          setAddPersonState({ open: false, data: null, connections: [], onAddPerson: null });
        }}
      />

      <ComingSoonDialog open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} />
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </Box>
  );
};