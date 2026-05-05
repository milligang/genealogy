import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Tooltip, useTheme } from '@mui/material';
import { Add } from '@mui/icons-material';
import { vintageColors } from '../../theme/vintageTheme';
import { darkColors } from '../../theme/darkTheme';

/**
 * UnionNode — the small visible junction between spouses.
 * Replaces the heart-on-edge approach: spouses connect to this node,
 * children connect down from it.
 *
 * Shows an "Add child" button on hover. The button fires
 * data.onAddChild({ unionId }) so FamilyTree can open the PersonForm
 * pre-connected to this specific union — no ambiguity about which
 * family the child belongs to.
 */
export const UnionNode = ({ data }) => {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;
  const stroke = colors.edgeSpouse || '#9d5c8f';

  const hiddenHandle = {
    width: 1,
    height: 1,
    minWidth: 'unset',
    minHeight: 'unset',
    background: 'transparent',
    border: 'none',
    opacity: 0,
  };

  const handleAddChild = (e) => {
    e.stopPropagation();
    if (data?.onAddChild) data.onAddChild({ unionId: data.unionId });
  };

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Add child button — appears below the union node on hover */}
      <Tooltip title="Add child to this family" placement="bottom" arrow>
        <Box
          onClick={handleAddChild}
          className="nodrag nopan"
          sx={{
            position: 'absolute',
            bottom: -30,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 22,
            height: 22,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            border: `1.5px solid ${stroke}`,
            cursor: 'pointer',
            boxShadow: 1,
            color: stroke,
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? 'auto' : 'none',
            transition: 'opacity 0.15s, transform 0.15s',
            zIndex: 10,
            '&:hover': {
              bgcolor: stroke,
              color: '#fff',
              transform: 'translateX(-50%) scale(1.15)',
            },
          }}
        >
          <Add sx={{ fontSize: 14 }} />
        </Box>
      </Tooltip>

      {/* The union node itself — small filled diamond */}
      <Box
        sx={{
          width: 14,
          height: 14,
          borderRadius: '3px',
          transform: 'rotate(45deg)',
          bgcolor: stroke,
          boxShadow: `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 3px ${stroke}`,
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* Handles — invisible, for edge routing only */}
      <Handle
        id="spouse-in"
        type="target"
        position={Position.Left}
        style={{ ...hiddenHandle, left: -1 }}
      />
      <Handle
        id="spouse-in-right"
        type="target"
        position={Position.Right}
        style={{ ...hiddenHandle, right: -1 }}
      />
      <Handle
        id="child-out"
        type="source"
        position={Position.Bottom}
        style={{ ...hiddenHandle, bottom: -1 }}
      />
    </Box>
  );
};