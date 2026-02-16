
import React, { useMemo, useRef, useState } from 'react';
import { useQualificaStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle2, Clock, ChevronRight, Eye, Building2, FileDown, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import Logo from '../components/Logo';
import { Auditoria } from '../types';

const AuditHistory: React.FC = () => {
  const { auditorias, estabelecimentos, checklists, currentUser, usuarios } = useQualificaStore();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Filtragem estrita baseada no perfil para o histórico
  const filteredAudits = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'ADMIN_GERAL') return auditorias;

    if (currentUser.role === 'AUDITOR' || currentUser.role === 'INSPETOR') {
      return auditorias.filter(audit => audit.auditorId === currentUser.id);
    }

    if (currentUser.role === 'CLIENTE' || currentUser.role === 'GERENTE') {
      const assigned = currentUser.assignedCompanies || [];
      return auditorias.filter(audit => assigned.includes(audit.estabelecimentoId));
    }

    return [];
  }, [auditorias, currentUser]).sort((a, b) => new Date(b.iniciadaEm).getTime() - new Date(a.iniciadaEm).getTime());

  const handleGenerateReport = async (audit: Auditoria) => {
    setIsGenerating(audit.id);
    try {
      const { jsPDF } = (window as any).jspdf;
      const html2canvas = (window as any).html2canvas;

      // Delay para garantir renderização de fontes e imagens
      await new Promise(resolve => setTimeout(resolve, 1000));

      const element = document.getElementById(`report-template-${audit.id}`);
      if (!element) throw new Error("Template de relatório não encontrado");

      // Captura do Canvas
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1000 
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const contentHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = contentHeight;
      let position = 0;

      // Adiciona a primeira página
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, contentHeight);
      heightLeft -= pdfHeight;

      // Loop para adicionar páginas subsequentes
      while (heightLeft > 0) {
        position = heightLeft - contentHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, contentHeight);
        heightLeft -= pdfHeight;
      }
      
      const estab = estabelecimentos.find(e => e.id === audit.estabelecimentoId);
      pdf.save(`Relatorio_${estab?.nomeFantasia || 'Auditoria'}_${new Date(audit.finalizadaEm!).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Erro técnico ao gerar o PDF. Verifique sua conexão ou tente novamente.");
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-6 font-lato">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight font-poppins uppercase">Histórico Técnico</h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest font-poppins">
            Resultados auditados com total rastreabilidade e transparência
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/30 border border-gray-50 overflow-hidden">
        {filteredAudits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins">Unidade</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins hidden md:table-cell">Checklist</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins">Data</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center font-poppins">Nota</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins">Status</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right font-poppins">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAudits.map(audit => {
                  const estab = estabelecimentos.find(e => e.id === audit.estabelecimentoId);
                  const checklist = checklists.find(c => c.id === audit.checklistId);
                  const answeredCount = audit.respostas.length;
                  const yesCount = audit.respostas.filter(r => r.resposta === 'sim').length;
                  const score = answeredCount > 0 ? Math.round((yesCount / answeredCount) * 100) : 0;

                  return (
                    <tr key={audit.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <Building2 size={16} className="text-primary" />
                          <span className="font-black text-gray-700 font-poppins text-sm tracking-tight">{estab?.nomeFantasia || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-6 text-xs text-gray-600 font-bold font-poppins hidden md:table-cell">{checklist?.nome}</td>
                      <td className="p-6 text-[11px] text-gray-400 font-black uppercase tracking-widest font-poppins">{formatDateTime(audit.iniciadaEm)}</td>
                      <td className="p-6 text-center">
                        <span className={`text-sm font-black font-poppins ${audit.status === 'concluida' ? (score >= 80 ? 'text-green-600' : 'text-accent') : 'text-gray-400'}`}>
                          {audit.status === 'concluida' ? `${score}%` : '--'}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full border uppercase tracking-widest font-poppins ${audit.status === 'concluida' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-primary/5 text-primary border-primary/10'}`}>
                          {audit.status === 'concluida' ? 'Concluída' : 'Em Aberto'}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {audit.status === 'concluida' && (
                            <button 
                              onClick={() => handleGenerateReport(audit)}
                              disabled={isGenerating === audit.id}
                              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                            >
                              {isGenerating === audit.id ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                              Relatório
                            </button>
                          )}
                          <button onClick={() => navigate(`/inspecao/${audit.id}`)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-accent hover:text-white transition-all shadow-sm">
                            <Eye size={18} />
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
            <ClipboardList size={64} className="text-gray-100 mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs italic font-poppins">Nenhum registro encontrado.</p>
          </div>
        )}
      </div>

      {/* TEMPLATE DE PDF (HIDDEN) */}
      <div className="fixed -left-[10000px] top-0 pointer-events-none">
        {filteredAudits.map(audit => {
          const estab = estabelecimentos.find(e => e.id === audit.estabelecimentoId);
          const checklist = checklists.find(c => c.id === audit.checklistId);
          const auditor = usuarios.find(u => u.id === audit.auditorId);
          const answeredCount = audit.respostas.length;
          const yesCount = audit.respostas.filter(r => r.resposta === 'sim').length;
          const noCount = audit.respostas.filter(r => r.resposta === 'nao').length;
          const score = answeredCount > 0 ? Math.round((yesCount / answeredCount) * 100) : 0;

          const statusColor = score >= 90 ? 'text-green-600' : (score >= 70 ? 'text-orange-500' : 'text-red-600');
          const statusBg = score >= 90 ? 'bg-green-50' : (score >= 70 ? 'bg-orange-50' : 'bg-red-50');

          return (
            <div 
              key={`report-template-${audit.id}`} 
              id={`report-template-${audit.id}`}
              className="bg-white flex flex-col"
              style={{ width: '210mm', minHeight: '297mm', padding: '15mm 20mm', boxSizing: 'border-box' }}
            >
              {/* CABEÇALHO */}
              <div className="flex justify-between items-start border-b-4 border-primary pb-8 mb-10">
                <Logo variant="dark" iconSize={40} textSize="text-3xl" />
                <div className="text-right space-y-1">
                  <h2 className="text-2xl font-black text-primary font-poppins uppercase tracking-tight">Relatório de Auditoria</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins">Documento Técnico • ID: {audit.id.slice(-8)}</p>
                </div>
              </div>

              {/* CONTEÚDO */}
              <div className="flex-1 space-y-12">
                {/* DADOS GERAIS */}
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins">Unidade Avaliada</p>
                      <h3 className="text-xl font-black text-gray-800 font-poppins tracking-tight">{estab?.nomeFantasia}</h3>
                      <p className="text-xs font-bold text-gray-500 font-lato">{estab?.endereco}</p>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins">Responsável Técnico (Auditor)</p>
                      <p className="text-lg font-black text-gray-800 font-poppins tracking-tight">{auditor?.nome}</p>
                      <p className="text-[9px] font-black text-gray-300 uppercase font-poppins">Finalizado em: {formatDateTime(audit.finalizadaEm || audit.iniciadaEm)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-[40px] border border-gray-100 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 font-poppins">Checklist Aplicado</p>
                    <h4 className="text-sm font-black text-primary uppercase font-poppins mb-6 tracking-tight">{checklist?.nome}</h4>
                    <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-8 ${statusBg.replace('bg-', 'border-')} shadow-inner`}>
                      <span className={`text-4xl font-black font-poppins ${statusColor}`}>{score}%</span>
                      <span className={`text-[8px] font-black uppercase font-poppins ${statusColor}`}>Conformidade</span>
                    </div>
                  </div>
                </div>

                {/* RESUMO EXECUTIVO */}
                <div className="space-y-6" style={{ breakInside: 'avoid' }}>
                  <h3 className="text-lg font-black text-primary border-l-4 border-accent pl-4 font-poppins uppercase tracking-tight">Resumo Executivo</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-6 bg-gray-50 rounded-3xl text-center border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 font-poppins">Pontos Avaliados</p>
                      <p className="text-2xl font-black text-gray-800 font-poppins">{answeredCount}</p>
                    </div>
                    <div className="p-6 bg-green-50 rounded-3xl text-center border border-green-100">
                      <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1 font-poppins">Conformidades</p>
                      <p className="text-2xl font-black text-green-600 font-poppins">{yesCount}</p>
                    </div>
                    <div className="p-6 bg-red-50 rounded-3xl text-center border border-red-100">
                      <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1 font-poppins">Não Conformidades</p>
                      <p className="text-2xl font-black text-red-600 font-poppins">{noCount}</p>
                    </div>
                    <div className={`p-6 ${statusBg} rounded-3xl text-center border border-gray-100`}>
                      <p className={`text-[9px] font-black ${statusColor} uppercase tracking-widest mb-1 font-poppins`}>Status</p>
                      <p className={`text-[10px] font-black ${statusColor} font-poppins uppercase`}>{score >= 90 ? 'EXCELENTE' : (score >= 70 ? 'SATISFATÓRIO' : 'CRÍTICO')}</p>
                    </div>
                  </div>
                </div>

                {/* DETALHAMENTO DOS SETORES */}
                <div className="space-y-12">
                  {checklist?.setores.map(setor => {
                    const respostasSetor = audit.respostas.filter(r => r.setorId === setor.id);
                    const naoRespostas = respostasSetor.filter(r => r.resposta === 'nao');
                    const simRespostas = respostasSetor.filter(r => r.resposta === 'sim');
                    
                    if (respostasSetor.length === 0) return null;

                    return (
                      <div key={setor.id} className="space-y-6" style={{ breakInside: 'avoid' }}>
                        <div className="bg-primary text-white p-4 rounded-2xl flex justify-between items-center shadow-lg shadow-primary/10">
                          <div className="flex items-center gap-3">
                            <ShieldCheck size={20} className="text-accent" />
                            <h4 className="text-sm font-black uppercase tracking-widest font-poppins">SETOR: {setor.nome}</h4>
                          </div>
                          <span className="text-[10px] font-black uppercase opacity-60 font-poppins">{respostasSetor.length} ITENS ANALISADOS</span>
                        </div>

                        <div className="space-y-4">
                          {/* NÃO CONFORMIDADES PRIMEIRO */}
                          {naoRespostas.map(resp => {
                            const perg = setor.perguntas.find(p => p.id === resp.perguntaId);
                            return (
                              <div key={resp.id} className="border-2 border-red-100 rounded-3xl overflow-hidden bg-[#FFF8F8]" style={{ breakInside: 'avoid' }}>
                                <div className="p-6 flex flex-col md:flex-row gap-8">
                                  <div className="flex-1 space-y-4">
                                    <div className="flex items-start gap-3">
                                      <span className="shrink-0 bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase font-poppins">NÃO CONFORME</span>
                                      <p className="text-sm font-black text-gray-800 font-poppins leading-tight">{perg?.textoPergunta}</p>
                                    </div>
                                    <div className="bg-white/60 p-5 rounded-2xl border border-red-100/50">
                                      <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1 font-poppins">Evidência / Observação</p>
                                      <p className="text-[11px] font-bold text-red-800 italic font-lato leading-relaxed">"{resp.observacao}"</p>
                                    </div>
                                  </div>
                                  {resp.fotoUrl && (
                                    <div className="md:w-72 shrink-0 space-y-2">
                                      <div className="aspect-[16/9] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                                        <img src={resp.fotoUrl} className="w-full h-full object-cover" />
                                      </div>
                                      <p className="text-[7pt] text-gray-400 font-black text-center uppercase tracking-widest font-poppins">
                                        LEG: {setor.nome} - {resp.id.slice(-4)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* CONFORMIDADES */}
                          {simRespostas.length > 0 && (
                            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100" style={{ breakInside: 'avoid' }}>
                              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 font-poppins">Pontos de Conformidade</h5>
                              <div className="grid grid-cols-1 gap-2">
                                {simRespostas.map(resp => {
                                  const perg = setor.perguntas.find(p => p.id === resp.perguntaId);
                                  return (
                                    <div key={resp.id} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-50 transition-all">
                                      <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                                      <p className="text-[10px] font-bold text-gray-600 font-poppins">{perg?.textoPergunta}</p>
                                      <span className="ml-auto text-[8px] font-black text-green-600 uppercase font-poppins">Conforme</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RODAPÉ E ASSINATURAS (PUSHED TO BOTTOM) */}
              <div className="mt-auto pt-20" style={{ breakInside: 'avoid' }}>
                <h3 className="text-lg font-black text-gray-800 text-center uppercase tracking-widest font-poppins mb-16">Encerramento e Validação Técnica</h3>
                
                <div className="grid grid-cols-2 gap-20 px-4 mb-20">
                  <div className="flex flex-col">
                    <div className="border-b-2 border-gray-400 h-10 mb-3"></div>
                    <p className="text-sm font-black text-gray-800 font-poppins uppercase truncate">{auditor?.nome}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins mb-1">Assinatura do Auditor Responsável</p>
                    <p className="text-[10px] font-bold text-gray-300 font-poppins">Data: ___ / ___ / ______</p>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="border-b-2 border-gray-400 h-10 mb-3"></div>
                    <p className="text-sm font-black text-gray-800 font-poppins uppercase truncate">Responsável da Unidade</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-poppins mb-1">Assinatura do Estabelecimento</p>
                    <p className="text-[10px] font-bold text-gray-300 font-poppins">Data: ___ / ___ / ______</p>
                  </div>
                </div>

                <div className="pt-8 border-t-2 border-gray-50 flex justify-between items-center text-[9px] font-black text-gray-300 uppercase tracking-widest font-poppins">
                  <span>Relatório gerado automaticamente pelo sistema Qualifica Já</span>
                  <div className="flex gap-4">
                    <span>Plataforma Digital v3.0</span>
                    <span>Doc. Verificado: {new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditHistory;
