import { Conversation, Message, ConversationStatus } from "@/types";

const API_BASE_URL =
  import.meta.env.VITE_N8N_API_URL ||
  "https://noisygrasshopper-n8n.cloudfy.live/webhook";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error("Erro na API");
  }

  return response.json();
}

export const api = {

  // LISTAR CONVERSAS
  getConversas: async (): Promise<Conversation[]> => {

    const res = await fetchAPI<any>(`/conversas`);

    if (!Array.isArray(res)) return [];

    const map = new Map<string, Conversation>();

    res.forEach((c: any) => {

      const numero = String(c.numero || c.conversa_id);

      if (!map.has(numero)) {
        map.set(numero, {
          ...c,
          numero,
          conversa_id: numero
        });
      }

    });

    return Array.from(map.values());
  },

  // LISTAR MENSAGENS
  getMensagens: async (conversaId: string): Promise<Message[]> => {

    const res = await fetchAPI<any>(`/mensagens?conversa_id=${conversaId}`);

    if (!Array.isArray(res)) return [];

    return res
      .filter((msg: any) => String(msg.conversa_id) === String(conversaId))
      .map((msg: any) => ({
        id: msg.row_number ?? msg.id,
        conversa_id: String(msg.conversa_id),
        texto: msg.mensagem,
        remetente: msg.autor,
        horario: msg.horario
      }))
      .sort((a, b) => new Date(a.horario).getTime() - new Date(b.horario).getTime());

  },

  // ENVIAR MENSAGEM
  enviarMensagem: (
    numero: string,
    mensagem: string,
    unidadeId: string
  ) =>
    fetchAPI("/responder", {
      method: "POST",
      body: JSON.stringify({
        numero,
        mensagem,
        unidade_id: unidadeId,
      }),
    }),

  // ALTERAR STATUS
  alterarStatus: (
    conversaId: string,
    status: ConversationStatus,
    atendenteId?: string
  ) =>
    fetchAPI("/alterar-status", {
      method: "POST",
      body: JSON.stringify({
        conversa_id: conversaId,
        status,
        atendente_id: atendenteId,
      }),
    }),
};

export const activeApi = api;