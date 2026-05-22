import { supabase } from '../lib/supabaseClient'

const BUCKET_RELATORIOS_PDF = 'relatorios-impressoras-pdf'

type SupabaseError = {
  message: string
}

type ContratoBasico = {
  id: string
  numero_contrato: string
  fornecedor: string
  status?: string | null
}

export type UploadRelatorioPdfEtapa =
  | 'validando'
  | 'buscando_contrato'
  | 'calculando_hash'
  | 'enviando_storage'
  | 'registrando_fila'
  | 'concluido'

export type UploadRelatorioPdfProgresso = {
  etapa: UploadRelatorioPdfEtapa
  titulo: string
  descricao: string
  percentual: number
}

type RpcRegistrarUploadResultado = {
  ok: boolean
  duplicado?: boolean
  bloqueado_por_status_finalizado?: boolean
  mensagem?: string
  fila_id?: string
  relatorio_pdf_id?: string | null
  nome_arquivo?: string
  arquivo_path?: string
  hash_arquivo?: string
  status_processamento?: string
  etapa_atual?: string
  mes_referencia?: string
  classificacao_af?: string
  updated_at?: string
  detalhe?: string
  sqlstate?: string
  [key: string]: unknown
}

type UploadRelatorioPdfParams = {
  arquivo: File
  mesReferencia: string
  classificacaoAf: string
  observacoes?: string
  onProgresso?: (progresso: UploadRelatorioPdfProgresso) => void
}

export type UploadRelatorioPdfResultado = RpcRegistrarUploadResultado & {
  hashArquivo?: string
  arquivoPath?: string
  bucket?: string
}

type SupabaseContratoQuery = {
  or: (filters: string) => SupabaseContratoQuery
  limit: (count: number) => Promise<{
    data: ContratoBasico[] | null
    error: SupabaseError | null
  }>
}

type SupabaseFromQuery = {
  select: (columns: string) => SupabaseContratoQuery
}

type SupabaseStorageBucket = {
  upload: (
    path: string,
    file: File,
    options?: {
      cacheControl?: string
      contentType?: string
      upsert?: boolean
    },
  ) => Promise<{
    data: {
      path: string
    } | null
    error: SupabaseError | null
  }>

  remove: (
    paths: string[],
  ) => Promise<{
    data: unknown[] | null
    error: SupabaseError | null
  }>
}

type SupabaseUploadClient = {
  from: (table: string) => SupabaseFromQuery
  storage: {
    from: (bucket: string) => SupabaseStorageBucket
  }
  rpc: <T = unknown>(
    functionName: string,
    params?: Record<string, unknown>,
  ) => Promise<{
    data: T | null
    error: SupabaseError | null
  }>
}

const db = supabase as unknown as SupabaseUploadClient

function emitirProgresso(
  onProgresso: UploadRelatorioPdfParams['onProgresso'],
  progresso: UploadRelatorioPdfProgresso,
) {
  onProgresso?.(progresso)
}

function normalizarContratoParaPath(numeroContrato: string) {
  return numeroContrato
    .trim()
    .replace(/[\\/]+/g, '-')
    .replace(/[^0-9A-Za-z_-]/g, '-')
    .replace(/-+/g, '-')
}

function normalizarNomeArquivoParaPath(nomeArquivo: string) {
  const nomeLimpo = nomeArquivo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^0-9A-Za-z._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  return nomeLimpo || `relatorio-${Date.now()}.pdf`
}

function normalizarClassificacaoAf(value: string) {
  return value.trim().toUpperCase()
}

function normalizarMesReferencia(value: string) {
  const valor = value.trim()

  if (/^\d{4}-\d{2}$/.test(valor)) {
    return `${valor}-01`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return valor
  }

  throw new Error('Informe o mês de referência no formato AAAA-MM.')
}

async function calcularHashSha256(arquivo: File) {
  const buffer = await arquivo.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

async function buscarContratoPadrao(): Promise<ContratoBasico> {
  const contratoNumero = import.meta.env.VITE_PRINTCONTROL_CONTRATO_NUMERO || '183/2024'
  const numeroLimpo = contratoNumero.trim()

  const { data, error } = await db
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

  const contratos = data ?? []

  if (contratos.length === 0) {
    throw new Error(
      `Contrato ${numeroLimpo} não ficou visível para o usuário atual. Verifique login e políticas RLS.`,
    )
  }

  return contratos[0]
}

function validarArquivoPdf(arquivo: File) {
  const nomeArquivo = arquivo.name.toLowerCase()
  const tipoArquivo = arquivo.type.toLowerCase()

  if (!nomeArquivo.endsWith('.pdf')) {
    throw new Error('Selecione um arquivo PDF.')
  }

  if (tipoArquivo && tipoArquivo !== 'application/pdf') {
    throw new Error('O arquivo selecionado não parece ser um PDF válido.')
  }

  if (arquivo.size <= 0) {
    throw new Error('O arquivo PDF está vazio.')
  }

  const limiteMb = 25
  const limiteBytes = limiteMb * 1024 * 1024

  if (arquivo.size > limiteBytes) {
    throw new Error(`O PDF ultrapassa ${limiteMb} MB. Envie um arquivo menor.`)
  }
}

function montarArquivoPath(params: {
  numeroContrato: string
  mesReferencia: string
  nomeArquivo: string
}) {
  const [ano, mes] = params.mesReferencia.split('-')
  const contratoPath = normalizarContratoParaPath(params.numeroContrato)
  const nomeArquivoPath = normalizarNomeArquivoParaPath(params.nomeArquivo)

  return `contratos/${contratoPath}/${ano}/${mes}/${nomeArquivoPath}`
}

async function removerUploadDuplicadoSeNecessario(params: {
  arquivoPathEnviado: string
  arquivoPathRegistrado?: string
  duplicado?: boolean
  bloqueadoPorStatusFinalizado?: boolean
}) {
  const deveRemoverUploadExtra =
    params.duplicado === true &&
    params.bloqueadoPorStatusFinalizado === true &&
    Boolean(params.arquivoPathRegistrado) &&
    params.arquivoPathRegistrado !== params.arquivoPathEnviado

  if (!deveRemoverUploadExtra) return

  await db.storage.from(BUCKET_RELATORIOS_PDF).remove([params.arquivoPathEnviado])
}

export async function enviarRelatorioPdfParaProcessamento({
  arquivo,
  mesReferencia,
  classificacaoAf,
  observacoes,
  onProgresso,
}: UploadRelatorioPdfParams): Promise<UploadRelatorioPdfResultado> {
  emitirProgresso(onProgresso, {
    etapa: 'validando',
    titulo: 'Validando arquivo',
    descricao: 'Conferindo se o arquivo selecionado é um PDF válido.',
    percentual: 10,
  })

  validarArquivoPdf(arquivo)

  const classificacaoNormalizada = normalizarClassificacaoAf(classificacaoAf)

  if (!classificacaoNormalizada) {
    throw new Error('Informe a classificação da AF.')
  }

  const mesReferenciaNormalizado = normalizarMesReferencia(mesReferencia)

  emitirProgresso(onProgresso, {
    etapa: 'buscando_contrato',
    titulo: 'Buscando contrato',
    descricao: 'Localizando o contrato padrão para vincular o relatório.',
    percentual: 25,
  })

  const contrato = await buscarContratoPadrao()

  emitirProgresso(onProgresso, {
    etapa: 'calculando_hash',
    titulo: 'Calculando hash',
    descricao: 'Gerando a assinatura SHA-256 para bloquear duplicidades.',
    percentual: 45,
  })

  const hashArquivo = await calcularHashSha256(arquivo)

  const arquivoPath = montarArquivoPath({
    numeroContrato: contrato.numero_contrato,
    mesReferencia: mesReferenciaNormalizado,
    nomeArquivo: arquivo.name,
  })

  emitirProgresso(onProgresso, {
    etapa: 'enviando_storage',
    titulo: 'Enviando PDF',
    descricao: 'Salvando o arquivo no Supabase Storage.',
    percentual: 70,
  })

  const { error: uploadError } = await db.storage
    .from(BUCKET_RELATORIOS_PDF)
    .upload(arquivoPath, arquivo, {
      cacheControl: '3600',
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Erro ao enviar PDF para o Supabase Storage: ${uploadError.message}`)
  }

  emitirProgresso(onProgresso, {
    etapa: 'registrando_fila',
    titulo: 'Registrando na fila',
    descricao: 'Registrando o PDF para o fluxo n8n/IA processar automaticamente.',
    percentual: 90,
  })

  const { data, error } = await db.rpc<RpcRegistrarUploadResultado>(
    'rpc_registrar_upload_pdf_webapp',
    {
      p_nome_arquivo: arquivo.name,
      p_arquivo_path: arquivoPath,
      p_hash_arquivo: hashArquivo,
      p_bucket: BUCKET_RELATORIOS_PDF,
      p_contrato_id: contrato.id,
      p_mes_referencia: mesReferenciaNormalizado,
      p_classificacao_af: classificacaoNormalizada,
      p_observacoes:
        observacoes?.trim() ||
        `Upload realizado pelo WebApp para o contrato ${contrato.numero_contrato}.`,
    },
  )

  if (error) {
    throw new Error(`Erro ao registrar PDF na fila: ${error.message}`)
  }

  if (!data) {
    throw new Error('A RPC de registro do upload não retornou dados.')
  }

  if (!data.ok) {
    throw new Error(data.mensagem ?? 'Não foi possível registrar o PDF na fila.')
  }

  await removerUploadDuplicadoSeNecessario({
    arquivoPathEnviado: arquivoPath,
    arquivoPathRegistrado: data.arquivo_path,
    duplicado: data.duplicado,
    bloqueadoPorStatusFinalizado: data.bloqueado_por_status_finalizado,
  })

  emitirProgresso(onProgresso, {
    etapa: 'concluido',
    titulo: data.duplicado ? 'PDF já existente' : 'Upload concluído',
    descricao: data.mensagem ?? 'PDF registrado na fila com sucesso.',
    percentual: 100,
  })

  return {
    ...data,
    hashArquivo,
    arquivoPath: data.arquivo_path ?? arquivoPath,
    bucket: BUCKET_RELATORIOS_PDF,
  }
}
