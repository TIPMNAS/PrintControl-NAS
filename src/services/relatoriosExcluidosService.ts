import { supabase } from '../lib/supabaseClient'
import type { RelatorioPdfExclusaoLog } from '../types/relatoriosPdf'

type RelatorioExclusaoLogRow = {
    id: string
    relatorio_id: string
    nome_arquivo: string | null
    hash_arquivo: string | null
    motivo: string
    excluido_por: string | null
    relatorio_snapshot: unknown | null
    leituras_snapshot: unknown | null
    divergencias_snapshot: unknown | null
    fila_snapshot: unknown | null
    resultado_json: unknown | null
    created_at: string
}

function toArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : []
}

function toRecord(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>
    }

    return null
}

function toNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') return Number(value.replace(',', '.')) || 0
    return 0
}

function getString(snapshot: Record<string, unknown> | null, key: string): string | null {
    const value = snapshot?.[key]
    return typeof value === 'string' && value.trim() ? value : null
}

export async function listarRelatoriosPdfExcluidos(limite = 100): Promise<RelatorioPdfExclusaoLog[]> {
    const { data, error } = await supabase
        .from('relatorios_pdf_exclusoes_log')
        .select(
            `
            id,
            relatorio_id,
            nome_arquivo,
            hash_arquivo,
            motivo,
            excluido_por,
            relatorio_snapshot,
            leituras_snapshot,
            divergencias_snapshot,
            fila_snapshot,
            resultado_json,
            created_at
            `,
        )
        .order('created_at', { ascending: false })
        .limit(limite)

    if (error) {
        throw new Error(`Erro ao listar relatórios excluídos: ${error.message}`)
    }

    return ((data ?? []) as unknown as RelatorioExclusaoLogRow[]).map((row) => {
        const relatorioSnapshot = toRecord(row.relatorio_snapshot)
        const resultadoJson = toRecord(row.resultado_json)
        const leiturasSnapshot = toArray(row.leituras_snapshot)
        const divergenciasSnapshot = toArray(row.divergencias_snapshot)
        const filaSnapshot = toArray(row.fila_snapshot)

        return {
            id: row.id,
            relatorioId: row.relatorio_id,
            nomeArquivo: row.nome_arquivo,
            hashArquivo: row.hash_arquivo,
            motivo: row.motivo,
            excluidoPor: row.excluido_por,
            relatorioSnapshot,
            leiturasSnapshot,
            divergenciasSnapshot,
            filaSnapshot,
            resultadoJson,
            createdAt: row.created_at,
            totalLeiturasSnapshot: leiturasSnapshot.length,
            totalDivergenciasSnapshot: divergenciasSnapshot.length,
            totalFilasSnapshot: filaSnapshot.length,
            statusAnterior: getString(relatorioSnapshot, 'status'),
            classificacaoAf: getString(relatorioSnapshot, 'classificacao_af'),
            mesReferencia: getString(relatorioSnapshot, 'mes_referencia'),
            valorBruto: toNumber(relatorioSnapshot?.valor_bruto_pdf),
            valorLiquido: toNumber(relatorioSnapshot?.valor_total_pdf),
            valorCalculado: toNumber(relatorioSnapshot?.valor_total_calculado),
        }
    })
}
