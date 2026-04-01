import React from 'react';
import { useTheme } from '@mui/material';
import { vintageColors } from '../../theme/vintageTheme';
import { darkColors } from '../../theme/darkTheme';

/**
 * Custom connection line rendered while the user is dragging a spouse edge.
 * Shows a heart icon at the midpoint so the user sees the edge type
 * before releasing.
 */
export const SpouseConnectionLine = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionStatus,
}) => {
  const theme = useTheme();
  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;
  const color = colors.edgeSpouse;
  const isValid = connectionStatus === 'valid';
  const strokeColor = isValid ? color : '#f87171';

  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  return (
    <g>
      <path
        d={`M${fromX},${fromY} L${toX},${toY}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeDasharray="6 3"
        strokeLinecap="round"
      />
      {/* Heart icon at midpoint */}
      <foreignObject
        x={midX - 11}
        y={midY - 11}
        width={22}
        height={22}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: 22, height: 22 }}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={strokeColor}
            style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))' }}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      </foreignObject>
    </g>
  );
};