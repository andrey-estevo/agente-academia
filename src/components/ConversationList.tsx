import { Conversation, ConversationStatus, Sector } from '@/types';
import { StatusDot } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  statusFilter: ConversationStatus | 'all';
  sectorFilter: Sector | 'all';
}

export function ConversationList({ conversations, selectedId, onSelect, statusFilter, sectorFilter }: ConversationListProps) {
  const filtered = conversations.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (sectorFilter !== 'all' && c.setor !== sectorFilter) return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <AnimatePresence>
        {filtered.map((conv) => (
          <motion.button
            key={conv.id}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => onSelect(conv)}
            className={cn(
              'w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors',
              selectedId === conv.id && 'bg-muted'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-semibold text-accent">
                  {conv.cliente_nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{conv.cliente_nome}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(conv.horario), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.ultima_mensagem}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusDot status={conv.status} />
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{conv.setor}</span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
