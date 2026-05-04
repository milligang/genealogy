import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

/**
 * Global dismissible banner for auth/session issues (stale tokens, network, misconfiguration).
 */
export function AuthSessionNotice() {
  const { authNotice, clearAuthNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!authNotice) return null;

  const onLogin = () => {
    clearAuthNotice();
    navigate('/login', { replace: false });
  };

  const showLoginCta = location.pathname !== '/login';

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: (theme) => theme.zIndex.modal - 1 }}>
      <Alert
        severity="warning"
        onClose={clearAuthNotice}
        sx={{ borderRadius: 0, alignItems: 'center' }}
        action={
          showLoginCta ? (
            <Button color="inherit" size="small" onClick={onLogin}>
              Sign in
            </Button>
          ) : null
        }
      >
        {authNotice}
      </Alert>
    </Box>
  );
}
