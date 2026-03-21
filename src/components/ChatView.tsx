import { useState, useEffect, useRef } from "react";
import { Conversation, Message, ConversationStatus } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { activeApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, UserCheck, XCircle, Bot, Phone, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "firebase/firestore";

import { db } from "@/lib/firebase";

interface ChatViewProps {
  conversation: Conversation;
  onStatusChange: (convId: string, status: ConversationStatus) => void;
  onBack: () => void;
}

export function ChatView({ conversation, onStatusChange, onBack }: ChatViewProps) {

  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🔥 CORREÇÃO AQUI
  const nomeValido =
    conversation.nome &&
      conversation.nome !== conversation.numero &&
      conversation.nome !== "Aluno"
      ? conversation.nome
      : "Cliente";

  const nome = String(nomeValido);

  console.log("CONVERSATION:", conversation);

  /* FIREBASE REALTIME */

  useEffect(() => {

    if (!conversation?.numero) return;

    const q = query(
      collection(db, "mensagens"),
      where("conversa_id", "==", String(conversation.numero)),
      orderBy("horario", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const msgs: Message[] = snapshot.docs.map((doc) => {

        const data: any = doc.data();

        let horario = "";

        if (data.horario?.seconds) {
          horario = new Date(data.horario.seconds * 1000).toISOString();
        } else {
          horario = data.horario || "";
        }

        return {
          id: doc.id,
          conversa_id: data.conversa_id,
          texto: data.texto,
          remetente: data.remetente,
          horario
        };

      });

      setMessages(msgs);

    });

    return () => unsubscribe();

  }, [conversation.numero]);

  /* SCROLL */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ENVIAR */

  async function handleSend(e: React.FormEvent) {

    e.preventDefault();

    if (!input.trim()) return;

    const texto = input;

    setSending(true);

    try {

      await activeApi.enviarMensagem(
        String(conversation.numero),
        texto,
        user?.email?.split("@")[0] || "Atendente"
      );

      setInput("");

    } catch (err) {

      toast.error("Erro ao enviar mensagem");

      console.error(err);

    }

    setSending(false);

  }

  /* STATUS */

  async function handleStatusChange(status: ConversationStatus) {

    try {

      await activeApi.alterarStatus(
        conversation.numero,
        status
      );

      onStatusChange(conversation.numero, status);

      const labels: Record<string, string> = {
        atendimento: "Atendimento assumido",
        finalizado: "Atendimento finalizado",
        bot: "Retornado para o bot",
        aguardando: "Aguardando"
      };

      toast.success(labels[status]);

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

      <div className="border-b px-4 py-3 bg-card flex items-center gap-3">

        <button
          onClick={onBack}
          className="md:hidden text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-accent">
            {iniciais}
          </span>
        </div>

        <div className="flex-1">

          <div className="flex items-center gap-2">

            <h2 className="text-sm font-semibold truncate">
              {nome}
            </h2>

            <span className={cn(
              "text-[11px] px-2 py-0.5 rounded-full font-medium",
              conversation.status === "atendimento" && "bg-green-100 text-green-700",
              conversation.status === "aguardando" && "bg-yellow-100 text-yellow-700",
              conversation.status === "bot" && "bg-blue-100 text-blue-700",
              conversation.status === "finalizado" && "bg-gray-200 text-gray-600"
            )}>
              {conversation.status === "atendimento" && "🟢 Em atendimento"}
              {conversation.status === "aguardando" && "🟡 Aguardando"}
              {conversation.status === "bot" && "🔵 Bot"}
              {conversation.status === "finalizado" && "⚪ Finalizado"}
            </span>

          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">

            <Phone className="w-3 h-3" />

            <span>{conversation.numero}</span>

            <span>•</span>

            <span>{conversation.setor}</span>

          </div>

        </div>

        <div className="flex items-center gap-2">

          {(conversation.status === "aguardando" ||
            conversation.status === "bot" ||
            conversation.status === "finalizado") && (

              <Button
                size="sm"
                className="bg-accent text-accent-foreground text-xs gap-1"
                onClick={() => handleStatusChange("atendimento")}
              >

                <UserCheck className="w-3.5 h-3.5" />

                Assumir

              </Button>

            )}

          {conversation.status === "atendimento" && (

            <>
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1"
                onClick={() => handleStatusChange("bot")}
              >

                <Bot className="w-3.5 h-3.5" />

                Bot

              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1 text-destructive"
                onClick={() => handleStatusChange("finalizado")}
              >

                <XCircle className="w-3.5 h-3.5" />

                Finalizar

              </Button>
            </>
          )}

        </div>

      </div>

      {/* MENSAGENS */}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">

        <AnimatePresence>

          {messages.map((msg) => (

            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                msg.remetente === "cliente" && "justify-start",
                msg.remetente === "atendente" && "justify-end",
                msg.remetente === "bot" && "justify-center"
              )}
            >

              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  msg.remetente === "cliente" && "bg-wa-bubble-in",
                  msg.remetente === "atendente" && "bg-wa-bubble-out",
                  msg.remetente === "bot" && "bg-wa-bubble-bot text-xs italic"
                )}
              >

                {msg.remetente === "bot" && (
                  <Bot className="w-3 h-3 inline-block mr-1" />
                )}

                {msg.texto}

                <span className="block text-[10px] text-muted-foreground mt-1 text-right">
                  {msg.horario}
                </span>

              </div>

            </motion.div>

          ))}

        </AnimatePresence>

        <div ref={messagesEndRef} />

      </div>

      {/* INPUT */}

      {conversation.status === "atendimento" && (

        <form
          onSubmit={handleSend}
          className="border-t px-4 py-3 bg-card flex items-center gap-2"
        >

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            disabled={sending}
          />

          <Button
            type="submit"
            size="icon"
            className="bg-accent text-accent-foreground"
            disabled={sending || !input.trim()}
          >

            <Send className="w-4 h-4" />

          </Button>

        </form>

      )}

    </div>

  );

}