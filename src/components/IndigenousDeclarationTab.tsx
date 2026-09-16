import React, { useState } from 'react';
import { 
  Feather, Printer, Copy, Check, RotateCcw, UserCheck, 
  FileText, Info, Eye, ExternalLink, Download, Loader2, FileDown,
  Building, Image, EyeOff, Trash2, MessageCircle, Send, Phone, X
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Associate, EntityConfig } from '../types';

interface IndigenousDeclarationTabProps {
  associates?: Associate[];
  clients?: Associate[];
  entityConfig: EntityConfig | null;
}

export interface IssuedDeclaration {
  id: string;
  code: string;
  personName: string;
  cpf: string;
  ethnicity: string;
  village: string;
  issuedAt: string;
  phone?: string;
  fullText?: string;
}

export default function IndigenousDeclarationTab({
  associates = [],
  clients = [],
  entityConfig
}: IndigenousDeclarationTabProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  // Visibility toggles for Logo, Association Data & Footer
  const [showLogo, setShowLogo] = useState(false);
  const [showEntityInfo, setShowEntityInfo] = useState(false);
  const [showFooterNote, setShowFooterNote] = useState(false);

  // Document code
  const currentYear = new Date().getFullYear();
  const [docNumber, setDocNumber] = useState(`DEC-PANK-${currentYear}/001`);

  // Indigenous Person Fields
  const [personName, setPersonName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherName, setFatherName] = useState('');
  
  // Community & Land Variables
  const [ethnicity, setEthnicity] = useState('PANKARARÉ');
  const [village, setVillage] = useState('Aldeia Serrota');
  const [indigenousLand, setIndigenousLand] = useState('T.I. PANKARARÉ');
  const [originCityUf, setOriginCityUf] = useState('Glória/BA');
  const [farmArea, setFarmArea] = useState('2,5'); // hectares
  const [issueCityUf, setIssueCityUf] = useState('Glória/BA');
  
  // Custom Date
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const monthName = monthNames[today.getMonth()];
  const [customDay, setCustomDay] = useState(day);
  const [customMonth, setCustomMonth] = useState(monthName);
  const [customYear, setCustomYear] = useState(String(currentYear));

  // Signatories (Template defaults)
  // Signatory 1: Cacique
  const [sig1Name, setSig1Name] = useState('GENESIA MARIA DE OLIVEIRA PAIXÃO');
  const [sig1Role, setSig1Role] = useState('CACIQUE');
  const [sig1Cpf, setSig1Cpf] = useState('003.052.825-90');

  // Signatory 2: Liderança 1
  const [sig2Name, setSig2Name] = useState('GILMAR PAIXÃO DE JESUS');
  const [sig2Role, setSig2Role] = useState('LIDERANÇA');
  const [sig2Cpf, setSig2Cpf] = useState('004.105.805-46');

  // Signatory 3: Liderança 2
  const [sig3Name, setSig3Name] = useState('GAEL OLIVEIRA DE JESUS');
  const [sig3Role, setSig3Role] = useState('LIDERANÇA');
  const [sig3Cpf, setSig3Cpf] = useState('098.682.975-75');

  // WhatsApp Send States
  const [recipientPhone, setRecipientPhone] = useState('');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [whatsAppCopied, setWhatsAppCopied] = useState(false);
  const [selectedHistoryForWhatsApp, setSelectedHistoryForWhatsApp] = useState<IssuedDeclaration | null>(null);

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    id?: string;
    name?: string;
  }>({ isOpen: false, type: 'single' });

  // History
  const [history, setHistory] = useState<IssuedDeclaration[]>(() => {
    try {
      const saved = localStorage.getItem('indigenous_declarations_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Handle selecting an associate or client
  const handleSelectPerson = (id: string) => {
    setSelectedPersonId(id);
    if (!id) return;

    const allPeople = [...associates, ...clients];
    const person = allPeople.find(p => p.id === id);
    if (person) {
      setPersonName(person.name || '');
      setCpf(person.cpf || '');
      setMotherName(person.motherName || '');
      setFatherName(person.fatherNotDeclared ? 'Não declarado' : (person.fatherName || ''));
      if (person.phone) {
        setRecipientPhone(person.phone);
      } else {
        setRecipientPhone('');
      }
      if (person.birthDate) {
        try {
          const parts = person.birthDate.split('-');
          if (parts.length === 3) {
            setBirthDate(`${parts[2]}/${parts[1]}/${parts[0]}`);
          } else {
            setBirthDate(person.birthDate);
          }
        } catch {
          setBirthDate(person.birthDate);
        }
      }
    }
  };

  const resetToDefaultTemplate = () => {
    setSelectedPersonId('');
    setPersonName('');
    setCpf('');
    setBirthDate('');
    setMotherName('');
    setFatherName('');
    setRecipientPhone('');
    setEthnicity('PANKARARÉ');
    setVillage('Aldeia Serrota');
    setIndigenousLand('T.I. PANKARARÉ');
    setOriginCityUf('Glória/BA');
    setFarmArea('2,5');
    setIssueCityUf('Glória/BA');
    setSig1Name('GENESIA MARIA DE OLIVEIRA PAIXÃO');
    setSig1Role('CACIQUE');
    setSig1Cpf('003.052.825-90');
    setSig2Name('GILMAR PAIXÃO DE JESUS');
    setSig2Role('LIDERANÇA');
    setSig2Cpf('004.105.805-46');
    setSig3Name('GAEL OLIVEIRA DE JESUS');
    setSig3Role('LIDERANÇA');
    setSig3Cpf('098.682.975-75');
    setShowLogo(false);
    setShowEntityInfo(false);
    setShowFooterNote(false);
    setDocNumber(`DEC-PANK-${currentYear}/${String(history.length + 1).padStart(3, '0')}`);
  };

  // Generate plain text according to user template and visibility settings
  const getDeclarationPlainText = () => {
    let headerText = '';
    if (showEntityInfo && entityConfig?.name) {
      headerText = `${entityConfig.name}\n${entityConfig.cnpj ? `CNPJ: ${entityConfig.cnpj}${entityConfig.address ? ` - ${entityConfig.address}` : ''}\n` : ''}\n`;
    }
    return `${headerText}DECLARAÇÃO  PANKARARÉ – T.I. PANKARARÉ


DECLARAMOS, para os devidos fins, na condição de cacique, que a pessoa identificada nesta declaração como ${personName ? personName.toUpperCase() : '____________________________________'}, CPF n° ${cpf || '____________________'}, nascido(a) em ${birthDate || 'XX/XX/XXXX'}, filho(a) de ${motherName || 'XXXXXXXXXXXXXXXXX'} e ${fatherName || 'XXXXXXXXXXXXXXXX'}, onde o(a) mesmo(a) trata-se de indígena da etnia ${ethnicity}, é residente num imóvel dentro da ${village}, Território da etnia ${ethnicity}, originária do Município de ${originCityUf}, e assumo a responsabilidade, civil e criminal, pela veracidade da presente declaração, sob as penas da Lei, desta forma abaixo assino como Cacique.
DECLARAMOS, ainda que cabe a minha pessoa, como cacique, a atribuição exclusiva para o reconhecimento de índios, ante a capacidade legal dos seus representantes tribais e de acordo com os costumes indígenas, nos termos dos arts.215. § 1º e incisivo V, 216 e 232 da Constituição Federal, das disposições da Lei Federal nº 6.001, de 19.12.1973 – Estatuto do Índio e da Convenção nº 169 a Organização Internacional do Trabalho – OIT.
DECLARAMOS que o(a) referido(a) indígena trabalha na ${village} na agricultura familiar com atividades agropecuárias de subsistência, numa área de ${farmArea} hectares, dentro da Terra Indígena Pankararé homologada pelo Decreto de 5 de Janeiro de 1996, (Disponível em https://www2.camara.leg.br/legin/fed/decret_sn/1996/decreto-35413-5-janeiro-1996-536187-publicacaooriginal-26447-pe.html), em uma área com superfície de 29.597,3322ha (vinte e nove mil, quinhentos e noventa e sete hectares, trinta e três ares e vinte e dois centiares). 
DECLARAMOS, finalmente, que a FUNAI, através de seu representante local ou regional, cabe a assistência ou assessoramento aos índios e suas comunidades e o encaminhamento de seus pleitos, não competindo o reconhecimento, direto ou indireto, da condição de indígena da pessoa de que trata esta declaração ou sua complementação.
          ${issueCityUf}, ${customDay} de ${customMonth} de ${customYear}.

Nome legível: ${sig1Name}                                        Função: ${sig1Role}
CPF: ${sig1Cpf}             
Assinatura: ____________________________________________________

Nome legível: ${sig2Name}                                                            Função: ${sig2Role}
CPF: ${sig2Cpf} 
Assinatura: ____________________________________________________

Nome legível: ${sig3Name}                                                              Função: ${sig3Role}
CPF: ${sig3Cpf}           
Assinatura: ____________________________________________________`;
  };

  // Generate formatted WhatsApp message (with markdown bolding and emojis)
  const getWhatsAppFormattedMessage = () => {
    let text = `📜 *DECLARAÇÃO ${ethnicity.toUpperCase()} – ${indigenousLand.toUpperCase()}*\n\n`;

    if (showEntityInfo && entityConfig?.name) {
      text += `🏢 *${entityConfig.name}*\n${entityConfig.cnpj ? `CNPJ: ${entityConfig.cnpj}\n` : ''}\n`;
    }

    text += `*DECLARAMOS*, para os devidos fins, na condição de cacique, que a pessoa identificada nesta declaração como *${personName ? personName.toUpperCase() : '_______________________'}*, inscrito(a) no CPF n° *${cpf || '_________________'}*, nascido(a) em *${birthDate || 'XX/XX/XXXX'}*, filho(a) de *${motherName || 'XXXXXXXXXXXXXXXXX'}* e *${fatherName || 'XXXXXXXXXXXXXXXX'}*, onde o(a) mesmo(a) trata-se de indígena da etnia *${ethnicity}*, é residente num imóvel dentro da *${village}*, Território da etnia *${ethnicity}*, originária do Município de *${originCityUf}*, e assumo a responsabilidade, civil e criminal, pela veracidade da presente declaração, sob as penas da Lei, desta forma abaixo assino como Cacique.\n\n`;

    text += `*DECLARAMOS*, ainda que cabe a minha pessoa, como cacique, a atribuição exclusiva para o reconhecimento de índios, ante a capacidade legal dos seus representantes tribais e de acordo com os costumes indígenas, nos termos dos arts.215. § 1º e incisivo V, 216 e 232 da Constituição Federal, das disposições da Lei Federal nº 6.001, de 19.12.1973 – Estatuto do Índio e da Convenção nº 169 a Organização Internacional do Trabalho – OIT.\n\n`;

    text += `*DECLARAMOS* que o(a) referido(a) indígena trabalha na ${village} na agricultura familiar com atividades agropecuárias de subsistência, numa área de ${farmArea} hectares, dentro da Terra Indígena Pankararé homologada pelo Decreto de 5 de Janeiro de 1996, (Disponível em https://www2.camara.leg.br/legin/fed/decret_sn/1996/decreto-35413-5-janeiro-1996-536187-publicacaooriginal-26447-pe.html), em uma área com superfície de 29.597,3322ha (vinte e nove mil, quinhentos e noventa e sete hectares, trinta e três ares e vinte e dois centiares).\n\n`;

    text += `*DECLARAMOS*, finalmente, que a FUNAI, através de seu representante local ou regional, cabe a assistência ou assessoramento aos índios e suas comunidades e o encaminhamento de seus pleitos, não competindo o reconhecimento, direto ou indireto, da condição de indígena da pessoa de que trata esta declaração ou sua complementação.\n\n`;

    text += `📍 *${issueCityUf}, ${customDay} de ${customMonth} de ${customYear}*\n\n`;

    text += `✍️ *ASSINANTES OFICIAIS:*\n`;
    text += `• *${sig1Name}* (${sig1Role}) - CPF: ${sig1Cpf}\n`;
    text += `• *${sig2Name}* (${sig2Role}) - CPF: ${sig2Cpf}\n`;
    text += `• *${sig3Name}* (${sig3Role}) - CPF: ${sig3Cpf}\n`;

    if (docNumber) {
      text += `\n🔢 *Registro Oficial:* ${docNumber}`;
    }

    return text;
  };

  const handleSaveToHistory = (customPhone?: string) => {
    const newRecord: IssuedDeclaration = {
      id: `dec-${Date.now()}`,
      code: docNumber,
      personName: personName || 'Não identificado',
      cpf: cpf || 'Não informado',
      ethnicity,
      village,
      issuedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      phone: customPhone || recipientPhone,
      fullText: getWhatsAppFormattedMessage()
    };

    const updated = [newRecord, ...history];
    setHistory(updated);
    try {
      localStorage.setItem('indigenous_declarations_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDeleteHistoryItem = (id: string, name?: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'single',
      id,
      name
    });
  };

  const handleClearHistory = () => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'all'
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.type === 'single' && deleteConfirmation.id) {
      const updated = history.filter(item => item.id !== deleteConfirmation.id);
      setHistory(updated);
      try {
        localStorage.setItem('indigenous_declarations_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
    } else if (deleteConfirmation.type === 'all') {
      setHistory([]);
      try {
        localStorage.removeItem('indigenous_declarations_history');
      } catch {
        // ignore
      }
    }
    setDeleteConfirmation({ isOpen: false, type: 'single' });
  };

  const handleOpenWhatsAppModal = () => {
    setSelectedHistoryForWhatsApp(null);
    setWhatsAppMessage(getWhatsAppFormattedMessage());
    setIsWhatsAppModalOpen(true);
  };

  const handleOpenWhatsAppForHistoryItem = (item: IssuedDeclaration) => {
    setSelectedHistoryForWhatsApp(item);
    setRecipientPhone(item.phone || '');
    const msg = item.fullText || `📜 *DECLARAÇÃO ${item.ethnicity?.toUpperCase() || 'PANKARARÉ'}*\n\nInformamos que foi emitida a declaração oficial para *${item.personName}*, CPF: *${item.cpf}*, residente na ${item.village}.\n\nEmitida em: ${item.issuedAt}\nRegistro: ${item.code}`;
    setWhatsAppMessage(msg);
    setIsWhatsAppModalOpen(true);
  };

  const handleExecuteSendWhatsApp = (phoneToUse?: string, msgToUse?: string) => {
    const rawPhone = phoneToUse !== undefined ? phoneToUse : recipientPhone;
    const finalMsg = msgToUse !== undefined ? msgToUse : whatsAppMessage;

    // Save to history if current doc
    if (!selectedHistoryForWhatsApp) {
      handleSaveToHistory(rawPhone);
    }

    // Clean phone number (digits only)
    const rawDigits = rawPhone.replace(/\D/g, '');
    let finalPhone = rawDigits;
    if (rawDigits.length === 10 || rawDigits.length === 11) {
      finalPhone = `55${rawDigits}`;
    }

    let url = '';
    if (finalPhone) {
      url = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(finalMsg)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(finalMsg)}`;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setWhatsAppCopied(true);
    setTimeout(() => setWhatsAppCopied(false), 2500);
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(getDeclarationPlainText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    handleSaveToHistory();
    const text = getDeclarationPlainText();
    const sanitizedName = personName
      ? personName.trim().replace(/[^a-zA-Z0-9À-ÿ_-]/g, '_')
      : 'Indigena';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Declaracao_Pankarare_${sanitizedName}.txt`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  };

  const handleDownloadPdf = async () => {
    handleSaveToHistory();
    const elem = document.getElementById('printable-indigenous-declaration');
    if (!elem) {
      alert('Elemento da declaração não encontrado.');
      return;
    }

    setIsGeneratingPdf(true);
    const sanitizedName = personName
      ? personName.trim().replace(/[^a-zA-Z0-9À-ÿ_-]/g, '_')
      : 'Indigena';
    const fileName = `Declaracao_Pankarare_${sanitizedName}.pdf`;

    try {
      // Create high-resolution canvas matching standard A4 proportions (210mm x 297mm)
      const canvas = await html2canvas(elem, {
        scale: 2, // 2x scale for sharp, print-grade typography
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794, // Standard A4 width in px at 96 DPI
        onclone: (clonedDoc) => {
          const clonedElem = clonedDoc.getElementById('printable-indigenous-declaration');
          if (clonedElem) {
            clonedElem.style.width = '794px';
            clonedElem.style.maxWidth = '794px';
            clonedElem.style.height = '1123px';
            clonedElem.style.maxHeight = '1123px';
            clonedElem.style.boxSizing = 'border-box';
            clonedElem.style.padding = '44px 54px 38px 54px';
            clonedElem.style.margin = '0';
            clonedElem.style.borderRadius = '0';
            clonedElem.style.boxShadow = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Guarantee exactly 1 single A4 page with proportional scaling
      const ratio = canvas.width / canvas.height;
      let imgWidth = pdfWidth;
      let imgHeight = imgWidth / ratio;

      if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = imgHeight * ratio;
      }

      const posX = (pdfWidth - imgWidth) / 2;
      const posY = 0;

      pdf.addImage(imgData, 'JPEG', posX, posY, imgWidth, imgHeight);

      // Download trigger: Blob URL
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      }, 1500);

      // Native fallback
      try {
        pdf.save(fileName);
      } catch {
        // Handled by blob
      }
    } catch (err) {
      console.error('Erro ao gerar PDF com html2canvas:', err);
      // Fallback to print
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    handleSaveToHistory();
    const elem = document.getElementById('printable-indigenous-declaration');
    if (!elem) {
      window.print();
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>DECLARAÇÃO PANKARARÉ – T.I. PANKARARÉ - ${personName || 'Oficial'}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page { 
                  size: A4 portrait; 
                  margin: 8mm 12mm 6mm 12mm; 
                }
                *, *:before, *:after {
                  box-sizing: border-box !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                html, body {
                  font-family: 'Times New Roman', Times, serif, system-ui;
                  color: #000;
                  background: #fff;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  overflow: hidden !important;
                }
                #printable-indigenous-declaration {
                  width: 100% !important;
                  max-width: 100% !important;
                  height: 100% !important;
                  max-height: 280mm !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                  page-break-after: avoid !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              </style>
            </head>
            <body>
              ${elem.innerHTML}
              <script>
                window.onload = function() {
                  window.focus();
                  window.print();
                  setTimeout(function() { window.close(); }, 800);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-[#161616] to-[#121212] border border-emerald-500/20 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
              <Feather className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Declaração Pankararé – T.I. Pankararé
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Modelo Oficial Configurado
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                Emissão oficial com reconhecimento tradicional pelo Cacique e Lideranças da Aldeia Serrota.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={resetToDefaultTemplate}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-medium transition-colors border border-white/10 flex items-center gap-1.5"
              title="Restaurar valores padrão do modelo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar
            </button>
            <button
              onClick={handleCopyText}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-medium transition-colors border border-white/10 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <button
              onClick={handleDownloadTxt}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-medium transition-colors border border-white/10 flex items-center gap-1.5"
              title="Baixar em formato de texto (.txt)"
            >
              <FileDown className="w-3.5 h-3.5" />
              Baixar TXT
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-medium transition-colors border border-white/15 flex items-center gap-1.5"
              title="Imprimir ou salvar via diálogo do navegador"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer"
              title="Baixar diretamente o arquivo PDF em formato A4"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isGeneratingPdf ? 'Gerando PDF A4...' : 'Baixar Declaração (PDF A4)'}
            </button>
            <button
              onClick={handleOpenWhatsAppModal}
              className="px-3.5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-green-950/40 transition-all flex items-center gap-2 cursor-pointer"
              title="Enviar texto e documento via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Model notice banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-200/90 leading-relaxed">
            <strong className="text-emerald-300 font-semibold block mb-0.5">
              Modelo Pankararé Oficial Ativo:
            </strong>
            Declaração com base legal nos arts. 215, 216 e 232 da Constituição Federal, Lei nº 6.001/1973 (Estatuto do Índio), Convenção 169 da OIT e Decreto de 05/01/1996 da T.I. Pankararé. Assinaturas predefinidas da Cacique Genesia Maria de Oliveira Paixão e das lideranças Gilmar Paixão de Jesus e Gael Oliveira de Jesus.
          </div>
        </div>
      </div>

      {/* Main Grid: Form Controls (Left) & Document Preview (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Form Setup */}
        <div className="xl:col-span-5 space-y-4">
          
          {/* Quick Select from Associates/Clients */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Preenchimento Rápido
              </h3>
              <span className="text-[11px] text-gray-400">Associados / Clientes</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Puxar dados do cadastro (opcional)
              </label>
              <select
                value={selectedPersonId}
                onChange={(e) => handleSelectPerson(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Preenchimento Manual ou Selecionar --</option>
                <optgroup label="Associados Cadastrados">
                  {associates.map((assoc) => (
                    <option key={assoc.id} value={assoc.id}>
                      {assoc.name} {assoc.cpf ? `(${assoc.cpf})` : ''} - Matrícula {assoc.matricula || assoc.id}
                    </option>
                  ))}
                </optgroup>
                {clients.length > 0 && (
                  <optgroup label="Clientes Cadastrados">
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.cpf ? `(${client.cpf})` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

          </div>

          {/* Visibilidade do Cabeçalho & Dados da Associação */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                Cabeçalho & Associação
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowLogo(false);
                    setShowEntityInfo(false);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  title="Ocultar ambos da folha"
                >
                  Ocultar Ambos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogo(true);
                    setShowEntityInfo(true);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  title="Exibir ambos na folha"
                >
                  Exibir Ambos
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Permite ocultar ou exibir o logotipo e os dados cadastrais da associação (Nome, CNPJ e endereço) no topo da folha oficial.
            </p>

            <div className="space-y-2 pt-1">
              {/* Toggle Logo */}
              <div className="flex items-center justify-between p-2.5 bg-[#1a1a1a] rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <Image className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Logotipo / Brasão</span>
                    <span className="text-[10px] text-gray-400">
                      {showLogo ? 'Visível na folha' : 'Oculto (não é impresso)'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogo(!showLogo)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    showLogo 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {showLogo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {showLogo ? 'Exibindo' : 'Oculto'}
                </button>
              </div>

              {/* Toggle Dados da Associação */}
              <div className="flex items-center justify-between p-2.5 bg-[#1a1a1a] rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Dados da Associação</span>
                    <span className="text-[10px] text-gray-400">
                      {showEntityInfo ? 'Nome, CNPJ e endereço visíveis' : 'Ocultos (não são impressos)'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEntityInfo(!showEntityInfo)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    showEntityInfo 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {showEntityInfo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {showEntityInfo ? 'Exibindo' : 'Oculto'}
                </button>
              </div>

              {/* Toggle Rodapé Informativo */}
              <div className="flex items-center justify-between p-2.5 bg-[#1a1a1a] rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-white block">Rodapé da Folha</span>
                    <span className="text-[10px] text-gray-400">
                      {showFooterNote ? 'Nota de rodapé visível' : 'Oculto na folha'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFooterNote(!showFooterNote)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    showFooterNote 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {showFooterNote ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {showFooterNote ? 'Exibindo' : 'Oculto'}
                </button>
              </div>
            </div>
          </div>

          {/* Dados da Pessoa Indígena */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Feather className="w-4 h-4 text-emerald-400" />
              Dados do(a) Indígena
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nome Completo <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Nome do(a) indígena"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Nome da Mãe
                  </label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="Nome completo da mãe"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Nome do Pai
                  </label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Nome completo do pai"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dados Territoriais e Agropecuários */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Feather className="w-4 h-4 text-emerald-400" />
              Território e Agricultura Familiar
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Etnia
                  </label>
                  <input
                    type="text"
                    value={ethnicity}
                    onChange={(e) => setEthnicity(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Aldeia / Comunidade
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Terra Indígena
                  </label>
                  <input
                    type="text"
                    value={indigenousLand}
                    onChange={(e) => setIndigenousLand(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Área (ha)
                  </label>
                  <input
                    type="text"
                    value={farmArea}
                    onChange={(e) => setFarmArea(e.target.value)}
                    placeholder="2,5"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Município de Origem
                  </label>
                  <input
                    type="text"
                    value={originCityUf}
                    onChange={(e) => setOriginCityUf(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Cidade de Emissão
                  </label>
                  <input
                    type="text"
                    value={issueCityUf}
                    onChange={(e) => setIssueCityUf(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Data da Declaração */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Data da Declaração
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={customDay}
                    onChange={(e) => setCustomDay(e.target.value)}
                    placeholder="Dia"
                    className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                  />
                  <input
                    type="text"
                    value={customMonth}
                    onChange={(e) => setCustomMonth(e.target.value)}
                    placeholder="Mês"
                    className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                  />
                  <input
                    type="text"
                    value={customYear}
                    onChange={(e) => setCustomYear(e.target.value)}
                    placeholder="Ano"
                    className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Signatários Oficiais */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Signatários do Modelo Oficial
            </h3>

            {/* Cacique */}
            <div className="p-3 bg-[#1a1a1a] rounded-xl border border-white/5 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Signatário 1 (Cacique)
              </span>
              <input
                type="text"
                value={sig1Name}
                onChange={(e) => setSig1Name(e.target.value)}
                placeholder="Nome da Cacique"
                className="w-full bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={sig1Role}
                  onChange={(e) => setSig1Role(e.target.value)}
                  placeholder="Função"
                  className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={sig1Cpf}
                  onChange={(e) => setSig1Cpf(e.target.value)}
                  placeholder="CPF"
                  className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Liderança 1 */}
            <div className="p-3 bg-[#1a1a1a] rounded-xl border border-white/5 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Signatário 2 (Liderança)
              </span>
              <input
                type="text"
                value={sig2Name}
                onChange={(e) => setSig2Name(e.target.value)}
                placeholder="Nome da Liderança"
                className="w-full bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={sig2Role}
                  onChange={(e) => setSig2Role(e.target.value)}
                  placeholder="Função"
                  className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={sig2Cpf}
                  onChange={(e) => setSig2Cpf(e.target.value)}
                  placeholder="CPF"
                  className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Liderança 2 */}
            <div className="p-3 bg-[#1a1a1a] rounded-xl border border-white/5 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Signatário 3 (Liderança)
              </span>
              <input
                type="text"
                value={sig3Name}
                onChange={(e) => setSig3Name(e.target.value)}
                placeholder="Nome da Liderança"
                className="w-full bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={sig3Role}
                  onChange={(e) => setSig3Role(e.target.value)}
                  placeholder="Função"
                  className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={sig3Cpf}
                  onChange={(e) => setSig3Cpf(e.target.value)}
                  placeholder="CPF"
                  className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Printable Preview (A4 Formatted) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                Folha Oficial A4 (210 × 297 mm)
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowLogo(!showLogo)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                    showLogo 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                  title="Clique para alternar o logotipo"
                >
                  {showLogo ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  Logo: {showLogo ? 'Visível' : 'Oculto'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEntityInfo(!showEntityInfo)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                    showEntityInfo 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                  title="Clique para alternar os dados da associação"
                >
                  {showEntityInfo ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  Associação: {showEntityInfo ? 'Visível' : 'Oculta'}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenWhatsAppModal}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold shadow transition-all flex items-center gap-1.5 cursor-pointer"
                title="Enviar Declaração via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {isGeneratingPdf ? 'Gerando...' : 'Baixar PDF'}
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </button>
            </div>
          </div>

          {/* Printable Document Box - Strict A4 dimensions (1 Page Guaranteed) */}
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-2 sm:p-6 overflow-x-auto shadow-2xl flex justify-center">
            <div
              id="printable-indigenous-declaration"
              className="bg-white text-gray-950 shadow-2xl flex flex-col justify-between select-text"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                width: '210mm',
                height: '297mm',
                maxHeight: '297mm',
                maxWidth: '210mm',
                padding: '20mm 22mm 16mm 22mm',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              {/* Main Content Area */}
              <div>
                {/* Optional Entity Timbre / Logo & Association Details */}
                {(showLogo || showEntityInfo) && (
                  <div className="text-center border-b border-gray-400 pb-3 mb-6">
                    {showLogo && entityConfig?.logo && (
                      <img 
                        src={entityConfig.logo} 
                        alt="Logo da Entidade" 
                        className="h-12 mx-auto mb-1.5 object-contain"
                      />
                    )}
                    {showEntityInfo && (
                      <>
                        {entityConfig?.name && (
                          <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-900 leading-snug">
                            {entityConfig.name}
                          </h3>
                        )}
                        {entityConfig?.cnpj && (
                          <p className="text-[9pt] text-gray-700 leading-snug mt-0.5">
                            CNPJ: {entityConfig.cnpj} {entityConfig.address ? `• ${entityConfig.address}` : ''}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Title with lines above and below (fitted to the text) */}
                <div className="mt-4 mb-8 text-center">
                  <div className="inline-block border-t border-b border-black px-10 py-2">
                    <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide text-gray-950 leading-tight">
                      DECLARAÇÃO {ethnicity.toUpperCase()} – {indigenousLand.toUpperCase()}
                    </h1>
                  </div>
                </div>

                {/* Body Paragraphs - Generous spacing between paragraphs */}
                <div className="space-y-5 text-justify leading-[1.62] text-[11.5pt] text-gray-950">
                  <p className="indent-10">
                    DECLARAMOS, para os devidos fins, na condição de cacique, que a pessoa identificada nesta declaração como{' '}
                    <strong className="uppercase">{personName || '________________________________________'}</strong>, CPF n°{' '}
                    <strong>{cpf || '____________________'}</strong>, nascido(a) em{' '}
                    <strong>{birthDate || 'XX/XX/XXXX'}</strong>, filho(a) de{' '}
                    <strong className="uppercase">{motherName || 'XXXXXXXXXXXXXXXXX'}</strong> e{' '}
                    <strong className="uppercase">{fatherName || 'XXXXXXXXXXXXXXXX'}</strong>, onde o(a) mesmo(a) trata-se de indígena da etnia{' '}
                    <strong>{ethnicity}</strong>, é residente num imóvel dentro da{' '}
                    <strong>{village}</strong>, Território da etnia <strong>{ethnicity}</strong>, originária do Município de{' '}
                    <strong>{originCityUf}</strong>, e assumo a responsabilidade, civil e criminal, pela veracidade da presente declaração, sob as penas da Lei, desta forma abaixo assino como Cacique.
                  </p>

                  <p className="indent-10">
                    DECLARAMOS, ainda que cabe a minha pessoa, como cacique, a atribuição exclusiva para o reconhecimento de índios, ante a capacidade legal dos seus representantes tribais e de acordo com os costumes indígenas, nos termos dos arts. 215, § 1º, V, 216 e 232 da Constituição Federal, das disposições da Lei Federal nº 6.001, de 19.12.1973 – Estatuto do Índio e da Convenção nº 169 da Organização Internacional do Trabalho – OIT.
                  </p>

                  <p className="indent-10">
                    DECLARAMOS que o(a) referido(a) indígena trabalha na <strong>{village}</strong> na agricultura familiar com atividades agropecuárias de subsistência, numa área de <strong>{farmArea} hectares</strong>, dentro da Terra Indígena Pankararé homologada pelo Decreto de 5 de Janeiro de 1996, (Disponível em <span className="break-all">https://www2.camara.leg.br/legin/fed/decret_sn/1996/decreto-35413-5-janeiro-1996-536187-publicacaooriginal-26447-pe.html</span>), em uma área com superfície de 29.597,3322ha (vinte e nove mil, quinhentos e noventa e sete hectares, trinta e três ares e vinte e dois centiares).
                  </p>

                  <p className="indent-10">
                    DECLARAMOS, finalmente, que à FUNAI, através de seu representante local ou regional, cabe a assistência ou assessoramento aos índios e suas comunidades e o encaminhamento de seus pleitos, não competindo o reconhecimento, direto ou indireto, da condição de indígena da pessoa de que trata esta declaração ou sua complementação.
                  </p>
                </div>

                {/* Date & Location - Generous space between last paragraph and date */}
                <div className="text-right text-[11.5pt] text-gray-900 mt-8 mb-8">
                  {issueCityUf}, {customDay} de {customMonth} de {customYear}.
                </div>

                {/* Signatures Blocks: Generous space between date and signatures */}
                <div className="space-y-5 pt-4 text-[10.5pt] text-gray-950">
                  {/* Signatory 1: Cacique */}
                  <div className="grid grid-cols-[1fr_210px] gap-x-6 items-start">
                    <div>
                      <div>
                        <span className="font-semibold">Nome legível:</span>{' '}
                        <strong className="uppercase">{sig1Name}</strong>
                      </div>
                      <div className="mt-0.5">
                        <span className="font-semibold">CPF:</span> {sig1Cpf}
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-semibold shrink-0">Assinatura:</span>
                        <div className="border-b border-gray-950 flex-grow h-3.5"></div>
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold">Função:</span>{' '}
                      <strong>{sig1Role}</strong>
                    </div>
                  </div>

                  {/* Signatory 2: Liderança 1 */}
                  <div className="grid grid-cols-[1fr_210px] gap-x-6 items-start">
                    <div>
                      <div>
                        <span className="font-semibold">Nome legível:</span>{' '}
                        <strong className="uppercase">{sig2Name}</strong>
                      </div>
                      <div className="mt-0.5">
                        <span className="font-semibold">CPF:</span> {sig2Cpf}
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-semibold shrink-0">Assinatura:</span>
                        <div className="border-b border-gray-950 flex-grow h-3.5"></div>
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold">Função:</span>{' '}
                      <strong>{sig2Role}</strong>
                    </div>
                  </div>

                  {/* Signatory 3: Liderança 2 */}
                  <div className="grid grid-cols-[1fr_210px] gap-x-6 items-start">
                    <div>
                      <div>
                        <span className="font-semibold">Nome legível:</span>{' '}
                        <strong className="uppercase">{sig3Name}</strong>
                      </div>
                      <div className="mt-0.5">
                        <span className="font-semibold">CPF:</span> {sig3Cpf}
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-semibold shrink-0">Assinatura:</span>
                        <div className="border-b border-gray-950 flex-grow h-3.5"></div>
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold">Função:</span>{' '}
                      <strong>{sig3Role}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Print Note (Optional) */}
              {showFooterNote && (
                <div className="mt-auto pt-2 border-t border-gray-200 text-[7pt] text-gray-500 flex items-center justify-between">
                  <span>Declaração Oficial de Pertencimento Étnico Indígena Pankararé</span>
                  <span>Aldeia Serrota • Glória/BA</span>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Histórico de Declarações Emitidas ({history.length})
                </h3>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Excluir todas as declarações do histórico"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Histórico
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-[#1a1a1a] rounded-xl border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between text-xs gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{item.personName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {item.ethnicity}
                        </span>
                        {item.code && (
                          <span className="text-[10px] font-mono text-gray-400">
                            {item.code}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        {item.village} • Emitida em {item.issuedAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
                        CPF: {item.cpf}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppForHistoryItem(item)}
                        className="p-1.5 bg-green-500/10 hover:bg-green-500/25 text-green-400 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        title="Enviar esta declaração via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px] font-medium">WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHistoryItem(item.id, item.personName)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Excluir esta declaração emitida"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Enviar Declaração via WhatsApp */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-white/10 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Transmitir Declaração via WhatsApp
                  </h3>
                  <p className="text-xs text-gray-400">
                    {selectedHistoryForWhatsApp ? `Registro: ${selectedHistoryForWhatsApp.code}` : 'Declaração Pankararé pronta para envio'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient & Phone */}
            <div className="space-y-3 bg-[#1a1a1a] p-3.5 rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Beneficiário(a):</span>
                <span className="text-white font-semibold">{selectedHistoryForWhatsApp ? selectedHistoryForWhatsApp.personName : (personName || 'Não especificado')}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-green-400" />
                  Telefone WhatsApp do Destinatário (com DDD):
                </label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Ex: (75) 99999-9999 ou 75988887777"
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  💡 Deixe em branco se preferir abrir o WhatsApp e escolher qualquer contato da sua lista.
                </p>
              </div>
            </div>

            {/* Message Preview / Edit */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  Mensagem Formatada para WhatsApp:
                </label>
                <button
                  type="button"
                  onClick={handleCopyWhatsAppText}
                  className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {whatsAppCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {whatsAppCopied ? 'Copiado!' : 'Copiar Texto'}
                </button>
              </div>
              <textarea
                rows={7}
                value={whatsAppMessage}
                onChange={(e) => setWhatsAppMessage(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-xl p-3 text-xs text-gray-200 font-mono focus:outline-none focus:border-green-500 leading-relaxed resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              
              {!selectedHistoryForWhatsApp && (
                <button
                  type="button"
                  onClick={async () => {
                    await handleDownloadPdf();
                    handleExecuteSendWhatsApp();
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 bg-emerald-700/60 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Baixa a folha oficial A4 em PDF e abre o WhatsApp com a mensagem pronta para anexar o arquivo"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Enviar + Baixar PDF</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleExecuteSendWhatsApp()}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Confirmação de Exclusão */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {deleteConfirmation.type === 'all' ? 'Limpar Todo o Histórico?' : 'Excluir Declaração?'}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {deleteConfirmation.type === 'all'
                    ? 'Esta ação removerá permanentemente todas as declarações emitidas registradas no histórico.'
                    : `Deseja realmente excluir a declaração emitida para ${deleteConfirmation.name ? `"${deleteConfirmation.name}"` : 'este registro'}?`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmation({ isOpen: false, type: 'single' })}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
