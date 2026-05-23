import { supabase } from '../lib/supabaseClient'
import type {
    RelatorioPdfItem,
    RelatoriosPdfResponse,
    RelatoriosPdfResumo,
    RelatoriosPdfFilaItemResumo,
    RelatoriosPdfFilaResumo,
    RelatorioPdfItemAf,
} from '../types/relatoriosPdf'

type ContratoBasico = {
    id: string
    numero_contrato: string
    fornecedor: string
    status?: string | null
}

type RelatorioPdfRow = {
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
    created_at: string
}

type LeituraMensalRow = {
    id: string
    relatorio_id: string
    modelo_texto_pdf: string | null
    saldo_pb: number | string | null
    saldo_cor: number | string | null
    divergente: boolean | null
}

type FilaProcessamentoRow = {
    id: string
    contrato_id?: string | null
    relatorio_pdf_id: string | null
    nome_arquivo: string | null
    arquivo_path: string | null
    hash_arquivo?: string | null
    mes_referencia?: string | null
    classificacao_af?: string | null
    status_processamento: string | null
    etapa_atual: string | null
    erro_mensagem: string | null
    tentativas?: number | string | null
    payload_extraido?: unknown | null
    payload_normalizado?: unknown | null
    created_at?: string | null
    updated_at: string | null
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


type ModeloAfKey =
    | 'DCP-T820'
    | 'DCP-L5652 DN'
    | 'MFC-L6912DW'
    | 'HLL6402DW'
    | 'SF-5230'
    | 'HLT4000DW'
    | 'MFC-T4500'
    | 'ADS-4900 W'

const MODELOS_LASER_PB: ModeloAfKey[] = ['DCP-L5652 DN', 'MFC-L6912DW', 'HLL6402DW']
const MODELOS_TANQUE_TINTA: ModeloAfKey[] = ['DCP-T820', 'HLT4000DW', 'MFC-T4500']

const LOCACOES_POR_MODELO: Record<ModeloAfKey, { codigo: string; descricao: string; valorUnitario: number }> = {
    'DCP-T820': {
        codigo: '018.008.081',
        descricao: 'LOCAÇÃO DE MULTIFUNCIONAL TANQUE TINTA A4',
        valorUnitario: 134,
    },
    'DCP-L5652 DN': {
        codigo: '018.008.078',
        descricao: 'LOCAÇÃO DE MULTIFUNCIONAL LASER MONOCROMÁTICO A4 TIPO I',
        valorUnitario: 228,
    },
    'MFC-L6912DW': {
        codigo: '018.008.079',
        descricao: 'LOCAÇÃO DE MULTIFUNCIONAL LASER MONOCROMÁTICO A4 TIPO II',
        valorUnitario: 417,
    },
    HLL6402DW: {
        codigo: '018.008.080',
        descricao: 'LOCAÇÃO DE IMPRESSORA LASER MONOCROMÁTICO A4',
        valorUnitario: 180,
    },
    'SF-5230': {
        codigo: '018.008.084',
        descricao: 'LOCAÇÃO DE DUPLICADOR DIGITAL',
        valorUnitario: 2145,
    },
    HLT4000DW: {
        codigo: '018.008.083',
        descricao: 'LOCAÇÃO DE IMPRESSORA TANQUE TINTA A3',
        valorUnitario: 220,
    },
    'MFC-T4500': {
        codigo: '018.008.082',
        descricao: 'LOCAÇÃO DE MULTIFUNCIONAL TANQUE TINTA A3',
        valorUnitario: 470,
    },
    'ADS-4900 W': {
        codigo: '018.008.085',
        descricao: 'LOCAÇÃO DE SCANNER DE PRODUÇÃO',
        valorUnitario: 545,
    },
}

function arredondarMoeda(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

function normalizarModeloTexto(modelo: string | null | undefined): string {
    return String(modelo ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .trim()
}

function identificarModeloAf(modelo: string | null | undefined): ModeloAfKey | null {
    const texto = normalizarModeloTexto(modelo)

    if (texto.includes('DCP-T820')) return 'DCP-T820'
    if (texto.includes('DCP-L5652')) return 'DCP-L5652 DN'
    if (texto.includes('MFC-L6912')) return 'MFC-L6912DW'
    if (texto.includes('HLL6402')) return 'HLL6402DW'
    if (texto.includes('SF-5230')) return 'SF-5230'
    if (texto.includes('HLT4000')) return 'HLT4000DW'
    if (texto.includes('MFC-T4500')) return 'MFC-T4500'
    if (texto.includes('ADS-4900')) return 'ADS-4900 W'

    return null
}

function criarItemAf(
    codigo: string,
    descricao: string,
    quantidade: number,
    valorUnitario: number,
    categoria: 'consumo' | 'locacao',
): RelatorioPdfItemAf | null {
    if (quantidade <= 0) return null

    return {
        codigo,
        descricao,
        unidade: 'UN',
        quantidade,
        valorUnitario,
        valorTotal: arredondarMoeda(quantidade * valorUnitario),
        categoria,
    }
}

function montarItensAfPorLeituras(leituras: LeituraMensalRow[]): RelatorioPdfItemAf[] {
    let paginasLaserPb = 0
    let paginasTanquePb = 0
    let paginasTanqueColoridas = 0
    let duplicacoes = 0
    const locacoesPorModelo = new Map<ModeloAfKey, number>()

    for (const leitura of leituras) {
        const modelo = identificarModeloAf(leitura.modelo_texto_pdf)
        const saldoPb = toNumber(leitura.saldo_pb)
        const saldoCor = toNumber(leitura.saldo_cor)

        if (!modelo) continue

        locacoesPorModelo.set(modelo, (locacoesPorModelo.get(modelo) ?? 0) + 1)

        if (MODELOS_LASER_PB.includes(modelo)) {
            paginasLaserPb += saldoPb
        }

        if (MODELOS_TANQUE_TINTA.includes(modelo)) {
            paginasTanquePb += saldoPb
            paginasTanqueColoridas += saldoCor
        }

        if (modelo === 'SF-5230') {
            duplicacoes += saldoPb
        }
    }

    const itens: RelatorioPdfItemAf[] = []
    const itensConsumo = [
        criarItemAf(
            '018.000.033',
            'CÓPIAS/IMPRESSÃO MONOCROMÁTICAS LASER A4',
            paginasLaserPb,
            0.1,
            'consumo',
        ),
        criarItemAf(
            '018.000.034',
            'CÓPIAS/IMPRESSÃO MONOCROMÁTICA A4 TANQUE TINTA',
            paginasTanquePb,
            0.1,
            'consumo',
        ),
        criarItemAf(
            '018.000.035',
            'CÓPIAS/IMPRESSÃO POLICROMÁTICA A4 TANQUE TINTA',
            paginasTanqueColoridas,
            0.21,
            'consumo',
        ),
        criarItemAf('018.000.036', 'DUPLICAÇÃO DE DOCUMENTOS', duplicacoes, 0.04, 'consumo'),
    ]

    for (const item of itensConsumo) {
        if (item) itens.push(item)
    }

    const ordemLocacao: ModeloAfKey[] = [
        'DCP-T820',
        'DCP-L5652 DN',
        'MFC-L6912DW',
        'HLL6402DW',
        'SF-5230',
        'HLT4000DW',
        'MFC-T4500',
        'ADS-4900 W',
    ]

    for (const modelo of ordemLocacao) {
        const quantidade = locacoesPorModelo.get(modelo) ?? 0
        const locacao = LOCACOES_POR_MODELO[modelo]
        const item = criarItemAf(
            locacao.codigo,
            locacao.descricao,
            quantidade,
            locacao.valorUnitario,
            'locacao',
        )

        if (item) itens.push(item)
    }

    return itens
}

async function getContratoPadrao(): Promise<ContratoBasico> {
    const contratoNumero = import.meta.env.VITE_PRINTCONTROL_CONTRATO_NUMERO || '183/2024'
    const numeroLimpo = contratoNumero.trim()

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
        throw new Error(`Erro ao buscar contrato padrão: ${error.message}`)
    }

    const contratos = (data ?? []) as unknown as ContratoBasico[]

    if (contratos.length === 0) {
        throw new Error(
            `Contrato ${numeroLimpo} não ficou visível para o usuário atual. Verifique login e políticas RLS.`,
        )
    }

    return contratos[0]
}

function montarResumo(relatorios: RelatorioPdfItem[]): RelatoriosPdfResumo {
    return relatorios.reduce<RelatoriosPdfResumo>(
        (acc, relatorio) => {
            acc.totalRelatorios += 1
            acc.totalLeituras += relatorio.totalLeituras
            acc.paginasPb += relatorio.paginasPb
            acc.paginasColoridas += relatorio.paginasColoridas
            acc.totalPaginas += relatorio.totalPaginas
            acc.valorBruto += relatorio.valorBruto
            acc.retencao += relatorio.retencao
            acc.valorLiquido += relatorio.valorLiquido

            if (relatorio.status === 'aprovado') {
                acc.totalAprovados += 1
            } else if (relatorio.status === 'erro' || relatorio.status === 'rejeitado') {
                acc.totalComErro += 1
            } else {
                acc.totalPendentes += 1
            }

            return acc
        },
        {
            totalRelatorios: 0,
            totalAprovados: 0,
            totalPendentes: 0,
            totalComErro: 0,
            totalLeituras: 0,
            paginasPb: 0,
            paginasColoridas: 0,
            totalPaginas: 0,
            valorBruto: 0,
            retencao: 0,
            valorLiquido: 0,
        },
    )
}


function normalizarFilaResumo(fila: FilaProcessamentoRow): RelatoriosPdfFilaItemResumo {
    return {
        id: fila.id,
        relatorioPdfId: fila.relatorio_pdf_id ?? null,
        nomeArquivo: fila.nome_arquivo ?? extrairNomeArquivo(fila.arquivo_path ?? null),
        arquivoPath: fila.arquivo_path ?? null,
        hashArquivo: fila.hash_arquivo ?? null,
        mesReferencia: fila.mes_referencia ?? null,
        classificacaoAf: fila.classificacao_af ?? null,
        statusProcessamento: fila.status_processamento ?? 'sem_status',
        etapaAtual: fila.etapa_atual ?? null,
        erroMensagem: fila.erro_mensagem ?? null,
        tentativas: toNumber(fila.tentativas),
        temPayloadExtraido: Boolean(fila.payload_extraido),
        temPayloadNormalizado: Boolean(fila.payload_normalizado),
        createdAt: fila.created_at ?? null,
        updatedAt: fila.updated_at ?? null,
    }
}

function criarFilaResumo(filas: FilaProcessamentoRow[]): RelatoriosPdfFilaResumo {
    const itens = filas.map(normalizarFilaResumo)

    const porCreatedDesc = [...itens].sort((a, b) => {
        const dataA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dataB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dataB - dataA
    })

    const pendentes = itens
        .filter((item) => item.statusProcessamento === 'aguardando_processamento')
        .sort((a, b) => {
            const dataA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const dataB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return dataA - dataB
        })

    return itens.reduce<RelatoriosPdfFilaResumo>(
        (acc, item) => {
            acc.totalNaFila += 1

            if (item.statusProcessamento === 'aguardando_processamento') {
                acc.totalAguardando += 1
            } else if (
                ['em_processamento', 'extraido', 'normalizado', 'validado'].includes(
                    item.statusProcessamento,
                )
            ) {
                acc.totalEmProcessamento += 1
            } else if (item.statusProcessamento === 'importado') {
                acc.totalImportados += 1
            } else if (item.statusProcessamento === 'aprovado') {
                acc.totalAprovados += 1
            } else if (item.statusProcessamento === 'erro') {
                acc.totalComErro += 1
            } else if (item.statusProcessamento === 'rejeitado') {
                acc.totalRejeitados += 1
            }

            return acc
        },
        {
            totalNaFila: 0,
            totalAguardando: 0,
            totalEmProcessamento: 0,
            totalImportados: 0,
            totalAprovados: 0,
            totalComErro: 0,
            totalRejeitados: 0,
            ultimoPdfEnviado: porCreatedDesc[0] ?? null,
            proximoPdfPendente: pendentes[0] ?? null,
        },
    )
}

export async function listarRelatoriosPdf(): Promise<RelatoriosPdfResponse> {
    const contrato = await getContratoPadrao()

    const { data: relatoriosRaw, error: relatoriosError } = await supabase
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
        created_at
      `,
        )
        .eq('contrato_id', contrato.id)
        .order('mes_referencia', { ascending: false })
        .order('created_at', { ascending: false })

    if (relatoriosError) {
        throw new Error(`Erro ao listar relatórios PDF: ${relatoriosError.message}`)
    }

    const relatoriosBanco = (relatoriosRaw ?? []) as unknown as RelatorioPdfRow[]
    const relatorioIds = relatoriosBanco.map((relatorio) => relatorio.id)

    let leiturasBanco: LeituraMensalRow[] = []

    if (relatorioIds.length > 0) {
        const { data: leiturasRaw, error: leiturasError } = await supabase
            .from('leituras_mensais')
            .select('id, relatorio_id, modelo_texto_pdf, saldo_pb, saldo_cor, divergente')
            .in('relatorio_id', relatorioIds)

        if (leiturasError) {
            throw new Error(`Erro ao buscar leituras dos relatórios: ${leiturasError.message}`)
        }

        leiturasBanco = (leiturasRaw ?? []) as unknown as LeituraMensalRow[]
    }

    let filasBanco: FilaProcessamentoRow[] = []

    const { data: filasRaw, error: filasError } = await supabase
        .from('fila_processamento_pdfs')
        .select(
            `
            id,
            contrato_id,
            relatorio_pdf_id,
            nome_arquivo,
            arquivo_path,
            hash_arquivo,
            mes_referencia,
            classificacao_af,
            status_processamento,
            etapa_atual,
            erro_mensagem,
            tentativas,
            payload_extraido,
            payload_normalizado,
            created_at,
            updated_at
            `,
        )
        .eq('contrato_id', contrato.id)
        .order('created_at', { ascending: false })
        .limit(500)

    if (!filasError) {
        filasBanco = (filasRaw ?? []) as unknown as FilaProcessamentoRow[]
    }

    if (filasError && relatorioIds.length > 0) {
        const { data: filasPorRelatorioRaw, error: filasPorRelatorioError } = await supabase
            .from('fila_processamento_pdfs')
            .select(
                `
                id,
                relatorio_pdf_id,
                nome_arquivo,
                arquivo_path,
                status_processamento,
                etapa_atual,
                erro_mensagem,
                tentativas,
                payload_extraido,
                payload_normalizado,
                created_at,
                updated_at
                `,
            )
            .in('relatorio_pdf_id', relatorioIds)
            .order('created_at', { ascending: false })

        if (!filasPorRelatorioError) {
            filasBanco = (filasPorRelatorioRaw ?? []) as unknown as FilaProcessamentoRow[]
        }
    }

    const filaPorRelatorio = new Map<string, FilaProcessamentoRow>()

    for (const fila of filasBanco) {
        if (fila.relatorio_pdf_id && !filaPorRelatorio.has(fila.relatorio_pdf_id)) {
            filaPorRelatorio.set(fila.relatorio_pdf_id, fila)
        }
    }

    const leiturasPorRelatorio = new Map<
        string,
        {
            totalLeituras: number
            paginasPb: number
            paginasColoridas: number
            possuiDivergencia: boolean
            leituras: LeituraMensalRow[]
        }
    >()

    for (const leitura of leiturasBanco) {
        const atual =
            leiturasPorRelatorio.get(leitura.relatorio_id) ?? {
                totalLeituras: 0,
                paginasPb: 0,
                paginasColoridas: 0,
                possuiDivergencia: false,
                leituras: [],
            }

        atual.totalLeituras += 1
        atual.paginasPb += toNumber(leitura.saldo_pb)
        atual.paginasColoridas += toNumber(leitura.saldo_cor)
        atual.possuiDivergencia = atual.possuiDivergencia || Boolean(leitura.divergente)
        atual.leituras.push(leitura)

        leiturasPorRelatorio.set(leitura.relatorio_id, atual)
    }

    const relatorios: RelatorioPdfItem[] = relatoriosBanco.map((relatorio) => {
        const resumoLeituras =
            leiturasPorRelatorio.get(relatorio.id) ?? {
                totalLeituras: 0,
                paginasPb: 0,
                paginasColoridas: 0,
                possuiDivergencia: false,
                leituras: [],
            }
        const fila = filaPorRelatorio.get(relatorio.id)
        const itensAf = montarItensAfPorLeituras(resumoLeituras.leituras)
        const totalItensAf = itensAf.reduce((total, item) => total + item.valorTotal, 0)

        return {
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
            totalLeituras: resumoLeituras.totalLeituras,
            paginasPb: resumoLeituras.paginasPb,
            paginasColoridas: resumoLeituras.paginasColoridas,
            totalPaginas: resumoLeituras.paginasPb + resumoLeituras.paginasColoridas,
            possuiDivergencia: resumoLeituras.possuiDivergencia,
            createdAt: relatorio.created_at,
            itensAf,
            totalItensAf: arredondarMoeda(totalItensAf),
            filaId: fila?.id ?? null,
            filaStatus: fila?.status_processamento ?? null,
            filaEtapaAtual: fila?.etapa_atual ?? null,
            filaErroMensagem: fila?.erro_mensagem ?? null,
            filaUpdatedAt: fila?.updated_at ?? null,
        }
    })

    return {
        contrato: {
            id: contrato.id,
            numeroContrato: contrato.numero_contrato,
            fornecedor: contrato.fornecedor,
        },
        resumo: montarResumo(relatorios),
        relatorios,
        filaResumo: criarFilaResumo(filasBanco),
    }
}