import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material';
import { Favorite, FamilyRestroom } from '@mui/icons-material';

/**
 * Floating toolbar that lets the user choose what kind of edge
 * will be created when they drag a connection in React Flow.
 */
export const EdgeTypeToggle = ({ value, onChange }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3,
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        Connection type:
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, val) => val && onChange(val)}
        size="small"
      >
        <ToggleButton value="parentChild" sx={{ gap: 0.5, px: 1.5 }}>
          <FamilyRestroom fontSize="small" />
          <Typography variant="caption">Parent / Child</Typography>
        </ToggleButton>
        <ToggleButton value="spouse" sx={{ gap: 0.5, px: 1.5 }}>
          <Favorite fontSize="small" />
          <Typography variant="caption">Spouse</Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};