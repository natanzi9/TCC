// ============================================================
// AuthContext — Gerencia sessão do usuário no app
// ============================================================
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'user' | 'adm' | null;

interface AuthState {
  username: string | null;
  role: UserRole;
}

interface AuthContextType extends AuthState {
  signIn: (username: string, role: UserRole) => void;
  signOut: () => void;
  isAuthenticated: boolean;
  isAdm: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ username: null, role: null });

  function signIn(username: string, role: UserRole) {
    setState({ username, role });
  }

  function signOut() {
    setState({ username: null, role: null });
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut,
        isAuthenticated: !!state.username,
        isAdm: state.role === 'adm',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return ctx;
}
