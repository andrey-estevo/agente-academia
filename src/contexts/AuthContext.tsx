import React, { createContext, useCallback, useContext, useState } from "react";
import { User } from "@/types";
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem("wa_panel_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userRef = doc(db, "usuarios", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log("Usuário não encontrado no Firestore");
        await signOut(auth);
        return false;
      }

      const data = userSnap.data();
      const perfil = data?.perfil || "atendente";
      const unidadeId = data?.unidade_id || "";

      if (data?.ativo === false) {
        console.log("Usuário desativado");
        await signOut(auth);
        return false;
      }

      if (perfil !== "super_admin" && !unidadeId) {
        console.log("Usuário sem unidade vinculada");
        await signOut(auth);
        return false;
      }

      if (perfil !== "super_admin") {
        const unidadeRef = doc(db, "unidades", unidadeId);
        const unidadeSnap = await getDoc(unidadeRef);

        if (!unidadeSnap.exists()) {
          console.log("Unidade não encontrada");
          await signOut(auth);
          return false;
        }

        const unidadeData = unidadeSnap.data();

        if (unidadeData?.ativo === false) {
          console.log("Unidade desativada");
          await signOut(auth);
          return false;
        }
      }

      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        nome: data?.nome || "Usuário",
        unidade_id: unidadeId,
        unidade_nome: data?.unidade_nome || "",
        perfil,
        ativo: data?.ativo ?? true,
      };

      setUser(userData);
      sessionStorage.setItem("wa_panel_user", JSON.stringify(userData));

      return true;
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";

      console.log("Erro no login:", code);

      return false;
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Erro ao enviar recuperação de senha", error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Erro ao deslogar", error);
    }

    setUser(null);
    sessionStorage.removeItem("wa_panel_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
