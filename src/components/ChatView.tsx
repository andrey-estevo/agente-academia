import { useState, useEffect, useRef } from "react";
import { Conversation, Message, ConversationStatus } from "@/types";

import { ouvirMensagens } from "@/services/firebaseMensagens";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Send, Phone } from "lucide-react";
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
}: ChatViewProps) {

  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const status: ConversationStatus =
    (conversation.status as ConversationStatus) || "bot";

  const nomeValido =
    conversation.nome &&
    conversation.nome !== conversation.numero &&
    conversation.nome !== "Aluno"
      ? conversation.nome
      : "Cliente";

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

    if (!input.trim()) return;

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
    }

    setSending(false);
  }

  async function handleStatusChange(status: ConversationStatus) {
    try {
      await activeApi.alterarStatus(
        conversation.numero,
        status,
        user?.unidade_id
      );

      onStatusChange(conversation.numero, status);
    } catch {
      toast.error("Erro ao alterar status");
    }
  }

  const iniciais = nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="border-b border-[#1f2937] px-4 h-[72px] bg-[#020617] flex items-center gap-3">

        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
          <span className="text-sm font-semibold text-blue-400">
            {iniciais}
          </span>
        </div>

        <div className="flex-1">

          <div className="flex items-center gap-2">

            <h2 className="text-sm font-semibold truncate text-white">
              {nome}
            </h2>

            <span className={cn(
              "text-[11px] px-2 py-0.5 rounded-full font-medium",
              status === "atendimento" && "bg-blue-600 text-white",
              status === "aguardando" && "bg-yellow-500/20 text-yellow-400",
              status === "bot" && "bg-blue-500/20 text-blue-400",
              status === "finalizado" && "bg-gray-600 text-gray-200"
            )}>
              {status === "atendimento" && "🟢 Em atendimento"}
              {status === "aguardando" && "🟡 Aguardando"}
              {status === "bot" && "🔵 Bot"}
              {status === "finalizado" && "⚪ Finalizado"}
            </span>

          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Phone className="w-3 h-3" />
            <span>{conversation.numero}</span>
            <span>•</span>
            <span>{conversation.setor}</span>
          </div>

        </div>

        {/* BOTÕES */}
        <div className="flex items-center gap-2">

          {status !== "atendimento" && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              onClick={() => handleStatusChange("atendimento")}
            >
              Assumir
            </Button>
          )}

          {status === "atendimento" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-white border-gray-600"
                onClick={() => handleStatusChange("bot")}
              >
                🤖 Bot
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-xs text-red-400 border-red-500"
                onClick={() => handleStatusChange("finalizado")}
              >
                ❌ Finalizar
              </Button>
            </>
          )}

        </div>

      </div>

      {/* MENSAGENS */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#0f172a] relative">

        <div className="absolute inset-0 bg-[url('/logo-sky.png')] bg-center bg-no-repeat bg-contain opacity-5 pointer-events-none"></div>

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
                  (msg.remetente === "atendente" || msg.remetente === "bot") && "justify-end"
                )}
              >

                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow",
                    msg.remetente === "cliente" && "bg-[#1e293b] text-white",
                    (msg.remetente === "atendente" || msg.remetente === "bot") && "bg-blue-600 text-white"
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
        <form onSubmit={handleSend} className="border-t border-[#1f2937] px-4 py-3 bg-[#020617] flex gap-2">

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="bg-[#1e293b] border-none text-white placeholder:text-gray-400"
          />

          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Send className="w-4 h-4"/>
          </Button>

        </form>
      )}

    </div>
  );
}