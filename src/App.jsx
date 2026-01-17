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
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { PersonNode } from './components/PersonNode';
import { PersonForm } from './components/PersonForm';
import { EditPanel } from './components/EditPanel';
import { Toolbar } from './components/Toolbar';
import { loadFamilyData, saveFamilyData, initialFamilyData, clearFamilyData } from './data/people';
import { getLayoutedElements } from './utils/layoutUtils';
import { createEdgesFromConnections, createNodeFromFormData } from './utils/appHelpers';
import getThemeConfig, { THEMES } from './theme';

const nodeTypes = {
  personNode: PersonNode,
};

export default function App() {
  // Theme state
  const [currentTheme, setCurrentTheme] = useState(THEMES.VINTAGE);
  const themeConfig = getThemeConfig(currentTheme);
  
  // Load initial data from storage
  const savedData = loadFamilyData();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(savedData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(savedData.edges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Auto-save whenever nodes or edges change
  useEffect(() => {
    saveFamilyData(nodes, edges);
  }, [nodes, edges]);

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

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      clearFamilyData();
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

  const toggleTheme = () => {
    setCurrentTheme(current => 
      current === THEMES.VINTAGE ? THEMES.DARK : THEMES.VINTAGE
    );
  };

  return (
    <ThemeProvider theme={themeConfig.muiTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                <Tooltip title={`Switch to ${currentTheme === THEMES.VINTAGE ? 'Dark' : 'Vintage'} Theme`}>
                  <IconButton 
                    onClick={toggleTheme}
                    sx={{ 
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': { bgcolor: 'background.paper' }
                    }}
                  >
                    {currentTheme === THEMES.VINTAGE ? <Brightness4 /> : <Brightness7 />}
                  </IconButton>
                </Tooltip>
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
      </LocalizationProvider>
    </ThemeProvider>
  );
}