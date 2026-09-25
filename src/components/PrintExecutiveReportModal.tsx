import React, { useState, useEffect } from 'react';
import { HealthProposal } from '../types';
import { exportToExcelCSV } from '../utils/exporter';
import {
  Printer,
  X,
  Building2,
  PhoneCall,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Stethoscope,
  UserCheck,
  FileText,
  Copy,
  Check,
  Filter,
  Download,
  Share2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

interface PrintExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: HealthProposal[];
  totalRawRowsCount: number;
  initialBroker?: string;
  onSelectProposal?: (proposal: HealthProposal) => void;
}

export const PrintExecutiveReportModal: React.FC<PrintExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  proposals,
  totalRawRowsCount,
  initialBroker,
  onSelectProposal,
}) => {
  const [selectedBroker, setSelectedBroker] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [includePhoneScript, setIncludePhoneScript] = useState<boolean>(true);
  const [pageBreakPerBroker, setPageBreakPerBroker] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [copiedAllReport, setCopiedAllReport] = useState<boolean>(false);

  // Sync initialBroker if provided
  useEffect(() => {
    if (initialBroker && initialBroker.trim() !== '') {
      setSelectedBroker(initialBroker);
    } else {
      setSelectedBroker('ALL');
    }
  }, [initialBroker, isOpen]);

  if (!isOpen) return null;

  // Extract unique brokerages and statuses
  const brokerList = Array.from(
    new Set(proposals.map(p => p.corretora).filter(Boolean))
  ).sort();

  const statusList = Array.from(
    new Set(proposals.map(p => p.statusCliente).filter(Boolean))
  ).sort();

  // Filter proposals according to modal selection
  const filteredProposals = proposals.filter(p => {
    if (selectedBroker !== 'ALL' && p.corretora !== selectedBroker) return false;
    if (selectedStatus !== 'ALL' && p.statusCliente !== selectedStatus) return false;
    return true;
  });

  // Calculate Executive Indicators on the filtered set
  const totalSaude = filteredProposals.length;
  const validacaoExtramed = filteredProposals.filter(p => p.categoriaPendencia === 'VALIDACAO').length;
  const entrevistaMedica = filteredProposals.filter(p => p.categoriaPendencia === 'ENTREVISTA').length;
  const assinaturasPendentes = filteredProposals.filter(p => p.categoriaPendencia === 'ASSINATURA').length;
  const aguardandoCPT = filteredProposals.filter(p => p.categoriaPendencia === 'CPT').length;
  const informativoEnviado = filteredProposals.filter(p => p.categoriaPendencia === 'INFORMATIVO').length;
  const criticos = filteredProposals.filter(p => p.urgencia === 'CRITICO').length;
  const alertas = filteredProposals.filter(p => p.urgencia === 'ALERTA').length;
  const mediaDias = totalSaude > 0
    ? (filteredProposals.reduce((acc, curr) => acc + curr.diasNoStatus, 0) / totalSaude).toFixed(1)
    : '0';

  // Group proposals by Broker, then by Status
  const brokerGroupsMap = new Map<string, HealthProposal[]>();
  for (const p of filteredProposals) {
    const b = p.corretora || 'SEM CORRETORA INFORMADA';
    if (!brokerGroupsMap.has(b)) {
      brokerGroupsMap.set(b, []);
    }
    brokerGroupsMap.get(b)!.push(p);
  }

  // Sort brokers by number of proposals descending
  const sortedBrokers = Array.from(brokerGroupsMap.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const filename = selectedBroker !== 'ALL'
      ? `pendencias_${selectedBroker.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      : `dossie_pendencias_extramed_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToExcelCSV(filteredProposals, filename);
  };

  const getStatusActionGuideline = (status: string): string => {
    const s = status.toUpperCase();
    if (s.includes('ENTREVISTA')) {
      return 'Ligar urgente para o corretor/cliente: cobrar realização da tele-entrevista médica da operadora antes da virada de vigência.';
    }
    if (s.includes('CPT')) {
      return 'Segurado precisa dar o aceite eletrônico na Cobertura Parcial Temporária (Agravo) para liberar o contrato.';
    }
    if (s.includes('ASSINATURA')) {
      return 'Cobrar corretora/consultor: contrato aguarda assinatura digital do cliente ou consultor no sistema GCP.';
    }
    if (s.includes('VALIDAÇÃO') || s.includes('VALIDACAO')) {
      return 'Acompanhar validação interna da documentação de elegibilidade e certidões na Extramed.';
    }
    if (s.includes('INFORMATIVO')) {
      return 'Informativo enviado ao cliente. Confirmar ativação e recebimento das boas-vindas do plano.';
    }
    if (s.includes('ANEXOS')) {
      return 'Pendente reenvio de anexos e documentos comprobatórios de vínculo com a entidade estipulante.';
    }
    return 'Entrar em contato com o corretor responsável para verificar o andamento e destravar a emissão.';
  };

  const generatePhoneCallScript = (brokerName: string, brokerProps: HealthProposal[]): string => {
    const entrevistas = brokerProps.filter(p => p.categoriaPendencia === 'ENTREVISTA');
    const cpts = brokerProps.filter(p => p.categoriaPendencia === 'CPT');
    const assinaturas = brokerProps.filter(p => p.categoriaPendencia === 'ASSINATURA');
    const validacoes = brokerProps.filter(p => p.categoriaPendencia === 'VALIDACAO');

    let text = `ROTEIRO DE LIGAÇÃO TELEFÔNICA - ${brokerName}\n`;
    text += `Contato com: Responsável Comercial / Consultores\n`;
    text += `Total de propostas com pendências: ${brokerProps.length}\n`;
    text += `Vigência Pretendida: 01/10/2026\n\n`;
    text += `PONTOS CRÍTICOS A COBRAR NA LIGAÇÃO:\n`;

    if (entrevistas.length > 0) {
      text += `\n🚨 ENTREVISTA MÉDICA PENDENTE (${entrevistas.length} propostas):\n`;
      entrevistas.forEach(e => {
        text += `   - Cliente: ${e.nomeCliente} | Proposta: #${e.numeroSaude} | Há ${e.diasNoStatus} dias | Operadora: ${e.operadoraSaude} (Corretor: ${e.usuario})\n`;
      });
      text += `   -> Orientação para falar na ligação: Solicitar que o corretor ligue para o segurado imediatamente para realizar a tele-entrevista médica da operadora.\n`;
    }

    if (cpts.length > 0) {
      text += `\n⚠️ AGUARDANDO ACEITE DE CPT (${cpts.length} propostas):\n`;
      cpts.forEach(c => {
        text += `   - Cliente: ${c.nomeCliente} | Proposta: #${c.numeroSaude} | Há ${c.diasNoStatus} dias (Corretor: ${c.usuario})\n`;
      });
      text += `   -> Orientação para falar na ligação: Segurado precisa assinar o termo de CPT no portal para prosseguir.\n`;
    }

    if (assinaturas.length > 0) {
      text += `\n✍️ CONTRATOS AGUARDANDO ASSINATURA (${assinaturas.length} propostas):\n`;
      assinaturas.forEach(a => {
        text += `   - Cliente: ${a.nomeCliente} | Proposta: #${a.numeroSaude} | Há ${a.diasNoStatus} dias (Corretor: ${a.usuario})\n`;
      });
      text += `   -> Orientação para falar na ligação: Assinar contrato digitalmente no portal.\n`;
    }

    if (validacoes.length > 0) {
      text += `\n📋 EM VALIDAÇÃO EXTRAMED (${validacoes.length} propostas):\n`;
      validacoes.forEach(v => {
        text += `   - Cliente: ${v.nomeCliente} | Proposta: #${v.numeroSaude} (Corretor: ${v.usuario})\n`;
      });
      text += `   -> Orientação: Triagem documental em andamento.\n`;
    }

    text += `\n--------------------------------------------------\n`;
    text += `Data da Ligação: ____/____/2026 | Hora: ____:____\n`;
    text += `Contato na Corretora: _____________________________\n`;
    text += `Acordo / Prazo firmado: ___________________________\n`;
    return text;
  };

  const handleCopyScript = (brokerName: string, brokerProps: HealthProposal[]) => {
    const script = generatePhoneCallScript(brokerName, brokerProps);
    navigator.clipboard.writeText(script);
    setCopiedScript(brokerName);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  const handleCopyAllReport = () => {
    let fullText = `DOSSIÊ CONSOLIDADO DE PENDÊNCIAS POR CORRETORA - EXTRAMED\n`;
    fullText += `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}\n`;
    fullText += `Total de Propostas de Saúde: ${totalSaude}\n`;
    fullText += `Total de Corretoras Envolvidas: ${sortedBrokers.length}\n`;
    fullText += `==================================================\n\n`;

    sortedBrokers.forEach(([brokerName, brokerProps], index) => {
      fullText += `[${index + 1}] ${brokerName.toUpperCase()} (${brokerProps.length} propostas)\n`;
      fullText += generatePhoneCallScript(brokerName, brokerProps);
      fullText += `\n==================================================\n\n`;
    });

    navigator.clipboard.writeText(fullText);
    setCopiedAllReport(true);
    setTimeout(() => setCopiedAllReport(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print-modal-backdrop">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col print-dialog-container">
        {/* TOP ACTION BAR (Hidden on print) */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 sticky top-0 bg-white z-20 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Dossiê Executivo de Pendências para Impressão & Cobrança
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Pronto para Impressão A4
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Indicadores do dashboard + Lista separada por <strong>Corretora e Status</strong> para ligar e informar cada pendência
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy full report */}
            <button
              onClick={handleCopyAllReport}
              title="Copiar relatório completo de todas as corretoras em formato texto"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {copiedAllReport ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Relatório Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copiar Roteiro Geral</span>
                </>
              )}
            </button>

            {/* Export Excel Button alongside */}
            <button
              onClick={handleExportExcel}
              title="Exportar dados deste dossiê para Excel (.CSV)"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>

            {/* Direct Print Button */}
            <button
              onClick={handlePrint}
              title="Imprimir relatório em papel ou salvar diretamente como PDF"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FILTER & CONFIGURATION CONTROLS BAR (Hidden on print) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Broker */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Corretora:
              </span>
              <select
                value={selectedBroker}
                onChange={e => setSelectedBroker(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[240px] truncate"
              >
                <option value="ALL">Todas as Corretoras ({brokerList.length})</option>
                {brokerList.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Status:</span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[220px] truncate"
              >
                <option value="ALL">Todos os Status ({statusList.length})</option>
                {statusList.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle phone checklist / script */}
            <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={includePhoneScript}
                onChange={e => setIncludePhoneScript(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>Checklist & Roteiro de Ligação</span>
            </label>

            {/* Toggle page break per broker */}
            <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer" title="Ao imprimir, cada corretora iniciará em uma nova página">
              <input
                type="checkbox"
                checked={pageBreakPerBroker}
                onChange={e => setPageBreakPerBroker(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>1 Corretora por Folha (Quebra de Página)</span>
            </label>
          </div>

          <div className="text-[11px] text-slate-600 font-medium">
            Exibindo <strong className="font-mono text-slate-900">{filteredProposals.length}</strong> propostas em <strong className="font-mono text-slate-900">{sortedBrokers.length}</strong> {sortedBrokers.length === 1 ? 'corretora' : 'corretoras'}
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white">
          {/* EXECUTIVE HEADER BANNER */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold text-blue-800 uppercase tracking-widest flex items-center gap-1.5">
                  <span>EXTRAMED ADMINISTRADORA DE BENEFÍCIOS</span>
                  <span>·</span>
                  <span>GESTÃO COMERCIAL & PARCEIROS</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  Dossiê de Gestão de Pendências & Ações com Corretores
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Painel de Indicadores Consolidados + Relação Detalhada Separada por <strong>Corretora Parceira</strong> e <strong>Status da Proposta</strong>
                </p>
              </div>

              <div className="text-left sm:text-right text-xs space-y-0.5 border-l-2 sm:border-l-0 sm:border-r-0 border-blue-600 pl-3 sm:pl-0">
                <div className="font-semibold text-slate-800">
                  Data de Emissão: <span className="font-mono font-bold">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="text-slate-600">
                  Vigência Alvo de Adesão: <strong className="text-slate-900 font-mono">01/10/2026</strong>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Filtro Inteligente: <span className="font-medium text-slate-700">Apenas Contratos Saúde (Odonto & MAC Vinculados)</span>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 1: INDICADORES DO DASHBOARD (KPIS EXECUTIVOS) */}
          <div className="space-y-3 print-avoid-break">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>1. Indicadores do Dashboard (Visão Consolidada de Pendências)</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                SLA Médio Geral: <strong className="text-slate-900">{mediaDias} dias</strong> | Críticos (&gt;7 dias): <strong className="text-rose-700">{criticos}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* Total Proposals */}
              <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/70">
                <span className="text-[11px] text-slate-600 block font-medium">Total Propostas</span>
                <span className="text-xl font-bold font-mono text-slate-900">{totalSaude}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Contratos saúde ativos</span>
              </div>

              {/* Validação Extramed */}
              <div className="border border-indigo-200 rounded-lg p-2.5 bg-indigo-50/40">
                <span className="text-[11px] text-indigo-900 font-semibold block">Validação Extramed</span>
                <span className="text-xl font-bold font-mono text-indigo-950">{validacaoExtramed}</span>
                <span className="text-[10px] text-indigo-700 block mt-0.5">Triagem de documentos</span>
              </div>

              {/* Entrevista Médica */}
              <div className="border border-amber-300 rounded-lg p-2.5 bg-amber-50/60">
                <span className="text-[11px] text-amber-900 font-bold block flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-amber-600" />
                  Entrevista Médica
                </span>
                <span className="text-xl font-bold font-mono text-amber-950">{entrevistaMedica}</span>
                <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">Prioridade de Ligação</span>
              </div>

              {/* Assinatura Pendente */}
              <div className="border border-sky-200 rounded-lg p-2.5 bg-sky-50/40">
                <span className="text-[11px] text-sky-900 font-semibold block flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-600" />
                  Assinatura Contrato
                </span>
                <span className="text-xl font-bold font-mono text-sky-950">{assinaturasPendentes}</span>
                <span className="text-[10px] text-sky-700 block mt-0.5">Cliente ou Corretora</span>
              </div>

              {/* Aceite CPT */}
              <div className="border border-purple-200 rounded-lg p-2.5 bg-purple-50/40">
                <span className="text-[11px] text-purple-900 font-bold block flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-purple-600" />
                  Aceite de CPT
                </span>
                <span className="text-xl font-bold font-mono text-purple-950">{aguardandoCPT}</span>
                <span className="text-[10px] text-purple-800 font-semibold block mt-0.5">Cobertura Parcial</span>
              </div>

              {/* Informativo Enviado */}
              <div className="border border-emerald-200 rounded-lg p-2.5 bg-emerald-50/40">
                <span className="text-[11px] text-emerald-900 font-semibold block flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Informativo Enviado
                </span>
                <span className="text-xl font-bold font-mono text-emerald-950">{informativoEnviado}</span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Fase de liberação final</span>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: MATRIZ DE CONCENTRAÇÃO POR CORRETORA (VISÃO RESUMIDA) */}
          {selectedBroker === 'ALL' && (
            <div className="space-y-2.5 print-avoid-break">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>2. Matriz de Concentração de Pendências por Corretora Parceira</span>
              </h2>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                      <th className="py-2 px-3">CORRETORA PARCEIRA</th>
                      <th className="py-2 px-3 text-center">TOTAL</th>
                      <th className="py-2 px-3 text-center font-bold text-amber-900">ENTREVISTA</th>
                      <th className="py-2 px-3 text-center text-sky-900">ASSINATURA</th>
                      <th className="py-2 px-3 text-center text-purple-900">CPT</th>
                      <th className="py-2 px-3 text-center text-slate-700">VALIDAÇÃO</th>
                      <th className="py-2 px-3">AÇÃO RECOMENDADA NA LIGAÇÃO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedBrokers.map(([brokerName, bProps]) => {
                      const countEntrevista = bProps.filter(p => p.categoriaPendencia === 'ENTREVISTA').length;
                      const countAssinatura = bProps.filter(p => p.categoriaPendencia === 'ASSINATURA').length;
                      const countCPT = bProps.filter(p => p.categoriaPendencia === 'CPT').length;
                      const countValidacao = bProps.filter(p => p.categoriaPendencia === 'VALIDACAO').length;

                      let principalAcao = 'Acompanhar validação cadastral';
                      if (countEntrevista > 0) principalAcao = 'Ligar urgente: cobrar realização da tele-entrevista médica';
                      else if (countCPT > 0) principalAcao = 'Ligar: cobrar aceite de CPT pelo segurado';
                      else if (countAssinatura > 0) principalAcao = 'Cobrar assinatura digital pendente no contrato';

                      return (
                        <tr key={brokerName} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-bold text-slate-900">{brokerName}</td>
                          <td className="py-2 px-3 text-center font-bold font-mono text-slate-900">{bProps.length}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-amber-800">
                            {countEntrevista > 0 ? countEntrevista : '-'}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-sky-800">
                            {countAssinatura > 0 ? countAssinatura : '-'}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-semibold text-purple-800">
                            {countCPT > 0 ? countCPT : '-'}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-slate-600">
                            {countValidacao > 0 ? countValidacao : '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-700 text-[11px] font-medium">{principalAcao}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SEÇÃO 3: RELAÇÃO OPERACIONAL DETALHADA (POR CORRETORA E POR STATUS) */}
          <div className="space-y-6 pt-2">
            <div className="border-b-2 border-slate-900 pb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span>3. Relação Operacional para Contato & Cobrança (Por Corretora & Status)</span>
                <span className="text-xs font-normal text-slate-500 font-sans">
                  Utilize esta lista para ligar para cada corretora e informar as pendências de cada proposta
                </span>
              </h2>
            </div>

            {sortedBrokers.map(([brokerName, brokerProps], brokerIndex) => {
              // Group proposals of this broker by statusCliente
              const statusMap = new Map<string, HealthProposal[]>();
              for (const p of brokerProps) {
                const st = p.statusCliente || 'Outros';
                if (!statusMap.has(st)) {
                  statusMap.set(st, []);
                }
                statusMap.get(st)!.push(p);
              }

              // Extract unique consultants for this broker
              const consultores = Array.from(new Set(brokerProps.map(p => p.usuario).filter(Boolean))).join(', ');

              return (
                <div
                  key={brokerName}
                  className={`border-2 border-slate-300 rounded-xl p-4 sm:p-5 space-y-4 bg-white ${
                    pageBreakPerBroker ? 'print-page-break' : 'print-avoid-break'
                  }`}
                >
                  {/* Broker Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 bg-slate-50 -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 p-4 rounded-t-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded">
                          CORRETORA #{brokerIndex + 1}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{brokerName}</h3>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>Corretores / Consultores:</strong> {consultores || 'Não especificado'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Propostas Pendentes</span>
                        <span className="text-lg font-black font-mono text-slate-900">
                          {brokerProps.length} {brokerProps.length === 1 ? 'proposta' : 'propostas'}
                        </span>
                      </div>

                      {/* Quick copy script button (no-print) */}
                      <button
                        onClick={() => handleCopyScript(brokerName, brokerProps)}
                        className="no-print inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-xs transition-colors ml-2 cursor-pointer"
                        title="Copiar roteiro telefônico e lista para o WhatsApp desta corretora"
                      >
                        {copiedScript === brokerName ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Roteiro Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Roteiro WhatsApp</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Proposals Grouped by Status inside this Broker */}
                  <div className="space-y-4">
                    {Array.from(statusMap.entries()).map(([statusName, statusProps]) => {
                      const guideline = getStatusActionGuideline(statusName);
                      const isHighPriority =
                        statusName.toUpperCase().includes('ENTREVISTA') ||
                        statusName.toUpperCase().includes('CPT') ||
                        statusName.toUpperCase().includes('ASSINATURA');

                      return (
                        <div key={statusName} className="border border-slate-200 rounded-lg overflow-hidden">
                          {/* Status Sub-header */}
                          <div
                            className={`px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-semibold ${
                              isHighPriority
                                ? 'bg-amber-50/80 border-b border-amber-200 text-amber-950'
                                : 'bg-slate-100/80 border-b border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {statusName.toUpperCase().includes('ENTREVISTA') && (
                                <Stethoscope className="w-4 h-4 text-amber-600" />
                              )}
                              {statusName.toUpperCase().includes('CPT') && (
                                <AlertTriangle className="w-4 h-4 text-purple-600" />
                              )}
                              {statusName.toUpperCase().includes('ASSINATURA') && (
                                <Clock className="w-4 h-4 text-sky-600" />
                              )}
                              <span className="font-bold">STATUS: {statusName}</span>
                              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-300 font-bold">
                                {statusProps.length} {statusProps.length === 1 ? 'proposta' : 'propostas'}
                              </span>
                            </div>

                            <span className="text-[11px] font-normal text-slate-600 italic">
                              <strong>Ação na Ligação:</strong> {guideline}
                            </span>
                          </div>

                          {/* Table of Proposals with this status */}
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-[10px] text-slate-500 font-semibold border-b border-slate-200">
                                <th className="py-1.5 px-3 font-mono">Nº PROPOSTA</th>
                                <th className="py-1.5 px-3">CLIENTE / BENEFICIÁRIO</th>
                                <th className="py-1.5 px-3">OPERADORA & ENTIDADE</th>
                                <th className="py-1.5 px-3 font-mono text-center">SLA (DIAS)</th>
                                <th className="py-1.5 px-3">BENEFÍCIOS VINCULADOS</th>
                                <th className="py-1.5 px-3 text-right">REGISTRO DA LIGAÇÃO</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {statusProps.map(p => {
                                const odonto = p.produtosAuxiliares.find(a => a.tipo === 'ODONTO')?.numero;
                                const mac = p.produtosAuxiliares.find(a => a.tipo === 'VIDA_MAC')?.numero;

                                return (
                                  <tr key={p.id} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                      #{p.numeroSaude}
                                      <span className="block text-[10px] text-slate-400 font-sans font-normal">
                                        Desde {p.dataPresenteStatus}
                                      </span>
                                    </td>

                                    <td className="py-2 px-3">
                                      <div className="font-bold text-slate-900">{p.nomeCliente}</div>
                                      <div className="text-[10px] text-slate-500">
                                        Corretor: <strong className="text-slate-700">{p.usuario}</strong>
                                      </div>
                                    </td>

                                    <td className="py-2 px-3">
                                      <div className="font-medium text-slate-800 truncate max-w-[200px]" title={p.operadoraSaude}>
                                        {p.operadoraSaude}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate max-w-[200px]" title={p.entidade}>
                                        {p.entidade}
                                      </div>
                                    </td>

                                    <td className="py-2 px-3 text-center font-mono font-bold whitespace-nowrap">
                                      <span
                                        className={
                                          p.diasNoStatus >= 8
                                            ? 'text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded'
                                            : p.diasNoStatus >= 4
                                            ? 'text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded'
                                            : 'text-slate-800'
                                        }
                                      >
                                        {p.diasNoStatus} dias
                                      </span>
                                    </td>

                                    <td className="py-2 px-3 text-[11px] font-mono text-slate-600 whitespace-nowrap">
                                      {odonto ? <span className="block text-[10px] text-indigo-700">Odonto: #{odonto}</span> : null}
                                      {mac ? <span className="block text-[10px] text-teal-700">Seguro MAC: #{mac}</span> : null}
                                      {!odonto && !mac ? <span className="text-[10px] text-slate-400">-</span> : null}
                                    </td>

                                    <td className="py-2 px-3 text-right">
                                      <div className="text-[10px] text-slate-600 border border-slate-300 rounded p-1 inline-block text-left bg-slate-50/50">
                                        <div>[ ] Ligado em: ___/___</div>
                                        <div>[ ] Sucesso [ ] Recado</div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>

                  {/* Call Log & Notes Area (Printed for phone calls) */}
                  {includePhoneScript && (
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/70 text-xs space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                          Roteiro & Registro da Chamada Telefônica:
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Preencher durante o contato com a corretora
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                        <em>
                          "Olá, falo da Extramed Comercial. Estou acompanhando as propostas da {brokerName} para a vigência de 01/10/2026.
                          Identificamos {brokerProps.length} propostas com pendências que precisamos resolver hoje para não perder o prazo de vigência..."
                        </em>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600 pt-1">
                        <div>
                          <strong>Pessoa de Contato na Corretora:</strong> ___________________________________________
                        </div>
                        <div>
                          <strong>Data/Hora do Contato:</strong> _____/_____/2026 às _____:_____
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        <strong>Compromisso / Prazo assumido pelo parceiro:</strong>
                        <div className="border-b border-dotted border-slate-400 mt-3 h-4" />
                        <div className="border-b border-dotted border-slate-400 mt-3 h-4" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* FOOTER OF THE REPORT */}
          <div className="border-t border-slate-300 pt-4 text-center text-xs text-slate-500 print-avoid-break">
            <p className="font-medium text-slate-700">
              Extramed Administradora de Benefícios · Gestão de Pendências de Vendas
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Documento confidencial para uso interno da equipe comercial e relacionamento com parceiros corretores.
            </p>
          </div>
        </div>

        {/* MODAL FOOTER CONTROLS (Hidden on print) */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between no-print sticky bottom-0 z-20">
          <span className="text-xs text-slate-500">
            Dica: Ao clicar em "Imprimir / Salvar PDF", você pode escolher salvar como PDF no menu de destino da impressora.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Fechar
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
