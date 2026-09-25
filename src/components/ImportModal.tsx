import React, { useState } from 'react';
import { RawContractRow } from '../types';
import {
  parsePastedData,
  ExclusionConfig,
  DEFAULT_EXCLUSION_CONFIG,
} from '../utils/parser';
import {
  X,
  Upload,
  ClipboardPaste,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Settings,
  HelpCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { INITIAL_RAW_DATA } from '../data/initialData';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (newRawRows: RawContractRow[], mode: 'replace' | 'append') => void;
  exclusionConfig: ExclusionConfig;
  setExclusionConfig: React.Dispatch<React.SetStateAction<ExclusionConfig>>;
  onResetToDefaultData: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportData,
  exclusionConfig,
  setExclusionConfig,
  onResetToDefaultData,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'config' | 'guide'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [previewRows, setPreviewRows] = useState<RawContractRow[]>([]);
  const [previewCalculated, setPreviewCalculated] = useState(false);

  // Excluded keywords editing
  const [odontoKw, setOdontoKw] = useState(exclusionConfig.odontoKeywords.join(', '));
  const [vidaKw, setVidaKw] = useState(exclusionConfig.vidaKeywords.join(', '));

  if (!isOpen) return null;

  const handleTestParse = () => {
    const rows = parsePastedData(pastedText, exclusionConfig);
    setPreviewRows(rows);
    setPreviewCalculated(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (text) {
        setPastedText(text);
        const rows = parsePastedData(text, exclusionConfig);
        setPreviewRows(rows);
        setPreviewCalculated(true);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    const rows = previewRows.length > 0 ? previewRows : parsePastedData(pastedText, exclusionConfig);
    if (rows.length === 0) {
      alert('Nenhum dado válido reconhecido. Por favor, verifique o texto colado ou siga o guia de cópia.');
      return;
    }
    onImportData(rows, importMode);
    onClose();
  };

  const handleSaveConfig = () => {
    const newConfig: ExclusionConfig = {
      odontoKeywords: odontoKw.split(',').map(s => s.trim()).filter(Boolean),
      vidaKeywords: vidaKw.split(',').map(s => s.trim()).filter(Boolean),
    };
    setExclusionConfig(newConfig);
    // re-test with new config if text is present
    if (pastedText) {
      const rows = parsePastedData(pastedText, newConfig);
      setPreviewRows(rows);
    }
    setActiveTab('paste');
  };

  const healthCount = previewRows.filter(r => r.classification === 'SAUDE').length;
  const odontoCount = previewRows.filter(r => r.classification === 'ODONTO').length;
  const macCount = previewRows.filter(r => r.classification === 'VIDA_MAC').length;

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
              <ClipboardPaste className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Importar Dados da Extramed (Copiar & Colar)
              </h2>
              <p className="text-xs text-slate-500">
                Alimente o painel copiando diretamente da visualização de impressão ou colando o relatório
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Colar Texto / Arquivo
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Como Copiar da Extramed
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Regras de Exclusão (Odonto & MAC)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-5 flex-1">
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Cole o conteúdo copiado da tela ou da impressão:
                  </label>
                  <label className="text-xs text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ou carregar arquivo (.txt, .tsv, .csv)</span>
                    <input
                      type="file"
                      accept=".txt,.csv,.tsv,.html"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={8}
                  value={pastedText}
                  onPaste={e => {
                    const html = e.clipboardData.getData('text/html');
                    const text = e.clipboardData.getData('text/plain');
                    const contentToUse = (html && html.includes('<tr')) ? html : text;
                    if (contentToUse) {
                      setPastedText(contentToUse);
                      const rows = parsePastedData(contentToUse, exclusionConfig);
                      setPreviewRows(rows);
                      setPreviewCalculated(true);
                    }
                  }}
                  onChange={e => {
                    setPastedText(e.target.value);
                    setPreviewCalculated(false);
                  }}
                  placeholder="Selecione as linhas da tabela no sistema ou na tela de imprimir, copie (Ctrl+C) e cole aqui (Ctrl+V)...&#10;&#10;Exemplo esperado:&#10;23/09/2026  01/10/2026  40679  Recepcionado Contrato...  Validação Dados Pela Extramed  Pedido  CLIENTE...  SUL AMÉRICA COMPANHIA..."
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Action row to test parsing */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestParse}
                    disabled={!pastedText.trim()}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Analisar & Testar Leitura
                  </button>

                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-blue-600"
                      />
                      <span>Substituir base atual</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-blue-600"
                      />
                      <span>Acrescentar aos dados atuais</span>
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onResetToDefaultData();
                    onClose();
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  title="Recarrega as 6 páginas completas originais enviadas no chamado"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar dados de exemplo (6 páginas)</span>
                </button>
              </div>

              {/* Parsing Feedback / Intelligence Result */}
              {previewCalculated && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Resultado do Processamento Inteligente:</span>
                  </div>

                  {previewRows.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[11px]">Total de Linhas:</span>
                        <span className="text-lg font-bold font-mono text-slate-900">
                          {previewRows.length}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-blue-200">
                        <span className="text-blue-700 block text-[11px] font-medium">
                          Propostas Saúde (Painel):
                        </span>
                        <span className="text-lg font-bold font-mono text-blue-900">
                          {healthCount}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[11px]">Odonto Vinculado:</span>
                        <span className="text-lg font-bold font-mono text-slate-700">
                          {odontoCount}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[11px]">Seguro MAC Vinculado:</span>
                        <span className="text-lg font-bold font-mono text-slate-700">
                          {macCount}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Nenhuma linha compatível encontrada. Verifique se copiou a tabela completa com as colunas da Extramed.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-blue-900 text-sm mb-1">
                  Como extrair os dados sem precisar de botão de exportar:
                </h3>
                <p className="text-blue-800">
                  Como seu sistema não possui botão de download em Excel, o método de copiar da página de impressão é extremamente confiável e rápido.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="block text-slate-900">Abra a tela de impressão do relatório:</strong>
                    <span>No seu sistema Extramed, aplique seus filtros e abra a visualização de impressão (aquela mesma tela dos prints que você anexou).</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="block text-slate-900">Selecione e copie o texto:</strong>
                    <span>Clique dentro da página e pressione <kbd className="bg-slate-100 border border-slate-300 px-1 py-0.5 rounded font-mono">Ctrl + A</kbd> (para selecionar tudo) e depois <kbd className="bg-slate-100 border border-slate-300 px-1 py-0.5 rounded font-mono">Ctrl + C</kbd> (para copiar). Ou selecione apenas a tabela com o mouse.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="block text-slate-900">Cole no sistema:</strong>
                    <span>Volte a este painel, clique em "Colar / Importar Relatório", aperte <kbd className="bg-slate-100 border border-slate-300 px-1 py-0.5 rounded font-mono">Ctrl + V</kbd> e clique em "Confirmar Importação".</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </span>
                  <div>
                    <strong className="block text-slate-900">O que o sistema faz automaticamente:</strong>
                    <span>
                      Ele detecta as colunas (<code className="bg-slate-100 px-1 rounded">DATA PRESENTE STATUS, ADESÃO SOLICITADA, Nº, STATUS PEDIDO, STATUS CLIENTE, TIPO, NOME CLIENTE, OPERADORA, CORRETORA, USUARIO, ENTIDADE</code>), reconhece as linhas de Saúde, filtra os benefícios gratuitos (Odonto e Seguro MAC) e agrupa tudo por cliente!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <p className="text-slate-600">
                  Defina os termos usados pelo sistema para detectar produtos auxiliares que <strong>NÃO</strong> devem ser contados como propostas independentes de saúde no painel.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Palavras-chave para Odontológico (separadas por vírgula):
                  </label>
                  <input
                    type="text"
                    value={odontoKw}
                    onChange={e => setOdontoKw(e.target.value)}
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Padrão: ODONTO, ODONTOLOGICO, ODONTOLÓGICO, DENTAL
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Palavras-chave para Seguro de Vida / MAC (separadas por vírgula):
                  </label>
                  <input
                    type="text"
                    value={vidaKw}
                    onChange={e => setVidaKw(e.target.value)}
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Padrão: EXTRAMED - MAC, EXTRAMED MAC, MAC, SEGURO DE VIDA
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveConfig}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Salvar Regras de Exclusão
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {previewRows.length > 0
              ? `${previewRows.length} linhas analisadas prontas para importar`
              : 'Cole o relatório para começar'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={!pastedText.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              Confirmar & Atualizar Painel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
