import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react'

import { useRelatorioDetalhe } from '../hooks/useRelatorioDetalhe'
import type { RelatorioDetalheLeitura } from '../types/relatorioDetalhe'
import { formatCurrency, formatNumber } from '../utils/formatters'

function formatarMesReferencia(value: string) {
  if (!value) return 'Não informado'

  const [ano, mes] = value.split('-')

  if (!ano || !mes) return value

  return `${mes}/${ano}`
}

function formatarDataHora(value: string) {
  if (!value) return 'Não informado'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function normalizarTexto(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    aguardando_processamento: 'Aguardando processamento',
    pendente_processamento: 'Pendente processamento',
    em_processamento: 'Em processamento',
    extraido: 'Extraído',
    normalizado: 'Normalizado',
    validado: 'Validado',
    importado: 'Importado',
    pendente_conferencia: 'Pendente conferência',
    aprovado: 'Aprovado',
    rejeitado: 'Rejeitado',
    erro: 'Erro',
  }

  return labels[status] ?? status
}

function getStatusClasses(status: string) {
  if (status === 'aprovado') {
    return 'border-emerald-800 bg-emerald-950/50 text-emerald-300'
  }

  if (status === 'erro' || status === 'rejeitado') {
    return 'border-red-800 bg-red-950/50 text-red-300'
  }

  if (status === 'pendente_conferencia') {
    return 'border-amber-800 bg-amber-950/50 text-amber-300'
  }

  return 'border-blue-800 bg-blue-950/50 text-blue-300'
}

function getStatusIcon(status: string) {
  if (status === 'aprovado') {
    return <CheckCircle2 className="h-4 w-4" />
  }

  if (status === 'erro' || status === 'rejeitado') {
    return <XCircle className="h-4 w-4" />
  }

  if (status === 'pendente_conferencia') {
    return <AlertTriangle className="h-4 w-4" />
  }

  return <Clock3 className="h-4 w-4" />
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
        status,
      )}`}
    >
      {getStatusIcon(status)}
      {getStatusLabel(status)}
    </span>
  )
}

function ResumoCard({
  titulo,
  valor,
  descricao,
}: {
  titulo: string
  valor: string
  descricao: string
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-400">{titulo}</p>
      <p className="mt-3 text-2xl font-bold text-white">{valor}</p>
      <p className="mt-1 text-xs text-slate-400">{descricao}</p>
    </div>
  )
}

export default function RelatorioDetalhe() {
  const navigate = useNavigate()
  const { id } = useParams()

  const { data, isLoading, isError, error, refetch, isFetching } =
    useRelatorioDetalhe(id)

  const [busca, setBusca] = useState('')
  const [somenteDivergentes, setSomenteDivergentes] = useState(false)

  const leiturasFiltradas = useMemo(() => {
    const textoBusca = normalizarTexto(busca.trim())

    return (
      data?.leituras.filter((leitura: RelatorioDetalheLeitura) => {
        const textoLeitura = normalizarTexto(
          [
            leitura.modelo ?? '',
            leitura.serie ?? '',
            leitura.site ?? '',
            leitura.departamento ?? '',
          ].join(' '),
        )

        const bateBusca = !textoBusca || textoLeitura.includes(textoBusca)
        const bateDivergente = !somenteDivergentes || leitura.divergente

        return bateBusca && bateDivergente
      }) ?? []
    )
  }, [busca, data?.leituras, somenteDivergentes])

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm text-slate-200">
          <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
          Carregando conferência do relatório...
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-6 text-red-200">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5" />

          <div>
            <h2 className="text-lg font-semibold">
              Não foi possível carregar o relatório.
            </h2>

            <p className="mt-1 text-sm text-red-300">
              {error instanceof Error ? error.message : 'Erro desconhecido.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/relatorios-pdf')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>

              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-xl border border-red-800 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-950"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/relatorios-pdf')}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para relatórios
          </button>

          <p className="text-sm font-medium text-violet-300">
            Conferência do relatório PDF
          </p>

          <h1 className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-bold text-white">
            {data.relatorio.nomeArquivo}
            <StatusBadge status={data.relatorio.status} />
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Visualização detalhada das leituras importadas do PDF. Nesta etapa a
            tela é somente de conferência visual.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Valor líquido/NF"
          valor={formatCurrency(data.relatorio.valorLiquido)}
          descricao={`Bruto: ${formatCurrency(
            data.relatorio.valorBruto,
          )} · Retenção: ${formatCurrency(data.relatorio.retencao)}`}
        />

        <ResumoCard
          titulo="Total de páginas"
          valor={formatNumber(data.resumo.totalPaginas)}
          descricao={`P/B: ${formatNumber(
            data.resumo.paginasPb,
          )} · Cor: ${formatNumber(data.resumo.paginasColoridas)}`}
        />

        <ResumoCard
          titulo="Leituras/equipamentos"
          valor={formatNumber(data.resumo.totalLeituras)}
          descricao={`Mês referência: ${formatarMesReferencia(
            data.relatorio.mesReferencia,
          )}`}
        />

        <ResumoCard
          titulo="Divergências"
          valor={formatNumber(data.resumo.totalDivergencias)}
          descricao={
            data.resumo.totalDivergencias > 0
              ? 'Existem pontos para revisar'
              : 'Nenhuma divergência identificada'
          }
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <FileText className="h-5 w-5 text-violet-300" />
            Cabeçalho do PDF
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Classificação AF
              </p>
              <p className="mt-1 font-semibold text-slate-100">
                {data.relatorio.classificacaoAf ?? 'Não informado'}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Mês referência
              </p>
              <p className="mt-1 font-semibold text-slate-100">
                {formatarMesReferencia(data.relatorio.mesReferencia)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Importado em
              </p>
              <p className="mt-1 font-semibold text-slate-100">
                {formatarDataHora(data.relatorio.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                ID do relatório
              </p>
              <p className="mt-1 break-all font-mono text-xs text-slate-300">
                {data.relatorio.id}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-base font-semibold text-white">
            Conferência financeira
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Soma dos itens PDF</span>
              <span className="font-semibold text-slate-100">
                {formatCurrency(data.resumo.valorItensPdf)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Valor calculado itens</span>
              <span className="font-semibold text-slate-100">
                {formatCurrency(data.resumo.valorItensCalculado)}
              </span>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Valor bruto cabeçalho</span>
                <span className="font-semibold text-slate-100">
                  {formatCurrency(data.relatorio.valorBruto)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {data.divergencias.length > 0 && (
        <section className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-amber-200">
            <AlertTriangle className="h-5 w-5" />
            Divergências registradas
          </h2>

          <div className="mt-4 space-y-3">
            {data.divergencias.map((divergencia) => (
              <div
                key={divergencia.id}
                className="rounded-xl border border-amber-900/60 bg-slate-950/50 p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-amber-100">
                    {divergencia.tipo}
                  </p>

                  <span className="rounded-full border border-amber-800 px-2.5 py-1 text-xs font-semibold text-amber-200">
                    {divergencia.resolvida ? 'Resolvida' : 'Pendente'}
                  </span>
                </div>

                <p className="mt-2 text-slate-300">{divergencia.descricao}</p>

                <p className="mt-2 text-xs text-slate-500">
                  PDF: {divergencia.valorPdf ?? 'N/I'} · Calculado:{' '}
                  {divergencia.valorCalculado ?? 'N/I'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />

            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por modelo, série, secretaria/site ou departamento..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-500"
            />
          </div>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={somenteDivergentes}
              onChange={(event) => setSomenteDivergentes(event.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900"
            />
            Somente divergentes
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-sm">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-base font-semibold text-white">
            Leituras importadas
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Cada linha representa uma série/equipamento extraído do relatório PDF.
          </p>
        </div>

        {leiturasFiltradas.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center">
            <FileText className="h-10 w-10 text-slate-600" />

            <h3 className="mt-4 text-base font-semibold text-slate-200">
              Nenhuma leitura encontrada
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Ajuste os filtros ou verifique se o relatório possui leituras importadas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1380px] w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Equipamento</th>
                  <th className="px-5 py-3">Local</th>
                  <th className="px-5 py-3 text-right">Ant. P/B</th>
                  <th className="px-5 py-3 text-right">Atu. P/B</th>
                  <th className="px-5 py-3 text-right">Saldo P/B</th>
                  <th className="px-5 py-3 text-right">Ant. Cor</th>
                  <th className="px-5 py-3 text-right">Atu. Cor</th>
                  <th className="px-5 py-3 text-right">Saldo Cor</th>
                  <th className="px-5 py-3 text-right">Total páginas</th>
                  <th className="px-5 py-3 text-right">Total PDF</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {leiturasFiltradas.map((leitura) => (
                  <tr
                    key={leitura.id}
                    className={
                      leitura.divergente
                        ? 'bg-amber-950/10 hover:bg-amber-950/20'
                        : 'hover:bg-slate-800/40'
                    }
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-100">
                        {leitura.modelo ?? 'Modelo não informado'}
                      </p>

                      <p className="mt-1 font-mono text-xs text-slate-500">
                        Série: {leitura.serie ?? 'Não informada'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-200">
                        {leitura.site ?? 'Site não informado'}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {leitura.departamento ?? 'Departamento não informado'}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right text-slate-300">
                      {formatNumber(leitura.antPb)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-300">
                      {formatNumber(leitura.atuPb)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-100">
                      {formatNumber(leitura.saldoPb)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-300">
                      {formatNumber(leitura.antCor)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-300">
                      {formatNumber(leitura.atuCor)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-100">
                      {formatNumber(leitura.saldoCor)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-white">
                      {formatNumber(leitura.saldoPb + leitura.saldoCor)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-emerald-300">
                      {formatCurrency(leitura.totalGeralPdf)}
                    </td>

                    <td className="px-5 py-4">
                      {leitura.divergente ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-800 bg-amber-950/50 px-2.5 py-1 text-xs font-semibold text-amber-300">
                          <AlertTriangle className="h-4 w-4" />
                          Divergente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-800 bg-emerald-950/50 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                          Conferido
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
