
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Usuario, Estabelecimento, Checklist, Agendamento, Auditoria, Resposta } from './types';
import { supabase } from './supabase';

interface QualificaContextType extends AppState {
  loading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  switchProfile: (userId: string) => void;
  upsertUsuario: (user: Usuario) => Promise<void>;
  updateCurrentUser: (userData: Partial<Usuario>) => Promise<void>;
  upsertEstabelecimento: (estab: Estabelecimento) => Promise<void>;
  upsertChecklist: (checklist: Checklist) => Promise<void>;
  upsertAgendamento: (agend: Agendamento) => Promise<void>;
  startAuditoria: (estabelecimentoId: string, checklistId: string) => Promise<Auditoria>;
  updateAuditoria: (auditoria: Auditoria) => Promise<void>;
  validarCompletude: (auditoriaId: string) => { completo: boolean; pendencias: string[] };
  calcularScore: (auditoriaId: string) => number;
  uploadPhoto: (file: File | Blob, fileName: string) => Promise<string | null>;
}

const QualificaContext = createContext<QualificaContextType | null>(null);

export const QualificaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AppState>({
    usuarios: [],
    estabelecimentos: [],
    checklists: [],
    agendamentos: [],
    auditorias: [],
    currentUser: null,
  });

  // Carregar dados iniciais do Supabase
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        const [
          { data: usuarios },
          { data: estabelecimentos },
          { data: checklistsData },
          { data: agendamentos },
          { data: auditoriasData },
          { data: setores },
          { data: perguntas },
          { data: respostas }
        ] = await Promise.all([
          supabase.from('usuarios').select('*'),
          supabase.from('estabelecimentos').select('*'),
          supabase.from('checklists').select('*'),
          supabase.from('agendamentos').select('*'),
          supabase.from('auditorias').select('*, respostas(*)'),
          supabase.from('setores').select('*'),
          supabase.from('perguntas').select('*'),
          supabase.from('respostas').select('*')
        ]);

        // Estruturar checklists com setores e perguntas
        const structuredChecklists = (checklistsData || []).map(c => ({
          ...c,
          setores: (setores || []).filter(s => s.checklistId === c.id).map(s => ({
            ...s,
            perguntas: (perguntas || []).filter(p => p.setorId === s.id)
          }))
        }));

        setData({
          usuarios: usuarios || [],
          estabelecimentos: estabelecimentos || [],
          checklists: structuredChecklists,
          agendamentos: agendamentos || [],
          auditorias: (auditoriasData || []).map(a => ({
            ...a,
            respostas: (respostas || []).filter(r => r.auditoriaId === a.id)
          })),
          currentUser: null,
        });
      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('senha', senha)
      .eq('ativo', true)
      .single();

    if (user && !error) {
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

  const upsertUsuario = async (user: Usuario) => {
    const { error } = await supabase.from('usuarios').upsert(user);
    if (!error) {
      setData(prev => ({
        ...prev,
        usuarios: prev.usuarios.find(u => u.id === user.id)
          ? prev.usuarios.map(u => u.id === user.id ? user : u)
          : [...prev.usuarios, user]
      }));
    }
  };

  const updateCurrentUser = async (userData: Partial<Usuario>) => {
    if (!data.currentUser) return;
    const updatedUser = { ...data.currentUser, ...userData };
    const { error } = await supabase.from('usuarios').update(userData).eq('id', data.currentUser.id);
    if (!error) {
      setData(prev => ({
        ...prev,
        currentUser: updatedUser,
        usuarios: prev.usuarios.map(u => u.id === updatedUser.id ? updatedUser : u)
      }));
    }
  };

  const upsertEstabelecimento = async (estab: Estabelecimento) => {
    const { error } = await supabase.from('estabelecimentos').upsert(estab);
    if (!error) {
      setData(prev => ({
        ...prev,
        estabelecimentos: prev.estabelecimentos.find(e => e.id === estab.id)
          ? prev.estabelecimentos.map(e => e.id === estab.id ? estab : e)
          : [...prev.estabelecimentos, estab]
      }));
    }
  };

  const upsertChecklist = async (checklist: Checklist) => {
    // Para simplificar no demo, salvamos apenas a parte principal do checklist
    // Em produção real, faríamos transações para setores e perguntas
    const { error } = await supabase.from('checklists').upsert({
      id: checklist.id,
      nome: checklist.nome,
      descricao: checklist.descricao,
      criadoPorId: checklist.criadoPorId,
      criadoEm: checklist.criadoEm
    });

    if (!error) {
      setData(prev => ({
        ...prev,
        checklists: prev.checklists.find(c => c.id === checklist.id)
          ? prev.checklists.map(c => c.id === checklist.id ? checklist : c)
          : [...prev.checklists, checklist]
      }));
    }
  };

  const upsertAgendamento = async (agend: Agendamento) => {
    const { error } = await supabase.from('agendamentos').upsert(agend);
    if (!error) {
      setData(prev => ({
        ...prev,
        agendamentos: prev.agendamentos.find(a => a.id === agend.id)
          ? prev.agendamentos.map(a => a.id === agend.id ? agend : a)
          : [...prev.agendamentos, agend]
      }));
    }
  };

  const startAuditoria = async (estabelecimentoId: string, checklistId: string): Promise<Auditoria> => {
    const newAudit: any = {
      estabelecimentoId,
      checklistId,
      auditorId: data.currentUser?.id || '',
      iniciadaEm: new Date().toISOString(),
      status: 'em_andamento',
    };

    const { data: created, error } = await supabase
      .from('auditorias')
      .insert(newAudit)
      .select()
      .single();

    if (error) throw error;

    const auditWithRespostas = { ...created, respostas: [] };
    setData(prev => ({ ...prev, auditorias: [...prev.auditorias, auditWithRespostas] }));
    return auditWithRespostas;
  };

  const updateAuditoria = async (auditoria: Auditoria) => {
    // Atualizar dados básicos da auditoria
    const { error } = await supabase.from('auditorias').upsert({
      id: auditoria.id,
      estabelecimentoId: auditoria.estabelecimentoId,
      auditorId: auditoria.auditorId,
      checklistId: auditoria.checklistId,
      iniciadaEm: auditoria.iniciadaEm,
      finalizadaEm: auditoria.finalizadaEm,
      status: auditoria.status
    });

    // Sincronizar respostas (upsert de todas as respostas atuais)
    if (auditoria.respostas.length > 0) {
      await supabase.from('respostas').upsert(auditoria.respostas);
    }

    if (!error) {
      setData(prev => ({
        ...prev,
        auditorias: prev.auditorias.map(a => a.id === auditoria.id ? auditoria : a)
      }));
    }
  };

  const uploadPhoto = async (file: File | Blob, fileName: string): Promise<string | null> => {
    const { data: uploadData, error } = await supabase.storage
      .from('auditorias')
      .upload(`fotos/${Date.now()}_${fileName}`, file);

    if (error) {
      console.error("Erro no upload:", error);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('auditorias')
      .getPublicUrl(uploadData.path);

    return publicUrl.publicUrl;
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
      loading,
      login,
      logout,
      switchProfile,
      upsertUsuario,
      updateCurrentUser,
      upsertEstabelecimento,
      upsertChecklist,
      upsertAgendamento,
      startAuditoria,
      updateAuditoria,
      validarCompletude,
      calcularScore,
      uploadPhoto
    }
  }, children);
};

export const useQualificaStore = () => {
  const context = useContext(QualificaContext);
  if (!context) throw new Error("useQualificaStore must be used within a QualificaProvider");
  return context;
};
