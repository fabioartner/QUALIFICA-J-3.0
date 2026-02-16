
import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQualificaStore } from '../store';
import { 
  QrCode, 
  ClipboardList, 
  Calendar, 
  X, 
  ChevronRight,
  ShieldCheck,
  Building2,
  ListChecks,
  CheckCircle2,
  Clock,
  Eye,
  ChevronDown,
  Filter,
  FileDown,
  Loader2,
  Search
} from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import { Auditoria } from '../types';
import Logo from '../components/Logo';
import SchedulingModal from '../components/SchedulingModal';

const AuditCenter: React.FC = () => {
  const navigate = useNavigate();
  const { 
    estabelecimentos, 
    checklists, 
    auditorias, 
    currentUser, 
    usuarios,
    startAuditoria 
  } = useQualificaStore();
  
  const [showScanner, setShowScanner] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Estados para Auditoria Manual
  const [selectedEstab, setSelectedEstab] = useState(estabelecimentos[0]?.id || '');
  const [selectedCheck, setSelectedCheck] = useState(checklists[0]?.id || '');

  // Estados dos Filtros
  const [filterEstab, setFilterEstab] = useState('');
  const [filterAuditor, setFilterAuditor] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  // Lógica de filtragem
  const filteredAudits = useMemo(() => {
    if (!currentUser) return [];
    
    let base = auditorias;
    const userAssigned = currentUser.assignedCompanies || [];

    if (currentUser.role === 'ADMIN_GERAL') {
      // Tudo liberado
    } else if (currentUser.role === 'AUDITOR' || currentUser.role === 'INSPETOR') {
      base = base.filter(a => a.auditorId === currentUser.id);
    } else if (currentUser.role === 'CLIENTE' || currentUser.role === 'GERENTE') {
      const allowedIds = estabelecimentos
        .filter(e => e.clienteResponsavelId === currentUser.id || userAssigned.includes(e.id))
        .map(e => e.id);
      base = base.filter(a => allowedIds.includes(a.estabelecimentoId));
    }

    if (filterEstab) base = base.filter(a => a.estabelecimentoId === filterEstab);
    if (filterAuditor) base = base.filter(a => a.auditorId === filterAuditor);
    if (filterStart) base = base.filter(a => new Date(a.iniciadaEm) >= new Date(filterStart));
    if (filterEnd) {
      const endDate = new Date(filterEnd);
      endDate.setHours(23, 59, 59);
      base = base.filter(a => new Date(a.iniciadaEm) <= endDate);
    }

    return base.sort((a, b) => new Date(b.iniciadaEm).getTime() - new Date(a.iniciadaEm).getTime());
  }, [auditorias, currentUser, estabelecimentos, filterEstab, filterAuditor, filterStart, filterEnd]);

  const handleGenerateReport = async (audit: Auditoria) => {
    setIsGenerating(audit.id);
    try {
      const { jsPDF } = (window as any).jspdf;
      const html2canvas = (window as any).html2canvas;
      await new Promise(resolve => setTimeout(resolve, 800));
      // BUSCAR O TEMPLATE PELO ID CORRETO
      const element = document.getElementById(`report-template-center-${audit.id}`);
      if (!element) throw new Error("Template não encontrado");
      const canvas = await html2canvas(element, { scale: 2.5, useCORS: true, backgroundColor: '#ffffff', windowWidth: 1000 });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const contentHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = contentHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, contentHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - contentHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, contentHeight);
        heightLeft -= pdfHeight;
      }
      const estab = estabelecimentos.find(e => e.id === audit.estabelecimentoId);
      pdf.save(`Relatorio_${estab?.nomeFantasia}_${new Date(audit.finalizadaEm!).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
    } catch (err) { alert("Erro ao gerar PDF."); } finally { setIsGenerating(null); }
  };

  const startCamera = async () => {
    setShowScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) { console.error(err); }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    setShowScanner(false);
  };

  const handleManualStart = () => {
    if (selectedEstab && selectedCheck) {
      const audit = startAuditoria(selectedEstab, selectedCheck);
      navigate(`/inspecao/${audit.id}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pt-0 pb-8 md:pt-2 md:pb-12 px-4 flex flex-col items-center space-y-6 md:space-y-10 font-lato">
      <div className="w-full flex flex-col items-center">
        <div className="flex items-center gap-4 mb-2 md:mb-4">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 shadow-sm">
            <ShieldCheck size={28} className="text-primary md:w-10 md:h-10" />
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-primary tracking-tight font-poppins">AUDITORIA</h1>
        </div>
        <div className="text-center mb-6 md:mb-10">
          <p className="text-gray-400 font-bold text-xs md:text-sm uppercase tracking-widest font-poppins">Selecione o método de coleta ou agende uma visita</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 w-full">
          <button onClick={() => setShowManualModal(true)} className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-50 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-all duration-300">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 text-blue-500 rounded-2xl md:rounded-3xl flex items-center justify-center mb-3 md:mb-6 group-hover:bg-blue-100 transition-colors"><ClipboardList size={24} className="md:w-8 md:h-8" /></div>
            <h3 className="text-sm md:text-lg font-black text-gray-800 mb-1 uppercase tracking-tighter font-poppins">Auditoria Manual</h3>
            <p className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest font-poppins">Navegação por Prontuário</p>
          </button>
          <button onClick={startCamera} className="bg-accent p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-2xl shadow-accent/30 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><QrCode size={80} className="md:w-[100px] md:h-[100px]" /></div>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 text-white rounded-2xl md:rounded-3xl flex items-center justify-center mb-3 md:mb-6"><QrCode size={24} className="md:w-8 md:h-8" /></div>
            <h3 className="text-sm md:text-lg font-black text-white mb-1 uppercase tracking-tighter font-poppins">Escanear QR Code</h3>
            <p className="text-[9px] md:text-[10px] font-black text-white/70 uppercase tracking-widest font-poppins">Acesso por Setor Físico</p>
          </button>
          <button onClick={() => setIsSchedulingModalOpen(true)} className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-50 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-all duration-300">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-50 text-accent rounded-2xl md:rounded-3xl flex items-center justify-center mb-3 md:mb-6 group-hover:bg-orange-100 transition-colors"><Calendar size={24} className="md:w-8 md:h-8" /></div>
            <h3 className="text-sm md:text-lg font-black text-gray-800 mb-1 uppercase tracking-tighter font-poppins">Agendar Visita</h3>
            <p className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest font-poppins">Organizar Cronograma</p>
          </button>
        </div>
      </div>

      <div className="w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-100 pb-6 gap-6">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight font-poppins">Base de Auditorias</h2>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest font-poppins">Registros Técnicos</p>
          </div>
          
          <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 max-w-4xl">
             <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Unidade</label>
                <select value={filterEstab} onChange={(e) => setFilterEstab(e.target.value)} className="w-full text-[10px] font-black p-2 bg-gray-50 rounded-lg border-none focus:ring-1 focus:ring-primary outline-none uppercase">
                   <option value="">Todas</option>
                   {estabelecimentos.map(e => <option key={e.id} value={e.id}>{e.nomeFantasia}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Auditor</label>
                <select value={filterAuditor} onChange={(e) => setFilterAuditor(e.target.value)} className="w-full text-[10px] font-black p-2 bg-gray-50 rounded-lg border-none focus:ring-1 focus:ring-primary outline-none uppercase">
                   <option value="">Todos</option>
                   {usuarios.filter(u => u.role === 'AUDITOR' || u.role === 'ADMIN_GERAL').map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Início</label>
                <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="w-full text-[10px] font-black p-2 bg-gray-50 rounded-lg border-none focus:ring-1 focus:ring-primary outline-none" />
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Fim</label>
                <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="w-full text-[10px] font-black p-2 bg-gray-50 rounded-lg border-none focus:ring-1 focus:ring-primary outline-none" />
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-50 overflow-hidden">
          {filteredAudits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins">Estabelecimento</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins">Auditor</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center font-poppins">Score</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins">Status</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right font-poppins">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAudits.map(audit => {
                    const estab = estabelecimentos.find(e => e.id === audit.estabelecimentoId);
                    const auditor = usuarios.find(u => u.id === audit.auditorId);
                    const answeredCount = audit.respostas.length;
                    const yesCount = audit.respostas.filter(r => r.resposta === 'sim').length;
                    const score = answeredCount > 0 ? Math.round((yesCount / answeredCount) * 100) : 0;
                    const isConcluida = audit.status === 'concluida';

                    return (
                      <tr key={audit.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-5">
                          <div>
                              <p className="font-black text-gray-800 text-sm tracking-tight truncate">{estab?.nomeFantasia || 'N/A'}</p>
                              <p className="text-[10px] text-gray-400 font-bold">{formatDateTime(audit.iniciadaEm)}</p>
                          </div>
                        </td>
                        <td className="p-5">
                            <span className="text-xs font-bold text-gray-600">{auditor?.nome}</span>
                        </td>
                        <td className="p-5 text-center">
                          <span className={`text-sm font-black ${isConcluida ? (score >= 90 ? 'text-green-600' : 'text-orange-500') : 'text-primary'}`}>
                              {isConcluida ? `${score}%` : '--'}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${isConcluida ? 'bg-green-50 text-green-600 border-green-100' : 'bg-primary/5 text-primary border-primary/10'}`}>
                            {isConcluida ? 'Concluída' : 'Em Aberto'}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isConcluida && (
                              <button 
                                onClick={() => handleGenerateReport(audit)}
                                disabled={isGenerating === audit.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md"
                              >
                                {isGenerating === audit.id ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={14} />}
                                PDF
                              </button>
                            )}
                            <button onClick={() => navigate(`/inspecao/${audit.id}`)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-accent hover:text-white transition-all shadow-sm">
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 text-center flex flex-col items-center">
              <ClipboardList size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs font-poppins">Sem registros.</p>
            </div>
          )}
        </div>
      </div>

      <SchedulingModal isOpen={isSchedulingModalOpen} onClose={() => setIsSchedulingModalOpen(false)} />

      {/* TEMPLATE DE PDF (HIDDEN) */}
      <div className="fixed -left-[10000px] top-0 pointer-events-none">
        {filteredAudits.filter(a => a.status === 'concluida').map(audit => {
          const estab = estabelecimentos.find(e => e.id === audit.estabelecimentoId);
          const checklist = checklists.find(c => c.id === audit.checklistId);
          const auditor = usuarios.find(u => u.id === audit.auditorId);
          const answeredCount = audit.respostas.length;
          const yesCount = audit.respostas.filter(r => r.resposta === 'sim').length;
          const score = answeredCount > 0 ? Math.round((yesCount / answeredCount) * 100) : 0;

          return (
            <div 
              key={`report-template-center-${audit.id}`} 
              id={`report-template-center-${audit.id}`}
              className="bg-white p-[15mm] flex flex-col"
              style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
            >
              <div className="flex justify-between items-start border-b-4 border-primary pb-6 mb-10">
                <Logo variant="dark" iconSize={40} textSize="text-3xl" />
                <div className="text-right">
                  <h2 className="text-xl font-black text-primary uppercase">Relatório de Auditoria</h2>
                  <p className="text-[8px] font-black text-gray-400 uppercase">Documento Gerado Online</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Unidade</p>
                  <h3 className="text-lg font-black text-gray-800">{estab?.nomeFantasia}</h3>
                  <p className="text-xs text-gray-500">{estab?.endereco}</p>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-[30px] border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Conformidade</p>
                  <p className="text-4xl font-black text-primary">{score}%</p>
                </div>
              </div>
              <div className="space-y-6">
                {checklist?.setores.map(setor => {
                  const resps = audit.respostas.filter(r => r.setorId === setor.id);
                  if (resps.length === 0) return null;
                  return (
                    <div key={setor.id} className="space-y-3" style={{ breakInside: 'avoid' }}>
                      <h4 className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-black uppercase">SETOR: {setor.nome}</h4>
                      {resps.map(r => {
                        const p = setor.perguntas.find(q => q.id === r.perguntaId);
                        return (
                          <div key={r.id} className={`p-4 rounded-xl border flex gap-4 ${r.resposta === 'nao' ? 'border-red-100 bg-red-50/30' : 'border-gray-50'}`}>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-gray-700">{p?.textoPergunta}</p>
                              {r.observacao && <p className="text-[10px] text-red-800 italic mt-2">OBS: {r.observacao}</p>}
                            </div>
                            <span className={`text-[10px] font-black uppercase ${r.resposta === 'sim' ? 'text-green-600' : 'text-red-600'}`}>{r.resposta}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditCenter;
