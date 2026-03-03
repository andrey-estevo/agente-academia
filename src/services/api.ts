import { Conversation, Message, ConversationStatus } from '@/types';

// Base URL for n8n webhooks - update this with your actual n8n webhook URL
const API_BASE_URL = import.meta.env.VITE_N8N_API_URL || 'https://your-n8n-instance.com/webhook';

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

  return response.json();
}

export const api = {
  getConversas: (unidadeId: string): Promise<Conversation[]> =>
    fetchAPI(`/conversas?unidade_id=${unidadeId}`),

  getMensagens: (conversaId: string): Promise<Message[]> =>
    fetchAPI(`/mensagens?conversa_id=${conversaId}`),

  enviarMensagem: (numero: string, mensagem: string, unidadeId: string) =>
    fetchAPI('/responder', {
      method: 'POST',
      body: JSON.stringify({ numero, mensagem, unidade_id: unidadeId }),
    }),

  alterarStatus: (conversaId: string, status: ConversationStatus, atendenteId?: string) =>
    fetchAPI('/alterar-status', {
      method: 'POST',
      body: JSON.stringify({ conversa_id: conversaId, status, atendente_id: atendenteId }),
    }),
};

// ==========================================
// MOCK DATA - Remove when connecting to n8n
// ==========================================

const mockConversations: Conversation[] = [
  {
    id: '1', cliente_nome: 'Maria Silva', cliente_numero: '5511999001122',
    ultima_mensagem: 'Oi, gostaria de saber sobre os planos disponíveis',
    horario: new Date(Date.now() - 120000).toISOString(), status: 'aguardando',
    setor: 'Planos', unidade_id: 'unidade-1',
  },
  {
    id: '2', cliente_nome: 'João Santos', cliente_numero: '5511988776655',
    ultima_mensagem: 'Preciso de ajuda com o pagamento da mensalidade',
    horario: new Date(Date.now() - 300000).toISOString(), status: 'aguardando',
    setor: 'Financeiro', unidade_id: 'unidade-1',
  },
  {
    id: '3', cliente_nome: 'Ana Costa', cliente_numero: '5511977665544',
    ultima_mensagem: 'Ok, vou verificar aqui. Obrigada!',
    horario: new Date(Date.now() - 600000).toISOString(), status: 'em_atendimento',
    setor: 'Geral', unidade_id: 'unidade-1',
  },
  {
    id: '4', cliente_nome: 'Carlos Oliveira', cliente_numero: '5511966554433',
    ultima_mensagem: 'Perfeito, muito obrigado!',
    horario: new Date(Date.now() - 900000).toISOString(), status: 'finalizado',
    setor: 'Planos', unidade_id: 'unidade-1',
  },
  {
    id: '5', cliente_nome: 'Fernanda Lima', cliente_numero: '5511955443322',
    ultima_mensagem: 'Quero cancelar meu plano',
    horario: new Date(Date.now() - 60000).toISOString(), status: 'aguardando',
    setor: 'Financeiro', unidade_id: 'unidade-1',
  },
  {
    id: '6', cliente_nome: 'Roberto Alves', cliente_numero: '5511944332211',
    ultima_mensagem: 'Qual o horário de funcionamento?',
    horario: new Date(Date.now() - 30000).toISOString(), status: 'bot',
    setor: 'Geral', unidade_id: 'unidade-1',
  },
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    { id: 'm1', conversa_id: '1', texto: 'Olá! Bem-vinda à Academia FitMax! Como posso te ajudar?', remetente: 'bot', horario: new Date(Date.now() - 600000).toISOString() },
    { id: 'm2', conversa_id: '1', texto: 'Oi, gostaria de saber sobre os planos disponíveis', remetente: 'cliente', horario: new Date(Date.now() - 540000).toISOString() },
    { id: 'm3', conversa_id: '1', texto: 'Claro! Vou transferir você para nossa equipe de atendimento.', remetente: 'bot', horario: new Date(Date.now() - 480000).toISOString() },
  ],
  '3': [
    { id: 'm4', conversa_id: '3', texto: 'Oi, preciso trocar meu horário de aula', remetente: 'cliente', horario: new Date(Date.now() - 1200000).toISOString() },
    { id: 'm5', conversa_id: '3', texto: 'Olá Ana! Posso te ajudar com isso. Qual horário você prefere?', remetente: 'atendente', horario: new Date(Date.now() - 900000).toISOString() },
    { id: 'm6', conversa_id: '3', texto: 'Gostaria de mudar para as 19h', remetente: 'cliente', horario: new Date(Date.now() - 700000).toISOString() },
    { id: 'm7', conversa_id: '3', texto: 'Ok, vou verificar aqui. Obrigada!', remetente: 'cliente', horario: new Date(Date.now() - 600000).toISOString() },
  ],
};

export const mockApi = {
  getConversas: async (_unidadeId: string): Promise<Conversation[]> => {
    await new Promise(r => setTimeout(r, 300));
    return [...mockConversations];
  },
  getMensagens: async (conversaId: string): Promise<Message[]> => {
    await new Promise(r => setTimeout(r, 200));
    return mockMessages[conversaId] || [];
  },
  enviarMensagem: async (_numero: string, mensagem: string, _unidadeId: string) => {
    await new Promise(r => setTimeout(r, 200));
    return { success: true, mensagem };
  },
  alterarStatus: async (_conversaId: string, status: ConversationStatus) => {
    await new Promise(r => setTimeout(r, 200));
    return { success: true, status };
  },
};

// Toggle: use mockApi during development, api when connected to n8n
export const activeApi = mockApi;
