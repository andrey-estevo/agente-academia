import { Conversation, Message, ConversationStatus } from '@/types';

// URL base do n8n
const API_BASE_URL =
  import.meta.env.VITE_N8N_API_URL ||
  'https://noisygrasshopper-n8n.cloudfy.live/webhook';

// função genérica de requisição
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return data;
}

export const api = {

  // =========================
  // LISTAR CONVERSAS
  // =========================
  getConversas: async (unidadeId: string): Promise<Conversation[]> => {

    const res = await fetchAPI<any>(`/conversas?unidade_id=${unidadeId}`);

    if (Array.isArray(res)) return res;
    if (res?.data) return res.data;

    return [];
  },

  // =========================
  // LISTAR MENSAGENS
  // =========================
  getMensagens: async (conversaId: string): Promise<Message[]> => {

    const res = await fetchAPI<any>(`/mensagens?conversa_id=${conversaId}`);

    console.log("Mensagens recebidas:", res);

    if (!Array.isArray(res)) return [];

    return res.map((msg: any) => ({
      id: msg.row_number ?? msg.id,
      conversa_id: String(msg.conversa_id),
      texto: msg.mensagem,
      remetente: msg.autor,
      horario: msg.horario
    }));
  },

  // =========================
  // ENVIAR MENSAGEM
  // =========================
  enviarMensagem: (
    numero: string,
    mensagem: string,
    unidadeId: string
  ) =>
    fetchAPI('/responder', {
      method: 'POST',
      body: JSON.stringify({
        numero,
        mensagem,
        unidade_id: unidadeId,
      }),
    }),

  // =========================
  // ALTERAR STATUS
  // =========================
  alterarStatus: (
    conversaId: string,
    status: ConversationStatus,
    atendenteId?: string
  ) =>
    fetchAPI('/alterar-status', {
      method: 'POST',
      body: JSON.stringify({
        conversa_id: conversaId,
        status,
        atendente_id: atendenteId,
      }),
    }),
};

// ======================================
// API ATIVA
// ======================================

export const activeApi = api;