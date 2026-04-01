import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Box,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const FEATURES = [
  { title: 'Profile photos', description: 'Add and crop photos for each person in your tree.', status: 'planned' },
  { title: 'Share & collaborate', description: 'Invite family members to view or edit the tree together.', status: 'planned' },
  { title: 'Search & filter', description: 'Quickly find people by name, birth year, or relationship.', status: 'planned' },
  { title: 'Timeline view', description: 'See your family history laid out chronologically.', status: 'planned' },
  { title: 'Export to PDF', description: 'Download a clean, printable version of your tree.', status: 'planned' },
  { title: 'Custom node styles', description: 'Customize colors and styles for different branches.', status: 'planned' },
];

const STATUS_LABEL = {
  planned: { label: 'Planned', color: 'info', bg: '#646cff1a' }, // soft blue background
  'in-progress': { label: 'In Progress', color: 'primary', bg: '#00b8941a' }, // light green
  beta: { label: 'Beta', color: 'success', bg: '#f9ca241a' }, // light yellow
};

export const ComingSoonDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Coming Soon</DialogTitle>
      <Divider />

      <DialogContent sx={{ px: 1.5, py: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {FEATURES.map((feature) => {
            const status = STATUS_LABEL[feature.status];
            return (
              <Accordion
                key={feature.title}
                disableGutters
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${status.bg}`,
                  backgroundColor: status.bg,
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    px: 2,
                    minHeight: 48,
                    '& .MuiAccordionSummary-content': { margin: '8px 0' },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {feature.title}
                    </Typography>
                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                      sx={{ fontSize: 11, height: 22 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pb: 1.5, pt: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    {feature.description}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ fontWeight: 500 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};