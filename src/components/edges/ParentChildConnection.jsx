import React from 'react';
import { useTheme } from '@mui/material';
import { vintageColors } from '../../theme/vintageTheme';
import { darkColors } from '../../theme/darkTheme';

/**
 * Plain connection line for parent/child edge drags.
 * No icon — just a straight styled line in the parent/child color.
 */
export const ParentChildConnectionLine = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionStatus,
}) => {
  const theme = useTheme();
  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;
  const color = colors.nodeHandle;
  const isValid = connectionStatus === 'valid';

  return (
    <g>
      <path
        d={`M${fromX},${fromY} L${toX},${toY}`}
        fill="none"
        stroke={isValid ? color : '#f87171'}
        strokeWidth={2}
        strokeDasharray="6 3"
        strokeLinecap="round"
      />
    </g>
  );
};