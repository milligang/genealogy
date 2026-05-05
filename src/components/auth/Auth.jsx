import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Tabs,
  Tab,
  Container,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import supabase from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

export const Auth = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const fromGuest = searchParams.get('from') === 'guest';
  const [tabValue, setTabValue] = useState(() => (searchParams.get('mode') === 'signup' ? 1 : 0));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const mode = searchParams.get('mode');
    setTabValue(mode === 'signup' ? 1 : 0);
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleTabChange = (_e, next) => {
    setError('');
    setMessage('');
    setTabValue(next);
    const nextParams = new URLSearchParams(searchParams);
    if (next === 1) nextParams.set('mode', 'signup');
    else nextParams.delete('mode');
    setSearchParams(nextParams, { replace: true });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      setMessage('Check your email for the confirmation link!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          {fromGuest && (
            <Button
              startIcon={<ArrowBack fontSize="small" />}
              onClick={() => navigate('/guest')}
              sx={{ mb: 2, textTransform: 'none', color: 'text.secondary' }}
            >
              Back to guest tree
            </Button>
          )}

          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 2 }}>
            Family Tree
          </Typography>

          {fromGuest && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You&apos;re signing in from guest mode. Your guest tree stays on this device until you close the tab.
              After you log in, you&apos;ll see your <strong>cloud-saved</strong> tree—download a backup first if you
              want to keep this guest session as a file.
            </Alert>
          )}

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            sx={{ mb: 2 }}
          >
            <Tab label="Sign In" id="auth-tab-signin" aria-controls="auth-tabpanel-signin" />
            <Tab label="Sign Up" id="auth-tab-signup" aria-controls="auth-tabpanel-signup" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          <form onSubmit={tabValue === 0 ? handleSignIn : handleSignUp}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={tabValue === 0 ? 'current-password' : 'new-password'}
                helperText={tabValue === 1 ? 'Minimum 6 characters' : ''}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ textTransform: 'none' }}
              >
                {loading ? 'Loading…' : tabValue === 0 ? 'Sign In' : 'Sign Up'}
              </Button>

              <Button
                type="button"
                variant="outlined"
                size="large"
                fullWidth
                disabled={loading}
                onClick={() => navigate('/guest')}
                sx={{ textTransform: 'none' }}
              >
                Continue as guest
              </Button>
            </Box>
          </form>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2, textAlign: 'center' }}>
            Guest mode uses this tab only—nothing is uploaded until you sign in, and guest data is removed when you
            close the tab.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};
