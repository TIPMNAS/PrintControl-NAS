import { supabase } from '../lib/supabaseClient'
import type {
  RelatorioDetalheDivergencia,
  RelatorioDetalheLeitura,
  RelatorioDetalheResponse,
} from '../types/relatorioDetalhe'

type SupabaseLooseClient = {
  from: (table: string) => any
}

const db = supabase as unknown as SupabaseLooseClient

type RelatorioRow = {
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
  json_extraido: unknown
  created_at: string
}

type LeituraRow = {
  id: string
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
  divergente: boolean | null
}

type DivergenciaRow = {
  id: string
  tipo: string
  descricao: string
  valor_pdf: string | null
  valor_calculado: string | null
  resolvida: boolean | null
  created_at: string
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

function normalizarLeitura(row: LeituraRow): RelatorioDetalheLeitura {
  return {
    id: row.id,
    equipamentoId: row.equipamento_id,
    modelo: row.modelo_texto_pdf,
    serie: row.serie_texto_pdf,
    site: row.site_texto_pdf,
    departamento: row.depto_texto_pdf,
    antPb: toNumber(row.ant_pb),
    atuPb: toNumber(row.atu_pb),
    saldoPb: toNumber(row.saldo_pb),
    antCor: toNumber(row.ant_cor),
    atuCor: toNumber(row.atu_cor),
    saldoCor: toNumber(row.saldo_cor),
    totalGeralPdf: toNumber(row.total_geral_pdf),
    totalCalculado: toNumber(row.total_calculado),
    divergente: Boolean(row.divergente),
  }
}

function normalizarDivergencia(row: DivergenciaRow): RelatorioDetalheDivergencia {
  return {
    id: row.id,
    tipo: row.tipo,
    descricao: row.descricao,
    valorPdf: row.valor_pdf,
    valorCalculado: row.valor_calculado,
    resolvida: Boolean(row.resolvida),
    createdAt: row.created_at,
  }
}

export async function buscarRelatorioDetalhe(
  relatorioId: string,
): Promise<RelatorioDetalheResponse> {
  const { data: relatorioRaw, error: relatorioError } = await db
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
        json_extraido,
        created_at
      `,
    )
    .eq('id', relatorioId)
    .maybeSingle()

  if (relatorioError) {
    throw new Error(`Erro ao buscar relatório PDF: ${relatorioError.message}`)
  }

  if (!relatorioRaw) {
    throw new Error('Relatório PDF não encontrado ou sem permissão de acesso.')
  }

  const relatorio = relatorioRaw as RelatorioRow

  const { data: leiturasRaw, error: leiturasError } = await db
    .from('leituras_mensais')
    .select(
      `
        id,
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
        divergente
      `,
    )
    .eq('relatorio_id', relatorioId)
    .order('modelo_texto_pdf', { ascending: true })

  if (leiturasError) {
    throw new Error(`Erro ao buscar leituras do relatório: ${leiturasError.message}`)
  }

  const leituras = ((leiturasRaw ?? []) as LeituraRow[]).map(normalizarLeitura)

  let divergencias: RelatorioDetalheDivergencia[] = []

  const { data: divergenciasRaw, error: divergenciasError } = await db
    .from('divergencias_importacao')
    .select(
      `
        id,
        tipo,
        descricao,
        valor_pdf,
        valor_calculado,
        resolvida,
        created_at
      `,
    )
    .eq('relatorio_id', relatorioId)
    .order('created_at', { ascending: false })

  if (!divergenciasError) {
    divergencias = ((divergenciasRaw ?? []) as DivergenciaRow[]).map(
      normalizarDivergencia,
    )
  }

  const paginasPb = leituras.reduce((total, item) => total + item.saldoPb, 0)
  const paginasColoridas = leituras.reduce((total, item) => total + item.saldoCor, 0)
  const totalPaginas = paginasPb + paginasColoridas

  const valorItensPdf = leituras.reduce(
    (total, item) => total + item.totalGeralPdf,
    0,
  )

  const valorItensCalculado = leituras.reduce(
    (total, item) => total + item.totalCalculado,
    0,
  )

  return {
    relatorio: {
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
      jsonExtraido: relatorio.json_extraido,
      createdAt: relatorio.created_at,
    },
    resumo: {
      totalLeituras: leituras.length,
      paginasPb,
      paginasColoridas,
      totalPaginas,
      valorItensPdf,
      valorItensCalculado,
      totalDivergencias:
        divergencias.length + leituras.filter((item) => item.divergente).length,
    },
    leituras,
    divergencias,
  }
}
