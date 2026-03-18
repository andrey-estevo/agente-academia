import { useEffect, useState } from "react";
import { activeApi } from "./services/api";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

/* 🔥 FIREBASE REALTIME */
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./lib/firebase";

const queryClient = new QueryClient();

/* ===============================
   PROTECTED ROUTE
================================ */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => {
  const [conversas, setConversas] = useState<any[]>([]);

  useEffect(() => {
    /* ===============================
       FIREBASE REALTIME
    =============================== */

    const q = query(
      collection(db, "conversas"),
      orderBy("ultima_atualizacao", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("🔥 Conversas Firebase:", dados);
      setConversas(dados);
    });

    /* ===============================
       API BACKUP (OPCIONAL)
    =============================== */

    activeApi
      .getConversas()
      .then((data) => {
        console.log("🌐 Conversas API:", data);
      })
      .catch((err) => {
        console.error("Erro ao buscar API:", err);
      });

    return () => unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <AuthProvider>
            <Routes>

              {/* LOGIN */}
              <Route path="/" element={<Login />} />

              {/* DASHBOARD */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* ADMIN 🔥 */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* FALLBACK */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;