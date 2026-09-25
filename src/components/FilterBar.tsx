import React from 'react';
import { FilterState, HealthProposal, RawContractRow } from '../types';
import { Search, X, Filter, RotateCcw, Sparkles } from 'lucide-react';

interface FilterBarProps {
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  allProposals: HealthProposal[];
  allRawRows: RawContractRow[];
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  setFilterState,
  allProposals,
  allRawRows,
  onResetFilters,
}) => {
  // Extract unique options with counts
  const corretoras = Array.from(
    new Set(allProposals.map(p => p.corretora).filter(Boolean))
  ).sort();

  const usuarios = Array.from(
    new Set(allProposals.map(p => p.usuario).filter(Boolean))
  ).sort();

  const entidades = Array.from(
    new Set(allProposals.map(p => p.entidade).filter(Boolean))
  ).sort();

  const statusClienteList = Array.from(
    new Set(allProposals.map(p => p.statusCliente).filter(Boolean))
  ).sort();

  const statusPedidoList = Array.from(
    new Set(allProposals.map(p => p.statusPedido).filter(Boolean))
  ).sort();

  const hasActiveFilters =
    filterState.searchTerm !== '' ||
    filterState.statusCliente !== '' ||
    filterState.statusPedido !== '' ||
    filterState.corretora !== '' ||
    filterState.usuario !== '' ||
    filterState.entidade !== '' ||
    filterState.categoriaPendencia !== '' ||
    filterState.urgencia !== '' ||
    filterState.diasFaixa !== 'todos';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por cliente, nº proposta, corretor, corretora ou entidade..."
            value={filterState.searchTerm}
            onChange={e => setFilterState(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          {filterState.searchTerm && (
            <button
              onClick={() => setFilterState(prev => ({ ...prev, searchTerm: '' }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Smart Filter Switch */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
            Filtro de Saúde Inteligente
          </span>
          <button
            type="button"
            onClick={() => setFilterState(prev => ({ ...prev, onlyHealth: !prev.onlyHealth }))}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              filterState.onlyHealth ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                filterState.onlyHealth ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-[11px] text-slate-500">
            {filterState.onlyHealth ? 'Ocultando Odonto & MAC' : 'Exibindo Todos'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Select Filters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
        {/* Status Cliente */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Status Cliente
          </label>
          <select
            value={filterState.statusCliente}
            onChange={e => setFilterState(prev => ({ ...prev, statusCliente: e.target.value }))}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos os Status ({statusClienteList.length})</option>
            {statusClienteList.map(st => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Corretora */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Corretora Parceira
          </label>
          <select
            value={filterState.corretora}
            onChange={e => setFilterState(prev => ({ ...prev, corretora: e.target.value }))}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
          >
            <option value="">Todas as Corretoras ({corretoras.length})</option>
            {corretoras.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Corretor / Usuário */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Usuário / Corretor
          </label>
          <select
            value={filterState.usuario}
            onChange={e => setFilterState(prev => ({ ...prev, usuario: e.target.value }))}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
          >
            <option value="">Todos os Corretores ({usuarios.length})</option>
            {usuarios.map(u => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Entidade de Classe */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Entidade / Estipulante
          </label>
          <select
            value={filterState.entidade}
            onChange={e => setFilterState(prev => ({ ...prev, entidade: e.target.value }))}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
          >
            <option value="">Todas as Entidades ({entidades.length})</option>
            {entidades.map(ent => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </div>

        {/* Faixa de Dias no Status (SLA) */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Dias no Status (SLA)
          </label>
          <select
            value={filterState.diasFaixa}
            onChange={e => setFilterState(prev => ({ ...prev, diasFaixa: e.target.value }))}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="todos">Qualquer prazo</option>
            <option value="critico">Mais de 7 dias parados (Crítico)</option>
            <option value="alerta">4 a 7 dias parados (Atenção)</option>
            <option value="recente">0 a 3 dias (Recente)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
