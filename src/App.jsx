import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import getThemeConfig, { THEMES } from './theme';

// Lazy load heavy components
const Auth = lazy(() => import('./components/Auth').then(module => ({ default: module.Auth })));
const FamilyTree = lazy(() => import('./components/FamilyTree').then(module => ({ default: module.FamilyTree })));

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
  const [currentTheme, setCurrentTheme] = useState(THEMES.VINTAGE);
  const themeConfig = getThemeConfig(currentTheme);

  const toggleTheme = () => {
    setCurrentTheme(current => 
      current === THEMES.VINTAGE ? THEMES.DARK : THEMES.VINTAGE
    );
  };

  return (
    <ErrorBoundary>
      <ThemeProvider theme={themeConfig.muiTheme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <Router>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/login" element={<Auth />} />
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <FamilyTree 
                          currentTheme={currentTheme}
                          onThemeToggle={toggleTheme}
                        />
                      </ProtectedRoute>
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