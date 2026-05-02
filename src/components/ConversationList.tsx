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
    return `+${n.slice(0, 2)} (${n.slice(2, 4)}) ${n.slice(4, 9)}-${n.slice(9)}`;
  }

  if (n.length === 11) {
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
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
    const numero = limparNumero(String(c.numero || c.conversa_id || ""));

    if (!numero) return;

    if (!uniqueMap.has(numero)) {
      uniqueMap.set(numero, {
        ...c,
        numero,
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
    const temAguardando = unique.some((c) => c.status === "aguardando");

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
      <div className="h-full flex items-center justify-center p-8 bg-[#0B1220]">
        <p className="text-sm text-gray-400 text-center">
          Nenhuma conversa encontrada
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0B1220] px-2 sm:px-2 py-2 space-y-2">
      <AnimatePresence>
        {filtered.map((conv) => {
          const numero = limparNumero(String(conv.numero || conv.conversa_id || ""));

          const nomeValido =
            conv.nome &&
            conv.nome !== numero &&
            conv.nome !== "Aluno" &&
            conv.nome !== "Cliente" &&
            conv.nome.trim() !== ""
              ? conv.nome
              : formatarTelefone(numero);

          const nome = String(nomeValido);

          const horario = formatarData(conv.ultima_atualizacao);

          const status = conv.status || "aguardando";
          const setor = conv.setor || "geral";
          const id = numero;

          const selectedIdLimpo = limparNumero(String(selectedId || ""));

          const iniciais = nome
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          const convNormalizada: Conversation = {
            ...conv,
            numero,
            conversa_id: numero
          };

          return (
            <motion.button
              key={id}
              type="button"
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => onSelect(convNormalizada)}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-all duration-200 border border-white/5",
                "hover:bg-[#1e293b] hover:border-white/10 active:scale-[0.99]",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
                selectedIdLimpo === id && "bg-[#1e293b] border-blue-500 shadow-lg"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* AVATAR */}
                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/20 shrink-0">
                  <span className="text-sm font-semibold text-blue-400">
                    {iniciais}
                  </span>
                </div>

                {/* CONTEÚDO */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-sm font-medium text-white truncate min-w-0">
                      {nome}
                    </span>

                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {horario}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 truncate mt-1">
                    {conv.ultima_mensagem || "Nova conversa"}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusDot status={status} />

                      <span className="text-[10px] text-gray-400 capitalize truncate">
                        {status}
                      </span>
                    </div>

                    <span className="text-[10px] text-gray-400 bg-[#020617] px-2 py-0.5 rounded shrink-0 max-w-[110px] truncate">
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