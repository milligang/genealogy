import React from 'react';
import { Box } from '@mui/material';
import { Add } from '@mui/icons-material';
import { nodeStyles } from '../../theme/sharedStyles';

/**
 * The four hover-reveal + buttons around a PersonNode.
 * Each fires addPersonCallback with the appropriate relationship type.
 */
export const PlusButtons = ({ nodeId, addPersonCallback, theme }) => {
  const handleClick = (e, type) => {
    e.stopPropagation();
    if (addPersonCallback) addPersonCallback([{ nodeId, type }]);
  };

  const plusBtnSx = (position) => ({
    ...nodeStyles.plusButton(theme, position),
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.15s ease',
  });

  return (
    <>
      <Box
        className="plus-btn"
        sx={plusBtnSx('top')}
        onClick={(e) => handleClick(e, 'parent')}
      >
        <Add fontSize="small" />
      </Box>
      <Box
        className="plus-btn"
        sx={plusBtnSx('bottom')}
        onClick={(e) => handleClick(e, 'child')}
      >
        <Add fontSize="small" />
      </Box>
      <Box
        className="plus-btn"
        sx={plusBtnSx('left')}
        onClick={(e) => handleClick(e, 'spouse')}
      >
        <Add fontSize="small" />
      </Box>
      <Box
        className="plus-btn"
        sx={plusBtnSx('right')}
        onClick={(e) => handleClick(e, 'spouse')}
      >
        <Add fontSize="small" />
      </Box>
    </>
  );
};