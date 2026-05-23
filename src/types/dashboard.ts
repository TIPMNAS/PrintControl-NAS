export type DashboardResumo = {
    contratoNumero: string
    fornecedor: string
    mesReferencia: string
    totalRelatoriosAprovados: number
    totalEquipamentos: number
    paginasPb: number
    paginasColoridas: number
    totalPaginas: number
    valorBruto: number
    valorRetencao: number
    valorLiquido: number
    valorCalculado: number
    diferencaBrutoCalculado: number
    percentualRetencao: number
    resmasEstimadas: number
    caixasEstimadas: number
    periodoLabel?: string
}

export type DashboardSecretariaResumo = {
    secretaria: string
    setor?: string | null
    paginasPb: number
    paginasColoridas: number
    totalPaginas: number
    valorTotal: number
    resmasEstimadas: number
    caixasEstimadas: number
}

export type DashboardAlerta = {
    titulo: string
    descricao: string
    nivel: 'normal' | 'amarelo' | 'laranja' | 'vermelho' | 'sem_cota' | 'info'
}

export type DashboardTendenciaMensal = {
    mesReferencia: string
    mesLabel: string
    paginasPb: number
    paginasColoridas: number
    totalPaginas: number
    valorBruto: number
    valorLiquido: number
    relatoriosAprovados: number
}

export type DashboardFiltroMes = {
    value: string
    label: string
}


export type DashboardSecretariaRanking = {
    secretaria: string
    paginasPb: number
    paginasColoridas: number
    totalPaginas: number
    valorTotal: number
    resmasEstimadas: number
    caixasEstimadas: number
    participacaoValorPercentual: number
    participacaoPaginasPercentual: number
}

export type DashboardEquipamentoRanking = {
    serie: string
    modelo: string
    secretaria: string
    paginasPb: number
    paginasColoridas: number
    totalPaginas: number
    valorPdf: number
    valorCalculado: number
    diferencaTotal: number
    divergente: boolean
}

export type DashboardOpcoesFiltros = {
    meses: DashboardFiltroMes[]
    anos: string[]
    classificacoes: string[]
    statusRelatorio: string[]
}

export type DashboardFiltros = {
    contratoNumero?: string
    mesReferencia?: string
    ano?: string
    classificacaoAf?: string
    statusRelatorio?: string
}

export type DashboardInicial = {
    resumo: DashboardResumo
    secretarias: DashboardSecretariaResumo[]
    alertas: DashboardAlerta[]
    tendenciaMensal: DashboardTendenciaMensal[]
    rankingEquipamentos: DashboardEquipamentoRanking[]
    rankingSecretarias: DashboardSecretariaRanking[]
    opcoes: DashboardOpcoesFiltros
    filtrosAplicados: Required<DashboardFiltros>
    brutoRpc: {
        dashboardContratual: unknown
        statusImportacao: unknown
        secretariasSetores: unknown
        papelA4: unknown
        alertasSaldo: unknown
    }
}
