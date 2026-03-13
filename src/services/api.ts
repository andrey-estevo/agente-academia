import { Conversation, Message, ConversationStatus } from "@/types";

const API_BASE_URL =
  import.meta.env.VITE_N8N_API_URL ||
  "https://noisygrasshopper-n8n.cloudfy.live/webhook";

/* ================================
   FETCH BASE
================================ */

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Erro API: ${response.status}`);
  }

  const text = await response.text();

  if (!text || text.trim() === "") {
    return [] as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    return [] as T;
  }

}

/* ================================
   API PRINCIPAL
================================ */

export const activeApi = {

  /* ================================
     LISTAR CONVERSAS
  ================================= */

  getConversas: async (): Promise<Conversation[]> => {

    const res = await fetchAPI<any[]>(`/conversas`);

    if (!Array.isArray(res)) return [];

    return res.map((c) => {

      const numero = String(c.numero || c.conversa_id || "")
        .replace("@s.whatsapp.net", "")
        .replace(/\D/g, "");

      return {
        conversa_id: numero,
        numero: numero,
        nome: c.nome || numero || "Cliente",
        ultima_mensagem: c.ultima_mensagem || "",
        ultima_atualizacao: c.ultima_atualizacao || "",
        status: c.status || "bot",
        setor: c.setor || "geral",
        unidade_id: c.unidade_id || ""
      };

    });

  },

  /* ================================
     LISTAR MENSAGENS
  ================================= */

  getMensagens: async (conversaId: string): Promise<Message[]> => {

    const numero = String(conversaId || "")
      .replace("@s.whatsapp.net", "")
      .replace(/\D/g, "");

    const res = await fetchAPI<any[]>(`/mensagens?numero=${numero}`);

    if (!Array.isArray(res)) return [];

    return res
      .map((msg, index) => ({

        id: String(msg.id ?? index),

        conversa_id: numero,

        texto: msg.texto ?? "",

        remetente: msg.remetente ?? "cliente",

        horario: msg.horario ?? ""

      }))
      .sort(
        (a, b) =>
          new Date(a.horario).getTime() -
          new Date(b.horario).getTime()
      );

  },

  /* ================================
     ENVIAR MENSAGEM
  ================================= */

   enviarMensagem: async (
  numero: string,
  mensagem: string,
  atendente?: string
) => {

  const telefone = String(numero || "")
    .replace("@s.whatsapp.net", "")
    .replace(/\D/g, "");

  return fetchAPI("/responder", {
    method: "POST",
    body: JSON.stringify({
      numero: telefone,
      mensagem: mensagem,
      atendente: atendente
    })
  });

},

  /* ================================
     ALTERAR STATUS
  ================================= */

  alterarStatus: async (
    conversaId: string,
    status: ConversationStatus
  ) => {

    const numero = String(conversaId || "")
      .replace("@s.whatsapp.net", "")
      .replace(/\D/g, "");

    if (!numero) throw new Error("Número inválido");

    return fetchAPI("/alterar-status", {
      method: "POST",
      body: JSON.stringify({
        numero: numero,
        status: status
      })
    });

  }

};

export const api = activeApi;