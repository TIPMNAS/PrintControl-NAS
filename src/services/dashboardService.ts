import { supabase } from '../lib/supabaseClient'
import type {
    DashboardAlerta,
    DashboardFiltroMes,
    DashboardFiltros,
    DashboardInicial,
    DashboardEquipamentoRanking,
    DashboardOpcoesFiltros,
    DashboardResumo,
    DashboardSecretariaResumo,
    DashboardSecretariaRanking,
    DashboardTendenciaMensal,
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
    valor_total_calculado: number | string | null
    status: string | null
    mes_referencia: string
    classificacao_af: string | null
}

type LeituraMensalResumo = {
    id: string
    relatorio_id: string
    modelo_texto_pdf: string | null
    serie_texto_pdf: string | null
    site_texto_pdf: string | null
    saldo_pb: number | string | null
    saldo_cor: number | string | null
    total_geral_pdf: number | string | null
    total_calculado: number | string | null
    diferenca_total: number | string | null
    divergente: boolean | null
}

async function callRpc(functionName: string, args: Record<string, unknown>) {
    const { data, error } = await supabase.rpc(functionName as never, args as never)

    if (error) {
        console.warn(`Erro ao chamar RPC ${functionName}:`, error.message)
        return null
    }

    return data as RpcResult
}

function toNumber(value: number | string | null | undefined): number {
    const numero = Number(value ?? 0)

    return Number.isFinite(numero) ? numero : 0
}

function normalizarTexto(value: string | null | undefined): string {
    return String(value ?? '').trim()
}

function normalizarClassificacao(value: string | null | undefined): string {
    return normalizarTexto(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
}

function formatarMesLabel(mesReferencia: string): string {
    const data = new Date(`${mesReferencia}T00:00:00`)

    if (Number.isNaN(data.getTime())) {
        return mesReferencia
    }

    return new Intl.DateTimeFormat('pt-BR', {
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(data)
}

function formatarMesCurto(mesReferencia: string): string {
    const data = new Date(`${mesReferencia}T00:00:00`)

    if (Number.isNaN(data.getTime())) {
        return mesReferencia
    }

    const mes = new Intl.DateTimeFormat('pt-BR', {
        month: 'short',
        timeZone: 'UTC',
    })
        .format(data)
        .replace('.', '')

    const ano = new Intl.DateTimeFormat('pt-BR', {
        year: '2-digit',
        timeZone: 'UTC',
    }).format(data)

    return `${mes}/${ano}`
}

function obterAno(mesReferencia: string): string {
    return mesReferencia.slice(0, 4)
}

function resolverMesReferencia(value: string | undefined): string | undefined {
    const texto = normalizarTexto(value)

    if (!texto || texto === 'todos') return undefined

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto
    if (/^\d{4}-\d{2}$/.test(texto)) return `${texto}-01`

    return undefined
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

    throw new Error(`Contrato ${numeroLimpo} não encontrado no Supabase.`)
}

function filtrarRelatorios(
    relatorios: RelatorioPdfResumo[],
    filtros: Required<DashboardFiltros>,
    aplicarMes = true,
): RelatorioPdfResumo[] {
    const mesReferencia = aplicarMes
        ? resolverMesReferencia(filtros.mesReferencia)
        : undefined
    const ano = filtros.ano !== 'todos' ? filtros.ano : undefined
    const classificacao = filtros.classificacaoAf !== 'todos'
        ? normalizarClassificacao(filtros.classificacaoAf)
        : undefined
    const status = filtros.statusRelatorio !== 'todos'
        ? filtros.statusRelatorio
        : undefined

    return relatorios.filter((relatorio) => {
        if (status && relatorio.status !== status) return false
        if (mesReferencia && relatorio.mes_referencia !== mesReferencia) return false
        if (ano && obterAno(relatorio.mes_referencia) !== ano) return false
        if (
            classificacao &&
            normalizarClassificacao(relatorio.classificacao_af) !== classificacao
        ) {
            return false
        }

        return true
    })
}

function criarOpcoes(relatorios: RelatorioPdfResumo[]): DashboardOpcoesFiltros {
    const meses = new Map<string, DashboardFiltroMes>()
    const anos = new Set<string>()
    const classificacoes = new Set<string>()
    const statusRelatorio = new Set<string>()

    for (const relatorio of relatorios) {
        meses.set(relatorio.mes_referencia, {
            value: relatorio.mes_referencia,
            label: formatarMesLabel(relatorio.mes_referencia),
        })
        anos.add(obterAno(relatorio.mes_referencia))

        const classificacao = normalizarClassificacao(relatorio.classificacao_af)
        if (classificacao) classificacoes.add(classificacao)

        const status = normalizarTexto(relatorio.status)
        if (status) statusRelatorio.add(status)
    }

    return {
        meses: Array.from(meses.values()).sort((a, b) =>
            b.value.localeCompare(a.value),
        ),
        anos: Array.from(anos).sort((a, b) => b.localeCompare(a)),
        classificacoes: Array.from(classificacoes).sort(),
        statusRelatorio: Array.from(statusRelatorio).sort(),
    }
}

function criarResumo(
    contrato: ContratoBasico,
    relatorios: RelatorioPdfResumo[],
    leituras: LeituraMensalResumo[],
    filtros: Required<DashboardFiltros>,
): DashboardResumo {
    const paginasPb = leituras.reduce(
        (total, item) => total + toNumber(item.saldo_pb),
        0,
    )
    const paginasColoridas = leituras.reduce(
        (total, item) => total + toNumber(item.saldo_cor),
        0,
    )
    const totalPaginas = paginasPb + paginasColoridas

    const valorBruto = relatorios.reduce(
        (total, item) => total + toNumber(item.valor_bruto_pdf),
        0,
    )
    const valorRetencao = relatorios.reduce(
        (total, item) => total + toNumber(item.retencao_pdf),
        0,
    )
    const valorLiquido = relatorios.reduce(
        (total, item) => total + toNumber(item.valor_total_pdf),
        0,
    )
    const valorCalculado = relatorios.reduce(
        (total, item) => total + toNumber(item.valor_total_calculado),
        0,
    )
    const diferencaBrutoCalculado = valorBruto - valorCalculado
    const percentualRetencao =
        valorBruto > 0 ? Number(((valorRetencao / valorBruto) * 100).toFixed(2)) : 0

    const series = new Set(
        leituras
            .map((leitura) => normalizarTexto(leitura.serie_texto_pdf))
            .filter(Boolean),
    )

    const periodoLabel =
        filtros.mesReferencia !== 'todos'
            ? formatarMesLabel(filtros.mesReferencia)
            : filtros.ano !== 'todos'
              ? `Ano ${filtros.ano}`
              : 'Todos os períodos'

    return {
        contratoNumero: contrato.numero_contrato,
        fornecedor: contrato.fornecedor,
        mesReferencia: periodoLabel,
        periodoLabel,
        totalRelatoriosAprovados: relatorios.length,
        totalEquipamentos: series.size || leituras.length,
        paginasPb,
        paginasColoridas,
        totalPaginas,
        valorBruto,
        valorRetencao,
        valorLiquido,
        valorCalculado,
        diferencaBrutoCalculado,
        percentualRetencao,
        resmasEstimadas: totalPaginas / 500,
        caixasEstimadas: totalPaginas / 5000,
    }
}

function criarSecretarias(leituras: LeituraMensalResumo[]): DashboardSecretariaResumo[] {
    const agrupado = new Map<string, DashboardSecretariaResumo>()

    for (const leitura of leituras) {
        const secretaria = normalizarTexto(leitura.site_texto_pdf) || 'Não informado'
        const atual = agrupado.get(secretaria) ?? {
            secretaria,
            setor: null,
            paginasPb: 0,
            paginasColoridas: 0,
            totalPaginas: 0,
            valorTotal: 0,
            resmasEstimadas: 0,
            caixasEstimadas: 0,
        }

        atual.paginasPb += toNumber(leitura.saldo_pb)
        atual.paginasColoridas += toNumber(leitura.saldo_cor)
        atual.totalPaginas = atual.paginasPb + atual.paginasColoridas
        atual.valorTotal += toNumber(leitura.total_calculado || leitura.total_geral_pdf)
        atual.resmasEstimadas = atual.totalPaginas / 500
        atual.caixasEstimadas = atual.totalPaginas / 5000

        agrupado.set(secretaria, atual)
    }

    return Array.from(agrupado.values())
        .sort((a, b) => b.totalPaginas - a.totalPaginas)
        .slice(0, 10)
}


function criarRankingSecretarias(
    secretarias: DashboardSecretariaResumo[],
): DashboardSecretariaRanking[] {
    const totalValor = secretarias.reduce(
        (total, secretaria) => total + toNumber(secretaria.valorTotal),
        0,
    )
    const totalPaginas = secretarias.reduce(
        (total, secretaria) => total + toNumber(secretaria.totalPaginas),
        0,
    )

    return [...secretarias]
        .sort((a, b) => b.valorTotal - a.valorTotal)
        .slice(0, 10)
        .map((secretaria) => ({
            secretaria: secretaria.secretaria,
            paginasPb: secretaria.paginasPb,
            paginasColoridas: secretaria.paginasColoridas,
            totalPaginas: secretaria.totalPaginas,
            valorTotal: Number(secretaria.valorTotal.toFixed(2)),
            resmasEstimadas: secretaria.resmasEstimadas,
            caixasEstimadas: secretaria.caixasEstimadas,
            participacaoValorPercentual:
                totalValor > 0
                    ? Number(((secretaria.valorTotal / totalValor) * 100).toFixed(2))
                    : 0,
            participacaoPaginasPercentual:
                totalPaginas > 0
                    ? Number(((secretaria.totalPaginas / totalPaginas) * 100).toFixed(2))
                    : 0,
        }))
}

function criarTendenciaMensal(
    relatorios: RelatorioPdfResumo[],
    leituras: LeituraMensalResumo[],
): DashboardTendenciaMensal[] {
    const relatoriosPorId = new Map<string, RelatorioPdfResumo>()

    for (const relatorio of relatorios) {
        relatoriosPorId.set(relatorio.id, relatorio)
    }

    const mesesDisponiveis = Array.from(
        new Set(relatorios.map((relatorio) => relatorio.mes_referencia)),
    )
        .sort((a, b) => b.localeCompare(a))
        .slice(0, 6)
        .sort((a, b) => a.localeCompare(b))

    const agrupado = new Map<string, DashboardTendenciaMensal>()

    for (const mesReferencia of mesesDisponiveis) {
        agrupado.set(mesReferencia, {
            mesReferencia,
            mesLabel: formatarMesCurto(mesReferencia),
            paginasPb: 0,
            paginasColoridas: 0,
            totalPaginas: 0,
            valorBruto: 0,
            valorLiquido: 0,
            relatoriosAprovados: 0,
        })
    }

    for (const relatorio of relatorios) {
        const registro = agrupado.get(relatorio.mes_referencia)
        if (!registro) continue

        registro.valorBruto += toNumber(relatorio.valor_bruto_pdf)
        registro.valorLiquido += toNumber(relatorio.valor_total_pdf)
        registro.relatoriosAprovados += 1
    }

    for (const leitura of leituras) {
        const relatorio = relatoriosPorId.get(leitura.relatorio_id)
        if (!relatorio) continue

        const registro = agrupado.get(relatorio.mes_referencia)
        if (!registro) continue

        registro.paginasPb += toNumber(leitura.saldo_pb)
        registro.paginasColoridas += toNumber(leitura.saldo_cor)
    }

    return Array.from(agrupado.values()).map((item) => ({
        ...item,
        totalPaginas: item.paginasPb + item.paginasColoridas,
    }))
}


function criarRankingEquipamentos(
    leituras: LeituraMensalResumo[],
): DashboardEquipamentoRanking[] {
    const agrupado = new Map<string, DashboardEquipamentoRanking>()

    for (const leitura of leituras) {
        const serie = normalizarTexto(leitura.serie_texto_pdf) || 'Sem série'
        const modelo = normalizarTexto(leitura.modelo_texto_pdf) || 'Modelo não informado'
        const secretaria = normalizarTexto(leitura.site_texto_pdf) || 'Não informado'
        const chave = `${serie}::${modelo}`

        const atual = agrupado.get(chave) ?? {
            serie,
            modelo,
            secretaria,
            paginasPb: 0,
            paginasColoridas: 0,
            totalPaginas: 0,
            valorPdf: 0,
            valorCalculado: 0,
            diferencaTotal: 0,
            divergente: false,
        }

        atual.paginasPb += toNumber(leitura.saldo_pb)
        atual.paginasColoridas += toNumber(leitura.saldo_cor)
        atual.totalPaginas = atual.paginasPb + atual.paginasColoridas
        atual.valorPdf += toNumber(leitura.total_geral_pdf)
        atual.valorCalculado += toNumber(leitura.total_calculado || leitura.total_geral_pdf)
        atual.diferencaTotal += toNumber(leitura.diferenca_total)
        atual.divergente =
            atual.divergente ||
            Boolean(leitura.divergente) ||
            Math.abs(toNumber(leitura.diferenca_total)) > 0.05

        agrupado.set(chave, atual)
    }

    return Array.from(agrupado.values())
        .map((item) => ({
            ...item,
            valorPdf: Number(item.valorPdf.toFixed(2)),
            valorCalculado: Number(item.valorCalculado.toFixed(2)),
            diferencaTotal: Number(item.diferencaTotal.toFixed(2)),
        }))
        .sort((a, b) => b.totalPaginas - a.totalPaginas)
        .slice(0, 10)
}

function criarAlertas(
    relatorios: RelatorioPdfResumo[],
    leituras: LeituraMensalResumo[],
): DashboardAlerta[] {
    const alertas: DashboardAlerta[] = []

    if (relatorios.length === 0) {
        alertas.push({
            titulo: 'Sem relatório aprovado no filtro',
            descricao:
                'Não existem relatórios com o status selecionado para o período/filtros atuais.',
            nivel: 'info',
        })
    }

    const divergentes = leituras.filter(
        (leitura) =>
            Boolean(leitura.divergente) || Math.abs(toNumber(leitura.diferenca_total)) > 0.05,
    )

    if (divergentes.length > 0) {
        alertas.push({
            titulo: 'Leituras com divergência',
            descricao: `${divergentes.length} leitura(s) do filtro atual possuem divergência de valor ou conferência.`,
            nivel: 'amarelo',
        })
    }

    return alertas.slice(0, 5)
}

function resolverFiltrosEntrada(
    filtros: DashboardFiltros | undefined,
    relatorios: RelatorioPdfResumo[],
): Required<DashboardFiltros> {
    const contratoNumero =
        filtros?.contratoNumero ||
        import.meta.env.VITE_PRINTCONTROL_CONTRATO_NUMERO ||
        '183/2024'

    const statusRelatorio = filtros?.statusRelatorio || 'aprovado'

    const mesInformado = filtros?.mesReferencia

    const mesReferencia =
        mesInformado ||
        import.meta.env.VITE_PRINTCONTROL_MES_PADRAO ||
        relatorios.find((relatorio) => relatorio.status === statusRelatorio)?.mes_referencia ||
        relatorios[0]?.mes_referencia ||
        'todos'

    return {
        contratoNumero,
        mesReferencia,
        ano: filtros?.ano || 'todos',
        classificacaoAf: filtros?.classificacaoAf || 'todos',
        statusRelatorio,
    }
}

export async function getDashboardInicial(
    filtros?: DashboardFiltros,
): Promise<DashboardInicial> {
    const contratoNumero =
        filtros?.contratoNumero ||
        import.meta.env.VITE_PRINTCONTROL_CONTRATO_NUMERO ||
        '183/2024'

    const contrato = await getContratoPorNumero(contratoNumero)

    const { data: relatoriosRaw, error: relatoriosError } = await supabase
        .from('relatorios_pdf')
        .select(
            `
                id,
                valor_bruto_pdf,
                retencao_pdf,
                valor_total_pdf,
                valor_total_calculado,
                status,
                mes_referencia,
                classificacao_af
            `,
        )
        .eq('contrato_id', contrato.id)
        .order('mes_referencia', { ascending: false })
        .limit(500)

    if (relatoriosError) {
        throw new Error(`Erro ao buscar relatórios PDF do dashboard: ${relatoriosError.message}`)
    }

    const relatoriosBase = (relatoriosRaw ?? []) as unknown as RelatorioPdfResumo[]
    const filtrosAplicados = resolverFiltrosEntrada(filtros, relatoriosBase)
    const opcoes = criarOpcoes(relatoriosBase)

    const relatoriosResumo = filtrarRelatorios(relatoriosBase, filtrosAplicados, true)
    const relatoriosTendencia = filtrarRelatorios(relatoriosBase, filtrosAplicados, false)

    const relatorioIdsParaLeituras = Array.from(
        new Set([
            ...relatoriosResumo.map((relatorio) => relatorio.id),
            ...relatoriosTendencia.map((relatorio) => relatorio.id),
        ]),
    )

    let leiturasBase: LeituraMensalResumo[] = []

    if (relatorioIdsParaLeituras.length > 0) {
        const { data: leiturasRaw, error: leiturasError } = await supabase
            .from('leituras_mensais')
            .select(
                `
                    id,
                    relatorio_id,
                    modelo_texto_pdf,
                    serie_texto_pdf,
                    site_texto_pdf,
                    saldo_pb,
                    saldo_cor,
                    total_geral_pdf,
                    total_calculado,
                    diferenca_total,
                    divergente
                `,
            )
            .in('relatorio_id', relatorioIdsParaLeituras)
            .limit(10000)

        if (leiturasError) {
            throw new Error(`Erro ao buscar leituras do dashboard: ${leiturasError.message}`)
        }

        leiturasBase = (leiturasRaw ?? []) as unknown as LeituraMensalResumo[]
    }

    const relatorioIdsResumo = new Set(relatoriosResumo.map((relatorio) => relatorio.id))
    const relatorioIdsTendencia = new Set(
        relatoriosTendencia.map((relatorio) => relatorio.id),
    )

    const leiturasResumo = leiturasBase.filter((leitura) =>
        relatorioIdsResumo.has(leitura.relatorio_id),
    )
    const leiturasTendencia = leiturasBase.filter((leitura) =>
        relatorioIdsTendencia.has(leitura.relatorio_id),
    )

    const mesReferenciaRpc =
        filtrosAplicados.mesReferencia !== 'todos'
            ? filtrosAplicados.mesReferencia
            : relatoriosResumo[0]?.mes_referencia || relatoriosBase[0]?.mes_referencia || null

    const [dashboardContratual, statusImportacao, secretariasSetores, papelA4, alertasSaldo] =
        mesReferenciaRpc
            ? await Promise.all([
                  callRpc('rpc_dashboard_contratual', {
                      p_contrato_id: contrato.id,
                      p_mes_referencia: mesReferenciaRpc,
                  }),
                  callRpc('rpc_status_importacao_mensal', {
                      p_contrato_id: contrato.id,
                      p_mes_referencia: mesReferenciaRpc,
                  }),
                  callRpc('rpc_secretarias_setores_resumo', {
                      p_contrato_id: contrato.id,
                      p_mes_referencia: mesReferenciaRpc,
                      p_status_relatorio: filtrosAplicados.statusRelatorio,
                  }),
                  callRpc('rpc_relatorio_papel_a4', {
                      p_contrato_id: contrato.id,
                      p_mes_referencia: mesReferenciaRpc,
                  }),
                  callRpc('rpc_alertas_saldo_contratado', {
                      p_contrato_id: contrato.id,
                      p_mes_referencia: mesReferenciaRpc,
                  }),
              ])
            : [null, null, null, null, null]

    const secretariasResumo = criarSecretarias(leiturasResumo)

    return {
        resumo: criarResumo(contrato, relatoriosResumo, leiturasResumo, filtrosAplicados),
        secretarias: secretariasResumo,
        alertas: criarAlertas(relatoriosResumo, leiturasResumo),
        tendenciaMensal: criarTendenciaMensal(relatoriosTendencia, leiturasTendencia),
        rankingEquipamentos: criarRankingEquipamentos(leiturasResumo),
        rankingSecretarias: criarRankingSecretarias(secretariasResumo),
        opcoes,
        filtrosAplicados,
        brutoRpc: {
            dashboardContratual,
            statusImportacao,
            secretariasSetores,
            papelA4,
            alertasSaldo,
        },
    }
}
