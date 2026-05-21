import { supabase } from '../lib/supabaseClient'
import type {
    FilaProcessamentoItem,
    FilaProcessamentoResponse,
    FilaProcessamentoResumo,
} from '../types/filaProcessamento'

type SupabaseError = {
    message: string
}

type SupabaseQueryResult<T> = PromiseLike<{
    data: T[] | null
    error: SupabaseError | null
}>

type SupabaseTableQuery<T> = {
    select: (columns: string) => SupabaseTableQuery<T>
    order: (
        column: string,
        options?: {
            ascending?: boolean
            nullsFirst?: boolean
        },
    ) => SupabaseTableQuery<T>
    limit: (count: number) => SupabaseQueryResult<T>
}

type SupabaseUnsafe = {
    from: <T = Record<string, unknown>>(table: string) => SupabaseTableQuery<T>
}

type FilaRow = Record<string, unknown>

const db = supabase as unknown as SupabaseUnsafe

function stringOuNull(value: unknown): string | null {
    if (value === null || value === undefined) return null

    const texto = String(value).trim()

    return texto.length > 0 ? texto : null
}

function numeroOuZero(value: unknown): number {
    return Number(value ?? 0)
}

function buscarCampo(row: FilaRow, nomes: string[]): unknown {
    for (const nome of nomes) {
        if (nome in row) {
            return row[nome]
        }
    }

    return null
}

function extrairNomeArquivo(path: string | null): string {
    if (!path) return 'Arquivo não informado'

    const partes = path.split('/')

    return partes[partes.length - 1] || path
}

function normalizarItem(row: FilaRow): FilaProcessamentoItem {
    const arquivoPath = stringOuNull(
        buscarCampo(row, ['arquivo_path', 'file_path', 'path', 'storage_path']),
    )

    const nomeArquivo =
        stringOuNull(
            buscarCampo(row, [
                'nome_arquivo',
                'arquivo_nome',
                'file_name',
                'filename',
                'nome_pdf',
            ]),
        ) ?? extrairNomeArquivo(arquivoPath)

    const payloadExtraido = buscarCampo(row, [
        'payload_extraido',
        'json_extraido',
        'texto_extraido',
        'resultado_extraido',
    ])

    const payloadNormalizado = buscarCampo(row, [
        'payload_normalizado',
        'json_normalizado',
        'resultado_normalizado',
    ])

    return {
        id: String(buscarCampo(row, ['id']) ?? crypto.randomUUID()),
        nomeArquivo,
        arquivoPath,
        arquivoHash: stringOuNull(
            buscarCampo(row, ['arquivo_hash', 'hash_arquivo', 'file_hash', 'hash']),
        ),
        status:
            stringOuNull(
                buscarCampo(row, ['status_processamento', 'status', 'situacao']),
            ) ?? 'aguardando_processamento',
        tentativas: numeroOuZero(
            buscarCampo(row, ['tentativas', 'tentativa', 'qtd_tentativas']),
        ),
        mensagemErro: stringOuNull(
            buscarCampo(row, [
                'mensagem_erro',
                'erro_mensagem',
                'erro',
                'error_message',
                'ultimo_erro',
            ]),
        ),
        temPayloadExtraido: Boolean(payloadExtraido),
        temPayloadNormalizado: Boolean(payloadNormalizado),
        criadoEm: stringOuNull(buscarCampo(row, ['created_at', 'criado_em'])),
        atualizadoEm: stringOuNull(buscarCampo(row, ['updated_at', 'atualizado_em'])),
        reservadoEm: stringOuNull(buscarCampo(row, ['reservado_em', 'locked_at'])),
        processadoEm: stringOuNull(buscarCampo(row, ['processado_em', 'finished_at'])),
    }
}

function montarResumo(itens: FilaProcessamentoItem[]): FilaProcessamentoResumo {
    return itens.reduce<FilaProcessamentoResumo>(
        (acc, item) => {
            acc.total += 1

            if (item.status === 'aguardando_processamento') {
                acc.aguardando += 1
            } else if (item.status === 'em_processamento') {
                acc.emProcessamento += 1
            } else if (item.status === 'importado') {
                acc.importados += 1
            } else if (item.status === 'aprovado') {
                acc.aprovados += 1
            } else if (item.status === 'erro') {
                acc.erros += 1
            } else if (item.status === 'rejeitado') {
                acc.rejeitados += 1
            }

            return acc
        },
        {
            total: 0,
            aguardando: 0,
            emProcessamento: 0,
            importados: 0,
            aprovados: 0,
            erros: 0,
            rejeitados: 0,
        },
    )
}

export async function listarFilaProcessamento(): Promise<FilaProcessamentoResponse> {
    const { data, error } = await db
        .from<FilaRow>('fila_processamento_pdfs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

    if (error) {
        throw new Error(`Erro ao listar fila de processamento: ${error.message}`)
    }

    const itens = (data ?? []).map(normalizarItem)

    return {
        resumo: montarResumo(itens),
        itens,
    }
}