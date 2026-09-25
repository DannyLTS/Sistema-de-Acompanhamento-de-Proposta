import React, { useState } from 'react';
import { RawContractRow } from '../types';
import { Search, ArrowUpDown } from 'lucide-react';

interface RawDataTableProps {
  rawRows: RawContractRow[];
}

export const RawDataTable: React.FC<RawDataTableProps> = ({ rawRows }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = rawRows.filter(r => {
    const matchesSearch =
      r.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.numero.includes(searchTerm) ||
      r.operadora.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.corretora.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.usuario.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' || r.classification === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Relatório de Dados Brutos (Visão de Auditoria)
          </h3>
          <p className="text-xs text-slate-500">
            Todas as {rawRows.length} linhas extraídas diretamente do sistema, mostrando como cada registro foi classificado
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Classification Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({rawRows.length})
            </button>
            <button
              onClick={() => setFilterType('SAUDE')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'SAUDE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Saúde ({rawRows.filter(r => r.classification === 'SAUDE').length})
            </button>
            <button
              onClick={() => setFilterType('ODONTO')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'ODONTO'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Odonto ({rawRows.filter(r => r.classification === 'ODONTO').length})
            </button>
            <button
              onClick={() => setFilterType('VIDA_MAC')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'VIDA_MAC'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MAC ({rawRows.filter(r => r.classification === 'VIDA_MAC').length})
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Filtrar dados brutos por cliente, número ou corretora..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
              <th className="py-2 px-3 font-mono">Nº</th>
              <th className="py-2 px-3">DATA STATUS</th>
              <th className="py-2 px-3">ADESÃO</th>
              <th className="py-2 px-3">CLASSIFICAÇÃO</th>
              <th className="py-2 px-3">NOME CLIENTE</th>
              <th className="py-2 px-3">OPERADORA</th>
              <th className="py-2 px-3">STATUS CLIENTE</th>
              <th className="py-2 px-3">STATUS PEDIDO</th>
              <th className="py-2 px-3">CORRETORA</th>
              <th className="py-2 px-3">USUARIO</th>
              <th className="py-2 px-3">ENTIDADE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(row => {
              let badgeBg = 'text-blue-700 bg-blue-50';
              let label = 'Saúde (Principal)';
              if (row.classification === 'ODONTO') {
                badgeBg = 'text-purple-700 bg-purple-50';
                label = 'Auxiliar (Odonto)';
              } else if (row.classification === 'VIDA_MAC') {
                badgeBg = 'text-amber-700 bg-amber-50';
                label = 'Auxiliar (Seguro MAC)';
              }

              return (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-semibold tabular-nums text-slate-900">
                    {row.numero}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {row.dataPresenteStatus}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {row.adesaoSolicitada}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${badgeBg}`}>
                      {label}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 truncate max-w-[180px]">
                    {row.nomeCliente}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 truncate max-w-[200px]" title={row.operadora}>
                    {row.operadora}
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 truncate max-w-[180px]" title={row.statusCliente}>
                    {row.statusCliente}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 truncate max-w-[180px]" title={row.statusPedido}>
                    {row.statusPedido}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 truncate max-w-[160px]" title={row.corretora}>
                    {row.corretora}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 truncate max-w-[140px]" title={row.usuario}>
                    {row.usuario}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 truncate max-w-[160px]" title={row.entidade}>
                    {row.entidade}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
