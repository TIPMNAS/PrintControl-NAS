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


export type RelatorioPdfItemAf = {
    codigo: string
    descricao: string
    unidade: string
    quantidade: number
    valorUnitario: number
    valorTotal: number
    categoria: 'consumo' | 'locacao'
}

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
    itensAf: RelatorioPdfItemAf[]
    totalItensAf: number

    filaId: string | null
    filaStatus: string | null
    filaEtapaAtual: string | null
    filaErroMensagem: string | null
    filaUpdatedAt: string | null
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


export type RelatoriosPdfFilaItemResumo = {
    id: string
    relatorioPdfId: string | null
    nomeArquivo: string
    arquivoPath: string | null
    hashArquivo: string | null
    mesReferencia: string | null
    classificacaoAf: string | null
    statusProcessamento: string
    etapaAtual: string | null
    erroMensagem: string | null
    tentativas: number
    temPayloadExtraido: boolean
    temPayloadNormalizado: boolean
    createdAt: string | null
    updatedAt: string | null
}

export type RelatoriosPdfFilaResumo = {
    totalNaFila: number
    totalAguardando: number
    totalEmProcessamento: number
    totalImportados: number
    totalAprovados: number
    totalComErro: number
    totalRejeitados: number
    ultimoPdfEnviado: RelatoriosPdfFilaItemResumo | null
    proximoPdfPendente: RelatoriosPdfFilaItemResumo | null
}

export type RelatoriosPdfResponse = {
    contrato: {
        id: string
        numeroContrato: string
        fornecedor: string
    }
    resumo: RelatoriosPdfResumo
    relatorios: RelatorioPdfItem[]
    filaResumo: RelatoriosPdfFilaResumo
}


export type RelatorioPdfHistoricoFilaItem = {
    id: string
    relatorioPdfId: string | null
    nomeArquivo: string | null
    arquivoPath: string | null
    statusProcessamento: string | null
    etapaAtual: string | null
    erroMensagem: string | null
    tentativas: number
    temPayloadExtraido: boolean
    temPayloadNormalizado: boolean
    rejeitadoEm: string | null
    createdAt: string | null
    updatedAt: string | null
}

export type RelatorioPdfHistoricoAuditoriaItem = {
    id: string
    entidade: string | null
    entidadeId: string | null
    acao: string | null
    usuarioId: string | null
    antesJson: unknown | null
    depoisJson: unknown | null
    createdAt: string | null
}

export type RelatorioPdfHistoricoDetalhe = {
    filas: RelatorioPdfHistoricoFilaItem[]
    auditorias: RelatorioPdfHistoricoAuditoriaItem[]
}
