import { Conversation, Message } from "@/types";

const API_BASE =
  import.meta.env.VITE_N8N_API_URL ||
  "https://noisygrasshopper-n8n.cloudfy.live/webhook";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Erro API: ${res.status}`);
  }

  return res.json();
}

export async function listarConversas(): Promise<Conversation[]> {
  const data = await fetchAPI<any[]>("/conversas");

  if (!Array.isArray(data)) return [];

  return data.map((c) => ({
    conversa_id: String(c.conversa_id),
    numero: c.numero ?? "",
    nome: c.nome ?? c.numero ?? "Cliente",
    setor: c.setor ?? "financeiro",
    status: c.status ?? "aguardando",
    ultima_mensagem: c.ultima_mensagem ?? "",
    ultima_atualizacao: c.ultima_atualizacao ?? "",
    unidade_id: c.unidade_id ?? "",
  }));
}

export async function listarMensagens(conversaId: string): Promise<Message[]> {
  const data = await fetchAPI<any[]>(`/mensagens?conversa_id=${conversaId}`);

  if (!Array.isArray(data)) return [];

  return data.map((m) => ({
    id: Number(m.id ?? Date.now()),
    conversa_id: String(m.conversa_id),
    texto: m.mensagem ?? m.texto ?? "",
    remetente: (m.autor ?? "cliente") as "cliente" | "atendente" | "bot",
    horario: m.horario ?? "",
  }));
}

export async function enviarMensagem(numero: string, mensagem: string) {
  return fetchAPI("/responder", {
    method: "POST",
    body: JSON.stringify({
      numero,
      mensagem,
    }),
  });
}