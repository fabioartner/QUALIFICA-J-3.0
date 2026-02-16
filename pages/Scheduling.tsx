
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQualificaStore } from '../store';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Building2, 
  User, 
  X, 
  Edit2, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  Play,
  MessageSquare,
  Check
} from 'lucide-react';
import { Agendamento } from '../types';
import SchedulingModal from '../components/SchedulingModal';

const Scheduling: React.FC = () => {
  const { agendamentos, estabelecimentos, usuarios, checklists, startAuditoria, currentUser } = useQualificaStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgend, setEditingAgend] = useState<Agendamento | null>(null);
  
  const [activeTab, setActiveTab] = useState<'oficial' | 'pendentes'>(
    searchParams.get('tab') === 'pendentes' ? 'pendentes' : 'oficial'
  );
  
  const navigate = useNavigate();

  const isClient = currentUser?.role === 'CLIENTE' || currentUser?.role === 'GERENTE';
  const isAdmin = currentUser?.role === 'ADMIN_GERAL';

  useEffect(() => {
    if (searchParams.get('tab') === 'pendentes') {
      setActiveTab('pendentes');
    }
    if (searchParams.get('novo') === 'true') {
      handleOpenModal();
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('novo');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams]);

  const allFilteredAgendamentos = useMemo(() => {
    if (!currentUser) return [];

    let base = agendamentos;
    const userAssigned = currentUser.assignedCompanies || [];

    if (currentUser.role === 'ADMIN_GERAL') {
      base = agendamentos;
    } else if (currentUser.role === 'AUDITOR' || currentUser.role === 'INSPETOR') {
      // REGRA DE OURO: Vê APENAS o que é seu
      base = agendamentos.filter(a => a.auditorId === currentUser.id);
    } else if (isClient) {
      const allowedIds = estabelecimentos
        .filter(e => e.clienteResponsavelId === currentUser.id || userAssigned.includes(e.id))
        .map(e => e.id);
      base = agendamentos.filter(a => allowedIds.includes(a.estabelecimentoId));
    } else {
      return [];
    }

    // Ordenação Cronológica Inteligente (PRÓXIMOS PRIMEIRO)
    const now = new Date();
    return [...base].sort((a, b) => {
      const dateA = new Date(`${a.dataVisita}T${a.horaVisita}`);
      const dateB = new Date(`${b.dataVisita}T${b.horaVisita}`);
      
      const isPastA = dateA < now;
      const isPastB = dateB < now;

      if (!isPastA && isPastB) return -1;
      if (isPastA && !isPastB) return 1;

      if (!isPastA && !isPastB) return dateA.getTime() - dateB.getTime();
      return dateB.getTime() - dateA.getTime();
    });
  }, [agendamentos, currentUser, estabelecimentos, isClient]);

  const pendentes = useMemo(() => allFilteredAgendamentos.filter(a => a.status === 'pendente'), [allFilteredAgendamentos]);
  const oficiais = useMemo(() => allFilteredAgendamentos.filter(a => a.status !== 'pendente'), [allFilteredAgendamentos]);

  const displayedAgendamentos = activeTab === 'pendentes' ? pendentes : oficiais;

  const handleOpenModal = (agend?: Agendamento) => {
    setEditingAgend(agend || null);
    setIsModalOpen(true);
  };

  const handleStartAudit = (agend: Agendamento) => {
    if (!checklists.length) {
      alert("Nenhum checklist disponível.");
      return;
    }
    const audit = startAuditoria(agend.estabelecimentoId, checklists[0].id);
    navigate(`/inspecao/${audit.id}`);
  };

  const handleTabChange = (tab: 'oficial' | 'pendentes') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-8 font-lato">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight font-poppins">Agendamento de Visitas</h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest font-poppins">
            {isClient ? 'Visualize e solicite novas auditorias para suas unidades' : 'Gerencie seu cronograma técnico na plataforma'}
          </p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-accent text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all uppercase tracking-widest text-xs font-poppins"
        >
          <Plus size={20} />
          {isClient ? 'SOLICITAR AUDITORIA' : 'AGENDAR VISITA'}
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-100 pb-px">
        <button onClick={() => handleTabChange('oficial')} className={`pb-4 px-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'oficial' ? 'text-primary' : 'text-gray-400'}`}>
          Cronograma Oficial ({oficiais.length})
          {activeTab === 'oficial' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full" />}
        </button>
        <button onClick={() => handleTabChange('pendentes')} className={`pb-4 px-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'pendentes' ? 'text-accent' : 'text-gray-400'}`}>
          Solicitações Pendentes ({pendentes.length})
          {activeTab === 'pendentes' && <div className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-full" />}
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/30 border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] font-poppins">Estabelecimento</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] font-poppins">Auditor Responsável</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] font-poppins">Data / Hora</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center font-poppins">Status</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right font-poppins">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedAgendamentos.map(agend => {
                const estab = estabelecimentos.find(e => e.id === agend.estabelecimentoId);
                const auditor = usuarios.find(u => u.id === agend.auditorId);
                const isPast = new Date(`${agend.dataVisita}T${agend.horaVisita}`) < new Date();

                return (
                  <tr key={agend.id} className={`hover:bg-gray-50/50 transition-colors group ${isPast && agend.status === 'agendado' ? 'bg-red-50/20' : ''}`}>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isPast ? 'bg-gray-100 text-gray-400' : 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white'}`}>
                          <Building2 size={20} />
                        </div>
                        <div className="flex flex-col">
                           <span className="font-black text-gray-800 text-sm tracking-tight font-poppins">{estab?.nomeFantasia || 'N/A'}</span>
                           {isPast && agend.status === 'agendado' && <span className="text-[8px] font-black text-red-500 uppercase">Atrasado</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      {agend.status === 'pendente' ? (
                        <span className="text-[10px] font-black text-gray-300 uppercase italic">Aguardando Aprovação</span>
                      ) : (
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden">
                              {auditor?.fotoUrl ? <img src={auditor.fotoUrl} className="w-full h-full object-cover" /> : <User size={14} />}
                           </div>
                           <div>
                              <span className="text-sm font-bold text-gray-700 font-poppins">{auditor?.nome || 'Não atribuído'}</span>
                           </div>
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm font-black text-gray-800 font-poppins">
                          <Calendar size={14} className={isPast ? 'text-gray-300' : 'text-accent'} />
                          {new Date(agend.dataVisita).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                          {agend.horaVisita}h
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-full border uppercase tracking-widest font-poppins ${agend.status === 'pendente' ? 'bg-orange-50 text-orange-600 border-orange-100' : agend.status === 'agendado' ? (isPast ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100') : agend.status === 'realizado' ? 'bg-green-50 text-green-600 border-green-100' : agend.status === 'cancelado' ? 'bg-red-50 text-red-600 border-red-100' : ''}`}>
                        {agend.status === 'agendado' && isPast ? 'Atrasado' : agend.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        {isAdmin && agend.status === 'pendente' && (
                          <button onClick={() => handleOpenModal(agend)} className="bg-accent text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Aprovar</button>
                        )}
                        {(isAdmin || currentUser?.role === 'AUDITOR' || currentUser?.role === 'INSPETOR') && agend.status === 'agendado' && (
                          <button onClick={() => handleStartAudit(agend)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Play size={18} fill="currentColor" /></button>
                        )}
                        <button onClick={() => handleOpenModal(agend)} className="p-2 text-gray-400 hover:text-primary"><Edit2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {displayedAgendamentos.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center">
              <Calendar size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs font-poppins">Nenhum agendamento encontrado para o seu perfil</p>
            </div>
          )}
        </div>
      </div>
      <SchedulingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingAgend={editingAgend} />
    </div>
  );
};

export default Scheduling;
