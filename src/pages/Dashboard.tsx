import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Conversation, ConversationStatus } from "@/types";
import { ouvirConversas } from "@/services/firebaseConversas";
import { ConversationList } from "@/components/ConversationList";
import { ChatView } from "@/components/ChatView";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  LogOut,
  RefreshCw,
  Clock,
  Headphones,
  CheckCircle,
  Bot,
  Menu,
  X,
  Settings,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type StatusFilter = ConversationStatus | "all";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const unsubscribe = ouvirConversas((data) => {
      setConversations(data);
      setLastUpdate(new Date());

      if (selectedConv) {
        const updated = data.find(
          (c) => c.conversa_id === selectedConv.conversa_id
        );

        if (updated) setSelectedConv(updated);
      }
    }, user.unidade_id);

    return () => unsubscribe();
  }, [user, navigate, selectedConv]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedConv(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const counts = {
    aguardando: conversations.filter((c) => c.status === "aguardando").length,
    atendimento: conversations.filter((c) => c.status === "atendimento").length,
    finalizado: conversations.filter((c) => c.status === "finalizado").length,
    bot: conversations.filter((c) => c.status === "bot").length
  };

  const filterButtons = [
    {
      key: "all",
      label: "Todas",
      icon: <MessageSquare className="w-4 h-4" />
    },
    {
      key: "aguardando",
      label: "Aguardando",
      icon: <Clock className="w-4 h-4" />,
      count: counts.aguardando
    },
    {
      key: "atendimento",
      label: "Em atendimento",
      icon: <Headphones className="w-4 h-4" />,
      count: counts.atendimento
    },
    {
      key: "finalizado",
      label: "Finalizadas",
      icon: <CheckCircle className="w-4 h-4" />,
      count: counts.finalizado
    },
    {
      key: "bot",
      label: "Bot",
      icon: <Bot className="w-4 h-4" />,
      count: counts.bot
    }
  ];

  return (
    <div className="h-screen flex bg-[#070F1F] overflow-hidden">
      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 h-full w-[280px] bg-[#020617] z-50 shadow-2xl flex flex-col border-r border-white/5"
          >
            {/* HEADER */}
            <div className="px-4 h-[72px] flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>

                <div>
                  <h1 className="text-sm font-bold text-white">
                    Atendimento
                  </h1>
                  <p className="text-[10px] text-gray-400">
                    {user?.unidade_nome}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-2 -mr-2 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* FILTROS */}
            <div className="px-3 py-3 space-y-1">
              {filterButtons.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(f.key as StatusFilter);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                    statusFilter === f.key
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-[#1e293b]"
                  }`}
                >
                  {f.icon}

                  <span className="flex-1 text-left">{f.label}</span>

                  {"count" in f && f.count > 0 && (
                    <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* FOOTER */}
            <div className="mt-auto px-3 py-3 space-y-2 border-t border-white/5">
              {user?.perfil === "admin" && (
                <Button
                  variant="secondary"
                  className="w-full justify-start bg-[#1e293b] text-white hover:bg-[#334155]"
                  onClick={() => {
                    setSidebarOpen(false);
                    navigate("/admin/usuarios");
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Usuários
                </Button>
              )}

              <Button
                variant="secondary"
                className="w-full justify-start bg-[#1e293b] text-white hover:bg-[#334155]"
                onClick={() => {
                  setSidebarOpen(false);
                  navigate("/admin");
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-start bg-[#1e293b] text-white hover:bg-[#334155]"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <div className="flex-1 flex h-full overflow-hidden">
        {/* LISTA */}
        <div
          className={`
            w-full md:w-[360px] border-r border-white/5 flex-col bg-[#020617]
            ${selectedConv ? "hidden md:flex" : "flex"}
          `}
        >
          <div className="px-4 h-[72px] border-b border-white/5 flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition"
              >
                <Menu className="w-5 h-5 text-gray-300" />
              </button>

              {counts.aguardando > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1.5 rounded-full leading-4 min-w-4 text-center">
                  {counts.aguardando}
                </span>
              )}
            </div>

            <h2 className="text-sm font-semibold text-white flex-1">
              Conversas
            </h2>

            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <RefreshCw className="w-3 h-3" />
              {lastUpdate.toLocaleTimeString()}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConv?.conversa_id ?? null}
              onSelect={(conv) => setSelectedConv(conv)}
              statusFilter={statusFilter}
              sectorFilter="all"
            />
          </div>
        </div>

        {/* CHAT */}
        <div
          className={`
            flex-1 flex-col bg-[#070F1F]
            ${selectedConv ? "flex" : "hidden md:flex"}
          `}
        >
          {selectedConv ? (
            <ChatView
              conversation={selectedConv}
              onStatusChange={(id, newStatus) => {
                setSelectedConv((prev) =>
                  prev ? { ...prev, status: newStatus } : prev
                );
              }}
              onBack={() => setSelectedConv(null)}
              onOpenSidebar={() => setSidebarOpen(true)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center relative">
              {/* FUNDO */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img
                  src="/logo-sky.png"
                  className="w-[500px] max-w-[70%] opacity-5"
                  alt="Logo Sky Fit"
                />
              </div>

              {/* TEXTO */}
              <div className="relative z-10 text-center px-6">
                <h2 className="text-white text-lg font-semibold">
                  Bem-vindo ao painel
                </h2>
                <p className="text-gray-400 mt-1 text-sm">
                  Selecione uma conversa para começar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;