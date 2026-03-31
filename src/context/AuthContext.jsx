import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../supabaseClient';

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
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    // Fetch session once
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (mounted) {
          if (error) {
            console.error('Session error:', error);
            setError(error);
          }
          setUser(session?.user ?? null);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          console.error('Session catch error:', err);
          setError(err);
          setLoading(false);
        }
      });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      setError(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};