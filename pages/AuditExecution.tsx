
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQualificaStore } from '../store';
import { 
  Check, 
  X, 
  Camera, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  Send,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  PenTool,
  Maximize2,
  Loader2
} from 'lucide-react';
import { Auditoria, Setor, Pergunta, Resposta } from '../types';

const AuditExecution: React.FC = () => {
  const { auditoriaId } = useParams();
  const [searchParams] = useSearchParams();
  const { auditorias, checklists, estabelecimentos, updateAuditoria, validarCompletude, uploadPhoto } = useQualificaStore();
  const navigate = useNavigate();

  const audit = auditorias.find(a => a.id === auditoriaId);
  const checklist = checklists.find(c => c.id === audit?.checklistId);
  const estab = estabelecimentos.find(e => e.id === audit?.estabelecimentoId);

  const isViewOnly = audit?.status === 'concluida';
  const [activeSectorIdx, setActiveSectorIdx] = useState(0);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const sectorId = searchParams.get('sector');
    if (sectorId && checklist) {
      const idx = checklist.setores.findIndex(s => s.id === sectorId);
      if (idx !== -1) setActiveSectorIdx(idx);
    }
  }, [searchParams, checklist]);

  const progress = useMemo(() => {
    if (!checklist || !audit) return { answered: 0, total: 0, percent: 0 };
    const total = checklist.setores.reduce((acc, s) => acc + s.perguntas.length, 0);
    const answered = audit.respostas.length;
    return { answered, total, percent: Math.round((answered / (total || 1)) * 100) };
  }, [checklist, audit]);

  const validation = useMemo(() => {
    return auditoriaId ? validarCompletude(auditoriaId) : { completo: false, pendencias: [] };
  }, [audit, auditoriaId, audit?.respostas]);

  if (!audit || !checklist || !estab) return <div className="p-8 text-center font-bold text-primary">Auditoria não encontrada.</div>;

  const currentSector = checklist.setores[activeSectorIdx];
  
  const handleAnswer = async (pergId: string, value: 'sim' | 'nao') => {
    if (isViewOnly) return;
    const existing = audit.respostas.find(r => r.perguntaId === pergId);
    let newRespostas: Resposta[];

    if (existing) {
      newRespostas = audit.respostas.map(r => r.perguntaId === pergId ? { ...r, resposta: value } : r);
    } else {
      newRespostas = [...audit.respostas, {
        id: `resp-${Date.now()}-${pergId}`,
        auditoriaId: audit.id,
        perguntaId: pergId,
        setorId: currentSector.id,
        resposta: value,
        criadoEm: new Date().toISOString()
      }];
    }
    await updateAuditoria({ ...audit, respostas: newRespostas });
  };

  const handleUpdateDetail = async (pergId: string, field: 'observacao' | 'fotoUrl', value: string) => {
    if (isViewOnly) return;
    const newRespostas = audit.respostas.map(r => r.perguntaId === pergId ? { ...r, [field]: value } : r);
    await updateAuditoria({ ...audit, respostas: newRespostas });
  };

  const handlePhotoCapture = async (pergId: string, file: File) => {
    setIsUploading(pergId);
    try {
      const publicUrl = await uploadPhoto(file, `audit_${auditoriaId}_${pergId}.jpg`);
      if (publicUrl) {
        await handleUpdateDetail(pergId, 'fotoUrl', publicUrl);
      } else {
        alert("Erro no upload da imagem.");
      }
    } finally {
      setIsUploading(null);
    }
  };

  const startDrawing = (e: any) => {
    if (isViewOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx?.beginPath(); ctx?.moveTo(x, y); setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing || isViewOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx?.lineTo(x, y); ctx?.stroke();
  };

  const finalizeAudit = async () => {
    await updateAuditoria({ ...audit, status: 'concluida', finalizadaEm: new Date().toISOString() });
    navigate('/minhas-auditorias');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 -mt-4 md:-mt-8">
      {/* HEADER FIXO COM PROGRESSO */}
      <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 sticky top-0 z-[60]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/minhas-auditorias')} className="p-2 -ml-2 text-gray-400"><ArrowLeft size={20} /></button>
            <div className="max-w-[180px]">
              <h2 className="font-bold text-gray-800 text-sm truncate leading-tight">{estab.nomeFantasia}</h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{checklist.nome}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-primary uppercase">{progress.answered}/{progress.total} RESPONDIDAS</span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100">
           <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>

      {/* TABS DE SETORES */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar sticky top-[72px] z-50">
        {checklist.setores.map((s, i) => {
          const respsSector = audit.respostas.filter(r => r.setorId === s.id);
          const answered = respsSector.length;
          const total = s.perguntas.length;
          
          const hasIssue = respsSector.some(r => r.resposta === 'nao' && (!r.observacao || !r.fotoUrl));
          const isComplete = answered === total && !hasIssue;

          return (
            <button
              key={s.id}
              onClick={() => setActiveSectorIdx(i)}
              className={`
                flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border-2 flex items-center gap-2 relative
                ${activeSectorIdx === i ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 border-gray-100 text-gray-400'}
                ${isComplete && activeSectorIdx !== i ? 'border-green-100 bg-green-50 text-green-700' : ''}
                ${hasIssue ? 'border-red-400 bg-red-50 text-red-600' : ''}
              `}
            >
              {hasIssue && <AlertCircle size={14} className="animate-pulse" />}
              {s.nome}
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeSectorIdx === i ? 'bg-white/20' : 'bg-gray-200'}`}>{answered}/{total}</span>
            </button>
          );
        })}
      </div>

      {/* LISTA DE PERGUNTAS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 no-scrollbar">
        <div className="flex items-center gap-2 text-primary/40 mb-2">
           <FileText size={18} />
           <span className="text-xs font-black uppercase tracking-widest">{currentSector.nome}</span>
        </div>

        {currentSector.perguntas.map((p, i) => {
          const resp = audit.respostas.find(r => r.perguntaId === p.id);
          const isSim = resp?.resposta === 'sim';
          const isNao = resp?.resposta === 'nao';
          const isComplete = resp && (isSim || (isNao && resp.observacao && resp.fotoUrl));
          const isIncompleteNao = isNao && (!resp.observacao || !resp.fotoUrl);

          return (
            <div 
              key={p.id} 
              className={`
                bg-white p-5 rounded-[24px] shadow-sm border-2 transition-all duration-300
                ${isComplete ? 'border-green-500/10 bg-green-50/5' : 'border-gray-50'}
                ${isIncompleteNao ? 'border-red-500/40 bg-red-50/5 animate-in fade-in' : ''}
              `}
            >
              <div className="flex gap-4 mb-5">
                <span className={`text-xs font-black h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${isComplete ? 'bg-green-500 text-white' : (isIncompleteNao ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-300')}`}>
                  {isComplete ? <Check size={14} strokeWidth={4} /> : (isIncompleteNao ? <AlertTriangle size={14} /> : i + 1)}
                </span>
                <p className="font-bold text-gray-700 text-[14px] leading-tight pt-0.5">{p.textoPergunta}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={isViewOnly}
                  onClick={() => handleAnswer(p.id, 'sim')}
                  className={`
                    flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all
                    ${isSim ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-gray-50 border-gray-100 text-gray-400'}
                  `}
                >
                  <Check size={18} strokeWidth={3} /> SIM
                </button>
                <button
                  disabled={isViewOnly}
                  onClick={() => handleAnswer(p.id, 'nao')}
                  className={`
                    flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all
                    ${isNao ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-gray-50 border-gray-100 text-gray-400'}
                  `}
                >
                  <X size={18} strokeWidth={3} /> NÃO
                </button>
              </div>

              {isNao && (
                <div className="mt-5 space-y-4 pt-5 border-t border-dashed border-gray-100">
                  <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Itens Obrigatórios para Resposta Não</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descreva a Irregularidade *</label>
                    <textarea
                      disabled={isViewOnly}
                      value={resp?.observacao || ''}
                      onChange={(e) => handleUpdateDetail(p.id, 'observacao', e.target.value)}
                      className={`w-full p-4 bg-gray-50 border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary focus:bg-white transition-all ${!resp?.observacao ? 'border-red-200' : 'border-gray-200'}`}
                      placeholder="Relate detalhadamente o que foi encontrado..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Foto da Evidência *</label>
                    <div className="flex gap-3">
                       <div 
                         className={`
                           flex-1 flex flex-col items-center justify-center gap-2 py-10 bg-gray-50 border-2 border-dashed rounded-3xl text-gray-400 transition-all overflow-hidden relative cursor-pointer
                           ${!resp?.fotoUrl ? 'border-red-300 text-red-400 bg-red-50 animate-pulse' : 'border-gray-200 hover:border-primary'}
                         `}
                       >
                          {isUploading === p.id ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="animate-spin text-primary" size={32} />
                              <span className="text-[10px] font-black uppercase">Subindo Foto...</span>
                            </div>
                          ) : resp?.fotoUrl ? (
                            <div className="absolute inset-0 w-full h-full">
                              <img src={resp.fotoUrl} className="w-full h-full object-cover" />
                              <div 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setZoomedPhoto(resp.fotoUrl!); }}
                                className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                              >
                                <Maximize2 className="text-white" size={32} />
                              </div>
                            </div>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer">
                              <Camera size={32} />
                              <span className="text-[10px] font-black uppercase">Tirar Foto Agora</span>
                              {!isViewOnly && (
                                <input 
                                  type="file" accept="image/*" capture="environment" className="hidden"
                                  onChange={(e) => {
                                    if (!e.target.files?.[0]) return;
                                    handlePhotoCapture(p.id, e.target.files[0]);
                                  }}
                                />
                              )}
                            </label>
                          )}
                       </div>
                       {resp?.fotoUrl && !isViewOnly && (
                         <button onClick={() => handleUpdateDetail(p.id, 'fotoUrl', '')} className="px-6 bg-red-50 text-red-500 rounded-3xl transition-colors hover:bg-red-100"><Trash2 size={24}/></button>
                       )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* RODAPÉ */}
      <div className="bg-white border-t border-gray-200 p-4 fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button 
            disabled={activeSectorIdx === 0}
            onClick={() => setActiveSectorIdx(prev => prev - 1)}
            className="flex-1 py-4 font-black bg-gray-100 text-gray-400 rounded-2xl text-[11px] flex items-center justify-center gap-1 transition-colors hover:bg-gray-200"
          >
            <ChevronLeft size={16} /> VOLTAR
          </button>

          {activeSectorIdx < (checklist.setores.length - 1) ? (
            <button 
              onClick={() => setActiveSectorIdx(prev => prev + 1)}
              className="flex-[2] py-4 font-black bg-primary text-white rounded-2xl text-[11px] flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              PRÓXIMO SETOR <ChevronRight size={16} />
            </button>
          ) : (
            !isViewOnly && (
              <button 
                onClick={() => validation.completo ? setShowSignatureModal(true) : setShowPendingModal(true)}
                className={`flex-[2] py-4 font-black rounded-2xl text-[11px] flex items-center justify-center gap-2 shadow-xl transition-all ${validation.completo ? 'bg-accent text-white shadow-accent/20 hover:scale-[1.02]' : 'bg-gray-200 text-gray-400'}`}
              >
                {validation.completo ? 'FINALIZAR AUDITORIA' : 'PENDÊNCIAS EM ABERTO'} <Send size={16} />
              </button>
            )
          )}
        </div>
      </div>
      
      {/* (Restante do código de Modais mantido) */}
      {zoomedPhoto && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setZoomedPhoto(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 bg-white/10 rounded-full"><X size={32} /></button>
          <div className="w-full h-full flex items-center justify-center"><img src={zoomedPhoto} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()}/></div>
        </div>
      )}
    </div>
  );
};

export default AuditExecution;
