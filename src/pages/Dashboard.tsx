import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SupabaseConnectionStatus } from '../components/debug/SupabaseConnectionStatus'
import { getDashboardInicial } from '../services/dashboardService'
import { formatNumber, formatCurrency, formatDecimal } from '../utils/formatters'
import type { DashboardAlerta, DashboardFiltros } from '../types/dashboard'

import {
  TrendingUp,
  Printer,
  FileCheck2,
  Scroll,
  AlertTriangle,
  ArrowRight,
  Loader2,
  XCircle,
  FileText,
  DollarSign,
  Layers,
  BarChart2,
  Filter,
  RefreshCw,
  RotateCcw,
  Download,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

function alertStyles(nivel: DashboardAlerta['nivel']) {
  switch (nivel) {
    case 'vermelho':
      return {
        wrapper:
          'bg-rose-50/50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/10 text-rose-800 dark:text-rose-300',
        icon: 'text-rose-600 dark:text-rose-400',
      }
    case 'laranja':
    case 'amarelo':
      return {
        wrapper:
          'bg-amber-50/50 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/10 text-amber-800 dark:text-amber-300',
        icon: 'text-amber-600 dark:text-amber-400',
      }
    default:
      return {
        wrapper:
          'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/10 text-indigo-800 dark:text-indigo-300',
        icon: 'text-indigo-600 dark:text-indigo-400',
      }
  }
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="mt-4">
        <div className="h-7 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-3 w-40 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  )
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {children}
    </label>
  )
}

function SelectBase({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
    >
      {children}
    </select>
  )
}

function getFiltroDescricao(filtros: DashboardFiltros) {
  const ativos: string[] = []

  if (filtros.mesReferencia === 'todos') ativos.push('todos os meses')
  if (filtros.mesReferencia && filtros.mesReferencia !== 'todos') ativos.push('mês selecionado')
  if (filtros.ano && filtros.ano !== 'todos') ativos.push(`ano ${filtros.ano}`)
  if (filtros.classificacaoAf && filtros.classificacaoAf !== 'todos') ativos.push(filtros.classificacaoAf)
  if (filtros.statusRelatorio && filtros.statusRelatorio !== 'aprovado') ativos.push(`status ${filtros.statusRelatorio}`)

  if (ativos.length === 0) return 'Mês mais recente aprovado'

  return ativos.join(' · ')
}


function formatarValorCsv(value: string | number | null | undefined) {
  if (value === null || value === undefined) return ''

  const texto = String(value)

  return `"${texto.replace(/"/g, '""')}"`
}

function formatarNumeroCsv(value: number | null | undefined, casas = 2) {
  const numero = Number(value ?? 0)

  if (!Number.isFinite(numero)) return '0'

  return numero.toFixed(casas).replace('.', ',')
}

function montarLinhaCsv(valores: Array<string | number | null | undefined>) {
  return valores.map(formatarValorCsv).join(';')
}

function baixarArquivoTexto(conteudo: string, nomeArquivo: string, mimeType: string) {
  const blob = new Blob([conteudo], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function dataAtualArquivo() {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date())
    .replace(/\D/g, '-')
    .replace(/-$/, '')
}

export default function Dashboard() {
  const [filtros, setFiltros] = useState<DashboardFiltros>({
    mesReferencia: '',
    ano: 'todos',
    classificacaoAf: 'todos',
    statusRelatorio: 'aprovado',
  })

  const queryKey = useMemo(
    () => [
      'dashboard-inicial',
      filtros.mesReferencia || 'mes-mais-recente',
      filtros.ano || 'todos',
      filtros.classificacaoAf || 'todos',
      filtros.statusRelatorio || 'aprovado',
    ],
    [filtros],
  )

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      getDashboardInicial({
        ...filtros,
        mesReferencia: filtros.mesReferencia || undefined,
      }),
  })

  const resumo = data?.resumo
  const alertas = data?.alertas ?? []
  const secretarias = data?.secretarias ?? []
  const tendenciaMensal = data?.tendenciaMensal ?? []
  const rankingEquipamentos = data?.rankingEquipamentos ?? []
  const rankingSecretarias = data?.rankingSecretarias ?? []
  const opcoes = data?.opcoes

  const diferencaFinanceira = resumo?.diferencaBrutoCalculado ?? 0
  const possuiDiferencaFinanceira = Math.abs(diferencaFinanceira) > 0.05
  const valorLiquidoEstimado = (resumo?.valorBruto ?? 0) - (resumo?.valorRetencao ?? 0)

  const financeiroComparativoChartData = [
    {
      name: 'Financeiro',
      bruto: resumo?.valorBruto ?? 0,
      liquido: resumo?.valorLiquido ?? 0,
      retencao: resumo?.valorRetencao ?? 0,
      calculado: resumo?.valorCalculado ?? 0,
    },
  ]

  const secretariasChartData = secretarias.map((s) => ({
    name: s.secretaria.length > 14 ? `${s.secretaria.substring(0, 13)}…` : s.secretaria,
    impresso: s.totalPaginas,
  }))


  function exportarResumoDashboardCsv() {
    if (!data || !resumo) return

    const linhas: string[] = []
    const filtrosAplicados = data.filtrosAplicados

    linhas.push('PrintControl NAS - Resumo do Dashboard')
    linhas.push(montarLinhaCsv(['Gerado em', new Date().toLocaleString('pt-BR')]))
    linhas.push(montarLinhaCsv(['Contrato', resumo.contratoNumero]))
    linhas.push(montarLinhaCsv(['Fornecedor', resumo.fornecedor]))
    linhas.push(montarLinhaCsv(['Período', resumo.periodoLabel ?? resumo.mesReferencia]))
    linhas.push(montarLinhaCsv(['Filtro mês', filtrosAplicados.mesReferencia]))
    linhas.push(montarLinhaCsv(['Filtro ano', filtrosAplicados.ano]))
    linhas.push(montarLinhaCsv(['Filtro classificação AF', filtrosAplicados.classificacaoAf]))
    linhas.push(montarLinhaCsv(['Filtro status relatório', filtrosAplicados.statusRelatorio]))
    linhas.push('')

    linhas.push('Resumo geral')
    linhas.push(montarLinhaCsv(['Indicador', 'Valor']))
    linhas.push(montarLinhaCsv(['Relatórios', resumo.totalRelatoriosAprovados]))
    linhas.push(montarLinhaCsv(['Equipamentos/Séries com leitura', resumo.totalEquipamentos]))
    linhas.push(montarLinhaCsv(['Páginas P/B', resumo.paginasPb]))
    linhas.push(montarLinhaCsv(['Páginas coloridas', resumo.paginasColoridas]))
    linhas.push(montarLinhaCsv(['Total de páginas', resumo.totalPaginas]))
    linhas.push(montarLinhaCsv(['Valor bruto', formatarNumeroCsv(resumo.valorBruto)]))
    linhas.push(montarLinhaCsv(['Retenção', formatarNumeroCsv(resumo.valorRetencao)]))
    linhas.push(montarLinhaCsv(['Valor líquido/NF', formatarNumeroCsv(resumo.valorLiquido)]))
    linhas.push(montarLinhaCsv(['Valor calculado pelo sistema', formatarNumeroCsv(resumo.valorCalculado)]))
    linhas.push(montarLinhaCsv(['Diferença bruto x calculado', formatarNumeroCsv(resumo.diferencaBrutoCalculado)]))
    linhas.push(montarLinhaCsv(['Percentual de retenção', formatarNumeroCsv(resumo.percentualRetencao)]))
    linhas.push(montarLinhaCsv(['Resmas estimadas', formatarNumeroCsv(resumo.resmasEstimadas)]))
    linhas.push(montarLinhaCsv(['Caixas estimadas', formatarNumeroCsv(resumo.caixasEstimadas)]))
    linhas.push('')

    linhas.push('Tendência mensal')
    linhas.push(
      montarLinhaCsv([
        'Mês',
        'Páginas P/B',
        'Páginas coloridas',
        'Total páginas',
        'Valor bruto',
        'Valor líquido/NF',
        'Relatórios',
      ]),
    )
    tendenciaMensal.forEach((item) => {
      linhas.push(
        montarLinhaCsv([
          item.mesLabel,
          item.paginasPb,
          item.paginasColoridas,
          item.totalPaginas,
          formatarNumeroCsv(item.valorBruto),
          formatarNumeroCsv(item.valorLiquido),
          item.relatoriosAprovados,
        ]),
      )
    })
    linhas.push('')

    linhas.push('Ranking de secretarias por custo')
    linhas.push(
      montarLinhaCsv([
        'Posição',
        'Secretaria/Site',
        'Páginas P/B',
        'Páginas coloridas',
        'Total páginas',
        'Valor calculado',
        '% do custo',
        '% das páginas',
        'Resmas estimadas',
      ]),
    )
    rankingSecretarias.forEach((item, index) => {
      linhas.push(
        montarLinhaCsv([
          index + 1,
          item.secretaria,
          item.paginasPb,
          item.paginasColoridas,
          item.totalPaginas,
          formatarNumeroCsv(item.valorTotal),
          formatarNumeroCsv(item.participacaoValorPercentual),
          formatarNumeroCsv(item.participacaoPaginasPercentual),
          formatarNumeroCsv(item.resmasEstimadas),
        ]),
      )
    })
    linhas.push('')

    linhas.push('Ranking de equipamentos por consumo')
    linhas.push(
      montarLinhaCsv([
        'Posição',
        'Modelo',
        'Série',
        'Secretaria/Site',
        'Páginas P/B',
        'Páginas coloridas',
        'Total páginas',
        'Valor calculado',
        'Diferença',
        'Divergente',
      ]),
    )
    rankingEquipamentos.forEach((item, index) => {
      linhas.push(
        montarLinhaCsv([
          index + 1,
          item.modelo,
          item.serie,
          item.secretaria,
          item.paginasPb,
          item.paginasColoridas,
          item.totalPaginas,
          formatarNumeroCsv(item.valorCalculado),
          formatarNumeroCsv(item.diferencaTotal),
          item.divergente ? 'Sim' : 'Não',
        ]),
      )
    })

    const conteudo = `\ufeff${linhas.join('\n')}`
    const nomeArquivo = `dashboard-printcontrol-${dataAtualArquivo()}.csv`

    baixarArquivoTexto(conteudo, nomeArquivo, 'text/csv;charset=utf-8;')
  }

  function atualizarFiltro(chave: keyof DashboardFiltros, valor: string) {
    setFiltros((atual) => ({
      ...atual,
      [chave]: valor,
    }))
  }

  function montarUrlLeiturasDashboard(
    extras: Record<string, string | number | boolean | null | undefined> = {},
  ) {
    const params = new URLSearchParams()
    const filtrosAplicados = data?.filtrosAplicados
    const mesReferencia = filtros.mesReferencia || filtrosAplicados?.mesReferencia
    const ano = filtros.ano !== 'todos' ? filtros.ano : filtrosAplicados?.ano
    const classificacaoAf =
      filtros.classificacaoAf !== 'todos'
        ? filtros.classificacaoAf
        : filtrosAplicados?.classificacaoAf
    const statusRelatorio = filtros.statusRelatorio || filtrosAplicados?.statusRelatorio || 'aprovado'

    if (mesReferencia && mesReferencia !== 'todos') {
      params.set('mesReferencia', mesReferencia)
    }

    if (!mesReferencia && ano && ano !== 'todos') {
      params.set('ano', ano)
    }

    if (classificacaoAf && classificacaoAf !== 'todos') {
      params.set('classificacaoAf', classificacaoAf)
    }

    if (statusRelatorio && statusRelatorio !== 'todos') {
      params.set('statusRelatorio', statusRelatorio)
    }

    Object.entries(extras).forEach(([chave, valor]) => {
      if (valor === null || valor === undefined) return

      const texto = String(valor).trim()
      if (!texto || texto === 'todos') return

      params.set(chave, texto)
    })

    const queryString = params.toString()

    return queryString ? `/leituras?${queryString}` : '/leituras'
  }

  function limparFiltros() {
    setFiltros({
      mesReferencia: '',
      ano: 'todos',
      classificacaoAf: 'todos',
      statusRelatorio: 'aprovado',
    })
  }

  return (
    <div className="w-full max-w-none min-w-0 space-y-6">
      <div className="flex w-full min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            {resumo ? (
              <>
                {resumo.fornecedor}
                <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">
                  Contrato {resumo.contratoNumero} · {resumo.periodoLabel ?? resumo.mesReferencia}
                </span>
              </>
            ) : (
              'Dashboard Gerencial'
            )}
          </h2>
          <SupabaseConnectionStatus />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Consolidado de cotas, custos, impressões, papel A4 e relatórios aprovados.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:w-auto xl:flex-wrap xl:items-center xl:justify-end">
          <button
            type="button"
            onClick={() => refetch()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 xl:w-auto"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={exportarResumoDashboardCsv}
            disabled={!data || !resumo || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 xl:w-auto"
          >
            <Download size={16} />
            Exportar CSV
          </button>
          <Link
            to="/leituras"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition-all hover:bg-indigo-700 hover:shadow-lg xl:w-auto"
          >
            <FileText size={16} />
            Consultar Leituras
          </Link>
          <Link
            to="/relatorios-pdf"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 xl:w-auto"
          >
            Relatórios
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <Filter className="h-4 w-4 text-indigo-500" />
              Filtros do Dashboard
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Filtro atual: {getFiltroDescricao(filtros)}
            </p>
          </div>

          <button
            type="button"
            onClick={limparFiltros}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar filtros
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <FilterLabel>Mês de referência</FilterLabel>
            <SelectBase
              value={filtros.mesReferencia ?? ''}
              onChange={(value) => atualizarFiltro('mesReferencia', value)}
            >
              <option value="">Mês mais recente</option>
              <option value="todos">Todos os meses</option>
              {(opcoes?.meses ?? []).map((mes) => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </SelectBase>
          </div>

          <div>
            <FilterLabel>Ano</FilterLabel>
            <SelectBase
              value={filtros.ano ?? 'todos'}
              onChange={(value) => atualizarFiltro('ano', value)}
            >
              <option value="todos">Todos os anos</option>
              {(opcoes?.anos ?? []).map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </SelectBase>
          </div>

          <div>
            <FilterLabel>Classificação AF</FilterLabel>
            <SelectBase
              value={filtros.classificacaoAf ?? 'todos'}
              onChange={(value) => atualizarFiltro('classificacaoAf', value)}
            >
              <option value="todos">Todas as classificações</option>
              {(opcoes?.classificacoes ?? []).map((classificacao) => (
                <option key={classificacao} value={classificacao}>
                  {classificacao}
                </option>
              ))}
            </SelectBase>
          </div>

          <div>
            <FilterLabel>Status relatório</FilterLabel>
            <SelectBase
              value={filtros.statusRelatorio ?? 'aprovado'}
              onChange={(value) => atualizarFiltro('statusRelatorio', value)}
            >
              <option value="aprovado">Somente aprovados</option>
              <option value="todos">Todos os status</option>
              {(opcoes?.statusRelatorio ?? [])
                .filter((status) => status !== 'aprovado')
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </SelectBase>
          </div>
        </div>
      </section>



      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Ações rápidas
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Acesse rapidamente as telas mais usadas para conferência, upload e acompanhamento da automação.
            </p>
          </div>

          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            Filtro atual: {getFiltroDescricao(filtros)}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            to="/relatorios-pdf"
            className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-indigo-500/40 dark:hover:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Relatórios PDF
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Enviar PDF, consultar status, abrir detalhes e acessar o arquivo original.
                </p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-300">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
              Abrir relatórios
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          <Link
            to={montarUrlLeiturasDashboard()}
            className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-indigo-500/40 dark:hover:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Leituras filtradas
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Ver leituras mensais respeitando mês, ano, classificação e status do Dashboard.
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-500/10 dark:text-emerald-300">
                <Printer className="h-5 w-5" />
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
              Consultar leituras
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          <Link
            to="/fila-processamento"
            className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-indigo-500/40 dark:hover:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Fila n8n/IA
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Acompanhar processamento automático, reprocessar PDFs e consultar erros.
                </p>
              </div>
              <div className="rounded-lg bg-sky-50 p-2 text-sky-600 transition group-hover:bg-sky-600 group-hover:text-white dark:bg-sky-500/10 dark:text-sky-300">
                <Loader2 className="h-5 w-5" />
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-300">
              Abrir fila
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          <Link
            to="/leituras"
            className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-indigo-500/40 dark:hover:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Consulta geral
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Abrir a tela de leituras sem filtros para auditoria ampla e exportação CSV.
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600 transition group-hover:bg-amber-600 group-hover:text-white dark:bg-amber-500/10 dark:text-amber-300">
                <BarChart2 className="h-5 w-5" />
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
              Ver consulta geral
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </section>

      {isError && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-300">
          <XCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold">Não foi possível carregar os dados do Supabase.</p>
            <p className="mt-0.5 text-xs opacity-80">
              {error instanceof Error ? error.message : 'Erro desconhecido.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Total Impresso
              </span>
              <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-500/10">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-bold sm:text-2xl text-slate-900 dark:text-slate-100">
                {formatNumber(resumo?.totalPaginas)}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  P/B: {formatNumber(resumo?.paginasPb)} · Cor:{' '}
                  {formatNumber(resumo?.paginasColoridas)}
                </span>
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Equipamentos c/ Leitura
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-500/10">
                <Printer className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-bold sm:text-2xl text-slate-900 dark:text-slate-100">
                {formatNumber(resumo?.totalEquipamentos)}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <FileText size={12} />
                <span>{formatNumber(resumo?.totalRelatoriosAprovados)} relatório(s)</span>
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Valor Líquido / NF
              </span>
              <div className="rounded-lg bg-sky-50 p-2 dark:bg-sky-500/10">
                <FileCheck2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-bold sm:text-2xl text-slate-900 dark:text-slate-100">
                {formatCurrency(resumo?.valorLiquido)}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <DollarSign size={12} />
                <span>
                  Bruto: {formatCurrency(resumo?.valorBruto)} · Retenção:{' '}
                  {formatCurrency(resumo?.valorRetencao)}
                </span>
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Papel A4 Estimado
              </span>
              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-500/10">
                <Scroll className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-bold sm:text-2xl text-slate-900 dark:text-slate-100">
                {formatDecimal(resumo?.resmasEstimadas, 0)} Resmas
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                <Layers size={12} />
                <span>≈ {formatDecimal(resumo?.caixasEstimadas, 1)} caixas estimadas</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Conferência financeira do filtro atual
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Compara o valor bruto do PDF, retenções, valor líquido/NF e total recalculado pelo sistema.
            </p>
          </div>

          {!isLoading && (
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                possuiDiferencaFinanceira
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              }`}
            >
              {possuiDiferencaFinanceira ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <FileCheck2 className="h-3.5 w-3.5" />
              )}
              {possuiDiferencaFinanceira
                ? 'Atenção: diferença financeira encontrada'
                : 'Valores conferidos no filtro atual'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Valor bruto PDF
                </p>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(resumo?.valorBruto)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Soma do valor bruto dos relatórios no filtro.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Retenção
                </p>
                <p className="mt-2 text-xl font-bold text-amber-600 dark:text-amber-300">
                  {formatCurrency(resumo?.valorRetencao)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {formatDecimal(resumo?.percentualRetencao, 2)}% sobre o bruto.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Valor líquido / NF
                </p>
                <p className="mt-2 text-xl font-bold text-sky-600 dark:text-sky-300">
                  {formatCurrency(resumo?.valorLiquido)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Bruto - retenção estimado: {formatCurrency(valorLiquidoEstimado)}.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Calculado pelo sistema
                </p>
                <p className="mt-2 text-xl font-bold text-indigo-600 dark:text-indigo-300">
                  {formatCurrency(resumo?.valorCalculado)}
                </p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    possuiDiferencaFinanceira
                      ? 'text-amber-600 dark:text-amber-300'
                      : 'text-emerald-600 dark:text-emerald-300'
                  }`}
                >
                  Diferença: {formatCurrency(diferencaFinanceira)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,1fr)]">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Comparativo financeiro
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Visualize a relação entre valor bruto, retenção, líquido/NF e valor recalculado pelo sistema.
                  </p>
                </div>

                <div className="h-64 w-full sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={financeiroComparativoChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-slate-200 dark:stroke-slate-800"
                      />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#94a3b8"
                        tickFormatter={(value) => formatCurrency(Number(value)).replace('R$', '')}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          borderColor: '#1e293b',
                          borderRadius: '8px',
                          color: '#f8fafc',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="bruto" name="Bruto PDF" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="liquido" name="Líquido/NF" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="retencao" name="Retenção" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="calculado" name="Calculado" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Leitura rápida
                </h4>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400">Bruto x calculado</span>
                    <span
                      className={`font-bold ${
                        possuiDiferencaFinanceira
                          ? 'text-amber-600 dark:text-amber-300'
                          : 'text-emerald-600 dark:text-emerald-300'
                      }`}
                    >
                      {formatCurrency(diferencaFinanceira)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400">Retenção sobre bruto</span>
                    <span className="font-bold text-amber-600 dark:text-amber-300">
                      {formatDecimal(resumo?.percentualRetencao, 2)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400">Líquido informado</span>
                    <span className="font-bold text-sky-600 dark:text-sky-300">
                      {formatCurrency(resumo?.valorLiquido)}
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    O gráfico ajuda a conferir rapidamente se o bruto do PDF está batendo com o valor recalculado pelo sistema e como a retenção reduz o valor líquido/NF.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <strong className="text-slate-700 dark:text-slate-200">Regra de leitura:</strong>{' '}
              o valor bruto do PDF deve bater com o valor recalculado pelo sistema. O valor líquido/NF é o valor após retenção e deve ser tratado separadamente na conferência da AF.
            </div>
          </>
        )}
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,2fr)_minmax(420px,1fr)]">
        <div className="min-w-0 space-y-5 xl:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Tendência real de Impressão e Custos
              </h4>
              <p className="text-xs text-slate-400">
                Evolução mensal baseada em relatórios PDF conforme filtros de ano, classificação e status.
              </p>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center sm:h-72">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : tendenciaMensal.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                <BarChart2 size={28} />
                <span className="text-sm">Sem dados mensais para exibir.</span>
              </div>
            ) : (
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={tendenciaMensal}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-slate-200 dark:stroke-slate-800"
                    />
                    <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis yAxisId="paginas" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis
                      yAxisId="valor"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const valorNumerico = Number(value ?? 0)
                        const nomeSerie = String(name ?? '')

                        if (nomeSerie === 'Valor líquido / NF') {
                          return [formatCurrency(valorNumerico), nomeSerie]
                        }

                        return [formatNumber(valorNumerico), nomeSerie]
                      }}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderColor: '#1e293b',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="paginas"
                      type="monotone"
                      dataKey="totalPaginas"
                      name="Páginas Impressas"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPages)"
                    />
                    <Area
                      yAxisId="valor"
                      type="monotone"
                      dataKey="valorLiquido"
                      name="Valor líquido / NF"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCost)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Páginas por Secretaria
              </h4>
              <p className="text-xs text-slate-400">
                Volume real de páginas impressas por secretaria no filtro aplicado.
              </p>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center sm:h-72">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : secretariasChartData.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                <BarChart2 size={28} />
                <span className="text-sm">Sem dados de secretarias para o período.</span>
              </div>
            ) : (
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={secretariasChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-slate-200 dark:stroke-slate-800"
                    />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderColor: '#1e293b',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="impresso"
                      name="Páginas Impressas"
                      fill="#4f46e5"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="mb-4 flex flex-col gap-1 border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Ranking de Secretarias por Custo
              </h4>
              <p className="text-xs text-slate-400">
                Top 10 secretarias/sites por valor calculado no filtro atual.
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : rankingSecretarias.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-400 dark:text-slate-500">
                <BarChart2 size={24} />
                <span className="text-center text-sm">
                  Nenhuma secretaria encontrada para o filtro atual.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {rankingSecretarias.map((secretaria, index) => (
                  <div
                    key={`${secretaria.secretaria}-${index}`}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                          {index + 1}. {secretaria.secretaria}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {formatNumber(secretaria.totalPaginas)} páginas · {formatDecimal(secretaria.resmasEstimadas, 1)} resmas
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(secretaria.valorTotal)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatDecimal(secretaria.participacaoValorPercentual, 1)}% do custo
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${Math.min(secretaria.participacaoValorPercentual, 100)}%`,
                        }}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-1 text-[11px] text-slate-500 dark:text-slate-400 sm:grid-cols-3 sm:gap-2">
                      <span>P/B: {formatNumber(secretaria.paginasPb)}</span>
                      <span>Cor: {formatNumber(secretaria.paginasColoridas)}</span>
                      <span className="sm:text-right">{formatDecimal(secretaria.participacaoPaginasPercentual, 1)}% páginas</span>
                    </div>

                    <Link
                      to={montarUrlLeiturasDashboard({ secretaria: secretaria.secretaria })}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                    >
                      Ver leituras desta secretaria
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-none min-w-0 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Ranking de Equipamentos
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Top 10 séries por volume de páginas no filtro atual.
                </p>
              </div>
              <Printer className="h-5 w-5 text-indigo-500" />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : rankingEquipamentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-400 dark:text-slate-500">
                <Printer size={22} />
                <span className="text-center text-sm">
                  Nenhum equipamento encontrado para o filtro atual.
                </span>
              </div>
            ) : (
              <div className="max-h-[min(70vh,760px)] space-y-3 overflow-y-auto pr-1">
                {rankingEquipamentos.map((equipamento, index) => (
                  <div
                    key={`${equipamento.serie}-${equipamento.modelo}-${index}`}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                          {index + 1}. {equipamento.modelo}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          Série {equipamento.serie}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                          {equipamento.secretaria}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {formatNumber(equipamento.totalPaginas)}
                        </p>
                        <p className="text-[11px] text-slate-400">páginas</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-1 text-[11px] text-slate-500 dark:text-slate-400 sm:grid-cols-3 sm:gap-2">
                      <span>P/B: {formatNumber(equipamento.paginasPb)}</span>
                      <span>Cor: {formatNumber(equipamento.paginasColoridas)}</span>
                      <span className="sm:text-right">{formatCurrency(equipamento.valorCalculado)}</span>
                    </div>

                    <Link
                      to={montarUrlLeiturasDashboard({
                        busca: equipamento.serie,
                        modelo: equipamento.modelo,
                        secretaria: equipamento.secretaria,
                      })}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                    >
                      Ver leituras deste equipamento
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    {equipamento.divergente && (
                      <div className="mt-2 rounded-md bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        Atenção: possui divergência no filtro atual.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Alertas Recentes
              </h4>
              {alertas.length > 0 && (
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                  {alertas.length} Notificações
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : alertas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-400 dark:text-slate-500">
                <AlertTriangle size={22} />
                <span className="text-center text-sm">
                  Nenhum alerta encontrado para o filtro atual.
                </span>
              </div>
            ) : (
              <div className="max-h-[min(62vh,640px)] space-y-3.5 overflow-y-auto pr-1">
                {alertas.map((alerta, idx) => {
                  const styles = alertStyles(alerta.nivel)
                  return (
                    <div
                      key={`${alerta.titulo}-${idx}`}
                      className={`flex gap-3 rounded-lg border p-3 text-sm ${styles.wrapper}`}
                    >
                      <AlertTriangle
                        size={18}
                        className={`mt-0.5 shrink-0 ${styles.icon}`}
                      />
                      <div className="space-y-1">
                        <p className="font-semibold leading-tight">{alerta.titulo}</p>
                        <p className="leading-relaxed opacity-90">{alerta.descricao}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-indigo-900 p-6 text-white shadow-lg shadow-indigo-900/20">
            <h4 className="text-lg font-bold">PrintControl NAS</h4>
            <p className="mt-2 text-xs leading-relaxed text-indigo-200">
              Sistema integrado para controle completo do parque de impressões municipais, gerenciando
              contratos de locação, consumos setoriais e controle de papel A4.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {resumo && (
                <div className="flex justify-between border-b border-indigo-800 pb-2 text-xs">
                  <span className="text-indigo-200">Contrato ativo:</span>
                  <span className="font-semibold">{resumo.contratoNumero}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-indigo-800 pb-2 text-xs">
                <span className="text-indigo-200">Período:</span>
                <span className="font-semibold">{resumo?.periodoLabel ?? 'Não informado'}</span>
              </div>
              <div className="flex justify-between pt-1 text-xs">
                <span className="text-indigo-200">Versão da Plataforma:</span>
                <span className="font-semibold">v1.3.1 (Etapa 80)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
