import { useMemo, useRef, useState, type ReactNode, type UIEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Archive,
  Bot,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileDown,
  FileText,
  Filter,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Upload,
  Trash2,
  XCircle,
} from 'lucide-react'

import { useRelatoriosPdf } from '../hooks/useRelatoriosPdf'
import {
  enviarRelatorioPdfParaProcessamento,
  type UploadRelatorioPdfProgresso,
  type UploadRelatorioPdfResultado,
} from '../services/uploadRelatorioPdfService'
import {
  criarUrlTemporariaPdfOriginal,
  montarUrlDownloadPdf,
} from '../services/relatorioDetalheService'
import { cancelarPdfFila, excluirRelatorioPdfCompleto, reprocessarPdfFila } from '../services/relatorioAcoesService'
import { obterHistoricoRelatorioPdf } from '../services/relatorioHistoricoService'
import { listarRelatoriosPdfExcluidos } from '../services/relatoriosExcluidosService'
import type { RelatorioPdfExclusaoLog, RelatorioPdfHistoricoDetalhe, RelatorioPdfItem, RelatorioPdfItemAf } from '../types/relatoriosPdf'
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
    .trim()
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


function getMensagemAcaoClasses(tipo: 'sucesso' | 'erro' | 'aviso') {
  if (tipo === 'erro') {
    return 'border-red-900/70 bg-red-950/30 text-red-200'
  }

  if (tipo === 'aviso') {
    return 'border-amber-900/70 bg-amber-950/30 text-amber-100'
  }

  return 'border-emerald-900/70 bg-emerald-950/30 text-emerald-100'
}

function extrairMensagemRpc(resultado: Record<string, unknown>, fallback: string) {
  const mensagem = resultado.mensagem

  if (typeof mensagem === 'string' && mensagem.trim()) {
    return mensagem
  }

  return fallback
}

function resultadoRpcOk(resultado: Record<string, unknown>) {
  const ok = resultado.ok ?? resultado.sucesso

  if (typeof ok === 'boolean') {
    return ok
  }

  return true
}

function podeCancelarFila(relatorio: RelatorioPdfItem) {
  const statusFila = relatorio.filaStatus ?? relatorio.status

  return Boolean(
    relatorio.filaId &&
      !['cancelado', 'rejeitado'].includes(statusFila),
  )
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
  destaque = 'padrao',
}: {
  titulo: string
  valor: string
  descricao: string
  destaque?: 'padrao' | 'verde' | 'amarelo' | 'vermelho'
}) {
  const destaqueClasses = {
    padrao: 'border-slate-800 bg-slate-900/80 text-white',
    verde: 'border-emerald-900/70 bg-emerald-950/20 text-emerald-100',
    amarelo: 'border-amber-900/70 bg-amber-950/20 text-amber-100',
    vermelho: 'border-red-900/70 bg-red-950/20 text-red-100',
  }

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${destaqueClasses[destaque]}`}>
      <p className="text-sm font-medium text-slate-400">{titulo}</p>
      <p className="mt-3 text-2xl font-bold">{valor}</p>
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

function relatorioTemDivergencia(relatorio: RelatorioPdfItem) {
  return (
    relatorio.possuiDivergencia ||
    Math.abs((relatorio.valorCalculado ?? 0) - (relatorio.valorBruto ?? 0)) > 0.05
  )
}

function getConferenciaRelatorio(relatorio: RelatorioPdfItem) {
  const diferenca = (relatorio.valorCalculado ?? 0) - (relatorio.valorBruto ?? 0)
  const possuiDivergenciaValor = Math.abs(diferenca) > 0.05
  const possuiDivergenciaLeitura = Boolean(relatorio.possuiDivergencia)
  const possuiErroFila = Boolean(relatorio.filaErroMensagem) || relatorio.status === 'erro'
  const semLeituras = relatorio.totalLeituras === 0

  if (possuiErroFila) {
    return {
      label: 'Erro no processamento',
      descricao: relatorio.filaErroMensagem ?? 'Existe erro registrado no relatório ou na fila n8n/IA.',
      classes: 'border-red-800 bg-red-950/40 text-red-200',
      icon: <XCircle className="h-4 w-4" />,
    }
  }

  if (possuiDivergenciaLeitura && possuiDivergenciaValor) {
    return {
      label: 'Leitura e valor divergentes',
      descricao: `Diferença de ${formatCurrency(diferenca)} entre PDF e cálculo do sistema.`,
      classes: 'border-red-800 bg-red-950/40 text-red-200',
      icon: <AlertCircle className="h-4 w-4" />,
    }
  }

  if (possuiDivergenciaLeitura) {
    return {
      label: 'Divergência de leitura',
      descricao: 'Existe pelo menos uma leitura mensal marcada como divergente.',
      classes: 'border-amber-800 bg-amber-950/40 text-amber-200',
      icon: <AlertCircle className="h-4 w-4" />,
    }
  }

  if (possuiDivergenciaValor) {
    return {
      label: 'Divergência de valor',
      descricao: `Diferença de ${formatCurrency(diferenca)} entre PDF e cálculo do sistema.`,
      classes: 'border-amber-800 bg-amber-950/40 text-amber-200',
      icon: <AlertCircle className="h-4 w-4" />,
    }
  }

  if (semLeituras) {
    return {
      label: 'Sem leituras vinculadas',
      descricao: 'O relatório ainda não possui leituras importadas para conferência.',
      classes: 'border-slate-700 bg-slate-950 text-slate-300',
      icon: <Clock3 className="h-4 w-4" />,
    }
  }

  return {
    label: 'Conferido',
    descricao: 'Sem divergência de leitura ou diferença financeira relevante.',
    classes: 'border-emerald-800 bg-emerald-950/40 text-emerald-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  }
}

function getFilaStatusOperacional(relatorio: RelatorioPdfItem) {
  const statusFila = relatorio.filaStatus ?? relatorio.status

  if (!relatorio.filaId) {
    return {
      label: 'Sem fila vinculada',
      descricao: 'Este relatório não possui item de fila relacionado.',
      classes: 'border-slate-700 bg-slate-950 text-slate-300',
      icon: <Clock3 className="h-4 w-4" />,
    }
  }

  if (relatorio.filaErroMensagem || statusFila === 'erro' || statusFila === 'rejeitado') {
    return {
      label: getStatusLabel(statusFila),
      descricao: relatorio.filaErroMensagem ?? 'Existe erro ou rejeição registrada na fila.',
      classes: 'border-red-800 bg-red-950/40 text-red-200',
      icon: <XCircle className="h-4 w-4" />,
    }
  }

  if (
    ['aguardando_processamento', 'pendente_processamento', 'em_processamento'].includes(
      statusFila,
    )
  ) {
    return {
      label: getStatusLabel(statusFila),
      descricao: relatorio.filaEtapaAtual ?? 'PDF ainda aguardando ou em processamento.',
      classes: 'border-blue-800 bg-blue-950/40 text-blue-200',
      icon: <Clock3 className="h-4 w-4" />,
    }
  }

  if (['extraido', 'normalizado', 'validado'].includes(statusFila)) {
    return {
      label: getStatusLabel(statusFila),
      descricao: relatorio.filaEtapaAtual ?? 'PDF processado parcialmente pela automação.',
      classes: 'border-violet-800 bg-violet-950/40 text-violet-200',
      icon: <Bot className="h-4 w-4" />,
    }
  }

  return {
    label: getStatusLabel(statusFila),
    descricao: relatorio.filaEtapaAtual ?? 'Fluxo de importação concluído ou sincronizado.',
    classes: 'border-emerald-800 bg-emerald-950/40 text-emerald-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  }
}

function ConferenciaBadge({ relatorio }: { relatorio: RelatorioPdfItem }) {
  const conferencia = getConferenciaRelatorio(relatorio)

  return (
    <span
      title={conferencia.descricao}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${conferencia.classes}`}
    >
      {conferencia.icon}
      {conferencia.label}
    </span>
  )
}

function FilaStatusBadge({ relatorio }: { relatorio: RelatorioPdfItem }) {
  const fila = getFilaStatusOperacional(relatorio)

  return (
    <div className="space-y-1">
      <span
        title={fila.descricao}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${fila.classes}`}
      >
        {fila.icon}
        {fila.label}
      </span>

      {relatorio.filaEtapaAtual ? (
        <p className="max-w-[220px] truncate text-xs text-slate-500" title={relatorio.filaEtapaAtual}>
          {relatorio.filaEtapaAtual}
        </p>
      ) : null}
    </div>
  )
}

function getProntoAfRelatorio(relatorio: RelatorioPdfItem) {
  const diferenca = (relatorio.valorCalculado ?? 0) - (relatorio.valorBruto ?? 0)
  const possuiDivergenciaValor = Math.abs(diferenca) > 0.05
  const possuiErroFila = Boolean(relatorio.filaErroMensagem) || ['erro', 'rejeitado'].includes(relatorio.filaStatus ?? '')
  const possuiLeituras = relatorio.totalLeituras > 0
  const aprovado = relatorio.status === 'aprovado'

  if (!aprovado) {
    return {
      pronto: false,
      label: 'Não pronto',
      descricao: 'O relatório ainda não está aprovado para uso na AF.',
      classes: 'border-slate-700 bg-slate-950 text-slate-300',
      icon: <Clock3 className="h-4 w-4" />,
    }
  }

  if (!possuiLeituras) {
    return {
      pronto: false,
      label: 'Não pronto',
      descricao: 'O relatório está aprovado, mas não possui leituras vinculadas.',
      classes: 'border-amber-800 bg-amber-950/40 text-amber-200',
      icon: <AlertCircle className="h-4 w-4" />,
    }
  }

  if (relatorio.possuiDivergencia || possuiDivergenciaValor) {
    return {
      pronto: false,
      label: 'Revisar antes da AF',
      descricao: 'Existe divergência de leitura ou diferença financeira relevante.',
      classes: 'border-amber-800 bg-amber-950/40 text-amber-200',
      icon: <AlertCircle className="h-4 w-4" />,
    }
  }

  if (possuiErroFila) {
    return {
      pronto: false,
      label: 'Revisar fila',
      descricao: 'Existe erro ou rejeição na fila n8n/IA vinculada ao relatório.',
      classes: 'border-red-800 bg-red-950/40 text-red-200',
      icon: <XCircle className="h-4 w-4" />,
    }
  }

  return {
    pronto: true,
    label: 'Pronto para AF',
    descricao: relatorio.filaId
      ? 'Relatório aprovado, com leituras importadas e sem divergência relevante.'
      : 'Relatório aprovado e conferido. Atenção: não há fila n8n/IA vinculada.',
    classes: relatorio.filaId
      ? 'border-emerald-800 bg-emerald-950/40 text-emerald-200'
      : 'border-emerald-800 bg-emerald-950/30 text-emerald-100',
    icon: <CheckCircle2 className="h-4 w-4" />,
  }
}

function ProntoAfBadge({ relatorio }: { relatorio: RelatorioPdfItem }) {
  const prontoAf = getProntoAfRelatorio(relatorio)

  return (
    <span
      title={prontoAf.descricao}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${prontoAf.classes}`}
    >
      {prontoAf.icon}
      {prontoAf.label}
    </span>
  )
}

function ResumoStatusCard({
  titulo,
  valor,
  descricao,
  tipo = 'padrao',
}: {
  titulo: string
  valor: string
  descricao: string
  tipo?: 'padrao' | 'verde' | 'azul' | 'amarelo' | 'vermelho'
}) {
  const classes = {
    padrao: 'border-slate-800 bg-slate-950/50 text-slate-100',
    verde: 'border-emerald-900/70 bg-emerald-950/20 text-emerald-100',
    azul: 'border-blue-900/70 bg-blue-950/20 text-blue-100',
    amarelo: 'border-amber-900/70 bg-amber-950/20 text-amber-100',
    vermelho: 'border-red-900/70 bg-red-950/20 text-red-100',
  }

  return (
    <div className={`rounded-2xl border p-4 ${classes[tipo]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-2 text-2xl font-bold">{valor}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{descricao}</p>
    </div>
  )
}

function formatarNumeroCsv(value: number) {
  return Number(value ?? 0).toFixed(2).replace('.', ',')
}

function resumirJsonAuditoria(value: unknown) {
  if (!value) return 'Sem dados registrados'

  try {
    const texto = JSON.stringify(value)
    return texto.length > 220 ? `${texto.slice(0, 220)}...` : texto
  } catch {
    return 'Não foi possível exibir o JSON da auditoria'
  }
}

function montarLinhaCsv(valores: Array<string | number | boolean | null | undefined>) {
  return valores
    .map((valor) => {
      const texto = String(valor ?? '')
      return `"${texto.replace(/"/g, '""')}"`
    })
    .join(';')
}


function formatarQuantidadeItemAf(value: number) {
  const quantidade = Number(value ?? 0)
  const temCasasDecimais = Math.abs(quantidade % 1) > 0.0001

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: temCasasDecimais ? 2 : 0,
    maximumFractionDigits: temCasasDecimais ? 2 : 0,
  }).format(quantidade)
}

function getTotalItensAf(itens: RelatorioPdfItemAf[]) {
  return itens.reduce((total, item) => total + item.valorTotal, 0)
}

function escaparHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function montarHtmlRelatorioItensAf(
  relatorio: RelatorioPdfItem,
  contratoNumero: string,
  fornecedor: string,
) {
  const prontoAf = getProntoAfRelatorio(relatorio)
  const totalItens = getTotalItensAf(relatorio.itensAf)
  const linhas = relatorio.itensAf
    .map(
      (item) => `
        <tr>
          <td>${escaparHtml(item.categoria === 'locacao' ? 'Locação' : 'Consumo')}</td>
          <td>${escaparHtml(item.codigo)}</td>
          <td>${escaparHtml(item.descricao)}</td>
          <td>${escaparHtml(item.unidade)}</td>
          <td class="right">${escaparHtml(formatarQuantidadeItemAf(item.quantidade))}</td>
          <td class="right">${escaparHtml(formatCurrency(item.valorUnitario))}</td>
          <td class="right">${escaparHtml(formatCurrency(item.valorTotal))}</td>
        </tr>
      `,
    )
    .join('')

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório para Compras - ${escaparHtml(relatorio.classificacaoAf ?? 'Relatório')}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 32px; font-size: 12px; }
    h1 { margin: 0; font-size: 20px; text-transform: uppercase; }
    h2 { margin: 18px 0 8px; font-size: 15px; text-transform: uppercase; }
    .muted { color: #4b5563; }
    .header { border-bottom: 2px solid #111827; padding-bottom: 14px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 22px; margin: 12px 0; }
    .box { border: 1px solid #d1d5db; padding: 10px; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #d1d5db; padding: 6px 7px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; font-size: 11px; text-transform: uppercase; }
    .right { text-align: right; white-space: nowrap; }
    .total { font-weight: 700; background: #f9fafb; }
    .warning { border: 1px solid #f59e0b; background: #fffbeb; padding: 8px; margin-top: 10px; color: #92400e; }
    .assinaturas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px; margin-top: 54px; }
    .linha { border-top: 1px solid #111827; padding-top: 8px; text-align: center; font-size: 11px; }
    @media print { body { margin: 18mm; } button { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <p class="muted">PrintControl NAS</p>
    <h1>Relatório para Emissão de AF — Locação de Impressoras</h1>
    <p class="muted">Documento de apoio para lançamento dos itens no setor de Compras. Não substitui a AF oficial do sistema de compras.</p>
  </div>

  <div class="grid">
    <div><strong>Secretaria/Classificação:</strong> ${escaparHtml(relatorio.classificacaoAf ?? 'Não informado')}</div>
    <div><strong>Mês de referência:</strong> ${escaparHtml(formatarMesReferencia(relatorio.mesReferencia))}</div>
    <div><strong>Contrato:</strong> ${escaparHtml(contratoNumero)}</div>
    <div><strong>Fornecedor:</strong> ${escaparHtml(fornecedor)}</div>
    <div><strong>Relatório PDF de origem:</strong> ${escaparHtml(relatorio.nomeArquivo)}</div>
    <div><strong>Status:</strong> ${escaparHtml(getStatusLabel(relatorio.status))} · ${escaparHtml(prontoAf.label)}</div>
  </div>

  ${prontoAf.pronto ? '' : `<div class="warning"><strong>Atenção:</strong> ${escaparHtml(prontoAf.descricao)}</div>`}

  <h2>Itens para lançamento no Compras</h2>
  <table>
    <thead>
      <tr>
        <th>Tipo</th>
        <th>Código</th>
        <th>Descrição do item</th>
        <th>Unid.</th>
        <th class="right">Qtd</th>
        <th class="right">Valor Unit.</th>
        <th class="right">Valor Total</th>
      </tr>
    </thead>
    <tbody>
      ${linhas || '<tr><td colspan="7">Nenhum item consolidado encontrado para este relatório.</td></tr>'}
      <tr class="total">
        <td colspan="6" class="right">TOTAL DOS ITENS</td>
        <td class="right">${escaparHtml(formatCurrency(totalItens))}</td>
      </tr>
    </tbody>
  </table>

  <div class="box">
    <strong>Observação:</strong> os itens foram consolidados a partir das leituras importadas do PDF: páginas laser P/B, tanque/jato P/B, tanque/jato colorida, duplicação e locação por modelo de equipamento.
  </div>

  <div class="assinaturas">
    <div class="linha">Responsável pela conferência<br/>Secretaria/Setor solicitante</div>
    <div class="linha">Responsável pelo Departamento de Compras<br/>Carimbo e assinatura</div>
  </div>
</body>
</html>`
}

const CLASSIFICACOES_AF = [
  { value: 'ADMINISTRACAO', label: 'ADMINISTRAÇÃO' },
  { value: 'ASSISTENCIA SOCIAL', label: 'ASSISTÊNCIA SOCIAL' },
  { value: 'SAUDE', label: 'SAÚDE' },
]


type AtalhoConferencia =
  | 'todos'
  | 'pronto_af'
  | 'conferidos'
  | 'divergencias'
  | 'diferenca_valor'
  | 'em_fluxo'
  | 'erro_fila'
  | 'sem_leituras'
  | 'sem_fila'

function relatorioBateAtalhoConferencia(
  relatorio: RelatorioPdfItem,
  atalho: AtalhoConferencia,
) {
  if (atalho === 'todos') return true

  if (atalho === 'pronto_af') {
    return getProntoAfRelatorio(relatorio).pronto
  }

  const conferencia = getConferenciaRelatorio(relatorio)
  const fila = getFilaStatusOperacional(relatorio)
  const diferenca = (relatorio.valorCalculado ?? 0) - (relatorio.valorBruto ?? 0)

  if (atalho === 'conferidos') {
    return conferencia.label === 'Conferido'
  }

  if (atalho === 'divergencias') {
    return relatorioTemDivergencia(relatorio) || conferencia.label.includes('Divergência')
  }

  if (atalho === 'diferenca_valor') {
    return Math.abs(diferenca) > 0.05
  }

  if (atalho === 'em_fluxo') {
    return [
      'Aguardando processamento',
      'Pendente processamento',
      'Em processamento',
    ].includes(fila.label)
  }

  if (atalho === 'erro_fila') {
    return fila.classes.includes('red')
  }

  if (atalho === 'sem_leituras') {
    return relatorio.totalLeituras === 0
  }

  if (atalho === 'sem_fila') {
    return !relatorio.filaId
  }

  return true
}

type ResumoFiltro = {
  totalRelatorios: number
  aprovados: number
  pendentesConferencia: number
  totalComErro: number
  comDivergencia: number
  totalLeituras: number
  paginasPb: number
  paginasColoridas: number
  totalPaginas: number
  valorBruto: number
  retencao: number
  valorLiquido: number
  valorCalculado: number
  diferenca: number
}

const resumoInicial: ResumoFiltro = {
  totalRelatorios: 0,
  aprovados: 0,
  pendentesConferencia: 0,
  totalComErro: 0,
  comDivergencia: 0,
  totalLeituras: 0,
  paginasPb: 0,
  paginasColoridas: 0,
  totalPaginas: 0,
  valorBruto: 0,
  retencao: 0,
  valorLiquido: 0,
  valorCalculado: 0,
  diferenca: 0,
}


function RelatoriosExcluidosModal({
  logs,
  selecionado,
  carregando,
  erro,
  onSelecionar,
  onAtualizar,
  onFechar,
}: {
  logs: RelatorioPdfExclusaoLog[]
  selecionado: RelatorioPdfExclusaoLog | null
  carregando: boolean
  erro: string | null
  onSelecionar: (log: RelatorioPdfExclusaoLog) => void
  onAtualizar: () => void
  onFechar: () => void
}) {
  const snapshot = selecionado?.relatorioSnapshot ?? null
  const totalSnapshot = selecionado
    ? selecionado.totalLeiturasSnapshot + selecionado.totalDivergenciasSnapshot + selecionado.totalFilasSnapshot
    : 0

  function copiarSnapshotSelecionado() {
    if (!selecionado) return

    const conteudo = JSON.stringify(
      {
        exclusao: selecionado,
        relatorio_snapshot: selecionado.relatorioSnapshot,
        leituras_snapshot: selecionado.leiturasSnapshot,
        divergencias_snapshot: selecionado.divergenciasSnapshot,
        fila_snapshot: selecionado.filaSnapshot,
      },
      null,
      2,
    )

    void navigator.clipboard?.writeText(conteudo)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-[min(96vw,1800px)] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-300">
              Auditoria de exclusões
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              Histórico de relatórios excluídos
            </h2>
            <p className="mt-1 max-w-[min(96vw,920px)] text-sm text-slate-400">
              Esta tela mostra os relatórios removidos da área operacional, mantendo o snapshot para auditoria e conferência futura.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:flex 2xl:w-auto 2xl:flex-wrap 2xl:justify-end">
            <button
              type="button"
              onClick={onAtualizar}
              disabled={carregando}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
              Atualizar
            </button>

            <button
              type="button"
              onClick={onFechar}
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-y-auto border-b border-slate-800 bg-slate-950/80 p-4 lg:border-b-0 lg:border-r">
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-500">Exclusões</p>
                <p className="mt-1 text-xl font-bold text-white">{formatNumber(logs.length)}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-500">Leituras</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {formatNumber(logs.reduce((total, log) => total + log.totalLeiturasSnapshot, 0))}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-500">Filas</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {formatNumber(logs.reduce((total, log) => total + log.totalFilasSnapshot, 0))}
                </p>
              </div>
            </div>

            {erro ? (
              <div className="mb-4 rounded-2xl border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-100">
                {erro}
              </div>
            ) : null}

            {carregando ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-5 text-sm text-slate-300">
                <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
                Carregando histórico de exclusões...
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 px-4 py-5 text-sm text-emerald-100">
                Nenhum relatório excluído encontrado no log de auditoria.
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const ativo = selecionado?.id === log.id

                  return (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => onSelecionar(log)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        ativo
                          ? 'border-rose-700 bg-rose-950/30'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {log.nomeArquivo ?? 'Arquivo não informado'}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {log.classificacaoAf ?? 'Sem classificação'} • {log.mesReferencia ? formatarMesReferencia(log.mesReferencia) : 'Sem mês'}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-rose-800 bg-rose-950/40 px-2 py-1 text-[11px] font-semibold text-rose-200">
                          Excluído
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-xs text-slate-400">
                        {log.motivo}
                      </p>

                      <p className="mt-2 text-[11px] text-slate-500">
                        {formatarDataHora(log.createdAt)}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </aside>

          <section className="min-h-0 overflow-y-auto p-5">
            {!selecionado ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
                <div>
                  <Archive className="mx-auto h-10 w-10 text-slate-500" />
                  <h3 className="mt-4 text-lg font-bold text-white">Selecione uma exclusão</h3>
                  <p className="mt-2 max-w-md text-sm text-slate-400">
                    Clique em um item da lista para visualizar o motivo, os totais e o snapshot salvo antes da exclusão.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Relatório excluído
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-white">
                        {selecionado.nomeArquivo ?? 'Arquivo não informado'}
                      </h3>
                      <p className="mt-2 text-sm text-slate-400">
                        Excluído em {formatarDataHora(selecionado.createdAt)}
                        {selecionado.excluidoPor ? ` por ${selecionado.excluidoPor}` : ''}.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={copiarSnapshotSelecionado}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                    >
                      <FileText className="h-4 w-4" />
                      Copiar snapshot JSON
                    </button>
                  </div>

                  <div className="mt-5 rounded-2xl border border-amber-900/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
                    <div className="flex gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-semibold">Motivo informado na exclusão</p>
                        <p className="mt-1 text-amber-100/90">{selecionado.motivo}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <ResumoCard
                    titulo="Status anterior"
                    valor={selecionado.statusAnterior ?? 'Não informado'}
                    descricao="Status que estava no relatório excluído"
                    destaque="amarelo"
                  />
                  <ResumoCard
                    titulo="Leituras no snapshot"
                    valor={formatNumber(selecionado.totalLeiturasSnapshot)}
                    descricao="Linhas preservadas no log"
                  />
                  <ResumoCard
                    titulo="Filas vinculadas"
                    valor={formatNumber(selecionado.totalFilasSnapshot)}
                    descricao="Registros n8n/IA preservados"
                  />
                  <ResumoCard
                    titulo="Total bruto anterior"
                    valor={formatCurrency(selecionado.valorBruto)}
                    descricao="Valor salvo no relatório excluído"
                    destaque="verde"
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                    <h4 className="text-base font-bold text-white">Dados do relatório antes da exclusão</h4>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <dt className="text-xs text-slate-500">Classificação AF</dt>
                        <dd className="mt-1 font-semibold text-slate-100">{selecionado.classificacaoAf ?? 'Não informada'}</dd>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <dt className="text-xs text-slate-500">Mês referência</dt>
                        <dd className="mt-1 font-semibold text-slate-100">
                          {selecionado.mesReferencia ? formatarMesReferencia(selecionado.mesReferencia) : 'Não informado'}
                        </dd>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <dt className="text-xs text-slate-500">Valor líquido/NF</dt>
                        <dd className="mt-1 font-semibold text-emerald-300">{formatCurrency(selecionado.valorLiquido)}</dd>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <dt className="text-xs text-slate-500">Valor calculado</dt>
                        <dd className="mt-1 font-semibold text-slate-100">{formatCurrency(selecionado.valorCalculado)}</dd>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 sm:col-span-2">
                        <dt className="text-xs text-slate-500">Hash do arquivo</dt>
                        <dd className="mt-1 break-all font-mono text-xs text-slate-300">{selecionado.hashArquivo ?? 'Não informado'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
                    <h4 className="text-base font-bold text-white">Resumo preservado</h4>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-xs text-slate-500">Leituras</p>
                        <p className="mt-1 text-lg font-bold text-white">{formatNumber(selecionado.totalLeiturasSnapshot)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-xs text-slate-500">Divergências</p>
                        <p className="mt-1 text-lg font-bold text-white">{formatNumber(selecionado.totalDivergenciasSnapshot)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-xs text-slate-500">Fila</p>
                        <p className="mt-1 text-lg font-bold text-white">{formatNumber(selecionado.totalFilasSnapshot)}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
                      Total de registros preservados no snapshot: <span className="font-semibold text-white">{formatNumber(totalSnapshot)}</span>
                    </div>

                    {snapshot ? (
                      <details className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
                        <summary className="cursor-pointer font-semibold text-slate-100">
                          Ver snapshot bruto do relatório
                        </summary>
                        <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-slate-300">
                          {JSON.stringify(snapshot, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default function RelatoriosPdf() {
  const navigate = useNavigate()
  const inputArquivoRef = useRef<HTMLInputElement | null>(null)

  const { data, isLoading, isError, error, refetch, isFetching } = useRelatoriosPdf()

  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [mesFiltro, setMesFiltro] = useState('todos')
  const [anoFiltro, setAnoFiltro] = useState('todos')
  const [classificacaoFiltro, setClassificacaoFiltro] = useState('todos')
  const [somenteDivergentes, setSomenteDivergentes] = useState(false)
  const [atalhoConferencia, setAtalhoConferencia] =
    useState<AtalhoConferencia>('todos')
  const [pdfEmAcaoId, setPdfEmAcaoId] = useState<string | null>(null)
  const [filaEmAcaoId, setFilaEmAcaoId] = useState<string | null>(null)
  const [relatorioExcluindoId, setRelatorioExcluindoId] = useState<string | null>(null)
  const [mensagemAcao, setMensagemAcao] = useState<{
    tipo: 'sucesso' | 'erro' | 'aviso'
    texto: string
  } | null>(null)
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false)
  const [historicoRelatorio, setHistoricoRelatorio] = useState<RelatorioPdfItem | null>(null)
  const [historicoDetalhe, setHistoricoDetalhe] = useState<RelatorioPdfHistoricoDetalhe | null>(null)
  const [historicoCarregando, setHistoricoCarregando] = useState(false)
  const [historicoErro, setHistoricoErro] = useState<string | null>(null)
  const [modalItensAfAberto, setModalItensAfAberto] = useState(false)
  const [relatorioItensAf, setRelatorioItensAf] = useState<RelatorioPdfItem | null>(null)
  const [modalExcluidosAberto, setModalExcluidosAberto] = useState(false)
  const [relatoriosExcluidos, setRelatoriosExcluidos] = useState<RelatorioPdfExclusaoLog[]>([])
  const [excluidosCarregando, setExcluidosCarregando] = useState(false)
  const [excluidosErro, setExcluidosErro] = useState<string | null>(null)
  const [exclusaoSelecionada, setExclusaoSelecionada] = useState<RelatorioPdfExclusaoLog | null>(null)

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

  const anosDisponiveis = useMemo(() => {
    const anos = new Set<string>()

    data?.relatorios.forEach((relatorio) => {
      if (relatorio.mesReferencia) {
        anos.add(relatorio.mesReferencia.slice(0, 4))
      }
    })

    return Array.from(anos).sort().reverse()
  }, [data?.relatorios])

  const classificacoesDisponiveis = useMemo(() => {
    const classificacoes = new Set<string>()

    data?.relatorios.forEach((relatorio) => {
      if (relatorio.classificacaoAf) {
        classificacoes.add(relatorio.classificacaoAf)
      }
    })

    return Array.from(classificacoes).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [data?.relatorios])

  const relatoriosFiltrados = useMemo(() => {
    const textoBusca = normalizarTexto(busca)
    const classificacaoNormalizada = normalizarTexto(classificacaoFiltro)

    return (
      data?.relatorios.filter((relatorio: RelatorioPdfItem) => {
        const mesRelatorio = relatorio.mesReferencia?.slice(0, 7) ?? ''
        const anoRelatorio = relatorio.mesReferencia?.slice(0, 4) ?? ''
        const statusRelatorio = relatorio.status
        const classificacaoRelatorio = normalizarTexto(relatorio.classificacaoAf ?? '')

        const bateStatus = statusFiltro === 'todos' || statusRelatorio === statusFiltro
        const bateMes = mesFiltro === 'todos' || mesRelatorio === mesFiltro
        const bateAno = anoFiltro === 'todos' || anoRelatorio === anoFiltro
        const bateClassificacao =
          classificacaoFiltro === 'todos' || classificacaoRelatorio === classificacaoNormalizada
        const bateDivergencia = !somenteDivergentes || relatorioTemDivergencia(relatorio)
        const bateAtalho = relatorioBateAtalhoConferencia(relatorio, atalhoConferencia)

        const textoRelatorio = normalizarTexto(
          [
            relatorio.nomeArquivo,
            relatorio.classificacaoAf ?? '',
            relatorio.status,
            relatorio.mesReferencia,
            relatorio.arquivoPath ?? '',
          ].join(' '),
        )

        const bateBusca = !textoBusca || textoRelatorio.includes(textoBusca)

        return (
          bateStatus &&
          bateMes &&
          bateAno &&
          bateClassificacao &&
          bateDivergencia &&
          bateAtalho &&
          bateBusca
        )
      }) ?? []
    )
  }, [
    anoFiltro,
    atalhoConferencia,
    busca,
    classificacaoFiltro,
    data?.relatorios,
    mesFiltro,
    somenteDivergentes,
    statusFiltro,
  ])

  const resumoFiltro = useMemo(() => {
    return relatoriosFiltrados.reduce<ResumoFiltro>((acc, relatorio) => {
      acc.totalRelatorios += 1
      acc.totalLeituras += relatorio.totalLeituras
      acc.paginasPb += relatorio.paginasPb
      acc.paginasColoridas += relatorio.paginasColoridas
      acc.totalPaginas += relatorio.totalPaginas
      acc.valorBruto += relatorio.valorBruto
      acc.retencao += relatorio.retencao
      acc.valorLiquido += relatorio.valorLiquido
      acc.valorCalculado += relatorio.valorCalculado

      if (relatorio.status === 'aprovado') {
        acc.aprovados += 1
      }

      if (relatorio.status === 'pendente_conferencia') {
        acc.pendentesConferencia += 1
      }

      if (relatorio.status === 'erro' || relatorio.status === 'rejeitado') {
        acc.totalComErro += 1
      }

      if (relatorioTemDivergencia(relatorio)) {
        acc.comDivergencia += 1
      }

      acc.diferenca = acc.valorCalculado - acc.valorBruto

      return acc
    }, { ...resumoInicial })
  }, [relatoriosFiltrados])

  const resumoStatusOperacional = useMemo(() => {
    return relatoriosFiltrados.reduce(
      (acc, relatorio) => {
        const conferencia = getConferenciaRelatorio(relatorio)
        const fila = getFilaStatusOperacional(relatorio)
        const diferenca = relatorio.valorCalculado - relatorio.valorBruto

        if (conferencia.label === 'Conferido') acc.conferidos += 1
        if (conferencia.label.includes('Divergência')) acc.divergentes += 1
        if (relatorio.totalLeituras === 0) acc.semLeituras += 1
        if (Math.abs(diferenca) > 0.05) acc.comDiferencaValor += 1
        if (fila.label === 'Sem fila vinculada') acc.semFila += 1
        if (
          ['Aguardando processamento', 'Pendente processamento', 'Em processamento'].includes(
            fila.label,
          )
        ) {
          acc.emFluxo += 1
        }
        if (fila.classes.includes('red')) acc.comErroFila += 1
        if (getProntoAfRelatorio(relatorio).pronto) {
          acc.prontosAf += 1
        } else {
          acc.naoProntosAf += 1
        }

        return acc
      },
      {
        conferidos: 0,
        divergentes: 0,
        semLeituras: 0,
        comDiferencaValor: 0,
        semFila: 0,
        emFluxo: 0,
        comErroFila: 0,
        prontosAf: 0,
        naoProntosAf: 0,
      },
    )
  }, [relatoriosFiltrados])

  const filtrosAtivos = useMemo(() => {
    let total = 0

    if (busca.trim()) total += 1
    if (statusFiltro !== 'todos') total += 1
    if (mesFiltro !== 'todos') total += 1
    if (anoFiltro !== 'todos') total += 1
    if (classificacaoFiltro !== 'todos') total += 1
    if (somenteDivergentes) total += 1
    if (atalhoConferencia !== 'todos') total += 1

    return total
  }, [
    anoFiltro,
    atalhoConferencia,
    busca,
    classificacaoFiltro,
    mesFiltro,
    somenteDivergentes,
    statusFiltro,
  ])


  const atalhosConferencia = useMemo(
    () => [
      {
        id: 'todos' as const,
        titulo: 'Todos',
        descricao: 'Mantém somente os filtros gerais aplicados.',
        valor: relatoriosFiltrados.length,
        classes: 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900',
      },
      {
        id: 'pronto_af' as const,
        titulo: 'Prontos para AF',
        descricao: 'Aprovados, com leituras e sem divergências.',
        valor: resumoStatusOperacional.prontosAf,
        classes: 'border-emerald-700 bg-emerald-950/40 text-emerald-100 hover:bg-emerald-950/60',
      },
      {
        id: 'conferidos' as const,
        titulo: 'Conferidos',
        descricao: 'Sem divergência de leitura ou valor.',
        valor: resumoStatusOperacional.conferidos,
        classes: 'border-emerald-800 bg-emerald-950/30 text-emerald-100 hover:bg-emerald-950/50',
      },
      {
        id: 'divergencias' as const,
        titulo: 'Com divergência',
        descricao: 'Leitura, valor ou ambos precisam de atenção.',
        valor: resumoStatusOperacional.divergentes,
        classes: 'border-amber-800 bg-amber-950/30 text-amber-100 hover:bg-amber-950/50',
      },
      {
        id: 'diferenca_valor' as const,
        titulo: 'Diferença de valor',
        descricao: 'Diferença maior que R$ 0,05.',
        valor: resumoStatusOperacional.comDiferencaValor,
        classes: 'border-amber-800 bg-amber-950/30 text-amber-100 hover:bg-amber-950/50',
      },
      {
        id: 'em_fluxo' as const,
        titulo: 'Em fluxo n8n/IA',
        descricao: 'Aguardando ou em processamento.',
        valor: resumoStatusOperacional.emFluxo,
        classes: 'border-blue-800 bg-blue-950/30 text-blue-100 hover:bg-blue-950/50',
      },
      {
        id: 'erro_fila' as const,
        titulo: 'Erro na fila',
        descricao: 'Erro ou rejeição operacional.',
        valor: resumoStatusOperacional.comErroFila,
        classes: 'border-red-800 bg-red-950/30 text-red-100 hover:bg-red-950/50',
      },
      {
        id: 'sem_leituras' as const,
        titulo: 'Sem leituras',
        descricao: 'Relatórios sem itens importados.',
        valor: resumoStatusOperacional.semLeituras,
        classes: 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900',
      },
      {
        id: 'sem_fila' as const,
        titulo: 'Sem fila vinculada',
        descricao: 'Relatórios sem item da fila n8n/IA.',
        valor: resumoStatusOperacional.semFila,
        classes: 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900',
      },
    ],
    [relatoriosFiltrados.length, resumoStatusOperacional],
  )

  function limparCampoArquivo() {
    setArquivoUpload(null)

    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = ''
    }
  }

  function limparFiltros() {
    setBusca('')
    setStatusFiltro('todos')
    setMesFiltro('todos')
    setAnoFiltro('todos')
    setClassificacaoFiltro('todos')
    setSomenteDivergentes(false)
    setAtalhoConferencia('todos')
  }

  function aplicarAtalhoConferencia(atalho: AtalhoConferencia) {
    setAtalhoConferencia(atalho)

    if (atalho !== 'todos') {
      setSomenteDivergentes(false)
    }

    if (atalho === 'conferidos' || atalho === 'pronto_af') {
      setStatusFiltro('aprovado')
    }

    if (['em_fluxo', 'erro_fila', 'sem_leituras', 'sem_fila'].includes(atalho)) {
      setStatusFiltro('todos')
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

  async function abrirPdfOriginal(relatorio: RelatorioPdfItem) {
    const novaAba = window.open('', '_blank', 'noopener,noreferrer')

    try {
      setPdfEmAcaoId(relatorio.id)
      const signedUrl = await criarUrlTemporariaPdfOriginal(relatorio.arquivoPath)

      if (novaAba) {
        novaAba.location.href = signedUrl
      } else {
        window.open(signedUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (pdfError) {
      if (novaAba) {
        novaAba.close()
      }

      window.alert(
        pdfError instanceof Error
          ? pdfError.message
          : 'Não foi possível abrir o PDF original.',
      )
    } finally {
      setPdfEmAcaoId(null)
    }
  }

  async function baixarPdfOriginal(relatorio: RelatorioPdfItem) {
    try {
      setPdfEmAcaoId(relatorio.id)
      const signedUrl = await criarUrlTemporariaPdfOriginal(relatorio.arquivoPath)
      const downloadUrl = montarUrlDownloadPdf(signedUrl, relatorio.nomeArquivo)

      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = relatorio.nomeArquivo
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (pdfError) {
      window.alert(
        pdfError instanceof Error
          ? pdfError.message
          : 'Não foi possível baixar o PDF original.',
      )
    } finally {
      setPdfEmAcaoId(null)
    }
  }

  async function executarReprocessamento(relatorio: RelatorioPdfItem) {
    if (!relatorio.filaId) {
      setMensagemAcao({
        tipo: 'erro',
        texto: 'Este relatório não possui registro de fila vinculado. Abra a tela Fila n8n/IA para localizar o PDF.',
      })
      return
    }

    const motivo = window.prompt(
      'Informe o motivo do reprocessamento:',
      `Reprocessamento solicitado para ${relatorio.nomeArquivo}`,
    )

    if (motivo === null) return

    try {
      setFilaEmAcaoId(relatorio.filaId)
      setMensagemAcao(null)

      const resultado = await reprocessarPdfFila({
        filaId: relatorio.filaId,
        limparPayloads: true,
        motivo,
      })

      setMensagemAcao({
        tipo: resultadoRpcOk(resultado) ? 'sucesso' : 'aviso',
        texto: extrairMensagemRpc(resultado, 'PDF enviado novamente para reprocessamento.'),
      })

      await refetch()
    } catch (acaoError) {
      setMensagemAcao({
        tipo: 'erro',
        texto:
          acaoError instanceof Error
            ? acaoError.message
            : 'Erro desconhecido ao reprocessar o PDF.',
      })
    } finally {
      setFilaEmAcaoId(null)
    }
  }


  async function executarExclusaoRelatorio(relatorio: RelatorioPdfItem) {
    const prontoAf = getProntoAfRelatorio(relatorio)

    const primeiraConfirmacao = window.confirm(
      [
        'ATENÇÃO: você está prestes a excluir um relatório PDF importado.',
        '',
        `Arquivo: ${relatorio.nomeArquivo}`,
        `Classificação: ${relatorio.classificacaoAf ?? 'Não informada'}`,
        `Mês: ${formatarMesReferencia(relatorio.mesReferencia)}`,
        `Status: ${getStatusLabel(relatorio.status)}`,
        prontoAf.pronto ? 'Este relatório está marcado como pronto para AF.' : '',
        '',
        'A exclusão removerá o relatório e as leituras vinculadas, mas salvará um snapshot em log de auditoria.',
        '',
        'Deseja continuar?',
      ]
        .filter(Boolean)
        .join('\n'),
    )

    if (!primeiraConfirmacao) return

    const motivo = window.prompt(
      'Informe o motivo da exclusão. O motivo precisa ter pelo menos 10 caracteres:',
      `Relatório lançado errado: ${relatorio.nomeArquivo}`,
    )

    if (motivo === null) return

    const motivoLimpo = motivo.trim()

    if (motivoLimpo.length < 10) {
      setMensagemAcao({
        tipo: 'erro',
        texto: 'A exclusão foi cancelada. O motivo precisa ter pelo menos 10 caracteres.',
      })
      return
    }

    const confirmacao = window.prompt(
      'Para confirmar a exclusão, digite exatamente: EXCLUIR',
      '',
    )

    if (confirmacao === null) return

    if (confirmacao.trim().toUpperCase() !== 'EXCLUIR') {
      setMensagemAcao({
        tipo: 'aviso',
        texto: 'Exclusão cancelada. A confirmação digitada não foi EXCLUIR.',
      })
      return
    }

    try {
      setRelatorioExcluindoId(relatorio.id)
      setMensagemAcao(null)

      const resultado = await excluirRelatorioPdfCompleto({
        relatorioId: relatorio.id,
        motivo: motivoLimpo,
        confirmacao: 'EXCLUIR',
      })

      setMensagemAcao({
        tipo: resultadoRpcOk(resultado) ? 'sucesso' : 'aviso',
        texto: extrairMensagemRpc(resultado, 'Relatório excluído com segurança e snapshot salvo em auditoria.'),
      })

      if (historicoRelatorio?.id === relatorio.id) {
        fecharModalHistorico()
      }

      if (relatorioItensAf?.id === relatorio.id) {
        fecharModalItensAf()
      }

      await refetch()
    } catch (exclusaoError) {
      setMensagemAcao({
        tipo: 'erro',
        texto:
          exclusaoError instanceof Error
            ? exclusaoError.message
            : 'Erro desconhecido ao excluir o relatório.',
      })
    } finally {
      setRelatorioExcluindoId(null)
    }
  }

  async function executarCancelamento(relatorio: RelatorioPdfItem) {
    if (!relatorio.filaId) {
      setMensagemAcao({
        tipo: 'erro',
        texto: 'Este relatório não possui registro de fila vinculado. Abra a tela Fila n8n/IA para localizar o PDF.',
      })
      return
    }

    const statusFila = relatorio.filaStatus ?? relatorio.status
    const relatorioJaImportado = ['importado', 'aprovado'].includes(statusFila)

    let forcar = false

    if (relatorioJaImportado) {
      forcar = window.confirm(
        'Este PDF já está importado/aprovado. O cancelamento forçado é uma ação sensível. Deseja continuar?',
      )

      if (!forcar) return
    }

    const motivo = window.prompt(
      'Informe o motivo do cancelamento:',
      `Cancelamento solicitado para ${relatorio.nomeArquivo}`,
    )

    if (motivo === null) return

    try {
      setFilaEmAcaoId(relatorio.filaId)
      setMensagemAcao(null)

      const resultado = await cancelarPdfFila({
        filaId: relatorio.filaId,
        motivo,
        forcar,
      })

      setMensagemAcao({
        tipo: resultadoRpcOk(resultado) ? 'sucesso' : 'aviso',
        texto: extrairMensagemRpc(resultado, 'Solicitação de cancelamento executada.'),
      })

      await refetch()
    } catch (acaoError) {
      setMensagemAcao({
        tipo: 'erro',
        texto:
          acaoError instanceof Error
            ? acaoError.message
            : 'Erro desconhecido ao cancelar o PDF.',
      })
    } finally {
      setFilaEmAcaoId(null)
    }
  }


  async function carregarRelatoriosExcluidos() {
    try {
      setExcluidosCarregando(true)
      setExcluidosErro(null)

      const logs = await listarRelatoriosPdfExcluidos(100)

      setRelatoriosExcluidos(logs)
      setExclusaoSelecionada((selecionadoAtual) => {
        if (selecionadoAtual && logs.some((log) => log.id === selecionadoAtual.id)) {
          return logs.find((log) => log.id === selecionadoAtual.id) ?? selecionadoAtual
        }

        return logs[0] ?? null
      })
    } catch (excluidosError) {
      setExcluidosErro(
        excluidosError instanceof Error
          ? excluidosError.message
          : 'Erro desconhecido ao carregar relatórios excluídos.',
      )
    } finally {
      setExcluidosCarregando(false)
    }
  }

  async function abrirModalRelatoriosExcluidos() {
    setModalExcluidosAberto(true)
    await carregarRelatoriosExcluidos()
  }

  function fecharModalRelatoriosExcluidos() {
    setModalExcluidosAberto(false)
    setRelatoriosExcluidos([])
    setExclusaoSelecionada(null)
    setExcluidosErro(null)
  }

  async function abrirHistoricoRelatorio(relatorio: RelatorioPdfItem) {
    setModalHistoricoAberto(true)
    setHistoricoRelatorio(relatorio)
    setHistoricoDetalhe(null)
    setHistoricoErro(null)

    try {
      setHistoricoCarregando(true)

      const detalhe = await obterHistoricoRelatorioPdf({
        relatorioId: relatorio.id,
        filaId: relatorio.filaId,
        nomeArquivo: relatorio.nomeArquivo,
      })

      setHistoricoDetalhe(detalhe)
    } catch (historicoError) {
      setHistoricoErro(
        historicoError instanceof Error
          ? historicoError.message
          : 'Erro desconhecido ao carregar o histórico do relatório.',
      )
    } finally {
      setHistoricoCarregando(false)
    }
  }

  function fecharModalHistorico() {
    setModalHistoricoAberto(false)
    setHistoricoRelatorio(null)
    setHistoricoDetalhe(null)
    setHistoricoErro(null)
  }

  function abrirModalItensAf(relatorio: RelatorioPdfItem) {
    setRelatorioItensAf(relatorio)
    setModalItensAfAberto(true)
  }

  function fecharModalItensAf() {
    setModalItensAfAberto(false)
    setRelatorioItensAf(null)
  }

  function exportarItensAfCsv(relatorio: RelatorioPdfItem) {
    const linhas = [
      montarLinhaCsv([
        'Tipo',
        'Código',
        'Descrição',
        'Unidade',
        'Quantidade',
        'Valor unitário',
        'Valor total',
      ]),
      ...relatorio.itensAf.map((item) =>
        montarLinhaCsv([
          item.categoria === 'locacao' ? 'Locação' : 'Consumo',
          item.codigo,
          item.descricao,
          item.unidade,
          formatarQuantidadeItemAf(item.quantidade),
          formatarNumeroCsv(item.valorUnitario),
          formatarNumeroCsv(item.valorTotal),
        ]),
      ),
      montarLinhaCsv(['', '', '', '', '', 'TOTAL DOS ITENS', formatarNumeroCsv(getTotalItensAf(relatorio.itensAf))]),
    ]

    const csv = `\uFEFF${linhas.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const competencia = relatorio.mesReferencia?.slice(0, 7) ?? 'sem-mes'
    const classificacao = normalizarTexto(relatorio.classificacaoAf ?? 'sem-classificacao').replace(/\s+/g, '-')

    const link = document.createElement('a')
    link.href = url
    link.download = `itens-af-${classificacao}-${competencia}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function imprimirItensAf(relatorio: RelatorioPdfItem) {
    const html = montarHtmlRelatorioItensAf(
      relatorio,
      data?.contrato.numeroContrato ?? '183/2024',
      data?.contrato.fornecedor ?? 'FG COPIADORAS LTDA',
    )

    // A impressão por janela popup pode falhar em alguns navegadores,
    // principalmente quando o window.open usa noopener/noreferrer.
    // Por isso usamos um iframe temporário dentro da própria tela.
    const iframe = document.createElement('iframe')
    iframe.title = 'Impressão dos itens da AF'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '1px'
    iframe.style.height = '1px'
    iframe.style.opacity = '0'
    iframe.style.border = '0'

    document.body.appendChild(iframe)

    const janelaImpressao = iframe.contentWindow
    const documentoImpressao = iframe.contentDocument ?? janelaImpressao?.document

    if (!janelaImpressao || !documentoImpressao) {
      iframe.remove()
      window.alert('Não foi possível preparar a impressão. Tente novamente ou exporte o CSV.')
      return
    }

    documentoImpressao.open()
    documentoImpressao.write(html)
    documentoImpressao.close()

    window.setTimeout(() => {
      janelaImpressao.focus()
      janelaImpressao.print()

      window.setTimeout(() => {
        iframe.remove()
      }, 1500)
    }, 500)
  }

  function exportarCsv() {
    const linhas = [
      montarLinhaCsv([
        'Arquivo',
        'Mês referência',
        'Ano',
        'Classificação AF',
        'Status',
        'Conferência',
        'Pronto para AF',
        'Motivo pronto AF',
        'Status fila',
        'Etapa fila',
        'Erro fila',
        'Leituras',
        'Páginas P/B',
        'Páginas coloridas',
        'Total páginas',
        'Valor bruto PDF',
        'Retenção',
        'Valor líquido/NF',
        'Valor calculado',
        'Total itens AF',
        'Diferença calculado x bruto',
        'Possui divergência',
        'Importado em',
        'Arquivo path',
      ]),
      ...relatoriosFiltrados.map((relatorio) =>
        montarLinhaCsv([
          relatorio.nomeArquivo,
          formatarMesReferencia(relatorio.mesReferencia),
          relatorio.mesReferencia?.slice(0, 4) ?? '',
          relatorio.classificacaoAf ?? '',
          getStatusLabel(relatorio.status),
          getConferenciaRelatorio(relatorio).label,
          getProntoAfRelatorio(relatorio).label,
          getProntoAfRelatorio(relatorio).descricao,
          relatorio.filaStatus ? getStatusLabel(relatorio.filaStatus) : 'Sem fila',
          relatorio.filaEtapaAtual ?? '',
          relatorio.filaErroMensagem ?? '',
          relatorio.totalLeituras,
          relatorio.paginasPb,
          relatorio.paginasColoridas,
          relatorio.totalPaginas,
          formatarNumeroCsv(relatorio.valorBruto),
          formatarNumeroCsv(relatorio.retencao),
          formatarNumeroCsv(relatorio.valorLiquido),
          formatarNumeroCsv(relatorio.valorCalculado),
          formatarNumeroCsv(relatorio.totalItensAf),
          formatarNumeroCsv(relatorio.valorCalculado - relatorio.valorBruto),
          relatorioTemDivergencia(relatorio) ? 'Sim' : 'Não',
          formatarDataHora(relatorio.createdAt),
          relatorio.arquivoPath ?? '',
        ]),
      ),
    ]

    const csv = `\uFEFF${linhas.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const dataArquivo = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

    const link = document.createElement('a')
    link.href = url
    link.download = `relatorios-pdf-printcontrol-${dataArquivo}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
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

  const filaResumo = data?.filaResumo

  return (
    <div className="w-full max-w-none min-w-0 space-y-6">
      <section className="flex w-full min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-medium text-violet-300">Relatórios PDF</p>

          <h1 className="mt-1 text-2xl font-bold text-white">
            Relatórios importados
          </h1>

          <p className="mt-2 max-w-[min(96vw,1400px)] text-sm text-slate-400">
            Listagem dos relatórios mensais vinculados ao contrato{' '}
            <span className="font-semibold text-slate-200">
              {data?.contrato.numeroContrato}
            </span>{' '}
            — {data?.contrato.fornecedor}.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:flex 2xl:w-auto 2xl:flex-wrap 2xl:justify-end">
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
            onClick={() => navigate('/fila-processamento')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            <Bot className="h-4 w-4" />
            Fila n8n/IA
          </button>

          <button
            type="button"
            onClick={() => void abrirModalRelatoriosExcluidos()}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-800/70 bg-rose-950/20 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-950/40"
            title="Ver histórico de relatórios excluídos com snapshot de auditoria"
          >
            <Archive className="h-4 w-4" />
            Excluídos
          </button>

          <button
            type="button"
            onClick={exportarCsv}
            disabled={relatoriosFiltrados.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" />
            Exportar CSV
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

      {mensagemAcao && (
        <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${getMensagemAcaoClasses(mensagemAcao.tipo)}`}>
          {mensagemAcao.tipo === 'erro' ? (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          ) : mensagemAcao.tipo === 'aviso' ? (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div>
            <p className="font-semibold">Resultado da ação</p>
            <p className="mt-1">{mensagemAcao.texto}</p>
          </div>
        </div>
      )}

      <section className="grid gap-4 2xl:grid-cols-[1.2fr_1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Último PDF enviado</p>
              <h2 className="mt-2 text-lg font-bold text-white">
                {filaResumo?.ultimoPdfEnviado?.nomeArquivo ?? 'Nenhum envio localizado'}
              </h2>
            </div>
            <Upload className="h-5 w-5 text-violet-300" />
          </div>

          {filaResumo?.ultimoPdfEnviado ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                    filaResumo.ultimoPdfEnviado.statusProcessamento,
                  )}`}
                >
                  {getStatusIcon(filaResumo.ultimoPdfEnviado.statusProcessamento)}
                  {getStatusLabel(filaResumo.ultimoPdfEnviado.statusProcessamento)}
                </span>
                <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  {filaResumo.ultimoPdfEnviado.classificacaoAf ?? 'Sem classificação'}
                </span>
                <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  {filaResumo.ultimoPdfEnviado.mesReferencia
                    ? formatarMesReferencia(filaResumo.ultimoPdfEnviado.mesReferencia)
                    : 'Sem mês'}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
                  <p className="text-xs text-slate-500">Registrado em</p>
                  <p className="mt-1 font-semibold text-slate-200">
                    {filaResumo.ultimoPdfEnviado.createdAt
                      ? formatarDataHora(filaResumo.ultimoPdfEnviado.createdAt)
                      : 'Não informado'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
                  <p className="text-xs text-slate-500">Atualizado em</p>
                  <p className="mt-1 font-semibold text-slate-200">
                    {filaResumo.ultimoPdfEnviado.updatedAt
                      ? formatarDataHora(filaResumo.ultimoPdfEnviado.updatedAt)
                      : 'Não informado'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span
                  className={`rounded-full border px-2.5 py-1 ${
                    filaResumo.ultimoPdfEnviado.temPayloadExtraido
                      ? 'border-emerald-800 bg-emerald-950/40 text-emerald-200'
                      : 'border-slate-700 bg-slate-950 text-slate-400'
                  }`}
                >
                  Payload extraído: {filaResumo.ultimoPdfEnviado.temPayloadExtraido ? 'sim' : 'não'}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 ${
                    filaResumo.ultimoPdfEnviado.temPayloadNormalizado
                      ? 'border-emerald-800 bg-emerald-950/40 text-emerald-200'
                      : 'border-slate-700 bg-slate-950 text-slate-400'
                  }`}
                >
                  Payload normalizado: {filaResumo.ultimoPdfEnviado.temPayloadNormalizado ? 'sim' : 'não'}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Assim que um PDF for enviado pelo WebApp, ele aparecerá aqui com status, payloads e data de atualização.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Próximo PDF pendente</p>
              <h2 className="mt-2 text-lg font-bold text-white">
                {filaResumo?.proximoPdfPendente?.nomeArquivo ?? 'Nenhum PDF aguardando'}
              </h2>
            </div>
            <Bot className="h-5 w-5 text-blue-300" />
          </div>

          {filaResumo?.proximoPdfPendente ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-800 bg-blue-950/40 px-2.5 py-1 text-xs font-semibold text-blue-200">
                  <Clock3 className="h-4 w-4" />
                  Aguardando n8n/IA
                </span>
                <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  {filaResumo.proximoPdfPendente.classificacaoAf ?? 'Sem classificação'}
                </span>
                <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  {filaResumo.proximoPdfPendente.mesReferencia
                    ? formatarMesReferencia(filaResumo.proximoPdfPendente.mesReferencia)
                    : 'Sem mês'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
                <p className="text-xs text-slate-500">Etapa atual</p>
                <p className="mt-1 font-semibold text-slate-200">
                  {filaResumo.proximoPdfPendente.etapaAtual ?? 'registrado_na_fila'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
                <p className="text-xs text-slate-500">Registrado em</p>
                <p className="mt-1 font-semibold text-slate-200">
                  {filaResumo.proximoPdfPendente.createdAt
                    ? formatarDataHora(filaResumo.proximoPdfPendente.createdAt)
                    : 'Não informado'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-emerald-900/60 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Fila sem pendências imediatas.</p>
                  <p className="mt-1 text-emerald-200/90">
                    O próximo upload entrará aqui como aguardando até o agendamento do n8n processar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resumo da fila</p>
              <h2 className="mt-2 text-lg font-bold text-white">
                {formatNumber(filaResumo?.totalNaFila ?? 0)} item(ns)
              </h2>
            </div>
            <History className="h-5 w-5 text-slate-300" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-blue-900/60 bg-blue-950/20 px-3 py-2">
              <p className="text-xs text-blue-200/80">Aguardando</p>
              <p className="mt-1 text-lg font-bold text-blue-100">
                {formatNumber(filaResumo?.totalAguardando ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-violet-900/60 bg-violet-950/20 px-3 py-2">
              <p className="text-xs text-violet-200/80">Em fluxo</p>
              <p className="mt-1 text-lg font-bold text-violet-100">
                {formatNumber(filaResumo?.totalEmProcessamento ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 px-3 py-2">
              <p className="text-xs text-emerald-200/80">Finalizados</p>
              <p className="mt-1 text-lg font-bold text-emerald-100">
                {formatNumber((filaResumo?.totalImportados ?? 0) + (filaResumo?.totalAprovados ?? 0))}
              </p>
            </div>
            <div className="rounded-xl border border-red-900/60 bg-red-950/20 px-3 py-2">
              <p className="text-xs text-red-200/80">Erro/Rejeitado</p>
              <p className="mt-1 text-lg font-bold text-red-100">
                {formatNumber((filaResumo?.totalComErro ?? 0) + (filaResumo?.totalRejeitados ?? 0))}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={abrirModalUpload}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500"
            >
              <Upload className="h-4 w-4" />
              Enviar PDF
            </button>
            <button
              type="button"
              onClick={() => navigate('/fila-processamento')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <Bot className="h-4 w-4" />
              Abrir fila
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Relatórios encontrados"
          valor={formatNumber(resumoFiltro.totalRelatorios)}
          descricao={`${formatNumber(resumoFiltro.aprovados)} aprovado(s) no filtro`}
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
          destaque="verde"
        />

        <ResumoCard
          titulo="Pendentes conferência"
          valor={formatNumber(resumoFiltro.pendentesConferencia)}
          descricao="Relatórios aguardando validação manual"
          destaque={resumoFiltro.pendentesConferencia > 0 ? 'amarelo' : 'padrao'}
        />

        <ResumoCard
          titulo="Valor bruto PDF"
          valor={formatCurrency(resumoFiltro.valorBruto)}
          descricao="Soma dos brutos informados nos PDFs"
        />

        <ResumoCard
          titulo="Retenção total"
          valor={formatCurrency(resumoFiltro.retencao)}
          descricao="Soma das retenções dos relatórios filtrados"
        />

        <ResumoCard
          titulo="Calculado pelo sistema"
          valor={formatCurrency(resumoFiltro.valorCalculado)}
          descricao={`Diferença: ${formatCurrency(resumoFiltro.diferenca)}`}
          destaque={Math.abs(resumoFiltro.diferenca) > 0.05 ? 'amarelo' : 'verde'}
        />

        <ResumoCard
          titulo="Com divergência"
          valor={formatNumber(resumoFiltro.comDivergencia)}
          descricao={`${formatNumber(resumoFiltro.totalComErro)} com erro/rejeitado`}
          destaque={resumoFiltro.comDivergencia > 0 ? 'vermelho' : 'padrao'}
        />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Status operacional e divergências</h2>
            <p className="mt-1 text-sm text-slate-400">
              Visão rápida da situação dos relatórios filtrados, considerando conferência financeira, leituras e fila n8n/IA.
            </p>
          </div>

          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
            Diferença total: {formatCurrency(resumoFiltro.diferenca)}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          <ResumoStatusCard
            titulo="Prontos para AF"
            valor={formatNumber(resumoStatusOperacional.prontosAf)}
            descricao="Aprovados, com leituras e sem divergência."
            tipo="verde"
          />
          <ResumoStatusCard
            titulo="Conferidos"
            valor={formatNumber(resumoStatusOperacional.conferidos)}
            descricao="Sem divergência relevante no filtro atual."
            tipo="verde"
          />
          <ResumoStatusCard
            titulo="Divergentes"
            valor={formatNumber(resumoStatusOperacional.divergentes)}
            descricao="Leitura, valor ou ambos precisam de atenção."
            tipo={resumoStatusOperacional.divergentes > 0 ? 'amarelo' : 'padrao'}
          />
          <ResumoStatusCard
            titulo="Diferença valor"
            valor={formatNumber(resumoStatusOperacional.comDiferencaValor)}
            descricao="Relatórios com diferença acima de R$ 0,05."
            tipo={resumoStatusOperacional.comDiferencaValor > 0 ? 'amarelo' : 'padrao'}
          />
          <ResumoStatusCard
            titulo="Em fluxo n8n/IA"
            valor={formatNumber(resumoStatusOperacional.emFluxo)}
            descricao="Aguardando ou em processamento na fila."
            tipo={resumoStatusOperacional.emFluxo > 0 ? 'azul' : 'padrao'}
          />
          <ResumoStatusCard
            titulo="Erro na fila"
            valor={formatNumber(resumoStatusOperacional.comErroFila)}
            descricao="Relatórios com erro ou rejeição operacional."
            tipo={resumoStatusOperacional.comErroFila > 0 ? 'vermelho' : 'padrao'}
          />
          <ResumoStatusCard
            titulo="Sem leituras"
            valor={formatNumber(resumoStatusOperacional.semLeituras)}
            descricao="PDF sem itens importados em leituras_mensais."
            tipo={resumoStatusOperacional.semLeituras > 0 ? 'amarelo' : 'padrao'}
          />
          <ResumoStatusCard
            titulo="Sem fila"
            valor={formatNumber(resumoStatusOperacional.semFila)}
            descricao="Relatórios sem vínculo com fila n8n/IA."
            tipo={resumoStatusOperacional.semFila > 0 ? 'amarelo' : 'padrao'}
          />
        </div>

        {resumoStatusOperacional.divergentes > 0 || resumoStatusOperacional.comErroFila > 0 ? (
          <div className="mt-5 rounded-2xl border border-amber-900/70 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Atenção: existem relatórios que precisam de conferência.</p>
                <p className="mt-1 text-amber-200/90">
                  Use o filtro “somente com divergência” ou clique em “Histórico” para verificar payloads, erros e eventos de auditoria.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-emerald-900/70 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Nenhuma divergência relevante no filtro atual.</p>
                <p className="mt-1 text-emerald-200/90">
                  Os relatórios exibidos estão visualmente consistentes quanto a leituras, valores e status operacional.
                </p>
              </div>
            </div>
          </div>
        )}

        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            resumoStatusOperacional.naoProntosAf > 0
              ? 'border-amber-900/70 bg-amber-950/20 text-amber-100'
              : 'border-emerald-900/70 bg-emerald-950/20 text-emerald-100'
          }`}
        >
          <div className="flex items-start gap-3">
            {resumoStatusOperacional.naoProntosAf > 0 ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <div>
              <p className="font-semibold">
                {resumoStatusOperacional.naoProntosAf > 0
                  ? 'Existem relatórios que ainda não estão prontos para AF.'
                  : 'Todos os relatórios exibidos estão prontos para AF.'}
              </p>
              <p className="mt-1 opacity-90">
                {formatNumber(resumoStatusOperacional.prontosAf)} pronto(s) para AF e {formatNumber(resumoStatusOperacional.naoProntosAf)} pendente(s) de atenção no filtro atual.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Atalhos de conferência rápida</h2>
            <p className="mt-1 text-sm text-slate-400">
              Clique em um status para filtrar rapidamente os relatórios já exibidos pelos filtros atuais.
            </p>
          </div>

          {atalhoConferencia !== 'todos' ? (
            <button
              type="button"
              onClick={() => setAtalhoConferencia('todos')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar atalho
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {atalhosConferencia.map((atalho) => {
            const ativo = atalhoConferencia === atalho.id

            return (
              <button
                key={atalho.id}
                type="button"
                onClick={() => aplicarAtalhoConferencia(atalho.id)}
                className={`rounded-2xl border p-4 text-left transition ${atalho.classes} ${
                  ativo ? 'ring-2 ring-violet-400/70' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{atalho.titulo}</p>
                    <p className="mt-1 text-xs leading-5 opacity-80">{atalho.descricao}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-bold">
                    {formatNumber(atalho.valor)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>


      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Filtros dos relatórios</h2>
            <p className="mt-1 text-sm text-slate-400">
              {formatNumber(relatoriosFiltrados.length)} relatório(s) exibido(s) · {filtrosAtivos} filtro(s) ativo(s)
            </p>
          </div>

          <button
            type="button"
            onClick={limparFiltros}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar filtros
          </button>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-3 2xl:grid-cols-[minmax(320px,1.4fr)_minmax(170px,200px)_minmax(170px,200px)_minmax(210px,240px)_minmax(210px,240px)_minmax(170px,200px)]">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por arquivo, classificação, status ou caminho..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-500"
            />
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

          <select
            value={anoFiltro}
            onChange={(event) => setAnoFiltro(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-violet-500"
          >
            <option value="todos">Todos os anos</option>
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>

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
              <option value="aguardando_processamento">Aguardando processamento</option>
              <option value="em_processamento">Em processamento</option>
              <option value="importado">Importado</option>
              <option value="erro">Erro</option>
              <option value="rejeitado">Rejeitado</option>
            </select>
          </div>

          <select
            value={classificacaoFiltro}
            onChange={(event) => setClassificacaoFiltro(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-violet-500"
          >
            <option value="todos">Todas as classificações</option>
            {classificacoesDisponiveis.map((classificacao) => (
              <option key={classificacao} value={classificacao}>
                {classificacao}
              </option>
            ))}
          </select>
        </div>

        <label className="mt-4 inline-flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-900">
          <input
            type="checkbox"
            checked={somenteDivergentes}
            onChange={(event) => setSomenteDivergentes(event.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-violet-500"
          />
          Mostrar somente relatórios com divergência
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-sm">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-base font-semibold text-white">
            Lista de relatórios PDF
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Abra os detalhes, acesse o PDF original ou exporte o resultado filtrado para conferência.
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
          <SyncedTableScroll minWidth={2320}>
            <table className="w-full min-w-[2320px] text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Arquivo</th>
                  <th className="px-5 py-3">Mês</th>
                  <th className="px-5 py-3">Classificação</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Conferência</th>
                  <th className="px-5 py-3">Fila n8n/IA</th>
                  <th className="px-5 py-3">AF</th>
                  <th className="px-5 py-3 text-right">Leituras</th>
                  <th className="px-5 py-3 text-right">P/B</th>
                  <th className="px-5 py-3 text-right">Cor</th>
                  <th className="px-5 py-3 text-right">Total páginas</th>
                  <th className="px-5 py-3 text-right">Bruto PDF</th>
                  <th className="px-5 py-3 text-right">Retenção</th>
                  <th className="px-5 py-3 text-right">Líquido/NF</th>
                  <th className="px-5 py-3 text-right">Calculado</th>
                  <th className="px-5 py-3 text-right">Diferença</th>
                  <th className="px-5 py-3">Importado em</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {relatoriosFiltrados.map((relatorio) => {
                  const diferenca = relatorio.valorCalculado - relatorio.valorBruto
                  const temDivergencia = relatorioTemDivergencia(relatorio)
                  const pdfEmAcao = pdfEmAcaoId === relatorio.id

                  return (
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

                            {relatorio.filaId && (
                              <p className="mt-1 text-xs text-slate-500">
                                Fila: {getStatusLabel(relatorio.filaStatus ?? relatorio.status)}
                                {relatorio.filaEtapaAtual ? ` • ${relatorio.filaEtapaAtual}` : ''}
                              </p>
                            )}

                            {getProntoAfRelatorio(relatorio).pronto ? (
                              <p className="mt-1 text-xs font-semibold text-emerald-300">
                                Pronto para gerar AF
                              </p>
                            ) : temDivergencia ? (
                              <p className="mt-1 text-xs font-semibold text-amber-300">
                                Possui divergência em leitura ou valor
                              </p>
                            ) : null}
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

                      <td className="px-5 py-4">
                        <ConferenciaBadge relatorio={relatorio} />
                      </td>

                      <td className="px-5 py-4">
                        <FilaStatusBadge relatorio={relatorio} />
                      </td>

                      <td className="px-5 py-4">
                        <ProntoAfBadge relatorio={relatorio} />
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

                      <td className="px-5 py-4 text-right text-slate-300">
                        {formatCurrency(relatorio.valorBruto)}
                      </td>

                      <td className="px-5 py-4 text-right text-slate-300">
                        {formatCurrency(relatorio.retencao)}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-emerald-300">
                        {formatCurrency(relatorio.valorLiquido)}
                      </td>

                      <td className="px-5 py-4 text-right text-slate-300">
                        {formatCurrency(relatorio.valorCalculado)}
                      </td>

                      <td
                        className={`px-5 py-4 text-right font-semibold ${
                          Math.abs(diferenca) > 0.05 ? 'text-amber-300' : 'text-emerald-300'
                        }`}
                      >
                        {formatCurrency(diferenca)}
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {formatarDataHora(relatorio.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
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

                          <button
                            type="button"
                            disabled={!relatorio.arquivoPath || pdfEmAcao}
                            onClick={(event) => {
                              event.stopPropagation()
                              void abrirPdfOriginal(relatorio)
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {pdfEmAcao ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                            PDF
                          </button>

                          <button
                            type="button"
                            disabled={!relatorio.arquivoPath || pdfEmAcao}
                            onClick={(event) => {
                              event.stopPropagation()
                              void baixarPdfOriginal(relatorio)
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Download className="h-4 w-4" />
                            Baixar
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void abrirHistoricoRelatorio(relatorio)
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                            title="Ver histórico da fila e auditoria deste relatório"
                          >
                            <History className="h-4 w-4" />
                            Histórico
                          </button>

                          <button
                            type="button"
                            disabled={relatorio.itensAf.length === 0}
                            onClick={(event) => {
                              event.stopPropagation()
                              abrirModalItensAf(relatorio)
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-800/80 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                            title={relatorio.itensAf.length > 0 ? 'Ver itens consolidados para enviar ao Compras' : 'Sem itens consolidados para AF'}
                          >
                            <FileText className="h-4 w-4" />
                            Itens AF
                          </button>

                          <button
                            type="button"
                            disabled={!relatorio.filaId || filaEmAcaoId === relatorio.filaId}
                            onClick={(event) => {
                              event.stopPropagation()
                              void executarReprocessamento(relatorio)
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-amber-800/80 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                            title={relatorio.filaId ? 'Enviar este PDF novamente para a fila n8n/IA' : 'Sem fila vinculada'}
                          >
                            {filaEmAcaoId === relatorio.filaId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                            Reprocessar
                          </button>

                          <button
                            type="button"
                            disabled={!podeCancelarFila(relatorio) || filaEmAcaoId === relatorio.filaId}
                            onClick={(event) => {
                              event.stopPropagation()
                              void executarCancelamento(relatorio)
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-900/80 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                            title={relatorio.filaId ? 'Cancelar o processamento deste PDF na fila' : 'Sem fila vinculada'}
                          >
                            {filaEmAcaoId === relatorio.filaId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            Cancelar
                          </button>


                          <button
                            type="button"
                            disabled={relatorioExcluindoId === relatorio.id}
                            onClick={(event) => {
                              event.stopPropagation()
                              void executarExclusaoRelatorio(relatorio)
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-700 bg-red-950/20 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Excluir relatório lançado errado com snapshot de auditoria"
                          >
                            {relatorioExcluindoId === relatorio.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </SyncedTableScroll>
        )}
      </section>

      {modalExcluidosAberto ? (
        <RelatoriosExcluidosModal
          logs={relatoriosExcluidos}
          selecionado={exclusaoSelecionada}
          carregando={excluidosCarregando}
          erro={excluidosErro}
          onSelecionar={setExclusaoSelecionada}
          onAtualizar={() => void carregarRelatoriosExcluidos()}
          onFechar={fecharModalRelatoriosExcluidos}
        />
      ) : null}

      {modalHistoricoAberto && historicoRelatorio ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-[min(96vw,1400px)] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-violet-300">Histórico do relatório</p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {historicoRelatorio.nomeArquivo}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Acompanhe o vínculo com a fila n8n/IA, status, tentativas, payloads e auditoria do relatório.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModalHistorico}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status relatório</p>
                  <div className="mt-2">
                    <StatusBadge status={historicoRelatorio.status} />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fila n8n/IA</p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">
                    {historicoRelatorio.filaId ? historicoRelatorio.filaId.slice(0, 8) : 'Sem fila vinculada'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Etapa atual</p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">
                    {historicoRelatorio.filaEtapaAtual ?? 'Não informado'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Atualizado em</p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">
                    {historicoRelatorio.filaUpdatedAt
                      ? formatarDataHora(historicoRelatorio.filaUpdatedAt)
                      : 'Não informado'}
                  </p>
                </div>
              </div>

              {historicoCarregando ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-5 text-sm text-slate-300">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  Carregando histórico da fila e auditoria...
                </div>
              ) : null}

              {historicoErro ? (
                <div className="rounded-2xl border border-red-900/70 bg-red-950/30 px-4 py-4 text-sm text-red-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Não foi possível carregar o histórico completo</p>
                      <p className="mt-1 leading-6">{historicoErro}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {!historicoCarregando && !historicoErro ? (
                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-white">Histórico da fila n8n/IA</h3>
                        <p className="mt-1 text-xs text-slate-400">
                          Mostra as reservas, reprocessamentos, payloads e erro registrado para este PDF.
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                        {historicoDetalhe?.filas.length ?? 0} registro(s)
                      </span>
                    </div>

                    {historicoDetalhe?.filas.length ? (
                      <div className="space-y-3">
                        {historicoDetalhe.filas.map((fila) => (
                          <div key={fila.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-100">
                                  {fila.nomeArquivo ?? historicoRelatorio.nomeArquivo}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">ID: {fila.id}</p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <StatusBadge status={fila.statusProcessamento ?? 'sem_status'} />
                                <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                                  Tentativas: {fila.tentativas}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 text-xs text-slate-300 md:grid-cols-2">
                              <p><span className="text-slate-500">Etapa:</span> {fila.etapaAtual ?? 'Não informado'}</p>
                              <p><span className="text-slate-500">Criado em:</span> {fila.createdAt ? formatarDataHora(fila.createdAt) : 'Não informado'}</p>
                              <p><span className="text-slate-500">Atualizado em:</span> {fila.updatedAt ? formatarDataHora(fila.updatedAt) : 'Não informado'}</p>
                              <p><span className="text-slate-500">Rejeitado em:</span> {fila.rejeitadoEm ? formatarDataHora(fila.rejeitadoEm) : 'Não rejeitado'}</p>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${fila.temPayloadExtraido ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300' : 'border-slate-700 bg-slate-950 text-slate-400'}`}>
                                {fila.temPayloadExtraido ? 'Payload extraído' : 'Sem payload extraído'}
                              </span>
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${fila.temPayloadNormalizado ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300' : 'border-slate-700 bg-slate-950 text-slate-400'}`}>
                                {fila.temPayloadNormalizado ? 'Payload normalizado' : 'Sem payload normalizado'}
                              </span>
                            </div>

                            {fila.erroMensagem ? (
                              <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/20 px-3 py-3 text-xs text-red-200">
                                <p className="font-semibold">Erro registrado</p>
                                <p className="mt-1 leading-5">{fila.erroMensagem}</p>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-400">
                        Nenhum registro de fila encontrado para este relatório.
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-white">Auditoria</h3>
                        <p className="mt-1 text-xs text-slate-400">
                          Eventos gravados para rastrear aprovação, rejeição, reprocessamento e outras ações.
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                        {historicoDetalhe?.auditorias.length ?? 0} evento(s)
                      </span>
                    </div>

                    {historicoDetalhe?.auditorias.length ? (
                      <div className="space-y-3">
                        {historicoDetalhe.auditorias.map((evento) => (
                          <div key={evento.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-100">
                                  {evento.acao ?? 'Ação não informada'}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {evento.entidade ?? 'entidade'} · {evento.createdAt ? formatarDataHora(evento.createdAt) : 'Data não informada'}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-[11px] leading-5 text-slate-400">
                              <p><span className="font-semibold text-slate-300">Antes:</span> {resumirJsonAuditoria(evento.antesJson)}</p>
                              <p className="mt-2"><span className="font-semibold text-slate-300">Depois:</span> {resumirJsonAuditoria(evento.depoisJson)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-400">
                        Nenhum evento de auditoria encontrado para este relatório.
                      </div>
                    )}
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {modalItensAfAberto && relatorioItensAf ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-[min(96vw,1600px)] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950">
            <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-300">Relatório para Compras</p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  Itens para emissão da AF
                </h2>
                <p className="mt-2 max-w-[min(96vw,920px)] text-sm leading-6 text-slate-400">
                  Use esta prévia para enviar ao setor de Compras os itens consolidados de locação e páginas impressas. Este relatório não substitui a AF oficial do sistema de compras.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => exportarItensAfCsv(relatorioItensAf)}
                  disabled={relatorioItensAf.itensAf.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileDown className="h-4 w-4" />
                  Exportar CSV
                </button>

                <button
                  type="button"
                  onClick={() => imprimirItensAf(relatorioItensAf)}
                  disabled={relatorioItensAf.itensAf.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  Imprimir
                </button>

                <button
                  type="button"
                  onClick={fecharModalItensAf}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secretaria/Classificação</p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">
                    {relatorioItensAf.classificacaoAf ?? 'Não informado'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mês referência</p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">
                    {formatarMesReferencia(relatorioItensAf.mesReferencia)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contrato</p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">
                    {data?.contrato.numeroContrato ?? '183/2024'}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-900/70 bg-emerald-950/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Total dos itens</p>
                  <p className="mt-2 text-xl font-bold text-emerald-100">
                    {formatCurrency(getTotalItensAf(relatorioItensAf.itensAf))}
                  </p>
                </div>
              </div>

              {!getProntoAfRelatorio(relatorioItensAf).pronto ? (
                <div className="rounded-2xl border border-amber-900/70 bg-amber-950/30 px-4 py-4 text-sm text-amber-100">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Atenção antes de enviar ao Compras</p>
                      <p className="mt-1 leading-6">{getProntoAfRelatorio(relatorioItensAf).descricao}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">Itens para lançamento no Compras</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Consolidação por consumo e locação: laser P/B, tanque/jato P/B, tanque/jato colorida, duplicação e locações por modelo.
                    </p>
                  </div>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
                    {relatorioItensAf.itensAf.length} item(ns)
                  </span>
                </div>

                {relatorioItensAf.itensAf.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-400">
                    Nenhum item consolidado foi encontrado. Confira se as leituras deste relatório possuem modelo do equipamento vinculado.
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="min-w-[980px] w-full text-left text-sm">
                      <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Código</th>
                          <th className="px-4 py-3">Descrição do item</th>
                          <th className="px-4 py-3">Unid.</th>
                          <th className="px-4 py-3 text-right">Qtd</th>
                          <th className="px-4 py-3 text-right">Valor unit.</th>
                          <th className="px-4 py-3 text-right">Valor total</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-800">
                        {relatorioItensAf.itensAf.map((item) => (
                          <tr key={`${item.categoria}-${item.codigo}-${item.descricao}`} className="hover:bg-slate-800/40">
                            <td className="px-4 py-3">
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${item.categoria === 'locacao' ? 'border-blue-800 bg-blue-950/40 text-blue-200' : 'border-violet-800 bg-violet-950/40 text-violet-200'}`}>
                                {item.categoria === 'locacao' ? 'Locação' : 'Consumo'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-300">{item.codigo}</td>
                            <td className="px-4 py-3 font-medium text-slate-100">{item.descricao}</td>
                            <td className="px-4 py-3 text-slate-300">{item.unidade}</td>
                            <td className="px-4 py-3 text-right text-slate-300">{formatarQuantidadeItemAf(item.quantidade)}</td>
                            <td className="px-4 py-3 text-right text-slate-300">{formatCurrency(item.valorUnitario)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-300">{formatCurrency(item.valorTotal)}</td>
                          </tr>
                        ))}
                      </tbody>

                      <tfoot className="border-t border-slate-700 bg-slate-950/80">
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-right text-sm font-bold text-slate-100">
                            TOTAL DOS ITENS
                          </td>
                          <td className="px-4 py-4 text-right text-base font-bold text-emerald-300">
                            {formatCurrency(getTotalItensAf(relatorioItensAf.itensAf))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {modalUploadAberto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-[min(96vw,920px)] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950">
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
