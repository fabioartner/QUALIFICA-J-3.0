
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQualificaStore } from '../store';
import { 
  Building2, 
  Calendar, 
  ClipboardCheck, 
  ChevronRight,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  TrendingUp,
  FileText,
  BarChart2,
  MessageSquare,
  History,
  Camera,
  CheckCircle2,
  CheckSquare,
  Plus,
  Users,
  Inbox,
  X,
  Maximize2
} from 'lucide-react';
import { Auditoria, Agendamento } from '../types';
import SchedulingModal from '../components/SchedulingModal';

const Dashboard: React.FC = () => {
  const { currentUser, estabelecimentos, agendamentos, auditorias, checklists, startAuditoria } = useQualificaStore();
  const navigate = useNavigate();
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);

  // Filtragem e Ordenação Inteligente (FOCO EM UNIDADES ATIVAS)
  const filteredData = useMemo(() => {
    if (!currentUser) return { estabs: [], agends: [], audits: [], completedAudits: [], pendingAgends: [] };

    // 1. Filtrar apenas estabelecimentos ATIVOS para o contador e operações
    const activeEstabs = estabelecimentos.filter(e => e.ativo);
    const activeIds = new Set(activeEstabs.map(e => e.id));

    let baseAgends = agendamentos.filter(a => activeIds.has(a.estabelecimentoId));
    let baseAudits = auditorias.filter(a => activeIds.has(a.estabelecimentoId));
    const userAssigned = currentUser.assignedCompanies || [];

    // 2. Filtragem por Perfil de Acesso
    if (currentUser.role === 'AUDITOR' || currentUser.role === 'INSPETOR') {
      baseAgends = baseAgends.filter(a => a.auditorId === currentUser.id);
      baseAudits = baseAudits.filter(a => a.auditorId === currentUser.id);
    } else if (currentUser.role === 'CLIENTE' || currentUser.role === 'GERENTE') {
      const allowedIds = activeEstabs
        .filter(e => e.clienteResponsavelId === currentUser.id || userAssigned.includes(e.id))
        .map(e => e.id);
      const allowedSet = new Set(allowedIds);
      baseAgends = baseAgends.filter(a => allowedSet.has(a.estabelecimentoId));
      baseAudits = baseAudits.filter(a => allowedSet.has(a.estabelecimentoId));
    }

    // 3. Ordenação por Proximidade (Próxima Agenda)
    const now = new Date();
    const sortedAgends = [...baseAgends].sort((a, b) => {
      const dateA = new Date(`${a.dataVisita}T${a.horaVisita}`);
      const dateB = new Date(`${b.dataVisita}T${b.horaVisita}`);
      
      const isPastA = dateA < now;
      const isPastB = dateB < now;

      if (!isPastA && isPastB) return -1;
      if (isPastA && !isPastB) return 1;
      if (!isPastA && !isPastB) return dateA.getTime() - dateB.getTime();
      return dateB.getTime() - dateA.getTime();
    });

    const completedAudits = baseAudits
      .filter(a => a.status === 'concluida')
      .sort((a, b) => new Date(b.finalizadaEm!).getTime() - new Date(a.finalizadaEm!).getTime());

    const pendingAgends = agendamentos.filter(a => a.status === 'pendente' && activeIds.has(a.estabelecimentoId));

    // Unidades exibidas no contador: Ativas e que o usuário tem permissão de ver
    const displayedEstabs = activeEstabs.filter(e => 
      currentUser.role === 'ADMIN_GERAL' || 
      userAssigned.includes(e.id) || 
      baseAgends.some(a => a.estabelecimentoId === e.id) ||
      baseAudits.some(a => a.estabelecimentoId === e.id)
    );

    return { estabs: displayedEstabs, agends: sortedAgends, audits: baseAudits, completedAudits, pendingAgends };
  }, [currentUser, estabelecimentos, agendamentos, auditorias]);

  const clientStats = useMemo(() => {
    const { completedAudits } = filteredData;
    if (completedAudits.length === 0) return null;

    const calculateScore = (audit: Auditoria) => {
      const sim = audit.respostas.filter(r => r.resposta === 'sim').length;
      return audit.respostas.length > 0 ? Math.round((sim / audit.respostas.length) * 100) : 0;
    };

    const latestAudit = completedAudits[0];
    const previousAudit = completedAudits[1];
    const latestScore = calculateScore(latestAudit);
    const previousScore = previousAudit ? calculateScore(previousAudit) : latestScore;
    const evolution = latestScore - previousScore;

    const globalAverage = Math.round(
      completedAudits.reduce((acc, a) => acc + calculateScore(a), 0) / completedAudits.length
    );

    const criticalItems = latestAudit.respostas.filter(r => r.resposta === 'nao');
    
    const checklist = checklists.find(c => c.id === latestAudit.checklistId);
    const sectorRanking = checklist?.setores.map(s => {
      const sectorResps = latestAudit.respostas.filter(r => r.setorId === s.id);
      const sectorSim = sectorResps.filter(r => r.resposta === 'sim').length;
      const sectorScore = sectorResps.length > 0 ? Math.round((sectorSim / sectorResps.length) * 100) : 0;
      return { nome: s.nome, score: sectorScore };
    }).sort((a, b) => a.score - b.score) || [];

    const last5Scores = completedAudits.slice(0, 5).reverse().map(a => calculateScore(a));

    return { latestScore, evolution, globalAverage, criticalItems, sectorRanking, last5Scores, latestAudit };
  }, [filteredData, checklists]);

  if (currentUser?.role === 'CLIENTE' || currentUser?.role === 'GERENTE') {
    return (
      <div className="space-y-6 md:space-y-8 font-lato animate-in fade-in duration-500 -mt-4 md:-mt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight font-poppins">Olá, {currentUser.nome.split(' ')[0]}</h1>
            <p className="text-gray-500 font-bold uppercase text-[11px] tracking-widest font-poppins">Painel de Performance Estratégica</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins">Status: Operação Monitorada</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/40 border border-gray-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
              <TrendingUp size={80} />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 font-poppins">Nota Média Global</p>
            <div className="flex items-end gap-3 mb-4">
              <h3 className="text-5xl font-black text-primary tracking-tighter font-poppins">
                {clientStats ? `${clientStats.globalAverage}%` : '--'}
              </h3>
              {clientStats && (
                <div className={`flex items-center text-[11px] font-black mb-1.5 ${clientStats.evolution >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {clientStats.evolution >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(clientStats.evolution)}%
                </div>
              )}
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${clientStats && clientStats.globalAverage > 80 ? 'bg-green-50' : 'bg-accent'}`}
                style={{ width: `${clientStats?.globalAverage || 0}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/40 border border-gray-50 flex flex-col justify-between">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4 font-poppins">Evolução da Qualidade</p>
            <div className="flex-1 flex items-center justify-center">
              {clientStats && clientStats.last5Scores.length > 1 ? (
                <svg viewBox="0 0 100 40" className="w-full h-16 overflow-visible">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#004D71" />
                      <stop offset="100%" stopColor="#F15A24" />
                    </linearGradient>
                  </defs>
                  <path 
                    d={`M ${clientStats.last5Scores.map((s, i) => `${(i * 25)},${40 - (s * 0.35)}`).join(' L ')}`}
                    fill="none" 
                    stroke="url(#lineGrad)" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    className="drop-shadow-lg"
                  />
                  {clientStats.last5Scores.map((s, i) => (
                    <circle key={i} cx={i * 25} cy={40 - (s * 0.35)} r="3" fill="#FFF" stroke="#F15A24" strokeWidth="2" />
                  ))}
                </svg>
              ) : (
                <div className="text-gray-300 text-[10px] font-black uppercase tracking-widest font-poppins italic">Aguardando mais dados...</div>
              )}
            </div>
            <p className="text-center text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-4 font-poppins">Últimas 5 Auditorias</p>
          </div>

          <div className={`p-8 rounded-[32px] shadow-xl shadow-gray-200/40 border transition-all ${clientStats?.criticalItems.length ? 'bg-red-50 border-red-100' : 'bg-white border-gray-50'}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 font-poppins ${clientStats?.criticalItems.length ? 'text-red-400' : 'text-gray-400'}`}>Itens Críticos Detectados</p>
            <div className="flex items-center gap-4">
               <h3 className={`text-5xl font-black tracking-tighter font-poppins ${clientStats?.criticalItems.length ? 'text-red-600' : 'text-green-500'}`}>
                 {clientStats?.criticalItems.length || 0}
               </h3>
               {clientStats?.criticalItems.length ? (
                 <div className="bg-red-600 text-white p-2 rounded-xl animate-bounce">
                   <AlertTriangle size={20} />
                 </div>
               ) : (
                 <div className="bg-green-500 text-white p-2 rounded-xl">
                   <CheckCircle2 size={20} />
                 </div>
               )}
            </div>
            <p className="text-[10px] text-gray-400 font-bold mt-4 font-poppins uppercase tracking-tight">Referente à última visita técnica</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-800 tracking-tight font-poppins">Mapa de Irregularidades</h2>
              <button 
                onClick={() => navigate('/minhas-auditorias')}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-accent transition-colors font-poppins"
              >
                Ver Relatórios Completos
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientStats?.criticalItems.slice(0, 4).map(item => (
                <div key={item.id} className="bg-white p-4 rounded-[24px] shadow-lg shadow-gray-200/20 border border-gray-50 flex gap-4 group hover:border-red-200 transition-all">
                  <div 
                    onClick={() => item.fotoUrl && setZoomedPhoto(item.fotoUrl)}
                    className="w-20 h-20 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden relative border border-gray-100 cursor-pointer"
                  >
                    {item.fotoUrl ? (
                      <>
                        <img src={item.fotoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                           <Maximize2 className="text-white" size={20} />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><Camera size={24} /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1 font-poppins">Irregularidade</p>
                    <p className="text-xs font-bold text-gray-700 line-clamp-3 font-poppins leading-tight italic">
                      "{item.observacao || 'Nenhuma observação detalhada pelo auditor.'}"
                    </p>
                  </div>
                </div>
              ))}
              {(!clientStats || clientStats.criticalItems.length === 0) && (
                <div className="col-span-2 py-16 bg-green-50 border-2 border-dashed border-green-200 rounded-[32px] flex flex-col items-center justify-center text-green-600">
                  <CheckCircle2 size={48} className="mb-4 opacity-40" />
                  <p className="font-black uppercase tracking-widest text-xs font-poppins">Nenhuma irregularidade pendente!</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-primary p-8 rounded-[40px] shadow-2xl shadow-primary/30 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10">
                 <BarChart2 size={120} />
               </div>
               <h3 className="text-lg font-black tracking-tight mb-6 font-poppins">Ranking de Setores</h3>
               <div className="space-y-4 relative z-10">
                 {clientStats?.sectorRanking.map((sector, idx) => (
                   <div key={idx} className="space-y-1.5">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="truncate pr-2">{sector.nome}</span>
                       <span className={sector.score < 70 ? 'text-accent' : 'text-white'}>{sector.score}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-accent" style={{ width: `${sector.score}%` }} />
                     </div>
                   </div>
                 ))}
                 {(!clientStats || clientStats.sectorRanking.length === 0) && (
                   <p className="text-xs text-white/40 italic">Aguardando auditoria completa.</p>
                 )}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/minhas-auditorias')}
                className="bg-white p-6 rounded-[24px] shadow-lg shadow-gray-200/20 border border-gray-50 flex flex-col items-center justify-center text-center group hover:bg-accent transition-all"
              >
                <FileText size={24} className="text-primary group-hover:text-white mb-3" />
                <span className="text-[9px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest font-poppins leading-tight">Relatórios<br/>PDF</span>
              </button>
              <button 
                onClick={() => setIsSchedulingModalOpen(true)}
                className="bg-white p-6 rounded-[24px] shadow-lg shadow-gray-200/20 border border-gray-50 flex flex-col items-center justify-center text-center group hover:bg-primary transition-all"
              >
                <MessageSquare size={24} className="text-accent group-hover:text-white mb-3" />
                <span className="text-[9px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest font-poppins leading-tight">Solicitar<br/>Visita</span>
              </button>
            </div>
          </div>
        </div>

        {zoomedPhoto && (
          <div 
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
            onClick={() => setZoomedPhoto(null)}
          >
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 bg-white/10 rounded-full">
              <X size={32} />
            </button>
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src={zoomedPhoto} 
                className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-xl font-black text-gray-800 tracking-tight font-poppins">Cronograma de Visitas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.agends.filter(a => a.status === 'agendado').slice(0, 3).map(agend => {
              const estab = estabelecimentos.find(e => e.id === agend.estabelecimentoId);
              return (
                <div key={agend.id} className="bg-white p-6 rounded-[32px] shadow-lg shadow-gray-200/20 border border-gray-100 flex items-center justify-between group hover:border-accent transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex flex-col items-center justify-center text-blue-600 font-black font-poppins">
                      <span className="text-sm leading-none">{agend.dataVisita.split('-')[2]}</span>
                      <span className="text-[10px] uppercase">{new Date(agend.dataVisita).toLocaleString('pt-BR', { month: 'short' })}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-base tracking-tighter group-hover:text-accent transition-colors font-poppins truncate max-w-[120px]">{estab?.nomeFantasia || 'N/A'}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-poppins">{agend.horaVisita}h</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/minhas-auditorias')}
                    className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                    title="Ver Histórico desta Unidade"
                  >
                    <History size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <SchedulingModal isOpen={isSchedulingModalOpen} onClose={() => setIsSchedulingModalOpen(false)} />
      </div>
    );
  }

  // Dashboard Técnico (ADMIN/AUDITOR/INSPETOR)
  return (
    <div className="space-y-6 md:space-y-10 font-lato -mt-4 md:-mt-8">
      {currentUser?.role === 'ADMIN_GERAL' && filteredData.pendingAgends.length > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-orange-500/5 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-accent shadow-sm">
              <Inbox size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800 font-poppins tracking-tight">Inbox de Solicitações</h2>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-widest font-poppins">
                Você tem <span className="text-accent">{filteredData.pendingAgends.length} novas</span> auditorias aguardando designação
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/agendamentos?tab=pendentes')}
            className="px-8 py-4 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 hover:scale-105 transition-all text-xs uppercase tracking-widest font-poppins"
          >
            REVISAR SOLICITAÇÕES
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD UNIDADES SOB GESTÃO - CORRIGIDO PARA MOSTRAR APENAS ATIVAS */}
        <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-xl shadow-gray-200/30 border-l-[6px] border-primary flex justify-between items-center transition-all hover:translate-y-[-2px]">
          <div>
            <p className="text-gray-400 text-[11px] font-black mb-1 font-poppins uppercase tracking-wider">Unidades Ativas</p>
            <h3 className="text-4xl md:text-5xl font-black text-primary tracking-tighter font-poppins">{filteredData.estabs.length}</h3>
            <div className="mt-3 flex items-center text-[10px] text-green-600 font-black uppercase tracking-widest font-poppins">
              <ArrowUpRight size={14} className="mr-1" />
              <span>Dados Filtrados</span>
            </div>
          </div>
          <div className="bg-primary/5 p-4 rounded-2xl text-primary">
            <Building2 size={28} />
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-xl shadow-gray-200/30 border-l-[6px] border-accent flex justify-between items-center transition-all hover:translate-y-[-2px]">
          <div>
            <p className="text-gray-400 text-[11px] font-black mb-1 font-poppins uppercase tracking-wider">Meus Agendamentos</p>
            <h3 className="text-4xl md:text-5xl font-black text-accent tracking-tighter font-poppins">{filteredData.agends.filter(a => a.status === 'agendado').length}</h3>
            <div className="mt-3 flex items-center text-[10px] text-blue-600 font-black uppercase tracking-widest font-poppins">
              <Clock size={14} className="mr-1" />
              <span>Sua Agenda</span>
            </div>
          </div>
          <div className="bg-accent/5 p-4 rounded-2xl text-accent">
            <Calendar size={28} />
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-xl shadow-gray-200/30 border-l-[6px] border-green-600 flex justify-between items-center transition-all hover:translate-y-[-2px]">
          <div>
            <p className="text-gray-400 text-[11px] font-black mb-1 font-poppins uppercase tracking-wider">Auditorias em Andamento</p>
            <h3 className="text-4xl md:text-5xl font-black text-green-600 tracking-tighter font-poppins">{filteredData.audits.filter(a => a.status === 'em_andamento').length}</h3>
            <div className="mt-3 flex items-center text-[10px] text-gray-400 font-black uppercase tracking-widest font-poppins">
              <span>Status Operacional</span>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl text-green-600">
            <CheckSquare size={28} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight font-poppins">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-6">
            {(currentUser?.role === 'ADMIN_GERAL' || currentUser?.role === 'AUDITOR' || currentUser?.role === 'INSPETOR') && (
              <button 
                onClick={() => navigate('/audit-center')}
                className="bg-white hover:scale-[1.03] transition-all p-10 rounded-[30px] shadow-lg shadow-gray-200/30 flex flex-col items-center justify-center text-center border border-gray-100 group"
              >
                <div className="bg-primary/5 group-hover:bg-primary group-hover:text-white p-6 rounded-full mb-6 text-primary transition-colors">
                  <ClipboardCheck size={40} />
                </div>
                <span className="font-bold text-gray-800 uppercase tracking-tighter text-sm font-poppins">Nova Auditoria</span>
              </button>
            )}
            
            <button 
              onClick={() => setIsSchedulingModalOpen(true)}
              className="bg-white hover:scale-[1.03] transition-all p-10 rounded-[30px] shadow-lg shadow-gray-200/30 flex flex-col items-center justify-center text-center border border-gray-100 group"
            >
              <div className="bg-accent/5 group-hover:bg-accent group-hover:text-white p-6 rounded-full mb-6 text-accent transition-colors">
                <Calendar size={40} />
              </div>
              <span className="font-bold text-gray-800 uppercase tracking-tighter text-sm font-poppins">Agendar Visita</span>
            </button>

            {currentUser?.role === 'ADMIN_GERAL' && (
              <button 
                onClick={() => navigate('/usuarios')}
                className="bg-white hover:scale-[1.03] transition-all p-10 rounded-[30px] shadow-lg shadow-gray-200/30 flex flex-col items-center justify-center text-center border border-gray-100 group"
              >
                <div className="bg-primary/5 group-hover:bg-primary group-hover:text-white p-6 rounded-full mb-6 text-primary transition-colors">
                  <Users size={40} />
                </div>
                <span className="font-bold text-gray-800 uppercase tracking-tighter text-sm font-poppins">Gerenciar Usuários</span>
              </button>
            )}

            <button 
              onClick={() => navigate('/estabelecimentos')}
              className="bg-white hover:scale-[1.03] transition-all p-10 rounded-[30px] shadow-lg shadow-gray-200/30 flex flex-col items-center justify-center text-center border border-gray-100 group"
            >
              <div className="bg-gray-100 group-hover:bg-primary group-hover:text-white p-6 rounded-full mb-6 text-gray-500 transition-colors">
                <Building2 size={40} />
              </div>
              <span className="font-bold text-gray-800 uppercase tracking-tighter text-sm font-poppins">Estabelecimentos</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight font-poppins">Sua Próxima Agenda</h2>
          <div className="space-y-4">
            {filteredData.agends.filter(a => a.status === 'agendado').slice(0, 5).map(agend => {
              const estab = estabelecimentos.find(e => e.id === agend.estabelecimentoId);
              const visitDate = new Date(`${agend.dataVisita}T${agend.horaVisita}`);
              const isPast = visitDate < new Date();
              const isToday = visitDate.toDateString() === new Date().toDateString();

              return (
                <div key={agend.id} className={`bg-white p-6 rounded-[24px] shadow-lg border transition-all ${isPast ? 'opacity-60 grayscale border-gray-100' : 'shadow-gray-200/20 border-gray-100 group hover:border-accent'}`}>
                  <div className="flex items-center justify-between gap-5">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black font-poppins ${isPast ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>
                        <span className="text-sm leading-none">{agend.dataVisita.split('-')[2]}</span>
                        <span className="text-[10px] uppercase">{new Date(agend.dataVisita).toLocaleString('pt-BR', { month: 'short' })}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <h4 className="font-bold text-gray-800 text-lg tracking-tighter group-hover:text-accent transition-colors font-poppins">{estab?.nomeFantasia || 'N/A'}</h4>
                           {isToday && <span className="bg-green-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black animate-pulse">HOJE</span>}
                           {isPast && <span className="bg-red-50 text-red-500 text-[8px] px-2 py-0.5 rounded-full font-black border border-red-100">ATRASADO</span>}
                        </div>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest font-poppins">{agend.horaVisita}h • {new Date(agend.dataVisita).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    {!isPast && (
                      <button 
                        onClick={() => {
                          const audit = startAuditoria(agend.estabelecimentoId, checklists[0]?.id || '');
                          navigate(`/inspecao/${audit.id}`);
                        }}
                        className="flex items-center gap-1 text-sm font-bold text-primary hover:text-accent transition-all font-poppins"
                      >
                        Iniciar <ChevronRight size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredData.agends.filter(a => a.status === 'agendado').length === 0 && (
              <div className="py-12 bg-gray-50 rounded-[24px] border-2 border-dashed border-gray-200 text-center">
                <Calendar className="mx-auto text-gray-300 mb-3" size={32} />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Nenhuma visita agendada para você</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <SchedulingModal isOpen={isSchedulingModalOpen} onClose={() => setIsSchedulingModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
