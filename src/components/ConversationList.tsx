import { Conversation, ConversationStatus, Sector } from "@/types";
import { StatusDot } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  statusFilter: ConversationStatus | "all";
  sectorFilter: Sector | "all";
}

function formatarTelefone(numero: string) {
  const n = numero.replace(/\D/g, "");

  if (n.length === 13) {
    return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,9)}-${n.slice(9)}`;
  }

  if (n.length === 11) {
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  }

  return numero;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  statusFilter,
  sectorFilter
}: ConversationListProps) {

  const uniqueMap = new Map<string, Conversation>();

  conversations.forEach((c) => {

    const numero =
      String(c.numero || c.conversa_id || c.id)
      .replace("@s.whatsapp.net", "")
      .replace(/\D/g, "");

    if (!uniqueMap.has(numero)) {
      uniqueMap.set(numero, {
        ...c,
        numero: numero,
        conversa_id: numero
      });
    }
  });

  const unique = Array.from(uniqueMap.values());

  const filtered = unique.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (sectorFilter !== "all" && c.setor !== sectorFilter) return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          Nenhuma conversa encontrada
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <AnimatePresence>
        {filtered.map((conv) => {

          const numeroRaw =
            String(conv.numero || conv.conversa_id || conv.id);

          const numero = numeroRaw
            .replace("@s.whatsapp.net", "")
            .replace(/\D/g, "");

          const nome = formatarTelefone(numero);

          const horario =
            conv.horario ||
            conv.ultima_atualizacao ||
            "--";

          const status = conv.status || "aguardando";

          const setor = conv.setor || "geral";

          const id = numero;

          const iniciais = numero.slice(-2);

          return (
            <motion.button
              key={id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => onSelect(conv)}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors",
                selectedId === id && "bg-muted"
              )}
            >
              <div className="flex items-start gap-3">

                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-accent">
                    {iniciais}
                  </span>
                </div>

                <div className="flex-1 min-w-0">

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {nome}
                    </span>

                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {horario}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.ultima_mensagem || "Nova conversa"}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusDot status={status} />
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {setor}
                    </span>
                  </div>

                </div>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}