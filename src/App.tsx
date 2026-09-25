import React, { useState, useMemo, useEffect } from 'react';
import {
  RawContractRow,
  HealthProposal,
  FilterState,
} from './types';
import { INITIAL_RAW_DATA } from './data/initialData';
import {
  aggregateHealthProposals,
  ExclusionConfig,
  DEFAULT_EXCLUSION_CONFIG,
  normalizeFuzzy,
} from './utils/parser';
import { exportToExcelCSV } from './utils/exporter';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
import { StatusFunnelChart } from './components/StatusFunnelChart';
import { BrokerRankingChart } from './components/BrokerRankingChart';
import { ProposalTable } from './components/ProposalTable';
import { ProposalDetailModal } from './components/ProposalDetailModal';
import { ImportModal } from './components/ImportModal';
import { BrokerSummaryModal } from './components/BrokerSummaryModal';
import { PrintExecutiveReportModal } from './components/PrintExecutiveReportModal';
import { RawDataTable } from './components/RawDataTable';

const STORAGE_KEY_RAW = 'extramed_raw_contracts_v2';
const STORAGE_KEY_CONFIG = 'extramed_exclusion_config_v2';

export default function App() {
  // Current Navigation Tab
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'proposals' | 'brokers' | 'raw'>('dashboard');

  // Exclusion config
  const [exclusionConfig, setExclusionConfig] = useState<ExclusionConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_EXCLUSION_CONFIG;
  });

  // Raw rows with auto-healing to ensure 40403 (ARLLEY) is present
  const [rawRows, setRawRows] = useState<RawContractRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RAW);
      if (saved) {
        const parsed: RawContractRow[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If stored data has old 40405 instead of 40403, upgrade to INITIAL_RAW_DATA
          const hasOld40405 = parsed.some(r => r.numero === '40405');
          const has40403 = parsed.some(r => r.numero === '40403');
          if (!hasOld40405 && has40403) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_RAW_DATA;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RAW, JSON.stringify(rawRows));
    } catch (e) {
      console.error(e);
    }
  }, [rawRows]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(exclusionConfig));
    } catch (e) {
      console.error(e);
    }
  }, [exclusionConfig]);

  // Aggregated Health Proposals
  const allHealthProposals = useMemo(() => {
    return aggregateHealthProposals(rawRows, exclusionConfig);
  }, [rawRows, exclusionConfig]);

  // Filter State
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: '',
    statusCliente: '',
    statusPedido: '',
    corretora: '',
    usuario: '',
    entidade: '',
    categoriaPendencia: '',
    urgencia: '',
    dataAdesao: '',
    diasFaixa: 'todos',
    onlyHealth: true,
  });

  // Modals state
  const [selectedProposal, setSelectedProposal] = useState<HealthProposal | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [targetBrokerForReport, setTargetBrokerForReport] = useState<string>('');
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);
  const [targetBrokerForExecutiveReport, setTargetBrokerForExecutiveReport] = useState<string>('');

  // Reset Filters
  const handleResetFilters = () => {
    setFilterState({
      searchTerm: '',
      statusCliente: '',
      statusPedido: '',
      corretora: '',
      usuario: '',
      entidade: '',
      categoriaPendencia: '',
      urgencia: '',
      dataAdesao: '',
      diasFaixa: 'todos',
      onlyHealth: true,
    });
  };

  // Filtered Proposals
  const filteredProposals = useMemo(() => {
    return allHealthProposals.filter(p => {
      // Search term
      if (filterState.searchTerm) {
        const term = filterState.searchTerm.toLowerCase().trim();
        const termFuzzy = normalizeFuzzy(term);

        const matchesClient = p.nomeCliente.toLowerCase().includes(term);
        const matchesClientFuzzy = normalizeFuzzy(p.nomeCliente).includes(termFuzzy);
        const matchesNum = p.numeroSaude.includes(term);
        // Also check if user typed Odonto or MAC number!
        const matchesAuxNum = p.produtosAuxiliares.some(aux => aux.numero.includes(term));
        const matchesBroker = p.corretora.toLowerCase().includes(term) || normalizeFuzzy(p.corretora).includes(termFuzzy);
        const matchesUser = p.usuario.toLowerCase().includes(term) || normalizeFuzzy(p.usuario).includes(termFuzzy);
        const matchesEntity = p.entidade.toLowerCase().includes(term) || normalizeFuzzy(p.entidade).includes(termFuzzy);
        const matchesOperadora = p.operadoraSaude.toLowerCase().includes(term);
        const matchesStatus = p.statusCliente.toLowerCase().includes(term) || p.statusPedido.toLowerCase().includes(term);

        if (
          !matchesClient &&
          !matchesClientFuzzy &&
          !matchesNum &&
          !matchesAuxNum &&
          !matchesBroker &&
          !matchesUser &&
          !matchesEntity &&
          !matchesOperadora &&
          !matchesStatus
        ) {
          return false;
        }
      }

      // Status Cliente
      if (filterState.statusCliente && p.statusCliente !== filterState.statusCliente) {
        return false;
      }

      // Status Pedido
      if (filterState.statusPedido && p.statusPedido !== filterState.statusPedido) {
        return false;
      }

      // Corretora
      if (filterState.corretora && p.corretora !== filterState.corretora) {
        return false;
      }

      // Usuario
      if (filterState.usuario && p.usuario !== filterState.usuario) {
        return false;
      }

      // Entidade
      if (filterState.entidade && p.entidade !== filterState.entidade) {
        return false;
      }

      // Categoria Pendencia
      if (filterState.categoriaPendencia && p.categoriaPendencia !== filterState.categoriaPendencia) {
        return false;
      }

      // Urgencia
      if (filterState.urgencia && p.urgencia !== filterState.urgencia) {
        return false;
      }

      // SLA / Dias Faixa
      if (filterState.diasFaixa === 'critico' && p.diasNoStatus < 8) return false;
      if (filterState.diasFaixa === 'alerta' && (p.diasNoStatus < 4 || p.diasNoStatus > 7)) return false;
      if (filterState.diasFaixa === 'recente' && p.diasNoStatus > 3) return false;

      return true;
    });
  }, [allHealthProposals, filterState]);

  // Import Handler
  const handleImportData = (newRaw: RawContractRow[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setRawRows(newRaw);
    } else {
      setRawRows(prev => [...prev, ...newRaw]);
    }
  };

  // Reset to initial demo dataset (6 pages)
  const handleResetToDefaultData = () => {
    setRawRows(INITIAL_RAW_DATA);
    setExclusionConfig(DEFAULT_EXCLUSION_CONFIG);
    handleResetFilters();
  };

  // Export to Excel
  const handleExportExcel = () => {
    exportToExcelCSV(filteredProposals, `relatorio_pendencias_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Open broker modal with specific broker
  const handleOpenBrokerReport = (brokerName: string) => {
    setTargetBrokerForReport(brokerName);
    setIsBrokerModalOpen(true);
  };

  // Open executive dossier modal
  const handleOpenExecutiveReport = (brokerName?: string) => {
    setTargetBrokerForExecutiveReport(brokerName || 'ALL');
    setIsExecutiveReportOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenBrokerModal={() => {
          setTargetBrokerForReport('');
          setIsBrokerModalOpen(true);
        }}
        onOpenExecutiveReport={() => handleOpenExecutiveReport()}
        onExportExcel={handleExportExcel}
        onResetData={handleResetToDefaultData}
        totalHealthCount={allHealthProposals.length}
        totalRawCount={rawRows.length}
      />

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* KPI Ribbons & Smart filter info */}
        <KpiCards
          proposals={allHealthProposals}
          filterState={filterState}
          setFilterState={setFilterState}
          totalRawRowsCount={rawRows.length}
          onOpenPrintExecutiveReport={() => handleOpenExecutiveReport()}
        />

        {/* Global Filter Bar */}
        <FilterBar
          filterState={filterState}
          setFilterState={setFilterState}
          allProposals={allHealthProposals}
          allRawRows={rawRows}
          onResetFilters={handleResetFilters}
          onOpenPrintExecutiveReport={() => handleOpenExecutiveReport()}
        />

        {/* TAB 1: DASHBOARD (Overview with charts + table) */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatusFunnelChart
                proposals={allHealthProposals}
                filterState={filterState}
                setFilterState={setFilterState}
              />
              <BrokerRankingChart
                proposals={allHealthProposals}
                filterState={filterState}
                setFilterState={setFilterState}
                onOpenBrokerReport={handleOpenBrokerReport}
                onOpenPrintExecutiveReport={handleOpenExecutiveReport}
              />
            </div>

            <ProposalTable
              proposals={filteredProposals}
              onSelectProposal={setSelectedProposal}
              onOpenPrintExecutiveReport={() => handleOpenExecutiveReport()}
              onExportExcel={handleExportExcel}
            />
          </div>
        )}

        {/* TAB 2: PROPOSALS (Focused Table View) */}
        {currentTab === 'proposals' && (
          <div className="space-y-4">
            <ProposalTable
              proposals={filteredProposals}
              onSelectProposal={setSelectedProposal}
              onOpenPrintExecutiveReport={() => handleOpenExecutiveReport()}
              onExportExcel={handleExportExcel}
            />
          </div>
        )}

        {/* TAB 3: BROKERS & PARTNERS TRACKER */}
        {currentTab === 'brokers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <BrokerRankingChart
                  proposals={allHealthProposals}
                  filterState={filterState}
                  setFilterState={setFilterState}
                  onOpenBrokerReport={handleOpenBrokerReport}
                  onOpenPrintExecutiveReport={handleOpenExecutiveReport}
                />
              </div>
              <div className="lg:col-span-2">
                <ProposalTable
                  proposals={filteredProposals}
                  onSelectProposal={setSelectedProposal}
                  onOpenPrintExecutiveReport={() => handleOpenExecutiveReport()}
                  onExportExcel={handleExportExcel}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RAW DATA / AUDIT VIEW */}
        {currentTab === 'raw' && (
          <div className="space-y-4">
            <RawDataTable rawRows={rawRows} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Painel de Pendências Extramed</span>
            <span>·</span>
            <span>Versão para Gestão Comercial NE</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenExecutiveReport()}
              className="text-blue-600 hover:underline font-medium"
            >
              Imprimir Dossiê de Pendências
            </button>
            <span>·</span>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="text-slate-600 hover:text-slate-900"
            >
              Importar Novo Relatório
            </button>
            <span>·</span>
            <button
              onClick={handleExportExcel}
              className="text-slate-600 hover:text-slate-900"
            >
              Exportar para Excel (.csv)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProposalDetailModal
        proposal={selectedProposal}
        onClose={() => setSelectedProposal(null)}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportData={handleImportData}
        exclusionConfig={exclusionConfig}
        setExclusionConfig={setExclusionConfig}
        onResetToDefaultData={handleResetToDefaultData}
      />

      <BrokerSummaryModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        proposals={allHealthProposals}
        initialBroker={targetBrokerForReport}
        onOpenPrintExecutiveReport={handleOpenExecutiveReport}
      />

      <PrintExecutiveReportModal
        isOpen={isExecutiveReportOpen}
        onClose={() => setIsExecutiveReportOpen(false)}
        proposals={allHealthProposals}
        totalRawRowsCount={rawRows.length}
        initialBroker={targetBrokerForExecutiveReport}
        onSelectProposal={setSelectedProposal}
      />
    </div>
  );
}
