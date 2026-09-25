import React from 'react';
import { HealthProposal, FilterState } from '../types';

interface StatusFunnelChartProps {
  proposals: HealthProposal[];
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
}

export const StatusFunnelChart: React.FC<StatusFunnelChartProps> = ({
  proposals,
  filterState,
  setFilterState,
}) => {
  // Count by Status Cliente
  const statusCounts = proposals.reduce((acc, p) => {
    acc[p.statusCliente] = (acc[p.statusCliente] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const total = proposals.length || 1;

  const handleStatusClick = (status: string) => {
    setFilterState(prev => ({
      ...prev,
      statusCliente: prev.statusCliente === status ? '' : status,
    }));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Distribuição por Status de Pendência
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique em qualquer status para filtrar as propostas instantaneamente
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {total} propostas
          </span>
        </div>

        <div className="space-y-2.5">
          {sortedStatuses.map(([status, count]) => {
            const pct = Math.round((count / total) * 100);
            const isSelected = filterState.statusCliente === status;

            let barColor = 'bg-blue-600';
            if (status.includes('Entrevista')) barColor = 'bg-amber-500';
            else if (status.includes('CPT')) barColor = 'bg-purple-600';
            else if (status.includes('Assinatura')) barColor = 'bg-sky-500';
            else if (status.includes('Informativo')) barColor = 'bg-emerald-600';
            else if (status.includes('Não efetivada')) barColor = 'bg-rose-500';

            return (
              <button
                key={status}
                onClick={() => handleStatusClick(status)}
                className={`w-full text-left p-2 rounded-lg transition-all border ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-800 truncate pr-2" title={status}>
                    {status}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {count}
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-slate-500">
                      ({pct}%)
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Legenda: CPT & Entrevista médica são prioritárias</span>
        {filterState.statusCliente && (
          <button
            onClick={() => setFilterState(prev => ({ ...prev, statusCliente: '' }))}
            className="text-blue-600 hover:underline font-medium"
          >
            Ver todos
          </button>
        )}
      </div>
    </div>
  );
};
