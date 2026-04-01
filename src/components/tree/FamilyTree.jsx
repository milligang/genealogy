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
import { ParentChildConnectionLine } from '../edges/ParentChildConnection';
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

  useEffect(() => {
    initPlusUtil((open, payload) => setAddPersonState({ open, ...payload }));
  }, []);

  const handleNodeClick = useCallback((nodeId) => {
    setNodes((currentNodes) => {
      const live = currentNodes.find((n) => n.id === nodeId);
      if (live) {
        openModal(() => setSelectedNode(live));
      }
      return currentNodes;
    });
  }, [openModal]);

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

  useEffect(() => {
    if (!isLoading && hasLoadedOnce) {
      try {
        saveFamilyData(nodes, edges);
      } catch (err) {
        console.error('Failed to save family data:', err);
      }
    }
  }, [nodes, edges, isLoading, hasLoadedOnce]);

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

  // Set spouse drag state based on which handle the drag originated from
  const onConnectStart = useCallback((_, { handleId }) => {
    setIsDraggingSpouse(handleId?.startsWith('spouse') ?? false);
  }, []);

  const onConnectEnd = useCallback(() => {
    setIsDraggingSpouse(false);
  }, []);

  // All nodes are valid targets — edge type is determined solely by the source handle.
  // Only block self-connections.
  const isValidConnection = useCallback((connection) => {
    return connection.source !== connection.target;
  }, []);

  const onConnect = useCallback(
    (params) => {
      const isSpouse = params.sourceHandle?.startsWith('spouse');
      const isParent = params.sourceHandle === 'parent-source';

      let edgeConfig, dataType, finalParams;

      if (isSpouse) {
        // spouse-left/right → connect to the opposite spouse handle on target
        edgeConfig = themeConfig.edgeStyles.spouse;
        dataType = 'spouse';
        const targetHandle = params.sourceHandle === 'spouse-left' ? 'spouse-right' : 'spouse-left';
        finalParams = { ...params, targetHandle };
      } else if (isParent) {
        // top (parent-source)
        // source node is the child, target node is the parent.
        // Edge flows parent→child so flip source/target, connect bottom→top.
        edgeConfig = themeConfig.edgeStyles.parentChild;
        dataType = 'parent-child';
        finalParams = {
          ...params,
          source: params.target,
          target: params.source,
          sourceHandle: 'child-source',
          targetHandle: 'parent-source',
        };
      } else {
        // bottom (child-source)
        // source node is the parent, target node is the child.
        edgeConfig = themeConfig.edgeStyles.parentChild;
        dataType = 'parent-child';
        finalParams = {
          ...params,
          sourceHandle: 'child-source',
          targetHandle: 'parent-source',
        };
      }

      setEdges((eds) =>
        addEdge({ ...finalParams, ...edgeConfig, data: { type: dataType } }, eds)
      );
      setIsDraggingSpouse(false);
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