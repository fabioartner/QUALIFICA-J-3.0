
import React, { useState, useMemo } from 'react';
import { X, Building2, User, ChevronDown, MessageSquare } from 'lucide-react';
import { useQualificaStore } from '../store';
import { Agendamento, Role } from '../types';

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAgend?: Agendamento | null;
}

const SchedulingModal: React.FC<SchedulingModalProps> = ({ isOpen, onClose, editingAgend }) => {
  const { estabelecimentos, usuarios, upsertAgendamento, currentUser } = useQualificaStore();

  const isClient = currentUser?.role === 'CLIENTE' || currentUser?.role === 'GERENTE';
  const isAdmin = currentUser?.role === 'ADMIN_GERAL';

  const allowedEstabs = useMemo(() => {
    // Mostrar apenas estabelecimentos ATIVOS para novos agendamentos
    const activeEstabs = estabelecimentos.filter(e => e.ativo);
    if (isAdmin) return activeEstabs;
    const assigned = currentUser?.assignedCompanies || [];
    return activeEstabs.filter(e => assigned.includes(e.id) || e.clienteResponsavelId === currentUser?.id);
  }, [isAdmin, currentUser, estabelecimentos]);

  const [formData, setFormData] = useState({
    estabelecimentoId: editingAgend?.estabelecimentoId || allowedEstabs[0]?.id || '',
    auditorId: editingAgend?.auditorId || '',
    dataVisita: editingAgend?.dataVisita || new Date().toISOString().split('T')[0],
    horaVisita: editingAgend?.horaVisita || '09:00',
    status: editingAgend?.status || (isClient ? 'pendente' : 'agendado') as any,
    observacoes: editingAgend?.observacoes || ''
  });

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.estabelecimentoId) {
      alert("Selecione um estabelecimento.");
      return;
    }
    if (!isClient && !formData.auditorId && formData.status === 'agendado') {
      alert("Designar um auditor é obrigatório para agendamentos oficiais.");
      return;
    }

    const newAgend: Agendamento = {
      id: editingAgend?.id || `agend-${Date.now()}`,
      ...formData,
      criadoEm: editingAgend?.criadoEm || new Date().toISOString(),
    };
    upsertAgendamento(newAgend);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        {/* HEADER FIXO */}
        <div className="p-6 md:p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight font-poppins">
              {editingAgend?.status === 'pendente' && isAdmin ? 'Aprovar Solicitação' : 
               isClient ? 'Solicitar Auditoria' : 
               editingAgend ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 font-poppins">
              {isClient ? 'Sua solicitação será analisada pela nossa equipe' : 'Configure os detalhes técnicos da visita'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-gray-400">
            <X size={24} />
          </button>
        </div>
        
        {/* CONTEÚDO ROLÁVEL */}
        <div className="p-6 md:p-10 space-y-6 overflow-y-auto flex-1 no-scrollbar">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1 font-poppins">Estabelecimento</label>
            <div className="relative">
              <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
              <select 
                disabled={!!editingAgend}
                value={formData.estabelecimentoId}
                onChange={(e) => setFormData({...formData, estabelecimentoId: e.target.value})}
                className="w-full pl-14 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm text-gray-700 font-poppins appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="" disabled>Selecione uma unidade</option>
                {allowedEstabs.map(e => <option key={e.id} value={e.id}>{e.nomeFantasia}</option>)}
              </select>
              {!editingAgend && <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />}
            </div>
          </div>

          {!isClient && (
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1 font-poppins">Auditor Responsável</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                <select 
                  value={formData.auditorId}
                  onChange={(e) => setFormData({...formData, auditorId: e.target.value, status: 'agendado'})}
                  className="w-full pl-14 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm text-gray-700 font-poppins appearance-none cursor-pointer"
                >
                  <option value="">Ainda não designado</option>
                  {usuarios.filter(u => u.role === 'AUDITOR' || u.role === 'ADMIN_GERAL' || u.role === 'INSPETOR').map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.role})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1 font-poppins">{isClient ? 'Data Sugerida' : 'Data da Visita'}</label>
              <input 
                type="date" 
                value={formData.dataVisita}
                onChange={(e) => setFormData({...formData, dataVisita: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm text-gray-700 font-poppins"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1 font-poppins">Horário</label>
              <input 
                type="time" 
                value={formData.horaVisita}
                onChange={(e) => setFormData({...formData, horaVisita: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm text-gray-700 font-poppins"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1 font-poppins">Observações / Motivo</label>
            <div className="relative">
              <MessageSquare className="absolute left-5 top-5 text-gray-300 pointer-events-none" size={18} />
              <textarea 
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm text-gray-700 font-poppins min-h-[100px]"
                placeholder={isClient ? "Descreva o motivo da solicitação..." : "Observações internas..."}
              />
            </div>
          </div>
        </div>

        {/* RODAPÉ FIXO */}
        <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex gap-4 justify-end shrink-0">
          <button onClick={onClose} className="px-6 md:px-8 py-3 md:py-4 font-black text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest text-[10px] md:text-xs font-poppins">
            Cancelar
          </button>
          <button onClick={handleSave} className={`px-8 md:px-10 py-3 md:py-4 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-[10px] md:text-xs font-poppins ${isClient ? 'bg-accent shadow-accent/20' : 'bg-primary shadow-primary/20'} hover:scale-[1.05]`}>
            {editingAgend?.status === 'pendente' && isAdmin ? 'CONFIRMAR E DESIGNAR' : isClient ? 'ENVIAR SOLICITAÇÃO' : 'SALVAR'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulingModal;
