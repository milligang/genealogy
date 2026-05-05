import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { Landing } from './Landing';

const LoadingCenter = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      bgcolor: 'background.default',
    }}
  >
    <CircularProgress />
  </Box>
);

/**
 * `/` when logged out: landing (log in / sign up / guest). When logged in: family tree.
 */
export function HomeRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingCenter />;
  }

  if (!user) {
    return <Landing />;
  }

  return children;
}
