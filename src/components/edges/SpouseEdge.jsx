import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getStraightPath } from 'reactflow';
import { useTheme } from '@mui/material';
import { vintageColors } from '../../theme/vintageTheme';
import { darkColors } from '../../theme/darkTheme';

/**
 * Custom React Flow edge for spouse relationships.
 * Renders a straight line with a heart SVG at the midpoint.
 */
export const SpouseEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  selected,
}) => {
  const theme = useTheme();
  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;
  const color = colors.edgeSpouse;

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
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
          <HeartIcon color={color} size={selected ? 22 : 18} />
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const HeartIcon = ({ color, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))' }}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);