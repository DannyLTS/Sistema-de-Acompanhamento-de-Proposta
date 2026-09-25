import { RawContractRow, HealthProposal, ProductClassification, PendencyCategory } from '../types';

export interface ExclusionConfig {
  odontoKeywords: string[];
  vidaKeywords: string[];
}

export const DEFAULT_EXCLUSION_CONFIG: ExclusionConfig = {
  odontoKeywords: ['ODONTO', 'ODONTOLOGICO', 'ODONTOLÓGICO', 'DENTAL'],
  vidaKeywords: ['EXTRAMED - MAC', 'EXTRAMED MAC', 'MAC', 'SEGURO DE VIDA'],
};

/**
 * Normalizes string for fuzzy/typo-tolerant comparison:
 * removes accents, lowercases, collapses whitespace, normalizes asterisks, and collapses double consonants.
 */
export function normalizeFuzzy(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[\*\.\-_]/g, ' ') // remove asterisks and punctuation
    .replace(/(.)\1+/g, '$1') // collapse repeated characters (e.g. ll -> l, ss -> s)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Classifies an operadora string into SAUDE, ODONTO, or VIDA_MAC based on configuration.
 */
export function classifyOperadora(operadora: string, config: ExclusionConfig = DEFAULT_EXCLUSION_CONFIG): ProductClassification {
  const upper = (operadora || '').toUpperCase().trim();

  // Check Odonto keywords
  for (const kw of config.odontoKeywords) {
    if (upper.includes(kw.toUpperCase())) {
      return 'ODONTO';
    }
  }

  // Check Life/MAC keywords
  for (const kw of config.vidaKeywords) {
    if (upper.includes(kw.toUpperCase())) {
      return 'VIDA_MAC';
    }
  }

  // Otherwise, default to Health (SAUDE)
  return 'SAUDE';
}

/**
 * Categorizes the client/order status into actionable buckets.
 */
export function categorizePendency(statusCliente: string, statusPedido: string): PendencyCategory {
  const sc = (statusCliente || '').toUpperCase();
  const sp = (statusPedido || '').toUpperCase();

  if (sc.includes('NÃO EFETIVADA') || sc.includes('CANCELAD') || sp.includes('NÃO EFETIVADA')) {
    return 'NAO_EFETIVADO';
  }
  if (sc.includes('CPT') || sp.includes('CPT')) {
    return 'CPT';
  }
  if (sc.includes('ENTREVISTA') || sp.includes('ENTREVISTA')) {
    return 'ENTREVISTA';
  }
  if (sc.includes('ASSINATURA') || sp.includes('ASSINATURA') || sp.includes('ENVIADO CONTRATO PARA ASSINATURA')) {
    return 'ASSINATURA';
  }
  if (sc.includes('VALIDAÇÃO') || sc.includes('VALIDACAO') || sp.includes('RECEPCIONADO')) {
    return 'VALIDACAO';
  }
  if (sc.includes('INFORMATIVO')) {
    return 'INFORMATIVO';
  }
  if (sc.includes('ANEXOS') || sc.includes('COMPROBATÓRIOS') || sc.includes('COMPROBATORIOS')) {
    return 'ANEXOS';
  }
  if (sp.includes('CADASTRADO NO GCP') || sp.includes('ATIVAÇÃO') || sp.includes('ATIVACAO')) {
    return 'CONCLUIDO';
  }

  return 'VALIDACAO';
}

/**
 * Calculates days elapsed between a DD/MM/YYYY date and reference date (defaulting to report run date: 25/09/2026).
 */
export function calculateDaysElapsed(dateStr: string, referenceDate: Date = new Date(2026, 8, 25)): number {
  if (!dateStr) return 0;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return 0;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;

  const statusDate = new Date(year, month, day);
  const diffTime = referenceDate.getTime() - statusDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculates urgency rating based on category and days in status.
 */
export function calculateUrgency(
  categoria: PendencyCategory,
  diasNoStatus: number,
  statusCliente: string
): 'CRITICO' | 'ALERTA' | 'NORMAL' | 'FINALIZADO' | 'CANCELADO' {
  if (categoria === 'NAO_EFETIVADO') return 'CANCELADO';
  if (categoria === 'CONCLUIDO' && statusCliente.includes('Informativo')) return 'NORMAL';
  if (categoria === 'CPT' || categoria === 'ENTREVISTA') {
    return diasNoStatus >= 5 ? 'CRITICO' : 'ALERTA';
  }
  if (categoria === 'ASSINATURA') {
    return diasNoStatus >= 4 ? 'CRITICO' : 'ALERTA';
  }
  if (diasNoStatus >= 10) return 'CRITICO';
  if (diasNoStatus >= 5) return 'ALERTA';
  return 'NORMAL';
}

/**
 * Parses raw text copied from the browser print page, tab-separated text, or HTML table into RawContractRow[].
 * Supports multiline cell wrapping, table HTML, tabs, or space-separated tabular text.
 */
export function parsePastedData(text: string, config: ExclusionConfig = DEFAULT_EXCLUSION_CONFIG): RawContractRow[] {
  const rows: RawContractRow[] = [];
  if (!text || typeof text !== 'string') return rows;

  // 1. Check if input contains HTML table rows
  if (text.includes('<tr') && text.includes('<td')) {
    const htmlRows = parseFromHtml(text, config);
    if (htmlRows.length > 0) {
      return htmlRows;
    }
  }

  // 2. Pre-process lines: Reconcile wrapped lines that broke inside a cell
  // A new record in this Extramed report ALWAYS starts with:
  // "DD/MM/YYYY" followed by another date "DD/MM/YYYY" or contract number
  const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const consolidatedLines: string[] = [];
  let currentRecord = '';

  const newRecordRegex = /^\d{2}\/\d{2}\/\d{4}[\s\t]+\d{2}\/\d{2}\/\d{4}/;

  for (const line of rawLines) {
    // Ignore header rows
    if (line.toUpperCase().includes('DATA PRESENTE STATUS') || line.toUpperCase().includes('STATUS PEDIDO\tSTATUS CLIENTE')) {
      continue;
    }

    if (newRecordRegex.test(line)) {
      if (currentRecord) {
        consolidatedLines.push(currentRecord);
      }
      currentRecord = line;
    } else {
      if (currentRecord) {
        // Line continuation of the previous record cell
        currentRecord += ' ' + line;
      } else {
        // First line might not match if headers were stripped or formatted differently
        currentRecord = line;
      }
    }
  }
  if (currentRecord) {
    consolidatedLines.push(currentRecord);
  }

  // 3. Parse each consolidated line
  for (let i = 0; i < consolidatedLines.length; i++) {
    const recordText = consolidatedLines[i];
    const row = parseSingleRecord(recordText, config, rows.length);
    if (row) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Parses HTML table elements if user pasted rich text or web snippet.
 */
function parseFromHtml(html: string, config: ExclusionConfig): RawContractRow[] {
  const rows: RawContractRow[] = [];
  try {
    if (typeof window !== 'undefined' && window.DOMParser) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const trs = doc.querySelectorAll('tr');

      trs.forEach((tr, idx) => {
        const tds = Array.from(tr.querySelectorAll('td, th')).map(el => (el.textContent || '').trim());
        if (tds.length >= 8 && /^\d{2}\/\d{2}\/\d{4}/.test(tds[0])) {
          const row = createRowFromParts(tds, config, idx);
          if (row) rows.push(row);
        }
      });
    }
  } catch (e) {
    console.error('Error parsing HTML table snippet:', e);
  }
  return rows;
}

/**
 * Parses a single record line into a RawContractRow.
 */
function parseSingleRecord(recordText: string, config: ExclusionConfig, index: number): RawContractRow | null {
  // If tab-separated
  if (recordText.includes('\t')) {
    const parts = recordText.split('\t').map(p => p.trim());
    if (parts.length >= 8) {
      return createRowFromParts(parts, config, index);
    }
  }

  // Fallback: 2 or more spaces separated
  const spaceParts = recordText.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
  if (spaceParts.length >= 8 && /^\d{2}\/\d{2}\/\d{4}/.test(spaceParts[0])) {
    return createRowFromParts(spaceParts, config, index);
  }

  // Fallback: Semantic Regex Matcher
  // Matches "17/09/2026 01/10/2026 40403 Contrato Assinado..."
  const regex = /^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{4,7})\s+(.+)$/;
  const match = recordText.match(regex);
  if (!match) return null;

  const [, dataPresente, adesao, numero, rest] = match;

  // Identify Operadora and Classification
  let operadora = 'SUL AMÉRICA COMPANHIA DE SEGURO SAÚDE (ANS-006246) - AMB+HOSP+OBST - PE (2607)';
  let classification: ProductClassification = 'SAUDE';

  if (rest.toUpperCase().includes('EXTRAMED - MAC') || rest.toUpperCase().includes('EXTRAMED MAC')) {
    operadora = 'EXTRAMED - MAC';
    classification = 'VIDA_MAC';
  } else if (rest.toUpperCase().includes('ODONTO')) {
    operadora = 'SULAMERICA COLETIVO POR ADESÃO ODONTO (2607) - ROL ANS';
    classification = 'ODONTO';
  } else if (rest.toUpperCase().includes('SEGURO SAÚDE') || rest.toUpperCase().includes('SEGURO SAUDE')) {
    operadora = 'SUL AMÉRICA COMPANHIA DE SEGURO SAÚDE (ANS-006246) - AMB+HOSP+OBST - PE (2607)';
    classification = 'SAUDE';
  }

  // Identify Status Cliente
  let statusCliente = 'Validação Dados Pela Extramed';
  if (rest.toUpperCase().includes('ENTREVISTA')) {
    statusCliente = 'Realização da Entrevista (individual para maiores de 18anos)';
  } else if (rest.toUpperCase().includes('INFORMATIVO')) {
    statusCliente = 'Informativo enviado ao cliente';
  } else if (rest.toUpperCase().includes('CPT')) {
    statusCliente = 'Aguardando Assinatura de CPT';
  } else if (rest.toUpperCase().includes('ASSINATURA PROPOSTA PELA CORRETORA')) {
    statusCliente = 'Assinatura Proposta pela Corretora';
  } else if (rest.toUpperCase().includes('ASSINATURA PROPOSTA PELO CLIENTE')) {
    statusCliente = 'Assinatura Proposta pelo cliente';
  } else if (rest.toUpperCase().includes('NÃO EFETIVADA')) {
    statusCliente = 'Proposta não efetivada';
  } else if (rest.toUpperCase().includes('ANEXOS')) {
    statusCliente = 'Upload dos anexos comprobatórios';
  }

  // Identify Status Pedido
  let statusPedido = 'Contrato Assinado Digitalmente Cadastrado no GCP';
  if (rest.toUpperCase().includes('RECEPCIONADO')) {
    statusPedido = 'Recepcionado Contrato Assinado Digitalmente pelo Consultor/Corretor e Proponente';
  } else if (rest.toUpperCase().includes('AGUARDANDO ASSINATURA DIGITAL NO CONTRATO')) {
    statusPedido = 'Aguardando Assinatura Digital no Contrato do Consultor/Corretor';
  } else if (rest.toUpperCase().includes('ENVIADO CONTRATO PARA ASSINATURA')) {
    statusPedido = 'Enviado Contrato para assinatura digital do Consultor/Corretor e Proponente';
  } else if (rest.toUpperCase().includes('AGUARDANDO ATIVAÇÃO DA CONTA')) {
    statusPedido = 'Aguardando Ativação da Conta';
  } else if (rest.toUpperCase().includes('PROPOSTA NÃO EFETIVADA')) {
    statusPedido = 'Proposta não efetivada';
  }

  // Attempt to extract client name by locating text between "Pedido" and Operadora
  let nomeCliente = 'Cliente #' + numero;
  const pedidoIdx = rest.search(/\bPedido\b/i);
  if (pedidoIdx !== -1) {
    const afterPedido = rest.slice(pedidoIdx + 6).trim();
    // find next token for operadora
    const operadoraMatches = ['SULAMERICA', 'SUL AMÉRICA', 'EXTRAMED', 'OPERADORA'];
    let minIdx = -1;
    for (const op of operadoraMatches) {
      const idx = afterPedido.toUpperCase().indexOf(op);
      if (idx !== -1 && (minIdx === -1 || idx < minIdx)) {
        minIdx = idx;
      }
    }
    if (minIdx !== -1) {
      const extractedName = afterPedido.slice(0, minIdx).trim();
      if (extractedName.length > 2) {
        nomeCliente = extractedName;
      }
    }
  }

  return {
    id: `${numero || index}-${classification}-${Math.random().toString(36).substring(2, 7)}`,
    dataPresenteStatus: dataPresente,
    adesaoSolicitada: adesao,
    numero,
    statusPedido,
    statusCliente,
    tipo: 'Pedido',
    nomeCliente,
    operadora,
    corretora: 'Corretora Parceira',
    usuario: 'Consultor',
    entidade: 'Entidade de Classe',
    classification,
  };
}

function createRowFromParts(parts: string[], config: ExclusionConfig, index: number): RawContractRow | null {
  // Expected sequence:
  // 0: DATA PRESENTE STATUS
  // 1: ADESÃO SOLICITADA
  // 2: Nº
  // 3: STATUS PEDIDO
  // 4: STATUS CLIENTE
  // 5: TIPO
  // 6: NOME CLIENTE
  // 7: OPERADORA
  // 8: CORRETORA
  // 9: USUARIO
  // 10: ENTIDADE

  if (parts.length < 7) return null;

  const dataPresente = parts[0] || '';
  const adesao = parts[1] || '';
  const numero = parts[2] || '';
  const statusPedido = parts[3] || '';
  const statusCliente = parts[4] || '';
  const tipo = parts[5] || 'Pedido';
  const nomeCliente = parts[6] || '';
  const operadora = parts[7] || '';
  const corretora = parts[8] || '';
  const usuario = parts[9] || '';
  const entidade = parts[10] || '';

  const classification = classifyOperadora(operadora, config);

  return {
    id: `${numero || index}-${classification}-${Math.random().toString(36).substring(2, 7)}`,
    dataPresenteStatus: dataPresente,
    adesaoSolicitada: adesao,
    numero,
    statusPedido,
    statusCliente,
    tipo,
    nomeCliente,
    operadora,
    corretora,
    usuario,
    entidade,
    classification,
  };
}

/**
 * Intelligent Aggregator:
 * Takes raw contract rows (which contain 3 rows per client: Health + Odonto + MAC)
 * and produces consolidated Health Proposals with auxiliary products linked.
 *
 * Guaranteed to never drop a health proposal, even if client names have asterisks or formatting variations.
 */
export function aggregateHealthProposals(
  rawRows: RawContractRow[],
  config: ExclusionConfig = DEFAULT_EXCLUSION_CONFIG
): HealthProposal[] {
  // Group rows by Normalized Client Name + Adhesion Date
  const groupMap = new Map<string, RawContractRow[]>();

  for (const row of rawRows) {
    const fuzzyName = normalizeFuzzy(row.nomeCliente);
    const key = `${fuzzyName}__${(row.adesaoSolicitada || '').trim()}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(row);
  }

  const proposals: HealthProposal[] = [];

  groupMap.forEach((rows, key) => {
    // Separate Health rows from Auxiliary (Odonto & MAC) rows
    const healthRows = rows.filter(r => r.classification === 'SAUDE');
    const auxiliaryRows = rows.filter(r => r.classification !== 'SAUDE');

    // Case 1: Standard client with at least 1 Health row
    if (healthRows.length > 0) {
      healthRows.forEach(healthRow => {
        const auxiliares: HealthProposal['produtosAuxiliares'] = auxiliaryRows.map(r => ({
          tipo: r.classification,
          numero: r.numero,
          operadora: r.operadora,
          statusPedido: r.statusPedido,
          statusCliente: r.statusCliente,
        }));

        const categoriaPendencia = categorizePendency(healthRow.statusCliente, healthRow.statusPedido);
        const diasNoStatus = calculateDaysElapsed(healthRow.dataPresenteStatus);
        const urgencia = calculateUrgency(categoriaPendencia, diasNoStatus, healthRow.statusCliente);

        proposals.push({
          id: healthRow.numero || `prop-${key}`,
          numeroSaude: healthRow.numero,
          nomeCliente: healthRow.nomeCliente,
          operadoraSaude: healthRow.operadora,
          statusPedido: healthRow.statusPedido,
          statusCliente: healthRow.statusCliente,
          tipo: healthRow.tipo,
          dataPresenteStatus: healthRow.dataPresenteStatus,
          adesaoSolicitada: healthRow.adesaoSolicitada,
          corretora: healthRow.corretora,
          usuario: healthRow.usuario,
          entidade: healthRow.entidade,
          categoriaPendencia,
          diasNoStatus,
          urgencia,
          produtosAuxiliares: auxiliares,
          rawRows: rows,
        });
      });
    } else if (rows.length > 0) {
      // Case 2: Only auxiliary rows entered (e.g. odonto-only or life-only without health)
      const primaryRow = rows[0];
      const otherAux = rows.slice(1).map(r => ({
        tipo: r.classification,
        numero: r.numero,
        operadora: r.operadora,
        statusPedido: r.statusPedido,
        statusCliente: r.statusCliente,
      }));

      const categoriaPendencia = categorizePendency(primaryRow.statusCliente, primaryRow.statusPedido);
      const diasNoStatus = calculateDaysElapsed(primaryRow.dataPresenteStatus);
      const urgencia = calculateUrgency(categoriaPendencia, diasNoStatus, primaryRow.statusCliente);

      proposals.push({
        id: primaryRow.numero || `prop-${key}`,
        numeroSaude: primaryRow.numero,
        nomeCliente: primaryRow.nomeCliente,
        operadoraSaude: primaryRow.operadora,
        statusPedido: primaryRow.statusPedido,
        statusCliente: primaryRow.statusCliente,
        tipo: primaryRow.tipo,
        dataPresenteStatus: primaryRow.dataPresenteStatus,
        adesaoSolicitada: primaryRow.adesaoSolicitada,
        corretora: primaryRow.corretora,
        usuario: primaryRow.usuario,
        entidade: primaryRow.entidade,
        categoriaPendencia,
        diasNoStatus,
        urgencia,
        produtosAuxiliares: otherAux,
        rawRows: rows,
      });
    }
  });

  // Sort by date present status descending, then by urgency
  return proposals.sort((a, b) => {
    if (a.urgencia === 'CRITICO' && b.urgencia !== 'CRITICO') return -1;
    if (b.urgencia === 'CRITICO' && a.urgencia !== 'CRITICO') return 1;
    return b.diasNoStatus - a.diasNoStatus;
  });
}
