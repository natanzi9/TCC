// ============================================================
// AuthContext — Gerencia sessão do usuário no app
// ============================================================
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ username: null, role: null });

  function signIn(username, role) {
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
