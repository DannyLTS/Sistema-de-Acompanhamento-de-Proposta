import { HealthProposal } from '../types';

/**
 * Exports current health proposals to a CSV formatted for Brazilian Excel (semicolon separator + UTF-8 BOM).
 */
export function exportToExcelCSV(proposals: HealthProposal[], filename: string = 'relatorio_pendencias_saude.csv') {
  const headers = [
    'Nº Proposta Saúde',
    'Data Status',
    'Dias Parado',
    'Adesão Solicitada',
    'Cliente',
    'Status Cliente',
    'Status Pedido',
    'Categoria Pendência',
    'Urgência',
    'Operadora Saúde',
    'Corretora',
    'Corretor / Usuário',
    'Entidade',
    'Nº Odonto Vinculado',
    'Nº Seguro MAC Vinculado',
  ];

  const rows = proposals.map(p => {
    const odonto = p.produtosAuxiliares.find(a => a.tipo === 'ODONTO')?.numero || 'N/A';
    const mac = p.produtosAuxiliares.find(a => a.tipo === 'VIDA_MAC')?.numero || 'N/A';

    return [
      `"${p.numeroSaude}"`,
      `"${p.dataPresenteStatus}"`,
      p.diasNoStatus,
      `"${p.adesaoSolicitada}"`,
      `"${p.nomeCliente.replace(/"/g, '""')}"`,
      `"${p.statusCliente.replace(/"/g, '""')}"`,
      `"${p.statusPedido.replace(/"/g, '""')}"`,
      `"${p.categoriaPendencia}"`,
      `"${p.urgencia}"`,
      `"${p.operadoraSaude.replace(/"/g, '""')}"`,
      `"${p.corretora.replace(/"/g, '""')}"`,
      `"${p.usuario.replace(/"/g, '""')}"`,
      `"${p.entidade.replace(/"/g, '""')}"`,
      `"${odonto}"`,
      `"${mac}"`,
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates formatted text message for a broker or single proposal to send via WhatsApp or Email.
 */
export function generateProposalWhatsAppText(p: HealthProposal): string {
  return (
    `*📋 ACOMPANHAMENTO DE PENDÊNCIA - EXTRAMED*\n\n` +
    `👤 *Cliente:* ${p.nomeCliente}\n` +
    `📄 *Proposta Saúde Nº:* ${p.numeroSaude}\n` +
    `🏥 *Operadora:* ${p.operadoraSaude}\n` +
    `🏛️ *Entidade:* ${p.entidade}\n` +
    `📅 *Adesão Solicitada:* ${p.adesaoSolicitada}\n` +
    `⏳ *Dias no Status:* ${p.diasNoStatus} dias (Desde ${p.dataPresenteStatus})\n\n` +
    `⚠️ *STATUS DO CLIENTE:* ${p.statusCliente}\n` +
    `📌 *STATUS DO PEDIDO:* ${p.statusPedido}\n\n` +
    `Favor verificar com prioridade para garantirmos a vigência em ${p.adesaoSolicitada}!`
  );
}

/**
 * Generates an aggregated broker pendency summary.
 */
export function generateBrokerBatchReport(proposals: HealthProposal[], brokerName: string): string {
  const brokerProps = proposals.filter(p => p.corretora.trim().toUpperCase() === brokerName.trim().toUpperCase());
  if (brokerProps.length === 0) return 'Nenhuma pendência encontrada para esta corretora.';

  const lines = [
    `*📊 RELATÓRIO CONSOLIDADO DE PENDÊNCIAS*`,
    `🏢 *Corretora:* ${brokerName}`,
    `📦 *Total de Propostas com Pendências:* ${brokerProps.length}`,
    `📅 *Data de Emissão:* ${new Date().toLocaleDateString('pt-BR')}`,
    `----------------------------------------`,
  ];

  brokerProps.forEach((p, idx) => {
    lines.push(
      `${idx + 1}. *${p.nomeCliente}* (Nº ${p.numeroSaude})` +
      `\n   • Pendência: ${p.statusCliente}` +
      `\n   • Operadora: ${p.operadoraSaude}` +
      `\n   • Corretor: ${p.usuario}` +
      `\n   • Parado há: ${p.diasNoStatus} dias`
    );
  });

  lines.push(`\nPor favor, solicitamos apoio para resolução junto aos segurados.`);
  return lines.join('\n');
}
