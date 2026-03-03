export type ConversationStatus = 'bot' | 'aguardando' | 'em_atendimento' | 'finalizado';

export type Sector = 'Financeiro' | 'Planos' | 'Geral';

export interface Conversation {
  id: string;
  cliente_nome: string;
  cliente_numero: string;
  ultima_mensagem: string;
  horario: string;
  status: ConversationStatus;
  setor: Sector;
  unidade_id: string;
  atendente_id?: string;
}

export interface Message {
  id: string;
  conversa_id: string;
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
