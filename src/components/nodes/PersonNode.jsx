import React from 'react';
import { Paper, Box, useTheme } from '@mui/material';
import { Handle, Position } from 'reactflow';
import { vintageColors } from '../../theme/vintageTheme';
import { darkColors } from '../../theme/darkTheme';
import { nodeStyles } from '../../theme/sharedStyles';
import { PlusButtons } from './PlusButtons';
import { PersonNodeAvatar } from './PersonAvatar';
import { PersonNodeDates } from './PersonDates';

export const PersonNode = ({ data, selected }) => {
  const theme = useTheme();

  if (!data) {
    console.error('PersonNode missing data!', data);
    return <Paper>Missing data</Paper>;
  }

  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;

  const genderColors = data.gender
    ? colors.gender[data.gender.toLowerCase()] || colors.gender.other
    : colors.gender.other;

  // Pull handle colors directly from theme color definitions
  const parentChildColor = colors.nodeHandle;
  const spouseColor = colors.edgeSpouse;

  const nodeBaseStyles = {
    ...nodeStyles.base,
    border: '2px solid',
    borderColor: selected ? genderColors.border : genderColors.primary,
    backgroundColor: theme.palette.background.paper,
    // Selected state: use theme shadow style
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

  // Round handles for parent/child
  const handleStyle = (color) => ({
    background: color,
    width: 10,
    height: 10,
    border: `2px solid ${color}`,
    borderRadius: '50%',
  });

  // Diamond handles for spouse — visually distinct from parent/child
  const spouseHandleStyle = {
    background: spouseColor,
    width: 10,
    height: 10,
    border: `2px solid ${spouseColor}`,
    borderRadius: 0,
    transform: 'rotate(45deg)',
    top: '50%',
    marginTop: -5,
  };

  return (
    <Paper
      elevation={selected ? 6 : 3}
      sx={{ ...nodeBaseStyles, cursor: data.onClick ? 'pointer' : 'default' }}
      onClick={handleNodeClick}
    >
      {/* Parent/child handles — top and bottom, round */}
      <Handle
        id="parent-target"
        type="target"
        position={Position.Top}
        style={handleStyle(parentChildColor)}
      />
      <Handle
        id="child-source"
        type="source"
        position={Position.Bottom}
        style={handleStyle(parentChildColor)}
      />

      {/* Spouse handles — left and right, diamond */}
      <Handle
        id="spouse-left"
        type="source"
        position={Position.Left}
        style={spouseHandleStyle}
      />
      <Handle
        id="spouse-right"
        type="source"
        position={Position.Right}
        style={spouseHandleStyle}
      />

      <PlusButtons
        nodeId={data.id}
        addPersonCallback={data.addPersonCallback}
        theme={theme}
      />

      <Box sx={{ cursor: 'pointer' }}>
        <PersonNodeAvatar data={data} genderColors={genderColors} />
        <PersonNodeDates birthDate={data.birthDate} deathDate={data.deathDate} />
      </Box>
    </Paper>
  );
};