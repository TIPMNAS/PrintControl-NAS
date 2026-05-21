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