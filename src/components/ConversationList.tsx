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

function statusLabel(status: string) {
  if (status === "atendimento") return "Em atendimento";
  if (status === "aguardando") return "Aguardando";
  if (status === "finalizado") return "Finalizado";
  if (status === "bot") return "Bot";
  return status;
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
    <div className="h-full overflow-y-auto bg-[#0B1220] px-3 py-3 space-y-3">
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
          const telefone = formatarTelefone(numero);

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
                "w-full text-left rounded-2xl transition-all duration-200 border",
                "p-3.5 bg-[#111827]/70 border-white/5 shadow-sm",
                "hover:bg-[#1e293b] hover:border-white/10 active:scale-[0.99]",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
                selectedIdLimpo === id && "bg-[#1e293b] border-blue-500 shadow-lg shadow-blue-950/30"
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                {/* AVATAR */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/25 shadow-inner">
                    <span className="text-sm font-semibold text-blue-300">
                      {iniciais}
                    </span>
                  </div>

                  <span className="absolute -right-0.5 bottom-0.5">
                    <StatusDot status={status} />
                  </span>
                </div>

                {/* CONTEÚDO */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-white truncate">
                        {nome}
                      </span>

                      <span className="block text-[11px] text-gray-400 truncate mt-0.5">
                        {telefone}
                      </span>
                    </div>

                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0 pt-0.5">
                      {horario}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 truncate mt-2 leading-relaxed">
                    {conv.ultima_mensagem || "Nova conversa"}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusDot status={status} />

                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full truncate",
                          status === "atendimento" && "bg-blue-500/10 text-blue-300",
                          status === "aguardando" && "bg-yellow-500/10 text-yellow-300",
                          status === "finalizado" && "bg-green-500/10 text-green-300",
                          status === "bot" && "bg-purple-500/10 text-purple-300"
                        )}
                      >
                        {statusLabel(status)}
                      </span>
                    </div>

                    <span className="text-[10px] text-gray-400 bg-[#020617] px-2 py-1 rounded-lg shrink-0 max-w-[110px] truncate">
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