import React, { useState } from 'react';
import { 
  ShieldCheck, CheckCircle2, Copy, Check, Printer, 
  ArrowLeft, FileText, Lock, Calendar, MapPin, 
  Users, Award, ExternalLink
} from 'lucide-react';

interface PublicDeclarationValidatorProps {
  authCode?: string;
  docNumber?: string;
  personName?: string;
  cpf?: string;
  ethnicity?: string;
  village?: string;
  originCityUf?: string;
  issueDate?: string;
  farmArea?: string;
  sig1Name?: string;
  sig1Role?: string;
  sig2Name?: string;
  sig2Role?: string;
  sig3Name?: string;
  sig3Role?: string;
  docType?: 'declaracao' | 'oficio';
  onClose?: () => void;
  isModal?: boolean;
}

export default function PublicDeclarationValidator({
  authCode = 'PANK-8492-2026',
  docNumber = 'DEC-PANK-2026/001',
  personName = 'Associado / Beneficiário Indígena',
  cpf = '000.000.000-00',
  ethnicity = 'PANKARARÉ',
  village = 'Aldeia Serrota',
  originCityUf = 'Glória - BA',
  issueDate = new Date().toLocaleDateString('pt-BR'),
  farmArea = '2,00',
  sig1Name = 'MARIA DAS DORES SILVA',
  sig1Role = 'CACIQUE',
  sig2Name = 'JOSÉ ANTÔNIO DE ALMEIDA',
  sig2Role = 'LIDERANÇA',
  sig3Name = 'GAEL OLIVEIRA DE JESUS',
  sig3Role = 'LIDERANÇA',
  docType = 'declaracao',
  onClose,
  isModal = false
}: PublicDeclarationValidatorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(authCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className={`min-h-screen bg-[#0d1117] text-gray-100 flex flex-col justify-between ${isModal ? 'p-0' : 'p-4 sm:p-8'}`}>
      <div className="max-w-3xl w-full mx-auto space-y-6">
        {/* Top Bar / Navigation */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Portal de Validação de Autenticidade
              </h1>
              <p className="text-xs text-gray-400">
                Consulta Oficial de Documentos Tradicionais Indígenas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintCertificate}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-medium border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Imprimir Certidão de Validação"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir Certidão</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            )}
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="bg-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-emerald-500/10 pointer-events-none">
            <ShieldCheck className="w-48 h-48" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Documento Autêntico e Válido
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {docType === 'oficio'
                ? `OFÍCIO OFICIAL & ATESTADO DE VERACIDADE`
                : `DECLARAÇÃO INDÍGENA – ETNIA ${ethnicity.toUpperCase()}`}
            </h2>

            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed max-w-2xl">
              {docType === 'oficio' ? (
                <>
                  Este expediente administrativo e sua respectiva <strong>Certidão de Veracidade e Autenticidade</strong> foram emitidos e registrados pela Diretoria Executiva da entidade, com presunção legal de veracidade nos termos da <strong>Lei Federal nº 13.726/2018</strong> e sob as penas do <strong>artigo 299 do Código Penal Brasileiro</strong>.
                </>
              ) : (
                <>
                  Este documento foi emitido legitimamente pela autoridade tradicional do Povo Indígena {ethnicity}, 
                  conferindo reconhecimento de pertencimento étnico e territorial nos termos dos 
                  <strong> Arts. 215, 216, 231 e 232 da Constituição Federal de 1988</strong> e da 
                  <strong> Convenção nº 169 da Organização Internacional do Trabalho (OIT)</strong>.
                </>
              )}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-emerald-300/80">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Chave de Segurança: 
                <strong className="text-white bg-black/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  {authCode}
                </strong>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1 hover:text-white transition-colors cursor-pointer"
                  title="Copiar Código"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </span>
              <span>•</span>
              <span>Registro: <strong className="text-white">{docNumber}</strong></span>
              <span>•</span>
              <span>Emissão: <strong className="text-white">{issueDate}</strong></span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="bg-[#141820] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              {docType === 'oficio' ? 'Dados do Expediente e Verificação Notarial' : 'Dados do Titular e Reconhecimento Étnico'}
            </h3>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-mono">
              Conferência Notarial Digital
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#0f1218] p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider block">
                {docType === 'oficio' ? 'Destinatário / Órgão Oficial:' : 'Nome do Beneficiário:'}
              </span>
              <p className="text-white font-bold text-sm sm:text-base uppercase">{personName}</p>
            </div>

            <div className="bg-[#0f1218] p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider block">Inscrição no CPF:</span>
              <p className="text-white font-mono font-bold text-sm sm:text-base">{cpf}</p>
            </div>

            <div className="bg-[#0f1218] p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider block">Povo / Etnia:</span>
              <p className="text-emerald-400 font-bold">{ethnicity}</p>
            </div>

            <div className="bg-[#0f1218] p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider block">Aldeia e Território:</span>
              <p className="text-white font-semibold">{village} • Terra Indígena Pankararé</p>
            </div>

            <div className="bg-[#0f1218] p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider block">Município e Estado:</span>
              <p className="text-white font-semibold">{originCityUf}</p>
            </div>

            <div className="bg-[#0f1218] p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider block">Área de Agricultura Familiar:</span>
              <p className="text-white font-semibold">{farmArea} Hectares (Atividades de Subsistência)</p>
            </div>
          </div>

          {/* Signatories Section */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Signatários Tradicionais Reconhecidos:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0f1218] p-3 rounded-xl border border-white/5">
                <span className="text-emerald-400 font-bold block">{sig1Role}</span>
                <span className="text-white font-semibold uppercase block truncate">{sig1Name}</span>
                <span className="text-gray-400 text-[10px] block">Assinatura Certificada</span>
              </div>
              <div className="bg-[#0f1218] p-3 rounded-xl border border-white/5">
                <span className="text-emerald-400 font-bold block">{sig2Role}</span>
                <span className="text-white font-semibold uppercase block truncate">{sig2Name}</span>
                <span className="text-gray-400 text-[10px] block">Assinatura Certificada</span>
              </div>
              <div className="bg-[#0f1218] p-3 rounded-xl border border-white/5">
                <span className="text-emerald-400 font-bold block">{sig3Role}</span>
                <span className="text-white font-semibold uppercase block truncate">{sig3Name}</span>
                <span className="text-gray-400 text-[10px] block">Assinatura Certificada</span>
              </div>
            </div>
          </div>

          {/* Legal references */}
          <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-[11px] text-gray-400 space-y-1">
            <div className="font-bold text-gray-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Amparo Legal e Validade Perante Órgãos Públicos:
            </div>
            <p className="leading-relaxed">
              Válido para fins de instrução probatória perante o <strong>INSS</strong> (segurado especial - indígena agricultor), 
              <strong> FUNAI</strong>, bancos oficiais (PRONAF / Crédito Rural), <strong>Receita Federal</strong>, 
              estabelecimentos de ensino e órgãos do Poder Judiciário.
              Homologação da Terra Indígena: Decreto Federal de 5 de Janeiro de 1996 (Área total: 29.597,3322 hectares).
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-gray-500 py-3 space-y-1">
          <p>Sistema de Gestão e Certificação Eletrônica Indígena • Validação Pública Instantânea por QR Code</p>
          <p className="text-[10px] text-gray-600 font-mono">HASH: {authCode} • PROTOCOLO SEGURO TLS 1.3</p>
        </div>
      </div>
    </div>
  );
}
