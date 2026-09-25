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
  Download,
} from 'lucide-react';
import { generateProposalWhatsAppText } from '../utils/exporter';

interface ProposalTableProps {
  proposals: HealthProposal[];
  onSelectProposal: (proposal: HealthProposal) => void;
  onExportExcel?: () => void;
}

type SortField = 'numero' | 'cliente' | 'data' | 'dias' | 'status' | 'corretora';

export const ProposalTable: React.FC<ProposalTableProps> = ({
  proposals,
  onSelectProposal,
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
                className="py-2.5 px-2.5 cursor-pointer hover:text-slate-900 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>ADESÃO / Nº</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('cliente')}
                className="py-2.5 px-2.5 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>CLIENTE / OPERADORA</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('status')}
                className="py-2.5 px-2.5 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>STATUS CLIENTE & PEDIDO</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('corretora')}
                className="py-2.5 px-2.5 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>CORRETORA / CONSULTOR</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-2.5 px-2">
                <span>ENTIDADE</span>
              </th>

              <th
                onClick={() => handleSort('dias')}
                className="py-2.5 px-2 cursor-pointer hover:text-slate-900 text-center font-mono whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>SLA</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-2.5 px-2 text-center whitespace-nowrap">
                <span>BENEFÍCIOS</span>
              </th>

              <th className="py-2.5 px-2 text-right whitespace-nowrap">
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
                    {/* Primary: Data Adesão | Subtitle: Nº Proposta # */}
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-xs font-sans">
                        {p.adesaoSolicitada || '01/10/2026'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 font-semibold">
                        #{p.numeroSaude}
                      </div>
                    </td>

                    {/* Client Name & Health Operator */}
                    <td className="py-2.5 px-2.5">
                      <div className="font-semibold text-slate-900 truncate max-w-[170px]" title={p.nomeCliente}>
                        {p.nomeCliente}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[170px]" title={p.operadoraSaude}>
                        {p.operadoraSaude}
                      </div>
                    </td>

                    {/* Status Cliente & Status Pedido */}
                    <td className="py-2.5 px-2.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        {getStatusIcon(p.categoriaPendencia)}
                        <span className="truncate max-w-[180px] text-xs font-semibold" title={p.statusCliente}>
                          {p.statusCliente}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[180px]" title={p.statusPedido}>
                        {p.statusPedido}
                      </div>
                    </td>

                    {/* Brokerage & Broker User */}
                    <td className="py-2.5 px-2.5">
                      <div className="font-medium text-slate-800 truncate max-w-[150px] text-xs" title={p.corretora}>
                        {p.corretora}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]" title={p.usuario}>
                        {p.usuario}
                      </div>
                    </td>

                    {/* Entity */}
                    <td className="py-2.5 px-2 text-slate-600">
                      <div className="truncate max-w-[110px] text-[11px]" title={p.entidade}>
                        {p.entidade}
                      </div>
                    </td>

                    {/* Days in Status (SLA) - Encurtada e compacta */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold font-mono ${
                          isCritico
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : p.diasNoStatus >= 4
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                        title={`Parado há ${p.diasNoStatus} dias no status atual`}
                      >
                        {p.diasNoStatus}d
                      </span>
                      <span className="block text-[9px] text-slate-400 font-mono mt-0.5" title={`Data de entrada: ${p.dataPresenteStatus}`}>
                        {p.dataPresenteStatus ? p.dataPresenteStatus.slice(0, 5) : ''}
                      </span>
                    </td>

                    {/* Linked Auxiliary Products - Encurtada e abreviada com tooltips completos */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 text-[10px]">
                        {odonto ? (
                          <span
                            className="bg-indigo-50 border border-indigo-200/80 text-indigo-700 px-1 py-0.5 rounded font-mono font-semibold"
                            title={`Odonto Coletivo por Adesão Nº ${odonto.numero} (${odonto.statusCliente})`}
                          >
                            OD #{odonto.numero}
                          </span>
                        ) : null}
                        {mac ? (
                          <span
                            className="bg-teal-50 border border-teal-200/80 text-teal-700 px-1 py-0.5 rounded font-mono font-semibold"
                            title={`Seguro Extramed MAC Nº ${mac.numero} (${mac.statusCliente})`}
                          >
                            MAC #{mac.numero}
                          </span>
                        ) : null}
                        {!odonto && !mac ? (
                          <span className="text-slate-300 font-mono text-[10px]">-</span>
                        ) : null}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={e => handleCopyCobrança(e, p)}
                          title="Copiar texto de cobrança para WhatsApp"
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
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
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
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
