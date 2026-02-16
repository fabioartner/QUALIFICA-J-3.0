
import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQualificaStore } from '../store';
import { QRCodeCanvas } from 'qrcode.react';
import { Printer, ArrowLeft, PlayCircle, ExternalLink, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';

const QRCodePanel: React.FC = () => {
  const { checklistId } = useParams();
  const { checklists, estabelecimentos, startAuditoria } = useQualificaStore();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const checklist = checklists.find(c => c.id === checklistId);
  const sampleEstab = estabelecimentos[0]; 

  if (!checklist) return <div className="p-8 text-center font-bold text-primary">Checklist não encontrado.</div>;

  const handleSimulateScan = (sectorId: string) => {
    const audit = startAuditoria(sampleEstab.id, checklist.id);
    navigate(`/inspecao/${audit.id}?sector=${sectorId}`);
  };

  const handlePrint = async () => {
    if (!printContainerRef.current) return;
    
    setIsGenerating(true);
    try {
      // Acessando jsPDF e html2canvas globais carregados via CDN no index.html
      const { jsPDF } = (window as any).jspdf;
      const html2canvas = (window as any).html2canvas;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pages = printContainerRef.current.children;
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) doc.addPage();

        const pageElement = pages[i] as HTMLElement;
        
        // Renderizar a página em um canvas de alta resolução (escala 3 para qualidade de impressão)
        const canvas = await html2canvas(pageElement, {
          scale: 3, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794, // Aproximadamente 210mm em 96dpi
          windowHeight: 1123 // Aproximadamente 297mm em 96dpi
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      const fileName = `QR_Codes_${checklist.nome.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Houve um erro técnico ao gerar o PDF. Verifique se o navegador possui permissão para downloads e tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Agrupar setores de 9 em 9 para o layout de grade 3x3 das páginas A4
  const sectorGroups = [];
  for (let i = 0; i < checklist.setores.length; i += 9) {
    sectorGroups.push(checklist.setores.slice(i, i + 9));
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-lato">
      {/* HEADER NO-PRINT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/checklists')}
            className="p-3 bg-white hover:bg-gray-50 rounded-2xl text-gray-400 shadow-sm border border-gray-100 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight font-poppins">Painel de QR Codes</h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest font-poppins">{checklist.nome}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all text-xs uppercase tracking-widest font-poppins ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" /> PROCESSANDO PDF...
              </>
            ) : (
              <>
                <Printer size={18} /> IMPRIMIR PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* ÁREA DE TESTE (WEB) */}
      <div className="p-6 bg-orange-50 border border-orange-100 rounded-[24px] text-orange-800 flex items-center gap-4 animate-in fade-in duration-500">
        <div className="bg-orange-100 p-3 rounded-2xl"><PlayCircle size={24} className="text-accent" /></div>
        <div>
          <p className="text-sm font-black uppercase tracking-tight font-poppins">DICA DE OPERAÇÃO</p>
          <p className="text-xs font-medium opacity-80">Use o botão <strong>Simular Scan</strong> para testar o checklist sem precisar imprimir fisicamente.</p>
        </div>
      </div>

      {/* GRADE DE VISUALIZAÇÃO EM TELA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {checklist.setores.map((sector) => {
          const qrValue = `${window.location.origin}/#/inspecao/new?estabelecimento=${sampleEstab.id}&checklist=${checklist.id}&setor=${sector.id}&codigo=${sector.codigo4Digitos}`;
          
          return (
            <div 
              key={sector.id} 
              className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/30 border border-gray-50 text-center flex flex-col items-center group hover:border-primary transition-all relative"
            >
              <Logo variant="dark" iconSize={24} textSize="text-lg" className="mb-6 justify-center" />
              
              <div className="mb-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 font-poppins">Setor da Unidade</p>
                <h3 className="text-xl font-black text-gray-800 mb-3 tracking-tighter font-poppins truncate w-full px-2">{sector.nome}</h3>
                <div className="bg-gray-50 px-5 py-2 rounded-xl inline-block border border-gray-100">
                  <span className="text-xl font-black text-primary font-mono tracking-widest">{sector.codigo4Digitos}</span>
                </div>
              </div>

              <div className="p-4 bg-white border-2 border-primary rounded-[30px] shadow-sm mb-8 group-hover:scale-105 transition-transform">
                <QRCodeCanvas 
                  value={qrValue} 
                  size={120} 
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="mt-auto w-full pt-6 border-t border-gray-50 flex gap-2">
                <button 
                  onClick={() => handleSimulateScan(sector.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-accent/90 transition-all shadow-md"
                >
                  <PlayCircle size={14} /> SIMULAR SCAN
                </button>
                <a 
                  href={qrValue} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-primary hover:text-white transition-all border border-gray-100"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* TEMPLATE DE IMPRESSÃO OCULTO (FORMATO A4 EXATO) */}
      <div 
        ref={printContainerRef}
        className="fixed -left-[10000px] top-0 pointer-events-none"
      >
        {sectorGroups.map((group, pageIndex) => (
          <div 
            key={`page-${pageIndex}`}
            className="bg-white p-[15mm] grid grid-cols-3 grid-rows-3 gap-[10mm]"
            style={{ 
                width: '210mm', 
                height: '297mm', 
                boxSizing: 'border-box',
                gridTemplateRows: 'repeat(3, 1fr)'
            }}
          >
            {group.map((sector) => {
              const qrValue = `${window.location.origin}/#/inspecao/new?estabelecimento=${sampleEstab.id}&checklist=${checklist.id}&setor=${sector.id}&codigo=${sector.codigo4Digitos}`;
              
              return (
                <div 
                  key={`pdf-${sector.id}`} 
                  className="flex flex-col items-center justify-center text-center p-6 border-[1mm] border-primary rounded-[12mm] bg-white h-full box-border"
                >
                  <div className="mb-4 flex flex-col items-center scale-90">
                    <Logo variant="dark" iconSize={24} textSize="text-lg" className="justify-center" />
                    <div className="w-16 h-[0.8mm] bg-accent mx-auto mt-1 rounded-full"></div>
                  </div>

                  <div className="mb-4">
                    <p className="text-[7pt] font-black text-gray-400 uppercase tracking-widest mb-1 font-poppins">Setor de Auditoria</p>
                    <h3 className="text-[12pt] font-black text-gray-800 mb-2 leading-tight font-poppins">{sector.nome}</h3>
                    <div className="bg-gray-100 px-4 py-1.5 rounded-lg inline-block border border-gray-200">
                      <span className="text-[14pt] font-black text-primary font-mono tracking-widest">{sector.codigo4Digitos}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-white border-[0.5mm] border-primary rounded-2xl mb-4">
                    <QRCodeCanvas 
                      value={qrValue} 
                      size={100} 
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div className="mt-auto pt-4 text-[6pt] text-gray-300 font-black uppercase tracking-widest border-t border-gray-50 w-full font-poppins">
                    Qualifica Já • Auditoria Digital
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QRCodePanel;
