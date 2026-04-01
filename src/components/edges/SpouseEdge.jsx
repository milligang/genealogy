import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getStraightPath, getBezierPath } from 'reactflow';
import { useTheme } from '@mui/material';

/**
 * Custom React Flow edge for spouse relationships.
 * Renders a styled line with a small wedding ring SVG at the midpoint.
 */
export const SpouseEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}) => {
  const theme = useTheme();
  const color = theme.palette.mode === 'dark' ? '#c084fc' : '#9d5c8f';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
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
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'none',
            zIndex: 10,
          }}
          className="nodrag nopan"
        >
          <WeddingRingIcon color={color} size={selected ? 22 : 18} />
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

/**
 * SVG wedding ring icon — two interlocked bands with a small diamond.
 */
const WeddingRingIcon = ({ color, size = 18 }) => {
  const bg = color;
  const s = size;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))' }}
    >
      {/* Left ring band */}
      <circle
        cx="9"
        cy="14"
        r="5"
        stroke={bg}
        strokeWidth="2.2"
        fill="white"
        fillOpacity="0.85"
      />
      {/* Right ring band */}
      <circle
        cx="15"
        cy="14"
        r="5"
        stroke={bg}
        strokeWidth="2.2"
        fill="white"
        fillOpacity="0.85"
      />
      {/* Diamond shape on top */}
      <polygon
        points="12,2 14.5,5.5 12,8 9.5,5.5"
        fill={bg}
        stroke={bg}
        strokeWidth="0.5"
        opacity="0.9"
      />
      {/* Diamond shine */}
      <polygon
        points="12,3 13.2,5.5 12,5"
        fill="white"
        opacity="0.5"
      />
    </svg>
  );
};