import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Tooltip, useTheme } from '@mui/material';
import { ArrowCircleDownOutlined } from '@mui/icons-material';
import { vintageColors } from '../../theme/vintageTheme';
import { darkColors } from '../../theme/darkTheme';
import { DAGRE_UNION_W, DAGRE_UNION_H } from '../../utils/unionNodeLayout';

/**
 * UnionNode — junction between spouses; children attach below.
 * Large hit target matches Dagre dimensions so auto-layout and drag-follow stay aligned.
 */
const UNION_TOOLBAR_HIDE_MS = 220;

export const UnionNode = ({ data }) => {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const hideTimerRef = useRef(null);

  const clearHide = useCallback(() => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const showActions = useCallback(() => {
    clearHide();
    setHovered(true);
  }, [clearHide]);

  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      setHovered(false);
    }, UNION_TOOLBAR_HIDE_MS);
  }, [clearHide]);

  useEffect(() => () => clearHide(), [clearHide]);

  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;
  const lineAndDot = colors.edgeParentChild;

  const hiddenHandle = {
    width: 8,
    height: 8,
    minWidth: 'unset',
    minHeight: 'unset',
    background: 'transparent',
    border: 'none',
    opacity: 0,
    pointerEvents: 'none',
  };

  const handleAddChild = (e) => {
    e.stopPropagation();
    if (data?.onAddChild) data.onAddChild({ unionId: data.unionId });
  };

  return (
    <Box
      onMouseEnter={showActions}
      onMouseLeave={scheduleHide}
      className="nodrag nopan"
      sx={{
        width: DAGRE_UNION_W,
        height: DAGRE_UNION_H,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <Tooltip placement="bottom" arrow enterDelay={200} describeChild title="Child">
        <Box
          component="button"
          type="button"
          aria-label="Child"
          onClick={handleAddChild}
          className="nodrag nopan"
          sx={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            border: `1.5px solid ${lineAndDot}`,
            cursor: 'pointer',
            boxShadow: 1,
            color: lineAndDot,
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? 'auto' : 'none',
            transition: 'opacity 0.15s, background-color 0.15s, color 0.15s, transform 0.15s',
            zIndex: 10,
            p: 0,
            font: 'inherit',
            '&:hover': {
              bgcolor: lineAndDot,
              color: '#fff',
              transform: 'translateX(-50%) scale(1.06)',
            },
          }}
        >
          <ArrowCircleDownOutlined sx={{ fontSize: 22 }} />
        </Box>
      </Tooltip>

      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: lineAndDot,
          border: `2px solid ${theme.palette.background.paper}`,
          boxShadow: `0 0 0 1px ${lineAndDot}`,
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
        }}
      />

      <Handle id="spouse-in" type="target" position={Position.Left} style={hiddenHandle} />
      <Handle id="spouse-in-right" type="target" position={Position.Right} style={hiddenHandle} />
      <Handle id="child-out" type="source" position={Position.Bottom} style={hiddenHandle} />
    </Box>
  );
};
