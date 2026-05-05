import React from 'react';
import { Paper, Box, useTheme } from '@mui/material';
import { Handle, Position } from 'reactflow';
import { vintageColors } from '../../theme/vintageTheme';
import { darkColors } from '../../theme/darkTheme';
import { nodeStyles } from '../../theme/sharedStyles';
import { PersonNodeAvatar } from './PersonAvatar';
import { PersonNodeDates } from './PersonDates';

// Invisible target handle — gives edges from buildReactFlowGraph a valid landing point.
// Zero-size, no pointer events, so it never appears or interferes with the visible handles.
const hiddenTargetStyle = {
  width: 1,
  height: 1,
  minWidth: 'unset',
  minHeight: 'unset',
  background: 'transparent',
  border: 'none',
  pointerEvents: 'none',
  opacity: 0,
};

export const PersonNode = ({ data, selected }) => {
  const theme = useTheme();

  if (!data) {
    console.error('[PersonNode] Rendered with no data — node will be empty.');
    return <Paper sx={{ p: 2, border: '2px solid red' }}>⚠ Missing node data</Paper>;
  }

  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;

  const genderColors = data.gender
    ? colors.gender[data.gender.toLowerCase()] || colors.gender.other
    : colors.gender.other;

  const parentChildColor = colors.nodeHandle;
  const spouseColor = colors.edgeSpouse;

  const nodeBaseStyles = {
    ...nodeStyles.base,
    border: '2px solid',
    borderColor: selected ? genderColors.border : genderColors.primary,
    backgroundColor: theme.palette.background.paper,
    ...(selected && {
      boxShadow: theme.palette.mode === 'dark'
        ? nodeStyles.selected.dark.boxShadow
        : nodeStyles.selected.vintage.boxShadow,
    }),
    position: 'relative',
    '&:hover .plus-btn': {
      opacity: 1,
      pointerEvents: 'auto',
    },
  };

  const handleNodeClick = (e) => {
    e.stopPropagation();
    if (data.onClick) data.onClick({ ...data, nodeId: data.id });
  };

  const parentHandleStyle = {
    background: parentChildColor,
    width: 18,
    height: 18,
    border: `2px solid ${parentChildColor}`,
    borderRadius: '50%',
  };

  const spouseHandleStyle = {
    background: spouseColor,
    width: 18,
    height: 18,
    border: `2px solid ${spouseColor}`,
    borderRadius: 0,
    transform: 'rotate(45deg)',
    top: '50%',
    marginTop: -9,
  };

  return (
    <Paper
      elevation={selected ? 6 : 3}
      sx={{ ...nodeBaseStyles, cursor: data.onClick ? 'pointer' : 'default' }}
      onClick={handleNodeClick}
    >
      {/* Visible source handles — users drag from these to create connections */}
      <Handle id="parent-source" type="source" position={Position.Top}    style={parentHandleStyle} />
      <Handle id="child-source"  type="source" position={Position.Bottom} style={parentHandleStyle} />
      <Handle id="spouse-left"   type="source" position={Position.Left}   style={spouseHandleStyle} />
      <Handle id="spouse-right"  type="source" position={Position.Right}  style={spouseHandleStyle} />

      {/*
        Invisible target handle — union→child edges from buildReactFlowGraph
        use targetHandle: 'parent-target'. ReactFlow requires a type="target"
        handle with a matching id; without it the edge is silently dropped.
      */}
      <Handle id="parent-target" type="target" position={Position.Top} style={hiddenTargetStyle} />

      <Box sx={{ cursor: 'pointer' }}>
        <PersonNodeAvatar data={data} genderColors={genderColors} />
        <PersonNodeDates birthDate={data.birthDate} deathDate={data.deathDate} />
      </Box>
    </Paper>
  );
};