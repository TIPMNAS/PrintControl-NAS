import { supabase } from '../lib/supabaseClient'

type SupabaseUnsafe = {
    from: (table: string) => any
}

const db = supabase as unknown as SupabaseUnsafe

type RelatorioPdfRow = {
    id: string
    arquivo_path: string | null
    mes_referencia: string | null
    classificacao_af: string | null
    status: string | null
    valor_bruto_pdf: number | string | null
    valor_total_calculado: number | string | null
    created_at: string | null
}

type LeituraMensalRow = {
    id: string
    relatorio_id: string
    equipamento_id: string | null
    modelo_texto_pdf: string | null
    serie_texto_pdf: string | null
    site_texto_pdf: string | null
    depto_texto_pdf: string | null
    ant_pb: number | string | null
    atu_pb: number | string | null
    saldo_pb: number | string | null
    ant_cor: number | string | null
    atu_cor: number | string | null
    saldo_cor: number | string | null
    total_geral_pdf: number | string | null
    total_calculado: number | string | null
    diferenca_total: number | string | null
    status_conferencia: string | null
    divergente: boolean | null
    created_at: string | null
}

export type LeiturasMensaisFiltros = {
    busca?: string
    mesReferencia?: string
    classificacaoAf?: string
    statusConferencia?: string
    statusRelatorio?: string
    secretaria?: string
    setor?: string
    modelo?: string
    relatorioOrigem?: string
    somenteDivergentes?: boolean
    relatorioId?: string
    limite?: number
}

export type LeituraMensalItem = {
    id: string
    relatorioId: string
    equipamentoId: string | null

    modelo: string
    serie: string
    secretaria: string
    setor: string

    mesReferencia: string | null
    mesReferenciaFiltro: string
    mesReferenciaFormatado: string
    classificacaoAf: string
    classificacaoAfNormalizada: string
    statusRelatorio: string
    statusConferencia: string
    nomeRelatorio: string
    arquivoPath: string | null

    antPb: number
    atuPb: number
    saldoPb: number

    antCor: number
    atuCor: number
    saldoCor: number

    totalPaginas: number
    totalGeralPdf: number
    totalCalculado: number
    diferencaTotal: number

    divergente: boolean
    createdAt: string | null
}

export type LeiturasMensaisResumo = {
    totalLeituras: number
    totalRelatorios: number
    paginasPb: number
    paginasColoridas: number
    totalPaginas: number
    valorPdf: number
    valorCalculado: number
    diferencaTotal: number
    leiturasConferidas: number
    leiturasDivergentes: number
}

export type LeiturasMensaisOpcoes = {
    meses: Array<{ value: string; label: string }>
    classificacoes: string[]
    modelos: string[]
    secretarias: string[]
    setores: string[]
    relatorios: Array<{ value: string; label: string }>
    statusConferencia: string[]
    statusRelatorio: string[]
    setoresPorSecretaria: Record<string, string[]>
    modelosPorSecretaria: Record<string, string[]>
    modelosPorSetor: Record<string, string[]>
    relatoriosPorMes: Record<string, Array<{ value: string; label: string }>>
    relatoriosPorClassificacao: Record<string, Array<{ value: string; label: string }>>
}

export type LeiturasMensaisResponse = {
    resumo: LeiturasMensaisResumo
    itens: LeituraMensalItem[]
    opcoes: LeiturasMensaisOpcoes
}

function toNumber(value: number | string | null | undefined): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0
    }

    if (value === null || value === undefined || value === '') {
        return 0
    }

    const normalizado = String(value)
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^\d.-]/g, '')

    const numero = Number(normalizado)

    return Number.isFinite(numero) ? numero : 0
}

function round2(value: number): number {
    return Number(value.toFixed(2))
}

function limparTexto(value: string | null | undefined, fallback = 'Não informado'): string {
    const texto = String(value ?? '').trim()

    return texto.length > 0 ? texto : fallback
}

function normalizarTexto(value: string | null | undefined): string {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim()
}

function extrairNomeArquivo(arquivoPath: string | null): string {
    if (!arquivoPath) return 'Relatório sem arquivo vinculado'

    const partes = arquivoPath.split('/')

    return partes[partes.length - 1] || arquivoPath
}

function obterMesFiltro(value: string | null | undefined): string {
    const texto = String(value ?? '').trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return texto.slice(0, 7)
    }

    if (/^\d{4}-\d{2}$/.test(texto)) {
        return texto
    }

    return ''
}

function formatarMesReferencia(value: string | null): string {
    if (!value) return 'Não informado'

    const mesFiltro = obterMesFiltro(value)

    if (!mesFiltro) return value

    const [ano, mes] = mesFiltro.split('-')

    return `${mes}/${ano}`
}

function criarResumo(itens: LeituraMensalItem[]): LeiturasMensaisResumo {
    const relatorios = new Set<string>()

    const resumo = itens.reduce<LeiturasMensaisResumo>(
        (acc, item) => {
            relatorios.add(item.relatorioId)

            acc.totalLeituras += 1
            acc.paginasPb += item.saldoPb
            acc.paginasColoridas += item.saldoCor
            acc.totalPaginas += item.totalPaginas
            acc.valorPdf += item.totalGeralPdf
            acc.valorCalculado += item.totalCalculado
            acc.diferencaTotal += item.diferencaTotal

            if (item.divergente) {
                acc.leiturasDivergentes += 1
            } else {
                acc.leiturasConferidas += 1
            }

            return acc
        },
        {
            totalLeituras: 0,
            totalRelatorios: 0,
            paginasPb: 0,
            paginasColoridas: 0,
            totalPaginas: 0,
            valorPdf: 0,
            valorCalculado: 0,
            diferencaTotal: 0,
            leiturasConferidas: 0,
            leiturasDivergentes: 0,
        },
    )

    resumo.totalRelatorios = relatorios.size
    resumo.valorPdf = round2(resumo.valorPdf)
    resumo.valorCalculado = round2(resumo.valorCalculado)
    resumo.diferencaTotal = round2(resumo.diferencaTotal)

    return resumo
}

function adicionarEmMapa(mapa: Map<string, Set<string>>, chave: string, valor: string) {
    if (!chave || !valor) return

    if (!mapa.has(chave)) {
        mapa.set(chave, new Set<string>())
    }

    mapa.get(chave)?.add(valor)
}

function adicionarRelatorioEmMapa(
    mapa: Map<string, Map<string, string>>,
    chave: string,
    relatorioId: string,
    nomeRelatorio: string,
) {
    if (!chave || !relatorioId || !nomeRelatorio) return

    if (!mapa.has(chave)) {
        mapa.set(chave, new Map<string, string>())
    }

    mapa.get(chave)?.set(relatorioId, nomeRelatorio)
}

function ordenarLista(valores: Iterable<string>): string[] {
    return Array.from(valores).sort((a, b) => a.localeCompare(b))
}

function mapaSetParaRecord(mapa: Map<string, Set<string>>): Record<string, string[]> {
    return Object.fromEntries(
        Array.from(mapa.entries()).map(([chave, valores]) => [chave, ordenarLista(valores)]),
    )
}

function mapaRelatoriosParaRecord(
    mapa: Map<string, Map<string, string>>,
): Record<string, Array<{ value: string; label: string }>> {
    return Object.fromEntries(
        Array.from(mapa.entries()).map(([chave, relatorios]) => [
            chave,
            Array.from(relatorios.entries())
                .map(([value, label]) => ({ value, label }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        ]),
    )
}

function criarOpcoes(itens: LeituraMensalItem[]): LeiturasMensaisOpcoes {
    const meses = new Map<string, string>()
    const classificacoes = new Set<string>()
    const modelos = new Set<string>()
    const secretarias = new Set<string>()
    const setores = new Set<string>()
    const relatorios = new Map<string, string>()
    const statusConferencia = new Set<string>()
    const statusRelatorio = new Set<string>()

    const setoresPorSecretaria = new Map<string, Set<string>>()
    const modelosPorSecretaria = new Map<string, Set<string>>()
    const modelosPorSetor = new Map<string, Set<string>>()
    const relatoriosPorMes = new Map<string, Map<string, string>>()
    const relatoriosPorClassificacao = new Map<string, Map<string, string>>()

    for (const item of itens) {
        if (item.mesReferenciaFiltro) {
            meses.set(item.mesReferenciaFiltro, item.mesReferenciaFormatado)
        }
        if (item.classificacaoAf) classificacoes.add(item.classificacaoAf)
        if (item.modelo) modelos.add(item.modelo)
        if (item.secretaria) secretarias.add(item.secretaria)
        if (item.setor) setores.add(item.setor)
        if (item.relatorioId && item.nomeRelatorio) {
            relatorios.set(item.relatorioId, item.nomeRelatorio)
            adicionarRelatorioEmMapa(
                relatoriosPorMes,
                item.mesReferenciaFiltro,
                item.relatorioId,
                item.nomeRelatorio,
            )
            adicionarRelatorioEmMapa(
                relatoriosPorClassificacao,
                item.classificacaoAf,
                item.relatorioId,
                item.nomeRelatorio,
            )
        }
        if (item.statusConferencia) statusConferencia.add(item.statusConferencia)
        if (item.statusRelatorio) statusRelatorio.add(item.statusRelatorio)

        adicionarEmMapa(setoresPorSecretaria, item.secretaria, item.setor)
        adicionarEmMapa(modelosPorSecretaria, item.secretaria, item.modelo)
        adicionarEmMapa(modelosPorSetor, item.setor, item.modelo)
    }

    return {
        meses: Array.from(meses.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => b.value.localeCompare(a.value)),
        classificacoes: ordenarLista(classificacoes),
        modelos: ordenarLista(modelos),
        secretarias: ordenarLista(secretarias),
        setores: ordenarLista(setores),
        relatorios: Array.from(relatorios.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        statusConferencia: ordenarLista(statusConferencia),
        statusRelatorio: ordenarLista(statusRelatorio),
        setoresPorSecretaria: mapaSetParaRecord(setoresPorSecretaria),
        modelosPorSecretaria: mapaSetParaRecord(modelosPorSecretaria),
        modelosPorSetor: mapaSetParaRecord(modelosPorSetor),
        relatoriosPorMes: mapaRelatoriosParaRecord(relatoriosPorMes),
        relatoriosPorClassificacao: mapaRelatoriosParaRecord(relatoriosPorClassificacao),
    }
}

function normalizarLeitura(
    leitura: LeituraMensalRow,
    relatorio: RelatorioPdfRow,
): LeituraMensalItem {
    const saldoPb = toNumber(leitura.saldo_pb)
    const saldoCor = toNumber(leitura.saldo_cor)
    const totalGeralPdf = toNumber(leitura.total_geral_pdf)
    const totalCalculado = toNumber(leitura.total_calculado)
    const diferencaTotal =
        leitura.diferenca_total === null || leitura.diferenca_total === undefined
            ? round2(totalCalculado - totalGeralPdf)
            : round2(toNumber(leitura.diferenca_total))

    const statusConferencia = limparTexto(
        leitura.status_conferencia,
        Boolean(leitura.divergente) || Math.abs(diferencaTotal) > 0.05
            ? 'divergente'
            : 'conferido',
    ).toLowerCase()

    const divergente =
        Boolean(leitura.divergente) ||
        Math.abs(diferencaTotal) > 0.05 ||
        statusConferencia !== 'conferido'

    const mesReferenciaFiltro = obterMesFiltro(relatorio.mes_referencia)
    const classificacaoAf = limparTexto(relatorio.classificacao_af)

    return {
        id: leitura.id,
        relatorioId: leitura.relatorio_id,
        equipamentoId: leitura.equipamento_id,

        modelo: limparTexto(leitura.modelo_texto_pdf),
        serie: limparTexto(leitura.serie_texto_pdf),
        secretaria: limparTexto(leitura.site_texto_pdf),
        setor: limparTexto(leitura.depto_texto_pdf, 'SEM DEPARTAMENTO'),

        mesReferencia: relatorio.mes_referencia,
        mesReferenciaFiltro,
        mesReferenciaFormatado: formatarMesReferencia(relatorio.mes_referencia),
        classificacaoAf,
        classificacaoAfNormalizada: normalizarTexto(classificacaoAf),
        statusRelatorio: limparTexto(relatorio.status).toLowerCase(),
        statusConferencia,
        nomeRelatorio: extrairNomeArquivo(relatorio.arquivo_path),
        arquivoPath: relatorio.arquivo_path,

        antPb: toNumber(leitura.ant_pb),
        atuPb: toNumber(leitura.atu_pb),
        saldoPb,

        antCor: toNumber(leitura.ant_cor),
        atuCor: toNumber(leitura.atu_cor),
        saldoCor,

        totalPaginas: saldoPb + saldoCor,
        totalGeralPdf,
        totalCalculado,
        diferencaTotal,

        divergente,
        createdAt: leitura.created_at,
    }
}

function aplicarFiltros(
    itens: LeituraMensalItem[],
    filtros: LeiturasMensaisFiltros,
): LeituraMensalItem[] {
    const busca = normalizarTexto(filtros.busca)
    const mesReferencia = obterMesFiltro(filtros.mesReferencia)
    const classificacaoAf = normalizarTexto(filtros.classificacaoAf)
    const statusConferencia = String(filtros.statusConferencia ?? '').toLowerCase().trim()
    const statusRelatorio = String(filtros.statusRelatorio ?? '').toLowerCase().trim()
    const secretaria = normalizarTexto(filtros.secretaria)
    const setor = normalizarTexto(filtros.setor)
    const modelo = normalizarTexto(filtros.modelo)
    const relatorioOrigem = String(filtros.relatorioOrigem ?? '').trim()

    return itens.filter((item) => {
        if (filtros.relatorioId && item.relatorioId !== filtros.relatorioId) {
            return false
        }

        if (mesReferencia && item.mesReferenciaFiltro !== mesReferencia) {
            return false
        }

        if (classificacaoAf && item.classificacaoAfNormalizada !== classificacaoAf) {
            return false
        }

        if (statusRelatorio && statusRelatorio !== 'todos' && item.statusRelatorio !== statusRelatorio) {
            return false
        }

        if (secretaria && secretaria !== 'TODOS' && normalizarTexto(item.secretaria) !== secretaria) {
            return false
        }

        if (setor && setor !== 'TODOS' && normalizarTexto(item.setor) !== setor) {
            return false
        }

        if (modelo && modelo !== 'TODOS' && normalizarTexto(item.modelo) !== modelo) {
            return false
        }

        if (relatorioOrigem && relatorioOrigem !== 'todos' && item.relatorioId !== relatorioOrigem) {
            return false
        }

        if (
            statusConferencia &&
            statusConferencia !== 'todos' &&
            item.statusConferencia !== statusConferencia
        ) {
            return false
        }

        if (filtros.somenteDivergentes && !item.divergente) {
            return false
        }

        if (busca) {
            const textoItem = normalizarTexto(
                [
                    item.modelo,
                    item.serie,
                    item.secretaria,
                    item.setor,
                    item.classificacaoAf,
                    item.statusConferencia,
                    item.statusRelatorio,
                    item.nomeRelatorio,
                    item.mesReferenciaFormatado,
                ].join(' '),
            )

            if (!textoItem.includes(busca)) {
                return false
            }
        }

        return true
    })
}

export async function listarLeiturasMensais(
    filtros: LeiturasMensaisFiltros = {},
): Promise<LeiturasMensaisResponse> {
    const limite = filtros.limite ?? 5000

    const { data: relatoriosRaw, error: relatoriosError } = await db
        .from('relatorios_pdf')
        .select(
            `
                id,
                arquivo_path,
                mes_referencia,
                classificacao_af,
                status,
                valor_bruto_pdf,
                valor_total_calculado,
                created_at
            `,
        )
        .order('mes_referencia', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1000)

    if (relatoriosError) {
        throw new Error(`Erro ao buscar relatórios PDF: ${relatoriosError.message}`)
    }

    const relatorios = (relatoriosRaw ?? []) as RelatorioPdfRow[]

    if (relatorios.length === 0) {
        return {
            resumo: criarResumo([]),
            itens: [],
            opcoes: criarOpcoes([]),
        }
    }

    const relatoriosPorId = new Map<string, RelatorioPdfRow>()

    for (const relatorio of relatorios) {
        relatoriosPorId.set(relatorio.id, relatorio)
    }

    const relatorioIds = relatorios.map((relatorio) => relatorio.id)

    const { data: leiturasRaw, error: leiturasError } = await db
        .from('leituras_mensais')
        .select(
            `
                id,
                relatorio_id,
                equipamento_id,
                modelo_texto_pdf,
                serie_texto_pdf,
                site_texto_pdf,
                depto_texto_pdf,
                ant_pb,
                atu_pb,
                saldo_pb,
                ant_cor,
                atu_cor,
                saldo_cor,
                total_geral_pdf,
                total_calculado,
                diferenca_total,
                status_conferencia,
                divergente,
                created_at
            `,
        )
        .in('relatorio_id', relatorioIds)
        .order('modelo_texto_pdf', { ascending: true })
        .order('serie_texto_pdf', { ascending: true })
        .limit(limite)

    if (leiturasError) {
        throw new Error(`Erro ao buscar leituras mensais: ${leiturasError.message}`)
    }

    const todosItens = ((leiturasRaw ?? []) as LeituraMensalRow[])
        .map((leitura) => {
            const relatorio = relatoriosPorId.get(leitura.relatorio_id)

            if (!relatorio) return null

            return normalizarLeitura(leitura, relatorio)
        })
        .filter((item): item is LeituraMensalItem => item !== null)

    const itensFiltrados = aplicarFiltros(todosItens, filtros)

    return {
        resumo: criarResumo(itensFiltrados),
        itens: itensFiltrados,
        opcoes: criarOpcoes(todosItens),
    }
}
