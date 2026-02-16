
import { Usuario, Estabelecimento, Checklist, Agendamento, Auditoria } from './types';

export const SEED_USERS: Usuario[] = [
  {
    id: 'user-001',
    nome: 'Fabio Admin',
    email: 'admin@qualificaja.com',
    senha: '12345678',
    role: 'ADMIN_GERAL',
    ativo: true
  },
  {
    id: 'user-002',
    nome: 'Maria Auditora',
    email: 'auditor@qualificaja.com',
    senha: '12345678',
    role: 'AUDITOR',
    ativo: true
  },
  {
    id: 'user-003',
    nome: 'João Inspetor',
    email: 'inspetor@qualificaja.com',
    senha: '12345678',
    role: 'INSPETOR',
    ativo: true,
    assignedCompanies: ['estab-001']
  },
  {
    id: 'user-004',
    nome: 'Carlos Cliente',
    email: 'cliente@qualificaja.com',
    senha: '12345678',
    role: 'CLIENTE',
    ativo: true,
    assignedCompanies: ['estab-001', 'estab-002']
  }
];

export const SEED_ESTABELECIMENTOS: Estabelecimento[] = [
  {
    id: 'estab-001',
    nomeFantasia: 'Forester Burger',
    razaoSocial: 'Forester Alimentos Ltda',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua das Palmeiras, 123 - São Paulo/SP',
    clienteResponsavelId: 'user-004',
    criadoEm: '2024-01-15T10:00:00Z',
    ativo: true
  },
  {
    id: 'estab-002',
    nomeFantasia: 'Hotel Bellagio Prime',
    razaoSocial: 'Bellagio Hotelaria S.A.',
    cnpj: '98.765.432/0001-10',
    endereco: 'Av. Atlântica, 500 - Rio de Janeiro/RJ',
    clienteResponsavelId: 'user-004',
    criadoEm: '2024-01-20T14:30:00Z',
    ativo: true
  }
];

export const SEED_CHECKLISTS: Checklist[] = [
  {
    id: 'check-001',
    nome: 'Auditoria de Segurança Alimentar',
    descricao: 'Checklist padrão para restaurantes e lanchonetes',
    criadoPorId: 'user-001',
    criadoEm: '2024-01-10T09:00:00Z',
    setores: [
      {
        id: 'setor-001',
        checklistId: 'check-001',
        nome: 'Cozinha',
        codigo4Digitos: 'A3F7',
        qrCodeUrl: '',
        perguntas: [
          { id: 'perg-001', setorId: 'setor-001', textoPergunta: 'As superfícies de preparo estão limpas?', ordem: 1, ativo: true },
          { id: 'perg-002', setorId: 'setor-001', textoPergunta: 'Alimentos em temperatura adequada?', ordem: 2, ativo: true },
          { id: 'perg-003', setorId: 'setor-001', textoPergunta: 'Uso de EPIs obrigatórios?', ordem: 3, ativo: true }
        ]
      },
      {
        id: 'setor-002',
        checklistId: 'check-001',
        nome: 'Salão',
        codigo4Digitos: 'B8K2',
        qrCodeUrl: '',
        perguntas: [
          { id: 'perg-004', setorId: 'setor-002', textoPergunta: 'Mesas limpas e organizadas?', ordem: 1, ativo: true },
          { id: 'perg-005', setorId: 'setor-002', textoPergunta: 'Piso livre de resíduos?', ordem: 2, ativo: true }
        ]
      },
      {
        id: 'setor-003',
        checklistId: 'check-001',
        nome: 'Banheiros',
        codigo4Digitos: 'C5M9',
        qrCodeUrl: '',
        perguntas: [
          { id: 'perg-006', setorId: 'setor-003', textoPergunta: 'Há papel e sabonete disponíveis?', ordem: 1, ativo: true },
          { id: 'perg-007', setorId: 'setor-003', textoPergunta: 'Sanitários sem odores?', ordem: 2, ativo: true }
        ]
      }
    ]
  }
];

export const SEED_AUDITORIAS: Auditoria[] = [
  // Auditoria 1 - Mês 1 (Score: ~70%)
  {
    id: 'audit-old-1',
    estabelecimentoId: 'estab-001',
    auditorId: 'user-002',
    checklistId: 'check-001',
    iniciadaEm: '2024-01-05T10:00:00Z',
    finalizadaEm: '2024-01-05T12:00:00Z',
    status: 'concluida',
    respostas: [
      { id: 'r1', auditoriaId: 'audit-old-1', perguntaId: 'perg-001', setorId: 'setor-001', resposta: 'sim', criadoEm: '' },
      { id: 'r2', auditoriaId: 'audit-old-1', perguntaId: 'perg-002', setorId: 'setor-001', resposta: 'nao', criadoEm: '' },
      { id: 'r3', auditoriaId: 'audit-old-1', perguntaId: 'perg-003', setorId: 'setor-001', resposta: 'sim', criadoEm: '' },
      { id: 'r4', auditoriaId: 'audit-old-1', perguntaId: 'perg-004', setorId: 'setor-002', resposta: 'nao', criadoEm: '' },
      { id: 'r5', auditoriaId: 'audit-old-1', perguntaId: 'perg-005', setorId: 'setor-002', resposta: 'sim', criadoEm: '' },
      { id: 'r6', auditoriaId: 'audit-old-1', perguntaId: 'perg-006', setorId: 'setor-003', resposta: 'sim', criadoEm: '' },
      { id: 'r7', auditoriaId: 'audit-old-1', perguntaId: 'perg-007', setorId: 'setor-003', resposta: 'sim', criadoEm: '' },
    ]
  },
  // Auditoria 2 - Mês 2 (Score: ~80%)
  {
    id: 'audit-old-2',
    estabelecimentoId: 'estab-001',
    auditorId: 'user-002',
    checklistId: 'check-001',
    iniciadaEm: '2024-02-05T10:00:00Z',
    finalizadaEm: '2024-02-05T12:00:00Z',
    status: 'concluida',
    respostas: [
      { id: 'r8', auditoriaId: 'audit-old-2', perguntaId: 'perg-001', setorId: 'setor-001', resposta: 'sim', criadoEm: '' },
      { id: 'r9', auditoriaId: 'audit-old-2', perguntaId: 'perg-002', setorId: 'setor-001', resposta: 'sim', criadoEm: '' },
      { id: 'r10', auditoriaId: 'audit-old-2', perguntaId: 'perg-003', setorId: 'setor-001', resposta: 'sim', criadoEm: '' },
      { id: 'r11', auditoriaId: 'audit-old-2', perguntaId: 'perg-004', setorId: 'setor-002', resposta: 'nao', criadoEm: '' },
      { id: 'r12', auditoriaId: 'audit-old-2', perguntaId: 'perg-005', setorId: 'setor-002', resposta: 'sim', criadoEm: '' },
      { id: 'r13', auditoriaId: 'audit-old-2', perguntaId: 'perg-006', setorId: 'setor-003', resposta: 'sim', criadoEm: '' },
      { id: 'r14', auditoriaId: 'audit-old-2', perguntaId: 'perg-007', setorId: 'setor-003', resposta: 'sim', criadoEm: '' },
    ]
  },
  // Auditoria 3 - Mês Atual (Recente) - Itens Críticos com Fotos
  {
    id: 'audit-recent',
    estabelecimentoId: 'estab-001',
    auditorId: 'user-002',
    checklistId: 'check-001',
    iniciadaEm: '2024-03-10T10:00:00Z',
    finalizadaEm: '2024-03-10T13:00:00Z',
    status: 'concluida',
    respostas: [
      { 
        id: 'r15', auditoriaId: 'audit-recent', perguntaId: 'perg-001', setorId: 'setor-001', resposta: 'nao', 
        observacao: 'Bancada de inox com resíduos de gordura acumulada do turno anterior.',
        fotoUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=400',
        criadoEm: '' 
      },
      { id: 'r16', auditoriaId: 'audit-recent', perguntaId: 'perg-002', setorId: 'setor-001', resposta: 'sim', criadoEm: '' },
      { 
        id: 'r17', auditoriaId: 'audit-recent', perguntaId: 'perg-003', setorId: 'setor-001', resposta: 'nao', 
        observacao: 'Colaborador da chapa operando sem rede de cabelo e barba.',
        fotoUrl: 'https://images.unsplash.com/photo-1577106664030-2f9e49bd44b7?auto=format&fit=crop&q=80&w=400',
        criadoEm: '' 
      },
      { id: 'r18', auditoriaId: 'audit-recent', perguntaId: 'perg-004', setorId: 'setor-002', resposta: 'sim', criadoEm: '' },
      { id: 'r19', auditoriaId: 'audit-recent', perguntaId: 'perg-005', setorId: 'setor-002', resposta: 'sim', criadoEm: '' },
      { id: 'r20', auditoriaId: 'audit-recent', perguntaId: 'perg-006', setorId: 'setor-003', resposta: 'sim', criadoEm: '' },
      { 
        id: 'r21', auditoriaId: 'audit-recent', perguntaId: 'perg-007', setorId: 'setor-003', resposta: 'nao', 
        observacao: 'Forte odor de esgoto detectado no sanitário masculino.',
        fotoUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400',
        criadoEm: '' 
      },
    ]
  }
];

export const SEED_AGENDAMENTOS: Agendamento[] = [
  {
    id: 'agend-001',
    estabelecimentoId: 'estab-001',
    auditorId: 'user-002',
    dataVisita: '2024-03-25',
    horaVisita: '14:30',
    status: 'agendado',
    criadoEm: '2024-02-10T10:00:00Z'
  },
  {
    id: 'agend-002',
    estabelecimentoId: 'estab-002',
    auditorId: 'user-002',
    dataVisita: '2024-04-10',
    horaVisita: '09:00',
    status: 'agendado',
    criadoEm: '2024-02-10T11:00:00Z'
  },
  {
    id: 'agend-003',
    estabelecimentoId: 'estab-001',
    auditorId: 'user-003',
    dataVisita: '2024-04-15',
    horaVisita: '10:00',
    status: 'agendado',
    criadoEm: '2024-03-01T11:00:00Z'
  }
];
