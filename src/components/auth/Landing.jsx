import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Container, Stack } from '@mui/material';
import { Login, PersonAdd, MeetingRoom } from '@mui/icons-material';

/**
 * Entry screen when not signed in: same choices as the auth page, without the email form.
 */
export function Landing() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={4} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 1 }}>
            Family Tree
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Build and edit your tree here. Sign in to save progress.
          </Typography>

          <Stack spacing={1.5}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<Login />}
              onClick={() => navigate('/login')}
              sx={{ py: 1.25, textTransform: 'none' }}
            >
              Log in
            </Button>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<PersonAdd />}
              onClick={() => navigate('/login?mode=signup')}
              sx={{ py: 1.25, textTransform: 'none' }}
            >
              Sign up / Create account
            </Button>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<MeetingRoom />}
              onClick={() => navigate('/guest')}
              sx={{ py: 1.25, textTransform: 'none' }}
            >
              Continue as guest
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 3, textAlign: 'center' }}>
            Guest mode keeps your tree in this tab only until you close it.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
