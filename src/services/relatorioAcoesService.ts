import { supabase } from '../lib/supabaseClient'

type RpcResponse = Record<string, unknown>

type SupabaseRpcClient = {
    rpc: (
        functionName: string,
        args?: Record<string, unknown>,
    ) => Promise<{
        data: RpcResponse | null
        error: {
            message: string
        } | null
    }>
}

const db = supabase as unknown as SupabaseRpcClient

function validarUuid(value: string, campo: string) {
    if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        throw new Error(`${campo} inválido.`)
    }
}

export async function aprovarRelatorioConferencia(
    relatorioId: string,
    observacoes?: string,
): Promise<RpcResponse> {
    const { data, error } = await db.rpc('rpc_aprovar_relatorio_conferencia', {
        p_relatorio_id: relatorioId,
        p_observacoes: observacoes || null,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data ?? {}
}

export async function rejeitarRelatorioConferencia(
    relatorioId: string,
    motivo: string,
): Promise<RpcResponse> {
    const motivoLimpo = motivo.trim()

    if (!motivoLimpo) {
        throw new Error('Informe o motivo da rejeição.')
    }

    const { data, error } = await db.rpc('rpc_rejeitar_relatorio_conferencia', {
        p_relatorio_id: relatorioId,
        p_motivo: motivoLimpo,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data ?? {}
}

export async function reprocessarPdfFila(params: {
    filaId: string
    limparPayloads?: boolean
    motivo?: string
    usuarioId?: string | null
}): Promise<RpcResponse> {
    validarUuid(params.filaId, 'ID da fila')

    const motivoLimpo = params.motivo?.trim() || 'Reprocessamento solicitado pela tela Relatórios PDF.'

    const { data, error } = await db.rpc('rpc_reprocessar_pdf_fila', {
        p_fila_id: params.filaId,
        p_limpar_payloads: params.limparPayloads ?? true,
        p_motivo: motivoLimpo,
        p_usuario_id: params.usuarioId ?? null,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data ?? {}
}

export async function cancelarPdfFila(params: {
    filaId: string
    motivo: string
    forcar?: boolean
    usuarioId?: string | null
}): Promise<RpcResponse> {
    validarUuid(params.filaId, 'ID da fila')

    const motivoLimpo = params.motivo.trim()

    if (!motivoLimpo) {
        throw new Error('Informe o motivo do cancelamento.')
    }

    const { data, error } = await db.rpc('rpc_cancelar_pdf_fila', {
        p_fila_id: params.filaId,
        p_motivo: motivoLimpo,
        p_forcar: params.forcar ?? false,
        p_usuario_id: params.usuarioId ?? null,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data ?? {}
}


export async function excluirRelatorioPdfCompleto(params: {
    relatorioId: string
    motivo: string
    confirmacao: string
}): Promise<RpcResponse> {
    validarUuid(params.relatorioId, 'ID do relatório')

    const motivoLimpo = params.motivo.trim()
    const confirmacaoLimpa = params.confirmacao.trim().toUpperCase()

    if (motivoLimpo.length < 10) {
        throw new Error('Informe um motivo com pelo menos 10 caracteres para excluir o relatório.')
    }

    if (confirmacaoLimpa !== 'EXCLUIR') {
        throw new Error('Confirmação inválida. Digite EXCLUIR para confirmar a exclusão.')
    }

    const { data, error } = await db.rpc('rpc_excluir_relatorio_pdf_completo', {
        p_relatorio_id: params.relatorioId,
        p_motivo: motivoLimpo,
        p_confirmacao: confirmacaoLimpa,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data ?? {}
}
