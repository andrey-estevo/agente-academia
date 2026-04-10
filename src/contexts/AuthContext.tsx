import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/types';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('wa_panel_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      // 🔐 LOGIN FIREBASE
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 🔎 BUSCAR DADOS NO FIRESTORE
      const ref = doc(db, 'usuarios', firebaseUser.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.log('❌ Usuário não encontrado no Firestore');
        await signOut(auth);
        return false;
      }

      const data = snap.data();

      // 🚫 BLOQUEIA USUÁRIO INATIVO
      if (data?.ativo === false) {
        console.log('🚫 Usuário desativado');
        await signOut(auth);
        return false;
      }

      // 🚨 BLOQUEIA SE NÃO TIVER UNIDADE (CRÍTICO MULTI-UNIDADE)
      if (!data?.unidade_id) {
        console.log('🚫 Usuário sem unidade vinculada');
        await signOut(auth);
        return false;
      }

      // ✅ USER COMPLETO
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        nome: data?.nome || 'Usuário',
        unidade_id: data.unidade_id, // 🔥 agora garantido
        unidade_nome: data?.unidade_nome || '',
        perfil: data?.perfil || 'atendente',
        ativo: data?.ativo ?? true
      };

      setUser(userData);
      sessionStorage.setItem('wa_panel_user', JSON.stringify(userData));

      return true;

    } catch (error: any) {
      console.log('🔥 ERRO LOGIN:', error.code);

      if (error.code === 'auth/user-not-found') console.log('Usuário não existe');
      if (error.code === 'auth/wrong-password') console.log('Senha incorreta');
      if (error.code === 'auth/invalid-email') console.log('Email inválido');

      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log('Erro ao deslogar', e);
    }

    setUser(null);
    sessionStorage.removeItem('wa_panel_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}