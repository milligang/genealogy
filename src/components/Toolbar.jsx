import React from 'react';
import { Paper, Typography, Button, Box } from '@mui/material';
import { AccountTree, PersonAdd, RestartAlt } from '@mui/icons-material';

export const Toolbar = ({ onAddPerson, onAutoLayout, onReset }) => {
  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
        <AccountTree />
        Family Tree Builder
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={onAddPerson}
          fullWidth
        >
          Add Person
        </Button>
        <Button variant="outlined" onClick={onAutoLayout}>
          Auto Layout
        </Button>
        <Button
          variant="outlined"
          startIcon={<RestartAlt />}
          onClick={onReset}
          fullWidth
          size="small"
        >
          Reset Data
        </Button>
      </Box>
    </Paper>
  );
};