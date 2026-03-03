import { useState, useEffect, useRef } from 'react';
import { Conversation, Message, ConversationStatus } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { activeApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, UserCheck, XCircle, Bot, Phone, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ChatViewProps {
  conversation: Conversation;
  onStatusChange: (convId: string, status: ConversationStatus) => void;
  onBack: () => void;
}

export function ChatView({ conversation, onStatusChange, onBack }: ChatViewProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [conversation.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    try {
      const msgs = await activeApi.getMensagens(conversation.id);
      setMessages(msgs);
    } catch {
      // silently fail on polling
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !user) return;

    setSending(true);
    try {
      await activeApi.enviarMensagem(conversation.cliente_numero, input, user.unidade_id);
      // Optimistic: add to local messages
      setMessages(prev => [...prev, {
        id: `local-${Date.now()}`,
        conversa_id: conversation.id,
        texto: input,
        remetente: 'atendente',
        horario: new Date().toISOString(),
      }]);
      setInput('');
    } catch {
      toast.error('Erro ao enviar mensagem');
    }
    setSending(false);
  }

  async function handleStatusChange(status: ConversationStatus) {
    try {
      await activeApi.alterarStatus(conversation.id, status);
      onStatusChange(conversation.id, status);
      const labels: Record<ConversationStatus, string> = {
        em_atendimento: 'Atendimento assumido',
        finalizado: 'Atendimento finalizado',
        bot: 'Retornado para o bot',
        aguardando: 'Aguardando',
      };
      toast.success(labels[status]);
    } catch {
      toast.error('Erro ao alterar status');
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 bg-card flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="md:hidden text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-accent">
            {conversation.cliente_nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground truncate">{conversation.cliente_nome}</h2>
            <StatusBadge status={conversation.status} size="xs" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>{conversation.cliente_numero}</span>
            <span>•</span>
            <span>{conversation.setor}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {conversation.status === 'aguardando' && (
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs gap-1" onClick={() => handleStatusChange('em_atendimento')}>
              <UserCheck className="w-3.5 h-3.5" /> Assumir
            </Button>
          )}
          {conversation.status === 'em_atendimento' && (
            <>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleStatusChange('bot')}>
                <Bot className="w-3.5 h-3.5" /> Bot
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleStatusChange('finalizado')}>
                <XCircle className="w-3.5 h-3.5" /> Finalizar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex',
                msg.remetente === 'cliente' ? 'justify-start' : 'justify-end',
                msg.remetente === 'bot' && 'justify-center'
              )}
            >
              <div className={cn(
                'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                msg.remetente === 'cliente' && 'bg-wa-bubble-in text-foreground rounded-tl-sm',
                msg.remetente === 'atendente' && 'bg-wa-bubble-out text-foreground rounded-tr-sm',
                msg.remetente === 'bot' && 'bg-wa-bubble-bot text-primary text-xs italic rounded-xl max-w-[85%]'
              )}>
                {msg.remetente === 'bot' && <Bot className="w-3 h-3 inline-block mr-1 -mt-0.5" />}
                <span>{msg.texto}</span>
                <span className="block text-[10px] text-muted-foreground mt-1 text-right">
                  {format(new Date(msg.horario), 'HH:mm')}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {conversation.status === 'em_atendimento' && (
        <form onSubmit={handleSend} className="border-t px-4 py-3 bg-card flex items-center gap-2 flex-shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="icon" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={sending || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}

      {conversation.status !== 'em_atendimento' && (
        <div className="border-t px-4 py-3 bg-muted/50 text-center text-xs text-muted-foreground">
          {conversation.status === 'aguardando' && 'Clique em "Assumir" para iniciar o atendimento'}
          {conversation.status === 'finalizado' && 'Este atendimento foi finalizado'}
          {conversation.status === 'bot' && 'Esta conversa está sendo atendida pelo bot'}
        </div>
      )}
    </div>
  );
}
