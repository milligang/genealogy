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

  const handleColor =
    theme.palette.mode === 'dark'
      ? theme.palette.primary.main
      : theme.palette.secondary.main;

  const nodeBaseStyles = {
    ...nodeStyles.base,
    border: '2px solid',
    borderColor: selected ? genderColors.border : genderColors.primary,
    backgroundColor: theme.palette.background.paper,
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

  return (
    <Paper
      elevation={selected ? 6 : 3}
      sx={{ ...nodeBaseStyles, cursor: data.onClick ? 'pointer' : 'default' }}
      onClick={handleNodeClick}
    >
      <Handle
        id="target-top"
        type="target"
        position={Position.Top}
        style={{ background: handleColor, width: 10, height: 10 }}
      />
      <Handle
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        style={{ background: handleColor, width: 10, height: 10 }}
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