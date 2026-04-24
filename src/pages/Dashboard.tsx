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

  }, [user]);

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
    { key: "all", label: "Todas", icon: <MessageSquare className="w-4 h-4" /> },
    { key: "aguardando", label: "Aguardando", icon: <Clock className="w-4 h-4" />, count: counts.aguardando },
    { key: "atendimento", label: "Em atendimento", icon: <Headphones className="w-4 h-4" />, count: counts.atendimento },
    { key: "finalizado", label: "Finalizadas", icon: <CheckCircle className="w-4 h-4" />, count: counts.finalizado },
    { key: "bot", label: "Bot", icon: <Bot className="w-4 h-4" />, count: counts.bot }
  ];

  return (

    <div className="h-screen flex bg-[#0f172a] overflow-hidden">

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 h-full w-[280px] bg-[#020617] z-50 shadow-xl flex flex-col"
          >

            <div className="px-4 h-[72px] flex items-center justify-between border-b border-[#1f2937]">

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white"/>
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

              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-gray-400"/>
              </button>

            </div>

            <div className="px-3 py-3 space-y-1">
              {filterButtons.map((f: any) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setStatusFilter(f.key);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-[#1e293b]"
                >
                  {f.icon}
                  <span className="flex-1 text-left">{f.label}</span>

                  {f.count > 0 && (
                    <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-auto px-3 py-3 space-y-2 border-t border-[#1f2937]">

              {user?.perfil === "admin" && (
                <Button
                  variant="secondary"
                  className="w-full justify-start bg-[#1e293b] text-white hover:bg-[#334155]"
                  onClick={() => navigate("/admin/usuarios")}
                >
                  <Users className="w-4 h-4 mr-2"/>
                  Usuários
                </Button>
              )}

              <Button
                variant="secondary"
                className="w-full justify-start bg-[#1e293b] text-white hover:bg-[#334155]"
                onClick={() => navigate("/admin")}
              >
                <Settings className="w-4 h-4 mr-2"/>
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
                <LogOut className="w-4 h-4 mr-2"/>
                Sair
              </Button>

            </div>

          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex h-full overflow-hidden">

        {/* LISTA */}
        <div className="w-full md:w-[360px] border-r border-[#1f2937] flex flex-col bg-[#020617]">

          <div className="px-4 h-[72px] border-b border-[#1f2937] flex items-center gap-2">

            <div className="relative">
              <button onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-gray-300"/>
              </button>

              {counts.aguardando > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                  {counts.aguardando}
                </span>
              )}
            </div>

            <h2 className="text-sm font-semibold text-white flex-1">
              Conversas
            </h2>

            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <RefreshCw className="w-3 h-3"/>
              {lastUpdate.toLocaleTimeString()}
            </div>

          </div>

          <ConversationList
            conversations={conversations}
            selectedId={selectedConv?.conversa_id ?? null}
            onSelect={(conv) => setSelectedConv(conv)}
            statusFilter={statusFilter}
            sectorFilter="all"
          />

        </div>

        {/* CHAT */}
        <div className="flex-1 flex flex-col bg-[#0f172a]">
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

              <div className="absolute inset-0 bg-[url('/logo-sky.png')] bg-center bg-no-repeat bg-contain opacity-[0.05] pointer-events-none"></div>

              <div className="relative z-10 text-center">
                <p className="text-sm text-gray-400">
                  Selecione uma conversa
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