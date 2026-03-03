import { ConversationStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<ConversationStatus, { label: string; dotClass: string; bgClass: string }> = {
  aguardando: { label: 'Aguardando', dotClass: 'bg-status-waiting', bgClass: 'bg-status-waiting/10 text-status-waiting' },
  em_atendimento: { label: 'Em atendimento', dotClass: 'bg-status-attending', bgClass: 'bg-status-attending/10 text-status-attending' },
  finalizado: { label: 'Finalizado', dotClass: 'bg-status-finished', bgClass: 'bg-status-finished/10 text-muted-foreground' },
  bot: { label: 'Bot', dotClass: 'bg-status-bot', bgClass: 'bg-status-bot/10 text-status-bot' },
};

export function StatusBadge({ status, size = 'sm' }: { status: ConversationStatus; size?: 'sm' | 'xs' }) {
  const config = statusConfig[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      config.bgClass,
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  );
}

export function StatusDot({ status }: { status: ConversationStatus }) {
  const config = statusConfig[status];
  return <span className={cn('w-2.5 h-2.5 rounded-full inline-block', config.dotClass)} />;
}
