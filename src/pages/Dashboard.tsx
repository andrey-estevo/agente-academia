import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Conversation, ConversationStatus, Sector } from '@/types';
import { activeApi } from '@/services/api';
import { ConversationList } from '@/components/ConversationList';
import { ChatView } from '@/components/ChatView';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { MessageSquare, LogOut, RefreshCw, Filter, Clock, Headphones, CheckCircle, Bot, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type StatusFilter = ConversationStatus | 'all';

const SECTORS: Sector[] = ['Financeiro', 'Planos', 'Geral'];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sectorFilter, setSectorFilter] = useState<Sector | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await activeApi.getConversas(user.unidade_id);
      setConversations(data);
      setLastUpdate(new Date());
      // Update selected conversation with fresh data
      if (selectedConv) {
        const updated = data.find(c => c.id === selectedConv.id);
        if (updated) setSelectedConv(updated);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [user, selectedConv]);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [user, navigate, loadConversations]);

  const handleStatusChange = (convId: string, status: ConversationStatus) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, status } : c));
    setSelectedConv(prev => prev?.id === convId ? { ...prev, status } : prev);
  };

  const counts = {
    aguardando: conversations.filter(c => c.status === 'aguardando').length,
    em_atendimento: conversations.filter(c => c.status === 'em_atendimento').length,
    finalizado: conversations.filter(c => c.status === 'finalizado').length,
    bot: conversations.filter(c => c.status === 'bot').length,
  };

  const filterButtons: { key: StatusFilter; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'all', label: 'Todas', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'aguardando', label: 'Aguardando', icon: <Clock className="w-4 h-4" />, count: counts.aguardando },
    { key: 'em_atendimento', label: 'Em atendimento', icon: <Headphones className="w-4 h-4" />, count: counts.em_atendimento },
    { key: 'finalizado', label: 'Finalizadas', icon: <CheckCircle className="w-4 h-4" />, count: counts.finalizado },
    { key: 'bot', label: 'Bot', icon: <Bot className="w-4 h-4" />, count: counts.bot },
  ];

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Left Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-sidebar flex flex-col h-full border-r border-sidebar-border overflow-hidden flex-shrink-0"
          >
            {/* Brand */}
            <div className="px-4 py-4 border-b border-sidebar-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-sidebar-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-sidebar-foreground">Atendimento</h1>
                    <p className="text-[10px] text-sidebar-foreground/60">{user?.unidade_nome}</p>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground/60 hover:text-sidebar-foreground md:hidden">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Counters */}
            <div className="px-3 py-3 border-b border-sidebar-border">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-status-waiting/15 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg font-bold text-status-waiting">{counts.aguardando}</p>
                  <p className="text-[10px] text-sidebar-foreground/60">Aguardando</p>
                </div>
                <div className="bg-status-attending/15 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg font-bold text-status-attending">{counts.em_atendimento}</p>
                  <p className="text-[10px] text-sidebar-foreground/60">Atendendo</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-3 py-3 space-y-1">
              <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-2 mb-2">Conversas</p>
              {filterButtons.map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                    statusFilter === f.key
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  {f.icon}
                  <span className="flex-1 text-left">{f.label}</span>
                  {f.count !== undefined && f.count > 0 && (
                    <span className="text-xs bg-sidebar-muted px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{f.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Sector Filters */}
            <div className="px-3 py-3 border-t border-sidebar-border">
              <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-2 mb-2">
                <Filter className="w-3 h-3 inline mr-1" />Setores
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => setSectorFilter('all')}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
                    sectorFilter === 'all' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
                  )}
                >
                  Todos
                </button>
                {SECTORS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSectorFilter(s)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
                      sectorFilter === s ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* User / Logout */}
            <div className="mt-auto px-3 py-3 border-t border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <span className="text-xs font-semibold text-sidebar-accent-foreground">
                    {user?.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-sidebar-foreground truncate">{user?.nome}</p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</p>
                </div>
                <button onClick={() => { logout(); navigate('/'); }} className="text-sidebar-foreground/50 hover:text-sidebar-foreground">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Conversation List Panel */}
        <div className={cn(
          'w-full md:w-[360px] flex-shrink-0 border-r flex flex-col bg-card',
          selectedConv && 'hidden md:flex'
        )}>
          {/* List Header */}
          <div className="px-4 py-3 border-b flex items-center gap-2">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-sm font-semibold text-foreground flex-1">Conversas</h2>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <RefreshCw className="w-3 h-3" />
              <span>{lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>

          <ConversationList
            conversations={conversations}
            selectedId={selectedConv?.id ?? null}
            onSelect={(conv) => setSelectedConv(conv)}
            statusFilter={statusFilter}
            sectorFilter={sectorFilter}
          />
        </div>

        {/* Chat Panel */}
        <div className={cn(
          'flex-1 flex flex-col',
          !selectedConv && 'hidden md:flex'
        )}>
          {selectedConv ? (
            <ChatView
              conversation={selectedConv}
              onStatusChange={handleStatusChange}
              onBack={() => setSelectedConv(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Selecione uma conversa para visualizar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
