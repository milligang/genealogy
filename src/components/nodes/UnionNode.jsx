import React from 'react';
import { Handle, Position } from 'reactflow';
import { Box, useTheme } from '@mui/material';
import { vintageColors } from '../../theme/vintageTheme';
import { darkColors } from '../../theme/darkTheme';

/**
 * Compact junction for Dagre: spouses connect in, children connect down.
 */
export const UnionNode = () => {
  const theme = useTheme();
  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;
  const stroke = colors.edgeSpouse || '#9d5c8f';

  const handleStyle = {
    width: 6,
    height: 6,
    background: stroke,
    border: 'none',
  };

  return (
    <Box
      sx={{
        width: 36,
        height: 28,
        borderRadius: 1,
        border: `2px solid ${stroke}`,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.85)',
        position: 'relative',
        pointerEvents: 'none',
      }}
    >
      <Handle
        id="spouse-in"
        type="target"
        position={Position.Top}
        style={{ ...handleStyle, top: -4 }}
      />
      <Handle
        id="child-out"
        type="source"
        position={Position.Bottom}
        style={{ ...handleStyle, bottom: -4 }}
      />
    </Box>
  );
};
