
export type Role = 'ADMIN_GERAL' | 'AUDITOR' | 'INSPETOR' | 'CLIENTE' | 'GERENTE';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  telefone?: string;
  fotoUrl?: string;
  role: Role;
  ativo: boolean;
  assignedCompanies?: string[];
}

export interface Estabelecimento {
  id: string;
  nomeFantasia: string;
  razaoSocial?: string;
  cnpj?: string;
  endereco: string;
  clienteResponsavelId: string;
  nomeResponsavel?: string;
  emailResponsavel?: string;
  criadoEm: string;
  ativo: boolean;
}

export interface Pergunta {
  id: string;
  setorId: string;
  textoPergunta: string;
  ordem: number;
  ativo: boolean;
}

export interface Setor {
  id: string;
  checklistId: string;
  nome: string;
  codigo4Digitos: string;
  qrCodeUrl: string;
  perguntas: Pergunta[];
}

export interface Checklist {
  id: string;
  nome: string;
  descricao?: string;
  criadoPorId: string;
  setores: Setor[];
  criadoEm: string;
}

export interface Agendamento {
  id: string;
  estabelecimentoId: string;
  auditorId: string;
  dataVisita: string;
  horaVisita: string;
  status: 'pendente' | 'agendado' | 'realizado' | 'cancelado';
  observacoes?: string;
  criadoEm: string;
}

export interface Resposta {
  id: string;
  auditoriaId: string;
  perguntaId: string;
  setorId: string;
  resposta: 'sim' | 'nao';
  observacao?: string;
  fotoUrl?: string;
  criadoEm: string;
}

export interface Auditoria {
  id: string;
  estabelecimentoId: string;
  auditorId: string;
  checklistId: string;
  iniciadaEm: string;
  finalizadaEm?: string;
  status: 'em_andamento' | 'concluida';
  respostas: Resposta[];
}

export interface AppState {
  usuarios: Usuario[];
  estabelecimentos: Estabelecimento[];
  checklists: Checklist[];
  agendamentos: Agendamento[];
  auditorias: Auditoria[];
  currentUser: Usuario | null;
}
