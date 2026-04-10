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

  /**
   * Lista conversas do painel.
   *
   * Quando `unidadeId` é fornecido, a consulta inclui o parâmetro
   * `unidade_id` para filtrar a coleção de conversas da unidade.
   * Caso contrário, recupera todas as conversas disponíveis (modo legado).
   */
  getConversas: async (unidadeId?: string): Promise<Conversation[]> => {

    // constrói o endpoint de acordo com a presença de unidadeId
    const endpoint = unidadeId
      ? `/conversas?unidade_id=${encodeURIComponent(unidadeId)}`
      : `/conversas`;

    const res = await fetchAPI<any[]>(endpoint);

    if (!Array.isArray(res)) return [];

    return res.map((c: any) => {

      // normaliza o número/conversa_id retirando caracteres não numéricos
      const numero = String(c.numero || c.conversa_id || c.id || "")
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
      } as Conversation;

    });

  },

  /* ================================
     LISTAR MENSAGENS
  ================================= */

  /**
   * Recupera mensagens de uma conversa.
   *
   * Aceita opcionalmente um `unidade_id` para compatibilidade com o fluxo
   * multi-unidade. Quando fornecido, o endpoint inclui tanto o número
   * quanto o identificador da unidade; caso contrário, utiliza o modo
   * legado passando apenas o número.
   */
  getMensagens: async (
    conversaId: string,
    unidade_id?: string
  ): Promise<Message[]> => {

    // normaliza o identificador da conversa removendo caracteres não numéricos
    const numero = String(conversaId || "")
      .replace("@s.whatsapp.net", "")
      .replace(/\D/g, "");

    if (!numero) return [];

    // monta a query string conforme unidade_id
    let query = `/mensagens?numero=${encodeURIComponent(numero)}`;
    if (unidade_id) {
      query += `&unidade_id=${encodeURIComponent(unidade_id)}`;
    }

    const res = await fetchAPI<any[]>(query);

    if (!Array.isArray(res)) return [];

    return res
      .map((msg: any, index: number) => ({
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
    atendente?: string,
    unidade_id?: string
  ) => {

    const telefone = String(numero || "")
      .replace("@s.whatsapp.net", "")
      .replace(/\D/g, "");

    if (!telefone) throw new Error("Número inválido");

    return fetchAPI("/responder", {
      method: "POST",
      body: JSON.stringify({
        numero: telefone,
        mensagem: mensagem,
        atendente: atendente,
        unidade_id: unidade_id
      })
    });

  },

  /* ================================
     ALTERAR STATUS
  ================================= */

  alterarStatus: async (
    conversaId: string,
    status: ConversationStatus,
    unidade_id?: string
  ) => {

    const numero = String(conversaId || "")
      .replace("@s.whatsapp.net", "")
      .replace(/\D/g, "");

    if (!numero) throw new Error("Número inválido");

    return fetchAPI("/alterar-status", {
      method: "POST",
      body: JSON.stringify({
        numero: numero,
        status: status,
        unidade_id: unidade_id
      })
    });

  }

};

export const api = activeApi;