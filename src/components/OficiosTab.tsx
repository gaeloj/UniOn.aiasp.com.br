import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Printer, Copy, Check, Sparkles, RefreshCw, Plus, Trash2, Search, 
  Filter, Building, User, Download, FileDown, Loader2, Share2, Send, 
  ExternalLink, Eye, RotateCcw, ShieldCheck, CheckCircle, Clock, 
  AlertCircle, ChevronRight, X, Edit3, Bookmark, Layers, Hash, QrCode, Link as LinkIcon,
  Award, FileCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { EntityConfig, OficioRecord, Associate } from '../types';
import { UnionLogo } from './UnionLogo';
import { 
  getOficios, addOficio, updateOficio, deleteOficio 
} from '../utils/firebaseStorage';

interface OficiosTabProps {
  entityConfig: EntityConfig | null;
  associates?: Associate[];
}

// Predefined official letter templates
interface OficioTemplate {
  id: string;
  title: string;
  category: string;
  treatment: string;
  recipientRole: string;
  recipientOrg: string;
  subject: string;
  salutation: string;
  paragraphs: string[];
  closing: string;
}

const TEMPLATES: OficioTemplate[] = [
  {
    id: 'espaco_publico',
    title: 'Cessão de Espaço e Apoio Logístico',
    category: 'Requerimento',
    treatment: 'A Sua Excelência',
    recipientRole: 'Prefeito(a) Municipal',
    recipientOrg: 'Prefeitura Municipal',
    subject: 'Assunto: Solicitação de cessão de espaço público e apoio logístico para realização de Assembleia Geral',
    salutation: 'Excelentíssimo(a) Senhor(a) Prefeito(a),',
    paragraphs: [
      'Cumprimentando-o(a) cordialmente, servimo-nos do presente para solicitar a Vossa Excelência a cessão do espaço público (Ginásio Municipal / Auditório / Praça Central) para a realização da nossa próxima Assembleia Geral Ordinária, programada para ocorrer no próximo mês.',
      'A referida assembleia reunirá associados, lideranças comunitárias e familiares para debater pautas fundamentais de fortalecimento social, prestação de contas da gestão e planejamento das atividades produtivas comunitárias.',
      'Outrossim, solicitamos, na medida das possibilidades desta municipalidade, o apoio com fornecimento de cadeiras, tendas de proteção solar e sistema básico de sonorização.',
      'Reafirmamos nosso compromisso de zelar integralmente pela conservação, limpeza e integridade do patrimônio público disponibilizado, devolvendo-o nas exatas condições em que for recebido.',
      'Na certeza de contar com vossa costumeira atenção e pronto acolhimento a este pleito comunitário, renovamos nossos protestos de elevada estima e consideração.'
    ],
    closing: 'Atenciosamente,'
  },
  {
    id: 'encaminha_documentos',
    title: 'Encaminhamento de Documentos e Prestação de Contas',
    category: 'Administrativo',
    treatment: 'Ao Ilustríssimo Senhor',
    recipientRole: 'Secretário(a) Municipal de Administração e Finanças',
    recipientOrg: 'Secretaria Municipal de Administração',
    subject: 'Assunto: Encaminhamento de prestação de contas, ata de posse e relatório de atividades',
    salutation: 'Senhor(a) Secretário(a),',
    paragraphs: [
      'Pelo presente expediente, temos a honra de encaminhar a Vossa Senhoria, para conhecimento, arquivo e devidas providências cadastrais, a documentação institucional referente ao encerramento do exercício fiscal desta entidade.',
      'Seguem anexos a este Ofício: 1) Cópia autenticada da Ata da Assembleia Geral de Eleição e Posse da nova Diretoria Executiva; 2) Estatuto Social registrado; 3) Relatório sintético de atividades comunitárias; e 4) Balancete financeiro anual devidamente aprovado pelo Conselho Fiscal.',
      'Colocamo-nos à inteira disposição desta conceituada Secretaria para eventuais esclarecimentos complementares ou fornecimento de informações que se fizerem necessárias.'
    ],
    closing: 'Respeitosamente,'
  },
  {
    id: 'audiencia',
    title: 'Solicitação de Audiência Oficial',
    category: 'Institucional',
    treatment: 'A Sua Excelência',
    recipientRole: 'Prefeito(a) Municipal',
    recipientOrg: 'Gabinete do Prefeito',
    subject: 'Assunto: Solicitação de agendamento de audiência institucional com a Diretoria Executiva',
    salutation: 'Excelentíssimo(a) Senhor(a) Prefeito(a),',
    paragraphs: [
      'Ao tempo em que cordialmente o(a) saudamos, vimos por meio deste solicitar a Vossa Excelência a gentileza de conceder audiência institucional à comissão representativa da Diretoria desta Associação.',
      'O objetivo da reunião é apresentar oficialmente os novos membros eleitos da gestão, explanar as demandas prioritárias das famílias da nossa comunidade nas áreas de infraestrutura, abastecimento e saúde, bem como estabelecer canais permanentes de diálogo e colaboração com a gestão municipal.',
      'Sugerimos que o encontro seja agendado conforme a melhor disponibilidade de vossa agenda oficial de compromissos no corrente mês, ficando no aguardo da indicação de data e horário por intermédio da assessoria de gabinete.'
    ],
    closing: 'Atenciosamente,'
  },
  {
    id: 'parceria_feira',
    title: 'Parceria / Fomento para Feira e Projetos',
    category: 'Projetos',
    treatment: 'Ao Ilustríssimo Senhor',
    recipientRole: 'Secretário(a) de Agricultura, Meio Ambiente e Desenvolvimento Econômico',
    recipientOrg: 'Secretaria Municipal de Agricultura',
    subject: 'Assunto: Proposta de cooperação técnica e apoio à realização da Feira Comunitária da Agricultura Familiar',
    salutation: 'Senhor(a) Secretário(a),',
    paragraphs: [
      'Dirigimo-nos a Vossa Senhoria com o propósito de apresentar proposta de cooperação mútua entre esta Secretaria e nossa Entidade, visando ao fortalecimento da agricultura familiar, do extrativismo sustentável e do artesanato tradicional de nossa localidade.',
      'Nesse ensejo, propomos a viabilização conjunta da Feira Comunitária da Agricultura Familiar, evento de periodicidade mensal que oportunizará aos produtores o escoamento direto de suas produções aos consumidores, gerando trabalho e renda local.',
      'Solicitamos, a título de colaboração técnica, o apoio com o transporte dos produtos agrícolas da zona rural até o local do evento, bem como a orientação fitossanitária prestada pelo corpo técnico agronômico do Município.'
    ],
    closing: 'Cordialmente,'
  },
  {
    id: 'notificacao_posse',
    title: 'Comunicação Oficial de Nova Posse e Gestão',
    category: 'Institucional',
    treatment: 'A Sua Senhoria',
    recipientRole: 'Gerente Geral de Agência',
    recipientOrg: 'Instituição Financeira / Cartório / Órgão Público',
    subject: 'Assunto: Comunicação oficial de eleição, posse e regularidade da Diretoria Executiva - Triênio 2026/2028',
    salutation: 'Prezado(a) Senhor(a) Gerente,',
    paragraphs: [
      'Com o objetivo de manter a regularidade formal, bancária e cadastral desta Entidade sem fins lucrativos, comunicamos formalmente a realização de Assembleia Geral Eleitoral em conformidade com as normas estatutárias em vigor.',
      'Informamos que foram eleitos e devidamente empossados os membros da Diretoria Executiva para o mandato legal, sendo o Presidente legalmente investido com plenos poderes para representar a Associação perante instituições bancárias, cartorárias, judiciais e governamentais.',
      'Solicitamos a atualização dos cadastros operacionais e ficamos no aguardo de eventuais fichas cadastrais a serem assinadas.'
    ],
    closing: 'Atenciosamente,'
  },
  {
    id: 'informacoes_lai',
    title: 'Requerimento de Informações Oficiais (LAI)',
    category: 'Requerimento',
    treatment: 'Ao Ilustríssimo Senhor',
    recipientRole: 'Coordenador(a) / Diretor(a) do Órgão Público',
    recipientOrg: 'Órgão Competente',
    subject: 'Assunto: Requerimento de certidões e informações de interesse coletivo - Lei de Acesso à Informação',
    salutation: 'Senhor(a) Diretor(a),',
    paragraphs: [
      'A presente Associação, entidade civil constituída sem fins econômicos, vem respeitosamente à presença de Vossa Senhoria, com fundamento no artigo 5º, inciso XXXIII da Constituição Federal e na Lei Federal nº 12.527/2011 (Lei de Acesso à Informação), requerer o fornecimento de certidão e cópia integral dos seguintes dados de interesse comunitário:',
      '1. Andamento e cronograma físico-financeiro das obras de infraestrutura e pavimentação que contemplam a nossa área territorial;',
      '2. Relatório de vistorias técnicas e projetos de abastecimento e saneamento básico cadastrados para a nossa região.',
      'Requer-se que as informações sejam encaminhadas preferencialmente em meio digital para o endereço eletrônico institucional desta Associação no prazo regulamentar.'
    ],
    closing: 'Respeitosamente,'
  },
  {
    id: 'oficio_livre',
    title: 'Ofício em Branco (Personalizado)',
    category: 'Livre',
    treatment: 'Ao Ilustríssimo Senhor',
    recipientRole: 'Autoridade / Destinatário',
    recipientOrg: 'Nome do Órgão / Entidade',
    subject: 'Assunto: Descrição resumida do objetivo deste documento',
    salutation: 'Senhor(a),',
    paragraphs: [
      'Vimos por meio deste ofício expor e solicitar a Vossa Senhoria o que a seguir passa a expor com a devida consideração formal.',
      'Inserir aqui os argumentos, fatos e fundamentos do requerimento de forma clara, objetiva e cortês.',
      'Certos de contarmos com a colaboração e atenção costumeiras, permanecemos à disposição para novos esclarecimentos.'
    ],
    closing: 'Atenciosamente,'
  }
];

function generateUniqueAuthCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = '';
  for (let i = 0; i < 5; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `OF-${res}-${year}`;
}

export default function OficiosTab({ entityConfig }: OficiosTabProps) {
  // Navigation between creation and history
  const [viewMode, setViewMode] = useState<'editor' | 'history'>('editor');
  const [history, setHistory] = useState<OficioRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Loading and feedback states
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [previewZoom, setPreviewZoom] = useState<'100%' | '85%' | '70%'>('100%');

  // Selected ofício ID if editing an existing record
  const [currentOficioId, setCurrentOficioId] = useState<string | null>(null);

  // Template modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Delete modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    id?: string;
    oficioNumber?: string;
  }>({ isOpen: false });

  // Protocol edit modal state
  const [protocolModal, setProtocolModal] = useState<{
    isOpen: boolean;
    oficio: OficioRecord | null;
    status: OficioRecord['status'];
    protocolNumber: string;
    notes: string;
  }>({ isOpen: false, oficio: null, status: 'Emitido', protocolNumber: '', notes: '' });

  // Form Fields
  const currentYear = new Date().getFullYear();
  const [oficioNumber, setOficioNumber] = useState(`OFÍCIO Nº 001/${currentYear}/GP`);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [issueCityUf, setIssueCityUf] = useState(entityConfig?.city || 'Glória - BA');

  // Recipient Fields
  const [recipientTreatment, setRecipientTreatment] = useState('A Sua Excelência');
  const [recipientName, setRecipientName] = useState('Dr. Roberto Almeida Santos');
  const [recipientRole, setRecipientRole] = useState('Prefeito(a) Municipal');
  const [recipientOrganization, setRecipientOrganization] = useState('Prefeitura Municipal de Glória - BA');
  const [recipientAddress, setRecipientAddress] = useState('Praça dos Três Poderes, s/n - Centro');

  // Subject and Content
  const [subject, setSubject] = useState('Assunto: Solicitação de cessão de espaço público para realização de Assembleia Geral');
  const [salutation, setSalutation] = useState('Excelentíssimo(a) Senhor(a) Prefeito(a),');
  const [paragraphs, setParagraphs] = useState<string[]>([
    'Cumprimentando-o(a) cordialmente, servimo-nos do presente para solicitar a Vossa Excelência a cessão do espaço público (Ginásio Municipal / Auditório / Praça Central) para a realização da nossa próxima Assembleia Geral Ordinária, programada para ocorrer no próximo mês.',
    'A referida assembleia reunirá associados, lideranças comunitárias e familiares para debater pautas fundamentais de fortalecimento social, prestação de contas da gestão e planejamento das atividades produtivas comunitárias.',
    'Outrossim, solicitamos, na medida das possibilidades desta municipalidade, o apoio com fornecimento de cadeiras, tendas de proteção solar e sistema básico de sonorização.',
    'Reafirmamos nosso compromisso de zelar integralmente pela conservação, limpeza e integridade do patrimônio público disponibilizado, devolvendo-o nas exatas condições em que for recebido.',
    'Na certeza de contar com vossa costumeira atenção e pronto acolhimento a este pleito comunitário, renovamos nossos protestos de elevada estima e consideração.'
  ]);
  const [closing, setClosing] = useState('Atenciosamente,');

  // Signatory 1
  const [signatory1Name, setSignatory1Name] = useState(entityConfig?.presidentName || 'GAEL OLIVEIRA DE JESUS');
  const [signatory1Role, setSignatory1Role] = useState('Presidente da Diretoria Executiva');
  const [signatory1Document, setSignatory1Document] = useState(`CPF: ${entityConfig?.presidentCpf || '098.682.975-75'}`);

  // Signatory 2
  const [hasSignatory2, setHasSignatory2] = useState(false);
  const [signatory2Name, setSignatory2Name] = useState('Ana Júlia de Oliveira');
  const [signatory2Role, setSignatory2Role] = useState('Secretária-Geral');
  const [signatory2Document, setSignatory2Document] = useState('CPF: 234.567.890-11');

  // Options
  const [showLogo, setShowLogo] = useState(true);
  const [showEntityData, setShowEntityData] = useState(true);
  const [showSeal, setShowSeal] = useState(true);
  const [showSignatureLine, setShowSignatureLine] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [qrCodeType, setQrCodeType] = useState<'validacao' | 'link'>('validacao');
  const [qrCodeCustomUrl, setQrCodeCustomUrl] = useState('');
  const [authCode, setAuthCode] = useState(() => generateUniqueAuthCode());

  // Status & Tracking
  const [oficioStatus, setOficioStatus] = useState<OficioRecord['status']>('Emitido');
  const [protocolNumber, setProtocolNumber] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Ref for the paper sheet to print or capture as canvas
  const paperSheetRef = useRef<HTMLDivElement>(null);

  // Veracity Certificate State
  const [veracityModal, setVeracityModal] = useState<{
    isOpen: boolean;
    oficio: OficioRecord | null;
  }>({ isOpen: false, oficio: null });
  const [isGeneratingVeracityPdf, setIsGeneratingVeracityPdf] = useState(false);
  const [veracityDownloadSuccess, setVeracityDownloadSuccess] = useState(false);
  const [veracitySuccessAlert, setVeracitySuccessAlert] = useState<OficioRecord | null>(null);
  const [veracityCopied, setVeracityCopied] = useState(false);
  const veracitySheetRef = useRef<HTMLDivElement>(null);

  // Sync entityConfig changes
  useEffect(() => {
    if (entityConfig) {
      if (entityConfig.presidentName && !signatory1Name) {
        setSignatory1Name(entityConfig.presidentName);
      }
      if (entityConfig.city && !issueCityUf) {
        setIssueCityUf(entityConfig.city);
      }
    }
  }, [entityConfig]);

  // Load history on mount
  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoadingHistory(true);
      try {
        const records = await getOficios();
        setHistory(records);
        // Suggest next number based on existing ofícios in current year
        if (records.length > 0) {
          const currentYearRecords = records.filter(r => r.oficioNumber && r.oficioNumber.includes(`${currentYear}`));
          const nextNum = currentYearRecords.length + 1;
          const formattedNum = String(nextNum).padStart(3, '0');
          setOficioNumber(`OFÍCIO Nº ${formattedNum}/${currentYear}/GP`);
        }
      } catch (err) {
        console.warn('Erro ao carregar histórico de ofícios:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchRecords();
  }, [currentYear]);

  // Generate QR Code data URL dynamically
  useEffect(() => {
    const generateQr = async () => {
      try {
        let contentToEncode = '';
        if (qrCodeType === 'link' && qrCodeCustomUrl.trim()) {
          contentToEncode = qrCodeCustomUrl.trim();
        } else {
          contentToEncode = `${window.location.origin}/?val_oficio=${encodeURIComponent(authCode)}&num=${encodeURIComponent(oficioNumber)}&dest=${encodeURIComponent(recipientOrganization || recipientName)}`;
        }

        const url = await QRCode.toDataURL(contentToEncode, {
          width: 256,
          margin: 1,
          color: {
            dark: '#111827',
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
      }
    };
    if (showQrCode) {
      generateQr();
    }
  }, [showQrCode, authCode, oficioNumber, recipientOrganization, recipientName, qrCodeType, qrCodeCustomUrl]);

  // Generate QR code for veracity modal target
  useEffect(() => {
    if (!veracityModal.isOpen) {
      setVeracityModalQrCodeUrl('');
      return;
    }
    const target = veracityModal.oficio || {
      oficioNumber,
      authCode,
      recipientOrganization,
      recipientName
    };
    const code = target.authCode || authCode;
    const num = target.oficioNumber || oficioNumber;
    const dest = target.recipientOrganization || target.recipientName || recipientOrganization || recipientName;
    const contentToEncode = `${window.location.origin}/?val_oficio=${encodeURIComponent(code)}&num=${encodeURIComponent(num)}&dest=${encodeURIComponent(dest)}`;

    QRCode.toDataURL(contentToEncode, {
      width: 256,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#ffffff'
      }
    })
      .then(url => setVeracityModalQrCodeUrl(url))
      .catch(err => console.error('Erro ao gerar QR Code do Atestado:', err));
  }, [veracityModal.isOpen, veracityModal.oficio, authCode, oficioNumber, recipientOrganization, recipientName]);

  // Format date to Brazilian long format: "Glória - BA, 14 de setembro de 2026"
  const formattedLongDate = useMemo(() => {
    if (!issueDate) return '';
    try {
      const [year, month, day] = issueDate.split('-');
      const months = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      const monthIndex = parseInt(month, 10) - 1;
      const monthName = months[monthIndex] || month;
      return `${issueCityUf || 'Glória - BA'}, ${parseInt(day, 10)} de ${monthName} de ${year}`;
    } catch {
      return `${issueCityUf || 'Glória - BA'}, ${issueDate}`;
    }
  }, [issueDate, issueCityUf]);

  // Apply a template
  const handleApplyTemplate = (tmpl: OficioTemplate) => {
    setRecipientTreatment(tmpl.treatment);
    setRecipientRole(tmpl.recipientRole);
    setRecipientOrganization(tmpl.recipientOrg);
    setSubject(tmpl.subject);
    setSalutation(tmpl.salutation);
    setParagraphs([...tmpl.paragraphs]);
    setClosing(tmpl.closing);
    setShowTemplateModal(false);
  };

  // Paragraph manipulation
  const handleAddParagraph = () => {
    setParagraphs(prev => [...prev, 'Novo parágrafo do ofício com termos claros e formais.']);
  };

  const handleUpdateParagraph = (index: number, text: string) => {
    setParagraphs(prev => {
      const copy = [...prev];
      copy[index] = text;
      return copy;
    });
  };

  const handleRemoveParagraph = (index: number) => {
    if (paragraphs.length <= 1) return;
    setParagraphs(prev => prev.filter((_, i) => i !== index));
  };

  // Reset / New Ofício
  const handleNewOficio = () => {
    setCurrentOficioId(null);
    const nextNum = history.filter(r => r.oficioNumber.includes(`${currentYear}`)).length + 1;
    setOficioNumber(`OFÍCIO Nº ${String(nextNum).padStart(3, '0')}/${currentYear}/GP`);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setRecipientTreatment('A Sua Excelência');
    setRecipientName('Dr. Roberto Almeida Santos');
    setRecipientRole('Prefeito(a) Municipal');
    setRecipientOrganization('Prefeitura Municipal');
    setRecipientAddress('Praça dos Três Poderes, s/n - Centro');
    setSubject('Assunto: Solicitação de cessão de espaço público para realização de Assembleia Geral');
    setSalutation('Excelentíssimo(a) Senhor(a) Prefeito(a),');
    setParagraphs([
      'Cumprimentando-o(a) cordialmente, servimo-nos do presente para solicitar a Vossa Excelência a cessão do espaço público (Ginásio Municipal / Auditório / Praça Central) para a realização da nossa próxima Assembleia Geral Ordinária, programada para ocorrer no próximo mês.',
      'A referida assembleia reunirá associados, lideranças comunitárias e familiares para debater pautas fundamentais de fortalecimento social, prestação de contas da gestão e planejamento das atividades produtivas comunitárias.',
      'Na certeza de contar com vossa costumeira atenção e pronto acolhimento a este pleito comunitário, renovamos nossos protestos de elevada estima e consideração.'
    ]);
    setClosing('Atenciosamente,');
    setHasSignatory2(false);
    setShowQrCode(true);
    setQrCodeType('validacao');
    setQrCodeCustomUrl('');
    setAuthCode(generateUniqueAuthCode());
    setOficioStatus('Emitido');
    setProtocolNumber('');
    setInternalNotes('');
    setViewMode('editor');
  };

  // Save ofício record
  const handleSaveOficio = async () => {
    const id = currentOficioId || `oficio-${Date.now()}`;
    const record: OficioRecord = {
      id,
      oficioNumber,
      issueDate,
      issueCityUf,
      recipientTreatment,
      recipientName,
      recipientRole,
      recipientOrganization,
      recipientAddress,
      subject,
      salutation,
      bodyParagraphs: paragraphs,
      closing,
      signatory1Name,
      signatory1Role,
      signatory1Document,
      hasSignatory2,
      signatory2Name,
      signatory2Role,
      signatory2Document,
      showLogo,
      showEntityData,
      showSeal,
      showSignatureLine,
      showQrCode,
      qrCodeType,
      qrCodeCustomUrl,
      authCode,
      status: oficioStatus,
      protocolNumber,
      notes: internalNotes,
      createdAt: new Date().toISOString()
    };

    try {
      if (currentOficioId) {
        await updateOficio(record);
      } else {
        await addOficio(record);
        setCurrentOficioId(id);
      }
      // Update local state list
      setHistory(prev => {
        const filtered = prev.filter(r => r.id !== id);
        return [record, ...filtered];
      });
      setSavedSuccess(true);
      setVeracitySuccessAlert(record);
      setTimeout(() => setSavedSuccess(false), 3000);
      return record;
    } catch (err) {
      console.error('Erro ao salvar ofício:', err);
      return null;
    }
  };

  // Load from history
  const handleLoadRecord = (record: OficioRecord) => {
    setCurrentOficioId(record.id);
    setOficioNumber(record.oficioNumber);
    setIssueDate(record.issueDate);
    setIssueCityUf(record.issueCityUf || entityConfig?.city || 'Glória - BA');
    setRecipientTreatment(record.recipientTreatment || 'A Sua Excelência');
    setRecipientName(record.recipientName || '');
    setRecipientRole(record.recipientRole || '');
    setRecipientOrganization(record.recipientOrganization || '');
    setRecipientAddress(record.recipientAddress || '');
    setSubject(record.subject || '');
    setSalutation(record.salutation || '');
    setParagraphs(record.bodyParagraphs && record.bodyParagraphs.length > 0 ? record.bodyParagraphs : ['']);
    setClosing(record.closing || 'Atenciosamente,');
    setSignatory1Name(record.signatory1Name || entityConfig?.presidentName || '');
    setSignatory1Role(record.signatory1Role || 'Presidente da Diretoria Executiva');
    setSignatory1Document(record.signatory1Document || '');
    setHasSignatory2(!!record.hasSignatory2);
    setSignatory2Name(record.signatory2Name || '');
    setSignatory2Role(record.signatory2Role || '');
    setSignatory2Document(record.signatory2Document || '');
    setShowLogo(record.showLogo !== false);
    setShowEntityData(record.showEntityData !== false);
    setShowSeal(record.showSeal !== false);
    setShowSignatureLine(record.showSignatureLine !== false);
    setShowQrCode(record.showQrCode !== false);
    setQrCodeType(record.qrCodeType || 'validacao');
    setQrCodeCustomUrl(record.qrCodeCustomUrl || '');
    setAuthCode(record.authCode || generateUniqueAuthCode());
    setOficioStatus(record.status || 'Emitido');
    setProtocolNumber(record.protocolNumber || '');
    setInternalNotes(record.notes || '');
    setViewMode('editor');
  };

  // Duplicate an existing ofício
  const handleDuplicateRecord = (record: OficioRecord) => {
    handleLoadRecord(record);
    setCurrentOficioId(null);
    const nextNum = history.filter(r => r.oficioNumber.includes(`${currentYear}`)).length + 1;
    setOficioNumber(`OFÍCIO Nº ${String(nextNum).padStart(3, '0')}/${currentYear}/GP`);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setAuthCode(generateUniqueAuthCode());
    setOficioStatus('Emitido');
    setProtocolNumber('');
  };

  // Delete an ofício
  const confirmDelete = async () => {
    if (!deleteConfirmation.id) return;
    try {
      await deleteOficio(deleteConfirmation.id);
      setHistory(prev => prev.filter(r => r.id !== deleteConfirmation.id));
      if (currentOficioId === deleteConfirmation.id) {
        handleNewOficio();
      }
    } catch (err) {
      console.error('Erro ao excluir ofício:', err);
    } finally {
      setDeleteConfirmation({ isOpen: false });
    }
  };

  // Update status/protocol from modal
  const handleSaveProtocolModal = async () => {
    if (!protocolModal.oficio) return;
    const updated: OficioRecord = {
      ...protocolModal.oficio,
      status: protocolModal.status,
      protocolNumber: protocolModal.protocolNumber,
      notes: protocolModal.notes
    };
    try {
      await updateOficio(updated);
      setHistory(prev => prev.map(r => r.id === updated.id ? updated : r));
      if (currentOficioId === updated.id) {
        setOficioStatus(updated.status);
        setProtocolNumber(updated.protocolNumber || '');
        setInternalNotes(updated.notes || '');
      }
    } catch (err) {
      console.error('Erro ao atualizar protocolo:', err);
    } finally {
      setProtocolModal({ isOpen: false, oficio: null, status: 'Emitido', protocolNumber: '', notes: '' });
    }
  };

  // Copy full text
  const handleCopyText = () => {
    const textLines = [
      entityConfig?.name || 'ASSOCIAÇÃO',
      `CNPJ: ${entityConfig?.cnpj || ''}`,
      `${entityConfig?.address || ''}`,
      '--------------------------------------------------',
      `${oficioNumber}`,
      `${formattedLongDate}`,
      '',
      `${recipientTreatment}`,
      `${recipientName}`,
      `${recipientRole}`,
      `${recipientOrganization}`,
      recipientAddress ? `${recipientAddress}` : '',
      '',
      `${subject}`,
      '',
      `${salutation}`,
      '',
      ...paragraphs.map(p => `    ${p}\n`),
      `${closing}`,
      '',
      `${signatory1Name}`,
      `${signatory1Role}`,
      signatory1Document ? `${signatory1Document}` : '',
      hasSignatory2 ? `\n${signatory2Name}\n${signatory2Role}` : '',
      '',
      `Código de Autenticidade: ${authCode}`
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(textLines);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const summary = `*${oficioNumber}*\n*${subject}*\n\nDestinatário: ${recipientName} (${recipientOrganization})\nData: ${formattedLongDate}\nCódigo de Autenticação: ${authCode}\n\n_${salutation}_\n${paragraphs[0]}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(summary)}`;
    window.open(url, '_blank');
  };

  // Helper to format date into formal Brazilian official writing: "Glória - BA, 14 de setembro de 2026"
  const formatLongDateHelper = (dateStr?: string, cityStr?: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      const months = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      const monthIndex = parseInt(month, 10) - 1;
      const monthName = months[monthIndex] || month;
      return `${cityStr || 'Glória - BA'}, ${parseInt(day, 10)} de ${monthName} de ${year}`;
    } catch {
      return `${cityStr || 'Glória - BA'}, ${dateStr}`;
    }
  };

  // Generate full standalone A4 HTML for clean printing or Word/HTML export
  const generateOficioHTML = (data?: OficioRecord | null): string => {
    const target = data || {
      oficioNumber,
      issueDate,
      issueCityUf,
      recipientTreatment,
      recipientName,
      recipientRole,
      recipientOrganization,
      recipientAddress,
      subject,
      salutation,
      bodyParagraphs: paragraphs,
      closing,
      signatory1Name,
      signatory1Role,
      signatory1Document,
      hasSignatory2,
      signatory2Name,
      signatory2Role,
      signatory2Document,
      showLogo,
      showEntityData,
      showSignatureLine,
      showQrCode,
      qrCodeType,
      qrCodeCustomUrl,
      authCode,
    };

    const paragraphsList = target.bodyParagraphs || paragraphs;
    const targetDateFormatted = target.issueDate
      ? formatLongDateHelper(target.issueDate, target.issueCityUf || entityConfig?.city)
      : formattedLongDate;

    const logoHtml = (target.showLogo ?? showLogo)
      ? (entityConfig?.logo
          ? `<img src="${entityConfig.logo}" alt="Logotipo" style="max-height: 65px; max-width: 220px; object-fit: contain; margin: 0 auto 10px auto; display: block;" />`
          : `<div style="margin-bottom: 8px; text-align: center;">
              <svg width="50" height="50" viewBox="0 0 48 48" fill="none" style="margin: 0 auto; display: block;">
                <circle cx="24" cy="24" r="22" stroke="#16a34a" stroke-width="2.5" fill="#f0fdf4"/>
                <path d="M14 24L21 31L34 17" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>`
        )
      : '';

    const entityHeaderHtml = (target.showEntityData ?? showEntityData)
      ? `<div style="font-size: 9.5pt; color: #444; line-height: 1.35; margin-top: 4px;">
          <div>CNPJ: ${entityConfig?.cnpj || '00.000.000/0001-00'}</div>
          <div>${entityConfig?.address || 'Aldeia Serrota - Território Pankararé, Glória - BA'}</div>
          <div>${entityConfig?.phone ? `Tel: ${entityConfig.phone}` : ''}${entityConfig?.phone && entityConfig?.email ? ' • ' : ''}${entityConfig?.email ? `E-mail: ${entityConfig.email}` : ''}</div>
        </div>`
      : '';

    const sig2Html = target.hasSignatory2
      ? `<div style="flex: 1; text-align: center; padding: 0 10px;">
          ${(target.showSignatureLine ?? showSignatureLine) ? '<div style="width: 200px; border-bottom: 1px solid #111; margin: 0 auto 8px auto;"></div>' : ''}
          <div style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">${target.signatory2Name || ''}</div>
          <div style="font-size: 10pt; color: #444;">${target.signatory2Role || ''}</div>
          ${target.signatory2Document ? `<div style="font-size: 9pt; color: #666;">${target.signatory2Document}</div>` : ''}
        </div>`
      : '';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${target.oficioNumber || 'Ofício Oficial'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 20mm 20mm 25mm;
      @bottom-right {
        content: "Página " counter(page) " de " counter(pages);
        font-family: 'Times New Roman', Times, Georgia, serif;
        font-size: 10pt;
        color: #555;
      }
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 20mm 20mm 20mm 25mm;
      background: #ffffff;
      color: #000000;
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 12pt;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet-wrapper {
      max-width: 210mm;
      min-height: 250mm;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .header-area {
      text-align: center;
      padding-bottom: 14px;
      margin-bottom: 22px;
      border-bottom: 1px solid #ccc;
    }
    .header-title {
      font-size: 13.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #111;
      margin: 0;
      line-height: 1.25;
    }
    .expediente-bar {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 26px;
      font-size: 12pt;
    }
    .expediente-num {
      font-weight: bold;
    }
    .destinatario-area {
      margin-bottom: 24px;
      line-height: 1.35;
    }
    .assunto-area {
      font-weight: bold;
      margin-bottom: 20px;
    }
    .vocativo-area {
      font-weight: bold;
      margin-bottom: 14px;
    }
    .corpo-texto p {
      margin: 0 0 14px 0;
      text-align: justify;
      text-indent: 20mm;
      line-height: 1.65;
    }
    .fecho-area {
      margin-top: 24px;
      margin-bottom: 40px;
      text-indent: 20mm;
    }
    .assinaturas-area {
      margin-top: 30px;
      margin-bottom: 24px;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 30px;
    }
    .signatario-col {
      flex: 1;
      text-align: center;
      padding: 0 10px;
    }
    .sig-line {
      width: 220px;
      border-bottom: 1px solid #111;
      margin: 0 auto 8px auto;
    }
    .qrcode-footer-box {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      page-break-inside: avoid;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="sheet-wrapper">
    <div>
      <div class="header-area">
        ${logoHtml}
        <h1 class="header-title">${entityConfig?.name || 'ASSOCIAÇÃO COMUNITÁRIA'}</h1>
        ${entityHeaderHtml}
      </div>

      <div class="expediente-bar">
        <div class="expediente-num">${target.oficioNumber || 'OFÍCIO Nº 001/2026/GP'}</div>
        <div>${targetDateFormatted}</div>
      </div>

      <div class="destinatario-area">
        <div>${target.recipientTreatment || 'A Sua Excelência'},</div>
        <div style="font-weight: bold;">${target.recipientName || ''}</div>
        <div>${target.recipientRole || ''}</div>
        <div>${target.recipientOrganization || ''}</div>
        ${target.recipientAddress ? `<div style="font-size: 11pt; color: #444;">${target.recipientAddress}</div>` : ''}
      </div>

      <div class="assunto-area">${target.subject || ''}</div>

      <div class="vocativo-area">${target.salutation || ''}</div>

      <div class="corpo-texto">
        ${paragraphsList.map(p => `<p>${p}</p>`).join('')}
      </div>

      <div class="fecho-area">${target.closing || 'Atenciosamente,'}</div>
    </div>

    <div>
      <div class="assinaturas-area">
        <div class="signatario-col">
          ${(target.showSignatureLine ?? showSignatureLine) ? '<div class="sig-line"></div>' : ''}
          <div style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">${target.signatory1Name || ''}</div>
          <div style="font-size: 10pt; color: #444;">${target.signatory1Role || ''}</div>
          ${target.signatory1Document ? `<div style="font-size: 9pt; color: #666;">${target.signatory1Document}</div>` : ''}
        </div>
        ${sig2Html}
      </div>

      ${(target.showQrCode ?? showQrCode) && qrCodeDataUrl ? `
        <div class="qrcode-footer-box">
          <div style="padding: 2px; background: #fff; border: 1px solid #d1d5db; border-radius: 4px; display: inline-block;">
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 64px; height: 64px; display: block;" />
          </div>
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
  };

  // Print HTML via isolated iframe
  const printHtmlViaIframe = (html: string, title = 'Documento Oficial') => {
    try {
      const iframe = window.document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('title', title);
      window.document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.warn('Iframe print failed, falling back to window.print():', e);
            window.print();
          }

          setTimeout(() => {
            try {
              window.document.body.removeChild(iframe);
            } catch (err) {
              console.error(err);
            }
          }, 3000);
        }, 350);
        return;
      }
    } catch (e) {
      console.warn('Erro ao abrir iframe de impressão:', e);
    }

    // Direct fallback
    window.print();
  };

  // Robust isolated printing using dedicated hidden iframe
  const handlePrintOficio = (targetData?: OficioRecord) => {
    const html = generateOficioHTML(targetData);
    printHtmlViaIframe(html, targetData?.oficioNumber || oficioNumber);
  };

  // Generate HTML for the Veracity Attestation (Certidão de Veracidade e Autenticidade)
  const generateVeracityHTML = (targetData?: OficioRecord) => {
    const target: OficioRecord = targetData || {
      id: currentOficioId || 'preview',
      oficioNumber,
      issueDate,
      issueTime: '10:00:00',
      issueCityUf,
      recipientTreatment,
      recipientName,
      recipientRole,
      recipientOrganization,
      recipientAddress,
      subject,
      salutation,
      bodyParagraphs: paragraphs,
      closing,
      signatory1Name,
      signatory1Role,
      signatory1Document,
      hasSignatory2,
      signatory2Name,
      signatory2Role,
      signatory2Document,
      showLogo,
      showEntityData,
      showSeal,
      showSignatureLine,
      showQrCode,
      qrCodeType,
      qrCodeCustomUrl,
      authCode,
      status: oficioStatus,
      protocolNumber,
      notes: internalNotes,
      createdAt: new Date().toISOString()
    };

    const targetDateFormatted = target.issueDate
      ? formatLongDateHelper(target.issueDate, target.issueCityUf || entityConfig?.city)
      : formattedLongDate;

    const docNumClean = (target.oficioNumber || '001-2026').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    const certNumber = `CERT-VER-${docNumClean}`;

    const logoHtml = (target.showLogo ?? showLogo)
      ? (entityConfig?.logo
          ? `<img src="${entityConfig.logo}" alt="Logotipo" style="max-height: 65px; max-width: 220px; object-fit: contain; margin: 0 auto 10px auto; display: block;" />`
          : `<div style="margin-bottom: 8px; text-align: center;">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="margin: 0 auto; display: block;">
                <circle cx="24" cy="24" r="22" stroke="#16a34a" stroke-width="2.5" fill="#f0fdf4"/>
                <path d="M14 24L21 31L34 17" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>`
        )
      : '';

    const entityHeaderHtml = (target.showEntityData ?? showEntityData)
      ? `<div style="font-size: 9.5pt; color: #444; line-height: 1.35; margin-top: 4px;">
          <div>CNPJ: ${entityConfig?.cnpj || '00.000.000/0001-00'}</div>
          <div>${entityConfig?.address || 'Aldeia Serrota - Território Pankararé, Glória - BA'}</div>
          <div>${entityConfig?.phone ? `Tel: ${entityConfig.phone}` : ''}${entityConfig?.phone && entityConfig?.email ? ' • ' : ''}${entityConfig?.email ? `E-mail: ${entityConfig.email}` : ''}</div>
        </div>`
      : '';

    const sig2Html = target.hasSignatory2 && target.signatory2Name
      ? `<div style="flex: 1; text-align: center; padding: 0 10px;">
          <div style="width: 200px; border-bottom: 1px solid #111; margin: 0 auto 8px auto;"></div>
          <div style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">${target.signatory2Name}</div>
          <div style="font-size: 10pt; color: #444;">${target.signatory2Role || 'Testemunha / Secretária'}</div>
          ${target.signatory2Document ? `<div style="font-size: 9pt; color: #666;">${target.signatory2Document}</div>` : ''}
        </div>`
      : '';

    const qrImageToUse = qrCodeDataUrl || veracityModalQrCodeUrl || '';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Atestado de Veracidade - ${target.oficioNumber || 'Ofício'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 20mm 18mm 22mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111827;
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 11pt;
      line-height: 1.5;
    }
    .sheet-wrapper {
      width: 100%;
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .header-area {
      text-align: center;
      margin-bottom: 16px;
      border-bottom: 1.5px solid #111;
      padding-bottom: 10px;
    }
    .header-title {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
      color: #111;
    }
    .title-box {
      margin: 14px 0;
      padding: 10px 14px;
      background: #f0fdf4;
      border: 2px solid #16a34a;
      border-radius: 6px;
      text-align: center;
    }
    .title-main {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12pt;
      font-weight: 800;
      color: #15803d;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .title-sub {
      font-family: monospace;
      font-size: 9pt;
      color: #374151;
      margin-top: 4px;
      font-weight: 600;
    }
    .cert-body {
      font-size: 11pt;
      line-height: 1.65;
      text-align: justify;
      margin-bottom: 14px;
    }
    .cert-body p {
      text-indent: 15mm;
      margin: 0 0 10px 0;
    }
    .meta-table-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      margin: 14px 0 18px 0;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
    }
    .meta-table-header {
      background: #16a34a;
      color: #ffffff;
      padding: 6px 12px;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 8.5pt;
      letter-spacing: 0.5px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .meta-table td {
      padding: 5px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .meta-table tr:last-child td {
      border-bottom: none;
    }
    .meta-table .label-col {
      font-weight: bold;
      width: 35%;
      color: #4b5563;
      background: #f9fafb;
    }
    .assinaturas-area {
      margin-top: 20px;
      margin-bottom: 12px;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 30px;
    }
    .signatario-col {
      flex: 1;
      text-align: center;
      padding: 0 10px;
    }
    .sig-line {
      width: 220px;
      border-bottom: 1px solid #111;
      margin: 0 auto 8px auto;
    }
    .qrcode-footer-box {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="sheet-wrapper">
    <div>
      <div class="header-area">
        ${logoHtml}
        <h1 class="header-title">${entityConfig?.name || 'ASSOCIAÇÃO COMUNITÁRIA'}</h1>
        ${entityHeaderHtml}
      </div>

      <div class="title-box">
        <div class="title-main">CERTIDÃO DE VERACIDADE E AUTENTICIDADE DOCUMENTAL</div>
        <div class="title-sub">REGISTRO Nº: ${certNumber} • EXPEDIENTE VINCULADO: ${target.oficioNumber}</div>
      </div>

      <div class="cert-body">
        <p>
          A Diretoria da <strong>${entityConfig?.name || 'Associação'}</strong>, pessoa jurídica de direito privado inscrita no CNPJ sob o nº <strong>${entityConfig?.cnpj || '00.000.000/0001-00'}</strong>, com sede em ${entityConfig?.address || 'Glória - BA'}, no regular exercício de suas competências estatutárias e institucionais, sob as expressas cominações do <strong>artigo 299 do Código Penal Brasileiro</strong> (Falsidade Ideológica) e em estrita consonância com a <strong>Lei Federal nº 13.726/2018</strong> (Lei de Desburocratização e Presunção de Fé Pública):
        </p>
        <p>
          <strong>CERTIFICA E ATESTA</strong>, para todos os efeitos de direito e comprovação formal perante a Administração Pública Direta e Indireta (Federal, Estadual e Municipal), órgãos do Poder Judiciário, Ministério Público, cartórios e estabelecimentos bancários, que o expediente administrativo oficial identificado sob o número:
        </p>
        <div style="text-align: center; margin: 10px 0; font-size: 12pt; font-weight: bold; background: #f8fafc; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: Arial, Helvetica, sans-serif;">
          ${target.oficioNumber}
        </div>
        <p>
          expedido em <strong>${targetDateFormatted}</strong>, endereçado a <strong>${target.recipientName}</strong> (${target.recipientRole} - ${target.recipientOrganization}), versando sobre o assunto <em>«${target.subject}»</em> e formalmente subscrito por <strong>${target.signatory1Name}</strong> (${target.signatory1Role}), é <strong>ABSOLUTAMENTE GENUÍNO, VERÍDICO, ÍNTEGRO E AUTÊNTICO</strong>, encontrando-se devidamente registrado e arquivado no livro próprio de correspondências oficiais desta instituição.
        </p>
      </div>

      <div class="meta-table-box">
        <div class="meta-table-header">Quadro Demonstrativo de Verificação e Integridade Notarial</div>
        <table class="meta-table">
          <tbody>
            <tr>
              <td class="label-col">Expediente Certificado:</td>
              <td style="font-weight: bold; color: #111827;">${target.oficioNumber}</td>
            </tr>
            <tr>
              <td class="label-col">Código Hash / Autenticação:</td>
              <td style="font-family: monospace; font-weight: bold; color: #15803d; font-size: 10pt;">${target.authCode || authCode}</td>
            </tr>
            <tr>
              <td class="label-col">Destinatário Oficial:</td>
              <td>${target.recipientName} • ${target.recipientRole} (${target.recipientOrganization})</td>
            </tr>
            <tr>
              <td class="label-col">Assunto Certificado:</td>
              <td>${target.subject}</td>
            </tr>
            <tr>
              <td class="label-col">Signatário Titular:</td>
              <td>${target.signatory1Name} (${target.signatory1Role}) ${target.signatory1Document ? `• ${target.signatory1Document}` : ''}</td>
            </tr>
            ${target.hasSignatory2 && target.signatory2Name ? `
            <tr>
              <td class="label-col">2º Signatário / Co-autor:</td>
              <td>${target.signatory2Name} (${target.signatory2Role})</td>
            </tr>` : ''}
            <tr>
              <td class="label-col">Data da Expedição:</td>
              <td>${targetDateFormatted}</td>
            </tr>
            <tr>
              <td class="label-col">Status Registrado:</td>
              <td style="color: #15803d; font-weight: bold;">${target.status || 'Emitido'} • Documento Ativo com Plena Eficácia Jurídica</td>
            </tr>
            <tr>
              <td class="label-col">Conferência Notarial:</td>
              <td style="color: #15803d; font-weight: bold;">CONFERIDO E ATESTADO CONFORME OS REGISTROS DA ENTIDADE</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p style="font-size: 10pt; text-indent: 15mm; margin: 0 0 14px 0;">
        Por ser expressão solene da verdade, firma-se a presente Certidão de Veracidade e Autenticidade Documental para que produza seus jurídicos e regulares efeitos.
      </p>

      <div style="text-align: right; font-size: 11pt; margin-bottom: 20px;">
        ${targetDateFormatted}.
      </div>
    </div>

    <div>
      <div class="assinaturas-area">
        <div class="signatario-col">
          <div class="sig-line"></div>
          <div style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">${target.signatory1Name || ''}</div>
          <div style="font-size: 10pt; color: #444;">${target.signatory1Role || ''}</div>
          ${target.signatory1Document ? `<div style="font-size: 9pt; color: #666;">${target.signatory1Document}</div>` : ''}
          <div style="font-size: 8.5pt; color: #15803d; font-weight: bold; margin-top: 3px; font-family: Arial, Helvetica, sans-serif;">REPRESENTANTE LEGAL CERTIFICANTE</div>
        </div>
        ${sig2Html}
      </div>

      ${(target.showQrCode ?? showQrCode) && qrImageToUse ? `
        <div class="qrcode-footer-box">
          <div style="padding: 2px; background: #fff; border: 1px solid #d1d5db; border-radius: 4px; display: inline-block;">
            <img src="${qrImageToUse}" alt="QR Code" style="width: 64px; height: 64px; display: block;" />
          </div>
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
  };

  // Generate combined 2-page document: Ofício (Page 1) + Atestado de Veracidade (Page 2)
  const generateCombinedOficioAndVeracityHTML = (targetData?: OficioRecord) => {
    const oficioDoc = generateOficioHTML(targetData);
    const veracityDoc = generateVeracityHTML(targetData);

    const oficioBodyMatch = oficioDoc.match(/<body>([\s\S]*?)<\/body>/i);
    const veracityBodyMatch = veracityDoc.match(/<body>([\s\S]*?)<\/body>/i);

    const oficioBody = oficioBodyMatch ? oficioBodyMatch[1] : '';
    const veracityBody = veracityBodyMatch ? veracityBodyMatch[1] : '';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${targetData?.oficioNumber || oficioNumber} - Ofício e Atestado de Veracidade</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 20mm 18mm 22mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111827;
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 11pt;
      line-height: 1.5;
    }
    .page-sheet {
      width: 100%;
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      box-sizing: border-box;
    }
    .page-sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .header-area {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 1.5px solid #111;
      padding-bottom: 12px;
    }
    .header-title {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
      color: #111;
    }
    .expediente-bar {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 20px;
      font-size: 11pt;
    }
    .expediente-num {
      font-weight: bold;
    }
    .destinatario-area {
      margin-bottom: 18px;
      line-height: 1.4;
    }
    .assunto-area {
      font-weight: bold;
      margin-bottom: 18px;
      text-decoration: underline;
    }
    .vocativo-area {
      font-weight: bold;
      margin-bottom: 14px;
    }
    .corpo-texto p {
      margin: 0 0 14px 0;
      text-align: justify;
      text-indent: 20mm;
      line-height: 1.65;
    }
    .fecho-area {
      margin-top: 20px;
      margin-bottom: 25px;
      text-indent: 20mm;
    }
    .assinaturas-area {
      margin-top: 20px;
      margin-bottom: 15px;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 30px;
    }
    .signatario-col {
      flex: 1;
      text-align: center;
      padding: 0 10px;
    }
    .sig-line {
      width: 220px;
      border-bottom: 1px solid #111;
      margin: 0 auto 8px auto;
    }
    .qrcode-footer-box {
      margin-top: 15px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    .title-box {
      margin: 14px 0;
      padding: 10px 14px;
      background: #f0fdf4;
      border: 2px solid #16a34a;
      border-radius: 6px;
      text-align: center;
    }
    .title-main {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12pt;
      font-weight: 800;
      color: #15803d;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .title-sub {
      font-family: monospace;
      font-size: 9pt;
      color: #374151;
      margin-top: 4px;
      font-weight: 600;
    }
    .cert-body {
      font-size: 11pt;
      line-height: 1.65;
      text-align: justify;
      margin-bottom: 14px;
    }
    .cert-body p {
      text-indent: 15mm;
      margin: 0 0 10px 0;
    }
    .meta-table-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      margin: 14px 0 18px 0;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
    }
    .meta-table-header {
      background: #16a34a;
      color: #ffffff;
      padding: 6px 12px;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 8.5pt;
      letter-spacing: 0.5px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .meta-table td {
      padding: 5px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .meta-table tr:last-child td {
      border-bottom: none;
    }
    .meta-table .label-col {
      font-weight: bold;
      width: 35%;
      color: #4b5563;
      background: #f9fafb;
    }
    @media print {
      body {
        padding: 0;
      }
      .page-sheet {
        min-height: auto;
        padding: 0;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page-sheet">
    ${oficioBody}
  </div>
  <div class="page-sheet">
    ${veracityBody}
  </div>
</body>
</html>`;
  };

  // Print Veracity Certificate
  const handlePrintVeracity = (targetData?: OficioRecord) => {
    const html = generateVeracityHTML(targetData);
    printHtmlViaIframe(html, `Atestado de Veracidade - ${targetData?.oficioNumber || oficioNumber}`);
  };

  // Print Both Ofício + Veracity Certificate together
  const handlePrintOficioWithVeracity = (targetData?: OficioRecord) => {
    const html = generateCombinedOficioAndVeracityHTML(targetData);
    printHtmlViaIframe(html, `Ofício e Atestado - ${targetData?.oficioNumber || oficioNumber}`);
  };

  // Download PDF of Veracity Certificate
  const handleDownloadVeracityPdf = async (targetOficio?: OficioRecord) => {
    setIsGeneratingVeracityPdf(true);
    try {
      const target = targetOficio || (veracityModal.oficio || {
        id: currentOficioId || 'preview',
        oficioNumber,
        issueDate,
        issueTime: '10:00:00',
        issueCityUf,
        recipientTreatment,
        recipientName,
        recipientRole,
        recipientOrganization,
        recipientAddress,
        subject,
        salutation,
        bodyParagraphs: paragraphs,
        closing,
        signatory1Name,
        signatory1Role,
        signatory1Document,
        hasSignatory2,
        signatory2Name,
        signatory2Role,
        signatory2Document,
        showLogo,
        showEntityData,
        showSeal,
        showSignatureLine,
        showQrCode,
        qrCodeType,
        qrCodeCustomUrl,
        authCode,
        status: oficioStatus,
        protocolNumber,
        notes: internalNotes,
        createdAt: new Date().toISOString()
      });

      if (veracitySheetRef.current) {
        const canvas = await html2canvas(veracitySheetRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfPageHeight = pdf.internal.pageSize.getHeight();
        const totalHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(totalHeight, pdfPageHeight));

        const sanitizedName = (target.oficioNumber || 'OFICIO').replace(/[^a-zA-Z0-9]/g, '_');
        pdf.save(`ATESTADO_VERACIDADE_${sanitizedName}.pdf`);
      } else {
        handlePrintVeracity(target);
      }
    } catch (err) {
      console.error('Erro ao exportar PDF do Atestado de Veracidade:', err);
      handlePrintVeracity(targetOficio);
    } finally {
      setIsGeneratingVeracityPdf(false);
    }
  };

  // Copy formal text of Veracity Certificate
  const handleCopyVeracityText = (targetData?: OficioRecord) => {
    const target = targetData || veracityModal.oficio || {
      oficioNumber,
      authCode,
      recipientName,
      recipientOrganization,
      recipientRole,
      subject,
      signatory1Name,
      signatory1Role,
      issueDate,
      issueCityUf
    };
    const targetDateFormatted = target.issueDate
      ? formatLongDateHelper(target.issueDate, target.issueCityUf || entityConfig?.city)
      : formattedLongDate;

    const certText = [
      entityConfig?.name?.toUpperCase() || 'ASSOCIAÇÃO',
      `CNPJ: ${entityConfig?.cnpj || '00.000.000/0001-00'}`,
      '==================================================',
      'CERTIDÃO DE VERACIDADE E AUTENTICIDADE DOCUMENTAL',
      `EXPEDIENTE REFERENCIADO: ${target.oficioNumber}`,
      `CÓDIGO DE AUTENTICAÇÃO: ${target.authCode || authCode}`,
      '==================================================',
      '',
      `A Diretoria da ${entityConfig?.name || 'Associação'}, no uso de suas prerrogativas legais e estatutárias, sob as penas do artigo 299 do Código Penal Brasileiro e nos termos da Lei Federal nº 13.726/2018:`,
      '',
      `CERTIFICA E ATESTA, para todos os efeitos de direito e fé pública, que o documento oficial intitulado «${target.oficioNumber}», expedido em ${targetDateFormatted}, com o assunto «${target.subject}», endereçado a ${target.recipientName} (${target.recipientRole} - ${target.recipientOrganization}), e subscrito por ${target.signatory1Name} (${target.signatory1Role}), é ABSOLUTAMENTE VERÍDICO, LEGÍTIMO, ÍNTEGRO E AUTÊNTICO, tendo sido emitido regularmente por esta entidade e arquivado em seus registros oficiais.`,
      '',
      'Chave de Validação: ' + (target.authCode || authCode),
      'Status: ATIVO E VÁLIDO EM TODO O TERRITÓRIO NACIONAL',
      '',
      `${targetDateFormatted}`,
      '',
      `${target.signatory1Name}`,
      `${target.signatory1Role}`
    ].join('\n');

    navigator.clipboard.writeText(certText);
    setVeracityCopied(true);
    setTimeout(() => setVeracityCopied(false), 2500);
  };

  // Export PDF (high-resolution A4 via canvas with fallback to download HTML)
  const handleDownloadPdf = async (targetOficio?: OficioRecord) => {
    // If targetOficio is passed from history, load it first
    if (targetOficio && targetOficio.id !== currentOficioId) {
      handleLoadRecord(targetOficio);
      await new Promise(r => setTimeout(r, 200));
    }

    if (!paperSheetRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = paperSheetRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const totalCanvasPdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      if (totalCanvasPdfHeight <= pdfPageHeight + 2) {
        // Document fits in a single page
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, totalCanvasPdfHeight);
      } else {
        // Document spans multiple pages: calculate pages and slice accurately
        const totalPages = Math.ceil(totalCanvasPdfHeight / pdfPageHeight);
        let heightLeft = totalCanvasPdfHeight;
        let position = 0;

        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalCanvasPdfHeight);
          // Add formal footer "Página X de Y"
          pdf.setFont('times', 'normal');
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Página ${i + 1} de ${totalPages}`, pdfWidth - 25, pdfPageHeight - 12, { align: 'right' });

          position -= pdfPageHeight;
          heightLeft -= pdfPageHeight;
        }
      }
      const targetNumber = targetOficio?.oficioNumber || oficioNumber;
      const sanitizedName = targetNumber.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`${sanitizedName}.pdf`);
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);

      // Auto-save to history when exported
      if (!targetOficio) {
        await handleSaveOficio();
      }
    } catch (err) {
      console.error('Erro ao gerar PDF do ofício:', err);
      // Resilient fallback: download standalone HTML document
      handleDownloadHtml(targetOficio);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download standalone HTML document (editable in Word/Google Docs)
  const handleDownloadHtml = (targetData?: OficioRecord) => {
    const html = generateOficioHTML(targetData);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    const targetNumber = targetData?.oficioNumber || oficioNumber;
    const sanitizedName = targetNumber.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `${sanitizedName}.html`);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open formatted document in a clean new tab for printing or browser PDF saving
  const handleOpenInNewTab = (targetData?: OficioRecord) => {
    const html = generateOficioHTML(targetData);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Quick actions from History List
  const handleDownloadHistoryPdf = async (item: OficioRecord) => {
    handleLoadRecord(item);
    setTimeout(() => {
      handleDownloadPdf(item);
    }, 250);
  };

  // Filtered history
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = 
        (item.oficioNumber || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.recipientName || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.recipientOrganization || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.subject || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.protocolNumber || '').toLowerCase().includes(searchFilter.toLowerCase());

      const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [history, searchFilter, statusFilter]);

  // Color helper for status badge
  const getStatusBadge = (status?: OficioRecord['status']) => {
    switch (status) {
      case 'Protocolado':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-3.5 h-3.5" /> Protocolado</span>;
      case 'Enviado':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><Send className="w-3.5 h-3.5" /> Enviado</span>;
      case 'Respondido':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20"><Sparkles className="w-3.5 h-3.5" /> Respondido</span>;
      case 'Arquivado':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"><Bookmark className="w-3.5 h-3.5" /> Arquivado</span>;
      case 'Emitido':
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-3.5 h-3.5" /> Emitido</span>;
    }
  };

  return (
    <div className="space-y-6 text-gray-200">
      {/* Top Header & View Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] border border-white/5 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Gerador de Ofícios Oficiais
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Padrão Administrativo
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Redação oficial, cabeçalho institucional, modelos pré-configurados, exportação em PDF e controle de protocolo.
            </p>
          </div>
        </div>

        {/* View Switcher: Editor vs Histórico */}
        <div className="flex items-center gap-2 bg-[#0c0c0c] p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Editor & Prévia
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'history'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Histórico & Protocolos
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20 text-white font-mono">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* VIEW: HISTÓRICO DE OFÍCIOS */}
      {viewMode === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141414] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por número, destinatário ou assunto..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-gray-400 ml-2" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-[#0d0d0d] border border-white/10 rounded-lg text-xs text-gray-300 py-2 px-2.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="Emitido">Emitido</option>
                  <option value="Enviado">Enviado</option>
                  <option value="Protocolado">Protocolado</option>
                  <option value="Respondido">Respondido</option>
                  <option value="Arquivado">Arquivado</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleNewOficio}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Criar Novo Ofício
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-xs">Carregando arquivo de ofícios emitidos...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-16 bg-[#141414] border border-white/5 rounded-2xl text-center text-gray-400">
              <FileText className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="font-semibold text-white text-sm">Nenhum ofício encontrado</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {searchFilter || statusFilter !== 'todos'
                  ? 'Nenhum registro corresponde aos filtros selecionados.'
                  : 'Crie seu primeiro ofício oficial utilizando o editor interativo.'}
              </p>
              <button
                onClick={handleNewOficio}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Ofício
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHistory.map(item => (
                <div
                  key={item.id}
                  className="bg-[#141414] border border-white/5 hover:border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {item.oficioNumber}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>

                    <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-emerald-300 transition-colors">
                      {item.recipientOrganization || item.recipientName}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      Destinatário: {item.recipientName} ({item.recipientRole})
                    </p>
                    <p className="text-xs text-gray-300 mt-2 bg-black/30 p-2 rounded-lg line-clamp-2 border border-white/5 italic">
                      {item.subject}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Data: {item.issueDate}</span>
                      <span className="font-mono text-[10px]">{item.authCode}</span>
                    </div>

                    {item.protocolNumber && (
                      <div className="mt-2 text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2 py-1 rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Protocolo: <strong>{item.protocolNumber}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleLoadRecord(item)}
                      className="flex-1 min-w-[70px] flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-emerald-600 hover:text-white text-gray-300 text-xs font-medium rounded-lg transition-all cursor-pointer"
                      title="Abrir no editor para alterar dados"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar
                    </button>

                    <button
                      onClick={() => handlePrintOficio(item)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-xs font-medium rounded-lg transition-all cursor-pointer"
                      title="Imprimir este ofício em folha A4 oficial"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir
                    </button>

                    <button
                      onClick={() => setVeracityModal({ isOpen: true, oficio: item })}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                      title="Gerar e Visualizar Atestado de Veracidade deste Ofício"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Atestado
                    </button>

                    <button
                      onClick={() => handleDownloadHistoryPdf(item)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-medium rounded-lg transition-all cursor-pointer"
                      title="Baixar PDF deste ofício"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>

                    <button
                      onClick={() => setProtocolModal({
                        isOpen: true,
                        oficio: item,
                        status: item.status || 'Emitido',
                        protocolNumber: item.protocolNumber || '',
                        notes: item.notes || ''
                      })}
                      title="Gerenciar Protocolo & Status"
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDuplicateRecord(item)}
                      title="Duplicar como base para novo ofício"
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmation({
                        isOpen: true,
                        id: item.id,
                        oficioNumber: item.oficioNumber
                      })}
                      title="Excluir do Histórico"
                      className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: EDITOR & PREVIEW */}
      {viewMode === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Controls & Form (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Action Bar */}
            <div className="bg-[#141414] border border-white/5 p-4 rounded-xl flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Modelos Prontos
                </button>
                <button
                  onClick={handleNewOficio}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVeracityModal({ isOpen: true, oficio: null })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                  title="Gerar e Visualizar Atestado de Veracidade do Ofício"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Atestado de Veracidade
                </button>
                <button
                  onClick={handleSaveOficio}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Salvo!</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Veracity Success Alert Banner (Auto-generated when saving) */}
            {veracitySuccessAlert && (
              <div className="bg-emerald-950/70 border border-emerald-500/40 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-300">
                      Ofício Gerado & Atestado de Veracidade Emitido!
                    </div>
                    <div className="text-[11px] text-gray-300">
                      Chave Hash: <span className="font-mono text-emerald-400 font-bold">{veracitySuccessAlert.authCode}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setVeracityModal({ isOpen: true, oficio: veracitySuccessAlert })}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver Atestado
                  </button>
                  <button
                    onClick={() => handlePrintOficioWithVeracity(veracitySuccessAlert)}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    title="Imprimir Ofício e Atestado de Veracidade juntos"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Ambos
                  </button>
                  <button
                    onClick={() => setVeracitySuccessAlert(null)}
                    className="p-1 text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Export Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleDownloadPdf()}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
                title="Baixar em formato PDF"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : downloadSuccess ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloadSuccess ? 'Baixado!' : 'Baixar PDF'}
              </button>

              <button
                onClick={() => handlePrintOficio()}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1a1a1a] hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                title="Imprimir documento em folha A4"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                Imprimir Ofício
              </button>

              <button
                onClick={() => setVeracityModal({ isOpen: true, oficio: null })}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-950/40 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold rounded-xl transition-all cursor-pointer"
                title="Visualizar e Imprimir Atestado de Veracidade do Ofício"
              >
                <ShieldCheck className="w-4 h-4" />
                Atestado
              </button>

              <button
                onClick={() => handlePrintOficioWithVeracity()}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-teal-950/40 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/40 text-xs font-bold rounded-xl transition-all cursor-pointer"
                title="Imprimir Ofício e Atestado de Veracidade juntos em 2 vias"
              >
                <FileCheck className="w-4 h-4" />
                Ofício + Atestado
              </button>

              <button
                onClick={handleCopyText}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1a1a1a] hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {copiedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedSuccess ? 'Copiado!' : 'Copiar'}
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1a1a1a] hover:bg-emerald-500/20 hover:border-emerald-500/30 border border-white/10 text-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                WhatsApp
              </button>
            </div>

            {/* Form Accordion / Sections */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4 divide-y divide-white/5">
              {/* Section 1: Identificação do Documento */}
              <div className="space-y-3 pt-1 first:pt-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" />
                  1. Dados do Expediente
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">Número do Ofício</label>
                    <input
                      type="text"
                      value={oficioNumber}
                      onChange={e => setOficioNumber(e.target.value)}
                      placeholder="OFÍCIO Nº 001/2026/GP"
                      className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">Data de Emissão</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 font-medium mb-1">Localidade (Cidade - UF)</label>
                  <input
                    type="text"
                    value={issueCityUf}
                    onChange={e => setIssueCityUf(e.target.value)}
                    placeholder="Ex: Glória - BA"
                    className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Section 2: Destinatário */}
              <div className="space-y-3 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  2. Destinatário Oficial
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">Pronome de Tratamento</label>
                    <select
                      value={recipientTreatment}
                      onChange={e => setRecipientTreatment(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="A Sua Excelência">A Sua Excelência (Prefeitos, Governadores, Juízes)</option>
                      <option value="Ao Ilustríssimo Senhor">Ao Ilustríssimo Senhor (Secretários, Diretores)</option>
                      <option value="À Ilustríssima Senhora">À Ilustríssima Senhora</option>
                      <option value="A Sua Senhoria">A Sua Senhoria (Gerentes, Líderes)</option>
                      <option value="Ao Prezado(a) Senhor(a)">Ao Prezado(a) Senhor(a)</option>
                      <option value="Aos Cuidados de">Aos Cuidados de</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">Nome do Destinatário</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="Ex: Dr. Roberto Almeida Santos"
                      className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">Cargo / Função</label>
                    <input
                      type="text"
                      value={recipientRole}
                      onChange={e => setRecipientRole(e.target.value)}
                      placeholder="Ex: Prefeito(a) Municipal"
                      className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">Órgão / Empresa / Entidade</label>
                    <input
                      type="text"
                      value={recipientOrganization}
                      onChange={e => setRecipientOrganization(e.target.value)}
                      placeholder="Ex: Prefeitura Municipal de Glória"
                      className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 font-medium mb-1">Endereço / Município (Opcional)</label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={e => setRecipientAddress(e.target.value)}
                    placeholder="Ex: Praça dos Três Poderes, s/n - Centro, Glória - BA"
                    className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Section 3: Assunto, Vocativo e Parágrafos */}
              <div className="space-y-3 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  3. Assunto e Redação do Ofício
                </h3>
                <div>
                  <label className="block text-[11px] text-gray-400 font-medium mb-1">Linha do Assunto</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Assunto: Solicitação de..."
                    className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">Vocativo Inicial</label>
                    <input
                      type="text"
                      value={salutation}
                      onChange={e => setSalutation(e.target.value)}
                      placeholder="Excelentíssimo(a) Senhor(a),"
                      className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">Fecho de Cortesia</label>
                    <select
                      value={closing}
                      onChange={e => setClosing(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Atenciosamente,">Atenciosamente, (Padrão)</option>
                      <option value="Respeitosamente,">Respeitosamente, (Autoridades Superiores)</option>
                      <option value="Cordialmente,">Cordialmente,</option>
                      <option value="Com nossos cordiais cumprimentos,">Com nossos cordiais cumprimentos,</option>
                    </select>
                  </div>
                </div>

                {/* Parágrafos Individuais */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-gray-400 font-medium">
                      Parágrafos do Texto ({paragraphs.length})
                    </label>
                    <button
                      onClick={handleAddParagraph}
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Parágrafo
                    </button>
                  </div>

                  {paragraphs.map((p, idx) => (
                    <div key={idx} className="relative group bg-[#0d0d0d] p-2.5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                        <span>Parágrafo {idx + 1}</span>
                        {paragraphs.length > 1 && (
                          <button
                            onClick={() => handleRemoveParagraph(idx)}
                            className="text-red-400/70 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                            title="Remover este parágrafo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        value={p}
                        onChange={e => handleUpdateParagraph(idx, e.target.value)}
                        className="w-full bg-transparent text-xs text-gray-200 focus:outline-none resize-y leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Signatários */}
              <div className="space-y-3 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5" />
                  4. Signatários & Assinatura
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">Nome do 1º Signatário</label>
                    <input
                      type="text"
                      value={signatory1Name}
                      onChange={e => setSignatory1Name(e.target.value)}
                      placeholder="Ex: GAEL OLIVEIRA DE JESUS"
                      className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 font-medium mb-1">Cargo</label>
                    <input
                      type="text"
                      value={signatory1Role}
                      onChange={e => setSignatory1Role(e.target.value)}
                      placeholder="Presidente da Diretoria Executiva"
                      className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 font-medium mb-1">Documento / Matrícula (Opcional)</label>
                  <input
                    type="text"
                    value={signatory1Document}
                    onChange={e => setSignatory1Document(e.target.value)}
                    placeholder="CPF: 000.000.000-00"
                    className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Toggle Signatário 2 */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={hasSignatory2}
                      onChange={e => setHasSignatory2(e.target.checked)}
                      className="rounded border-white/10 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Incluir 2º Signatário conjunto (ex: Secretário(a) ou Tesoureiro(a))</span>
                  </label>
                </div>

                {hasSignatory2 && (
                  <div className="p-3 bg-[#0d0d0d] rounded-xl border border-white/10 space-y-3 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-gray-400 font-medium mb-1">Nome do 2º Signatário</label>
                        <input
                          type="text"
                          value={signatory2Name}
                          onChange={e => setSignatory2Name(e.target.value)}
                          placeholder="Ex: Ana Júlia de Oliveira"
                          className="w-full px-3 py-2 bg-[#141414] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 font-medium mb-1">Cargo</label>
                        <input
                          type="text"
                          value={signatory2Role}
                          onChange={e => setSignatory2Role(e.target.value)}
                          placeholder="Ex: Secretária-Geral"
                          className="w-full px-3 py-2 bg-[#141414] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 font-medium mb-1">Documento do 2º Signatário</label>
                      <input
                        type="text"
                        value={signatory2Document}
                        onChange={e => setSignatory2Document(e.target.value)}
                        placeholder="CPF: 000.000.000-00"
                        className="w-full px-3 py-2 bg-[#141414] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Opções Visuais & Controle */}
              <div className="space-y-3 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  5. Visual do Papel & Autenticação
                </h3>
                <div className="grid grid-cols-2 gap-2.5 text-xs text-gray-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLogo}
                      onChange={e => setShowLogo(e.target.checked)}
                      className="rounded border-white/10 text-emerald-500 focus:ring-0"
                    />
                    <span>Exibir Logotipo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEntityData}
                      onChange={e => setShowEntityData(e.target.checked)}
                      className="rounded border-white/10 text-emerald-500 focus:ring-0"
                    />
                    <span>Cabeçalho Oficial</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSignatureLine}
                      onChange={e => setShowSignatureLine(e.target.checked)}
                      className="rounded border-white/10 text-emerald-500 focus:ring-0"
                    />
                    <span>Linha de Assinatura</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showQrCode}
                      onChange={e => setShowQrCode(e.target.checked)}
                      className="rounded border-white/10 text-emerald-500 focus:ring-0"
                    />
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      Inserir QR Code
                    </span>
                  </label>
                </div>

                {/* Bloco de Configuração do QR Code */}
                {showQrCode && (
                  <div className="p-3 bg-[#0d0d0d] border border-emerald-500/20 rounded-xl space-y-3 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        Configurar QR Code
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-medium border border-emerald-500/20">
                        Ativo no Ofício
                      </span>
                    </div>

                    {/* Seleção do Tipo de QR Code */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setQrCodeType('validacao')}
                        className={`px-2.5 py-2 text-[11px] font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          qrCodeType === 'validacao'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                            : 'bg-[#141414] border-white/10 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Validação Digital
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrCodeType('link')}
                        className={`px-2.5 py-2 text-[11px] font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          qrCodeType === 'link'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                            : 'bg-[#141414] border-white/10 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Link / URL
                      </button>
                    </div>

                    {qrCodeType === 'validacao' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">Código de Autenticação:</span>
                          <button
                            type="button"
                            onClick={() => setAuthCode(generateUniqueAuthCode())}
                            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px] cursor-pointer"
                            title="Gerar outro código aleatório"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Novo Código
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={authCode}
                            onChange={e => setAuthCode(e.target.value.toUpperCase())}
                            className="w-full px-3 py-1.5 bg-[#141414] border border-white/10 rounded-lg text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                            placeholder="EX: OFC-2026-XXXXX"
                          />
                        </div>
                        <p className="text-[10px] text-gray-500">
                          Ao escanear pelo celular, direciona para a validação oficial do ofício.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-[11px] text-gray-400 font-medium">
                          Link de Destino do QR Code:
                        </label>
                        <input
                          type="url"
                          value={qrCodeCustomUrl}
                          onChange={e => setQrCodeCustomUrl(e.target.value)}
                          placeholder="https://exemplo.com.br/processo-ou-anexo"
                          className="w-full px-3 py-1.5 bg-[#141414] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        <p className="text-[10px] text-gray-400">
                          O link fica incorporado diretamente no QR Code (não será exibido por extenso no documento impresso).
                        </p>
                      </div>
                    )}

                    {/* Mini Prévia do QR Code */}
                    {qrCodeDataUrl && (
                      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                        <div className="p-1 bg-white rounded shadow-sm shrink-0">
                          <img src={qrCodeDataUrl} alt="Prévia QR Code" className="w-10 h-10 object-contain" />
                        </div>
                        <div className="text-[10px] text-gray-400 leading-snug">
                          <span className="text-gray-300 font-semibold block">Apenas o QR Code no Rodapé</span>
                          O documento exibirá exclusivamente o QR Code no rodapé, mantendo o link oculto da leitura visual.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Real-Time A4 Sheet Preview (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Dedicated Preview Toolbar with Instant Print & Download */}
            <div className="bg-[#141414] border border-white/10 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2.5 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  Visualização A4
                </span>
                <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
                  (210mm x 297mm)
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handlePrintOficio()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
                  title="Imprimir ofício em folha A4 oficial"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>

                <button
                  onClick={() => handleDownloadPdf()}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer"
                  title="Baixar em formato PDF"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : downloadSuccess ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {downloadSuccess ? 'Baixado!' : 'Baixar PDF'}
                </button>

                <button
                  onClick={() => handleOpenInNewTab()}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-all cursor-pointer"
                  title="Abrir documento em nova aba para visualização limpa"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nova Aba</span>
                </button>

                <button
                  onClick={() => handleDownloadHtml()}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-all cursor-pointer"
                  title="Baixar em formato HTML (abre no Word ou LibreOffice)"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">HTML/Word</span>
                </button>

                {/* Zoom Selectors */}
                <div className="flex items-center bg-[#0a0a0a] rounded-lg border border-white/10 p-0.5">
                  {(['100%', '85%', '70%'] as const).map(z => (
                    <button
                      key={z}
                      onClick={() => setPreviewZoom(z)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                        previewZoom === z
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* A4 PAPER CONTAINER */}
            <div className="overflow-x-auto pb-4 flex justify-center">
              <div
                ref={paperSheetRef}
                id="printable-oficio-sheet"
                style={{
                  fontFamily: "'Times New Roman', Times, Georgia, serif",
                  transform: previewZoom === '85%' ? 'scale(0.85)' : previewZoom === '70%' ? 'scale(0.7)' : 'scale(1)',
                  transformOrigin: 'top center',
                  marginBottom: previewZoom === '85%' ? '-45mm' : previewZoom === '70%' ? '-90mm' : '0'
                }}
                className="w-[210mm] min-h-[297mm] bg-white text-black p-[25mm] shadow-2xl rounded-sm box-border flex flex-col justify-between select-text transition-all"
              >
                {/* 1. CABEÇALHO OFICIAL */}
                <div>
                  <div className="text-center pb-4 mb-6 border-b border-gray-300">
                    {showLogo && (
                      <div className="flex justify-center mb-3">
                        {entityConfig?.logo ? (
                          <img
                            src={entityConfig.logo}
                            alt="Logotipo da Entidade"
                            className="h-16 max-w-[200px] object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <UnionLogo className="w-16 h-16" />
                        )}
                      </div>
                    )}

                    <h1 className="text-[15px] font-bold tracking-wide uppercase text-gray-900 leading-tight">
                      {entityConfig?.name || 'ASSOCIAÇÃO COMUNITÁRIA'}
                    </h1>

                    {showEntityData && (
                      <div className="text-[10px] text-gray-600 mt-1 leading-snug">
                        <p>CNPJ: {entityConfig?.cnpj || '00.000.000/0001-00'}</p>
                        <p>{entityConfig?.address || 'Aldeia Serrota - Território Pankararé, Glória - BA'}</p>
                        <p>
                          {entityConfig?.phone && `Tel: ${entityConfig.phone}`}
                          {entityConfig?.phone && entityConfig?.email && ' • '}
                          {entityConfig?.email && `E-mail: ${entityConfig.email}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 2. IDENTIFICAÇÃO DO EXPEDIENTE E DATA */}
                  <div className="flex justify-between items-baseline text-[12pt] font-normal mb-8 leading-normal">
                    <div className="font-bold tracking-tight text-gray-900">
                      {oficioNumber || 'OFÍCIO Nº 001/2026/GP'}
                    </div>
                    <div className="text-right text-gray-800">
                      {formattedLongDate}
                    </div>
                  </div>

                  {/* 3. DESTINATÁRIO */}
                  <div className="text-[12pt] mb-8 leading-snug">
                    <p className="font-medium">{recipientTreatment},</p>
                    <p className="font-bold text-gray-900">{recipientName}</p>
                    <p className="font-normal">{recipientRole}</p>
                    <p className="font-normal text-gray-800">{recipientOrganization}</p>
                    {recipientAddress && (
                      <p className="text-[11pt] text-gray-700 mt-0.5">{recipientAddress}</p>
                    )}
                  </div>

                  {/* 4. ASSUNTO */}
                  <div className="text-[12pt] font-bold text-gray-900 mb-6 tracking-normal">
                    {subject}
                  </div>

                  {/* 5. VOCATIVO */}
                  <div className="text-[12pt] font-semibold text-gray-900 mb-4">
                    {salutation}
                  </div>

                  {/* 6. CORPO DO TEXTO (PARÁGRAFOS) */}
                  <div className="text-[12pt] text-gray-900 leading-[1.65] text-justify space-y-4">
                    {paragraphs.map((p, idx) => (
                      <p key={idx} className="indent-[20mm]">
                        {p}
                      </p>
                    ))}
                  </div>

                  {/* 7. FECHO */}
                  <div className="text-[12pt] text-gray-900 mt-8 mb-14 indent-[20mm]">
                    {closing}
                  </div>
                </div>

                {/* 8. ASSINATURAS E RODAPÉ */}
                <div className="mt-8 pt-4">
                  {/* Bloco de Assinaturas */}
                  <div className={`grid ${hasSignatory2 ? 'grid-cols-2 gap-8' : 'grid-cols-1'} text-center mb-8`}>
                    {/* Signatário 1 */}
                    <div className="flex flex-col items-center">
                      {showSignatureLine && (
                        <div className="w-64 border-b border-gray-900 mb-2"></div>
                      )}
                      <p className="font-bold text-[12pt] text-gray-900 uppercase">
                        {signatory1Name}
                      </p>
                      <p className="text-[10.5pt] text-gray-700">
                        {signatory1Role}
                      </p>
                      {signatory1Document && (
                        <p className="text-[9.5pt] text-gray-600">
                          {signatory1Document}
                        </p>
                      )}
                    </div>

                    {/* Signatário 2 (opcional) */}
                    {hasSignatory2 && (
                      <div className="flex flex-col items-center">
                        {showSignatureLine && (
                          <div className="w-64 border-b border-gray-900 mb-2"></div>
                        )}
                        <p className="font-bold text-[12pt] text-gray-900 uppercase">
                          {signatory2Name}
                        </p>
                        <p className="text-[10.5pt] text-gray-700">
                          {signatory2Role}
                        </p>
                        {signatory2Document && (
                          <p className="text-[9.5pt] text-gray-600">
                            {signatory2Document}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* QR Code no Rodapé - Somente o QR Code */}
                  {showQrCode && qrCodeDataUrl && (
                    <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-start">
                      <div className="p-1 bg-white border border-gray-300 rounded shadow-xs">
                        <img src={qrCodeDataUrl} alt="QR Code" className="w-16 h-16 object-contain block" />
                      </div>
                    </div>
                  )}

                  {/* Numeração de Página no Rodapé da Prévia */}
                  <div className="flex justify-end items-center pt-6 text-[9pt] text-gray-500 font-serif">
                    <span>Página 1 de 1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Quick Action Banner */}
            <div className="bg-[#141414] border border-white/10 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="text-xs text-gray-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ofício formatado: <strong className="text-emerald-400 font-mono">{oficioNumber}</strong></span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handlePrintOficio()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Ofício
                </button>
                <button
                  onClick={() => setVeracityModal({ isOpen: true, oficio: null })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  title="Visualizar e Imprimir Atestado de Veracidade deste Ofício"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Atestado de Veracidade
                </button>
                <button
                  onClick={() => handlePrintOficioWithVeracity()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  title="Imprimir Ofício e Atestado de Veracidade juntos"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Ofício + Atestado
                </button>
                <button
                  onClick={() => handleDownloadPdf()}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Salvar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATES MODAL */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141414] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Modelos Prontos de Ofício</h2>
                    <p className="text-xs text-gray-400">Escolha um modelo institucional para preencher o ofício com 1 clique.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3">
                {TEMPLATES.map(tmpl => (
                  <div
                    key={tmpl.id}
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="p-4 bg-[#0c0c0c] hover:bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {tmpl.title}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {tmpl.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1 italic font-mono mb-2">
                      {tmpl.subject}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {tmpl.paragraphs[0]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10 bg-[#0d0d0d] flex justify-end">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROTOCOL & STATUS MODAL */}
      <AnimatePresence>
        {protocolModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141414] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-emerald-400" />
                  Controle de Protocolo & Tramitação
                </h3>
                <button
                  onClick={() => setProtocolModal({ isOpen: false, oficio: null, status: 'Emitido', protocolNumber: '', notes: '' })}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-400">Ofício:</span>
                  <p className="text-white font-mono font-bold">{protocolModal.oficio?.oficioNumber}</p>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">Status de Tramitação</label>
                  <select
                    value={protocolModal.status}
                    onChange={e => setProtocolModal(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Emitido">Emitido (Criado)</option>
                    <option value="Enviado">Enviado ao Órgão</option>
                    <option value="Protocolado">Protocolado (Recebido com carimbo)</option>
                    <option value="Respondido">Respondido pelo Órgão</option>
                    <option value="Arquivado">Arquivado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">Número de Protocolo / Carimbo</label>
                  <input
                    type="text"
                    value={protocolModal.protocolNumber}
                    onChange={e => setProtocolModal(prev => ({ ...prev, protocolNumber: e.target.value }))}
                    placeholder="Ex: PROT-2026/8942-A ou 042/SEC"
                    className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">Anotações Internas / Tramitação</label>
                  <textarea
                    rows={3}
                    value={protocolModal.notes}
                    onChange={e => setProtocolModal(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Entregue em mãos na recepção do Gabinete em 15/09..."
                    className="w-full px-3 py-2 bg-[#0c0c0c] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setProtocolModal({ isOpen: false, oficio: null, status: 'Emitido', protocolNumber: '', notes: '' })}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProtocolModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VERACITY ATTESTATION MODAL */}
      <AnimatePresence>
        {veracityModal.isOpen && (() => {
          const target: OficioRecord = veracityModal.oficio || {
            id: currentOficioId || 'preview',
            oficioNumber,
            issueDate,
            issueTime: '10:00:00',
            issueCityUf,
            recipientTreatment,
            recipientName,
            recipientRole,
            recipientOrganization,
            recipientAddress,
            subject,
            salutation,
            bodyParagraphs: paragraphs,
            closing,
            signatory1Name,
            signatory1Role,
            signatory1Document,
            hasSignatory2,
            signatory2Name,
            signatory2Role,
            signatory2Document,
            showLogo,
            showEntityData,
            showSeal,
            showSignatureLine,
            showQrCode,
            qrCodeType,
            qrCodeCustomUrl,
            authCode,
            status: oficioStatus,
            protocolNumber,
            notes: internalNotes,
            createdAt: new Date().toISOString()
          };

          const targetDateFormatted = target.issueDate
            ? formatLongDateHelper(target.issueDate, target.issueCityUf || entityConfig?.city)
            : formattedLongDate;

          const docNumClean = (target.oficioNumber || '001-2026').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
          const certNumber = `CERT-VER-${docNumClean}`;
          const qrCodeImage = veracityModalQrCodeUrl || qrCodeDataUrl;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-[#121418] border border-emerald-500/30 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
              >
                {/* Modal Top Header */}
                <div className="p-4 sm:p-5 border-b border-white/10 bg-[#161a22] flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-white">
                          Atestado de Veracidade & Autenticidade
                        </h2>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                          Oficial
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Certificação documental com fé pública e amparo na Lei nº 13.726/2018 e Art. 299 do CP
                      </p>
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handlePrintVeracity(target)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Imprimir somente o Atestado de Veracidade"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir Atestado
                    </button>

                    <button
                      onClick={() => handleDownloadVeracityPdf(target)}
                      disabled={isGeneratingVeracityPdf}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Baixar em PDF"
                    >
                      {isGeneratingVeracityPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Salvar PDF
                    </button>

                    <button
                      onClick={() => handlePrintOficioWithVeracity(target)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Imprimir Ofício e Atestado em duas páginas consecutivas"
                    >
                      <Layers className="w-3.5 h-3.5 text-teal-400" />
                      Ofício + Atestado
                    </button>

                    <button
                      onClick={() => handleCopyVeracityText(target)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Copiar texto formal da certidão"
                    >
                      {veracityCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {veracityCopied ? 'Copiado!' : 'Copiar'}
                    </button>

                    <button
                      onClick={() => setVeracityModal({ isOpen: false, oficio: null })}
                      className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Fechar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Document Preview Area */}
                <div className="p-4 sm:p-6 overflow-y-auto bg-[#0a0c10] flex justify-center">
                  <div
                    ref={veracitySheetRef}
                    className="w-full max-w-[760px] bg-white text-gray-900 shadow-2xl p-8 sm:p-12 font-serif text-left border border-gray-200"
                    style={{ minHeight: '1020px' }}
                  >
                    {/* Header */}
                    <div className="text-center pb-4 mb-5 border-b-2 border-gray-900">
                      {(target.showLogo ?? showLogo) && (
                        entityConfig?.logo ? (
                          <img
                            src={entityConfig.logo}
                            alt="Logo da Associação"
                            className="max-h-16 max-w-[220px] object-contain mx-auto mb-2"
                          />
                        ) : (
                          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-50 border-2 border-emerald-600 flex items-center justify-center text-emerald-600">
                            <ShieldCheck className="w-7 h-7" />
                          </div>
                        )
                      )}
                      <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-gray-900">
                        {entityConfig?.name || 'ASSOCIAÇÃO COMUNITÁRIA'}
                      </h1>
                      {(target.showEntityData ?? showEntityData) && (
                        <div className="text-[9.5pt] text-gray-600 mt-1 space-y-0.5 font-sans">
                          <p>CNPJ: {entityConfig?.cnpj || '00.000.000/0001-00'}</p>
                          <p>{entityConfig?.address || 'Aldeia Serrota - Território Pankararé, Glória - BA'}</p>
                          {(entityConfig?.phone || entityConfig?.email) && (
                            <p>
                              {entityConfig?.phone && `Tel: ${entityConfig.phone}`}
                              {entityConfig?.phone && entityConfig?.email && ' • '}
                              {entityConfig?.email && `E-mail: ${entityConfig.email}`}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Certidão Title Box */}
                    <div className="my-5 p-3.5 bg-emerald-50/70 border-2 border-emerald-600 rounded-lg text-center">
                      <div className="font-sans text-sm sm:text-base font-extrabold text-emerald-800 uppercase tracking-wider">
                        CERTIDÃO DE VERACIDADE E AUTENTICIDADE DOCUMENTAL
                      </div>
                      <div className="font-mono text-xs text-gray-700 mt-1 font-semibold">
                        REGISTRO Nº: {certNumber} • EXPEDIENTE: {target.oficioNumber}
                      </div>
                    </div>

                    {/* Texto Certificatório */}
                    <div className="text-[11pt] leading-relaxed text-justify space-y-3 mb-5">
                      <p style={{ textIndent: '15mm' }}>
                        A Diretoria da <strong>{entityConfig?.name || 'Associação'}</strong>, pessoa jurídica de direito privado sem fins lucrativos, inscrita no CNPJ sob o nº <strong>{entityConfig?.cnpj || '00.000.000/0001-00'}</strong>, com sede em {entityConfig?.address || 'Glória - BA'}, no regular uso de suas atribuições estatutárias e institucionais, sob as expressas cominações do <strong>artigo 299 do Código Penal Brasileiro</strong> (Falsidade Ideológica) e nos termos da <strong>Lei Federal nº 13.726/2018</strong> (Lei de Desburocratização e Presunção de Fé Pública):
                      </p>
                      <p style={{ textIndent: '15mm' }}>
                        <strong>CERTIFICA E ATESTA</strong>, para todos os devidos fins de direito, eficácia jurídica e fé pública perante quaisquer órgãos e entidades da Administração Pública Direta e Indireta em âmbito Municipal, Estadual e Federal, Poder Judiciário, Ministério Público, cartórios e estabelecimentos bancários, que o expediente administrativo oficial:
                      </p>
                      <div className="text-center font-bold text-sm sm:text-base py-2.5 px-4 bg-gray-50 border border-gray-300 rounded font-sans text-gray-900 my-2">
                        {target.oficioNumber}
                      </div>
                      <p style={{ textIndent: '15mm' }}>
                        expedido em <strong>{targetDateFormatted}</strong>, endereçado a <strong>{target.recipientName}</strong> ({target.recipientRole} - {target.recipientOrganization}), com o assunto <em>«{target.subject}»</em> e devidamente subscrito pelo seu signatário legal <strong>{target.signatory1Name}</strong> ({target.signatory1Role}), é <strong>ABSOLUTAMENTE GENUÍNO, VERÍDICO, ÍNTEGRO E AUTÊNTICO</strong>, correspondendo fidedignamente aos registros arquivados no livro próprio de correspondências oficiais desta instituição.
                      </p>
                    </div>

                    {/* Tabela Notarial de Integridade */}
                    <div className="border border-gray-300 rounded-md overflow-hidden my-5 font-sans text-xs">
                      <div className="bg-emerald-700 text-white font-bold px-3 py-1.5 uppercase tracking-wider text-[10px]">
                        Quadro Demonstrativo de Verificação e Integridade Notarial
                      </div>
                      <table className="w-full text-left border-collapse">
                        <tbody>
                          <tr className="border-b border-gray-200">
                            <td className="p-2 font-bold text-gray-600 bg-gray-50 w-1/3">Expediente Certificado:</td>
                            <td className="p-2 font-bold text-gray-900">{target.oficioNumber}</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="p-2 font-bold text-gray-600 bg-gray-50">Código Hash / Autenticação:</td>
                            <td className="p-2 font-mono font-bold text-emerald-700 text-sm">{target.authCode || authCode}</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="p-2 font-bold text-gray-600 bg-gray-50">Destinatário Oficial:</td>
                            <td className="p-2 text-gray-800">{target.recipientName} • {target.recipientRole} ({target.recipientOrganization})</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="p-2 font-bold text-gray-600 bg-gray-50">Assunto Registrado:</td>
                            <td className="p-2 text-gray-800">{target.subject}</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="p-2 font-bold text-gray-600 bg-gray-50">Signatário Titular:</td>
                            <td className="p-2 text-gray-800">
                              {target.signatory1Name} ({target.signatory1Role}) {target.signatory1Document && `• ${target.signatory1Document}`}
                            </td>
                          </tr>
                          {target.hasSignatory2 && target.signatory2Name && (
                            <tr className="border-b border-gray-200">
                              <td className="p-2 font-bold text-gray-600 bg-gray-50">2º Signatário / Co-autor:</td>
                              <td className="p-2 text-gray-800">{target.signatory2Name} ({target.signatory2Role})</td>
                            </tr>
                          )}
                          <tr className="border-b border-gray-200">
                            <td className="p-2 font-bold text-gray-600 bg-gray-50">Data da Expedição:</td>
                            <td className="p-2 text-gray-800">{targetDateFormatted}</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="p-2 font-bold text-gray-600 bg-gray-50">Status de Tramitação:</td>
                            <td className="p-2 font-bold text-emerald-700">{target.status || 'Emitido'} • Documento Válido e Eficaz</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold text-gray-600 bg-gray-50">Conferência Notarial:</td>
                            <td className="p-2 font-bold text-emerald-700">CONFERIDO E ATESTADO CONFORME OS REGISTROS DA ENTIDADE</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p className="text-[10pt] leading-relaxed text-justify mb-4" style={{ textIndent: '15mm' }}>
                      Por ser expressão solene da verdade, firma-se a presente Certidão de Veracidade e Autenticidade Documental para que produza todos os efeitos legais cabíveis.
                    </p>

                    <div className="text-right text-[11pt] mb-8 font-serif">
                      {targetDateFormatted}.
                    </div>

                    {/* Assinaturas */}
                    <div className="flex justify-center items-end gap-8 mb-6 text-center">
                      <div className="flex-1 max-w-[260px]">
                        <div className="w-48 border-b border-gray-900 mx-auto mb-2"></div>
                        <p className="font-bold text-[11pt] uppercase text-gray-900">{target.signatory1Name}</p>
                        <p className="text-[10pt] text-gray-700">{target.signatory1Role}</p>
                        {target.signatory1Document && <p className="text-[9pt] text-gray-500">{target.signatory1Document}</p>}
                        <p className="text-[8pt] text-emerald-700 font-bold font-sans mt-1">REPRESENTANTE LEGAL CERTIFICANTE</p>
                      </div>
                      {target.hasSignatory2 && target.signatory2Name && (
                        <div className="flex-1 max-w-[260px]">
                          <div className="w-48 border-b border-gray-900 mx-auto mb-2"></div>
                          <p className="font-bold text-[11pt] uppercase text-gray-900">{target.signatory2Name}</p>
                          <p className="text-[10pt] text-gray-700">{target.signatory2Role}</p>
                          {target.signatory2Document && <p className="text-[9pt] text-gray-500">{target.signatory2Document}</p>}
                        </div>
                      )}
                    </div>

                    {/* QR Code Rodapé - Somente a imagem do QR Code */}
                    {(target.showQrCode ?? showQrCode) && qrCodeImage && (
                      <div className="mt-6 pt-3 border-t border-gray-200 flex items-center justify-start">
                        <div className="p-1 bg-white border border-gray-300 rounded shadow-xs">
                          <img src={qrCodeImage} alt="QR Code de Verificação" className="w-16 h-16 object-contain block" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141414] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Excluir Ofício?</h3>
              <p className="text-xs text-gray-400">
                Tem certeza que deseja excluir o registro de <strong>{deleteConfirmation.oficioNumber}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmation({ isOpen: false })}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
