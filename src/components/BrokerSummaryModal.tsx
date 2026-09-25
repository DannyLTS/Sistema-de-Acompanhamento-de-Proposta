import React, { useState } from 'react';
import { HealthProposal } from '../types';
import { generateBrokerBatchReport } from '../utils/exporter';
import { X, Building2, Copy, Check, MessageCircle, AlertCircle, Printer } from 'lucide-react';

interface BrokerSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: HealthProposal[];
  initialBroker?: string;
  onOpenPrintExecutiveReport?: (brokerName: string) => void;
}

export const BrokerSummaryModal: React.FC<BrokerSummaryModalProps> = ({
  isOpen,
  onClose,
  proposals,
  initialBroker,
  onOpenPrintExecutiveReport,
}) => {
  const brokers = Array.from(
    new Set(proposals.map(p => p.corretora).filter(Boolean))
  ).sort();

  const [selectedBroker, setSelectedBroker] = useState<string>(
    initialBroker || brokers[0] || ''
  );
  const [copied, setCopied] = useState(false);

  // Sync if initialBroker changes
  React.useEffect(() => {
    if (initialBroker) {
      setSelectedBroker(initialBroker);
    } else if (!selectedBroker && brokers.length > 0) {
      setSelectedBroker(brokers[0]);
    }
  }, [initialBroker, brokers]);

  if (!isOpen) return null;

  const currentReport = selectedBroker
    ? generateBrokerBatchReport(proposals, selectedBroker)
    : '';

  const brokerProposals = proposals.filter(
    p => p.corretora.trim().toUpperCase() === selectedBroker.trim().toUpperCase()
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(currentReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(currentReport);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Relatório Consolidado de Cobrança por Corretora
              </h2>
              <p className="text-xs text-slate-500">
                Gere e envie a lista de pendências para os parceiros com 1 clique
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 flex-1">
          {/* Select Broker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Selecione a Corretora Parceira:
            </label>
            <select
              value={selectedBroker}
              onChange={e => setSelectedBroker(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              {brokers.map(b => {
                const count = proposals.filter(p => p.corretora === b).length;
                return (
                  <option key={b} value={b}>
                    {b} ({count} {count === 1 ? 'proposta pendente' : 'propostas pendentes'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick Stat Pill */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{selectedBroker}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-mono tabular-nums">
                {brokerProposals.length} propostas listadas
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onOpenPrintExecutiveReport && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPrintExecutiveReport(selectedBroker);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  title="Abrir dossiê formatado para impressão ou PDF com indicadores e lista de pendências"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Dossiê para Impressão</span>
                </button>
              )}

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copiar Relatório</span>
                  </>
                )}
              </button>

              <button
                onClick={handleOpenWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar pelo WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Message Preview */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100/80 px-4 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200">
              Texto Formatado para Envio:
            </div>
            <pre className="p-4 bg-white text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[340px] overflow-y-auto">
              {currentReport}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
