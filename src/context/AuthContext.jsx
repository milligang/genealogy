import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '../supabaseClient';
import {
  recoverAuthSession,
  humanAuthErrorMessage,
} from '../utils/authSessionRecovery';
import { deriveAuthUserFromChange } from '../utils/deriveAuthUserFromChange';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState(null);

  const clearAuthNotice = useCallback(() => {
    setAuthNotice(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscription = { unsubscribe: () => {} };

    (async () => {
      try {
        const result = await recoverAuthSession();
        if (!mounted) return;

        setUser(result.user ?? null);

        if (result.recoveredFromInvalidStorage) {
          setAuthNotice(
            'Your saved sign-in was no longer valid and has been cleared on this device. Sign in again to use cloud save.',
          );
        } else if (result.error && !result.user) {
          setAuthNotice(humanAuthErrorMessage(result.error));
        }

        setLoading(false);

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) return;
          const next = deriveAuthUserFromChange(event, session);
          if (next.kind === 'skip') return;
          if (next.kind === 'clear') {
            setUser(null);
            return;
          }
          setUser(next.user);
        });
        subscription = data.subscription;
        if (!mounted) subscription.unsubscribe();
      } catch (err) {
        console.error('Auth init error:', err);
        if (!mounted) return;
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          /* ignore */
        }
        setUser(null);
        setAuthNotice(humanAuthErrorMessage(err));
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setAuthNotice(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      setAuthNotice(humanAuthErrorMessage(error));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authNotice, clearAuthNotice, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
