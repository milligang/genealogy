import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
} from '@mui/material';

export const FeedbackDialog = ({ open, onClose }) => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    console.log('User submitted feedback:', feedback);
    alert('Thanks for your feedback!');
    setFeedback('');
    onClose();
    // Later: send `feedback` to backend / Supabase
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Feedback / Feature Request</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Have a suggestion or found a bug? Let us know.
        </Typography>
        <TextField
          label="Your feedback"
          multiline
          rows={5}
          fullWidth
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};