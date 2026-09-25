import React from 'react';
import { Upload, Download, FileSpreadsheet, Users, ShieldCheck, RefreshCw, Printer } from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'proposals' | 'brokers' | 'raw';
  setCurrentTab: (tab: 'dashboard' | 'proposals' | 'brokers' | 'raw') => void;
  onOpenImport: () => void;
  onOpenBrokerModal: () => void;
  onOpenExecutiveReport: () => void;
  onExportExcel: () => void;
  onResetData: () => void;
  totalHealthCount: number;
  totalRawCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenImport,
  onOpenBrokerModal,
  onOpenExecutiveReport,
  onExportExcel,
  onResetData,
  totalHealthCount,
  totalRawCount,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {/* Top Bar Contract: 3 zones */}
      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 block whitespace-nowrap">
              Extramed Pendências
            </span>
          </div>

          {/* Zone 2: 4 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                currentTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setCurrentTab('proposals')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                currentTab === 'proposals'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Propostas ({totalHealthCount})
            </button>
            <button
              onClick={() => setCurrentTab('brokers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                currentTab === 'brokers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Corretoras & Corretores
            </button>
            <button
              onClick={() => setCurrentTab('raw')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                currentTab === 'raw'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Relatório Bruto ({totalRawCount})
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExecutiveReport}
              title="Dossiê com Indicadores e lista separada por Corretora e Status para Impressão ou Salvar em PDF"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Gerar Dossiê PDF</span>
            </button>

            <button
              onClick={onOpenBrokerModal}
              title="Gerar texto consolidado de cobrança para WhatsApp por corretora"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap hidden lg:inline-flex cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Cobrança Rápida</span>
            </button>

            <button
              onClick={onExportExcel}
              title="Exportar dados filtrados para Excel (CSV)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Importar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
