
import React, { useState, useMemo } from 'react';
import { useQualificaStore } from '../store';
import { 
  Plus, 
  Search, 
  Edit2, 
  Building2, 
  MapPin, 
  X, 
  LayoutGrid, 
  List,
  Mail,
  User,
  History,
  TrendingUp,
  FileDown,
  Loader2
} from 'lucide-react';
import { Estabelecimento, Auditoria } from '../types';

const Establishments: React.FC = () => {
  const { estabelecimentos, upsertEstabelecimento, usuarios, currentUser, agendamentos, auditorias } = useQualificaStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEstab, setEditingEstab] = useState<Estabelecimento | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [historyModalEstabId, setHistoryModalEstabId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const canModify = currentUser?.role === 'ADMIN_GERAL';

  const [formData, setFormData] = useState({
    nomeFantasia: '',
    razaoSocial: '',
    cnpj: '',
    endereco: '',
    nomeResponsavel: '', 
    emailResponsavel: '',
    ativo: true,
  });

  const filtered = useMemo(() => {
    if (!currentUser) return [];
    let baseList = estabelecimentos;
    if (currentUser.role !== 'ADMIN_GERAL') {
      if (currentUser.role === 'AUDITOR' || currentUser.role === 'INSPETOR') {
        const involvedIds = new Set([
          ...agendamentos.filter(a => a.auditorId === currentUser.id).map(a => a.estabelecimentoId),
          ...auditorias.filter(a => a.auditorId === currentUser.id).map(a => a.estabelecimentoId)
        ]);
        baseList = estabelecimentos.filter(e => involvedIds.has(e.id));
      } else if (currentUser.role === 'CLIENTE' || currentUser.role === 'GERENTE') {
        const assigned = currentUser.assignedCompanies || [];
        baseList = estabelecimentos.filter(e => assigned.includes(e.id) || e.clienteResponsavelId === currentUser.id);
      }
    }
    return baseList.filter(e => 
      e.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.cnpj?.includes(searchTerm)
    );
  }, [currentUser, estabelecimentos, searchTerm, agendamentos, auditorias]);

  const handleOpenModal = (estab?: Estabelecimento) => {
    if (!canModify) return;
    if (estab) {
      setEditingEstab(estab);
      setFormData({
        nomeFantasia: estab.nomeFantasia || '',
        razaoSocial: estab.razaoSocial || '',
        cnpj: estab.cnpj || '',
        endereco: estab.endereco || '',
        nomeResponsavel: estab.nomeResponsavel || '',
        emailResponsavel: estab.emailResponsavel || '',
        ativo: estab.ativo,
      });
    } else {
      setEditingEstab(null);
      setFormData({
        nomeFantasia: '',
        razaoSocial: '',
        cnpj: '',
        endereco: '',
        nomeResponsavel: '',
        emailResponsavel: '',
        ativo: true,
      });
    }
    setIsModalOpen(true);
  };

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSave = () => {
    if (!formData.nomeFantasia.trim()) {
      alert("O nome fantasia é obrigatório.");
      return;
    }
    if (!formData.nomeResponsavel.trim()) {
      alert("Informe o nome do responsável.");
      return;
    }
    if (!formData.emailResponsavel.trim() || !validateEmail(formData.emailResponsavel)) {
      alert("Informe um e-mail válido para o envio do convite.");
      return;
    }

    const updatedEstab: Estabelecimento = {
      id: editingEstab?.id || `estab-${Date.now()}`,
      nomeFantasia: formData.nomeFantasia,
      razaoSocial: formData.razaoSocial,
      cnpj: formData.cnpj,
      endereco: formData.endereco,
      clienteResponsavelId: editingEstab?.clienteResponsavelId || '', 
      nomeResponsavel: formData.nomeResponsavel,
      emailResponsavel: formData.emailResponsavel,
      ativo: formData.ativo,
      criadoEm: editingEstab?.criadoEm || new Date().toISOString(),
    };
    
    upsertEstabelecimento(updatedEstab);
    setIsModalOpen(false);
  };

  const selectedHistoryEstab = estabelecimentos.find(e => e.id === historyModalEstabId);
  const estabAudits = useMemo(() => {
    if (!historyModalEstabId) return [];
    return auditorias
      .filter(a => a.estabelecimentoId === historyModalEstabId && a.status === 'concluida')
      .sort((a, b) => new Date(b.finalizadaEm!).getTime() - new Date(a.finalizadaEm!).getTime());
  }, [historyModalEstabId, auditorias]);

  const auditScores = useMemo(() => {
    return estabAudits.map(a => {
      const yes = a.respostas.filter(r => r.resposta === 'sim').length;
      return a.respostas.length > 0 ? Math.round((yes / a.respostas.length) * 100) : 0;
    }).reverse();
  }, [estabAudits]);

  const handleGenerateReport = async (audit: Auditoria) => {
    setIsGenerating(audit.id);
    try {
      const { jsPDF } = (window as any).jspdf;
      const html2canvas = (window as any).html2canvas;
      await new Promise(resolve => setTimeout(resolve, 800));
      const element = document.getElementById(`report-template-estab-${audit.id}`);
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

  return (
    <div className="space-y-6 font-lato">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight font-poppins">Estabelecimentos</h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest font-poppins">
            {canModify ? 'Gerencie os locais de auditoria cadastrados' : 'Visualize os locais sob sua responsabilidade técnica'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400'}`}><List size={18} /></button>
          </div>
          {canModify && (
            <button onClick={() => handleOpenModal()} className="flex items-center justify-center gap-2 bg-accent text-white font-black py-2.5 px-5 rounded-xl shadow-lg uppercase tracking-widest text-xs font-poppins"><Plus size={18} /> NOVO ESTABELECIMENTO</button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
        <input 
          type="text" 
          placeholder="Buscar pelo nome, endereço ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-3 bg-white border border-gray-100 rounded-[16px] shadow-sm focus:ring-2 focus:ring-primary outline-none text-sm"
        />
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(estab => (
            <div key={estab.id} className={`bg-white p-5 rounded-[24px] shadow-lg border transition-all ${estab.ativo ? 'border-gray-50 hover:border-primary' : 'border-red-100 bg-red-50/20 opacity-90'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${estab.ativo ? 'bg-primary/5 text-primary' : 'bg-red-50 text-red-400'}`}><Building2 size={18} /></div>
                <div className="flex gap-2">
                  <button onClick={() => setHistoryModalEstabId(estab.id)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"><History size={14} /></button>
                  {canModify && (
                    <button onClick={() => handleOpenModal(estab)} className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-primary hover:text-white transition-all"><Edit2 size={14} /></button>
                  )}
                </div>
              </div>
              <h3 className="font-black text-base text-gray-800 mb-2 font-poppins truncate">{estab.nomeFantasia}</h3>
              <div className="space-y-2 text-[10px] text-gray-500 font-bold uppercase tracking-tight font-poppins">
                <div className="flex items-start gap-2"><MapPin size={12} className="text-gray-300 shrink-0 mt-0.5" /> <span className="line-clamp-1">{estab.endereco}</span></div>
                <div className="flex flex-col gap-1 pt-2">
                   <div className="flex items-center gap-2"><User size={12} className="text-primary" /> <span>{estab.nomeResponsavel || 'Não informado'}</span></div>
                   <div className="flex items-center gap-2 font-mono"><Mail size={12} className="text-primary" /> <span>{estab.emailResponsavel || 'N/A'}</span></div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className={`text-[8px] px-2 py-0.5 rounded-full border font-black uppercase tracking-widest ${estab.ativo ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{estab.ativo ? 'Ativo' : 'Inativo'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[24px] shadow-lg border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest font-poppins">Unidade</th>
                <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest font-poppins hidden md:table-cell">Responsável</th>
                <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center font-poppins">Status</th>
                <th className="p-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right font-poppins">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(estab => (
                <tr key={estab.id} className={`hover:bg-gray-50/50 transition-colors ${!estab.ativo ? 'bg-red-50/30' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${estab.ativo ? 'bg-primary/5 text-primary' : 'bg-red-50 text-red-400'}`}><Building2 size={16} /></div>
                      <div>
                        <p className="font-black text-gray-800 text-xs font-poppins">{estab.nomeFantasia}</p>
                        <p className="text-[9px] text-gray-400 font-bold font-poppins truncate md:max-w-xs">{estab.endereco}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-700">{estab.nomeResponsavel}</span>
                      <span className="text-[9px] text-gray-400">{estab.emailResponsavel}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${estab.ativo ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{estab.ativo ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setHistoryModalEstabId(estab.id)} className="p-1.5 text-blue-500 hover:text-blue-700" title="Ver Histórico"><History size={16} /></button>
                      {canModify && (
                        <button onClick={() => handleOpenModal(estab)} className="p-1.5 text-gray-400 hover:text-primary"><Edit2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {isModalOpen && canModify && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight font-poppins">{editingEstab ? 'Editar' : 'Novo'} Estabelecimento</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-gray-400"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-5 overflow-y-auto no-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 font-poppins">Nome Fantasia (Exibição Principal)</label>
                  <input type="text" value={formData.nomeFantasia} onChange={(e) => setFormData({...formData, nomeFantasia: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm" placeholder="Ex: Forester Burger Centro" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 font-poppins">Razão Social</label>
                  <input type="text" value={formData.razaoSocial} onChange={(e) => setFormData({...formData, razaoSocial: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm" placeholder="Razão Social completa" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 font-poppins">CNPJ</label>
                  <input type="text" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm font-mono" placeholder="00.000.000/0000-00" />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 font-poppins">Nome do Responsável</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                    <input type="text" value={formData.nomeResponsavel} onChange={(e) => setFormData({...formData, nomeResponsavel: e.target.value})} className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm" placeholder="Ex: João Silva" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 font-poppins">E-mail para Convite</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                    <input type="email" value={formData.emailResponsavel} onChange={(e) => setFormData({...formData, emailResponsavel: e.target.value})} className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm" placeholder="email@responsavel.com" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 font-poppins">Endereço Completo</label>
                  <input type="text" value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm" />
                </div>
                
                <div className="md:col-span-2 flex gap-3 mt-2">
                  <button type="button" onClick={() => setFormData({...formData, ativo: true})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${formData.ativo ? 'bg-green-600 border-green-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>ATIVO</button>
                  <button type="button" onClick={() => setFormData({...formData, ativo: false})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${!formData.ativo ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>INATIVO</button>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 justify-end shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-black text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest text-[10px] font-poppins">Cancelar</button>
              <button onClick={handleSave} className="px-8 py-3 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all uppercase tracking-widest text-[10px] font-poppins">Salvar Cadastro</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Establishments;
