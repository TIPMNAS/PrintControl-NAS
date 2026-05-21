import { supabase } from '../lib/supabaseClient'
import type {
    RelatorioPdfItem,
    RelatoriosPdfResponse,
    RelatoriosPdfResumo,
} from '../types/relatoriosPdf'

type ContratoBasico = {
    id: string
    numero_contrato: string
    fornecedor: string
    status?: string | null
}

type RelatorioPdfRow = {
    id: string
    contrato_id: string | null
    mes_referencia: string
    classificacao_af: string | null
    valor_bruto_pdf: number | string | null
    retencao_pdf: number | string | null
    valor_total_pdf: number | string | null
    valor_total_calculado: number | string | null
    arquivo_path: string | null
    status: string
    created_at: string
}

type LeituraMensalRow = {
    id: string
    relatorio_id: string
    saldo_pb: number | string | null
    saldo_cor: number | string | null
    divergente: boolean | null
}

function toNumber(value: number | string | null | undefined): number {
    return Number(value ?? 0)
}

function extrairNomeArquivo(arquivoPath: string | null): string {
    if (!arquivoPath) {
        return 'Relatório sem arquivo vinculado'
    }

    const partes = arquivoPath.split('/')
    return partes[partes.length - 1] || arquivoPath
}

async function getContratoPadrao(): Promise<ContratoBasico> {
    const contratoNumero = import.meta.env.VITE_PRINTCONTROL_CONTRATO_NUMERO || '183/2024'
    const numeroLimpo = contratoNumero.trim()

    const { data, error } = await supabase
        .from('contratos')
        .select('id, numero_contrato, fornecedor, status')
        .or(
            [
                `numero_contrato.eq.${numeroLimpo}`,
                `numero_contrato.ilike.${numeroLimpo}%`,
                `numero_contrato.ilike.%${numeroLimpo}%`,
            ].join(','),
        )
        .limit(1)

    if (error) {
        throw new Error(`Erro ao buscar contrato padrão: ${error.message}`)
    }

    const contratos = (data ?? []) as unknown as ContratoBasico[]

    if (contratos.length === 0) {
        throw new Error(
            `Contrato ${numeroLimpo} não ficou visível para o usuário atual. Verifique login e políticas RLS.`,
        )
    }

    return contratos[0]
}

function montarResumo(relatorios: RelatorioPdfItem[]): RelatoriosPdfResumo {
    return relatorios.reduce<RelatoriosPdfResumo>(
        (acc, relatorio) => {
            acc.totalRelatorios += 1
            acc.totalLeituras += relatorio.totalLeituras
            acc.paginasPb += relatorio.paginasPb
            acc.paginasColoridas += relatorio.paginasColoridas
            acc.totalPaginas += relatorio.totalPaginas
            acc.valorBruto += relatorio.valorBruto
            acc.retencao += relatorio.retencao
            acc.valorLiquido += relatorio.valorLiquido

            if (relatorio.status === 'aprovado') {
                acc.totalAprovados += 1
            } else if (relatorio.status === 'erro' || relatorio.status === 'rejeitado') {
                acc.totalComErro += 1
            } else {
                acc.totalPendentes += 1
            }

            return acc
        },
        {
            totalRelatorios: 0,
            totalAprovados: 0,
            totalPendentes: 0,
            totalComErro: 0,
            totalLeituras: 0,
            paginasPb: 0,
            paginasColoridas: 0,
            totalPaginas: 0,
            valorBruto: 0,
            retencao: 0,
            valorLiquido: 0,
        },
    )
}

export async function listarRelatoriosPdf(): Promise<RelatoriosPdfResponse> {
    const contrato = await getContratoPadrao()

    const { data: relatoriosRaw, error: relatoriosError } = await supabase
        .from('relatorios_pdf')
        .select(
            `
        id,
        contrato_id,
        mes_referencia,
        classificacao_af,
        valor_bruto_pdf,
        retencao_pdf,
        valor_total_pdf,
        valor_total_calculado,
        arquivo_path,
        status,
        created_at
      `,
        )
        .eq('contrato_id', contrato.id)
        .order('mes_referencia', { ascending: false })
        .order('created_at', { ascending: false })

    if (relatoriosError) {
        throw new Error(`Erro ao listar relatórios PDF: ${relatoriosError.message}`)
    }

    const relatoriosBanco = (relatoriosRaw ?? []) as unknown as RelatorioPdfRow[]
    const relatorioIds = relatoriosBanco.map((relatorio) => relatorio.id)

    let leiturasBanco: LeituraMensalRow[] = []

    if (relatorioIds.length > 0) {
        const { data: leiturasRaw, error: leiturasError } = await supabase
            .from('leituras_mensais')
            .select('id, relatorio_id, saldo_pb, saldo_cor, divergente')
            .in('relatorio_id', relatorioIds)

        if (leiturasError) {
            throw new Error(`Erro ao buscar leituras dos relatórios: ${leiturasError.message}`)
        }

        leiturasBanco = (leiturasRaw ?? []) as unknown as LeituraMensalRow[]
    }

    const leiturasPorRelatorio = new Map<
        string,
        {
            totalLeituras: number
            paginasPb: number
            paginasColoridas: number
            possuiDivergencia: boolean
        }
    >()

    for (const leitura of leiturasBanco) {
        const atual =
            leiturasPorRelatorio.get(leitura.relatorio_id) ?? {
                totalLeituras: 0,
                paginasPb: 0,
                paginasColoridas: 0,
                possuiDivergencia: false,
            }

        atual.totalLeituras += 1
        atual.paginasPb += toNumber(leitura.saldo_pb)
        atual.paginasColoridas += toNumber(leitura.saldo_cor)
        atual.possuiDivergencia = atual.possuiDivergencia || Boolean(leitura.divergente)

        leiturasPorRelatorio.set(leitura.relatorio_id, atual)
    }

    const relatorios: RelatorioPdfItem[] = relatoriosBanco.map((relatorio) => {
        const resumoLeituras =
            leiturasPorRelatorio.get(relatorio.id) ?? {
                totalLeituras: 0,
                paginasPb: 0,
                paginasColoridas: 0,
                possuiDivergencia: false,
            }

        return {
            id: relatorio.id,
            contratoId: relatorio.contrato_id,
            arquivoPath: relatorio.arquivo_path,
            nomeArquivo: extrairNomeArquivo(relatorio.arquivo_path),
            mesReferencia: relatorio.mes_referencia,
            classificacaoAf: relatorio.classificacao_af,
            status: relatorio.status,
            valorBruto: toNumber(relatorio.valor_bruto_pdf),
            retencao: toNumber(relatorio.retencao_pdf),
            valorLiquido: toNumber(relatorio.valor_total_pdf),
            valorCalculado: toNumber(relatorio.valor_total_calculado),
            totalLeituras: resumoLeituras.totalLeituras,
            paginasPb: resumoLeituras.paginasPb,
            paginasColoridas: resumoLeituras.paginasColoridas,
            totalPaginas: resumoLeituras.paginasPb + resumoLeituras.paginasColoridas,
            possuiDivergencia: resumoLeituras.possuiDivergencia,
            createdAt: relatorio.created_at,
        }
    })

    return {
        contrato: {
            id: contrato.id,
            numeroContrato: contrato.numero_contrato,
            fornecedor: contrato.fornecedor,
        },
        resumo: montarResumo(relatorios),
        relatorios,
    }
}