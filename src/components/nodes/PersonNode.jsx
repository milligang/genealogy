import React, { useState } from 'react';
import { Paper, Box, Typography, Tooltip, useTheme } from '@mui/material';
import { Handle, Position } from 'reactflow';
import { PersonAdd, FamilyRestroom, Elderly } from '@mui/icons-material';
import { vintageColors } from '../../theme/vintageTheme';
import { darkColors } from '../../theme/darkTheme';
import { nodeStyles } from '../../theme/sharedStyles';
import { PersonNodeAvatar } from './PersonAvatar';
import { PersonNodeDates } from './PersonDates';

// All handles are invisible — they exist only so ReactFlow can route edges.
// Users never drag from them; connections are made via the hover action buttons.
const hiddenHandle = {
  width: 1,
  height: 1,
  minWidth: 'unset',
  minHeight: 'unset',
  background: 'transparent',
  border: 'none',
  pointerEvents: 'none',
  opacity: 0,
};

function ActionButton({ icon, label, onClick }) {
  return (
    <Tooltip title={label} placement="top" arrow>
      <Box
        onClick={onClick}
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          border: '1.5px solid',
          borderColor: 'divider',
          cursor: 'pointer',
          boxShadow: 1,
          color: 'text.secondary',
          transition: 'all 0.15s',
          '&:hover': {
            bgcolor: 'primary.main',
            borderColor: 'primary.main',
            color: 'primary.contrastText',
            transform: 'scale(1.15)',
            boxShadow: 2,
          },
        }}
      >
        {icon}
      </Box>
    </Tooltip>
  );
}

export const PersonNode = ({ data, selected }) => {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);

  if (!data) {
    console.error('[PersonNode] Rendered with no data.');
    return (
      <Paper sx={{ p: 2, border: '2px solid red' }}>
        <Typography color="error">⚠ Missing node data</Typography>
      </Paper>
    );
  }

  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;
  const genderColors = data.gender
    ? colors.gender[data.gender.toLowerCase()] || colors.gender.other
    : colors.gender.other;

  const handleNodeClick = (e) => {
    e.stopPropagation();
    if (data.onClick) data.onClick({ ...data, nodeId: data.id });
  };

  const handleAction = (e, type) => {
    e.stopPropagation();
    if (!data.onAction) return;
    data.onAction({ type, nodeId: data.id });
  };

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{ position: 'relative' }}
    >
      {/* Hover action toolbar — floats above the card */}
      <Box
        sx={{
          position: 'absolute',
          top: -36,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 0.75,
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? 'auto' : 'none',
          transition: 'opacity 0.15s',
          zIndex: 10,
          // Prevent the toolbar from triggering ReactFlow pan
          className: 'nodrag nopan',
        }}
        className="nodrag nopan"
      >
        <ActionButton
          icon={<Elderly sx={{ fontSize: 14 }} />}
          label="Add parent"
          onClick={(e) => handleAction(e, 'parent')}
        />
        <ActionButton
          icon={<FamilyRestroom sx={{ fontSize: 14 }} />}
          label="Add child"
          onClick={(e) => handleAction(e, 'child')}
        />
        <ActionButton
          icon={<PersonAdd sx={{ fontSize: 14 }} />}
          label="Add spouse"
          onClick={(e) => handleAction(e, 'spouse')}
        />
      </Box>

      <Paper
        elevation={selected ? 6 : hovered ? 4 : 2}
        onClick={handleNodeClick}
        sx={{
          ...nodeStyles.base,
          cursor: 'pointer',
          borderLeft: `4px solid ${genderColors.primary}`,
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          outline: selected ? `2px solid ${genderColors.border}` : 'none',
          outlineOffset: 2,
          backgroundColor: theme.palette.background.paper,
          transition: 'box-shadow 0.15s, outline 0.15s',
          ...(selected && {
            boxShadow: theme.palette.mode === 'dark'
              ? nodeStyles.selected.dark.boxShadow
              : nodeStyles.selected.vintage.boxShadow,
          }),
          position: 'relative',
        }}
      >
        {/* Invisible handles — edge routing only */}
        <Handle id="parent-source" type="source" position={Position.Top}    style={hiddenHandle} />
        <Handle id="parent-target" type="target" position={Position.Top}    style={hiddenHandle} />
        <Handle id="child-source"  type="source" position={Position.Bottom} style={hiddenHandle} />
        <Handle id="child-target"  type="target" position={Position.Bottom} style={hiddenHandle} />
        <Handle id="spouse-left"   type="source" position={Position.Left}   style={hiddenHandle} />
        <Handle id="spouse-right"  type="source" position={Position.Right}  style={hiddenHandle} />

        <PersonNodeAvatar data={data} genderColors={genderColors} />
        <PersonNodeDates birthDate={data.birthDate} deathDate={data.deathDate} />
      </Paper>
    </Box>
  );
};