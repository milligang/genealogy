// Shared styles that work across all themes

// Node styling for ReactFlow nodes
export const nodeStyles = {
  base: {
    padding: '20px',
    minWidth: '180px',
    position: 'relative',
    transition: 'all 0.2s',
  },

  hover: {
    elevation: 6,
    transform: 'translateY(-2px)',
  },

  selected: {
    vintage: {
      border: '3px solid #b8935f',
      boxShadow: '0 6px 16px rgba(92, 74, 47, 0.3)',
    },
    dark: {
      border: '2px solid #667eea',
      boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
    },
  },

  plusButton: (theme, position) => {
    const size = 20;

    let posStyles = {};
    switch (position) {
      case 'top':
        posStyles = { top: -size / 2, left: '50%', transform: 'translateX(-50%)' };
        break;
      case 'bottom':
        posStyles = { bottom: -size / 2, left: '50%', transform: 'translateX(-50%)' };
        break;
      case 'left':
        posStyles = { left: -size / 2, top: '50%', transform: 'translateY(-50%)' };
        break;
      case 'right':
        posStyles = { right: -size / 2, top: '50%', transform: 'translateY(-50%)' };
        break;
      default:
        posStyles = { top: -size / 2, left: '50%', transform: 'translateX(-50%)' };
    }

    return {
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 10,
      ...posStyles,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      '& svg': {
        fontSize: 14,
      },
    };
  },
};

// Edge/Connection styling factory
export const createEdgeStyles = (colors = {}) => ({
  parentChild: {
    // Uses React Flow's built-in smoothstep renderer
    type: 'smoothstep',
    style: {
      stroke: colors.edgeParentChild || '#667eea',
      strokeWidth: 2,
    },
    animated: false,
  },
  spouse: {
    // 'spouse' maps to the custom SpouseEdge component registered in edgeTypes
    type: 'spouse',
    style: {
      stroke: colors.edgeSpouse || '#9d5c8f',
      strokeWidth: 2,
    },
    animated: false,
  },
});

// ReactFlow background configuration factory
export const createFlowBackgroundConfig = (colors = {}) => ({
  variant: 'dots',
  gap: 12,
  size: 1,
  color: colors.backgroundDots || '#888',
  style: {
    backgroundColor: colors.background || '#242424',
  },
});