export type StatusFilaProcessamento =
    | 'aguardando_processamento'
    | 'em_processamento'
    | 'extraido'
    | 'normalizado'
    | 'validado'
    | 'importado'
    | 'aprovado'
    | 'rejeitado'
    | 'erro'
    | string

export type FilaProcessamentoItem = {
    id: string
    nomeArquivo: string
    arquivoPath: string | null
    arquivoHash: string | null
    status: StatusFilaProcessamento
    tentativas: number
    mensagemErro: string | null
    temPayloadExtraido: boolean
    temPayloadNormalizado: boolean
    criadoEm: string | null
    atualizadoEm: string | null
    reservadoEm: string | null
    processadoEm: string | null
}

export type FilaProcessamentoResumo = {
    total: number
    aguardando: number
    emProcessamento: number
    importados: number
    aprovados: number
    erros: number
    rejeitados: number
}

export type FilaProcessamentoResponse = {
    resumo: FilaProcessamentoResumo
    itens: FilaProcessamentoItem[]
}