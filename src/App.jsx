import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { AuthProvider } from './context/AuthContext';
import { HomeRoute } from './components/auth/HomeRoute';
import { AuthSessionNotice } from './components/auth/AuthSessionNotice';
import { ErrorBoundary } from './components/dialogs/ErrorBoundary';
import getThemeConfig, { THEMES } from './theme';

// Lazy load heavy components
const Auth = lazy(() => import('./components/auth/Auth').then(module => ({ default: module.Auth })));
const FamilyTree = lazy(() => import('./components/tree/FamilyTree').then(module => ({ default: module.FamilyTree })));

// Loading component
const LoadingFallback = () => (
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

function App() {
  const [currentTheme, setCurrentTheme] = useState(() => 
    localStorage.getItem('theme') || THEMES.VINTAGE
  );
  const themeConfig = getThemeConfig(currentTheme);

  const toggleTheme = () => {
    setCurrentTheme(current => {
      const next = current === THEMES.VINTAGE ? THEMES.DARK : THEMES.VINTAGE;
      localStorage.setItem('theme', next);
      return next;
    });
  };

  return (
    <ErrorBoundary>
      <ThemeProvider theme={themeConfig.muiTheme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <Router>
              <AuthSessionNotice />
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/login" element={<Auth />} />
                  <Route
                    path="/guest"
                    element={
                      <FamilyTree
                        currentTheme={currentTheme}
                        onThemeToggle={toggleTheme}
                        isGuest
                      />
                    }
                  />
                  <Route
                    path="/"
                    element={
                      <HomeRoute>
                        <FamilyTree
                          currentTheme={currentTheme}
                          onThemeToggle={toggleTheme}
                        />
                      </HomeRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;