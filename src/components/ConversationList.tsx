import { Conversation, ConversationStatus, Sector } from "@/types";
import { StatusDot } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  statusFilter: ConversationStatus | "all";
  sectorFilter: Sector | "all";
  isLoading?: boolean;
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
  sectorFilter,
  isLoading = false
}: ConversationListProps) {
  const jaTocouRef = useRef(false);
  const lastUpdatesRef = useRef<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [unread, setUnread] = useState<Record<string, number>>({});

  const unique = useMemo(() => {
    const uniqueMap = new Map<string, Conversation>();

    conversations.forEach((c) => {
      const numero = limparNumero(String(c.numero || c.conversa_id || ""));
      if (!numero || uniqueMap.has(numero)) return;
      uniqueMap.set(numero, { ...c, numero, conversa_id: numero });
    });

    return Array.from(uniqueMap.values());
  }, [conversations]);

  useEffect(() => {
    setUnread((current) => {
      const next = { ...current };

      unique.forEach((conv) => {
        const id = limparNumero(String(conv.numero || conv.conversa_id || ""));
        const update = String(conv.ultima_atualizacao || conv.ultima_mensagem || "");
        const previous = lastUpdatesRef.current[id];

        if (previous && previous !== update && limparNumero(String(selectedId || "")) !== id) {
          next[id] = (next[id] || 0) + 1;
        } else if (!previous && conv.status === "aguardando") {
          next[id] = Math.max(next[id] || 0, 1);
        }

        lastUpdatesRef.current[id] = update;
      });

      return next;
    });
  }, [unique, selectedId]);

  useEffect(() => {
    const id = limparNumero(String(selectedId || ""));
    if (!id) return;
    setUnread((current) => ({ ...current, [id]: 0 }));
  }, [selectedId]);

  const filtered = useMemo(() => unique.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;

    if (sectorFilter !== "all" && c.setor !== sectorFilter) return false;

    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (term) {
      const content = `${c.nome || ""} ${c.numero || ""} ${c.ultima_mensagem || ""}`
        .toLocaleLowerCase("pt-BR");
      if (!content.includes(term)) return false;
    }

    return true;
  }).sort((a, b) => {
    const aId = limparNumero(String(a.numero || a.conversa_id || ""));
    const bId = limparNumero(String(b.numero || b.conversa_id || ""));
    const unreadDiff = (unread[bId] || 0) - (unread[aId] || 0);
    if (unreadDiff) return unreadDiff;
    if (a.status === "aguardando" && b.status !== "aguardando") return -1;
    if (b.status === "aguardando" && a.status !== "aguardando") return 1;
    return new Date(b.ultima_atualizacao || 0).getTime() - new Date(a.ultima_atualizacao || 0).getTime();
  }), [unique, statusFilter, sectorFilter, search, unread]);

  useEffect(() => {
    const temAguardando = unique.some(
      (c) => c.status === "aguardando"
    );

    if (temAguardando && !jaTocouRef.current) {
      const audio = new Audio("/ting.mp3");

      audio.play().catch(() => { });

      jaTocouRef.current = true;
    }

    if (!temAguardando) {
      jaTocouRef.current = false;
    }
  }, [unique]);

  return (
    <div className="h-full flex flex-col bg-[#0B1220]">
      <div className="p-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar nome, telefone ou mensagem"
            className="h-10 pl-9 pr-9 rounded-xl border-white/10 bg-slate-900/80 text-sm text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="px-3 py-2 space-y-2 animate-pulse" aria-label="Carregando conversas">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-[106px] rounded-xl bg-slate-900 border border-white/[0.04]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-300">Nenhuma conversa encontrada</p>
          <p className="text-xs text-slate-500 mt-1">Tente ajustar a busca ou o filtro selecionado.</p>
        </div>
      ) : (
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-3 pb-3 space-y-2">
      <AnimatePresence>
        {filtered.map((conv) => {
          const numero = limparNumero(
            String(conv.numero || conv.conversa_id || "")
          );

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

          const horario = formatarData(
            conv.ultima_atualizacao
          );

          const status = conv.status || "aguardando";

          const setor = conv.setor || "geral";

          const id = numero;
          const unreadCount = unread[id] || 0;

          const selectedIdLimpo = limparNumero(
            String(selectedId || "")
          );



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
                "w-full text-left rounded-xl transition-all duration-200 border",
                "p-3 bg-slate-900/70 border-white/[0.07]",
                "hover:bg-[#1e293b]",
                "hover:border-blue-400/25",
                "active:scale-[0.99]",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
                selectedIdLimpo === id &&
                "bg-blue-500/10 border-blue-500/60"
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                {/* AVATAR */}
                <div className="relative shrink-0">
                  <img
                    src="/avatar.png"
                    alt="Avatar"
                    className="w-12 h-12 rounded-full object-cover border border-blue-500/25 shadow-inner"
                  />

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

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{horario}</span>
                      {unreadCount > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-[10px] font-semibold text-white flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 truncate mt-2 leading-relaxed">
                    {conv.ultima_mensagem?.trim() || "Mídia recebida"}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full truncate",
                          status === "atendimento" &&
                          "bg-blue-500/10 text-blue-300",
                          status === "aguardando" &&
                          "bg-yellow-500/10 text-yellow-300",
                          status === "finalizado" &&
                          "bg-green-500/10 text-green-300",
                          status === "bot" &&
                          "bg-purple-500/10 text-purple-300"
                        )}
                      >
                        {statusLabel(status)}
                      </span>
                    </div>

                    <span className="text-[10px] text-gray-400 bg-[#020617] border border-blue-500/10 px-2 py-1 rounded-lg shrink-0 max-w-[110px] truncate">
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
      )}
    </div>
  );
}
