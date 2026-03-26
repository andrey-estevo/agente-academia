import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Conversation, ConversationStatus, Sector } from "@/types";
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
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type StatusFilter = ConversationStatus | "all";

const SECTORS: Sector[] = ["Financeiro", "Planos", "Geral"];

const Dashboard = () => {

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sectorFilter, setSectorFilter] = useState<Sector | "all">("all");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {

    if (!user) {
      navigate("/");
      return;
    }

    const unsubscribe = ouvirConversas((data) => {

      setConversations(data);
      setLastUpdate(new Date());
      setLoading(false);

      if (selectedConv) {

        const updated = data.find(
          (c) => c.conversa_id === selectedConv.conversa_id
        );

        if (updated) setSelectedConv(updated);

      }

    });

    return () => unsubscribe();

  }, [user]);

  const handleStatusChange = (
    convId: string,
    status: ConversationStatus
  ) => {

    setConversations((prev) =>
      prev.map((c) =>
        c.conversa_id === convId ? { ...c, status } : c
      )
    );

    setSelectedConv((prev) =>
      prev?.conversa_id === convId ? { ...prev, status } : prev
    );

  };

  const counts = {

    aguardando: conversations.filter(
      (c) => c.status === "aguardando"
    ).length,

    atendimento: conversations.filter(
      (c) => c.status === "atendimento"
    ).length,

    finalizado: conversations.filter(
      (c) => c.status === "finalizado"
    ).length,

    bot: conversations.filter(
      (c) => c.status === "bot"
    ).length

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

    <div className="h-screen flex bg-background overflow-hidden">

      <AnimatePresence>

        {sidebarOpen && (

          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-sidebar flex flex-col h-full border-r border-sidebar-border overflow-hidden flex-shrink-0"
          >

            <div className="px-4 py-4 border-b border-sidebar-border">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-sidebar-primary-foreground"/>
                  </div>

                  <div>
                    <h1 className="text-sm font-bold text-sidebar-foreground">
                      Atendimento
                    </h1>

                    <p className="text-[10px] text-sidebar-foreground/60">
                      {user?.unidade_nome}
                    </p>
                  </div>

                </div>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-sidebar-foreground/60 hover:text-sidebar-foreground md:hidden"
                >
                  <X className="w-5 h-5"/>
                </button>

              </div>
            </div>

            <div className="px-3 py-3 border-b border-sidebar-border">

              <div className="grid grid-cols-2 gap-2">

                <div className="bg-status-waiting/15 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg font-bold text-status-waiting">
                    {counts.aguardando}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/60">
                    Aguardando
                  </p>
                </div>

                <div className="bg-status-attending/15 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg font-bold text-status-attending">
                    {counts.atendimento}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/60">
                    Atendendo
                  </p>
                </div>

              </div>
            </div>

            <div className="px-3 py-3 space-y-1">

              {filterButtons.map((f: any) => (

                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                    statusFilter === f.key
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >

                  {f.icon}

                  <span className="flex-1 text-left">
                    {f.label}
                  </span>

                  {f.count !== undefined && f.count > 0 && (
                    <span className="text-xs bg-sidebar-muted px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {f.count}
                    </span>
                  )}

                </button>

              ))}

            </div>

            {/* 🔥 FOOTER COM ADMIN */}
            <div className="mt-auto px-3 py-3 border-t border-sidebar-border space-y-2">

              {/* 👤 BOTÃO USUÁRIOS */}
              {user?.perfil === "admin" && (
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => navigate("/admin/usuarios")}
                >
                  <Settings className="w-4 h-4 mr-2"/>
                  Usuários
                </Button>
              )}

              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => navigate("/admin")}
              >
                <Settings className="w-4 h-4 mr-2"/>
                Admin
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-start"
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

        <div className="w-full md:w-[360px] border-r flex flex-col bg-card">

          <div className="px-4 py-3 border-b flex items-center gap-2">

            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Menu className="w-5 h-5"/>
              </button>
            )}

            <h2 className="text-sm font-semibold flex-1">
              Conversas
            </h2>

            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <RefreshCw className="w-3 h-3"/>
              {lastUpdate.toLocaleTimeString()}
            </div>

          </div>

          <ConversationList
            conversations={conversations}
            selectedId={selectedConv?.conversa_id ?? null}
            onSelect={(conv) => setSelectedConv(conv)}
            statusFilter={statusFilter}
            sectorFilter={sectorFilter}
          />

        </div>

        <div className="flex-1 flex flex-col">

          {selectedConv ? (

            <ChatView
              conversation={selectedConv}
              onStatusChange={handleStatusChange}
              onBack={() => setSelectedConv(null)}
            />

          ) : (

            <div className="flex-1 flex items-center justify-center bg-muted/20">

              <div className="text-center">

                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3"/>

                <p className="text-sm text-muted-foreground">
                  Selecione uma conversa para visualizar
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