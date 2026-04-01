import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  useTheme,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { vintageColors } from '../../theme/vintageTheme';
import { darkColors } from '../../theme/darkTheme';
import getThemeConfig from '../../theme';

export const ConnectionsTab = ({ currentNodeId, nodes, edges, onUpdateConnections, currentTheme }) => {
  const theme = useTheme();
  const themeConfig = getThemeConfig(currentTheme);
  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;

  const [selectedPerson, setSelectedPerson] = useState('');
  const [connectionType, setConnectionType] = useState('child');

  const getConnectedNodes = () => {
    if (!currentNodeId) return [];
    const connected = [];

    edges.forEach((edge) => {
      let relationType = '';
      let node = null;

      if (edge.source === currentNodeId) {
        node = nodes.find((n) => n.id === edge.target);
        relationType = edge.data?.type === 'spouse' ? 'spouse' : 'child';
      } else if (edge.target === currentNodeId) {
        node = nodes.find((n) => n.id === edge.source);
        relationType = edge.data?.type === 'spouse' ? 'spouse' : 'parent';
      }

      if (node) {
        connected.push({ ...node, relationType, edgeId: edge.id });
      }
    });

    return connected;
  };

  const getAvailableNodes = () => {
    if (!currentNodeId) return nodes;
    const connectedIds = getConnectedNodes().map((n) => n.id);

    if (connectionType === 'spouse') {
      const spouseIds = getConnectedNodes()
        .filter((n) => n.relationType === 'spouse')
        .map((n) => n.id);
      return nodes.filter((n) => n.id !== currentNodeId && !spouseIds.includes(n.id));
    }

    return nodes.filter((n) => n.id !== currentNodeId && !connectedIds.includes(n.id));
  };

  const handleAddConnection = () => {
    if (!selectedPerson || !currentNodeId) return;

    const edgeType = connectionType === 'spouse' ? 'spouse' : 'parentChild';
    const edgeConfig = themeConfig.edgeStyles[edgeType];

    let newEdge;
    if (connectionType === 'spouse') {
      newEdge = { source: currentNodeId, target: selectedPerson };
    } else if (connectionType === 'child') {
      newEdge = { source: currentNodeId, target: selectedPerson };
    } else {
      // 'parent' — selected person is the parent
      newEdge = { source: selectedPerson, target: currentNodeId };
    }

    onUpdateConnections([
      ...edges,
      {
        id: `e${currentNodeId}-${selectedPerson}-${Date.now()}`,
        ...newEdge,
        ...edgeConfig,
      },
    ]);

    setSelectedPerson('');
  };

  const handleRemoveConnection = (edgeId) => {
    onUpdateConnections(edges.filter((e) => e.id !== edgeId));
  };

  const getPersonDisplayName = (node) =>
    node.data.goesBy || node.data.firstName || 'Unnamed';

  const getRelationChipColor = (type) => {
    switch (type) {
      case 'spouse': return 'secondary';
      case 'parent': return 'primary';
      case 'child': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" mb={2}>
        Add Connection
      </Typography>
      <Box display="flex" gap={2} mb={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Person</InputLabel>
          <Select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            label="Person"
          >
            {getAvailableNodes().map((node) => (
              <MenuItem key={node.id} value={node.id}>
                {getPersonDisplayName(node)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 130 }} size="small">
          <InputLabel>Type</InputLabel>
          <Select
            value={connectionType}
            onChange={(e) => setConnectionType(e.target.value)}
            label="Type"
          >
            <MenuItem value="spouse">Spouse</MenuItem>
            <MenuItem value="parent">Parent</MenuItem>
            <MenuItem value="child">Child</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Button
        variant="outlined"
        onClick={handleAddConnection}
        disabled={!selectedPerson}
        fullWidth
        sx={{ mb: 3 }}
      >
        Add Connection
      </Button>

      <Typography variant="subtitle2" mb={1}>
        Current Connections
      </Typography>
      <List>
        {getConnectedNodes().map((node) => (
          <ListItem key={node.edgeId} dense>
            <ListItemText primary={getPersonDisplayName(node)} />
            <Chip
              label={node.relationType}
              size="small"
              color={getRelationChipColor(node.relationType)}
              sx={{ mr: 1 }}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                size="small"
                onClick={() => handleRemoveConnection(node.edgeId)}
              >
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        {getConnectedNodes().length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ p: 2, textAlign: 'center' }}
          >
            No connections yet
          </Typography>
        )}
      </List>
    </Box>
  );
};