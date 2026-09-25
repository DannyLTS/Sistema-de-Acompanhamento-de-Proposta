import React, { useState } from 'react';
import { HealthProposal } from '../types';
import {
  X,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Shield,
  Stethoscope,
  Building,
  User,
  Clock,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { generateProposalWhatsAppText } from '../utils/exporter';

interface ProposalDetailModalProps {
  proposal: HealthProposal | null;
  onClose: () => void;
}

export const ProposalDetailModal: React.FC<ProposalDetailModalProps> = ({
  proposal,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!proposal) return null;

  const whatsappText = generateProposalWhatsAppText(proposal);

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                PROPOSTA #{proposal.numeroSaude}
              </span>
              <span className="text-xs text-slate-500">
                Adesão: {proposal.adesaoSolicitada}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              {proposal.nomeCliente}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Main Health Status Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span>Plano Principal (Saúde - Fonte de Status)</span>
            </div>
            <div className="text-sm font-bold text-slate-900 mb-1">
              {proposal.operadoraSaude}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Status do Cliente:</span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {proposal.statusCliente}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Status do Pedido:</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {proposal.statusPedido}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Data do Status:</span>
                <span className="font-mono tabular-nums text-slate-800 block mt-0.5">
                  {proposal.dataPresenteStatus}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Tempo no Status (SLA):</span>
                <span className="font-mono tabular-nums font-bold text-amber-800 block mt-0.5">
                  {proposal.diasNoStatus} dias decorridos
                </span>
              </div>
            </div>
          </div>

          {/* Brokerage & Broker Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Corretora Parceira</span>
              </div>
              <p className="font-semibold text-slate-900">
                {proposal.corretora}
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Consultor / Corretor</span>
              </div>
              <p className="font-semibold text-slate-900">
                {proposal.usuario}
              </p>
            </div>
          </div>

          {/* Entity */}
          <div className="border border-slate-200 rounded-xl p-3.5 text-xs">
            <span className="text-slate-500 block font-medium">Entidade de Classe / Estipulante:</span>
            <span className="font-semibold text-slate-900 block mt-0.5">
              {proposal.entidade}
            </span>
          </div>

          {/* Linked Auxiliary Products */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Benefícios Adicionais Vinculados (Odonto & MAC)
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Produtos gratuitos/adicionais associados ao mesmo CPF/cliente no sistema da Extramed. O status oficial da proposta é guiado pelo plano de saúde acima.
            </p>

            <div className="space-y-2">
              {proposal.produtosAuxiliares.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Nenhum produto auxiliar vinculado nesta proposta.
                </p>
              ) : (
                proposal.produtosAuxiliares.map((aux, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-800">
                          Nº {aux.numero}
                        </span>
                        <span className="font-medium text-slate-600">
                          {aux.tipo === 'ODONTO' ? 'Odontológico Adesão' : 'Seguro de Vida Extramed MAC'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-sm">
                        {aux.operadora}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-600 block">
                        {aux.statusCliente}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* WhatsApp / Email Cobrança Generator */}
          <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Mensagem Pronta para Envio ao Corretor</span>
              </div>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>

            <pre className="text-xs font-sans text-slate-800 bg-white p-3 rounded-lg border border-blue-100 whitespace-pre-wrap leading-relaxed">
              {whatsappText}
            </pre>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={handleOpenWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Abrir WhatsApp Web</span>
              </button>
            </div>
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
