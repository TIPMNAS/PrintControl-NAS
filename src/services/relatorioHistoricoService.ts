import { supabase } from '../lib/supabaseClient'
import type {
    RelatorioPdfHistoricoDetalhe,
    RelatorioPdfHistoricoFilaItem,
    RelatorioPdfHistoricoAuditoriaItem,
} from '../types/relatoriosPdf'

type FilaProcessamentoRow = {
    id: string
    relatorio_pdf_id: string | null
    nome_arquivo: string | null
    arquivo_path: string | null
    status_processamento: string | null
    etapa_atual: string | null
    erro_mensagem: string | null
    tentativas: number | string | null
    payload_extraido: unknown | null
    payload_normalizado: unknown | null
    rejeitado_em: string | null
    created_at: string | null
    updated_at: string | null
}

type AuditoriaRow = {
    id: string
    entidade: string | null
    entidade_id: string | null
    acao: string | null
    usuario_id: string | null
    antes_json: unknown | null
    depois_json: unknown | null
    created_at: string | null
}

type SupabaseUnsafe = {
    from: (table: string) => any
}

const db = supabase as unknown as SupabaseUnsafe

function toNumber(value: number | string | null | undefined): number {
    const numero = Number(value ?? 0)
    return Number.isFinite(numero) ? numero : 0
}

function mapFila(row: FilaProcessamentoRow): RelatorioPdfHistoricoFilaItem {
    return {
        id: row.id,
        relatorioPdfId: row.relatorio_pdf_id,
        nomeArquivo: row.nome_arquivo,
        arquivoPath: row.arquivo_path,
        statusProcessamento: row.status_processamento,
        etapaAtual: row.etapa_atual,
        erroMensagem: row.erro_mensagem,
        tentativas: toNumber(row.tentativas),
        temPayloadExtraido: row.payload_extraido !== null && row.payload_extraido !== undefined,
        temPayloadNormalizado: row.payload_normalizado !== null && row.payload_normalizado !== undefined,
        rejeitadoEm: row.rejeitado_em,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

function mapAuditoria(row: AuditoriaRow): RelatorioPdfHistoricoAuditoriaItem {
    return {
        id: row.id,
        entidade: row.entidade,
        entidadeId: row.entidade_id,
        acao: row.acao,
        usuarioId: row.usuario_id,
        antesJson: row.antes_json,
        depoisJson: row.depois_json,
        createdAt: row.created_at,
    }
}

async function buscarFilas(params: {
    relatorioId: string
    filaId?: string | null
    nomeArquivo?: string | null
}): Promise<RelatorioPdfHistoricoFilaItem[]> {
    const colunas = `
        id,
        relatorio_pdf_id,
        nome_arquivo,
        arquivo_path,
        status_processamento,
        etapa_atual,
        erro_mensagem,
        tentativas,
        payload_extraido,
        payload_normalizado,
        rejeitado_em,
        created_at,
        updated_at
    `

    const filas = new Map<string, RelatorioPdfHistoricoFilaItem>()

    if (params.filaId) {
        const { data, error } = await db
            .from('fila_processamento_pdfs')
            .select(colunas)
            .eq('id', params.filaId)
            .limit(1)

        if (error) {
            throw new Error(`Erro ao buscar histórico da fila: ${error.message}`)
        }

        for (const row of (data ?? []) as FilaProcessamentoRow[]) {
            filas.set(row.id, mapFila(row))
        }
    }

    const { data: filasPorRelatorio, error: filasPorRelatorioError } = await db
        .from('fila_processamento_pdfs')
        .select(colunas)
        .eq('relatorio_pdf_id', params.relatorioId)
        .order('updated_at', { ascending: false })
        .limit(10)

    if (filasPorRelatorioError) {
        throw new Error(`Erro ao buscar histórico da fila por relatório: ${filasPorRelatorioError.message}`)
    }

    for (const row of (filasPorRelatorio ?? []) as FilaProcessamentoRow[]) {
        filas.set(row.id, mapFila(row))
    }

    if (filas.size === 0 && params.nomeArquivo) {
        const { data: filasPorArquivo, error: filasPorArquivoError } = await db
            .from('fila_processamento_pdfs')
            .select(colunas)
            .eq('nome_arquivo', params.nomeArquivo)
            .order('updated_at', { ascending: false })
            .limit(10)

        if (filasPorArquivoError) {
            throw new Error(`Erro ao buscar histórico da fila por arquivo: ${filasPorArquivoError.message}`)
        }

        for (const row of (filasPorArquivo ?? []) as FilaProcessamentoRow[]) {
            filas.set(row.id, mapFila(row))
        }
    }

    return Array.from(filas.values()).sort((a, b) => {
        const dataA = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
        const dataB = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime()
        return dataB - dataA
    })
}

async function buscarAuditoria(params: {
    relatorioId: string
    filaId?: string | null
}): Promise<RelatorioPdfHistoricoAuditoriaItem[]> {
    const ids = [params.relatorioId, params.filaId].filter(Boolean) as string[]

    if (ids.length === 0) return []

    try {
        const { data, error } = await db
            .from('auditoria_eventos')
            .select(
                `
                id,
                entidade,
                entidade_id,
                acao,
                usuario_id,
                antes_json,
                depois_json,
                created_at
                `,
            )
            .in('entidade_id', ids)
            .order('created_at', { ascending: false })
            .limit(30)

        if (error) {
            return []
        }

        return ((data ?? []) as AuditoriaRow[]).map(mapAuditoria)
    } catch {
        return []
    }
}

export async function obterHistoricoRelatorioPdf(params: {
    relatorioId: string
    filaId?: string | null
    nomeArquivo?: string | null
}): Promise<RelatorioPdfHistoricoDetalhe> {
    const [filas, auditorias] = await Promise.all([
        buscarFilas(params),
        buscarAuditoria(params),
    ])

    return {
        filas,
        auditorias,
    }
}
