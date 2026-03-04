export type ConversationStatus =
  | 'bot'
  | 'aguardando'
  | 'em_atendimento'
  | 'finalizado';

export type Sector = 'Financeiro' | 'Planos' | 'Geral' | 'financeiro' | 'planos' | 'geral';

export interface Conversation {

  // formato do frontend antigo
  id?: string;
  cliente_nome?: string;
  cliente_numero?: string;
  horario?: string;

  // formato vindo do n8n
  conversa_id?: number;
  nome?: string;
  numero?: string;
  ultima_atualizacao?: string;

  ultima_mensagem?: string;

  status: ConversationStatus;

  setor?: Sector;

  unidade_id?: string;

  atendente_id?: string;
}

export interface Message {
  id?: string;
  conversa_id: string | number;
  texto: string;
  remetente: 'cliente' | 'atendente' | 'bot';
  horario: string;
}

export interface Unit {
  id: string;
  nome: string;
}

export interface User {
  id: string;
  email: string;
  nome: string;
  unidade_id: string;
  unidade_nome: string;
}