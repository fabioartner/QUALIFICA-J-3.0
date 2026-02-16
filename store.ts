
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Usuario, Estabelecimento, Checklist, Agendamento, Auditoria, Resposta, Role } from './types';
import { SEED_USERS, SEED_ESTABELECIMENTOS, SEED_CHECKLISTS, SEED_AGENDAMENTOS, SEED_AUDITORIAS } from './constants';

const STORAGE_KEY = 'qualifica_ja_data_v2'; // Incrementado para forçar novo seed com dados atualizados

const initialData: AppState = {
  usuarios: SEED_USERS,
  estabelecimentos: SEED_ESTABELECIMENTOS,
  checklists: SEED_CHECKLISTS,
  agendamentos: SEED_AGENDAMENTOS,
  auditorias: SEED_AUDITORIAS,
  currentUser: null,
};

interface QualificaContextType extends AppState {
  login: (email: string, senha: string) => boolean;
  logout: () => void;
  switchProfile: (userId: string) => void;
  resetData: () => void;
  upsertUsuario: (user: Usuario) => void;
  updateCurrentUser: (userData: Partial<Usuario>) => void;
  upsertEstabelecimento: (estab: Estabelecimento) => void;
  upsertChecklist: (checklist: Checklist) => void;
  upsertAgendamento: (agend: Agendamento) => void;
  startAuditoria: (estabelecimentoId: string, checklistId: string) => Auditoria;
  updateAuditoria: (auditoria: Auditoria) => void;
  validarCompletude: (auditoriaId: string) => { completo: boolean; pendencias: string[] };
  calcularScore: (auditoriaId: string) => number;
}

const QualificaContext = createContext<QualificaContextType | null>(null);

export const QualificaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.usuarios && parsed.usuarios.length > 0) return parsed;
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      }
    }
    return initialData;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const login = (email: string, senha: string): boolean => {
    const user = data.usuarios.find(u => 
      u.email.toLowerCase() === email.trim().toLowerCase() && 
      u.senha === senha && 
      u.ativo
    );
    if (user) {
      setData(prev => ({ ...prev, currentUser: user }));
      return true;
    }
    return false;
  };

  const logout = () => setData(prev => ({ ...prev, currentUser: null }));

  const switchProfile = (userId: string) => {
    const user = data.usuarios.find(u => u.id === userId);
    if (user) setData(prev => ({ ...prev, currentUser: user }));
  };

  const resetData = () => {
    setData({ ...initialData, currentUser: null });
    localStorage.removeItem(STORAGE_KEY);
  };

  const upsertUsuario = (user: Usuario) => {
    setData(prev => ({
      ...prev,
      usuarios: prev.usuarios.find(u => u.id === user.id)
        ? prev.usuarios.map(u => u.id === user.id ? user : u)
        : [...prev.usuarios, user]
    }));
  };

  const updateCurrentUser = (userData: Partial<Usuario>) => {
    if (!data.currentUser) return;
    const updatedUser = { ...data.currentUser, ...userData };
    setData(prev => ({
      ...prev,
      currentUser: updatedUser,
      usuarios: prev.usuarios.map(u => u.id === updatedUser.id ? updatedUser : u)
    }));
  };

  const upsertEstabelecimento = (estab: Estabelecimento) => {
    setData(prev => ({
      ...prev,
      estabelecimentos: prev.estabelecimentos.find(e => e.id === estab.id)
        ? prev.estabelecimentos.map(e => e.id === estab.id ? estab : e)
        : [...prev.estabelecimentos, estab]
    }));
  };

  const upsertChecklist = (checklist: Checklist) => {
    setData(prev => ({
      ...prev,
      checklists: prev.checklists.find(c => c.id === checklist.id)
        ? prev.checklists.map(c => c.id === checklist.id ? checklist : c)
        : [...prev.checklists, checklist]
    }));
  };

  const upsertAgendamento = (agend: Agendamento) => {
    setData(prev => ({
      ...prev,
      agendamentos: prev.agendamentos.find(a => a.id === agend.id)
        ? prev.agendamentos.map(a => a.id === agend.id ? agend : a)
        : [...prev.agendamentos, agend]
    }));
  };

  const startAuditoria = (estabelecimentoId: string, checklistId: string): Auditoria => {
    const newAudit: Auditoria = {
      id: `audit-${Date.now()}`,
      estabelecimentoId,
      checklistId,
      auditorId: data.currentUser?.id || '',
      iniciadaEm: new Date().toISOString(),
      status: 'em_andamento',
      respostas: [],
    };
    setData(prev => ({ ...prev, auditorias: [...prev.auditorias, newAudit] }));
    return newAudit;
  };

  const updateAuditoria = (auditoria: Auditoria) => {
    setData(prev => ({
      ...prev,
      auditorias: prev.auditorias.map(a => a.id === auditoria.id ? auditoria : a)
    }));
  };

  const validarCompletude = (auditoriaId: string) => {
    const audit = data.auditorias.find(a => a.id === auditoriaId);
    const checklist = data.checklists.find(c => c.id === audit?.checklistId);
    if (!audit || !checklist) return { completo: false, pendencias: [] };

    const pendencias: string[] = [];
    checklist.setores.forEach(s => {
      s.perguntas.forEach(p => {
        const r = audit.respostas.find(res => res.perguntaId === p.id);
        if (!r) {
          pendencias.push(`Setor ${s.nome}: Falta responder a pergunta "${p.textoPergunta.substring(0, 20)}..."`);
        } else if (r.resposta === 'nao' && (!r.observacao || !r.fotoUrl)) {
          pendencias.push(`Setor ${s.nome}: Resposta "NÃO" exige foto e observação.`);
        }
      });
    });

    return { completo: pendencias.length === 0, pendencias };
  };

  const calcularScore = (auditoriaId: string) => {
    const audit = data.auditorias.find(a => a.id === auditoriaId);
    if (!audit || audit.respostas.length === 0) return 0;
    const sim = audit.respostas.filter(r => r.resposta === 'sim').length;
    return Math.round((sim / audit.respostas.length) * 100);
  };

  return React.createElement(QualificaContext.Provider, {
    value: {
      ...data,
      login,
      logout,
      switchProfile,
      resetData,
      upsertUsuario,
      updateCurrentUser,
      upsertEstabelecimento,
      upsertChecklist,
      upsertAgendamento,
      startAuditoria,
      updateAuditoria,
      validarCompletude,
      calcularScore
    }
  }, children);
};

export const useQualificaStore = () => {
  const context = useContext(QualificaContext);
  if (!context) throw new Error("useQualificaStore must be used within a QualificaProvider");
  return context;
};
