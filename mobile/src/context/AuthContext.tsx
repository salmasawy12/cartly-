import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client';
import { AuthResponse } from '../types';

type AuthUser = { id: number; email: string; displayName: string };
type MeResponse = { userId: number; email: string; displayName: string };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await api.get<MeResponse>('/api/auth/me');
        setUser({ id: me.userId, email: me.email, displayName: me.displayName });
      } catch {
        // Stored token is stale/invalid - fall back to the login screen.
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function applyAuthResponse(response: AuthResponse) {
    await setToken(response.token);
    setUser({ id: response.userId, email: response.email, displayName: response.displayName });
  }

  async function login(email: string, password: string) {
    const response = await api.post<AuthResponse>('/api/auth/login', { email, password }, false);
    await applyAuthResponse(response);
  }

  async function register(email: string, password: string, displayName: string) {
    const response = await api.post<AuthResponse>(
      '/api/auth/register',
      { email, password, displayName },
      false,
    );
    await applyAuthResponse(response);
  }

  async function logout() {
    await clearToken();
    setUser(null);
  }

  async function deleteAccount() {
    await api.delete('/api/auth/me');
    await clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
