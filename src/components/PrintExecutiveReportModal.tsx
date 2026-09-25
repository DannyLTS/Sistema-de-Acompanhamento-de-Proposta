import React, { useState, useEffect } from 'react';
import { HealthProposal } from '../types';
import { exportToExcelCSV } from '../utils/exporter';
import {
  X,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Stethoscope,
  FileText,
  Copy,
  Check,
  Download,
  FileDown,
} from 'lucide-react';

interface PrintExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: HealthProposal[];
  totalRawRowsCount?: number;
  initialBroker?: string;
  onSelectProposal?: (proposal: HealthProposal) => void;
}

export const PrintExecutiveReportModal: React.FC<PrintExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  proposals,
  initialBroker,
}) => {
  const [selectedBroker, setSelectedBroker] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [pageBreakPerBroker, setPageBreakPerBroker] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [copiedAllReport, setCopiedAllReport] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Accurate Emission Timestamp with date and time
  const [emissionTimestamp] = useState<string>(() => {
    const d = new Date();
    const dateStr = d.toLocaleDateString('pt-BR');
    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} às ${timeStr}`;
  });

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
  const informativoEnviado = filteredProposals.filter(
    p => p.statusCliente.toUpperCase().includes('INFORMATIVO') || p.categoriaPendencia === 'INFORMATIVO'
  ).length;
  const entrevistaMedica = filteredProposals.filter(
    p => p.statusCliente.toUpperCase().includes('ENTREVISTA') || p.categoriaPendencia === 'ENTREVISTA'
  ).length;
  const assinaturasPendentes = filteredProposals.filter(
    p => p.statusCliente.toUpperCase().includes('ASSINATURA') || p.categoriaPendencia === 'ASSINATURA'
  ).length;
  const aguardandoCPT = filteredProposals.filter(
    p => p.statusCliente.toUpperCase().includes('CPT') || p.categoriaPendencia === 'CPT'
  ).length;
  const validacaoExtramed = filteredProposals.filter(
    p =>
      (p.statusCliente.toUpperCase().includes('VALIDA') ||
        p.statusCliente.toUpperCase().includes('DADOS') ||
        p.categoriaPendencia === 'VALIDACAO') &&
      !p.statusCliente.toUpperCase().includes('INFORMATIVO')
  ).length;

  const criticos = filteredProposals.filter(p => p.urgencia === 'CRITICO').length;
  const mediaDias =
    totalSaude > 0
      ? (filteredProposals.reduce((acc, curr) => acc + curr.diasNoStatus, 0) / totalSaude).toFixed(1)
      : '0';

  // Group proposals by Broker
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

  // Status priority for sorting rows compactly
  const getStatusPriority = (status: string): number => {
    const s = status.toUpperCase();
    if (s.includes('ENTREVISTA')) return 1;
    if (s.includes('CPT')) return 2;
    if (s.includes('ASSINATURA')) return 3;
    if (s.includes('VALIDA') || s.includes('DADOS')) return 4;
    if (s.includes('INFORMATIVO')) return 5;
    return 6;
  };

  const generatePhoneCallScript = (brokerName: string, brokerProps: HealthProposal[]): string => {
    let text = `RELATÓRIO DE PENDÊNCIAS - ${brokerName}\n`;
    text += `Emissão: ${emissionTimestamp}\n`;
    text += `Total: ${brokerProps.length} propostas | Vigência: 01/10/2026\n\n`;

    const sorted = [...brokerProps].sort(
      (a, b) => getStatusPriority(a.statusCliente) - getStatusPriority(b.statusCliente)
    );

    sorted.forEach(p => {
      text += `• [${p.statusCliente.toUpperCase()}] ${p.nomeCliente} (#${p.numeroSaude}) | Há ${p.diasNoStatus}d | ${p.operadoraSaude} (Corretor: ${p.usuario})\n`;
    });

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
    fullText += `Emissão: ${emissionTimestamp}\n`;
    fullText += `Total Propostas de Saúde: ${totalSaude} | Corretoras: ${sortedBrokers.length}\n`;
    fullText += `==================================================\n\n`;

    sortedBrokers.forEach(([brokerName, brokerProps], index) => {
      fullText += `[${index + 1}] ${brokerName.toUpperCase()} (${brokerProps.length} propostas)\n`;
      fullText += generatePhoneCallScript(brokerName, brokerProps);
      fullText += `--------------------------------------------------\n\n`;
    });

    navigator.clipboard.writeText(fullText);
    setCopiedAllReport(true);
    setTimeout(() => setCopiedAllReport(false), 2500);
  };

  // Ultra-compact printable HTML document for maximum paper savings
  const handleDownloadPrintableReport = () => {
    const cleanBrokerFilter = selectedBroker === 'ALL' ? 'Todas as Corretoras' : selectedBroker;
    const cleanStatusFilter = selectedStatus === 'ALL' ? 'Todos os Status' : selectedStatus;

    let htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Dossiê Executivo de Pendências - Extramed</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 6mm;
    }
    *, *:before, *:after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 10px;
      font-size: 9.5px;
      line-height: 1.2;
    }
    .no-print {
      display: block;
      margin-bottom: 10px;
      padding: 8px 12px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
    }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0 !important; }
      .page-break { page-break-before: always; break-before: page; }
      .avoid-break { page-break-inside: avoid; break-inside: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; break-inside: avoid; }
    }
    .btn-print {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 6px 14px;
      font-size: 11px;
      font-weight: bold;
      border-radius: 5px;
      cursor: pointer;
    }
    .header-box {
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 5px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header-title { font-size: 15px; font-weight: 900; margin: 1px 0; color: #0f172a; }
    .kpi-row {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
    }
    .kpi-chip {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 4px 6px;
      background: #f8fafc;
      text-align: center;
    }
    .kpi-chip-green { background: #ecfdf5; border-color: #a7f3d0; }
    .kpi-chip-amber { background: #fffbeb; border-color: #fde68a; }
    .kpi-chip-sky { background: #f0f9ff; border-color: #bae6fd; }
    .kpi-chip-purple { background: #faf5ff; border-color: #e9d5ff; }
    .kpi-title { font-size: 8px; font-weight: 700; color: #475569; text-transform: uppercase; }
    .kpi-number { font-size: 14px; font-weight: 900; font-family: monospace; color: #0f172a; }
    .section-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f1f5f9;
      border-left: 3px solid #2563eb;
      padding: 3px 6px;
      margin-top: 8px;
      margin-bottom: 5px;
      color: #1e293b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin-bottom: 8px;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      padding: 3px 4px;
      border: 1px solid #cbd5e1;
      text-align: left;
      font-size: 8.5px;
    }
    td {
      padding: 2.5px 4px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    .broker-banner {
      background: #0f172a;
      color: #ffffff;
      font-weight: bold;
      font-size: 9.5px;
      padding: 3px 6px;
      border-radius: 3px 3px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
    }
    .badge {
      display: inline-block;
      padding: 1px 4px;
      font-size: 8px;
      font-weight: 700;
      border-radius: 3px;
      font-family: monospace;
      white-space: nowrap;
    }
    .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-emerald { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-sky { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .badge-purple { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
    .badge-rose { background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3; }
    .footer-doc {
      margin-top: 10px;
      padding-top: 4px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      font-size: 8px;
      color: #64748b;
    }
  </style>
</head>
<body>

  <!-- Floating Print Banner (Hidden on print) -->
  <div class="no-print" style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <strong style="color: #1e40af; font-size: 12px;">Dossiê Executivo Extramed (Formato Econômico A4)</strong>
      <span style="color: #475569; margin-left: 8px;">Design de alta densidade vertical para menor gasto de folhas.</span>
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ Imprimir / Salvar em PDF (Ctrl + P)
    </button>
  </div>

  <!-- Header -->
  <div class="header-box">
    <div>
      <div style="font-size: 8.5px; font-weight: 800; color: #1e40af; letter-spacing: 0.5px; text-transform: uppercase;">
        EXTRAMED · GESTÃO COMERCIAL NORDESTE
      </div>
      <div class="header-title">Dossiê de Gestão de Pendências & Corretores</div>
      <div style="font-size: 9px; color: #475569;">
        Filtro: <strong>${cleanBrokerFilter}</strong> · Status: <strong>${cleanStatusFilter}</strong>
      </div>
    </div>
    <div style="text-align: right; font-size: 9px;">
      <div><strong>Emissão:</strong> ${emissionTimestamp}</div>
      <div>Vigência Alvo: <strong>01/10/2026</strong></div>
    </div>
  </div>

  <!-- 1. Indicadores em Strip Compacto (Altura mínima) -->
  <div class="avoid-break">
    <div class="kpi-row">
      <div class="kpi-chip">
        <div class="kpi-title">Total Saúde</div>
        <div class="kpi-number">${totalSaude}</div>
      </div>
      <div class="kpi-chip kpi-chip-green">
        <div class="kpi-title" style="color: #065f46;">Informativo Enviado</div>
        <div class="kpi-number" style="color: #065f46;">${informativoEnviado}</div>
      </div>
      <div class="kpi-chip kpi-chip-amber">
        <div class="kpi-title" style="color: #92400e;">Entrevista Médica</div>
        <div class="kpi-number" style="color: #92400e;">${entrevistaMedica}</div>
      </div>
      <div class="kpi-chip kpi-chip-sky">
        <div class="kpi-title" style="color: #0369a1;">Aguard. Assinatura</div>
        <div class="kpi-number" style="color: #0369a1;">${assinaturasPendentes}</div>
      </div>
      <div class="kpi-chip kpi-chip-purple">
        <div class="kpi-title" style="color: #6b21a8;">Aceite de CPT</div>
        <div class="kpi-number" style="color: #6b21a8;">${aguardandoCPT}</div>
      </div>
      <div class="kpi-chip">
        <div class="kpi-title">Em Validação</div>
        <div class="kpi-number">${validacaoExtramed}</div>
      </div>
    </div>
  </div>

  <!-- 2. Matriz de Concentração por Corretora (Compacta) -->
  ${
    selectedBroker === 'ALL'
      ? `
  <div class="avoid-break">
    <div class="section-title">2. Matriz de Concentração por Corretora (Status do Cliente)</div>
    <table>
      <thead>
        <tr>
          <th>CORRETORA PARCEIRA</th>
          <th style="text-align: center; width: 45px;">TOTAL</th>
          <th style="text-align: center; width: 85px; background: #ecfdf5; color: #065f46;">INFORMATIVO (EMITIDO)</th>
          <th style="text-align: center; width: 85px; background: #fffbeb; color: #92400e;">ENTREVISTA MÉDICA</th>
          <th style="text-align: center; width: 80px; background: #f0f9ff; color: #0369a1;">AGUARD. ASSIN.</th>
          <th style="text-align: center; width: 75px; background: #faf5ff; color: #6b21a8;">ACEITE CPT</th>
          <th style="text-align: center; width: 75px;">VALIDAÇÃO</th>
          <th>AÇÃO RECOMENDADA NA LIGAÇÃO</th>
        </tr>
      </thead>
      <tbody>
        ${sortedBrokers
          .map(([bName, bProps]) => {
            const cInf = bProps.filter(
              p => p.statusCliente.toUpperCase().includes('INFORMATIVO') || p.categoriaPendencia === 'INFORMATIVO'
            ).length;
            const cEnt = bProps.filter(
              p => p.statusCliente.toUpperCase().includes('ENTREVISTA') || p.categoriaPendencia === 'ENTREVISTA'
            ).length;
            const cAss = bProps.filter(
              p => p.statusCliente.toUpperCase().includes('ASSINATURA') || p.categoriaPendencia === 'ASSINATURA'
            ).length;
            const cCPT = bProps.filter(
              p => p.statusCliente.toUpperCase().includes('CPT') || p.categoriaPendencia === 'CPT'
            ).length;
            const cVal = bProps.filter(
              p =>
                (p.statusCliente.toUpperCase().includes('VALIDA') ||
                  p.statusCliente.toUpperCase().includes('DADOS') ||
                  p.categoriaPendencia === 'VALIDACAO') &&
                !p.statusCliente.toUpperCase().includes('INFORMATIVO')
            ).length;

            let act = 'Acompanhar validação documental';
            if (cEnt > 0) act = 'Cobrar tele-entrevista médica da operadora';
            else if (cCPT > 0) act = 'Cobrar aceite de CPT pelo segurado';
            else if (cAss > 0) act = 'Cobrar assinatura digital no contrato';
            else if (cInf > 0) act = 'Contrato emitido! Confirmar recebimento do informativo';

            return `
          <tr>
            <td><strong>${bName}</strong></td>
            <td style="text-align: center; font-weight: bold; font-family: monospace;">${bProps.length}</td>
            <td style="text-align: center; font-weight: bold; font-family: monospace; color: #065f46;">${cInf > 0 ? cInf : '-'}</td>
            <td style="text-align: center; font-weight: bold; font-family: monospace; color: #b45309;">${cEnt > 0 ? cEnt : '-'}</td>
            <td style="text-align: center; font-family: monospace; color: #0369a1;">${cAss > 0 ? cAss : '-'}</td>
            <td style="text-align: center; font-weight: bold; font-family: monospace; color: #7e22ce;">${cCPT > 0 ? cCPT : '-'}</td>
            <td style="text-align: center; font-family: monospace; color: #64748b;">${cVal > 0 ? cVal : '-'}</td>
            <td style="font-size: 8.5px;">${act}</td>
          </tr>`;
          })
          .join('')}
      </tbody>
      <tfoot>
        <tr style="background: #f8fafc; font-weight: bold;">
          <td>TOTAL GERAL</td>
          <td style="text-align: center; font-family: monospace;">${totalSaude}</td>
          <td style="text-align: center; font-family: monospace; color: #065f46;">${informativoEnviado}</td>
          <td style="text-align: center; font-family: monospace; color: #b45309;">${entrevistaMedica}</td>
          <td style="text-align: center; font-family: monospace; color: #0369a1;">${assinaturasPendentes}</td>
          <td style="text-align: center; font-family: monospace; color: #7e22ce;">${aguardandoCPT}</td>
          <td style="text-align: center; font-family: monospace; color: #64748b;">${validacaoExtramed}</td>
          <td>-</td>
        </tr>
      </tfoot>
    </table>
  </div>`
      : ''
  }

  <!-- 3. Relação Operacional Ultra-Compacta (Tabela Única por Corretora com 1 Linha por Proposta) -->
  <div style="margin-top: 6px;">
    <div class="section-title">3. Relação Operacional de Pendências (Por Corretora & Status do Cliente)</div>

    ${sortedBrokers
      .map(([bName, bProps], bIdx) => {
        const consultores = Array.from(new Set(bProps.map(p => p.usuario).filter(Boolean))).join(', ');
        // Sort proposals inside broker by status priority then client name
        const sortedBrokerProposals = [...bProps].sort(
          (a, b) => getStatusPriority(a.statusCliente) - getStatusPriority(b.statusCliente)
        );

        return `
    <div class="avoid-break" style="margin-bottom: 8px;">
      <div class="broker-banner">
        <span>#${bIdx + 1} · ${bName.toUpperCase()} <span style="font-weight: normal; opacity: 0.85; margin-left: 6px;">(Consultores: ${consultores || 'Não informado'})</span></span>
        <span>${bProps.length} ${bProps.length === 1 ? 'proposta' : 'propostas'}</span>
      </div>
      <table style="margin-bottom: 0;">
        <thead>
          <tr>
            <th style="width: 135px;">STATUS DO CLIENTE</th>
            <th style="width: 85px;">ADESÃO / Nº</th>
            <th>CLIENTE / BENEFICIÁRIO (CORRETOR)</th>
            <th style="width: 120px;">OPERADORA & ENTIDADE</th>
            <th style="text-align: center; width: 45px;">SLA</th>
            <th style="width: 110px;">BENEFÍCIOS</th>
            <th style="width: 90px; text-align: center;">CONTATO</th>
          </tr>
        </thead>
        <tbody>
          ${sortedBrokerProposals
            .map(p => {
              const odonto = p.produtosAuxiliares.find(a => a.tipo === 'ODONTO')?.numero;
              const mac = p.produtosAuxiliares.find(a => a.tipo === 'VIDA_MAC')?.numero;

              const isEmitido = p.statusCliente.toUpperCase().includes('INFORMATIVO');
              const isEntrevista = p.statusCliente.toUpperCase().includes('ENTREVISTA');
              const isCPT = p.statusCliente.toUpperCase().includes('CPT');
              const isAssinatura = p.statusCliente.toUpperCase().includes('ASSINATURA');

              let badgeClass = 'badge';
              if (isEmitido) badgeClass += ' badge-emerald';
              else if (isEntrevista) badgeClass += ' badge-amber';
              else if (isCPT) badgeClass += ' badge-purple';
              else if (isAssinatura) badgeClass += ' badge-sky';

              const auxParts = [];
              if (odonto) auxParts.push(`OD #${odonto}`);
              if (mac) auxParts.push(`MAC #${mac}`);
              const auxText = auxParts.length > 0 ? auxParts.join(' · ') : '-';

              return `
            <tr>
              <td><span class="${badgeClass}">${p.statusCliente}</span></td>
              <td style="font-family: monospace; white-space: nowrap;">
                <strong>${p.adesaoSolicitada}</strong> <span style="color: #64748b;">#${p.numeroSaude}</span>
              </td>
              <td>
                <strong>${p.nomeCliente}</strong>
                <span style="color: #64748b; font-size: 8.5px; margin-left: 4px;">(${p.usuario})</span>
              </td>
              <td>${p.operadoraSaude} · <span style="color: #64748b;">${p.entidade}</span></td>
              <td style="text-align: center; font-family: monospace; font-weight: bold;">
                <span class="badge ${p.diasNoStatus >= 8 ? 'badge-rose' : p.diasNoStatus >= 4 ? 'badge-amber' : ''}">
                  ${p.diasNoStatus}d
                </span>
              </td>
              <td style="font-family: monospace; font-size: 8.5px; color: #475569;">${auxText}</td>
              <td style="text-align: center; font-size: 8.5px; white-space: nowrap;">[ ] __/__ [ ] OK</td>
            </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>`;
      })
      .join('')}
  </div>

  <div class="footer-doc">
    Extramed Administradora de Benefícios · Emitido em <strong>${emissionTimestamp}</strong> · Documento confidencial de controle operacional diário.
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

    // Trigger immediate clean download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dossie_executivo_extramed_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handleExportExcel = () => {
    const filename =
      selectedBroker !== 'ALL'
        ? `pendencias_${selectedBroker.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
        : `dossie_pendencias_extramed_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToExcelCSV(filteredProposals, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print-modal-backdrop">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col print-dialog-container">
        {/* TOP ACTION BAR - Clean & Unpolluted */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 sticky top-0 bg-white z-20 no-print">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Dossiê Executivo de Pendências (Formato Econômico)
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Otimizado para Menos Folhas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              1 linha por proposta · Status do Cliente destacado · Baixo consumo de papel para controle diário
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Copy full report in text */}
            <button
              onClick={handleCopyAllReport}
              title="Copiar relatório completo de todas as corretoras em formato texto"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {copiedAllReport ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>

            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              title="Exportar dados deste dossiê para Excel (.CSV)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>

            {/* Baixar Dossiê para Impressão / Salvar PDF */}
            <button
              onClick={handleDownloadPrintableReport}
              title="Baixar arquivo formatado que já abre a janela de impressão e PDF"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Arquivo Pronto!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-white" />
                  <span>Baixar Arquivo PDF / Impressão</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FILTER & CONFIGURATION CONTROLS BAR */}
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 no-print">
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
                className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-slate-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[240px] truncate"
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
              <span className="font-semibold text-slate-700">Status do Cliente:</span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-slate-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[240px] truncate"
              >
                <option value="ALL">Todos os Status ({statusList.length})</option>
                {statusList.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle page break per broker */}
            <label
              className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer"
              title="Ao imprimir, cada corretora iniciará em uma nova página"
            >
              <input
                type="checkbox"
                checked={pageBreakPerBroker}
                onChange={e => setPageBreakPerBroker(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>1 Corretora por Folha</span>
            </label>
          </div>

          <div className="text-[11px] text-slate-600 font-medium">
            Exibindo <strong className="font-mono text-slate-900">{filteredProposals.length}</strong> propostas em{' '}
            <strong className="font-mono text-slate-900">{sortedBrokers.length}</strong>{' '}
            {sortedBrokers.length === 1 ? 'corretora' : 'corretoras'}
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY - Dense & Paper-saving */}
        <div className="p-5 sm:p-6 space-y-4 text-slate-900 bg-white">
          {/* COMPACT EXECUTIVE HEADER BANNER */}
          <div className="border-b-2 border-slate-900 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-[9.5px] font-bold text-blue-800 uppercase tracking-wider">
                  EXTRAMED ADMINISTRADORA DE BENEFÍCIOS · GESTÃO COMERCIAL
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Dossiê de Gestão de Pendências & Corretores
                </h1>
                <p className="text-[11px] text-slate-600">
                  Relação de Pendências por <strong>Corretora Parceira</strong> e <strong>Status do Cliente</strong> (Formato Compacto)
                </p>
              </div>

              <div className="text-left sm:text-right text-xs space-y-0.5 border-l-2 sm:border-l-0 border-blue-600 pl-2 sm:pl-0">
                <div className="font-semibold text-slate-800">
                  Emissão: <span className="font-mono font-bold text-slate-900">{emissionTimestamp}</span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Vigência Alvo: <strong className="text-slate-900 font-mono">01/10/2026</strong>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 1: STRIP DE INDICADORES (Mínima altura vertical) */}
          <div className="space-y-1.5 print-avoid-break">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/70 text-center">
                <span className="text-[10px] text-slate-600 block font-semibold uppercase">Total Saúde</span>
                <span className="text-lg font-bold font-mono text-slate-900">{totalSaude}</span>
              </div>
              <div className="border border-emerald-300 rounded-lg p-2 bg-emerald-50/70 text-center">
                <span className="text-[10px] text-emerald-950 font-bold block uppercase flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Informativo
                </span>
                <span className="text-lg font-bold font-mono text-emerald-950">{informativoEnviado}</span>
              </div>
              <div className="border border-amber-300 rounded-lg p-2 bg-amber-50/60 text-center">
                <span className="text-[10px] text-amber-900 font-bold block uppercase flex items-center justify-center gap-1">
                  <Stethoscope className="w-3 h-3 text-amber-600" />
                  Entrevista
                </span>
                <span className="text-lg font-bold font-mono text-amber-950">{entrevistaMedica}</span>
              </div>
              <div className="border border-sky-200 rounded-lg p-2 bg-sky-50/40 text-center">
                <span className="text-[10px] text-sky-900 font-semibold block uppercase flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-sky-600" />
                  Assinatura
                </span>
                <span className="text-lg font-bold font-mono text-sky-950">{assinaturasPendentes}</span>
              </div>
              <div className="border border-purple-200 rounded-lg p-2 bg-purple-50/40 text-center">
                <span className="text-[10px] text-purple-900 font-bold block uppercase flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-purple-600" />
                  Aceite CPT
                </span>
                <span className="text-lg font-bold font-mono text-purple-950">{aguardandoCPT}</span>
              </div>
              <div className="border border-indigo-200 rounded-lg p-2 bg-indigo-50/40 text-center">
                <span className="text-[10px] text-indigo-900 font-semibold block uppercase">Validação</span>
                <span className="text-lg font-bold font-mono text-indigo-950">{validacaoExtramed}</span>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: MATRIZ DE CONCENTRAÇÃO COMPACTA */}
          {selectedBroker === 'ALL' && (
            <div className="space-y-1.5 print-avoid-break">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Matriz de Concentração por Corretora (Status do Cliente)</span>
                </h2>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-semibold text-[10px] border-b border-slate-200">
                      <th className="py-1 px-2.5">CORRETORA PARCEIRA</th>
                      <th className="py-1 px-2 text-center w-12">TOTAL</th>
                      <th className="py-1 px-2 text-center font-bold text-emerald-900 bg-emerald-50/70 border-x border-emerald-200">
                        INFORMATIVO (EMITIDO)
                      </th>
                      <th className="py-1 px-2 text-center font-bold text-amber-900 bg-amber-50/50">
                        ENTREVISTA MÉDICA
                      </th>
                      <th className="py-1 px-2 text-center font-bold text-sky-900 bg-sky-50/50">
                        AGUARD. ASSIN.
                      </th>
                      <th className="py-1 px-2 text-center font-bold text-purple-900 bg-purple-50/50">
                        ACEITE CPT
                      </th>
                      <th className="py-1 px-2 text-center text-slate-700">
                        VALIDAÇÃO
                      </th>
                      <th className="py-1 px-2.5">AÇÃO RECOMENDADA NA LIGAÇÃO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {sortedBrokers.map(([brokerName, bProps]) => {
                      const countInformativo = bProps.filter(
                        p => p.statusCliente.toUpperCase().includes('INFORMATIVO') || p.categoriaPendencia === 'INFORMATIVO'
                      ).length;
                      const countEntrevista = bProps.filter(
                        p => p.statusCliente.toUpperCase().includes('ENTREVISTA') || p.categoriaPendencia === 'ENTREVISTA'
                      ).length;
                      const countAssinatura = bProps.filter(
                        p => p.statusCliente.toUpperCase().includes('ASSINATURA') || p.categoriaPendencia === 'ASSINATURA'
                      ).length;
                      const countCPT = bProps.filter(
                        p => p.statusCliente.toUpperCase().includes('CPT') || p.categoriaPendencia === 'CPT'
                      ).length;
                      const countValidacao = bProps.filter(
                        p =>
                          (p.statusCliente.toUpperCase().includes('VALIDA') ||
                            p.statusCliente.toUpperCase().includes('DADOS') ||
                            p.categoriaPendencia === 'VALIDACAO') &&
                          !p.statusCliente.toUpperCase().includes('INFORMATIVO')
                      ).length;

                      let principalAcao = 'Acompanhar validação cadastral';
                      if (countEntrevista > 0) principalAcao = 'Cobrar tele-entrevista médica da operadora';
                      else if (countCPT > 0) principalAcao = 'Cobrar aceite de CPT pelo segurado';
                      else if (countAssinatura > 0) principalAcao = 'Cobrar assinatura digital no contrato';
                      else if (countInformativo > 0) principalAcao = 'Contrato emitido! Confirmar recebimento do informativo';

                      return (
                        <tr key={brokerName} className="hover:bg-slate-50/50">
                          <td className="py-1 px-2.5 font-bold text-slate-900">{brokerName}</td>
                          <td className="py-1 px-2 text-center font-bold font-mono text-slate-900">{bProps.length}</td>
                          <td className="py-1 px-2 text-center font-mono font-bold text-emerald-800 bg-emerald-50/30">
                            {countInformativo > 0 ? countInformativo : '-'}
                          </td>
                          <td className="py-1 px-2 text-center font-mono font-bold text-amber-800">
                            {countEntrevista > 0 ? countEntrevista : '-'}
                          </td>
                          <td className="py-1 px-2 text-center font-mono text-sky-800">
                            {countAssinatura > 0 ? countAssinatura : '-'}
                          </td>
                          <td className="py-1 px-2 text-center font-mono font-semibold text-purple-800">
                            {countCPT > 0 ? countCPT : '-'}
                          </td>
                          <td className="py-1 px-2 text-center font-mono text-slate-600">
                            {countValidacao > 0 ? countValidacao : '-'}
                          </td>
                          <td className="py-1 px-2.5 text-slate-700 text-[10.5px] font-medium">{principalAcao}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-[10.5px] text-slate-900 border-t border-slate-300">
                      <td className="py-1 px-2.5">TOTAL GERAL</td>
                      <td className="py-1 px-2 text-center font-mono">{totalSaude}</td>
                      <td className="py-1 px-2 text-center font-mono text-emerald-800 bg-emerald-50/70 border-x border-emerald-200">
                        {informativoEnviado}
                      </td>
                      <td className="py-1 px-2 text-center font-mono text-amber-800">{entrevistaMedica}</td>
                      <td className="py-1 px-2 text-center font-mono text-sky-800">{assinaturasPendentes}</td>
                      <td className="py-1 px-2 text-center font-mono text-purple-800">{aguardandoCPT}</td>
                      <td className="py-1 px-2 text-center font-mono text-slate-700">{validacaoExtramed}</td>
                      <td className="py-1 px-2.5">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* SEÇÃO 3: RELAÇÃO OPERACIONAL ULTRA-COMPACTA (1 TABELA POR CORRETORA COM 1 LINHA POR PROPOSTA) */}
          <div className="space-y-3 pt-1">
            <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>3. Relação Operacional (Por Corretora & Status do Cliente - 1 Linha por Proposta)</span>
              </h2>
              <span className="text-[10px] text-slate-500 font-sans">
                Formato ultra-compacto para redução de páginas
              </span>
            </div>

            {sortedBrokers.map(([brokerName, brokerProps], brokerIndex) => {
              const consultores = Array.from(new Set(brokerProps.map(p => p.usuario).filter(Boolean))).join(', ');
              // Sort proposals inside broker by status priority
              const sortedBrokerProposals = [...brokerProps].sort(
                (a, b) => getStatusPriority(a.statusCliente) - getStatusPriority(b.statusCliente)
              );

              return (
                <div
                  key={brokerName}
                  className={`border border-slate-300 rounded-lg overflow-hidden bg-white ${
                    pageBreakPerBroker ? 'print-page-break' : 'print-avoid-break'
                  }`}
                >
                  {/* Slim Broker Header Bar */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 text-white text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] bg-blue-600 px-1.5 py-0.5 rounded">
                        #{brokerIndex + 1}
                      </span>
                      <strong className="font-bold text-sm tracking-tight">{brokerName}</strong>
                      <span className="text-[11px] text-slate-300 hidden sm:inline">
                        (Consultores: {consultores || 'Não informado'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-800 px-2 py-0.5 rounded text-blue-200">
                        {brokerProps.length} {brokerProps.length === 1 ? 'proposta' : 'propostas'}
                      </span>

                      <button
                        onClick={() => handleCopyScript(brokerName, brokerProps)}
                        className="no-print inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                        title="Copiar lista de pendências desta corretora"
                      >
                        {copiedScript === brokerName ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Dense Single Table for all proposals of this broker */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-[10px] font-semibold border-b border-slate-200">
                          <th className="py-1.5 px-2.5 w-[160px]">STATUS DO CLIENTE</th>
                          <th className="py-1.5 px-2 font-mono w-[100px]">ADESÃO / Nº</th>
                          <th className="py-1.5 px-2">CLIENTE / BENEFICIÁRIO (CORRETOR)</th>
                          <th className="py-1.5 px-2 w-[160px]">OPERADORA & ENTIDADE</th>
                          <th className="py-1.5 px-2 font-mono text-center w-[55px]">SLA</th>
                          <th className="py-1.5 px-2 w-[130px]">BENEFÍCIOS</th>
                          <th className="py-1.5 px-2 text-center w-[95px]">REGISTRO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {sortedBrokerProposals.map(p => {
                          const odonto = p.produtosAuxiliares.find(a => a.tipo === 'ODONTO')?.numero;
                          const mac = p.produtosAuxiliares.find(a => a.tipo === 'VIDA_MAC')?.numero;

                          const isEmitido = p.statusCliente.toUpperCase().includes('INFORMATIVO');
                          const isEntrevista = p.statusCliente.toUpperCase().includes('ENTREVISTA');
                          const isCPT = p.statusCliente.toUpperCase().includes('CPT');
                          const isAssinatura = p.statusCliente.toUpperCase().includes('ASSINATURA');

                          let badgeColor = 'bg-slate-100 text-slate-800 border-slate-200';
                          if (isEmitido) badgeColor = 'bg-emerald-50 text-emerald-950 border-emerald-300 font-bold';
                          else if (isEntrevista) badgeColor = 'bg-amber-50 text-amber-950 border-amber-300 font-bold';
                          else if (isCPT) badgeColor = 'bg-purple-50 text-purple-950 border-purple-300 font-bold';
                          else if (isAssinatura) badgeColor = 'bg-sky-50 text-sky-950 border-sky-300 font-semibold';

                          const auxParts = [];
                          if (odonto) auxParts.push(`OD #${odonto}`);
                          if (mac) auxParts.push(`MAC #${mac}`);
                          const auxText = auxParts.length > 0 ? auxParts.join(' · ') : '-';

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/70">
                              <td className="py-1 px-2.5">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border ${badgeColor}`}>
                                  {p.statusCliente}
                                </span>
                              </td>
                              <td className="py-1 px-2 font-mono whitespace-nowrap">
                                <strong className="text-slate-900">{p.adesaoSolicitada}</strong>{' '}
                                <span className="text-slate-500 font-medium">#{p.numeroSaude}</span>
                              </td>
                              <td className="py-1 px-2">
                                <span className="font-bold text-slate-900">{p.nomeCliente}</span>
                                <span className="text-[10px] text-slate-500 ml-1.5 font-normal">
                                  ({p.usuario})
                                </span>
                              </td>
                              <td className="py-1 px-2 truncate max-w-[170px]" title={`${p.operadoraSaude} · ${p.entidade}`}>
                                <span className="font-medium text-slate-800">{p.operadoraSaude}</span>{' '}
                                <span className="text-slate-500 text-[10px]">· {p.entidade}</span>
                              </td>
                              <td className="py-1 px-2 text-center font-mono whitespace-nowrap">
                                <span
                                  className={`inline-block px-1 py-0.5 rounded text-[10px] font-bold ${
                                    p.diasNoStatus >= 8
                                      ? 'text-rose-800 bg-rose-100'
                                      : p.diasNoStatus >= 4
                                      ? 'text-amber-800 bg-amber-100'
                                      : 'text-slate-700 bg-slate-100'
                                  }`}
                                >
                                  {p.diasNoStatus}d
                                </span>
                              </td>
                              <td className="py-1 px-2 font-mono text-[10px] text-slate-600 whitespace-nowrap">
                                {auxText}
                              </td>
                              <td className="py-1 px-2 text-center text-[10px] font-mono text-slate-500 whitespace-nowrap">
                                [ ] __/__ [ ] OK
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FOOTER OF THE REPORT */}
          <div className="border-t border-slate-300 pt-2 text-center text-xs text-slate-500 print-avoid-break">
            <p className="font-medium text-slate-700 text-[11px]">
              Extramed Administradora de Benefícios · Gestão de Pendências de Vendas
            </p>
            <p className="text-[9.5px] text-slate-400 mt-0.5">
              Emitido em <strong>{emissionTimestamp}</strong> · Documento confidencial para controle operacional diário.
            </p>
          </div>
        </div>

        {/* MODAL FOOTER CONTROLS - Clean & Simple */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 no-print sticky bottom-0 z-20">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={handleDownloadPrintableReport}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Baixar Arquivo PDF / Impressão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
