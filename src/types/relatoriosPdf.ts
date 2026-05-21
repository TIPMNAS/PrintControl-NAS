export type StatusRelatorioPdf =
    | 'pendente_processamento'
    | 'aguardando_processamento'
    | 'em_processamento'
    | 'extraido'
    | 'normalizado'
    | 'validado'
    | 'importado'
    | 'pendente_conferencia'
    | 'aprovado'
    | 'rejeitado'
    | 'erro'
    | string

export type RelatorioPdfItem = {
    id: string
    contratoId: string | null
    arquivoPath: string | null
    nomeArquivo: string
    mesReferencia: string
    classificacaoAf: string | null
    status: StatusRelatorioPdf
    valorBruto: number
    retencao: number
    valorLiquido: number
    valorCalculado: number
    totalLeituras: number
    paginasPb: number
    paginasColoridas: number
    totalPaginas: number
    possuiDivergencia: boolean
    createdAt: string
}

export type RelatoriosPdfResumo = {
    totalRelatorios: number
    totalAprovados: number
    totalPendentes: number
    totalComErro: number
    totalLeituras: number
    paginasPb: number
    paginasColoridas: number
    totalPaginas: number
    valorBruto: number
    retencao: number
    valorLiquido: number
}

export type RelatoriosPdfResponse = {
    contrato: {
        id: string
        numeroContrato: string
        fornecedor: string
    }
    resumo: RelatoriosPdfResumo
    relatorios: RelatorioPdfItem[]
}