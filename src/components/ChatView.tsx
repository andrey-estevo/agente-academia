import { useState, useEffect, useRef } from "react";
import { Conversation, Message, ConversationStatus } from "@/types";

import { ouvirMensagens } from "@/services/firebaseMensagens";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Send, Phone, ArrowLeft, Menu, MoreVertical, Bot, CheckCircle, Smile, Paperclip, ArrowDown, LockKeyhole, Loader2, AudioLines, FileText, ImageIcon, Video, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { activeApi } from "@/services/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

type MessageTimestamp = string | number | Date | { seconds?: number; toDate?: () => Date } | null | undefined;

function messageDate(value: MessageTimestamp) {
  if (!value) return null;
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate();
  if (typeof value === "object" && "seconds" in value && typeof value.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateKey(value: MessageTimestamp) {
  const date = messageDate(value);
  return date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : "sem-data";
}

function dateLabel(value: MessageTimestamp) {
  const date = messageDate(value);
  if (!date) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

function timeLabel(value: MessageTimestamp) {
  const date = messageDate(value);
  return date ? date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
}

type MediaKind = "audio" | "image" | "video" | "document" | "location" | "media" | null;

function messageMedia(msg: Message): { kind: MediaKind; url?: string } {
  const descriptor = [msg.tipo, msg.type, msg.message_type, msg.tipo_mensagem, msg.mimetype, msg.media_type, msg.mediaType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const url = msg.audio_url || msg.media_url || msg.url;

  if (/audio|ptt|voice|ogg|opus/.test(descriptor)) return { kind: "audio", url };
  if (/image|imagem|photo|jpeg|jpg|png|webp/.test(descriptor)) return { kind: "image", url };
  if (/video|mp4/.test(descriptor)) return { kind: "video", url };
  if (/document|documento|pdf|file/.test(descriptor)) return { kind: "document", url };
  if (/location|localiza|latitude|longitude/.test(descriptor)) return { kind: "location", url };
  if (!msg.texto?.trim()) return { kind: "media", url };
  return { kind: null };
}

const mediaConfig = {
  audio: { title: "Áudio recebido", detail: "Ouça esta mensagem pelo WhatsApp oficial.", icon: AudioLines },
  image: { title: "Imagem recebida", detail: "Visualize esta imagem pelo WhatsApp oficial.", icon: ImageIcon },
  video: { title: "Vídeo recebido", detail: "Assista a este vídeo pelo WhatsApp oficial.", icon: Video },
  document: { title: "Documento recebido", detail: "Abra este documento pelo WhatsApp oficial.", icon: FileText },
  location: { title: "Localização recebida", detail: "Consulte a localização pelo WhatsApp oficial.", icon: MapPin },
  media: { title: "Mídia recebida", detail: "Abra o WhatsApp oficial para visualizar esta mensagem.", icon: Paperclip }
};

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
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [newMessages, setNewMessages] = useState(0);

  const [localStatus, setLocalStatus] = useState<ConversationStatus>(
    (conversation.status as ConversationStatus) || "bot"
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const nearBottomRef = useRef(true);
  const previousMessagesLength = useRef(0);

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
    setLoadingMessages(true);

    const unsubscribe = ouvirMensagens(
      String(conversation.numero),
      (data) => {
        setMessages(data);
        setLoadingMessages(false);
      },
      user?.unidade_id
    );

    return () => unsubscribe();
  }, [conversation.numero, user?.unidade_id]);

  useEffect(() => {
    if (nearBottomRef.current || previousMessagesLength.current === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: previousMessagesLength.current ? "smooth" : "auto" });
      setNewMessages(0);
    } else if (messages.length > previousMessagesLength.current) {
      setNewMessages((count) => count + messages.length - previousMessagesLength.current);
    }
    previousMessagesLength.current = messages.length;
  }, [messages]);

  useEffect(() => {
    nearBottomRef.current = true;
    previousMessagesLength.current = 0;
    setNewMessages(0);
  }, [conversation.numero]);

  function handleMessagesScroll() {
    const element = scrollRef.current;
    if (!element) return;
    nearBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    if (nearBottomRef.current) setNewMessages(0);
  }

  function scrollToLatest() {
    nearBottomRef.current = true;
    setNewMessages(0);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

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
      setShowEmoji(false);
      if (composerRef.current) composerRef.current.style.height = "44px";
    } catch (err) {
      toast.error("Erro ao enviar mensagem");
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
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



  return (
    <div className="flex flex-col h-full bg-[#070F1F] border-l border-blue-500/25 shadow-[-1px_0_10px_rgba(59,130,246,0.10)]">
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

            {/* AVATAR */}
            <div className="w-11 h-11 sm:w-10 sm:h-10 shrink-0">
              <img
                src="/avatar.png"
                alt="Avatar"
                className="w-full h-full rounded-full object-cover border border-blue-500/20 shadow"
              />
            </div>

            {/* INFO */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base sm:text-sm font-semibold truncate text-white leading-tight">
                  {nome}
                </h2>

                <span
                  className={cn(
                    "text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0",
                    status === "atendimento" &&
                    "bg-green-500/20 text-green-400",
                    status === "aguardando" &&
                    "bg-yellow-500/20 text-yellow-400",
                    status === "bot" &&
                    "bg-blue-500/20 text-blue-400",
                    status === "finalizado" &&
                    "bg-gray-500/20 text-gray-400"
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

                <span className="truncate">
                  {conversation.numero}
                </span>

                {conversation.setor && (
                  <>
                    <span className="shrink-0">•</span>

                    <span className="truncate">
                      {conversation.setor}
                    </span>
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
                onClick={() =>
                  handleStatusChange("atendimento")
                }
              >
                {changingStatus
                  ? "Alterando..."
                  : "Assumir"}
              </Button>
            )}

            {status === "atendimento" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={changingStatus}
                    className="ml-auto h-10 sm:h-9 px-3 bg-slate-900 border-white/10 text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg"
                  >
                    {changingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                    <span className="ml-2">Ações</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-slate-950 border-white/10 text-slate-200">
                  <DropdownMenuItem onSelect={() => handleStatusChange("bot")} className="focus:bg-slate-800 focus:text-white cursor-pointer">
                    <Bot className="w-4 h-4 mr-2 text-purple-400" /> Devolver para o bot
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setConfirmFinish(true)} className="focus:bg-red-500/10 focus:text-red-300 text-red-400 cursor-pointer">
                    <CheckCircle className="w-4 h-4 mr-2" /> Finalizar conversa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* MENSAGENS */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img
            src="/logo-sky.png"
            className="w-[280px] sm:w-[400px] max-w-[75%] opacity-5"
            alt="Logo Sky Fit"
          />
        </div>

        <div ref={scrollRef} onScroll={handleMessagesScroll} className="absolute inset-0 z-10 overflow-y-auto scrollbar-thin px-3 sm:px-5 py-4 space-y-2">
          {loadingMessages && (
            <div className="space-y-4 animate-pulse" aria-label="Carregando mensagens">
              <div className="h-14 w-2/3 rounded-2xl bg-slate-800" />
              <div className="h-20 w-3/4 ml-auto rounded-2xl bg-blue-900/50" />
              <div className="h-12 w-1/2 rounded-2xl bg-slate-800" />
            </div>
          )}

          {!loadingMessages && messages.length === 0 && (
            <div className="min-h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/[0.06] flex items-center justify-center mb-3">
                <Bot className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-300">Nenhuma mensagem ainda</p>
              <p className="text-xs text-slate-500 mt-1">As mensagens desta conversa aparecerão aqui.</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, index) => {
              const showDate = index === 0 || dateKey(messages[index - 1]?.horario) !== dateKey(msg.horario);
              const senderLabel = msg.remetente === "bot" ? "Bot" : msg.remetente === "atendente" ? "Atendente" : "Cliente";
              const media = messageMedia(msg);
              return (
              <div key={msg.id ?? `${msg.horario || ""}-${index}`}>
                {showDate && (
                  <div className="flex items-center gap-3 py-3" role="separator">
                    <span className="h-px flex-1 bg-white/[0.06]" />
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-950/80 border border-white/[0.06] rounded-full px-3 py-1">
                      {dateLabel(msg.horario)}
                    </span>
                    <span className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                )}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex",
                  msg.remetente === "cliente" &&
                  "justify-start",
                  (msg.remetente === "atendente" ||
                    msg.remetente === "bot") &&
                  "justify-end"
                )}
              >
                <div
                  className={cn(
                    "max-w-[88%] sm:max-w-[72%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm whitespace-pre-wrap break-words border",
                    msg.remetente === "cliente" &&
                    "bg-slate-800 text-white border-white/[0.06] rounded-bl-md",
                    msg.remetente === "atendente" &&
                    "bg-blue-600 text-white border-blue-400/20 rounded-br-md",
                    msg.remetente === "bot" &&
                    "bg-violet-700/90 text-white border-violet-400/20 rounded-br-md"
                  )}
                >
                  {msg.remetente !== "cliente" && (
                    <div className="text-[10px] font-semibold opacity-75 mb-1">{senderLabel}</div>
                  )}
                  {msg.texto?.trim() && <div>{msg.texto}</div>}
                  {media.kind && (() => {
                    const config = mediaConfig[media.kind];
                    const MediaIcon = config.icon;

                    if (media.kind === "audio" && media.url) {
                      return (
                        <div className="min-w-[240px] sm:min-w-[300px]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><AudioLines className="w-4 h-4" /></span>
                            <span className="text-xs font-medium">Mensagem de áudio</span>
                          </div>
                          <audio controls preload="metadata" src={media.url} className="w-full h-9" aria-label="Mensagem de áudio" />
                        </div>
                      );
                    }

                    return (
                      <div className="min-w-[220px] max-w-[310px] flex items-start gap-3 py-1">
                        <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                          <MediaIcon className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight">{config.title}</p>
                          <p className="text-[11px] opacity-70 leading-relaxed mt-1">{config.detail}</p>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="text-[10px] opacity-60 text-right mt-1 leading-none">{timeLabel(msg.horario)}</div>
                </div>
              </motion.div>
              </div>
            );})}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {newMessages > 0 && (
          <button type="button" onClick={scrollToLatest} className="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 shadow-xl shadow-black/30">
            {newMessages} {newMessages === 1 ? "nova mensagem" : "novas mensagens"}
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* INPUT */}
      {status === "atendimento" && (
        <form
          onSubmit={handleSend}
          className="border-t border-white/[0.06] px-3 sm:px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:pb-3 bg-[#020617] shrink-0"
        >
          {showEmoji && (
            <div className="mb-2 flex flex-wrap gap-1.5 rounded-xl border border-white/[0.07] bg-slate-900 p-2">
              {["😀", "😊", "👍", "💪", "🎉", "✅", "🙏", "🔥"].map((emoji) => (
                <button key={emoji} type="button" onClick={() => setInput((value) => value + emoji)} className="w-9 h-9 rounded-lg hover:bg-white/10 text-lg" aria-label={`Adicionar ${emoji}`}>
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <button type="button" title="Anexos exigem integração com o serviço de envio" disabled className="h-11 w-10 shrink-0 rounded-xl text-slate-600 flex items-center justify-center cursor-not-allowed">
              <Paperclip className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => setShowEmoji((open) => !open)} aria-label="Abrir emojis" aria-pressed={showEmoji} className={cn("h-11 w-10 shrink-0 rounded-xl flex items-center justify-center transition", showEmoji ? "bg-blue-500/15 text-blue-400" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
              <Smile className="w-5 h-5" />
            </button>
            <Textarea
              ref={composerRef}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                event.currentTarget.style.height = "44px";
                event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 128)}px`;
              }}
              onKeyDown={handleComposerKeyDown}
              rows={1}
              placeholder="Digite uma mensagem..."
              className="min-h-11 max-h-32 resize-none bg-[#1e293b] border-white/[0.06] text-white placeholder:text-gray-400 rounded-xl py-3 focus-visible:ring-blue-500/50"
            />
            <Button
              type="submit"
              aria-label="Enviar mensagem"
              disabled={sending || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white h-11 w-11 p-0 rounded-xl shrink-0 disabled:opacity-40"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="hidden sm:block text-[10px] text-slate-600 mt-1.5 ml-[92px]">Enter envia • Shift + Enter quebra a linha</p>
        </form>
      )}

      {status !== "atendimento" && (
        <div className="border-t border-white/[0.06] px-3 sm:px-4 py-3 bg-[#020617] shrink-0">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-900/80 border border-white/[0.06] px-4 py-3 text-xs text-slate-400">
            <LockKeyhole className="w-4 h-4 shrink-0" />
            {status === "bot" && "Conversa controlada pelo bot. Assuma o atendimento para responder."}
            {status === "aguardando" && "Esta conversa está aguardando um atendente. Clique em Assumir para responder."}
            {status === "finalizado" && "Conversa finalizada. Assuma novamente para reabrir o atendimento."}
          </div>
        </div>
      )}

      <AlertDialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <AlertDialogContent className="max-w-md bg-slate-950 border-white/10 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar esta conversa?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              O atendimento será marcado como finalizado. Você poderá assumi-lo novamente mais tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleStatusChange("finalizado")} className="bg-red-600 hover:bg-red-500 text-white">Finalizar conversa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
