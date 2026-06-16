export type ConversationStatus =
  | "bot"
  | "aguardando"
  | "atendimento"
  | "finalizado";

export type Sector =
  | "financeiro"
  | "planos"
  | "geral"
  | "Financeiro"
  | "Planos"
  | "Geral";

export interface Conversation {

  /* legado frontend */

  id?: string;
  cliente_nome?: string;
  cliente_numero?: string;
  horario?: string;

  /* dados do sistema */

  conversa_id?: string;
  numero?: string;
  telefone?: string;
  nome?: string;

  ultima_mensagem?: string;

  ultima_atualizacao?: any;

  status: ConversationStatus;

  setor?: Sector;

  unidade_id?: string;

  atendente_id?: string;

}

export interface Message {

  id?: string;

  conversa_id: string;

  telefone?: string;

  texto: string;

  remetente: "cliente" | "atendente" | "bot";

  horario: any;

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

  // 🔥 ADICIONADO (NÃO QUEBRA NADA)
  perfil: "admin" | "atendente";
  ativo?: boolean;
}