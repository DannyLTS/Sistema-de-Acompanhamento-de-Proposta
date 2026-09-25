import React, { useState } from 'react';
import { HealthProposal } from '../types';
import {
  ArrowUpDown,
  Eye,
  MessageCircle,
  Copy,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Shield,
  HeartPulse,
  Printer,
  Download,
} from 'lucide-react';
import { generateProposalWhatsAppText } from '../utils/exporter';

interface ProposalTableProps {
  proposals: HealthProposal[];
  onSelectProposal: (proposal: HealthProposal) => void;
  onOpenPrintExecutiveReport?: () => void;
  onExportExcel?: () => void;
}

type SortField = 'numero' | 'cliente' | 'data' | 'dias' | 'status' | 'corretora';

export const ProposalTable: React.FC<ProposalTableProps> = ({
  proposals,
  onSelectProposal,
  onOpenPrintExecutiveReport,
  onExportExcel,
}) => {
  const [sortField, setSortField] = useState<SortField>('dias');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc
    }
  };

  const sortedProposals = [...proposals].sort((a, b) => {
    let comp = 0;
    if (sortField === 'numero') {
      comp = parseInt(a.numeroSaude || '0') - parseInt(b.numeroSaude || '0');
    } else if (sortField === 'cliente') {
      comp = a.nomeCliente.localeCompare(b.nomeCliente);
    } else if (sortField === 'data') {
      comp = a.dataPresenteStatus.localeCompare(b.dataPresenteStatus);
    } else if (sortField === 'dias') {
      comp = a.diasNoStatus - b.diasNoStatus;
    } else if (sortField === 'status') {
      comp = a.statusCliente.localeCompare(b.statusCliente);
    } else if (sortField === 'corretora') {
      comp = a.corretora.localeCompare(b.corretora);
    }
    return sortAsc ? comp : -comp;
  });

  const handleCopyCobrança = (e: React.MouseEvent, p: HealthProposal) => {
    e.stopPropagation();
    const text = generateProposalWhatsAppText(p);
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getStatusIcon = (category: string) => {
    switch (category) {
      case 'ENTREVISTA':
        return <Stethoscope className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'CPT':
        return <AlertCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'ASSINATURA':
        return <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
      case 'INFORMATIVO':
      case 'CONCLUIDO':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'NAO_EFETIVADO':
        return <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Table Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Fila de Propostas de Saúde
          </h3>
          <p className="text-xs text-slate-500">
            Exibindo <span className="font-mono tabular-nums font-semibold text-slate-800">{proposals.length}</span> propostas ativas filtradas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenPrintExecutiveReport && (
            <button
              onClick={onOpenPrintExecutiveReport}
              title="Gerar dossiê com indicadores e pendências separadas por corretora e status para impressão e cobrança"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Dossiê para Impressão / PDF</span>
            </button>
          )}

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              title="Exportar dados para Excel (.CSV)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Excel</span>
            </button>
          )}

          <div className="text-xs text-slate-500 hidden xl:flex items-center gap-3 pl-2 border-l border-slate-200">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Entrevista / CPT
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Assinatura
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Informativo
            </span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600 select-none">
              <th
                onClick={() => handleSort('numero')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 font-mono"
              >
                <div className="flex items-center gap-1">
                  <span>Nº PROPOSTA</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('cliente')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>CLIENTE / BENEFICIÁRIO</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('status')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>STATUS CLIENTE & PEDIDO</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('corretora')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>CORRETORA / CONSULTOR</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-2.5 px-3.5">
                <span>ENTIDADE</span>
              </th>

              <th
                onClick={() => handleSort('dias')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-slate-900 text-right font-mono"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>SLA (DIAS)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-2.5 px-3.5 text-center">
                <span>BENEFÍCIOS VINCULADOS</span>
              </th>

              <th className="py-2.5 px-3.5 text-right">
                <span>AÇÕES</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedProposals.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-semibold text-slate-800">Nenhuma proposta encontrada</p>
                    <p className="text-xs text-slate-500">
                      Tente ajustar os filtros de pesquisa ou importar novos dados de relatório.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedProposals.map(p => {
                const odonto = p.produtosAuxiliares.find(a => a.tipo === 'ODONTO');
                const mac = p.produtosAuxiliares.find(a => a.tipo === 'VIDA_MAC');
                const isCritico = p.urgencia === 'CRITICO';

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProposal(p)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    {/* Contract Number */}
                    <td className="py-3 px-3.5 font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      #{p.numeroSaude}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal">
                        Adesão: {p.adesaoSolicitada}
                      </span>
                    </td>

                    {/* Client Name & Health Operator */}
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900 truncate max-w-[210px]" title={p.nomeCliente}>
                        {p.nomeCliente}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[210px]" title={p.operadoraSaude}>
                        {p.operadoraSaude}
                      </div>
                    </td>

                    {/* Status Cliente & Status Pedido */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        {getStatusIcon(p.categoriaPendencia)}
                        <span className="truncate max-w-[220px]" title={p.statusCliente}>
                          {p.statusCliente}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[220px]" title={p.statusPedido}>
                        {p.statusPedido}
                      </div>
                    </td>

                    {/* Brokerage & Broker User */}
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-slate-800 truncate max-w-[190px]" title={p.corretora}>
                        {p.corretora}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[190px]" title={p.usuario}>
                        {p.usuario}
                      </div>
                    </td>

                    {/* Entity */}
                    <td className="py-3 px-3.5 text-slate-600">
                      <div className="truncate max-w-[160px]" title={p.entidade}>
                        {p.entidade}
                      </div>
                    </td>

                    {/* Days in Status (SLA) */}
                    <td className="py-3 px-3.5 text-right font-mono tabular-nums whitespace-nowrap">
                      <div
                        className={`font-semibold ${
                          isCritico
                            ? 'text-amber-700'
                            : p.diasNoStatus > 4
                            ? 'text-slate-800'
                            : 'text-slate-600'
                        }`}
                      >
                        {p.diasNoStatus} {p.diasNoStatus === 1 ? 'dia' : 'dias'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        Desde {p.dataPresenteStatus}
                      </div>
                    </td>

                    {/* Linked Auxiliary Products */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                        {odonto ? (
                          <span
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px]"
                            title={`Odonto Nº ${odonto.numero} (${odonto.statusCliente})`}
                          >
                            Odonto #{odonto.numero}
                          </span>
                        ) : null}
                        {mac ? (
                          <span
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px]"
                            title={`Seguro MAC Nº ${mac.numero} (${mac.statusCliente})`}
                          >
                            MAC #{mac.numero}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={e => handleCopyCobrança(e, p)}
                          title="Copiar texto de cobrança para WhatsApp"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          {copiedId === p.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <MessageCircle className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => onSelectProposal(p)}
                          title="Ver detalhes completos"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
