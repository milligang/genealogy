import React from 'react';
import { useTheme } from '@mui/material';

/**
 * Custom connection line rendered while the user is dragging a spouse edge.
 * Shows the wedding ring icon at the midpoint so the user sees the edge type
 * before releasing.
 *
 * Register this in ReactFlow only when pendingEdgeType === 'spouse':
 *   <ReactFlow connectionLineComponent={SpouseConnectionLine} ... />
 */
export const SpouseConnectionLine = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionStatus,
}) => {
  const theme = useTheme();
  const color = theme.palette.mode === 'dark' ? '#c084fc' : '#9d5c8f';
  const isValid = connectionStatus === 'valid';

  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  // Simple cubic bezier control points for a natural curve
  const dx = Math.abs(toX - fromX);
  const c1x = fromX;
  const c1y = fromY + dx * 0.5;
  const c2x = toX;
  const c2y = toY - dx * 0.5;

  const d = `M${fromX},${fromY} C${c1x},${c1y} ${c2x},${c2y} ${toX},${toY}`;

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={isValid ? color : '#f87171'}
        strokeWidth={2}
        strokeDasharray="6 3"
        strokeLinecap="round"
      />
      {/* Ring icon at midpoint */}
      <foreignObject
        x={midX - 11}
        y={midY - 11}
        width={22}
        height={22}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{ width: 22, height: 22 }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))' }}
          >
            <circle cx="9" cy="14" r="5" stroke={isValid ? color : '#f87171'} strokeWidth="2.2" fill="white" fillOpacity="0.85" />
            <circle cx="15" cy="14" r="5" stroke={isValid ? color : '#f87171'} strokeWidth="2.2" fill="white" fillOpacity="0.85" />
            <polygon points="12,2 14.5,5.5 12,8 9.5,5.5" fill={isValid ? color : '#f87171'} strokeWidth="0.5" opacity="0.9" />
            <polygon points="12,3 13.2,5.5 12,5" fill="white" opacity="0.5" />
          </svg>
        </div>
      </foreignObject>
    </g>
  );
};