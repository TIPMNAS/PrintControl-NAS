import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Upload,
  XCircle,
} from 'lucide-react'

import { useRelatoriosPdf } from '../hooks/useRelatoriosPdf'
import {
  enviarRelatorioPdfParaProcessamento,
  type UploadRelatorioPdfProgresso,
  type UploadRelatorioPdfResultado,
} from '../services/uploadRelatorioPdfService'
import type { RelatorioPdfItem } from '../types/relatoriosPdf'
import { formatCurrency, formatNumber } from '../utils/formatters'

function getMesAtualInput() {
  return new Date().toISOString().slice(0, 7)
}

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

  if (
    status === 'aguardando_processamento' ||
    status === 'pendente_processamento' ||
    status === 'em_processamento'
  ) {
    return 'border-blue-800 bg-blue-950/50 text-blue-300'
  }

  return 'border-violet-800 bg-violet-950/50 text-violet-300'
}

function getStatusIcon(status: string) {
  if (status === 'aprovado') {
    return <CheckCircle2 className="h-4 w-4" />
  }

  if (status === 'erro' || status === 'rejeitado') {
    return <XCircle className="h-4 w-4" />
  }

  if (status === 'pendente_conferencia') {
    return <AlertCircle className="h-4 w-4" />
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

function getMensagemUploadClasses(tipo: 'sucesso' | 'erro' | 'aviso') {
  if (tipo === 'erro') {
    return 'border-red-900/70 bg-red-950/30 text-red-200'
  }

  if (tipo === 'aviso') {
    return 'border-amber-900/70 bg-amber-950/30 text-amber-100'
  }

  return 'border-emerald-900/70 bg-emerald-950/30 text-emerald-100'
}

function getMensagemUploadIcon(tipo: 'sucesso' | 'erro' | 'aviso') {
  if (tipo === 'erro') {
    return <XCircle className="h-5 w-5 shrink-0" />
  }

  if (tipo === 'aviso') {
    return <AlertCircle className="h-5 w-5 shrink-0" />
  }

  return <CheckCircle2 className="h-5 w-5 shrink-0" />
}

const CLASSIFICACOES_AF = [
  { value: 'ADMINISTRACAO', label: 'ADMINISTRAÇÃO' },
  { value: 'ASSISTENCIA SOCIAL', label: 'ASSISTÊNCIA SOCIAL' },
  { value: 'SAUDE', label: 'SAÚDE' },
]

export default function RelatoriosPdf() {
  const navigate = useNavigate()
  const inputArquivoRef = useRef<HTMLInputElement | null>(null)

  const { data, isLoading, isError, error, refetch, isFetching } = useRelatoriosPdf()

  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [mesFiltro, setMesFiltro] = useState('todos')

  const [modalUploadAberto, setModalUploadAberto] = useState(false)
  const [arquivoUpload, setArquivoUpload] = useState<File | null>(null)
  const [mesUpload, setMesUpload] = useState(getMesAtualInput())
  const [classificacaoUpload, setClassificacaoUpload] = useState('')
  const [observacoesUpload, setObservacoesUpload] = useState('')
  const [uploadEmAndamento, setUploadEmAndamento] = useState(false)
  const [progressoUpload, setProgressoUpload] = useState<UploadRelatorioPdfProgresso | null>(null)
  const [ultimoResultadoUpload, setUltimoResultadoUpload] = useState<UploadRelatorioPdfResultado | null>(null)
  const [mensagemUpload, setMensagemUpload] = useState<{
    tipo: 'sucesso' | 'erro' | 'aviso'
    texto: string
  } | null>(null)

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<string>()

    data?.relatorios.forEach((relatorio) => {
      if (relatorio.mesReferencia) {
        meses.add(relatorio.mesReferencia.slice(0, 7))
      }
    })

    return Array.from(meses).sort().reverse()
  }, [data?.relatorios])

  const relatoriosFiltrados = useMemo(() => {
    const textoBusca = normalizarTexto(busca.trim())

    return (
      data?.relatorios.filter((relatorio: RelatorioPdfItem) => {
        const mesRelatorio = relatorio.mesReferencia.slice(0, 7)

        const bateStatus =
          statusFiltro === 'todos' || relatorio.status === statusFiltro

        const bateMes = mesFiltro === 'todos' || mesRelatorio === mesFiltro

        const textoRelatorio = normalizarTexto(
          [
            relatorio.nomeArquivo,
            relatorio.classificacaoAf ?? '',
            relatorio.status,
            relatorio.mesReferencia,
          ].join(' '),
        )

        const bateBusca = !textoBusca || textoRelatorio.includes(textoBusca)

        return bateStatus && bateMes && bateBusca
      }) ?? []
    )
  }, [busca, data?.relatorios, mesFiltro, statusFiltro])

  const resumoFiltro = useMemo(() => {
    return relatoriosFiltrados.reduce(
      (acc, relatorio) => {
        acc.totalRelatorios += 1
        acc.totalLeituras += relatorio.totalLeituras
        acc.paginasPb += relatorio.paginasPb
        acc.paginasColoridas += relatorio.paginasColoridas
        acc.totalPaginas += relatorio.totalPaginas
        acc.valorLiquido += relatorio.valorLiquido

        if (relatorio.status === 'aprovado') {
          acc.aprovados += 1
        }

        if (relatorio.status === 'pendente_conferencia') {
          acc.pendentesConferencia += 1
        }

        return acc
      },
      {
        totalRelatorios: 0,
        aprovados: 0,
        pendentesConferencia: 0,
        totalLeituras: 0,
        paginasPb: 0,
        paginasColoridas: 0,
        totalPaginas: 0,
        valorLiquido: 0,
      },
    )
  }, [relatoriosFiltrados])

  function limparCampoArquivo() {
    setArquivoUpload(null)

    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = ''
    }
  }

  function abrirModalUpload() {
    setModalUploadAberto(true)
    prepararNovoUpload()
  }

  function fecharModalUpload() {
    if (uploadEmAndamento) return

    setModalUploadAberto(false)
  }

  function irParaFilaProcessamento() {
    setModalUploadAberto(false)
    navigate('/fila-processamento')
  }

  function prepararNovoUpload() {
    limparCampoArquivo()
    setMesUpload(getMesAtualInput())
    setClassificacaoUpload('')
    setObservacoesUpload('')
    setMensagemUpload(null)
    setProgressoUpload(null)
    setUltimoResultadoUpload(null)
  }

  async function executarUploadPdf() {
    if (!arquivoUpload) {
      setMensagemUpload({
        tipo: 'erro',
        texto: 'Selecione um arquivo PDF antes de enviar.',
      })
      return
    }

    if (!classificacaoUpload) {
      setMensagemUpload({
        tipo: 'erro',
        texto: 'Selecione a classificação da AF antes de enviar.',
      })
      return
    }

    try {
      setUploadEmAndamento(true)
      setMensagemUpload(null)
      setUltimoResultadoUpload(null)

      const resultado = await enviarRelatorioPdfParaProcessamento({
        arquivo: arquivoUpload,
        mesReferencia: mesUpload,
        classificacaoAf: classificacaoUpload,
        observacoes: observacoesUpload,
        onProgresso: setProgressoUpload,
      })

      setUltimoResultadoUpload(resultado)
      limparCampoArquivo()

      setMensagemUpload({
        tipo: resultado.duplicado ? 'aviso' : 'sucesso',
        texto: resultado.mensagem ?? 'PDF registrado na fila com sucesso.',
      })

      await refetch()
    } catch (uploadError) {
      setMensagemUpload({
        tipo: 'erro',
        texto:
          uploadError instanceof Error
            ? uploadError.message
            : 'Erro desconhecido ao enviar o PDF.',
      })
    } finally {
      setUploadEmAndamento(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm text-slate-200">
          <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
          Carregando relatórios PDF...
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
            <h2 className="text-lg font-semibold">Não foi possível carregar os relatórios PDF.</h2>
            <p className="mt-1 text-sm text-red-300">
              {error instanceof Error ? error.message : 'Erro desconhecido.'}
            </p>

            <button
              type="button"
              onClick={() => refetch()}
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

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-violet-300">Relatórios PDF</p>

          <h1 className="mt-1 text-2xl font-bold text-white">
            Relatórios importados
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Listagem dos relatórios mensais vinculados ao contrato{' '}
            <span className="font-semibold text-slate-200">
              {data?.contrato.numeroContrato}
            </span>{' '}
            — {data?.contrato.fornecedor}.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={abrirModalUpload}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
          >
            <Upload className="h-4 w-4" />
            Enviar PDF
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Relatórios encontrados"
          valor={formatNumber(resumoFiltro.totalRelatorios)}
          descricao={`${formatNumber(resumoFiltro.aprovados)} aprovado(s)`}
        />

        <ResumoCard
          titulo="Equipamentos / leituras"
          valor={formatNumber(resumoFiltro.totalLeituras)}
          descricao={`${formatNumber(resumoFiltro.totalPaginas)} páginas no filtro`}
        />

        <ResumoCard
          titulo="Valor líquido / NF"
          valor={formatCurrency(resumoFiltro.valorLiquido)}
          descricao={`P/B: ${formatNumber(resumoFiltro.paginasPb)} · Cor: ${formatNumber(
            resumoFiltro.paginasColoridas,
          )}`}
        />

        <ResumoCard
          titulo="Pendentes conferência"
          valor={formatNumber(resumoFiltro.pendentesConferencia)}
          descricao="Relatórios aguardando validação manual"
        />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por arquivo, classificação ou status..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-500"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <select
              value={statusFiltro}
              onChange={(event) => setStatusFiltro(event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:border-violet-500"
            >
              <option value="todos">Todos os status</option>
              <option value="aprovado">Aprovado</option>
              <option value="pendente_conferencia">Pendente conferência</option>
              <option value="pendente_processamento">Pendente processamento</option>
              <option value="importado">Importado</option>
              <option value="erro">Erro</option>
              <option value="rejeitado">Rejeitado</option>
            </select>
          </div>

          <select
            value={mesFiltro}
            onChange={(event) => setMesFiltro(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-violet-500"
          >
            <option value="todos">Todos os meses</option>
            {mesesDisponiveis.map((mes) => (
              <option key={mes} value={mes}>
                {formatarMesReferencia(`${mes}-01`)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-sm">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-base font-semibold text-white">
            Lista de relatórios PDF
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Clique em Abrir para visualizar a conferência detalhada do relatório.
          </p>
        </div>

        {relatoriosFiltrados.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center">
            <FileText className="h-10 w-10 text-slate-600" />
            <h3 className="mt-4 text-base font-semibold text-slate-200">
              Nenhum relatório encontrado
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Ajuste os filtros ou aguarde a importação de novos PDFs pelo n8n/IA.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1280px] w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Arquivo</th>
                  <th className="px-5 py-3">Mês</th>
                  <th className="px-5 py-3">Classificação</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Leituras</th>
                  <th className="px-5 py-3 text-right">P/B</th>
                  <th className="px-5 py-3 text-right">Cor</th>
                  <th className="px-5 py-3 text-right">Total páginas</th>
                  <th className="px-5 py-3 text-right">Valor líquido</th>
                  <th className="px-5 py-3">Importado em</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {relatoriosFiltrados.map((relatorio) => (
                  <tr
                    key={relatorio.id}
                    onClick={() => navigate(`/relatorios-pdf/${relatorio.id}`)}
                    className="cursor-pointer hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-xl bg-violet-950/60 p-2 text-violet-300">
                          <FileText className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-100">
                            {relatorio.nomeArquivo}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            ID: {relatorio.id.slice(0, 8)}
                          </p>

                          {relatorio.possuiDivergencia && (
                            <p className="mt-1 text-xs font-semibold text-amber-300">
                              Possui divergência em leitura
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {formatarMesReferencia(relatorio.mesReferencia)}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {relatorio.classificacaoAf ?? 'Não informado'}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={relatorio.status} />
                    </td>

                    <td className="px-5 py-4 text-right text-slate-300">
                      {formatNumber(relatorio.totalLeituras)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-300">
                      {formatNumber(relatorio.paginasPb)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-300">
                      {formatNumber(relatorio.paginasColoridas)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-100">
                      {formatNumber(relatorio.totalPaginas)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-emerald-300">
                      {formatCurrency(relatorio.valorLiquido)}
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {formatarDataHora(relatorio.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(`/relatorios-pdf/${relatorio.id}`)
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                      >
                        <Eye className="h-4 w-4" />
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalUploadAberto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-violet-300">Upload manual</p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  Enviar PDF para processamento
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  O arquivo será enviado ao Supabase Storage e registrado na fila n8n/IA para processamento automático.
                </p>
              </div>

              <button
                type="button"
                disabled={uploadEmAndamento}
                onClick={fecharModalUpload}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {mensagemUpload ? (
                <div
                  className={`rounded-2xl border px-4 py-4 text-sm ${getMensagemUploadClasses(
                    mensagemUpload.tipo,
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    {getMensagemUploadIcon(mensagemUpload.tipo)}
                    <div className="flex-1">
                      <p className="font-semibold">
                        {mensagemUpload.tipo === 'erro'
                          ? 'Não foi possível enviar'
                          : mensagemUpload.tipo === 'aviso'
                            ? 'PDF duplicado detectado'
                            : 'PDF registrado com sucesso'}
                      </p>
                      <p className="mt-1 leading-6">{mensagemUpload.texto}</p>

                      {ultimoResultadoUpload ? (
                        <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                          <span>Fila: {ultimoResultadoUpload.fila_id?.slice(0, 8) ?? 'não informado'}</span>
                          <span>Status: {ultimoResultadoUpload.status_processamento ?? 'não informado'}</span>
                          <span>Mês: {ultimoResultadoUpload.mes_referencia ?? 'não informado'}</span>
                          <span>Classificação: {ultimoResultadoUpload.classificacao_af ?? 'não informado'}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {progressoUpload ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {uploadEmAndamento ? (
                        <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
                      ) : mensagemUpload?.tipo === 'aviso' ? (
                        <AlertCircle className="h-5 w-5 text-amber-300" />
                      ) : progressoUpload.percentual >= 100 ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                      ) : (
                        <Clock3 className="h-5 w-5 text-slate-400" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{progressoUpload.titulo}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{progressoUpload.descricao}</p>
                      </div>
                    </div>

                    <span className="text-sm font-semibold text-slate-300">
                      {progressoUpload.percentual}%
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        mensagemUpload?.tipo === 'aviso'
                          ? 'bg-amber-500'
                          : mensagemUpload?.tipo === 'erro'
                            ? 'bg-red-500'
                            : 'bg-violet-500'
                      }`}
                      style={{ width: `${progressoUpload.percentual}%` }}
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Arquivo PDF
                </label>

                <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3 sm:flex-row sm:items-center">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500">
                    Escolher arquivo
                    <input
                      ref={inputArquivoRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      disabled={uploadEmAndamento}
                      onChange={(event) => {
                        setArquivoUpload(event.target.files?.[0] ?? null)
                        setMensagemUpload(null)
                        setUltimoResultadoUpload(null)
                        setProgressoUpload(null)
                      }}
                      className="hidden"
                    />
                  </label>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {arquivoUpload?.name ?? 'Nenhum arquivo escolhido'}
                    </p>
                    {arquivoUpload ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {(arquivoUpload.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Mês de referência
                  </label>
                  <input
                    type="month"
                    value={mesUpload}
                    disabled={uploadEmAndamento}
                    onChange={(event) => setMesUpload(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Classificação da AF
                  </label>
                  <select
                    value={classificacaoUpload}
                    disabled={uploadEmAndamento}
                    onChange={(event) => setClassificacaoUpload(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Selecione...</option>
                    {CLASSIFICACOES_AF.map((classificacao) => (
                      <option key={classificacao.value} value={classificacao.value}>
                        {classificacao.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Observações
                </label>
                <textarea
                  value={observacoesUpload}
                  disabled={uploadEmAndamento}
                  onChange={(event) => setObservacoesUpload(event.target.value)}
                  rows={4}
                  placeholder="Exemplo: Relatório mensal recebido da FG Copiadoras para processamento automático."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 px-6 py-5 sm:flex-row sm:justify-end">
              {ultimoResultadoUpload ? (
                <>
                  <button
                    type="button"
                    disabled={uploadEmAndamento}
                    onClick={prepararNovoUpload}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Enviar outro PDF
                  </button>

                  <button
                    type="button"
                    disabled={uploadEmAndamento}
                    onClick={irParaFilaProcessamento}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-800 bg-violet-950/50 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-violet-900/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Bot className="h-4 w-4" />
                    Ir para Fila n8n/IA
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={uploadEmAndamento}
                    onClick={fecharModalUpload}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    disabled={uploadEmAndamento || !arquivoUpload || !classificacaoUpload}
                    onClick={executarUploadPdf}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadEmAndamento ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadEmAndamento ? 'Enviando...' : 'Enviar para a fila'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
