// Shared styles that work across all themes

// Node styling for ReactFlow nodes
export const nodeStyles = {
    base: {
      padding: '20px',
      minWidth: '180px',
      position: 'relative',
      transition: 'all 0.2s',
    },
    
    // Vintage theme has decorative inner border
    vintage: {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        bottom: '10px',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '4px',
        pointerEvents: 'none',
      },
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
  };
  
  // Edge/Connection styling factory
  export const createEdgeStyles = (colors) => ({
    parentChild: {
      type: 'smoothstep',
      style: { 
        stroke: colors.edgeParentChild, 
        strokeWidth: 2 
      },
      animated: false,
    },
    spouse: {
      type: 'step',
      style: { 
        stroke: colors.edgeSpouse, 
        strokeWidth: 2,
        strokeDasharray: '5,5',
      },
      animated: false,
    },
  });
  
  // ReactFlow background configuration factory
  export const createFlowBackgroundConfig = (colors) => ({
    variant: 'dots',
    gap: 12,
    size: 1,
    color: colors.backgroundDots,
    style: {
      backgroundColor: colors.background,
    },
  });