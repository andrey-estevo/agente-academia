import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarClock, MessageSquare, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}

const navigation = [
  { label: "Planos e horários", path: "/admin", icon: CalendarClock },
  { label: "Usuários", path: "/admin/usuarios", icon: Users },
];

export function AdminShell({ title, description, children, action }: AdminShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-[100dvh] bg-[#070F1F] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#020617]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-[env(safe-area-inset-top)] min-h-16 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            aria-label="Voltar ao atendimento"
            className="w-10 h-10 rounded-xl border border-white/[0.08] bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight">Administração</p>
            <p className="text-[11px] text-slate-500 truncate">Configurações da unidade</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="ml-auto hidden sm:flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
          >
            <MessageSquare className="w-4 h-4" /> Atendimento
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <nav
          className="flex gap-1 p-1 rounded-xl bg-slate-950/70 border border-white/[0.06] mb-7 overflow-x-auto"
          aria-label="Seções administrativas"
        >
          {navigation.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={cn(
                  "min-w-max flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition",
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" /> {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-blue-400 mb-1">
              Painel administrativo
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">{description}</p>
          </div>
          {action}
        </div>

        {children}
      </div>
    </div>
  );
}
