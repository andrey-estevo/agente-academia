export type ConversationStatus =
  | "bot"
  | "aguardando"
  | "em_atendimento"
  | "finalizado";

export type Sector =
  | "financeiro"
  | "planos"
  | "geral"
  | "Financeiro"
  | "Planos"
  | "Geral";

export interface Conversation {

  // legado frontend
  id?: string;
  cliente_nome?: string;
  cliente_numero?: string;
  horario?: string;

  // dados vindos do n8n
  conversa_id?: string;
  numero?: string;
  nome?: string;
  ultima_atualizacao?: string;

  ultima_mensagem?: string;

  status: ConversationStatus;

  setor?: Sector;

  unidade_id?: string;

  atendente_id?: string;
}

export interface Message {
  id?: number;
  conversa_id: string;
  texto: string;
  remetente: "cliente" | "atendente" | "bot";
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