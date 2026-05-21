import { supabase } from '../lib/supabaseClient'
import type {
    DashboardAlerta,
    DashboardInicial,
    DashboardResumo,
    DashboardSecretariaResumo,
} from '../types/dashboard'

type RpcResult = unknown

type ContratoBasico = {
    id: string
    numero_contrato: string
    fornecedor: string
    status?: string | null
}

type RelatorioPdfResumo = {
    id: string
    valor_bruto_pdf: number | string | null
    retencao_pdf: number | string | null
    valor_total_pdf: number | string | null
    status: string | null
    mes_referencia: string
}

type LeituraMensalResumo = {
    id: string
    saldo_pb: number | string | null
    saldo_cor: number | string | null
    total_geral_pdf: number | string | null
}

async function callRpc(functionName: string, args: Record<string, unknown>) {
    const { data, error } = await supabase.rpc(functionName as never, args as never)

    if (error) {
        console.warn(`Erro ao chamar RPC ${functionName}:`, error.message)
        return null
    }

    return data as RpcResult
}

async function getContratoPorNumero(numeroContrato: string): Promise<ContratoBasico> {
    const numeroLimpo = numeroContrato.trim()

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
        throw new Error(`Erro ao buscar contrato ${numeroLimpo}: ${error.message}`)
    }

    const contratos = (data ?? []) as unknown as ContratoBasico[]

    if (contratos.length > 0) {
        return contratos[0]
    }

    const { data: contratosDisponiveisRaw, error: listaError } = await supabase
        .from('contratos')
        .select('id, numero_contrato, fornecedor, status')
        .limit(10)

    if (listaError) {
        throw new Error(
            `Contrato ${numeroLimpo} não encontrado e não foi possível listar contratos: ${listaError.message}`,
        )
    }

    const contratosDisponiveis =
        (contratosDisponiveisRaw ?? []) as unknown as ContratoBasico[]

    const lista = contratosDisponiveis
        .map((contrato) => `${contrato.numero_contrato} - ${contrato.fornecedor}`)
        .join(' | ')

    throw new Error(
        `Contrato ${numeroLimpo} não encontrado no Supabase. Contratos disponíveis: ${lista || 'nenhum contrato encontrado'
        }`,
    )
}

async function getResumoRealPorTabelas(
    contratoId: string,
    contratoNumero: string,
    fornecedor: string,
    mesReferencia: string,
): Promise<DashboardResumo> {
    const { data: relatoriosRaw, error: relatoriosError } = await supabase
        .from('relatorios_pdf')
        .select(
            `
        id,
        valor_bruto_pdf,
        retencao_pdf,
        valor_total_pdf,
        status,
        mes_referencia
      `,
        )
        .eq('contrato_id', contratoId)
        .eq('mes_referencia', mesReferencia)
        .eq('status', 'aprovado')

    if (relatoriosError) {
        throw new Error(`Erro ao buscar relatórios aprovados: ${relatoriosError.message}`)
    }

    const relatorios = (relatoriosRaw ?? []) as unknown as RelatorioPdfResumo[]
    const relatorioIds = relatorios.map((relatorio) => relatorio.id)

    if (relatorioIds.length === 0) {
        return {
            contratoNumero,
            fornecedor,
            mesReferencia,
            totalRelatoriosAprovados: 0,
            totalEquipamentos: 0,
            paginasPb: 0,
            paginasColoridas: 0,
            totalPaginas: 0,
            valorBruto: 0,
            valorRetencao: 0,
            valorLiquido: 0,
            resmasEstimadas: 0,
            caixasEstimadas: 0,
        }
    }

    const { data: leiturasRaw, error: leiturasError } = await supabase
        .from('leituras_mensais')
        .select('id, saldo_pb, saldo_cor, total_geral_pdf')
        .in('relatorio_id', relatorioIds)

    if (leiturasError) {
        throw new Error(`Erro ao buscar leituras mensais: ${leiturasError.message}`)
    }

    const leituras = (leiturasRaw ?? []) as unknown as LeituraMensalResumo[]

    const paginasPb = leituras.reduce(
        (total, item) => total + Number(item.saldo_pb ?? 0),
        0,
    )

    const paginasColoridas = leituras.reduce(
        (total, item) => total + Number(item.saldo_cor ?? 0),
        0,
    )

    const totalPaginas = paginasPb + paginasColoridas

    const valorBruto = relatorios.reduce(
        (total, item) => total + Number(item.valor_bruto_pdf ?? 0),
        0,
    )

    const valorRetencao = relatorios.reduce(
        (total, item) => total + Number(item.retencao_pdf ?? 0),
        0,
    )

    const valorLiquido = relatorios.reduce(
        (total, item) => total + Number(item.valor_total_pdf ?? 0),
        0,
    )

    return {
        contratoNumero,
        fornecedor,
        mesReferencia,
        totalRelatoriosAprovados: relatorios.length,
        totalEquipamentos: leituras.length,
        paginasPb,
        paginasColoridas,
        totalPaginas,
        valorBruto,
        valorRetencao,
        valorLiquido,
        resmasEstimadas: totalPaginas / 500,
        caixasEstimadas: totalPaginas / 5000,
    }
}

function normalizarSecretarias(data: unknown): DashboardSecretariaResumo[] {
    if (!Array.isArray(data)) {
        return []
    }

    return data.slice(0, 10).map((item) => {
        const registro = item as Record<string, unknown>

        const paginasPb = Number(
            registro.paginas_pb ?? registro.total_pb ?? registro.saldo_pb ?? 0,
        )

        const paginasColoridas = Number(
            registro.paginas_coloridas ?? registro.paginas_cor ?? registro.saldo_cor ?? 0,
        )

        const totalPaginasInformado = Number(
            registro.total_paginas ?? registro.paginas_total ?? 0,
        )

        const totalPaginas =
            totalPaginasInformado > 0 ? totalPaginasInformado : paginasPb + paginasColoridas

        return {
            secretaria: String(
                registro.secretaria ??
                registro.nome_secretaria ??
                registro.site ??
                registro.agrupamento ??
                'Não informado',
            ),
            setor: registro.setor ? String(registro.setor) : null,
            paginasPb,
            paginasColoridas,
            totalPaginas,
            valorTotal: Number(
                registro.valor_total ?? registro.custo_total ?? registro.total_valor ?? 0,
            ),
            resmasEstimadas: Number(registro.resmas_estimadas ?? registro.resmas ?? 0),
            caixasEstimadas: Number(registro.caixas_estimadas ?? registro.caixas ?? 0),
        }
    })
}

function normalizarAlertas(data: unknown): DashboardAlerta[] {
    if (!Array.isArray(data)) {
        return []
    }

    return data.slice(0, 5).map((item) => {
        const registro = item as Record<string, unknown>

        return {
            titulo: String(
                registro.titulo ?? registro.equipamento ?? registro.numero_serie ?? 'Alerta',
            ),
            descricao: String(
                registro.descricao ??
                registro.mensagem ??
                registro.alerta ??
                'Existe um alerta relacionado ao saldo contratado.',
            ),
            nivel: String(
                registro.nivel ?? registro.faixa_alerta ?? 'info',
            ) as DashboardAlerta['nivel'],
        }
    })
}

export async function getDashboardInicial(): Promise<DashboardInicial> {
    const contratoNumero = import.meta.env.VITE_PRINTCONTROL_CONTRATO_NUMERO || '183/2024'
    const mesReferencia = import.meta.env.VITE_PRINTCONTROL_MES_PADRAO || '2026-03-01'

    const contrato = await getContratoPorNumero(contratoNumero)

    const [
        dashboardContratual,
        statusImportacao,
        secretariasSetores,
        papelA4,
        alertasSaldo,
        resumo,
    ] = await Promise.all([
        callRpc('rpc_dashboard_contratual', {
            p_contrato_id: contrato.id,
            p_mes_referencia: mesReferencia,
        }),
        callRpc('rpc_status_importacao_mensal', {
            p_contrato_id: contrato.id,
            p_mes_referencia: mesReferencia,
        }),
        callRpc('rpc_secretarias_setores_resumo', {
            p_contrato_id: contrato.id,
            p_mes_referencia: mesReferencia,
            p_status_relatorio: 'aprovado',
        }),
        callRpc('rpc_relatorio_papel_a4', {
            p_contrato_id: contrato.id,
            p_mes_referencia: mesReferencia,
        }),
        callRpc('rpc_alertas_saldo_contratado', {
            p_contrato_id: contrato.id,
            p_mes_referencia: mesReferencia,
        }),
        getResumoRealPorTabelas(
            contrato.id,
            contrato.numero_contrato,
            contrato.fornecedor,
            mesReferencia,
        ),
    ])

    return {
        resumo,
        secretarias: normalizarSecretarias(secretariasSetores),
        alertas: normalizarAlertas(alertasSaldo),
        brutoRpc: {
            dashboardContratual,
            statusImportacao,
            secretariasSetores,
            papelA4,
            alertasSaldo,
        },
    }
}