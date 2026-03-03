import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users - replace with real auth later
const MOCK_USERS: Record<string, User> = {
  'atendente1@fitmax.com': {
    id: 'u1', email: 'atendente1@fitmax.com', nome: 'Carla Mendes',
    unidade_id: 'unidade-1', unidade_nome: 'FitMax Centro',
  },
  'atendente2@fitmax.com': {
    id: 'u2', email: 'atendente2@fitmax.com', nome: 'Rafael Costa',
    unidade_id: 'unidade-2', unidade_nome: 'FitMax Zona Sul',
  },
  'atendente3@fitmax.com': {
    id: 'u3', email: 'atendente3@fitmax.com', nome: 'Julia Santos',
    unidade_id: 'unidade-3', unidade_nome: 'FitMax Zona Norte',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('wa_panel_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Mock auth - accept any password for known emails
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (mockUser) {
      setUser(mockUser);
      sessionStorage.setItem('wa_panel_user', JSON.stringify(mockUser));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('wa_panel_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
