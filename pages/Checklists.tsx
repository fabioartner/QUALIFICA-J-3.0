
import React, { useState, useRef, useMemo } from 'react';
import { useQualificaStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ListChecks, 
  ChevronRight, 
  QrCode, 
  Trash2, 
  LayoutList, 
  Edit2, 
  X, 
  Save, 
  FileUp, 
  Download, 
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Search,
  LayoutGrid,
  ArrowLeft,
  Settings2,
  MoreVertical
} from 'lucide-react';
import { Checklist, Setor, Pergunta } from '../types';
import { generate4DigitCode } from '../utils/helpers';

const Checklists: React.FC = () => {
  const { checklists, upsertChecklist, currentUser } = useQualificaStore();
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filtra checklists com base na busca
  const filteredChecklists = useMemo(() => {
    return checklists.filter(c => 
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [checklists, searchTerm]);

  // Encontra o setor selecionado dentro do checklist selecionado
  const currentSector = useMemo(() => {
    if (!selectedChecklist || !selectedSectorId) return null;
    return selectedChecklist.setores.find(s => s.id === selectedSectorId);
  }, [selectedChecklist, selectedSectorId]);

  // --- Funções de Checklist Manual ---
  const handleOpenCreateModal = () => {
    setFormData({ nome: '', descricao: '' });
    setIsEditingMetadata(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (check: Checklist, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedChecklist(check);
    setFormData({ nome: check.nome, descricao: check.descricao || '' });
    setIsEditingMetadata(true);
    setIsModalOpen(true);
  };

  const handleSaveChecklistMetadata = () => {
    if (!formData.nome.trim()) return;

    if (isEditingMetadata && selectedChecklist) {
      const updated = { ...selectedChecklist, ...formData };
      upsertChecklist(updated);
      setSelectedChecklist(updated);
    } else {
      const newCheck: Checklist = {
        id: `check-${Date.now()}`,
        nome: formData.nome,
        descricao: formData.descricao,
        criadoPorId: currentUser?.id || '',
        criadoEm: new Date().toISOString(),
        setores: []
      };
      upsertChecklist(newCheck);
      setSelectedChecklist(newCheck);
      setSelectedSectorId(null);
    }
    setIsModalOpen(false);
  };

  const selectChecklist = (check: Checklist) => {
    setSelectedChecklist(check);
    setSelectedSectorId(check.setores.length > 0 ? check.setores[0].id : null);
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleFinalSave = () => {
    if (!selectedChecklist) return;
    upsertChecklist(selectedChecklist);
    setShowSaveFeedback(true);
    setTimeout(() => setShowSaveFeedback(false), 2000);
  };

  // --- Funções de Setor e Pergunta ---
  const handleAddSector = () => {
    if (!selectedChecklist) return;
    const newSector: Setor = {
      id: `setor-${Date.now()}`,
      checklistId: selectedChecklist.id,
      nome: 'Novo Setor',
      codigo4Digitos: generate4DigitCode(),
      qrCodeUrl: '',
      perguntas: []
    };
    const updated = { ...selectedChecklist, setores: [...selectedChecklist.setores, newSector] };
    setSelectedChecklist(updated);
    setSelectedSectorId(newSector.id);
  };

  const handleUpdateSectorName = (sectorId: string, name: string) => {
    if (!selectedChecklist) return;
    const updated = {
      ...selectedChecklist,
      setores: selectedChecklist.setores.map(s => s.id === sectorId ? { ...s, nome: name } : s)
    };
    setSelectedChecklist(updated);
  };

  const handleAddQuestion = () => {
    if (!selectedChecklist || !selectedSectorId) return;
    const newQuestion: Pergunta = {
      id: `perg-${Date.now()}`,
      setorId: selectedSectorId,
      textoPergunta: 'Nova pergunta',
      ordem: (currentSector?.perguntas.length || 0) + 1,
      ativo: true
    };
    const updated = {
      ...selectedChecklist,
      setores: selectedChecklist.setores.map(s => s.id === selectedSectorId 
        ? { ...s, perguntas: [...s.perguntas, newQuestion] } 
        : s)
    };
    setSelectedChecklist(updated);
  };

  const handleUpdateQuestionText = (questionId: string, text: string) => {
    if (!selectedChecklist || !selectedSectorId) return;
    const updated = {
      ...selectedChecklist,
      setores: selectedChecklist.setores.map(s => s.id === selectedSectorId ? {
        ...s,
        perguntas: s.perguntas.map(p => p.id === questionId ? { ...p, textoPergunta: text } : p)
      } : s)
    };
    setSelectedChecklist(updated);
  };

  const handleDeleteSector = (sectorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedChecklist || !confirm("Excluir este setor e todas as suas perguntas?")) return;
    const updated = {
      ...selectedChecklist,
      setores: selectedChecklist.setores.filter(s => s.id !== sectorId)
    };
    setSelectedChecklist(updated);
    if (selectedSectorId === sectorId) {
      setSelectedSectorId(updated.setores.length > 0 ? updated.setores[0].id : null);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!selectedChecklist || !selectedSectorId) return;
    const updated = {
      ...selectedChecklist,
      setores: selectedChecklist.setores.map(s => s.id === selectedSectorId ? {
        ...s,
        perguntas: s.perguntas.filter(p => p.id !== questionId)
      } : s)
    };
    setSelectedChecklist(updated);
  };

  // --- Funções CSV ---
  const downloadTemplate = () => {
    const csvContent = "Setor;Pergunta\nCozinha;O piso está limpo e seco?\nSalão;Mesas organizadas?";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo_checklist.csv";
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n');
      const sectorsMap: { [key: string]: string[] } = {};
      for (let i = 1; i < lines.length; i++) {
        const [s, q] = lines[i].split(';');
        if (s && q) {
          if (!sectorsMap[s.trim()]) sectorsMap[s.trim()] = [];
          sectorsMap[s.trim()].push(q.trim());
        }
      }
      const checklistId = `import-${Date.now()}`;
      const newCheck: Checklist = {
        id: checklistId,
        nome: file.name.replace('.csv', '').toUpperCase(),
        descricao: 'Importado via CSV',
        criadoPorId: currentUser?.id || '',
        criadoEm: new Date().toISOString(),
        setores: Object.keys(sectorsMap).map((name, idx) => ({
          id: `s-${idx}-${Date.now()}`,
          checklistId,
          nome: name,
          codigo4Digitos: generate4DigitCode(),
          qrCodeUrl: '',
          perguntas: sectorsMap[name].map((txt, pIdx) => ({
            id: `p-${idx}-${pIdx}-${Date.now()}`,
            setorId: `s-${idx}-${Date.now()}`,
            textoPergunta: txt,
            ordem: pIdx + 1,
            ativo: true
          }))
        }))
      };
      upsertChecklist(newCheck);
      setSelectedChecklist(newCheck);
      setIsImportModalOpen(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-12 font-lato animate-in fade-in duration-500">
      {/* 1. CABEÇALHO DE GESTÃO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight font-poppins">Modelos de Auditoria</h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest font-poppins">Gerencie seus checklists e setores padronizados</p>
        </div>

        <div className="flex flex-1 max-w-xl items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar modelo pelo nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="p-4 bg-white border border-gray-100 text-primary rounded-2xl shadow-sm hover:bg-gray-50 transition-all"
              title="Importar CSV"
            >
              <FileUp size={20} />
            </button>
            <button 
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 bg-primary text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all uppercase tracking-widest text-xs font-poppins"
            >
              <Plus size={20} /> NOVO MODELO
            </button>
          </div>
        </div>
      </div>

      {/* 2. GRADE DE MODELOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredChecklists.map(check => (
          <div 
            key={check.id}
            onClick={() => selectChecklist(check)}
            className={`
              bg-white p-8 rounded-[40px] shadow-xl shadow-gray-200/40 border-2 transition-all cursor-pointer group relative overflow-hidden
              ${selectedChecklist?.id === check.id ? 'border-primary ring-4 ring-primary/5' : 'border-transparent hover:border-primary/20'}
            `}
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
              <ListChecks size={80} />
            </div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-primary/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <LayoutGrid size={24} />
              </div>
              <button 
                onClick={(e) => handleOpenEditModal(check, e)}
                className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-primary/5 hover:text-primary transition-all"
              >
                <Settings2 size={16} />
              </button>
            </div>

            <h3 className="text-xl font-black text-gray-800 mb-2 tracking-tighter font-poppins truncate pr-8">{check.nome}</h3>
            <p className="text-xs text-gray-400 font-medium line-clamp-2 mb-6 h-8">{check.descricao || 'Sem descrição cadastrada.'}</p>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest font-poppins">Estrutura</span>
                <span className="text-[11px] font-bold text-gray-600 font-poppins">{check.setores.length} Setores</span>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest font-poppins">Criado em</span>
                <span className="text-[11px] font-bold text-gray-600 font-poppins">{new Date(check.criadoEm).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredChecklists.length === 0 && (
          <div className="col-span-full py-20 bg-gray-50 border-4 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center text-gray-300">
             <ListChecks size={48} className="mb-4 opacity-20" />
             <p className="font-black uppercase tracking-widest text-xs font-poppins">Nenhum checklist encontrado</p>
          </div>
        )}
      </div>

      {/* 3. ÁREA DE EDIÇÃO (EXIBIDA AO SELECIONAR) */}
      {selectedChecklist && (
        <div ref={editorRef} className="space-y-8 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            {/* Cabeçalho do Editor */}
            <div className="p-10 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black text-primary tracking-tight font-poppins">{selectedChecklist.nome}</h2>
                  <button onClick={() => handleOpenEditModal(selectedChecklist)} className="text-gray-300 hover:text-primary transition-colors">
                    <Edit2 size={18} />
                  </button>
                </div>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest font-poppins">Editor de Modelagem Técnica</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate(`/qr-codes/${selectedChecklist.id}`)}
                  className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-primary text-primary font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all font-poppins"
                >
                  <QrCode size={18} /> Gerar QR Codes
                </button>
                <button 
                  onClick={handleFinalSave}
                  className="flex items-center gap-3 px-10 py-4 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 hover:scale-105 transition-all text-xs uppercase tracking-widest font-poppins"
                >
                  <Save size={20} /> {showSaveFeedback ? 'SALVO!' : 'SALVAR MODELO'}
                </button>
                <button 
                  onClick={() => setSelectedChecklist(null)}
                  className="p-4 bg-gray-200 text-gray-500 rounded-2xl hover:bg-gray-300 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row min-h-[600px]">
              {/* Coluna 1: Setores (33%) */}
              <div className="lg:w-1/3 border-r border-gray-100 p-8 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] font-poppins">Setores do Modelo</h3>
                  <button 
                    onClick={handleAddSector}
                    className="p-2 bg-primary text-white rounded-xl hover:scale-110 transition-all shadow-md"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {selectedChecklist.setores.map(sector => (
                    <div 
                      key={sector.id}
                      onClick={() => setSelectedSectorId(sector.id)}
                      className={`
                        group p-5 rounded-3xl border-2 transition-all cursor-pointer flex justify-between items-center
                        ${selectedSectorId === sector.id ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-primary/20'}
                      `}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <LayoutList size={20} className={selectedSectorId === sector.id ? 'text-white' : 'text-gray-300'} />
                        <div className="flex flex-col min-w-0 flex-1">
                          <input 
                            type="text" 
                            value={sector.nome}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateSectorName(sector.id, e.target.value)}
                            className={`bg-transparent border-none font-bold text-sm focus:outline-none focus:ring-0 truncate ${selectedSectorId === sector.id ? 'text-white' : 'text-gray-700'}`}
                          />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${selectedSectorId === sector.id ? 'text-white/60' : 'text-gray-300'}`}>PIN: {sector.codigo4Digitos}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${selectedSectorId === sector.id ? 'bg-white/20' : 'bg-gray-200 text-gray-400'}`}>
                           {sector.perguntas.length}
                         </span>
                         <button 
                          onClick={(e) => handleDeleteSector(sector.id, e)}
                          className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${selectedSectorId === sector.id ? 'hover:bg-white/20 text-white' : 'hover:bg-red-50 text-red-400'}`}
                         >
                           <Trash2 size={14} />
                         </button>
                      </div>
                    </div>
                  ))}
                  {selectedChecklist.setores.length === 0 && (
                    <div className="py-12 text-center text-gray-300 text-[10px] font-black uppercase tracking-widest italic border-2 border-dashed border-gray-100 rounded-3xl">
                      Nenhum setor adicionado
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna 2: Perguntas do Setor (67%) */}
              <div className="flex-1 bg-white p-10 space-y-8">
                {currentSector ? (
                  <>
                    <div className="flex items-center justify-between pb-6 border-b border-gray-50">
                      <div>
                        <h3 className="text-xl font-black text-gray-800 tracking-tight font-poppins">Perguntas: {currentSector.nome}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-poppins">Defina os itens de conformidade deste setor</p>
                      </div>
                      <button 
                        onClick={handleAddQuestion}
                        className="flex items-center gap-2 bg-accent text-white font-black py-3 px-6 rounded-2xl shadow-lg shadow-accent/20 hover:scale-105 transition-all text-[10px] uppercase tracking-widest font-poppins"
                      >
                        <Plus size={16} /> ADICIONAR ITEM
                      </button>
                    </div>

                    <div className="space-y-4">
                      {currentSector.perguntas.map((perg, idx) => (
                        <div key={perg.id} className="group flex items-start gap-5 p-2 hover:bg-gray-50 rounded-2xl transition-all">
                          <span className="mt-4 text-[11px] font-black text-gray-300 w-6 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                          <div className="flex-1 space-y-2">
                             <textarea 
                                value={perg.textoPergunta}
                                onChange={(e) => handleUpdateQuestionText(perg.id, e.target.value)}
                                rows={2}
                                className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                                placeholder="Descreva a pergunta de auditoria aqui..."
                             />
                          </div>
                          <button 
                            onClick={() => handleDeleteQuestion(perg.id)}
                            className="mt-4 p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      {currentSector.perguntas.length === 0 && (
                        <div className="py-24 text-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
                             <ListChecks size={32} />
                          </div>
                          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest font-poppins">Clique em + Adicionar Item para começar</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-30 grayscale">
                    <ArrowLeft size={48} className="mb-4 text-gray-300" />
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest font-poppins">Selecione um Setor</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-poppins">Para editar as perguntas vinculadas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE METADADOS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-primary/30 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight font-poppins">{isEditingMetadata ? 'Editar' : 'Novo'} Checklist</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 font-poppins">Identifique seu modelo de auditoria</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-poppins">Nome do Modelo</label>
                <input 
                  autoFocus
                  type="text" 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Auditoria de Cozinha Semanal"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm font-poppins"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-poppins">Breve Descrição</label>
                <textarea 
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Finalidade e público alvo deste checklist..."
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm min-h-[120px] font-medium"
                />
              </div>
            </div>
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 font-black text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest text-xs font-poppins"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveChecklistMetadata}
                className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all text-xs uppercase tracking-widest font-poppins"
              >
                {isEditingMetadata ? 'SALVAR ALTERAÇÕES' : 'CRIAR CHECKLIST'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTAÇÃO */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-primary/30 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight font-poppins">Importar Planilha</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 font-poppins">Siga o modelo padrão (.csv)</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-10 space-y-8">
              <div className="bg-primary/5 p-6 rounded-[30px] border border-primary/10 flex items-start gap-4">
                <FileSpreadsheet size={32} className="text-primary shrink-0" />
                <div>
                  <h4 className="font-black text-primary text-sm uppercase tracking-tighter mb-1 font-poppins">Modelo de Importação</h4>
                  <p className="text-[11px] text-gray-500 font-bold leading-relaxed font-poppins">Sua planilha deve conter duas colunas: <span className="text-primary">Setor</span> e <span className="text-primary">Pergunta</span>, separadas por ponto e vírgula (;).</p>
                </div>
              </div>

              <button 
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-3 py-4 border-2 border-primary border-dashed rounded-2xl text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all font-poppins"
              >
                <Download size={18} /> Baixar Modelo Exemplo
              </button>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-poppins">Selecionar Arquivo CSV</label>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-gray-500
                    file:mr-4 file:py-4 file:px-8
                    file:rounded-2xl file:border-0
                    file:text-[10px] file:font-black
                    file:bg-primary file:text-white
                    file:uppercase file:tracking-widest
                    file:cursor-pointer
                    hover:file:bg-primary/90 transition-all"
                />
              </div>
            </div>
            <div className="p-8 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="w-full py-4 font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest text-xs font-poppins"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checklists;
