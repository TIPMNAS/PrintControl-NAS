export type RelatorioDetalheCabecalho = {
  id: string
  contratoId: string | null
  arquivoPath: string | null
  nomeArquivo: string
  mesReferencia: string
  classificacaoAf: string | null
  status: string
  valorBruto: number
  retencao: number
  valorLiquido: number
  valorCalculado: number
  jsonExtraido: unknown
  createdAt: string
}

export type RelatorioDetalheLeitura = {
  id: string
  equipamentoId: string | null
  modelo: string | null
  serie: string | null
  site: string | null
  departamento: string | null
  antPb: number
  atuPb: number
  saldoPb: number
  antCor: number
  atuCor: number
  saldoCor: number
  totalGeralPdf: number
  totalCalculado: number
  divergente: boolean
}

export type RelatorioDetalheDivergencia = {
  id: string
  tipo: string
  descricao: string
  valorPdf: string | null
  valorCalculado: string | null
  resolvida: boolean
  createdAt: string
}

export type RelatorioDetalheResumo = {
  totalLeituras: number
  paginasPb: number
  paginasColoridas: number
  totalPaginas: number
  valorItensPdf: number
  valorItensCalculado: number
  totalDivergencias: number
}

export type RelatorioDetalheResponse = {
  relatorio: RelatorioDetalheCabecalho
  resumo: RelatorioDetalheResumo
  leituras: RelatorioDetalheLeitura[]
  divergencias: RelatorioDetalheDivergencia[]
}
