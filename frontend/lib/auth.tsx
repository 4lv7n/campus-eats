'use client';

import { useApolloClient } from '@apollo/client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ME } from '@/services/auth';
import { User } from '@/types';
import { TOKEN_KEY } from './apollo';

interface AuthContextValue {
  user: User | null;
  loading: boolean; // true while we check the saved token on first page load
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = useApolloClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load: if a token is saved, ask the API "who am I?"
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .query({ query: ME })
      .then((res) => setUser(res.data.me))
      .catch(() => localStorage.removeItem(TOKEN_KEY)) // token expired or invalid
      .finally(() => setLoading(false));
  }, [client]);

  const login = useCallback((token: string, loggedInUser: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    client.clearStore(); // forget cached cart/orders of the previous user
  }, [client]);

  return <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
