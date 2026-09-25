export type ProductClassification = 'SAUDE' | 'ODONTO' | 'VIDA_MAC' | 'OUTRO';

export type PendencyCategory =
  | 'ASSINATURA'
  | 'ENTREVISTA'
  | 'VALIDACAO'
  | 'INFORMATIVO'
  | 'ANEXOS'
  | 'CPT'
  | 'CONCLUIDO'
  | 'NAO_EFETIVADO';

export interface RawContractRow {
  id: string;
  dataPresenteStatus: string;
  adesaoSolicitada: string;
  numero: string;
  statusPedido: string;
  statusCliente: string;
  tipo: string;
  nomeCliente: string;
  operadora: string;
  corretora: string;
  usuario: string;
  entidade: string;
  classification: ProductClassification;
}

export interface AuxiliaryProduct {
  tipo: ProductClassification;
  numero: string;
  operadora: string;
  statusPedido: string;
  statusCliente: string;
}

export interface HealthProposal {
  id: string;
  numeroSaude: string;
  nomeCliente: string;
  operadoraSaude: string;
  statusPedido: string;
  statusCliente: string;
  tipo: string;
  dataPresenteStatus: string;
  adesaoSolicitada: string;
  corretora: string;
  usuario: string;
  entidade: string;
  categoriaPendencia: PendencyCategory;
  diasNoStatus: number;
  urgencia: 'CRITICO' | 'ALERTA' | 'NORMAL' | 'FINALIZADO' | 'CANCELADO';
  produtosAuxiliares: AuxiliaryProduct[];
  rawRows: RawContractRow[];
}

export interface FilterState {
  searchTerm: string;
  statusCliente: string;
  statusPedido: string;
  corretora: string;
  usuario: string;
  entidade: string;
  categoriaPendencia: string;
  urgencia: string;
  dataAdesao: string;
  diasFaixa: string; // 'todos' | '0-3' | '4-7' | '8+'
  onlyHealth: boolean; // True to filter out Odonto & MAC
}
