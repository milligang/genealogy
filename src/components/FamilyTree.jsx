import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, IconButton, Tooltip, Menu, MenuItem, Typography } from '@mui/material';
import { Brightness4, Brightness7, Logout, AccountCircle } from '@mui/icons-material';

import { PersonNode } from './PersonNode';
import { PersonForm } from './PersonForm';
import { EditPanel } from './EditPanel';
import { Toolbar } from './Toolbar';
import { loadFamilyData, saveFamilyData, initialFamilyData, clearFamilyData } from '../data/people';
import { getLayoutedElements } from '../utils/layoutUtils';
import { createEdgesFromConnections, createNodeFromFormData } from '../utils/appHelpers';
import getThemeConfig, { THEMES } from '../theme';
import { useAuth } from '../context/AuthContext';

const nodeTypes = {
  personNode: PersonNode,
};

export const FamilyTree = ({ currentTheme, onThemeToggle }) => {
  const { user, signOut } = useAuth();
  const themeConfig = getThemeConfig(currentTheme);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  // Load initial data from storage when component mounts
  useEffect(() => {
    const loadData = async () => {
      const savedData = await loadFamilyData();
      setNodes(savedData.nodes);
      setEdges(savedData.edges);
      setIsLoading(false);
    };
    loadData();
  }, [setNodes, setEdges]);

  // Auto-save whenever nodes or edges change
  useEffect(() => {
    if (!isLoading && nodes.length > 0) {
      saveFamilyData(nodes, edges);
    }
  }, [nodes, edges, isLoading]);

  const onConnect = useCallback(
    (params) => {
      const edgeType = params.data?.type === 'spouse' ? 'spouse' : 'parentChild';
      const edgeConfig = themeConfig.edgeStyles[edgeType];
      
      setEdges((eds) => addEdge({ 
        ...params, 
        ...edgeConfig,
      }, eds));
    },
    [setEdges, themeConfig.edgeStyles]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setTabValue(0);
  }, []);

  const handleAddPerson = ({ formData, connections }) => {
    const newNode = createNodeFromFormData(formData);
    const newEdges = createEdgesFromConnections(newNode.id, connections, themeConfig);
    
    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, ...newEdges]);
    setShowAddDialog(false);
  };

  const handleUpdateConnections = (newEdges) => {
    setEdges(newEdges);
  };

  const handleSaveSelectedNode = (updatedNode) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === updatedNode.id
          ? { ...node, data: updatedNode.data }
          : node
      )
    );
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      await clearFamilyData();
      setNodes(initialFamilyData.nodes);
      setEdges(initialFamilyData.edges);
      setSelectedNode(null);
    }
  };

  const handleAutoLayout = () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = 
      getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  };

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleCloseMenu();
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100vh', 
      bgcolor: 'background.default', 
      display: 'flex' 
    }}>
      <Box sx={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Panel position="top-left">
            <Toolbar 
              onAddPerson={() => setShowAddDialog(true)}
              onReset={handleReset}
              onAutoLayout={handleAutoLayout}
            />
          </Panel>

          <Panel position="top-right">
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={`Switch to ${currentTheme === THEMES.VINTAGE ? 'Dark' : 'Vintage'} Theme`}>
                <IconButton 
                  onClick={onThemeToggle}
                  sx={{ 
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': { bgcolor: 'background.paper' }
                  }}
                >
                  {currentTheme === THEMES.VINTAGE ? <Brightness4 /> : <Brightness7 />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Account">
                <IconButton 
                  onClick={handleOpenMenu}
                  sx={{ 
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': { bgcolor: 'background.paper' }
                  }}
                >
                  <AccountCircle />
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  <Logout fontSize="small" sx={{ mr: 1 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          </Panel>

          <Controls />
          <MiniMap />
          <Background {...themeConfig.flowBackgroundConfig} />
        </ReactFlow>
      </Box>

      {/* Side Panel for Editing */}
      {selectedNode && (
        <EditPanel
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          tabValue={tabValue}
          onTabChange={setTabValue}
          onSave={handleSaveSelectedNode}
          onUpdate={setSelectedNode}
          nodes={nodes}
          edges={edges}
          onUpdateConnections={handleUpdateConnections}
        />
      )}

      {/* Dialog for Adding New Person */}
      <PersonForm
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={handleAddPerson}
      />
    </Box>
  );
};