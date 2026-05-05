import React from 'react';
import { BaseEdge, getStraightPath } from 'reactflow';
import { useTheme } from '@mui/material';
import { vintageColors } from '../../theme/vintageTheme';
import { darkColors } from '../../theme/darkTheme';

/**
 * SpouseEdge — plain styled line connecting a person to a union node.
 * The union node itself is the visual marker; no heart needed here.
 */
export const SpouseEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}) => {
  const theme = useTheme();
  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;
  const color = colors.edgeSpouse;

  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: color,
        strokeWidth: 2,
        ...style,
      }}
    />
  );
};