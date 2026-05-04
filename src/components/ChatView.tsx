import { useState, useEffect, useRef } from "react";
import { Conversation, Message, ConversationStatus } from "@/types";

import { ouvirMensagens } from "@/services/firebaseMensagens";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Send, Phone, ArrowLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { activeApi } from "@/services/api";

interface ChatViewProps {
  conversation: Conversation;
  onStatusChange: (convId: string, status: ConversationStatus) => void;
  onBack: () => void;
  onOpenSidebar: () => void;
}

export function ChatView({
  conversation,
  onStatusChange,
  onBack,
  onOpenSidebar
}: ChatViewProps) {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const [localStatus, setLocalStatus] = useState<ConversationStatus>(
    (conversation.status as ConversationStatus) || "bot"
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalStatus((conversation.status as ConversationStatus) || "bot");
  }, [conversation.conversa_id, conversation.numero, conversation.status]);

  const status: ConversationStatus = localStatus;

  const nomeValido =
    conversation.nome &&
    conversation.nome !== conversation.numero &&
    conversation.nome.trim() !== "" &&
    conversation.nome !== "Cliente" &&
    conversation.nome !== "Aluno"
      ? conversation.nome
      : conversation.numero;

  const nome = String(nomeValido);

  useEffect(() => {
    if (!conversation?.numero) return;

    const unsubscribe = ouvirMensagens(
      String(conversation.numero),
      setMessages,
      user?.unidade_id
    );

    return () => unsubscribe();
  }, [conversation.numero, user?.unidade_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    if (!input.trim() || sending) return;

    setSending(true);

    try {
      await activeApi.enviarMensagem(
        String(conversation.numero),
        input,
        user?.email?.split("@")[0] || "Atendente",
        user?.unidade_id
      );

      setInput("");
    } catch (err) {
      toast.error("Erro ao enviar mensagem");
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(newStatus: ConversationStatus) {
    if (changingStatus) return;

    const previousStatus = status;

    try {
      setChangingStatus(true);

      setLocalStatus(newStatus);
      onStatusChange(conversation.numero, newStatus);

      await activeApi.alterarStatus(
        conversation.numero,
        newStatus,
        user?.unidade_id
      );
    } catch (err) {
      setLocalStatus(previousStatus);
      onStatusChange(conversation.numero, previousStatus);

      toast.error("Erro ao alterar status");
      console.error(err);
    } finally {
      setChangingStatus(false);
    }
  }

  const iniciais = nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-full bg-[#070F1F]">
      {/* HEADER */}
      <div className="border-b border-white/5 bg-[#020617] backdrop-blur shrink-0">
        <div className="px-3 sm:px-4 pt-[calc(env(safe-area-inset-top)+12px)] sm:pt-0 pb-3 sm:pb-0 min-h-[104px] sm:min-h-[72px] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3">
          <div className="flex items-center gap-3 w-full min-w-0">
            {/* VOLTAR MOBILE */}
            <button
              type="button"
              onClick={onBack}
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-gray-200 hover:bg-white/10 transition shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/20 shrink-0 shadow">
              <span className="text-sm font-semibold text-blue-400">
                {iniciais}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base sm:text-sm font-semibold truncate text-white leading-tight">
                  {nome}
                </h2>

                <span
                  className={cn(
                    "text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0",
                    status === "atendimento" && "bg-green-500/20 text-green-400",
                    status === "aguardando" && "bg-yellow-500/20 text-yellow-400",
                    status === "bot" && "bg-blue-500/20 text-blue-400",
                    status === "finalizado" && "bg-gray-500/20 text-gray-400"
                  )}
                >
                  {status === "atendimento" && "Em atendimento"}
                  {status === "aguardando" && "Aguardando"}
                  {status === "bot" && "Bot"}
                  {status === "finalizado" && "Finalizado"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-400 min-w-0 mt-0.5">
                <Phone className="w-3 h-3 shrink-0" />
                <span className="truncate">{conversation.numero}</span>

                {conversation.setor && (
                  <>
                    <span className="shrink-0">•</span>
                    <span className="truncate">{conversation.setor}</span>
                  </>
                )}
              </div>
            </div>

            {/* MENU MOBILE */}
            <button
              type="button"
              onClick={onOpenSidebar}
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-gray-200 hover:bg-white/10 transition shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* BOTÕES */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
            {status !== "atendimento" && (
              <Button
                size="sm"
                disabled={changingStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs transition-all w-full sm:w-auto h-10 sm:h-9 rounded-lg disabled:opacity-60"
                onClick={() => handleStatusChange("atendimento")}
              >
                {changingStatus ? "Alterando..." : "Assumir"}
              </Button>
            )}

            {status === "atendimento" && (
              <>
                <Button
                  size="sm"
                  disabled={changingStatus}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white border border-blue-500/30 transition-all flex-1 sm:flex-none h-10 sm:h-9 rounded-lg disabled:opacity-60"
                  onClick={() => handleStatusChange("bot")}
                >
                  🤖 Bot
                </Button>

                <Button
                  size="sm"
                  disabled={changingStatus}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white border border-red-500/30 transition-all flex-1 sm:flex-none h-10 sm:h-9 rounded-lg disabled:opacity-60"
                  onClick={() => handleStatusChange("finalizado")}
                >
                  ❌ Finalizar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MENSAGENS */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 relative min-h-0">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/logo-sky.png"
            className="w-[280px] sm:w-[400px] max-w-[75%] opacity-5"
            alt="Logo Sky Fit"
          />
        </div>

        <div className="relative z-10 space-y-3">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id ?? `${msg.horario || ""}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex",
                  msg.remetente === "cliente" && "justify-start",
                  (msg.remetente === "atendente" ||
                    msg.remetente === "bot") &&
                    "justify-end"
                )}
              >
                <div
                  className={cn(
                    "max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-lg whitespace-pre-wrap break-words",
                    msg.remetente === "cliente" && "bg-[#1e293b] text-white",
                    (msg.remetente === "atendente" ||
                      msg.remetente === "bot") &&
                      "bg-blue-600 text-white"
                  )}
                >
                  {msg.texto}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      {status === "atendimento" && (
        <form
          onSubmit={handleSend}
          className="border-t border-white/5 px-3 sm:px-4 pt-3 pb-4 sm:pb-3 bg-[#020617] flex gap-2 shrink-0"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="bg-[#1e293b] border-none text-white placeholder:text-gray-400 h-11 rounded-xl"
          />

          <Button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white h-11 w-11 sm:w-auto rounded-xl shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}
    </div>
  );
}