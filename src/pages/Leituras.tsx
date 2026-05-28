import { useEffect, useMemo, useRef, useState, type ReactNode, type UIEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    AlertTriangle,
    CheckCircle2,
    Database,
    Download,
    FileText,
    Filter,
    Loader2,
    RefreshCw,
    Search,
    XCircle,
} from 'lucide-react'

import {
    listarLeiturasMensais,
    type LeituraMensalItem,
    type LeiturasMensaisResponse,
} from '../services/leiturasMensaisService'

function formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value)
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)
}

function formatStatus(value: string): string {
    const labels: Record<string, string> = {
        aprovado: 'Aprovado',
        pendente_conferencia: 'Pendente conferência',
        rejeitado: 'Rejeitado',
        erro: 'Erro',
        conferido: 'Conferido',
        divergente: 'Divergente',
        divergencia_valor: 'Divergência de valor',
        divergencia_leitura_pb: 'Divergência P/B',
        divergencia_leitura_cor: 'Divergência cor',
    }

    return labels[value] ?? value
}

function statusClasses(value: string, divergente = false): string {
    if (divergente || value.includes('diverg')) {
        return 'border-amber-800 bg-amber-950/40 text-amber-200'
    }

    if (value === 'conferido' || value === 'aprovado') {
        return 'border-emerald-800 bg-emerald-950/40 text-emerald-200'
    }

    if (value === 'rejeitado' || value === 'erro') {
        return 'border-red-800 bg-red-950/40 text-red-200'
    }

    return 'border-slate-700 bg-slate-950 text-slate-300'
}

function StatusBadge({ status, divergente = false }: { status: string; divergente?: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                status,
                divergente,
            )}`}
        >
            {divergente ? (
                <AlertTriangle className="h-3.5 w-3.5" />
            ) : status === 'conferido' || status === 'aprovado' ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
                <FileText className="h-3.5 w-3.5" />
            )}
            {formatStatus(status)}
        </span>
    )
}


function SyncedTableScroll({
    children,
    minWidth,
    maxHeightClass = 'max-h-[calc(100vh-330px)]',
}: {
    children: ReactNode
    minWidth: number
    maxHeightClass?: string
}) {
    const topScrollRef = useRef<HTMLDivElement | null>(null)
    const tableScrollRef = useRef<HTMLDivElement | null>(null)
    const syncingRef = useRef(false)

    function sincronizarScroll(origem: 'topo' | 'tabela') {
        return (event: UIEvent<HTMLDivElement>) => {
            if (syncingRef.current) return

            const origemElemento = event.currentTarget
            const destinoElemento = origem === 'topo' ? tableScrollRef.current : topScrollRef.current

            if (!destinoElemento) return

            syncingRef.current = true
            destinoElemento.scrollLeft = origemElemento.scrollLeft

            window.requestAnimationFrame(() => {
                syncingRef.current = false
            })
        }
    }

    return (
        <div className="w-full">
            <div className="flex flex-col gap-2 border-b border-slate-800 bg-slate-950/50 px-4 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <span>
                    Tabela larga: use a barra horizontal abaixo para acessar as colunas da direita sem descer até o fim da lista.
                </span>
                <span className="font-semibold text-violet-300">Scroll horizontal sincronizado</span>
            </div>

            <div
                ref={topScrollRef}
                onScroll={sincronizarScroll('topo')}
                className="sticky top-0 z-30 h-4 w-full overflow-x-auto overflow-y-hidden border-b border-slate-800 bg-slate-950/95"
                aria-label="Rolagem horizontal superior da tabela"
            >
                <div style={{ width: minWidth }} className="h-1" />
            </div>

            <div
                ref={tableScrollRef}
                onScroll={sincronizarScroll('tabela')}
                className={`w-full overflow-auto ${maxHeightClass}`}
            >
                {children}
            </div>
        </div>
    )
}

function ResumoCard({
    titulo,
    valor,
    descricao,
    variante = 'padrao',
}: {
    titulo: string
    valor: string
    descricao: string
    variante?: 'padrao' | 'sucesso' | 'aviso' | 'destaque'
}) {
    const classes = {
        padrao: 'border-slate-800 bg-slate-900/80',
        sucesso: 'border-emerald-900/60 bg-emerald-950/20',
        aviso: 'border-amber-900/70 bg-amber-950/20',
        destaque: 'border-violet-900/70 bg-violet-950/30',
    }

    const valorClasses = {
        padrao: 'text-white',
        sucesso: 'text-emerald-200',
        aviso: 'text-amber-200',
        destaque: 'text-violet-100',
    }

    return (
        <div className={`rounded-2xl border p-5 shadow-sm ${classes[variante]}`}>
            <p className="text-sm font-medium text-slate-400">{titulo}</p>
            <p className={`mt-3 text-2xl font-bold ${valorClasses[variante]}`}>{valor}</p>
            <p className="mt-1 text-xs text-slate-500">{descricao}</p>
        </div>
    )
}

function csvEscape(value: unknown): string {
    const texto = String(value ?? '')
        .replace(/\r?\n|\r/g, ' ')
        .replace(/"/g, '""')

    return `"${texto}"`
}

function formatDecimalCsv(value: number, casas = 2): string {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas,
    }).format(value)
}

function formatInteiroCsv(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: 0,
    }).format(value)
}

function baixarArquivoCsv(nomeArquivo: string, conteudo: string) {
    const blob = new Blob([`\uFEFF${conteudo}`], {
        type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = nomeArquivo
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
}

function montarNomeArquivoCsv() {
    const agora = new Date()
    const data = agora.toISOString().slice(0, 10)

    return `leituras-mensais-printcontrol-${data}.csv`
}

function ordenarUnicos(valores: string[]): string[] {
    return Array.from(new Set(valores.filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function intersectarRelatorios(
    principal: Array<{ value: string; label: string }>,
    restricao: Array<{ value: string; label: string }>,
): Array<{ value: string; label: string }> {
    const permitidos = new Set(restricao.map((item) => item.value))

    return principal.filter((item) => permitidos.has(item.value))
}

function normalizarParametroFiltro(value: string | null, fallback = 'todos'): string {
    const texto = String(value ?? '').trim()

    return texto.length > 0 ? texto : fallback
}

function lerBooleanoUrl(value: string | null): boolean {
    return ['true', '1', 'sim', 'yes'].includes(String(value ?? '').toLowerCase())
}

function lerFiltrosDaUrl(search: string) {
    const params = new URLSearchParams(search)

    return {
        busca: String(params.get('busca') ?? '').trim(),
        mesReferencia: normalizarParametroFiltro(params.get('mesReferencia')),
        ano: normalizarParametroFiltro(params.get('ano')),
        classificacaoAf: normalizarParametroFiltro(params.get('classificacaoAf')),
        statusConferencia: normalizarParametroFiltro(params.get('statusConferencia')),
        statusRelatorio: normalizarParametroFiltro(params.get('statusRelatorio'), 'aprovado'),
        secretaria: normalizarParametroFiltro(params.get('secretaria')),
        setor: normalizarParametroFiltro(params.get('setor')),
        modelo: normalizarParametroFiltro(params.get('modelo')),
        relatorioOrigem: normalizarParametroFiltro(params.get('relatorioOrigem')),
        somenteDivergentes: lerBooleanoUrl(params.get('somenteDivergentes')),
    }
}

function gerarCsvLeituras(itens: LeituraMensalItem[]): string {
    const cabecalho = [
        'Mês referência',
        'Classificação AF',
        'Relatório origem',
        'Modelo',
        'Série',
        'Secretaria/Site',
        'Setor/Departamento',
        'Ant. PB',
        'Atu. PB',
        'Saldo PB',
        'Ant. Cor',
        'Atu. Cor',
        'Saldo Cor',
        'Total páginas',
        'Total PDF',
        'Total calculado',
        'Diferença',
        'Status conferência',
        'Status relatório',
        'Divergente',
    ]

    const linhas = itens.map((item) => [
        item.mesReferenciaFormatado,
        item.classificacaoAf,
        item.nomeRelatorio,
        item.modelo,
        item.serie,
        item.secretaria,
        item.setor,
        formatInteiroCsv(item.antPb),
        formatInteiroCsv(item.atuPb),
        formatInteiroCsv(item.saldoPb),
        formatInteiroCsv(item.antCor),
        formatInteiroCsv(item.atuCor),
        formatInteiroCsv(item.saldoCor),
        formatInteiroCsv(item.totalPaginas),
        formatDecimalCsv(item.totalGeralPdf),
        formatDecimalCsv(item.totalCalculado),
        formatDecimalCsv(item.diferencaTotal),
        formatStatus(item.statusConferencia),
        formatStatus(item.statusRelatorio),
        item.divergente ? 'Sim' : 'Não',
    ])

    return [cabecalho, ...linhas]
        .map((linha) => linha.map(csvEscape).join(';'))
        .join('\n')
}

export default function Leituras() {
    const navigate = useNavigate()
    const location = useLocation()
    const filtrosUrlIniciais = lerFiltrosDaUrl(location.search)

    const [busca, setBusca] = useState(filtrosUrlIniciais.busca)
    const [mesReferencia, setMesReferencia] = useState(filtrosUrlIniciais.mesReferencia)
    const [ano, setAno] = useState(filtrosUrlIniciais.ano)
    const [classificacaoAf, setClassificacaoAf] = useState(filtrosUrlIniciais.classificacaoAf)
    const [statusConferencia, setStatusConferencia] = useState(filtrosUrlIniciais.statusConferencia)
    const [statusRelatorio, setStatusRelatorio] = useState(filtrosUrlIniciais.statusRelatorio)
    const [secretaria, setSecretaria] = useState(filtrosUrlIniciais.secretaria)
    const [setor, setSetor] = useState(filtrosUrlIniciais.setor)
    const [modelo, setModelo] = useState(filtrosUrlIniciais.modelo)
    const [relatorioOrigem, setRelatorioOrigem] = useState(filtrosUrlIniciais.relatorioOrigem)
    const [somenteDivergentes, setSomenteDivergentes] = useState(filtrosUrlIniciais.somenteDivergentes)

    const [data, setData] = useState<LeiturasMensaisResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isFetching, setIsFetching] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const filtros = useMemo(
        () => ({
            busca,
            mesReferencia: mesReferencia === 'todos' ? undefined : mesReferencia,
            ano: ano === 'todos' ? undefined : ano,
            classificacaoAf: classificacaoAf === 'todos' ? undefined : classificacaoAf,
            statusConferencia,
            statusRelatorio,
            secretaria: secretaria === 'todos' ? undefined : secretaria,
            setor: setor === 'todos' ? undefined : setor,
            modelo: modelo === 'todos' ? undefined : modelo,
            relatorioOrigem: relatorioOrigem === 'todos' ? undefined : relatorioOrigem,
            somenteDivergentes,
            limite: 5000,
        }),
        [
            busca,
            ano,
            classificacaoAf,
            mesReferencia,
            modelo,
            relatorioOrigem,
            secretaria,
            setor,
            somenteDivergentes,
            statusConferencia,
            statusRelatorio,
        ],
    )


    useEffect(() => {
        const filtrosUrl = lerFiltrosDaUrl(location.search)

        setBusca(filtrosUrl.busca)
        setMesReferencia(filtrosUrl.mesReferencia)
        setAno(filtrosUrl.ano)
        setClassificacaoAf(filtrosUrl.classificacaoAf)
        setStatusConferencia(filtrosUrl.statusConferencia)
        setStatusRelatorio(filtrosUrl.statusRelatorio)
        setSecretaria(filtrosUrl.secretaria)
        setSetor(filtrosUrl.setor)
        setModelo(filtrosUrl.modelo)
        setRelatorioOrigem(filtrosUrl.relatorioOrigem)
        setSomenteDivergentes(filtrosUrl.somenteDivergentes)
    }, [location.search])

    async function carregarLeituras(mostrarLoadingInicial = false) {
        try {
            if (mostrarLoadingInicial) {
                setIsLoading(true)
            } else {
                setIsFetching(true)
            }

            setError(null)
            const resposta = await listarLeiturasMensais(filtros)
            setData(resposta)
        } catch (erro) {
            setError(
                erro instanceof Error
                    ? erro.message
                    : 'Erro desconhecido ao carregar leituras mensais.',
            )
        } finally {
            setIsLoading(false)
            setIsFetching(false)
        }
    }

    useEffect(() => {
        void carregarLeituras(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void carregarLeituras(false)
        }, 250)

        return () => window.clearTimeout(timeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtros])

    const resumo = data?.resumo
    const itens = data?.itens ?? []
    const opcoes = data?.opcoes

    const setoresDisponiveis = useMemo(() => {
        if (!opcoes) return []

        if (secretaria !== 'todos') {
            return ordenarUnicos(opcoes.setoresPorSecretaria?.[secretaria] ?? [])
        }

        return opcoes.setores
    }, [opcoes, secretaria])

    const modelosDisponiveis = useMemo(() => {
        if (!opcoes) return []

        if (setor !== 'todos') {
            return ordenarUnicos(opcoes.modelosPorSetor?.[setor] ?? [])
        }

        if (secretaria !== 'todos') {
            return ordenarUnicos(opcoes.modelosPorSecretaria?.[secretaria] ?? [])
        }

        return opcoes.modelos
    }, [opcoes, secretaria, setor])

    const relatoriosDisponiveis = useMemo(() => {
        if (!opcoes) return []

        let relatorios = opcoes.relatorios

        if (mesReferencia !== 'todos') {
            relatorios = opcoes.relatoriosPorMes?.[mesReferencia] ?? []
        }

        if (classificacaoAf !== 'todos') {
            const porClassificacao = opcoes.relatoriosPorClassificacao?.[classificacaoAf] ?? []
            relatorios = mesReferencia !== 'todos'
                ? intersectarRelatorios(relatorios, porClassificacao)
                : porClassificacao
        }

        return relatorios
    }, [classificacaoAf, mesReferencia, opcoes])

    useEffect(() => {
        if (setor !== 'todos' && !setoresDisponiveis.includes(setor)) {
            setSetor('todos')
        }
    }, [setor, setoresDisponiveis])

    useEffect(() => {
        if (modelo !== 'todos' && !modelosDisponiveis.includes(modelo)) {
            setModelo('todos')
        }
    }, [modelo, modelosDisponiveis])

    useEffect(() => {
        if (
            relatorioOrigem !== 'todos' &&
            !relatoriosDisponiveis.some((relatorio) => relatorio.value === relatorioOrigem)
        ) {
            setRelatorioOrigem('todos')
        }
    }, [relatorioOrigem, relatoriosDisponiveis])

    function limparFiltros() {
        setBusca('')
        setMesReferencia('todos')
        setAno('todos')
        setClassificacaoAf('todos')
        setStatusConferencia('todos')
        setStatusRelatorio('aprovado')
        setSecretaria('todos')
        setSetor('todos')
        setModelo('todos')
        setRelatorioOrigem('todos')
        setSomenteDivergentes(false)
        navigate('/leituras', { replace: true })
    }

    function exportarCsvLeituras() {
        const itensParaExportar = data?.itens ?? []

        if (itensParaExportar.length === 0) {
            window.alert('Não há leituras para exportar com os filtros atuais.')
            return
        }

        const csv = gerarCsvLeituras(itensParaExportar)
        baixarArquivoCsv(montarNomeArquivoCsv(), csv)
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm text-slate-200">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                    Carregando leituras mensais...
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-6 text-red-200">
                <div className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-5 w-5" />
                    <div>
                        <h2 className="text-lg font-semibold">Não foi possível carregar as leituras.</h2>
                        <p className="mt-1 text-sm text-red-300">{error}</p>
                        <button
                            type="button"
                            onClick={() => carregarLeituras(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-800 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-950"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Tentar novamente
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const filtrosAtivos = [
        busca.trim() ? `Busca: ${busca.trim()}` : null,
        mesReferencia !== 'todos' ? `Mês: ${opcoes?.meses.find((mes) => mes.value === mesReferencia)?.label ?? mesReferencia}` : null,
        ano !== 'todos' ? `Ano: ${ano}` : null,
        classificacaoAf !== 'todos' ? `AF: ${classificacaoAf}` : null,
        relatorioOrigem !== 'todos' ? `Relatório: ${opcoes?.relatorios.find((relatorio) => relatorio.value === relatorioOrigem)?.label ?? relatorioOrigem}` : null,
        secretaria !== 'todos' ? `Secretaria: ${secretaria}` : null,
        setor !== 'todos' ? `Setor: ${setor}` : null,
        modelo !== 'todos' ? `Modelo: ${modelo}` : null,
        statusConferencia !== 'todos' ? `Status leitura: ${formatStatus(statusConferencia)}` : null,
        statusRelatorio !== 'aprovado' ? `Status relatório: ${statusRelatorio === 'todos' ? 'Todos' : formatStatus(statusRelatorio)}` : null,
        somenteDivergentes ? 'Somente divergentes' : null,
    ].filter((item): item is string => Boolean(item))

    const equipamentosUnicos = new Set(
        itens
            .map((item) => item.serie)
            .filter((serie) => serie && serie !== 'Não informado'),
    ).size

    const relatoriosUnicos = new Set(
        itens
            .map((item) => item.relatorioId)
            .filter(Boolean),
    ).size

    const diferencaTotalFiltrada = resumo?.diferencaTotal ?? 0
    const leiturasDivergentesFiltradas = resumo?.leiturasDivergentes ?? 0
    const possuiDivergenciaVisual =
        leiturasDivergentesFiltradas > 0 || Math.abs(diferencaTotalFiltrada) > 0.05

    return (
        <div className="w-full max-w-none min-w-0 space-y-6">
            <section className="flex w-full min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <p className="text-sm font-medium text-violet-300">Relatórios PDF</p>
                    <h1 className="mt-1 text-2xl font-bold text-white">Leituras mensais</h1>
                    <p className="mt-2 max-w-5xl text-sm text-slate-400">
                        Consulte as leituras importadas dos PDFs, com filtros por mês, classificação,
                        status, equipamento, secretaria, setor e divergência.
                    </p>
                </div>

                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:flex-row">
                    <button
                        type="button"
                        onClick={exportarCsvLeituras}
                        disabled={itens.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />
                        Exportar CSV
                    </button>

                    <button
                        type="button"
                        onClick={() => carregarLeituras(false)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-white">
                            Resumo do resultado filtrado
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Os cards abaixo refletem exatamente as leituras exibidas na tabela e no CSV.
                        </p>
                    </div>

                    <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                            possuiDivergenciaVisual
                                ? 'border-amber-800 bg-amber-950/40 text-amber-200'
                                : 'border-emerald-800 bg-emerald-950/40 text-emerald-200'
                        }`}
                    >
                        {possuiDivergenciaVisual
                            ? 'Atenção: existem divergências no filtro'
                            : 'Sem divergência no filtro atual'}
                    </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                    <ResumoCard
                        titulo="Leituras exibidas"
                        valor={formatNumber(resumo?.totalLeituras ?? 0)}
                        descricao="Linhas/equipamentos retornados pelos filtros"
                        variante="destaque"
                    />

                    <ResumoCard
                        titulo="Relatórios envolvidos"
                        valor={formatNumber(relatoriosUnicos || resumo?.totalRelatorios || 0)}
                        descricao="Quantidade de PDFs de origem no filtro"
                    />

                    <ResumoCard
                        titulo="Equipamentos/Séries"
                        valor={formatNumber(equipamentosUnicos)}
                        descricao="Séries únicas encontradas no filtro"
                    />

                    <ResumoCard
                        titulo="Páginas P/B"
                        valor={formatNumber(resumo?.paginasPb ?? 0)}
                        descricao="Soma do saldo P/B das leituras exibidas"
                    />

                    <ResumoCard
                        titulo="Páginas coloridas"
                        valor={formatNumber(resumo?.paginasColoridas ?? 0)}
                        descricao="Soma do saldo colorido das leituras exibidas"
                    />

                    <ResumoCard
                        titulo="Total de páginas"
                        valor={formatNumber(resumo?.totalPaginas ?? 0)}
                        descricao="P/B + coloridas dentro do filtro"
                        variante="destaque"
                    />

                    <ResumoCard
                        titulo="Total PDF"
                        valor={formatCurrency(resumo?.valorPdf ?? 0)}
                        descricao="Soma do total geral informado nos PDFs"
                    />

                    <ResumoCard
                        titulo="Total calculado"
                        valor={formatCurrency(resumo?.valorCalculado ?? 0)}
                        descricao="Soma recalculada pelo sistema"
                    />

                    <ResumoCard
                        titulo="Diferença"
                        valor={formatCurrency(diferencaTotalFiltrada)}
                        descricao="Total calculado menos total informado no PDF"
                        variante={Math.abs(diferencaTotalFiltrada) > 0.05 ? 'aviso' : 'sucesso'}
                    />

                    <ResumoCard
                        titulo="Divergências"
                        valor={formatNumber(leiturasDivergentesFiltradas)}
                        descricao={`${formatNumber(resumo?.leiturasConferidas ?? 0)} leitura(s) conferida(s)`}
                        variante={leiturasDivergentesFiltradas > 0 ? 'aviso' : 'sucesso'}
                    />
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                            <Filter className="h-5 w-5 text-violet-300" />
                            Filtros das leituras
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Use os filtros combinados para localizar leituras por mês, relatório, local, modelo e status.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-violet-800 bg-violet-950/40 px-3 py-1 text-xs font-semibold text-violet-200">
                            {formatNumber(itens.length)} leitura(s) exibida(s)
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-300">
                            {formatNumber(filtrosAtivos.length)} filtro(s) ativo(s)
                        </span>
                        <button
                            type="button"
                            onClick={limparFiltros}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                        >
                            <Filter className="h-4 w-4" />
                            Limpar filtros
                        </button>
                    </div>
                </div>

                <div className="mt-4 grid gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            1. Busca e competência
                        </p>

                        <div className="grid gap-3 xl:grid-cols-[minmax(320px,1.5fr)_minmax(170px,220px)_minmax(210px,260px)_minmax(210px,260px)]">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <input
                                    value={busca}
                                    onChange={(event) => setBusca(event.target.value)}
                                    placeholder="Buscar por série, modelo, secretaria, setor ou relatório..."
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-500"
                                />
                            </div>

                            <select
                                value={mesReferencia}
                                onChange={(event) => setMesReferencia(event.target.value)}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-500"
                            >
                                <option value="todos">Todos os meses</option>
                                {opcoes?.meses.map((mes) => (
                                    <option key={mes.value} value={mes.value}>
                                        {mes.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={classificacaoAf}
                                onChange={(event) => setClassificacaoAf(event.target.value)}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-500"
                            >
                                <option value="todos">Todas as classificações</option>
                                {opcoes?.classificacoes.map((classificacao) => (
                                    <option key={classificacao} value={classificacao}>
                                        {classificacao}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={relatorioOrigem}
                                onChange={(event) => setRelatorioOrigem(event.target.value)}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-500"
                            >
                                <option value="todos">Todos os relatórios</option>
                                {relatoriosDisponiveis.map((relatorio) => (
                                    <option key={relatorio.value} value={relatorio.value}>
                                        {relatorio.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            2. Localização e equipamento
                        </p>
                        <p className="mb-3 text-xs text-slate-500">
                            Os filtros são dependentes: ao escolher uma secretaria, a lista de setores e modelos é ajustada automaticamente.
                        </p>

                        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                            <select
                                value={secretaria}
                                onChange={(event) => {
                                    setSecretaria(event.target.value)
                                    setSetor('todos')
                                }}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-500"
                            >
                                <option value="todos">Todas as secretarias/sites</option>
                                {opcoes?.secretarias.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={setor}
                                onChange={(event) => setSetor(event.target.value)}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-500"
                            >
                                <option value="todos">Todos os setores/deptos</option>
                                {setoresDisponiveis.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={modelo}
                                onChange={(event) => setModelo(event.target.value)}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-500"
                            >
                                <option value="todos">Todos os modelos</option>
                                {modelosDisponiveis.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            3. Conferência e status
                        </p>

                        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[220px_220px_1fr]">
                            <select
                                value={statusConferencia}
                                onChange={(event) => setStatusConferencia(event.target.value)}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-500"
                            >
                                <option value="todos">Todos os status leitura</option>
                                {opcoes?.statusConferencia.map((status) => (
                                    <option key={status} value={status}>
                                        {formatStatus(status)}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={statusRelatorio}
                                onChange={(event) => setStatusRelatorio(event.target.value)}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-500"
                            >
                                <option value="aprovado">Relatórios aprovados</option>
                                <option value="todos">Todos os relatórios</option>
                                {opcoes?.statusRelatorio
                                    .filter((status) => status !== 'aprovado')
                                    .map((status) => (
                                        <option key={status} value={status}>
                                            {formatStatus(status)}
                                        </option>
                                    ))}
                            </select>

                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={somenteDivergentes}
                                    onChange={(event) => setSomenteDivergentes(event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                                />
                                Mostrar somente leituras divergentes
                            </label>
                        </div>
                    </div>
                </div>

                {filtrosAtivos.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
                        {filtrosAtivos.map((filtro) => (
                            <span
                                key={filtro}
                                className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300"
                            >
                                {filtro}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-400">
                        Nenhum filtro específico aplicado. Por padrão, a tela mostra somente relatórios aprovados.
                    </div>
                )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-sm">
                <div className="border-b border-slate-800 px-5 py-4">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                        <Database className="h-5 w-5 text-violet-300" />
                        Leituras importadas
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Exibindo {formatNumber(itens.length)} leitura(s) conforme os filtros aplicados.
                        A exportação CSV respeita exatamente este resultado.
                    </p>
                </div>

                {itens.length === 0 ? (
                    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
                        <FileText className="h-10 w-10 text-slate-600" />
                        <h3 className="mt-4 text-base font-semibold text-slate-200">
                            Nenhuma leitura encontrada
                        </h3>
                        <p className="mt-1 max-w-md text-sm text-slate-500">
                            Ajuste os filtros ou confira se existem relatórios PDF aprovados com leituras importadas.
                        </p>
                    </div>
                ) : (
                    <SyncedTableScroll minWidth={1900}>
                        <table className="w-full min-w-[1900px] text-left text-sm">
                            <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">Equipamento</th>
                                    <th className="px-5 py-3">Local</th>
                                    <th className="px-5 py-3">Mês / AF</th>
                                    <th className="px-5 py-3 text-right">Ant. P/B</th>
                                    <th className="px-5 py-3 text-right">Atu. P/B</th>
                                    <th className="px-5 py-3 text-right">Saldo P/B</th>
                                    <th className="px-5 py-3 text-right">Ant. Cor</th>
                                    <th className="px-5 py-3 text-right">Atu. Cor</th>
                                    <th className="px-5 py-3 text-right">Saldo Cor</th>
                                    <th className="px-5 py-3 text-right">Total páginas</th>
                                    <th className="px-5 py-3 text-right">Total PDF</th>
                                    <th className="px-5 py-3 text-right">Calculado</th>
                                    <th className="px-5 py-3 text-right">Diferença</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Relatório</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800">
                                {itens.map((item: LeituraMensalItem) => (
                                    <tr
                                        key={item.id}
                                        className={
                                            item.divergente
                                                ? 'bg-amber-950/10 hover:bg-amber-950/20'
                                                : 'hover:bg-slate-800/40'
                                        }
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-100">{item.modelo}</p>
                                            <p className="mt-1 text-xs text-slate-500">Série: {item.serie}</p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-medium text-slate-200">{item.secretaria}</p>
                                            <p className="mt-1 text-xs text-slate-500">{item.setor}</p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-medium text-slate-200">{item.mesReferenciaFormatado}</p>
                                            <p className="mt-1 text-xs text-slate-500">{item.classificacaoAf}</p>
                                        </td>

                                        <td className="px-5 py-4 text-right font-mono text-slate-300">{formatNumber(item.antPb)}</td>
                                        <td className="px-5 py-4 text-right font-mono text-slate-300">{formatNumber(item.atuPb)}</td>
                                        <td className="px-5 py-4 text-right font-mono font-semibold text-slate-100">{formatNumber(item.saldoPb)}</td>
                                        <td className="px-5 py-4 text-right font-mono text-slate-300">{formatNumber(item.antCor)}</td>
                                        <td className="px-5 py-4 text-right font-mono text-slate-300">{formatNumber(item.atuCor)}</td>
                                        <td className="px-5 py-4 text-right font-mono font-semibold text-slate-100">{formatNumber(item.saldoCor)}</td>
                                        <td className="px-5 py-4 text-right font-mono font-bold text-violet-200">{formatNumber(item.totalPaginas)}</td>
                                        <td className="px-5 py-4 text-right font-mono text-slate-300">{formatCurrency(item.totalGeralPdf)}</td>
                                        <td className="px-5 py-4 text-right font-mono text-slate-300">{formatCurrency(item.totalCalculado)}</td>
                                        <td
                                            className={`px-5 py-4 text-right font-mono font-semibold ${
                                                Math.abs(item.diferencaTotal) > 0.05
                                                    ? 'text-amber-300'
                                                    : 'text-emerald-300'
                                            }`}
                                        >
                                            {formatCurrency(item.diferencaTotal)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge status={item.statusConferencia} divergente={item.divergente} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/relatorios-pdf/${item.relatorioId}`)}
                                                className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                                            >
                                                Abrir relatório
                                            </button>
                                            <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                                                {item.nomeRelatorio}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </SyncedTableScroll>
                )}
            </section>
        </div>
    )
}
