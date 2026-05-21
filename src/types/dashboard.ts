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
    resmasEstimadas: number
    caixasEstimadas: number
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

export type DashboardInicial = {
    resumo: DashboardResumo
    secretarias: DashboardSecretariaResumo[]
    alertas: DashboardAlerta[]
    brutoRpc: {
        dashboardContratual: unknown
        statusImportacao: unknown
        secretariasSetores: unknown
        papelA4: unknown
        alertasSaldo: unknown
    }
}