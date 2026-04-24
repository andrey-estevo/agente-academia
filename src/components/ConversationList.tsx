import { Conversation, ConversationStatus, Sector } from "@/types";
import { StatusDot } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  statusFilter: ConversationStatus | "all";
  sectorFilter: Sector | "all";
}

function limparNumero(numero: string) {
  return String(numero || "")
    .replace("@s.whatsapp.net", "")
    .replace(/\D/g, "");
}

function formatarTelefone(numero: string) {
  const n = limparNumero(numero);

  if (n.length === 13) {
    return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,9)}-${n.slice(9)}`;
  }

  if (n.length === 11) {
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  }

  return numero || "Cliente";
}

function formatarData(dataIso?: string) {
  if (!dataIso) return "--";

  const data = new Date(dataIso);
  if (isNaN(data.getTime())) return "--";

  const dia = data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });

  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return `${dia} • ${hora}`;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  statusFilter,
  sectorFilter
}: ConversationListProps) {

  const jaTocouRef = useRef(false);

  const uniqueMap = new Map<string, Conversation>();

  conversations.forEach((c) => {
    const numero = limparNumero(
      String(c.numero || c.conversa_id || "")
    );

    if (!numero) return;

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

  useEffect(() => {
    const temAguardando = unique.some(
      (c) => c.status === "aguardando"
    );

    if (temAguardando && !jaTocouRef.current) {
      const audio = new Audio("/ting.mp3");
      audio.play().catch(() => {});
      jaTocouRef.current = true;
    }

    if (!temAguardando) {
      jaTocouRef.current = false;
    }

  }, [unique]);

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0f172a]">
        <p className="text-sm text-gray-400">
          Nenhuma conversa encontrada
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-[#0f172a]">
      <AnimatePresence>

        {filtered.map((conv) => {

          const numero = limparNumero(
            String(conv.numero || conv.conversa_id || "")
          );

          const nomeValido =
            conv.nome &&
            conv.nome !== numero &&
            conv.nome !== "Aluno"
              ? conv.nome
              : formatarTelefone(numero);

          const nome = nomeValido;

          const horario = formatarData(
            conv.ultima_atualizacao
          );

          const status = conv.status || "aguardando";
          const setor = conv.setor || "geral";
          const id = numero;
          const iniciais = numero.slice(-2) || "CL";

          const convNormalizada: Conversation = {
            ...conv,
            numero: numero,
            conversa_id: numero
          };

          return (
            <motion.button
              key={id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => onSelect(convNormalizada)}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-white/5 transition-all duration-200",
                "hover:bg-[#1e293b]",
                selectedId === id && "bg-[#1e293b] border-l-4 border-blue-500"
              )}
            >

              <div className="flex items-start gap-3">

                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-blue-400">
                    {iniciais}
                  </span>
                </div>

                <div className="flex-1 min-w-0">

                  <div className="flex items-center justify-between gap-2">

                    <span className="text-sm font-medium text-white truncate">
                      {nome}
                    </span>

                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {horario}
                    </span>

                  </div>

                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {conv.ultima_mensagem || "Nova conversa"}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5">

                    <StatusDot status={status} />

                    <span className="text-[10px] text-gray-400 bg-[#020617] px-1.5 py-0.5 rounded">
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