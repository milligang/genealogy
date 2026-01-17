import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Auth } from './components/Auth';
import { FamilyTree } from './components/FamilyTree';
import getThemeConfig, { THEMES } from './theme';

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
            </Router>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;