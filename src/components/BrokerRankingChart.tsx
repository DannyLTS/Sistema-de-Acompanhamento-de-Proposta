import React, { useState } from 'react';
import { HealthProposal, FilterState } from '../types';
import { Building2, User, MessageSquare, Printer } from 'lucide-react';

interface BrokerRankingChartProps {
  proposals: HealthProposal[];
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  onOpenBrokerReport: (brokerName: string) => void;
  onOpenPrintExecutiveReport?: (brokerName?: string) => void;
}

export const BrokerRankingChart: React.FC<BrokerRankingChartProps> = ({
  proposals,
  filterState,
  setFilterState,
  onOpenBrokerReport,
  onOpenPrintExecutiveReport,
}) => {
  const [viewMode, setViewMode] = useState<'corretora' | 'usuario'>('corretora');

  // Group by selected mode
  const groupCounts = proposals.reduce((acc, p) => {
    const key = viewMode === 'corretora' ? p.corretora : p.usuario;
    if (!acc[key]) {
      acc[key] = {
        name: key,
        total: 0,
        criticos: 0,
        alertas: 0,
        entrevistas: 0,
        assinaturas: 0,
      };
    }
    acc[key].total += 1;
    if (p.urgencia === 'CRITICO') acc[key].criticos += 1;
    if (p.urgencia === 'ALERTA') acc[key].alertas += 1;
    if (p.categoriaPendencia === 'ENTREVISTA') acc[key].entrevistas += 1;
    if (p.categoriaPendencia === 'ASSINATURA' || p.categoriaPendencia === 'CPT') acc[key].assinaturas += 1;
    return acc;
  }, {} as Record<string, { name: string; total: number; criticos: number; alertas: number; entrevistas: number; assinaturas: number }>);

  const sortedGroups = Object.values(groupCounts).sort((a, b) => b.total - a.total);
  const maxTotal = sortedGroups[0]?.total || 1;

  const handleSelectGroup = (name: string) => {
    if (viewMode === 'corretora') {
      setFilterState(prev => ({
        ...prev,
        corretora: prev.corretora === name ? '' : name,
      }));
    } else {
      setFilterState(prev => ({
        ...prev,
        usuario: prev.usuario === name ? '' : name,
      }));
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {viewMode === 'corretora' ? 'Ranking de Corretoras Parceiras' : 'Produtividade por Corretor'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Volume de propostas e concentração de pendências
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('corretora')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'corretora'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Agrupar por Corretora"
            >
              <Building2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('usuario')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'usuario'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Agrupar por Corretor / Usuário"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {sortedGroups.map(item => {
            const isSelected =
              viewMode === 'corretora'
                ? filterState.corretora === item.name
                : filterState.usuario === item.name;

            const barPct = Math.round((item.total / maxTotal) * 100);

            return (
              <div
                key={item.name}
                className={`p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <button
                    onClick={() => handleSelectGroup(item.name)}
                    className="font-medium text-slate-900 text-left truncate hover:text-blue-600 max-w-[200px] sm:max-w-[260px]"
                    title={item.name}
                  >
                    {item.name}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {item.total} {item.total === 1 ? 'proposta' : 'propostas'}
                    </span>
                    {viewMode === 'corretora' && (
                      <div className="flex items-center gap-0.5">
                        {onOpenPrintExecutiveReport && (
                          <button
                            onClick={() => onOpenPrintExecutiveReport(item.name)}
                            title="Imprimir dossiê com pendências desta corretora"
                            className="text-slate-400 hover:text-blue-600 p-1 hover:bg-white rounded transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onOpenBrokerReport(item.name)}
                          title="Gerar texto de cobrança para esta corretora"
                          className="text-slate-400 hover:text-blue-600 p-1 hover:bg-white rounded transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${barPct}%` }}
                  />
                </div>

                {/* Sub-status badges */}
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  {item.criticos > 0 && (
                    <span className="text-amber-700 font-medium">
                      {item.criticos} críticos
                    </span>
                  )}
                  {item.entrevistas > 0 && (
                    <span>
                      {item.entrevistas} em entrevista
                    </span>
                  )}
                  {item.assinaturas > 0 && (
                    <span>
                      {item.assinaturas} p/ assinar
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span>Clique no nome para filtrar</span>
          {(filterState.corretora || filterState.usuario) && (
            <button
              onClick={() => setFilterState(prev => ({ ...prev, corretora: '', usuario: '' }))}
              className="text-blue-600 hover:underline font-medium"
            >
              Limpar seleção
            </button>
          )}
        </div>

        {onOpenPrintExecutiveReport && (
          <button
            onClick={() => onOpenPrintExecutiveReport()}
            className="inline-flex items-center gap-1 text-blue-700 font-semibold hover:underline"
          >
            <Printer className="w-3 h-3" />
            <span>Dossiê Geral de Impressão</span>
          </button>
        )}
      </div>
    </div>
  );
};
