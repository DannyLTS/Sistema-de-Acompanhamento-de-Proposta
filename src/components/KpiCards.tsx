import React from 'react';
import { HealthProposal, FilterState } from '../types';
import { FileText, Clock, AlertTriangle, UserCheck, Stethoscope, CheckCircle2, XCircle, Printer } from 'lucide-react';

interface KpiCardsProps {
  proposals: HealthProposal[];
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  totalRawRowsCount: number;
  onOpenPrintExecutiveReport?: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  proposals,
  filterState,
  setFilterState,
  totalRawRowsCount,
  onOpenPrintExecutiveReport,
}) => {
  // Aggregate stats
  const totalProposals = proposals.length;
  const filteredAuxCount = Math.max(0, totalRawRowsCount - totalProposals);

  const aguardandoAssinatura = proposals.filter(p => p.categoriaPendencia === 'ASSINATURA').length;
  const entrevistaMedica = proposals.filter(p => p.categoriaPendencia === 'ENTREVISTA').length;
  const validacaoExtramed = proposals.filter(p => p.categoriaPendencia === 'VALIDACAO').length;
  const aguardandoCPT = proposals.filter(p => p.categoriaPendencia === 'CPT').length;
  const informativoEnviado = proposals.filter(p => p.categoriaPendencia === 'INFORMATIVO').length;
  const naoEfetivadas = proposals.filter(p => p.categoriaPendencia === 'NAO_EFETIVADO').length;

  const criticos = proposals.filter(p => p.urgencia === 'CRITICO').length;

  const handleCardClick = (category: string) => {
    setFilterState(prev => ({
      ...prev,
      categoriaPendencia: prev.categoriaPendencia === category ? '' : category,
    }));
  };

  return (
    <div className="space-y-3">
      {/* Top Banner explaining the Smart Filtering */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block animate-pulse shrink-0" />
          <span className="font-semibold shrink-0">Filtro Inteligente de Saúde Ativo:</span>
          <span className="text-blue-800">
            Identificadas <strong className="font-mono tabular-nums">{totalProposals}</strong> propostas principais de saúde. Foram desmembradas <strong className="font-mono tabular-nums">{filteredAuxCount}</strong> linhas auxiliares de benefícios gratuitos (Odonto & Seguro MAC).
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenPrintExecutiveReport && (
            <button
              onClick={onOpenPrintExecutiveReport}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Gerar e imprimir dossiê de pendências separado por corretora e status"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Dossiê & Roteiro</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Proposals */}
        <button
          onClick={() => setFilterState(prev => ({ ...prev, categoriaPendencia: '' }))}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
            filterState.categoriaPendencia === ''
              ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total de Saúde</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalProposals}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Contratos únicos</span>
            {criticos > 0 && (
              <span className="text-amber-700 font-medium font-mono tabular-nums">
                {criticos} críticos
              </span>
            )}
          </div>
        </button>

        {/* Validação Dados Extramed */}
        <button
          onClick={() => handleCardClick('VALIDACAO')}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
            filterState.categoriaPendencia === 'VALIDACAO'
              ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Validação Extramed</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-950">
            {validacaoExtramed}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Triagem documental
          </div>
        </button>

        {/* Realização da Entrevista Médica */}
        <button
          onClick={() => handleCardClick('ENTREVISTA')}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
            filterState.categoriaPendencia === 'ENTREVISTA'
              ? 'border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Entrevista Médica</span>
            <Stethoscope className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-950">
            {entrevistaMedica}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Requer contato segurado
          </div>
        </button>

        {/* Aguardando Assinaturas (Corretor/Cliente/CPT) */}
        <button
          onClick={() => handleCardClick('ASSINATURA')}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
            filterState.categoriaPendencia === 'ASSINATURA'
              ? 'border-sky-600 ring-2 ring-sky-500/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Assinatura Pendente</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-sky-950">
            {aguardandoAssinatura}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cliente ou Corretora
          </div>
        </button>

        {/* Aguardando CPT */}
        <button
          onClick={() => handleCardClick('CPT')}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
            filterState.categoriaPendencia === 'CPT'
              ? 'border-purple-600 ring-2 ring-purple-500/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Assinatura de CPT</span>
            <AlertTriangle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-purple-950">
            {aguardandoCPT}
          </div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">
            Cobertura Parcial
          </div>
        </button>

        {/* Informativo / Não Efetivado */}
        <button
          onClick={() => handleCardClick('INFORMATIVO')}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
            filterState.categoriaPendencia === 'INFORMATIVO'
              ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Informativo Enviado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-950">
            {informativoEnviado}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Etapa final de adesão
          </div>
        </button>
      </div>
    </div>
  );
};
