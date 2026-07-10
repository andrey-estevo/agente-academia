import { lazy, Suspense, type ReactNode } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { InstallApp } from "@/components/InstallApp";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminUsuarios = lazy(() => import("./pages/AdminUsuarios"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const NotFound = lazy(() => import("./pages/NotFound"));

/* ===============================
   PROTECTED ROUTE
================================ */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => {
  return (
    <>
      <Sonner />
      <InstallApp />

      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<AppLoading />}>
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

              {/* ADMIN */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* 🔥 NOVA ROTA USUÁRIOS */}
              <Route
                path="/admin/usuarios"
                element={
                  <ProtectedRoute>
                    <AdminUsuarios />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute>
                    <SuperAdmin />
                  </ProtectedRoute>
                }
              />

              {/* FALLBACK */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
};

function AppLoading() {
  return (
    <div className="min-h-[100dvh] bg-[#070F1F] flex items-center justify-center" role="status" aria-label="Carregando aplicativo">
      <div className="w-9 h-9 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
    </div>
  );
}

export default App;
