import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
    AlertCircle,
    AlertTriangle,
    BarChart3,
    Building2,
    CheckCircle2,
    Download,
    Edit3,
    Eye,
    History,
    Layers3,
    Loader2,
    MoveRight,
    Plus,
    Printer,
    RefreshCw,
    Save,
    Search,
    X,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

type AlertaCota = 'normal' | 'atencao' | 'critico' | 'sem_cota' | 'cota_geral' | 'locacao_fixa' | 'inativo'
type ModoFormulario = 'novo' | 'editar'

type EquipamentoControle = {
    id: string
    numeroSerie: string
    modeloId: string | null
    modelo: string
    secretariaId: string | null
    secretaria: string
    setorId: string | null
    setor: string
    contratoId: string | null
    contrato: string
    status: string
    dataInstalacao: string | null
    dataRetirada: string | null
    observacoes: string | null
    valorLocacaoMensal: number
    cotaPbMensal: number
    cotaCorMensal: number
    cotaTotalMensal: number
    grupoCota: GrupoCotaContrato
    tituloGrupoCota: string
    origemCota: TipoOrigemCota
    origemCotaLabel: string
    origemCotaDescricao: string
    ultimoMesReferencia: string | null
    ultimoConsumoPb: number
    ultimoConsumoCor: number
    ultimoTotalPaginas: number
    ultimoValorCalculado: number
    percentualUsoPb: number | null
    percentualUsoCor: number | null
    percentualUsoTotal: number | null
    alerta: AlertaCota
}

type FiltrosEquipamentos = {
    busca: string
    secretaria: string
    modelo: string
    status: string
    alerta: string
}

type ModeloOpcao = {
    id: string
    modelo: string
    valorLocacaoMensal: number
    permiteCor: boolean
    tipoEquipamento: string
}

type SecretariaOpcao = {
    id: string
    nome: string
    sigla: string
}

type SetorOpcao = {
    id: string
    nome: string
    secretariaId: string | null
}

type ContratoOpcao = {
    id: string
    numeroContrato: string
    fornecedor: string
    status: string
}

type EquipamentoFormState = {
    id: string | null
    numeroSerie: string
    modeloId: string
    secretariaId: string
    setorId: string
    status: string
    dataInstalacao: string
    dataRetirada: string
    contratoId: string
    cotaPbMensal: string
    cotaCorMensal: string
    cotaTotalMensal: string
    observacoes: string
}

type MovimentacaoFormState = {
    secretariaDestinoId: string
    setorDestinoId: string
    dataMovimentacao: string
    motivo: string
    observacao: string
}

type StatusEquipamentoFormState = {
    novoStatus: string
    dataEvento: string
    motivo: string
    observacao: string
}


type CotaModeloFormState = {
    contratoId: string
    modeloId: string
    cotaPbMensal: string
    cotaCorMensal: string
    cotaTotalMensal: string
    observacoes: string
}

type GrupoCotaContrato = 'laser_pb' | 'tanque_tinta' | 'duplicacao' | 'scanner' | 'sem_regra'

type TipoOrigemCota = 'geral_tecnologia' | 'modelo_operacional' | 'individual_equipamento' | 'locacao_fixa' | 'sem_regra'

type CotaSugeridaModelo = {
    modeloId: string
    modelo: string
    grupo: GrupoCotaContrato
    tituloGrupo: string
    codigoItemPrincipal: string
    descricaoItemPrincipal: string
    quantidadeEquipamentosModelo: number
    quantidadeEquipamentosGrupo: number
    cotaPbMensal: number
    cotaCorMensal: number
    cotaTotalMensal: number
    observacao: string
    aplicavel: boolean
}

type MovimentoEquipamento = {
    id: string
    equipamentoId: string
    numeroSerie: string
    modeloNome: string
    secretariaOrigemNome: string
    setorOrigemNome: string
    secretariaDestinoNome: string
    setorDestinoNome: string
    statusOrigem: string
    statusDestino: string
    dataMovimentacao: string | null
    motivo: string
    observacao: string
    createdAt: string | null
}

type StatusEquipamentoHistorico = {
    id: string
    equipamentoId: string
    numeroSerie: string
    modeloNome: string
    statusAnterior: string
    statusNovo: string
    dataEvento: string | null
    motivo: string
    observacao: string
    createdAt: string | null
}

type LeituraEquipamentoHistorico = {
    id: string
    relatorioId: string | null
    nomeArquivo: string
    mesReferencia: string | null
    classificacaoAf: string
    statusRelatorio: string
    serieTextoPdf: string
    siteTextoPdf: string
    deptoTextoPdf: string
    antPb: number
    atuPb: number
    saldoPb: number
    antCor: number
    atuCor: number
    saldoCor: number
    totalGeralPdf: number
    totalCalculado: number
    divergente: boolean
    createdAt: string | null
}

type SupabaseUnsafe = {
    from: (table: string) => any
    rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>
}

type CardResumoProps = {
    titulo: string
    valor: string
    descricao: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    tom?: 'azul' | 'verde' | 'amarelo' | 'vermelho' | 'cinza'
}

const filtroInicial: FiltrosEquipamentos = {
    busca: '',
    secretaria: 'todos',
    modelo: 'todos',
    status: 'todos',
    alerta: 'todos',
}

const formInicial: EquipamentoFormState = {
    id: null,
    numeroSerie: '',
    modeloId: '',
    secretariaId: '',
    setorId: '',
    status: 'ativo',
    dataInstalacao: '',
    dataRetirada: '',
    contratoId: '',
    cotaPbMensal: '',
    cotaCorMensal: '',
    cotaTotalMensal: '',
    observacoes: '',
}

const movimentacaoFormInicial: MovimentacaoFormState = {
    secretariaDestinoId: '',
    setorDestinoId: '',
    dataMovimentacao: new Date().toISOString().slice(0, 10),
    motivo: '',
    observacao: '',
}

const statusFormInicial: StatusEquipamentoFormState = {
    novoStatus: 'ativo',
    dataEvento: new Date().toISOString().slice(0, 10),
    motivo: '',
    observacao: '',
}


const cotaModeloFormInicial: CotaModeloFormState = {
    contratoId: '',
    modeloId: '',
    cotaPbMensal: '',
    cotaCorMensal: '',
    cotaTotalMensal: '',
    observacoes: '',
}

const MEDIAS_MENSAIS_CONTRATO = {
    laserPb: 208500,
    tanquePb: 3567,
    tanqueCor: 2017,
    duplicacao: 80000,
}

const ITENS_CONTRATO_REFERENCIA = [
    {
        codigo: '018.000.033',
        titulo: 'Laser P/B A4',
        descricao: 'CÓPIAS/IMPRESSÃO MONOCROMÁTICAS LASER A4',
        mediaMensal: MEDIAS_MENSAIS_CONTRATO.laserPb,
        valorUnitario: 'R$ 0,10',
    },
    {
        codigo: '018.000.034',
        titulo: 'Tanque/Jato P/B',
        descricao: 'CÓPIAS/IMPRESSÃO MONOCROMÁTICA A4 TANQUE TINTA',
        mediaMensal: MEDIAS_MENSAIS_CONTRATO.tanquePb,
        valorUnitario: 'R$ 0,10',
    },
    {
        codigo: '018.000.035',
        titulo: 'Tanque/Jato Colorida',
        descricao: 'CÓPIAS/IMPRESSÃO POLICROMÁTICA A4 TANQUE TINTA',
        mediaMensal: MEDIAS_MENSAIS_CONTRATO.tanqueCor,
        valorUnitario: 'R$ 0,21',
    },
    {
        codigo: '018.000.036',
        titulo: 'Duplicação',
        descricao: 'DUPLICAÇÃO DE DOCUMENTOS',
        mediaMensal: MEDIAS_MENSAIS_CONTRATO.duplicacao,
        valorUnitario: 'R$ 0,04',
    },
]

function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>
    }

    return {}
}

function firstRelation(value: unknown): Record<string, unknown> {
    if (Array.isArray(value)) {
        return asRecord(value[0])
    }

    return asRecord(value)
}

function toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value === 'string') {
        const normalized = value.replace(/\./g, '').replace(',', '.')
        const parsed = Number(normalized)
        return Number.isFinite(parsed) ? parsed : 0
    }

    return 0
}

function toNullableNumber(value: string): number | null {
    const trimmed = value.trim()

    if (!trimmed) {
        return null
    }

    const parsed = toNumber(trimmed)
    return Number.isFinite(parsed) ? parsed : null
}

function toNullableText(value: string): string | null {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
}

function toText(value: unknown, fallback = '-'): string {
    if (typeof value === 'string' && value.trim()) {
        return value.trim()
    }

    if (typeof value === 'number') {
        return String(value)
    }

    return fallback
}

function safeId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }

    return String(Date.now())
}

function calcularPercentual(consumo: number, cota: number): number | null {
    if (!cota || cota <= 0) {
        return null
    }

    return (consumo / cota) * 100
}

function statusEquipamentoAtivo(status: string): boolean {
    const statusNormalizado = status.toLowerCase()
    return !statusNormalizado || ['ativo', 'online', 'em_uso', 'em uso'].includes(statusNormalizado)
}

function possuiCotaOperacional(cotaPbMensal: number, cotaCorMensal: number, cotaTotalMensal: number): boolean {
    return cotaPbMensal > 0 || cotaCorMensal > 0 || cotaTotalMensal > 0
}

function obterOrigemCota(
    modelo: string,
    cotaPbMensal: number,
    cotaCorMensal: number,
    cotaTotalMensal: number,
    observacoes?: string | null,
): TipoOrigemCota {
    const grupo = identificarGrupoCotaModelo(modelo)
    const temCotaOperacional = possuiCotaOperacional(cotaPbMensal, cotaCorMensal, cotaTotalMensal)
    const observacaoNormalizada = (observacoes ?? '').toLowerCase()

    if (grupo === 'scanner') {
        return 'locacao_fixa'
    }

    if (temCotaOperacional) {
        if (observacaoNormalizada.includes('individual') || observacaoNormalizada.includes('exceção') || observacaoNormalizada.includes('excecao')) {
            return 'individual_equipamento'
        }

        return 'modelo_operacional'
    }

    if (grupo !== 'sem_regra') {
        return 'geral_tecnologia'
    }

    return 'sem_regra'
}

function obterLabelOrigemCota(origem: TipoOrigemCota): string {
    const labels: Record<TipoOrigemCota, string> = {
        geral_tecnologia: 'Cota geral por tecnologia',
        modelo_operacional: 'Cota operacional por modelo',
        individual_equipamento: 'Cota individual',
        locacao_fixa: 'Locação fixa',
        sem_regra: 'Sem regra de cota',
    }

    return labels[origem]
}

function obterDescricaoOrigemCota(origem: TipoOrigemCota, grupo: GrupoCotaContrato): string {
    if (origem === 'geral_tecnologia') {
        return `O contrato é controlado pela cota geral de ${obterTituloGrupoCota(grupo)}. Este equipamento ainda não possui franquia individual.`
    }

    if (origem === 'modelo_operacional') {
        return 'Cota distribuída/aplicada por modelo para apoio aos alertas operacionais. Não significa cota individual contratual.'
    }

    if (origem === 'individual_equipamento') {
        return 'Este equipamento possui cota própria cadastrada como exceção operacional.'
    }

    if (origem === 'locacao_fixa') {
        return 'Equipamento de locação fixa, sem controle de páginas impressas.'
    }

    return 'Modelo sem regra automática de cota configurada.'
}

function calcularAlerta(status: string, percentualUsoPb: number | null, percentualUsoCor: number | null, percentualUsoTotal: number | null): AlertaCota {
    if (!statusEquipamentoAtivo(status)) {
        return 'inativo'
    }

    const percentuais = [percentualUsoPb, percentualUsoCor, percentualUsoTotal].filter((item): item is number => typeof item === 'number')

    if (percentuais.length === 0) {
        return 'sem_cota'
    }

    const maiorPercentual = Math.max(...percentuais)

    if (maiorPercentual >= 95) {
        return 'critico'
    }

    if (maiorPercentual >= 70) {
        return 'atencao'
    }

    return 'normal'
}

function calcularAlertaEquipamento(
    status: string,
    origemCota: TipoOrigemCota,
    percentualUsoPb: number | null,
    percentualUsoCor: number | null,
    percentualUsoTotal: number | null,
): AlertaCota {
    if (!statusEquipamentoAtivo(status)) {
        return 'inativo'
    }

    if (origemCota === 'locacao_fixa') {
        return 'locacao_fixa'
    }

    if (origemCota === 'geral_tecnologia') {
        return 'cota_geral'
    }

    if (origemCota === 'sem_regra') {
        return 'sem_cota'
    }

    return calcularAlerta(status, percentualUsoPb, percentualUsoCor, percentualUsoTotal)
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0)
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: 0,
    }).format(value || 0)
}

function formatPercent(value: number | null): string {
    if (value === null || !Number.isFinite(value)) {
        return 'Não individual'
    }

    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)}%`
}

function formatMonth(value: string | null): string {
    if (!value) {
        return '-'
    }

    const [year, month] = value.split('-')

    if (!year || !month) {
        return value
    }

    return `${month}/${year}`
}

function formatDate(value: string | null): string {
    if (!value) {
        return '-'
    }

    const [year, month, day] = value.slice(0, 10).split('-')

    if (!year || !month || !day) {
        return value
    }

    return `${day}/${month}/${year}`
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return '-'
    }

    try {
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(new Date(value))
    } catch {
        return value
    }
}

function classNames(...items: Array<string | false | null | undefined>): string {
    return items.filter(Boolean).join(' ')
}

function normalizarModeloParaRegra(modelo: string): string {
    return modelo
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '')
}

function identificarGrupoCotaModelo(modelo: string): GrupoCotaContrato {
    const normalizado = normalizarModeloParaRegra(modelo)

    if (['DCPL5652DN', 'MFCL6912DW', 'HLL6402DW'].includes(normalizado)) {
        return 'laser_pb'
    }

    if (['DCPT820', 'HLT4000DW', 'MFCT4500'].includes(normalizado)) {
        return 'tanque_tinta'
    }

    if (normalizado === 'SF5230') {
        return 'duplicacao'
    }

    if (normalizado === 'ADS4900W') {
        return 'scanner'
    }

    return 'sem_regra'
}

function obterTituloGrupoCota(grupo: GrupoCotaContrato): string {
    const titulos: Record<GrupoCotaContrato, string> = {
        laser_pb: 'Laser P/B A4',
        tanque_tinta: 'Tanque/Jato P/B e Colorida',
        duplicacao: 'Duplicação de documentos',
        scanner: 'Scanner de produção',
        sem_regra: 'Sem regra automática',
    }

    return titulos[grupo]
}

function arredondarCotaMensal(valor: number): number {
    if (!Number.isFinite(valor) || valor <= 0) {
        return 0
    }

    return Math.round(valor)
}

function montarSugestoesCotasPorModelo(modelos: ModeloOpcao[], equipamentos: EquipamentoControle[]): CotaSugeridaModelo[] {
    const contagemPorModelo = new Map<string, number>()
    const contagemPorGrupo = new Map<GrupoCotaContrato, number>()

    modelos.forEach((modelo) => {
        const totalModelo = equipamentos.filter((equipamento) => {
            const mesmoModelo = equipamento.modeloId === modelo.id || equipamento.modelo === modelo.modelo
            const ativo = statusEquipamentoAtivo(equipamento.status || '')
            return mesmoModelo && ativo
        }).length

        const grupo = identificarGrupoCotaModelo(modelo.modelo)
        contagemPorModelo.set(modelo.id, totalModelo)
        contagemPorGrupo.set(grupo, (contagemPorGrupo.get(grupo) ?? 0) + totalModelo)
    })

    return modelos.map((modelo) => {
        const grupo = identificarGrupoCotaModelo(modelo.modelo)
        const totalModelo = contagemPorModelo.get(modelo.id) ?? 0
        const totalGrupo = contagemPorGrupo.get(grupo) || totalModelo || 1

        let codigoItemPrincipal = '-'
        let descricaoItemPrincipal = 'Sem item de consumo sugerido automaticamente.'
        let cotaPbMensal = 0
        let cotaCorMensal = 0
        let cotaTotalMensal = 0
        let aplicavel = true

        if (grupo === 'laser_pb') {
            codigoItemPrincipal = '018.000.033'
            descricaoItemPrincipal = 'CÓPIAS/IMPRESSÃO MONOCROMÁTICAS LASER A4'
            cotaPbMensal = arredondarCotaMensal(MEDIAS_MENSAIS_CONTRATO.laserPb / totalGrupo)
            cotaTotalMensal = cotaPbMensal
        }

        if (grupo === 'tanque_tinta') {
            codigoItemPrincipal = '018.000.034 / 018.000.035'
            descricaoItemPrincipal = 'CÓPIAS/IMPRESSÃO TANQUE/JATO P/B E COLORIDA'
            cotaPbMensal = arredondarCotaMensal(MEDIAS_MENSAIS_CONTRATO.tanquePb / totalGrupo)
            cotaCorMensal = arredondarCotaMensal(MEDIAS_MENSAIS_CONTRATO.tanqueCor / totalGrupo)
            cotaTotalMensal = cotaPbMensal + cotaCorMensal
        }

        if (grupo === 'duplicacao') {
            codigoItemPrincipal = '018.000.036'
            descricaoItemPrincipal = 'DUPLICAÇÃO DE DOCUMENTOS'
            cotaPbMensal = arredondarCotaMensal(MEDIAS_MENSAIS_CONTRATO.duplicacao / totalGrupo)
            cotaTotalMensal = cotaPbMensal
        }

        if (grupo === 'scanner') {
            codigoItemPrincipal = '018.008.085'
            descricaoItemPrincipal = 'SCANNER DE PRODUÇÃO — SOMENTE LOCAÇÃO FIXA'
            aplicavel = false
        }

        if (grupo === 'sem_regra') {
            aplicavel = false
        }

        return {
            modeloId: modelo.id,
            modelo: modelo.modelo,
            grupo,
            tituloGrupo: obterTituloGrupoCota(grupo),
            codigoItemPrincipal,
            descricaoItemPrincipal,
            quantidadeEquipamentosModelo: totalModelo,
            quantidadeEquipamentosGrupo: totalGrupo,
            cotaPbMensal,
            cotaCorMensal,
            cotaTotalMensal,
            aplicavel,
            observacao: aplicavel
                ? `Cota operacional sugerida por modelo, apenas para apoio aos alertas, distribuindo a média mensal do item contratual ${codigoItemPrincipal} entre ${totalGrupo} equipamento(s) ativo(s) do grupo ${obterTituloGrupoCota(grupo)}.`
                : grupo === 'scanner'
                  ? 'Scanner de produção possui locação fixa e, por padrão, não recebe cota de páginas impressas.'
                  : 'Modelo sem regra automática de cota. Avaliar manualmente antes de aplicar.',
        }
    })
}

function getAlertaLabel(alerta: AlertaCota): string {
    const labels: Record<AlertaCota, string> = {
        normal: 'Normal',
        atencao: 'Atenção',
        critico: 'Crítico',
        sem_cota: 'Sem regra',
        cota_geral: 'Cota geral',
        locacao_fixa: 'Locação fixa',
        inativo: 'Inativo',
    }

    return labels[alerta]
}

function getAlertaClasses(alerta: AlertaCota): string {
    const classes: Record<AlertaCota, string> = {
        normal: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
        atencao: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
        critico: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
        sem_cota: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        cota_geral: 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20',
        locacao_fixa: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
        inativo: 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700',
    }

    return classes[alerta]
}

function normalizarEquipamentoRpc(row: Record<string, unknown>): EquipamentoControle {
    const status = toText(row.status ?? row.status_equipamento ?? row.situacao, 'ativo')
    const ultimoConsumoPb = toNumber(row.ultimo_consumo_pb ?? row.saldo_pb ?? row.consumo_pb_mes ?? row.total_pb ?? row.paginas_pb)
    const ultimoConsumoCor = toNumber(row.ultimo_consumo_cor ?? row.saldo_cor ?? row.consumo_cor_mes ?? row.total_cor ?? row.paginas_cor)
    const cotaPbMensal = toNumber(row.cota_pb_mensal ?? row.cota_pb ?? row.cota_mensal_pb)
    const cotaCorMensal = toNumber(row.cota_cor_mensal ?? row.cota_cor ?? row.cota_mensal_cor)
    const cotaTotalMensal = toNumber(row.cota_total_mensal ?? row.cota_total)
    const ultimoTotalPaginas = toNumber(row.ultimo_total_paginas ?? row.total_paginas ?? ultimoConsumoPb + ultimoConsumoCor)
    const percentualUsoPb = calcularPercentual(ultimoConsumoPb, cotaPbMensal)
    const percentualUsoCor = calcularPercentual(ultimoConsumoCor, cotaCorMensal)
    const percentualUsoTotal = calcularPercentual(ultimoTotalPaginas, cotaTotalMensal)

    const modeloNome = toText(row.modelo ?? row.modelo_nome ?? row.nome_modelo ?? row.modelo_equipamento ?? row.modelo_texto_pdf)
    const grupoCota = identificarGrupoCotaModelo(modeloNome)
    const origemCota = obterOrigemCota(modeloNome, cotaPbMensal, cotaCorMensal, cotaTotalMensal, toText(row.observacoes, '') || null)

    return {
        id: toText(row.id ?? row.equipamento_id ?? row.numero_serie, safeId()),
        numeroSerie: toText(row.numero_serie ?? row.serie ?? row.serial ?? row.numero_serie_equipamento),
        modeloId: toText(row.modelo_id, '') || null,
        modelo: modeloNome,
        secretariaId: toText(row.secretaria_id, '') || null,
        secretaria: toText(row.secretaria ?? row.secretaria_nome ?? row.site ?? row.site_texto_pdf),
        setorId: toText(row.setor_id, '') || null,
        setor: toText(row.setor ?? row.setor_nome ?? row.depto ?? row.departamento ?? row.depto_texto_pdf),
        contratoId: toText(row.contrato_id, '') || null,
        contrato: toText(row.numero_contrato ?? row.contrato ?? row.contrato_numero, '-'),
        status,
        dataInstalacao: toText(row.data_instalacao, '') || null,
        dataRetirada: toText(row.data_retirada, '') || null,
        observacoes: toText(row.observacoes, '') || null,
        valorLocacaoMensal: toNumber(row.valor_locacao_mensal ?? row.locacao_mensal ?? row.valor_locacao),
        cotaPbMensal,
        cotaCorMensal,
        cotaTotalMensal,
        grupoCota,
        tituloGrupoCota: obterTituloGrupoCota(grupoCota),
        origemCota,
        origemCotaLabel: obterLabelOrigemCota(origemCota),
        origemCotaDescricao: obterDescricaoOrigemCota(origemCota, grupoCota),
        ultimoMesReferencia: toText(row.ultimo_mes_referencia ?? row.mes_referencia, '') || null,
        ultimoConsumoPb,
        ultimoConsumoCor,
        ultimoTotalPaginas,
        ultimoValorCalculado: toNumber(row.ultimo_total_calculado ?? row.total_calculado ?? row.valor_calculado),
        percentualUsoPb,
        percentualUsoCor,
        percentualUsoTotal,
        alerta: calcularAlertaEquipamento(status, origemCota, percentualUsoPb, percentualUsoCor, percentualUsoTotal),
    }
}

async function listarEquipamentosDireto(): Promise<EquipamentoControle[]> {
    const db = supabase as unknown as SupabaseUnsafe

    const { data: equipamentosRaw, error: equipamentosError } = await db
        .from('equipamentos')
        .select(`
            id,
            numero_serie,
            modelo_id,
            secretaria_id,
            setor_id,
            status,
            data_instalacao,
            data_retirada,
            observacoes,
            modelo:modelo_id(id, modelo, valor_locacao_mensal, custo_pb, custo_cor),
            secretaria:secretaria_id(id, nome, sigla),
            setor:setor_id(id, nome, secretaria_id)
        `)
        .order('numero_serie', { ascending: true })

    if (equipamentosError) {
        throw new Error(equipamentosError.message || 'Erro ao buscar equipamentos.')
    }

    const equipamentos = Array.isArray(equipamentosRaw) ? equipamentosRaw.map(asRecord) : []
    const ids = equipamentos.map((item) => toText(item.id, '')).filter(Boolean)

    const vinculosPorEquipamento = new Map<string, Record<string, unknown>>()
    const leiturasPorEquipamento = new Map<string, Record<string, unknown>>()

    if (ids.length > 0) {
        const { data: vinculosRaw } = await db
            .from('contrato_equipamentos')
            .select(`
                id,
                equipamento_id,
                contrato_id,
                cota_pb_mensal,
                cota_cor_mensal,
                cota_total_mensal,
                ativo,
                observacoes,
                contrato:contrato_id(id, numero_contrato, status)
            `)
            .in('equipamento_id', ids)
            .eq('ativo', true)

        if (Array.isArray(vinculosRaw)) {
            vinculosRaw.map(asRecord).forEach((item) => {
                const equipamentoId = toText(item.equipamento_id, '')

                if (equipamentoId && !vinculosPorEquipamento.has(equipamentoId)) {
                    vinculosPorEquipamento.set(equipamentoId, item)
                }
            })
        }

        const { data: leiturasRaw } = await db
            .from('leituras_mensais')
            .select(`
                equipamento_id,
                saldo_pb,
                saldo_cor,
                total_calculado,
                relatorio:relatorio_id(mes_referencia, status)
            `)
            .in('equipamento_id', ids)
            .order('created_at', { ascending: false })

        if (Array.isArray(leiturasRaw)) {
            leiturasRaw.map(asRecord).forEach((item) => {
                const equipamentoId = toText(item.equipamento_id, '')
                const relatorio = firstRelation(item.relatorio)
                const statusRelatorio = toText(relatorio.status, '').toLowerCase()

                if (equipamentoId && statusRelatorio === 'aprovado' && !leiturasPorEquipamento.has(equipamentoId)) {
                    leiturasPorEquipamento.set(equipamentoId, item)
                }
            })
        }
    }

    return equipamentos.map((item) => {
        const equipamentoId = toText(item.id, '')
        const modelo = firstRelation(item.modelo)
        const modeloNome = toText(modelo.modelo)
        const secretaria = firstRelation(item.secretaria)
        const setor = firstRelation(item.setor)
        const vinculo = vinculosPorEquipamento.get(equipamentoId) ?? {}
        const contrato = firstRelation(vinculo.contrato)
        const leitura = leiturasPorEquipamento.get(equipamentoId) ?? {}
        const relatorio = firstRelation(leitura.relatorio)
        const status = toText(item.status, 'ativo')
        const ultimoConsumoPb = toNumber(leitura.saldo_pb)
        const ultimoConsumoCor = toNumber(leitura.saldo_cor)
        const ultimoTotalPaginas = ultimoConsumoPb + ultimoConsumoCor
        const cotaPbMensal = toNumber(vinculo.cota_pb_mensal)
        const cotaCorMensal = toNumber(vinculo.cota_cor_mensal)
        const cotaTotalMensal = toNumber(vinculo.cota_total_mensal)
        const percentualUsoPb = calcularPercentual(ultimoConsumoPb, cotaPbMensal)
        const percentualUsoCor = calcularPercentual(ultimoConsumoCor, cotaCorMensal)
        const percentualUsoTotal = calcularPercentual(ultimoTotalPaginas, cotaTotalMensal)
        const grupoCota = identificarGrupoCotaModelo(modeloNome)
        const origemCota = obterOrigemCota(modeloNome, cotaPbMensal, cotaCorMensal, cotaTotalMensal, toText(vinculo.observacoes, '') || null)

        return {
            id: equipamentoId,
            numeroSerie: toText(item.numero_serie),
            modeloId: toText(item.modelo_id, '') || toText(modelo.id, '') || null,
            modelo: modeloNome,
            secretariaId: toText(item.secretaria_id, '') || toText(secretaria.id, '') || null,
            secretaria: toText(secretaria.nome),
            setorId: toText(item.setor_id, '') || toText(setor.id, '') || null,
            setor: toText(setor.nome),
            contratoId: toText(vinculo.contrato_id, '') || toText(contrato.id, '') || null,
            contrato: toText(contrato.numero_contrato, '-'),
            status,
            dataInstalacao: toText(item.data_instalacao, '') || null,
            dataRetirada: toText(item.data_retirada, '') || null,
            observacoes: toText(item.observacoes, '') || null,
            valorLocacaoMensal: toNumber(modelo.valor_locacao_mensal),
            cotaPbMensal,
            cotaCorMensal,
            cotaTotalMensal,
            grupoCota,
            tituloGrupoCota: obterTituloGrupoCota(grupoCota),
            origemCota,
            origemCotaLabel: obterLabelOrigemCota(origemCota),
            origemCotaDescricao: obterDescricaoOrigemCota(origemCota, grupoCota),
            ultimoMesReferencia: toText(relatorio.mes_referencia, '') || null,
            ultimoConsumoPb,
            ultimoConsumoCor,
            ultimoTotalPaginas,
            ultimoValorCalculado: toNumber(leitura.total_calculado),
            percentualUsoPb,
            percentualUsoCor,
            percentualUsoTotal,
            alerta: calcularAlertaEquipamento(status, origemCota, percentualUsoPb, percentualUsoCor, percentualUsoTotal),
        }
    })
}

async function listarEquipamentosPorRpc(): Promise<EquipamentoControle[]> {
    const db = supabase as unknown as SupabaseUnsafe
    const { data, error } = await db.rpc('rpc_listar_equipamentos', {})

    if (error) {
        throw new Error(error.message || 'Erro ao buscar equipamentos pela RPC.')
    }

    const payload = asRecord(data)
    const linhas = Array.isArray(data)
        ? data
        : Array.isArray(payload.dados)
          ? payload.dados
          : Array.isArray(payload.equipamentos)
            ? payload.equipamentos
            : Array.isArray(payload.items)
              ? payload.items
              : []

    return linhas.map((item) => normalizarEquipamentoRpc(asRecord(item)))
}

async function listarEquipamentos(): Promise<EquipamentoControle[]> {
    try {
        return await listarEquipamentosDireto()
    } catch (erroDireto) {
        try {
            return await listarEquipamentosPorRpc()
        } catch (erroRpc) {
            const mensagemDireta = erroDireto instanceof Error ? erroDireto.message : 'Erro desconhecido na consulta direta.'
            const mensagemRpc = erroRpc instanceof Error ? erroRpc.message : 'Erro desconhecido na consulta por RPC.'
            throw new Error(`${mensagemDireta} ${mensagemRpc}`)
        }
    }
}

async function selecionarLinhasComFallback(
    tabela: string,
    selects: string[],
    orderColumn?: string,
    ascending = true,
): Promise<Record<string, unknown>[]> {
    const db = supabase as unknown as SupabaseUnsafe
    let ultimaMensagem = ''

    for (const select of selects) {
        let query = db.from(tabela).select(select)

        if (orderColumn) {
            query = query.order(orderColumn, { ascending })
        }

        const { data, error } = await query

        if (!error) {
            return Array.isArray(data) ? data.map(asRecord) : []
        }

        ultimaMensagem = error.message || ultimaMensagem
    }

    throw new Error(ultimaMensagem || `Erro ao carregar ${tabela}.`)
}

async function carregarOpcoesFormulario(): Promise<{
    modelos: ModeloOpcao[]
    secretarias: SecretariaOpcao[]
    setores: SetorOpcao[]
    contratos: ContratoOpcao[]
}> {
    const [modelosRaw, secretariasRaw, setoresRaw, contratosRaw] = await Promise.all([
        selecionarLinhasComFallback('modelos_equipamento', [
            'id, modelo, valor_locacao_mensal, permite_cor, tipo_equipamento, ativo',
            'id, modelo, valor_locacao_mensal, permite_cor, tipo_equipamento',
            'id, modelo, valor_locacao_mensal',
        ], 'modelo'),
        selecionarLinhasComFallback('secretarias', [
            'id, nome, sigla, ativo',
            'id, nome, sigla',
            'id, nome',
        ], 'nome'),
        selecionarLinhasComFallback('setores', [
            'id, nome, secretaria_id, ativo',
            'id, nome, secretaria_id',
            'id, nome',
        ], 'nome'),
        selecionarLinhasComFallback('contratos', [
            'id, numero_contrato, fornecedor, status, created_at',
            'id, numero_contrato, fornecedor, status',
            'id, numero_contrato, fornecedor',
        ], 'created_at', false),
    ])

    return {
        modelos: modelosRaw
            .filter((item) => item.ativo !== false)
            .map((item) => ({
                id: toText(item.id, ''),
                modelo: toText(item.modelo),
                valorLocacaoMensal: toNumber(item.valor_locacao_mensal),
                permiteCor: Boolean(item.permite_cor),
                tipoEquipamento: toText(item.tipo_equipamento, 'impressora'),
            }))
            .filter((item) => item.id),
        secretarias: secretariasRaw
            .filter((item) => item.ativo !== false)
            .map((item) => ({
                id: toText(item.id, ''),
                nome: toText(item.nome),
                sigla: toText(item.sigla, ''),
            }))
            .filter((item) => item.id),
        setores: setoresRaw
            .filter((item) => item.ativo !== false)
            .map((item) => ({
                id: toText(item.id, ''),
                nome: toText(item.nome),
                secretariaId: toText(item.secretaria_id, '') || null,
            }))
            .filter((item) => item.id),
        contratos: contratosRaw
            .filter((item) => toText(item.status, 'ativo').toLowerCase() !== 'inativo')
            .map((item) => ({
                id: toText(item.id, ''),
                numeroContrato: toText(item.numero_contrato),
                fornecedor: toText(item.fornecedor, ''),
                status: toText(item.status, 'ativo'),
            }))
            .filter((item) => item.id),
    }
}

async function salvarEquipamento(form: EquipamentoFormState): Promise<void> {
    const db = supabase as unknown as SupabaseUnsafe
    const isEdicao = Boolean(form.id)

    const equipamentoPayload = {
        numero_serie: form.numeroSerie.trim().toUpperCase(),
        modelo_id: form.modeloId,
        secretaria_id: form.secretariaId || null,
        setor_id: form.setorId || null,
        status: form.status || 'ativo',
        data_instalacao: form.dataInstalacao || null,
        data_retirada: form.dataRetirada || null,
        observacoes: toNullableText(form.observacoes),
    }

    let equipamentoId = form.id

    if (isEdicao && equipamentoId) {
        const { error } = await db.from('equipamentos').update(equipamentoPayload).eq('id', equipamentoId)

        if (error) {
            throw new Error(error.message || 'Erro ao atualizar equipamento.')
        }
    } else {
        const { data, error } = await db.from('equipamentos').insert(equipamentoPayload).select('id').single()

        if (error) {
            throw new Error(error.message || 'Erro ao cadastrar equipamento.')
        }

        equipamentoId = toText(asRecord(data).id, '')
    }

    if (!equipamentoId) {
        throw new Error('Não foi possível identificar o equipamento salvo.')
    }

    if (form.contratoId) {
        if (isEdicao) {
            await db.from('contrato_equipamentos').update({ ativo: false }).eq('equipamento_id', equipamentoId)
        }

        const vinculoPayload = {
            contrato_id: form.contratoId,
            equipamento_id: equipamentoId,
            cota_pb_mensal: toNullableNumber(form.cotaPbMensal),
            cota_cor_mensal: toNullableNumber(form.cotaCorMensal),
            cota_total_mensal: toNullableNumber(form.cotaTotalMensal),
            ativo: true,
            observacoes: toNullableText(form.observacoes),
        }

        const { error: vinculoError } = await db
            .from('contrato_equipamentos')
            .upsert(vinculoPayload, { onConflict: 'contrato_id,equipamento_id' })

        if (vinculoError) {
            throw new Error(vinculoError.message || 'Equipamento salvo, mas houve erro ao vincular contrato/cotas.')
        }
    }
}


async function aplicarCotasPorModelo(form: CotaModeloFormState): Promise<{ totalAtualizados: number; modelo: string; contrato: string }> {
    const db = supabase as unknown as SupabaseUnsafe

    const { data, error } = await db.rpc('rpc_aplicar_cotas_modelo_contrato_webapp', {
        p_contrato_id: form.contratoId,
        p_modelo_id: form.modeloId,
        p_cota_pb_mensal: toNullableNumber(form.cotaPbMensal),
        p_cota_cor_mensal: toNullableNumber(form.cotaCorMensal),
        p_cota_total_mensal: toNullableNumber(form.cotaTotalMensal),
        p_observacoes: toNullableText(form.observacoes),
    })

    if (error) {
        throw new Error(error.message || 'Erro ao aplicar cotas por modelo.')
    }

    const retorno = asRecord(data)

    return {
        totalAtualizados: toNumber(retorno.total_equipamentos_atualizados ?? retorno.totalAtualizados),
        modelo: toText(retorno.modelo, '-'),
        contrato: toText(retorno.contrato, '-'),
    }
}

function normalizarMovimento(row: Record<string, unknown>): MovimentoEquipamento {
    return {
        id: toText(row.id, safeId()),
        equipamentoId: toText(row.equipamento_id, ''),
        numeroSerie: toText(row.numero_serie),
        modeloNome: toText(row.modelo_nome),
        secretariaOrigemNome: toText(row.secretaria_origem_nome),
        setorOrigemNome: toText(row.setor_origem_nome),
        secretariaDestinoNome: toText(row.secretaria_destino_nome),
        setorDestinoNome: toText(row.setor_destino_nome),
        statusOrigem: toText(row.status_origem),
        statusDestino: toText(row.status_destino),
        dataMovimentacao: toText(row.data_movimentacao, '') || null,
        motivo: toText(row.motivo, ''),
        observacao: toText(row.observacao, ''),
        createdAt: toText(row.created_at, '') || null,
    }
}

async function listarHistoricoMovimentacoes(equipamentoId: string): Promise<MovimentoEquipamento[]> {
    const db = supabase as unknown as SupabaseUnsafe
    const { data, error } = await db
        .from('equipamentos_movimentacoes_log')
        .select('*')
        .eq('equipamento_id', equipamentoId)
        .order('data_movimentacao', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(error.message || 'Erro ao buscar histórico de movimentação.')
    }

    return Array.isArray(data) ? data.map((item) => normalizarMovimento(asRecord(item))) : []
}

function normalizarStatusHistorico(row: Record<string, unknown>): StatusEquipamentoHistorico {
    return {
        id: toText(row.id, safeId()),
        equipamentoId: toText(row.equipamento_id, ''),
        numeroSerie: toText(row.numero_serie),
        modeloNome: toText(row.modelo_nome),
        statusAnterior: toText(row.status_anterior),
        statusNovo: toText(row.status_novo),
        dataEvento: toText(row.data_evento, '') || null,
        motivo: toText(row.motivo, ''),
        observacao: toText(row.observacao, ''),
        createdAt: toText(row.created_at, '') || null,
    }
}

async function listarHistoricoStatus(equipamentoId: string): Promise<StatusEquipamentoHistorico[]> {
    const db = supabase as unknown as SupabaseUnsafe
    const { data, error } = await db
        .from('equipamentos_status_log')
        .select('*')
        .eq('equipamento_id', equipamentoId)
        .order('data_evento', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(error.message || 'Erro ao buscar histórico de status.')
    }

    return Array.isArray(data) ? data.map((item) => normalizarStatusHistorico(asRecord(item))) : []
}

function normalizarLeituraHistorico(row: Record<string, unknown>): LeituraEquipamentoHistorico {
    const relatorio = firstRelation(row.relatorios_pdf)

    return {
        id: toText(row.id, safeId()),
        relatorioId: toText(row.relatorio_id, '') || null,
        nomeArquivo: toText(relatorio.nome_arquivo, '-'),
        mesReferencia: toText(relatorio.mes_referencia, '') || null,
        classificacaoAf: toText(relatorio.classificacao_af, '-'),
        statusRelatorio: toText(relatorio.status, '-'),
        serieTextoPdf: toText(row.serie_texto_pdf),
        siteTextoPdf: toText(row.site_texto_pdf),
        deptoTextoPdf: toText(row.depto_texto_pdf),
        antPb: toNumber(row.ant_pb),
        atuPb: toNumber(row.atu_pb),
        saldoPb: toNumber(row.saldo_pb),
        antCor: toNumber(row.ant_cor),
        atuCor: toNumber(row.atu_cor),
        saldoCor: toNumber(row.saldo_cor),
        totalGeralPdf: toNumber(row.total_geral_pdf),
        totalCalculado: toNumber(row.total_calculado),
        divergente: Boolean(row.divergente),
        createdAt: toText(row.created_at, '') || null,
    }
}

async function listarHistoricoLeituras(equipamento: EquipamentoControle): Promise<LeituraEquipamentoHistorico[]> {
    const db = supabase as unknown as SupabaseUnsafe
    const selectQuery = `
        id,
        relatorio_id,
        equipamento_id,
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
        divergente,
        created_at,
        relatorios_pdf (
            id,
            nome_arquivo,
            mes_referencia,
            classificacao_af,
            status
        )
    `

    const resultados = new Map<string, LeituraEquipamentoHistorico>()

    const { data: porId, error: erroPorId } = await db
        .from('leituras_mensais')
        .select(selectQuery)
        .eq('equipamento_id', equipamento.id)
        .order('created_at', { ascending: false })

    if (erroPorId) {
        throw new Error(erroPorId.message || 'Erro ao buscar leituras por equipamento.')
    }

    if (Array.isArray(porId)) {
        porId.forEach((item) => {
            const leitura = normalizarLeituraHistorico(asRecord(item))
            resultados.set(leitura.id, leitura)
        })
    }

    if (equipamento.numeroSerie) {
        const { data: porSerie, error: erroPorSerie } = await db
            .from('leituras_mensais')
            .select(selectQuery)
            .eq('serie_texto_pdf', equipamento.numeroSerie)
            .order('created_at', { ascending: false })

        if (erroPorSerie) {
            throw new Error(erroPorSerie.message || 'Erro ao buscar leituras por número de série.')
        }

        if (Array.isArray(porSerie)) {
            porSerie.forEach((item) => {
                const leitura = normalizarLeituraHistorico(asRecord(item))
                resultados.set(leitura.id, leitura)
            })
        }
    }

    return Array.from(resultados.values()).sort((a, b) => {
        const dataA = a.mesReferencia ? new Date(a.mesReferencia).getTime() : 0
        const dataB = b.mesReferencia ? new Date(b.mesReferencia).getTime() : 0
        return dataB - dataA
    })
}

async function registrarMovimentacaoEquipamento(
    equipamento: EquipamentoControle,
    form: MovimentacaoFormState,
    destino: { secretariaNome: string; setorNome: string },
): Promise<void> {
    const db = supabase as unknown as SupabaseUnsafe
    const novaSecretariaId = form.secretariaDestinoId || null
    const novoSetorId = form.setorDestinoId || null

    const { error: updateError } = await db
        .from('equipamentos')
        .update({
            secretaria_id: novaSecretariaId,
            setor_id: novoSetorId,
            observacoes: toNullableText(form.observacao) ?? equipamento.observacoes,
        })
        .eq('id', equipamento.id)

    if (updateError) {
        throw new Error(updateError.message || 'Erro ao atualizar localização do equipamento.')
    }

    const { error: logError } = await db.from('equipamentos_movimentacoes_log').insert({
        equipamento_id: equipamento.id,
        numero_serie: equipamento.numeroSerie,
        modelo_nome: equipamento.modelo,
        secretaria_origem_id: equipamento.secretariaId,
        secretaria_origem_nome: equipamento.secretaria,
        setor_origem_id: equipamento.setorId,
        setor_origem_nome: equipamento.setor,
        secretaria_destino_id: novaSecretariaId,
        secretaria_destino_nome: destino.secretariaNome,
        setor_destino_id: novoSetorId,
        setor_destino_nome: destino.setorNome,
        status_origem: equipamento.status,
        status_destino: equipamento.status,
        data_movimentacao: form.dataMovimentacao || new Date().toISOString().slice(0, 10),
        motivo: form.motivo.trim(),
        observacao: toNullableText(form.observacao),
    })

    if (logError) {
        throw new Error(logError.message || 'Localização atualizada, mas houve erro ao registrar o histórico de movimentação.')
    }
}


async function registrarAlteracaoStatusEquipamento(
    equipamento: EquipamentoControle,
    form: StatusEquipamentoFormState,
): Promise<void> {
    const db = supabase as unknown as SupabaseUnsafe
    const novoStatus = form.novoStatus || 'ativo'
    const statusAnterior = equipamento.status || 'ativo'
    const statusComDataRetirada = ['inativo', 'retirado', 'baixado']
    const dataRetirada = statusComDataRetirada.includes(novoStatus.toLowerCase())
        ? form.dataEvento || new Date().toISOString().slice(0, 10)
        : null

    const { error: updateError } = await db
        .from('equipamentos')
        .update({
            status: novoStatus,
            data_retirada: dataRetirada,
            observacoes: toNullableText(form.observacao) ?? equipamento.observacoes,
        })
        .eq('id', equipamento.id)

    if (updateError) {
        throw new Error(updateError.message || 'Erro ao alterar status do equipamento.')
    }

    if (equipamento.contratoId) {
        const contratoAtivo = novoStatus.toLowerCase() === 'ativo'
        await db
            .from('contrato_equipamentos')
            .update({ ativo: contratoAtivo })
            .eq('equipamento_id', equipamento.id)
            .eq('contrato_id', equipamento.contratoId)
    }

    const { error: logError } = await db.from('equipamentos_status_log').insert({
        equipamento_id: equipamento.id,
        numero_serie: equipamento.numeroSerie,
        modelo_nome: equipamento.modelo,
        status_anterior: statusAnterior,
        status_novo: novoStatus,
        data_evento: form.dataEvento || new Date().toISOString().slice(0, 10),
        motivo: form.motivo.trim(),
        observacao: toNullableText(form.observacao),
    })

    if (logError) {
        throw new Error(logError.message || 'Status alterado, mas houve erro ao registrar o histórico.')
    }
}

function CardResumo({ titulo, valor, descricao, icon: Icon, tom = 'azul' }: CardResumoProps) {
    const tons = {
        azul: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
        verde: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        amarelo: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        vermelho: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
        cinza: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{titulo}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">{valor}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{descricao}</p>
                </div>
                <div className={classNames('rounded-xl p-2.5', tons[tom])}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    )
}

export default function Equipamentos() {
    const [equipamentos, setEquipamentos] = useState<EquipamentoControle[]>([])
    const [filtros, setFiltros] = useState<FiltrosEquipamentos>(filtroInicial)
    const [loading, setLoading] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [selecionado, setSelecionado] = useState<EquipamentoControle | null>(null)
    const [formAberto, setFormAberto] = useState(false)
    const [modoFormulario, setModoFormulario] = useState<ModoFormulario>('novo')
    const [form, setForm] = useState<EquipamentoFormState>(formInicial)
    const [modelos, setModelos] = useState<ModeloOpcao[]>([])
    const [secretarias, setSecretarias] = useState<SecretariaOpcao[]>([])
    const [setores, setSetores] = useState<SetorOpcao[]>([])
    const [contratos, setContratos] = useState<ContratoOpcao[]>([])
    const [movimentacaoAberta, setMovimentacaoAberta] = useState(false)
    const [equipamentoMovimentacao, setEquipamentoMovimentacao] = useState<EquipamentoControle | null>(null)
    const [movimentacaoForm, setMovimentacaoForm] = useState<MovimentacaoFormState>(movimentacaoFormInicial)
    const [historicoAberto, setHistoricoAberto] = useState(false)
    const [historicoEquipamento, setHistoricoEquipamento] = useState<EquipamentoControle | null>(null)
    const [historicoMovimentacoes, setHistoricoMovimentacoes] = useState<MovimentoEquipamento[]>([])
    const [historicoStatus, setHistoricoStatus] = useState<StatusEquipamentoHistorico[]>([])
    const [historicoLeituras, setHistoricoLeituras] = useState<LeituraEquipamentoHistorico[]>([])
    const [carregandoHistorico, setCarregandoHistorico] = useState(false)
    const [statusAberto, setStatusAberto] = useState(false)
    const [equipamentoStatus, setEquipamentoStatus] = useState<EquipamentoControle | null>(null)
    const [statusForm, setStatusForm] = useState<StatusEquipamentoFormState>(statusFormInicial)
    const [cotasModeloAberto, setCotasModeloAberto] = useState(false)
    const [cotaModeloForm, setCotaModeloForm] = useState<CotaModeloFormState>(cotaModeloFormInicial)

    const carregarDados = async () => {
        setLoading(true)
        setErrorMessage(null)

        try {
            const dados = await listarEquipamentos()
            setEquipamentos(dados)

            try {
                const opcoesFormulario = await carregarOpcoesFormulario()
                setModelos(opcoesFormulario.modelos)
                setSecretarias(opcoesFormulario.secretarias)
                setSetores(opcoesFormulario.setores)
                setContratos(opcoesFormulario.contratos)
            } catch (errorOpcoes) {
                setModelos([])
                setSecretarias([])
                setSetores([])
                setContratos([])
                setErrorMessage(
                    errorOpcoes instanceof Error
                        ? `Equipamentos carregados, mas não foi possível carregar as opções de cadastro/edição: ${errorOpcoes.message}`
                        : 'Equipamentos carregados, mas não foi possível carregar as opções de cadastro/edição.',
                )
            }
        } catch (error) {
            setEquipamentos([])
            setErrorMessage(error instanceof Error ? error.message : 'Não foi possível carregar os equipamentos.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void carregarDados()
    }, [])

    const setoresFiltradosFormulario = useMemo(() => {
        if (!form.secretariaId) {
            return setores
        }

        return setores.filter((setor) => !setor.secretariaId || setor.secretariaId === form.secretariaId)
    }, [form.secretariaId, setores])

    const setoresFiltradosMovimentacao = useMemo(() => {
        if (!movimentacaoForm.secretariaDestinoId) {
            return setores
        }

        return setores.filter((setor) => !setor.secretariaId || setor.secretariaId === movimentacaoForm.secretariaDestinoId)
    }, [movimentacaoForm.secretariaDestinoId, setores])

    const sugestoesCotas = useMemo(() => montarSugestoesCotasPorModelo(modelos, equipamentos), [modelos, equipamentos])

    const sugestaoCotaModeloSelecionado = useMemo(() => {
        return sugestoesCotas.find((sugestao) => sugestao.modeloId === cotaModeloForm.modeloId) ?? null
    }, [cotaModeloForm.modeloId, sugestoesCotas])

    const opcoes = useMemo(() => {
        const secretariasLista = Array.from(new Set(equipamentos.map((item) => item.secretaria).filter((item) => item && item !== '-'))).sort()
        const modelosLista = Array.from(new Set(equipamentos.map((item) => item.modelo).filter((item) => item && item !== '-'))).sort()
        const status = Array.from(new Set(equipamentos.map((item) => item.status).filter(Boolean))).sort()

        return { secretarias: secretariasLista, modelos: modelosLista, status }
    }, [equipamentos])

    const equipamentosFiltrados = useMemo(() => {
        const buscaNormalizada = filtros.busca.trim().toLowerCase()

        return equipamentos.filter((item) => {
            const textoBusca = [item.numeroSerie, item.modelo, item.secretaria, item.setor, item.contrato, item.status]
                .join(' ')
                .toLowerCase()

            const combinaBusca = !buscaNormalizada || textoBusca.includes(buscaNormalizada)
            const combinaSecretaria = filtros.secretaria === 'todos' || item.secretaria === filtros.secretaria
            const combinaModelo = filtros.modelo === 'todos' || item.modelo === filtros.modelo
            const combinaStatus = filtros.status === 'todos' || item.status === filtros.status
            const combinaAlerta = filtros.alerta === 'todos' || item.alerta === filtros.alerta

            return combinaBusca && combinaSecretaria && combinaModelo && combinaStatus && combinaAlerta
        })
    }, [equipamentos, filtros])

    const resumo = useMemo(() => {
        const ativos = equipamentos.filter((item) => item.alerta !== 'inativo')
        const cotaGeral = equipamentos.filter((item) => item.alerta === 'cota_geral').length
        const semRegra = equipamentos.filter((item) => item.alerta === 'sem_cota').length
        const locacaoFixa = equipamentos.filter((item) => item.alerta === 'locacao_fixa').length
        const atencao = equipamentos.filter((item) => item.alerta === 'atencao').length
        const criticos = equipamentos.filter((item) => item.alerta === 'critico').length
        const comCotaOperacional = equipamentos.filter((item) => ['normal', 'atencao', 'critico'].includes(item.alerta)).length
        const paginasUltimoMes = equipamentos.reduce((total, item) => total + item.ultimoTotalPaginas, 0)
        const locacaoMensal = equipamentos.reduce((total, item) => total + item.valorLocacaoMensal, 0)
        const modelosDiferentes = new Set(equipamentos.map((item) => item.modelo).filter((item) => item && item !== '-')).size

        return {
            total: equipamentos.length,
            ativos: ativos.length,
            cotaGeral,
            semRegra,
            locacaoFixa,
            comCotaOperacional,
            atencao,
            criticos,
            paginasUltimoMes,
            locacaoMensal,
            modelos: modelosDiferentes,
        }
    }, [equipamentos])

    const limparFiltros = () => {
        setFiltros(filtroInicial)
    }

    const abrirNovoEquipamento = () => {
        setModoFormulario('novo')
        setForm({
            ...formInicial,
            modeloId: modelos[0]?.id ?? '',
            secretariaId: secretarias[0]?.id ?? '',
            contratoId: contratos[0]?.id ?? '',
        })
        setFormAberto(true)
        setSuccessMessage(null)
        setErrorMessage(null)
    }


    const abrirCotasPorModelo = () => {
        setCotaModeloForm({
            ...cotaModeloFormInicial,
            contratoId: contratos[0]?.id ?? '',
            modeloId: modelos[0]?.id ?? '',
        })
        setCotasModeloAberto(true)
        setSuccessMessage(null)
        setErrorMessage(null)
    }

    const fecharCotasPorModelo = () => {
        setCotasModeloAberto(false)
        setCotaModeloForm(cotaModeloFormInicial)
        setSalvando(false)
    }

    const atualizarCampoCotaModelo = (campo: keyof CotaModeloFormState, valor: string) => {
        setCotaModeloForm((atual) => ({ ...atual, [campo]: valor }))
    }

    const usarSugestaoCotaSelecionada = () => {
        if (!sugestaoCotaModeloSelecionado) {
            setErrorMessage('Selecione um modelo para usar a sugestão de cota.')
            return
        }

        if (!sugestaoCotaModeloSelecionado.aplicavel) {
            setErrorMessage('Este modelo não possui cota automática sugerida. Avalie manualmente antes de aplicar.')
            return
        }

        setCotaModeloForm((atual) => ({
            ...atual,
            cotaPbMensal: sugestaoCotaModeloSelecionado.cotaPbMensal ? String(sugestaoCotaModeloSelecionado.cotaPbMensal) : '',
            cotaCorMensal: sugestaoCotaModeloSelecionado.cotaCorMensal ? String(sugestaoCotaModeloSelecionado.cotaCorMensal) : '',
            cotaTotalMensal: sugestaoCotaModeloSelecionado.cotaTotalMensal ? String(sugestaoCotaModeloSelecionado.cotaTotalMensal) : '',
            observacoes: sugestaoCotaModeloSelecionado.observacao,
        }))
    }

    const abrirEditarEquipamento = (item: EquipamentoControle) => {
        setModoFormulario('editar')
        setForm({
            id: item.id,
            numeroSerie: item.numeroSerie === '-' ? '' : item.numeroSerie,
            modeloId: item.modeloId ?? '',
            secretariaId: item.secretariaId ?? '',
            setorId: item.setorId ?? '',
            status: item.status || 'ativo',
            dataInstalacao: item.dataInstalacao ?? '',
            dataRetirada: item.dataRetirada ?? '',
            contratoId: item.contratoId ?? '',
            cotaPbMensal: item.cotaPbMensal ? String(item.cotaPbMensal) : '',
            cotaCorMensal: item.cotaCorMensal ? String(item.cotaCorMensal) : '',
            cotaTotalMensal: item.cotaTotalMensal ? String(item.cotaTotalMensal) : '',
            observacoes: item.observacoes ?? '',
        })
        setFormAberto(true)
        setSelecionado(null)
        setSuccessMessage(null)
        setErrorMessage(null)
    }

    const fecharFormulario = () => {
        setFormAberto(false)
        setForm(formInicial)
        setSalvando(false)
    }

    const abrirMovimentacao = (item: EquipamentoControle) => {
        setEquipamentoMovimentacao(item)
        setMovimentacaoForm({
            secretariaDestinoId: item.secretariaId ?? '',
            setorDestinoId: item.setorId ?? '',
            dataMovimentacao: new Date().toISOString().slice(0, 10),
            motivo: '',
            observacao: '',
        })
        setMovimentacaoAberta(true)
        setSelecionado(null)
        setSuccessMessage(null)
        setErrorMessage(null)
    }

    const fecharMovimentacao = () => {
        setMovimentacaoAberta(false)
        setEquipamentoMovimentacao(null)
        setMovimentacaoForm(movimentacaoFormInicial)
        setSalvando(false)
    }

    const atualizarCampoMovimentacao = (campo: keyof MovimentacaoFormState, valor: string) => {
        setMovimentacaoForm((atual) => {
            const proximo = { ...atual, [campo]: valor }

            if (campo === 'secretariaDestinoId') {
                proximo.setorDestinoId = ''
            }

            return proximo
        })
    }

    const abrirHistoricoEquipamento = async (item: EquipamentoControle) => {
        setHistoricoEquipamento(item)
        setHistoricoAberto(true)
        setHistoricoMovimentacoes([])
        setHistoricoStatus([])
        setHistoricoLeituras([])
        setCarregandoHistorico(true)
        setSelecionado(null)
        setErrorMessage(null)

        try {
            const [movimentacoes, status, leituras] = await Promise.all([
                listarHistoricoMovimentacoes(item.id),
                listarHistoricoStatus(item.id),
                listarHistoricoLeituras(item),
            ])

            setHistoricoMovimentacoes(movimentacoes)
            setHistoricoStatus(status)
            setHistoricoLeituras(leituras)
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Não foi possível carregar o histórico completo do equipamento.')
        } finally {
            setCarregandoHistorico(false)
        }
    }


    const fecharHistorico = () => {
        setHistoricoAberto(false)
        setHistoricoEquipamento(null)
        setHistoricoMovimentacoes([])
        setHistoricoStatus([])
        setHistoricoLeituras([])
        setCarregandoHistorico(false)
    }


    const abrirAlterarStatus = (item: EquipamentoControle) => {
        const statusAtual = item.status.toLowerCase()
        const sugestaoStatus = statusAtual === 'ativo' ? 'retirado' : 'ativo'

        setEquipamentoStatus(item)
        setStatusForm({
            novoStatus: sugestaoStatus,
            dataEvento: new Date().toISOString().slice(0, 10),
            motivo: '',
            observacao: '',
        })
        setStatusAberto(true)
        setSelecionado(null)
        setSuccessMessage(null)
        setErrorMessage(null)
    }

    const fecharAlterarStatus = () => {
        setStatusAberto(false)
        setEquipamentoStatus(null)
        setStatusForm(statusFormInicial)
        setSalvando(false)
    }

    const atualizarCampoStatus = (campo: keyof StatusEquipamentoFormState, valor: string) => {
        setStatusForm((atual) => ({ ...atual, [campo]: valor }))
    }

    const atualizarCampoForm = (campo: keyof EquipamentoFormState, valor: string) => {
        setForm((atual) => {
            const proximo = { ...atual, [campo]: valor }

            if (campo === 'secretariaId') {
                proximo.setorId = ''
            }

            return proximo
        })
    }

    const handleSubmitFormulario = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setErrorMessage(null)
        setSuccessMessage(null)

        if (!form.numeroSerie.trim()) {
            setErrorMessage('Informe o número de série do equipamento.')
            return
        }

        if (!form.modeloId) {
            setErrorMessage('Selecione o modelo do equipamento.')
            return
        }

        setSalvando(true)

        try {
            await salvarEquipamento(form)
            setSuccessMessage(modoFormulario === 'novo' ? 'Equipamento cadastrado com sucesso.' : 'Equipamento atualizado com sucesso.')
            fecharFormulario()
            await carregarDados()
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar o equipamento.')
        } finally {
            setSalvando(false)
        }
    }

    const handleSubmitMovimentacao = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setErrorMessage(null)
        setSuccessMessage(null)

        if (!equipamentoMovimentacao) {
            setErrorMessage('Nenhum equipamento selecionado para movimentação.')
            return
        }

        if (!movimentacaoForm.secretariaDestinoId) {
            setErrorMessage('Selecione a secretaria de destino.')
            return
        }

        if (!movimentacaoForm.motivo.trim() || movimentacaoForm.motivo.trim().length < 10) {
            setErrorMessage('Informe um motivo com pelo menos 10 caracteres para registrar a movimentação.')
            return
        }

        const secretariaDestino = secretarias.find((item) => item.id === movimentacaoForm.secretariaDestinoId)
        const setorDestino = setores.find((item) => item.id === movimentacaoForm.setorDestinoId)
        const secretariaNome = secretariaDestino?.nome ?? '-'
        const setorNome = setorDestino?.nome ?? 'SEM DEPARTAMENTO'

        setSalvando(true)

        try {
            await registrarMovimentacaoEquipamento(equipamentoMovimentacao, movimentacaoForm, { secretariaNome, setorNome })
            setSuccessMessage(`Equipamento ${equipamentoMovimentacao.numeroSerie} movimentado com sucesso.`)
            fecharMovimentacao()
            await carregarDados()
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Não foi possível movimentar o equipamento.')
        } finally {
            setSalvando(false)
        }
    }


    const handleSubmitStatus = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setErrorMessage(null)
        setSuccessMessage(null)

        if (!equipamentoStatus) {
            setErrorMessage('Nenhum equipamento selecionado para alteração de status.')
            return
        }

        if (!statusForm.novoStatus) {
            setErrorMessage('Selecione o novo status do equipamento.')
            return
        }

        if (!statusForm.motivo.trim() || statusForm.motivo.trim().length < 10) {
            setErrorMessage('Informe um motivo com pelo menos 10 caracteres para registrar a alteração de status.')
            return
        }

        setSalvando(true)

        try {
            await registrarAlteracaoStatusEquipamento(equipamentoStatus, statusForm)
            setSuccessMessage(`Status do equipamento ${equipamentoStatus.numeroSerie} alterado para ${statusForm.novoStatus}.`)
            fecharAlterarStatus()
            await carregarDados()
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Não foi possível alterar o status do equipamento.')
        } finally {
            setSalvando(false)
        }
    }


    const handleSubmitCotasPorModelo = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setErrorMessage(null)
        setSuccessMessage(null)

        if (!cotaModeloForm.contratoId) {
            setErrorMessage('Selecione o contrato para aplicar as cotas.')
            return
        }

        if (!cotaModeloForm.modeloId) {
            setErrorMessage('Selecione o modelo de equipamento.')
            return
        }

        const temAlgumaCota = Boolean(
            cotaModeloForm.cotaPbMensal.trim()
            || cotaModeloForm.cotaCorMensal.trim()
            || cotaModeloForm.cotaTotalMensal.trim(),
        )

        if (!temAlgumaCota) {
            setErrorMessage('Informe pelo menos uma cota: P/B, colorida ou total.')
            return
        }

        setSalvando(true)

        try {
            const retorno = await aplicarCotasPorModelo(cotaModeloForm)
            setSuccessMessage(
                `Cotas aplicadas para ${formatNumber(retorno.totalAtualizados)} equipamento(s) do modelo ${retorno.modelo} no contrato ${retorno.contrato}.`,
            )
            fecharCotasPorModelo()
            await carregarDados()
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Não foi possível aplicar cotas por modelo.')
        } finally {
            setSalvando(false)
        }
    }

    const exportarCsv = () => {
        const cabecalho = [
            'Numero de Serie',
            'Modelo',
            'Secretaria',
            'Setor',
            'Contrato',
            'Status',
            'Data Instalacao',
            'Data Retirada',
            'Valor Locacao Mensal',
            'Cota PB',
            'Cota Cor',
            'Cota Total',
            'Origem Cota',
            'Grupo Cota',
            'Descricao Origem Cota',
            'Ultimo Mes',
            'Consumo PB',
            'Consumo Cor',
            'Total Paginas',
            'Valor Calculado',
            'Uso PB %',
            'Uso Cor %',
            'Uso Total %',
            'Alerta',
        ]

        const linhas = equipamentosFiltrados.map((item) => [
            item.numeroSerie,
            item.modelo,
            item.secretaria,
            item.setor,
            item.contrato,
            item.status,
            item.dataInstalacao ?? '',
            item.dataRetirada ?? '',
            item.valorLocacaoMensal.toFixed(2),
            String(item.cotaPbMensal),
            String(item.cotaCorMensal),
            String(item.cotaTotalMensal),
            item.origemCotaLabel,
            item.tituloGrupoCota,
            item.origemCotaDescricao,
            formatMonth(item.ultimoMesReferencia),
            String(item.ultimoConsumoPb),
            String(item.ultimoConsumoCor),
            String(item.ultimoTotalPaginas),
            item.ultimoValorCalculado.toFixed(2),
            item.percentualUsoPb?.toFixed(2) ?? '',
            item.percentualUsoCor?.toFixed(2) ?? '',
            item.percentualUsoTotal?.toFixed(2) ?? '',
            getAlertaLabel(item.alerta),
        ])

        const csv = [cabecalho, ...linhas]
            .map((linha) => linha.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(';'))
            .join('\n')

        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `printcontrol-equipamentos-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="w-full max-w-none min-w-0 space-y-5 xl:space-y-6">
            <style>{`
                /*
                  Correção dos selects nativos no tema escuro.
                  Alguns navegadores abrem a lista com fundo claro, mas mantêm a cor
                  do texto herdada do tema escuro. Por isso forçamos o select nativo
                  a usar esquema claro: campo e opções com texto escuro legível.
                */
                select {
                    color-scheme: light !important;
                    background-color: #ffffff !important;
                    color: #0f172a !important;
                    -webkit-text-fill-color: #0f172a !important;
                }

                select:focus {
                    background-color: #ffffff !important;
                    color: #0f172a !important;
                    -webkit-text-fill-color: #0f172a !important;
                }

                select option {
                    background-color: #ffffff !important;
                    color: #0f172a !important;
                    -webkit-text-fill-color: #0f172a !important;
                }

                select option:checked,
                select option:hover {
                    background-color: #4f46e5 !important;
                    color: #ffffff !important;
                    -webkit-text-fill-color: #ffffff !important;
                }
            `}</style>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-300">
                        <Printer size={16} />
                        Etapa 83 — Cotas por tecnologia e equipamento
                    </div>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Equipamentos locados</h2>
                    <p className="mt-1 max-w-5xl text-sm text-slate-500 dark:text-slate-400">
                        Cadastro, edição e consulta operacional dos equipamentos, diferenciando cota geral por tecnologia, cota operacional por modelo e futura cota individual por equipamento.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                    <button
                        type="button"
                        onClick={abrirCotasPorModelo}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/10 transition hover:bg-amber-400"
                    >
                        <Layers3 size={16} />
                        Cotas por modelo
                    </button>
                    <button
                        type="button"
                        onClick={abrirNovoEquipamento}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/10 transition hover:bg-emerald-700"
                    >
                        <Plus size={16} />
                        Cadastrar equipamento
                    </button>
                    <button
                        type="button"
                        onClick={exportarCsv}
                        disabled={equipamentosFiltrados.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <Download size={16} />
                        Exportar CSV
                    </button>
                    <button
                        type="button"
                        onClick={() => void carregarDados()}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Atualizar
                    </button>
                </div>
            </div>

            {successMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <div className="flex gap-3">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                        <p className="font-semibold">{successMessage}</p>
                    </div>
                </div>
            )}

            {errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                    <div className="flex gap-3">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold">Atenção</p>
                            <p className="mt-1 break-words">{errorMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <CardResumo titulo="Equipamentos" valor={formatNumber(resumo.total)} descricao={`${formatNumber(resumo.ativos)} ativos no parque`} icon={Printer} tom="azul" />
                <CardResumo titulo="Modelos" valor={formatNumber(resumo.modelos)} descricao="Modelos diferentes em uso" icon={Layers3} tom="cinza" />
                <CardResumo titulo="Último consumo" valor={formatNumber(resumo.paginasUltimoMes)} descricao="Páginas no último registro aprovado" icon={BarChart3} tom="verde" />
                <CardResumo titulo="Locação mensal" valor={formatCurrency(resumo.locacaoMensal)} descricao="Soma dos valores dos modelos" icon={Building2} tom="azul" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button
                    type="button"
                    onClick={() => setFiltros((atual) => ({ ...atual, alerta: 'cota_geral' }))}
                    className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-left shadow-xs transition hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20"
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Cota geral</p>
                    <p className="mt-2 text-2xl font-bold text-cyan-900 dark:text-cyan-100">{formatNumber(resumo.cotaGeral)}</p>
                    <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">Controlados pela tecnologia/modelo contratual</p>
                </button>
                <button
                    type="button"
                    onClick={() => setFiltros((atual) => ({ ...atual, alerta: 'sem_cota' }))}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sem regra</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">{formatNumber(resumo.semRegra)}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sem regra de cota ou tecnologia definida</p>
                </button>
                <button
                    type="button"
                    onClick={() => setFiltros((atual) => ({ ...atual, alerta: 'atencao' }))}
                    className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left shadow-xs transition hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:hover:bg-amber-500/20"
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Atenção</p>
                    <p className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-100">{formatNumber(resumo.atencao)}</p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Uso igual ou acima de 70% em cota operacional</p>
                </button>
                <button
                    type="button"
                    onClick={() => setFiltros((atual) => ({ ...atual, alerta: 'critico' }))}
                    className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left shadow-xs transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Crítico</p>
                    <p className="mt-2 text-2xl font-bold text-rose-900 dark:text-rose-100">{formatNumber(resumo.criticos)}</p>
                    <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">Uso igual ou acima de 95% em cota operacional</p>
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Filtros</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Combine busca, secretaria, modelo, status e faixa de alerta.</p>
                    </div>
                    <button type="button" onClick={limparFiltros} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200">
                        Limpar filtros
                    </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(280px,1.6fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)]">
                    <div className="relative sm:col-span-2 xl:col-span-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={filtros.busca}
                            onChange={(event) => setFiltros((atual) => ({ ...atual, busca: event.target.value }))}
                            placeholder="Buscar por série, modelo, secretaria, setor..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950"
                        />
                    </div>

                    <select
                        value={filtros.secretaria}
                        onChange={(event) => setFiltros((atual) => ({ ...atual, secretaria: event.target.value }))}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 dark:border-slate-700 dark:bg-white dark:text-slate-900"
                    >
                        <option value="todos">Todas as secretarias</option>
                        {opcoes.secretarias.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filtros.modelo}
                        onChange={(event) => setFiltros((atual) => ({ ...atual, modelo: event.target.value }))}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 dark:border-slate-700 dark:bg-white dark:text-slate-900"
                    >
                        <option value="todos">Todos os modelos</option>
                        {opcoes.modelos.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filtros.alerta}
                        onChange={(event) => setFiltros((atual) => ({ ...atual, alerta: event.target.value }))}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 dark:border-slate-700 dark:bg-white dark:text-slate-900"
                    >
                        <option value="todos">Todos os alertas</option>
                        <option value="normal">Normal</option>
                        <option value="atencao">Atenção</option>
                        <option value="critico">Crítico</option>
                        <option value="cota_geral">Cota geral por tecnologia</option>
                        <option value="locacao_fixa">Locação fixa</option>
                        <option value="sem_cota">Sem regra de cota</option>
                        <option value="inativo">Inativo</option>
                    </select>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-2 border-b border-slate-100 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Lista de equipamentos</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {loading ? 'Carregando registros...' : `${formatNumber(equipamentosFiltrados.length)} equipamento(s) encontrado(s).`}
                        </p>
                    </div>
                </div>

                <div className="pc-table-scroll">
                    <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
                        <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-4">Série / Modelo</th>
                                <th className="px-5 py-4">Localização</th>
                                <th className="px-5 py-4">Contrato</th>
                                <th className="px-5 py-4">Locação</th>
                                <th className="px-5 py-4">Último consumo</th>
                                <th className="px-5 py-4">Cotas</th>
                                <th className="px-5 py-4">Uso da cota</th>
                                <th className="px-5 py-4">Alerta</th>
                                <th className="px-5 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 size={18} className="animate-spin" />
                                            Carregando equipamentos...
                                        </div>
                                    </td>
                                </tr>
                            ) : equipamentosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                                        Nenhum equipamento encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            ) : (
                                equipamentosFiltrados.map((item) => (
                                    <tr key={item.id} className="align-top transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100">{item.numeroSerie}</div>
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.modelo}</div>
                                            <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                {item.status}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-slate-800 dark:text-slate-200">{item.secretaria}</div>
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.setor}</div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{item.contrato}</td>
                                        <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(item.valorLocacaoMensal)}</td>
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100">{formatNumber(item.ultimoTotalPaginas)} pág.</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">P/B: {formatNumber(item.ultimoConsumoPb)} · Cor: {formatNumber(item.ultimoConsumoCor)}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{formatMonth(item.ultimoMesReferencia)} · {formatCurrency(item.ultimoValorCalculado)}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                {item.origemCotaLabel}
                                            </div>
                                            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Grupo: {item.tituloGrupoCota}</div>
                                            {possuiCotaOperacional(item.cotaPbMensal, item.cotaCorMensal, item.cotaTotalMensal) ? (
                                                <div className="mt-2 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                    <div>P/B: {formatNumber(item.cotaPbMensal)}</div>
                                                    <div>Cor: {formatNumber(item.cotaCorMensal)}</div>
                                                    <div>Total: {formatNumber(item.cotaTotalMensal)}</div>
                                                </div>
                                            ) : (
                                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Sem cota individual cadastrada.</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            {possuiCotaOperacional(item.cotaPbMensal, item.cotaCorMensal, item.cotaTotalMensal) ? (
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-slate-500 dark:text-slate-400">P/B</span>
                                                        <strong>{formatPercent(item.percentualUsoPb)}</strong>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-slate-500 dark:text-slate-400">Cor</span>
                                                        <strong>{formatPercent(item.percentualUsoCor)}</strong>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-slate-500 dark:text-slate-400">Total</span>
                                                        <strong>{formatPercent(item.percentualUsoTotal)}</strong>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="max-w-[180px] text-xs text-slate-500 dark:text-slate-400">{item.origemCotaDescricao}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={classNames('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', getAlertaClasses(item.alerta))}>
                                                {getAlertaLabel(item.alerta)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => abrirMovimentacao(item)}
                                                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                                >
                                                    <MoveRight size={14} />
                                                    Mover
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => abrirAlterarStatus(item)}
                                                    className={classNames(
                                                        'inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                                                        item.status.toLowerCase() === 'ativo'
                                                            ? 'border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10'
                                                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10',
                                                    )}
                                                >
                                                    <AlertTriangle size={14} />
                                                    {item.status.toLowerCase() === 'ativo' ? 'Retirar' : 'Ativar'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => abrirEditarEquipamento(item)}
                                                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                                                >
                                                    <Edit3 size={14} />
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => abrirHistoricoEquipamento(item)}
                                                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/10"
                                                >
                                                    <History size={14} />
                                                    Histórico
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelecionado(item)}
                                                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    <Eye size={14} />
                                                    Detalhes
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {formAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full pc-modal-wide overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {modoFormulario === 'novo' ? 'Cadastrar equipamento' : 'Editar equipamento'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Preencha os dados reais do equipamento, vínculo contratual e cotas mensais.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={fecharFormulario}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitFormulario} className="pc-scrollbar max-h-[76vh] overflow-y-auto p-4 sm:p-5">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Número de série *</label>
                                    <input
                                        type="text"
                                        value={form.numeroSerie}
                                        onChange={(event) => atualizarCampoForm('numeroSerie', event.target.value)}
                                        placeholder="Ex: U64198F2N917883"
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Modelo *</label>
                                    <select
                                        value={form.modeloId}
                                        onChange={(event) => atualizarCampoForm('modeloId', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    >
                                        <option value="">Selecione o modelo</option>
                                        {modelos.map((modelo) => (
                                            <option key={modelo.id} value={modelo.id}>
                                                {modelo.modelo} · {formatCurrency(modelo.valorLocacaoMensal)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(event) => atualizarCampoForm('status', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    >
                                        <option value="ativo">Ativo</option>
                                        <option value="inativo">Inativo</option>
                                        <option value="manutencao">Manutenção</option>
                                        <option value="retirado">Retirado</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Secretaria/Site</label>
                                    <select
                                        value={form.secretariaId}
                                        onChange={(event) => atualizarCampoForm('secretariaId', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    >
                                        <option value="">Sem secretaria</option>
                                        {secretarias.map((secretaria) => (
                                            <option key={secretaria.id} value={secretaria.id}>
                                                {secretaria.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Setor/Departamento</label>
                                    <select
                                        value={form.setorId}
                                        onChange={(event) => atualizarCampoForm('setorId', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    >
                                        <option value="">Sem setor</option>
                                        {setoresFiltradosFormulario.map((setor) => (
                                            <option key={setor.id} value={setor.id}>
                                                {setor.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Contrato</label>
                                    <select
                                        value={form.contratoId}
                                        onChange={(event) => atualizarCampoForm('contratoId', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    >
                                        <option value="">Sem contrato vinculado</option>
                                        {contratos.map((contrato) => (
                                            <option key={contrato.id} value={contrato.id}>
                                                {contrato.numeroContrato} · {contrato.fornecedor}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cota P/B mensal</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={form.cotaPbMensal}
                                        onChange={(event) => atualizarCampoForm('cotaPbMensal', event.target.value)}
                                        placeholder="Ex: 5000"
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cota colorida mensal</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={form.cotaCorMensal}
                                        onChange={(event) => atualizarCampoForm('cotaCorMensal', event.target.value)}
                                        placeholder="Ex: 1000"
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cota total mensal</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={form.cotaTotalMensal}
                                        onChange={(event) => atualizarCampoForm('cotaTotalMensal', event.target.value)}
                                        placeholder="Ex: 10000"
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Data de instalação</label>
                                    <input
                                        type="date"
                                        value={form.dataInstalacao}
                                        onChange={(event) => atualizarCampoForm('dataInstalacao', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Data de retirada</label>
                                    <input
                                        type="date"
                                        value={form.dataRetirada}
                                        onChange={(event) => atualizarCampoForm('dataRetirada', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    />
                                </div>

                                <div className="md:col-span-2 xl:col-span-3">
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Observações</label>
                                    <textarea
                                        value={form.observacoes}
                                        onChange={(event) => atualizarCampoForm('observacoes', event.target.value)}
                                        rows={3}
                                        placeholder="Ex: Equipamento instalado no setor, troca de sala, observação de contrato..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200">
                                <strong>Observação:</strong> o cadastro grava o equipamento na tabela <code>equipamentos</code>. Quando um contrato é selecionado, também cria ou atualiza o vínculo na tabela <code>contrato_equipamentos</code> com as cotas informadas.
                            </div>

                            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={fecharFormulario}
                                    disabled={salvando}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={salvando}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {modoFormulario === 'novo' ? 'Salvar equipamento' : 'Salvar alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {movimentacaoAberta && equipamentoMovimentacao && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full pc-modal-medium overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Movimentar equipamento</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Registre a mudança de secretaria/setor preservando o histórico do equipamento.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={fecharMovimentacao}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitMovimentacao} className="pc-scrollbar max-h-[76vh] overflow-y-auto p-4 sm:p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Origem atual</p>
                                    <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{equipamentoMovimentacao.secretaria}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{equipamentoMovimentacao.setor}</p>
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        Série {equipamentoMovimentacao.numeroSerie} · {equipamentoMovimentacao.modelo}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                                    <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">Destino selecionado</p>
                                    <p className="mt-2 font-semibold text-emerald-950 dark:text-emerald-100">
                                        {secretarias.find((item) => item.id === movimentacaoForm.secretariaDestinoId)?.nome ?? 'Selecione a secretaria'}
                                    </p>
                                    <p className="text-sm text-emerald-700 dark:text-emerald-200">
                                        {setores.find((item) => item.id === movimentacaoForm.setorDestinoId)?.nome ?? 'SEM DEPARTAMENTO'}
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Secretaria de destino</label>
                                    <select
                                        value={movimentacaoForm.secretariaDestinoId}
                                        onChange={(event) => atualizarCampoMovimentacao('secretariaDestinoId', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    >
                                        <option value="">Selecione...</option>
                                        {secretarias.map((secretaria) => (
                                            <option key={secretaria.id} value={secretaria.id}>{secretaria.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Setor de destino</label>
                                    <select
                                        value={movimentacaoForm.setorDestinoId}
                                        onChange={(event) => atualizarCampoMovimentacao('setorDestinoId', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    >
                                        <option value="">SEM DEPARTAMENTO</option>
                                        {setoresFiltradosMovimentacao.map((setor) => (
                                            <option key={setor.id} value={setor.id}>{setor.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Data da movimentação</label>
                                    <input
                                        type="date"
                                        value={movimentacaoForm.dataMovimentacao}
                                        onChange={(event) => atualizarCampoMovimentacao('dataMovimentacao', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Motivo da movimentação</label>
                                    <textarea
                                        value={movimentacaoForm.motivo}
                                        onChange={(event) => atualizarCampoMovimentacao('motivo', event.target.value)}
                                        rows={3}
                                        placeholder="Ex: Equipamento remanejado para atender novo setor da Secretaria de Saúde."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Obrigatório. Use pelo menos 10 caracteres para fins de auditoria.</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Observação adicional</label>
                                    <textarea
                                        value={movimentacaoForm.observacao}
                                        onChange={(event) => atualizarCampoMovimentacao('observacao', event.target.value)}
                                        rows={3}
                                        placeholder="Opcional: informe sala, responsável, OS/chamado, ou detalhe importante."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                                <strong>Atenção:</strong> esta ação atualiza a localização atual do equipamento e grava um registro em <code>equipamentos_movimentacoes_log</code> para manter histórico e auditoria.
                            </div>

                            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={fecharMovimentacao}
                                    disabled={salvando}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={salvando}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/10 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {salvando ? <Loader2 size={16} className="animate-spin" /> : <MoveRight size={16} />}
                                    Registrar movimentação
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {statusAberto && equipamentoStatus && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full pc-modal-medium overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Alterar status do equipamento</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Use esta ação para retirar, inativar, colocar em manutenção ou reativar um equipamento preservando histórico.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={fecharAlterarStatus}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitStatus} className="pc-scrollbar max-h-[76vh] overflow-y-auto p-4 sm:p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Equipamento selecionado</p>
                                    <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">{equipamentoStatus.numeroSerie}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{equipamentoStatus.modelo}</p>
                                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Status atual</p>
                                    <span className={classNames('mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', getAlertaClasses(equipamentoStatus.alerta))}>
                                        {equipamentoStatus.status}
                                    </span>
                                </div>

                                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Efeito da alteração</p>
                                    <p className="mt-2 text-sm text-indigo-900 dark:text-indigo-100">
                                        Se o status for <strong>retirado</strong> ou <strong>inativo</strong>, o sistema preencherá a data de retirada e desativará o vínculo contratual atual. Se voltar para <strong>ativo</strong>, a data de retirada será limpa.
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Novo status *</label>
                                    <select
                                        value={statusForm.novoStatus}
                                        onChange={(event) => atualizarCampoStatus('novoStatus', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    >
                                        <option value="ativo">Ativo</option>
                                        <option value="manutencao">Em manutenção</option>
                                        <option value="inativo">Inativo</option>
                                        <option value="retirado">Retirado</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Data do evento *</label>
                                    <input
                                        type="date"
                                        value={statusForm.dataEvento}
                                        onChange={(event) => atualizarCampoStatus('dataEvento', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-white dark:text-slate-900"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Motivo da alteração *</label>
                                    <textarea
                                        value={statusForm.motivo}
                                        onChange={(event) => atualizarCampoStatus('motivo', event.target.value)}
                                        rows={3}
                                        placeholder="Ex: Equipamento retirado pela empresa contratada para substituição."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Obrigatório. Use pelo menos 10 caracteres para auditoria.</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Observação adicional</label>
                                    <textarea
                                        value={statusForm.observacao}
                                        onChange={(event) => atualizarCampoStatus('observacao', event.target.value)}
                                        rows={3}
                                        placeholder="Opcional: informe OS, chamado, equipamento substituto ou detalhe importante."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                                <strong>Atenção:</strong> esta ação altera o status atual do equipamento e grava um registro em <code>equipamentos_status_log</code>.
                            </div>

                            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={fecharAlterarStatus}
                                    disabled={salvando}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={salvando}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Salvar status
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {historicoAberto && historicoEquipamento && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full pc-modal-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Histórico completo do equipamento</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {historicoEquipamento.numeroSerie} · {historicoEquipamento.modelo}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => void abrirHistoricoEquipamento(historicoEquipamento)}
                                    disabled={carregandoHistorico}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    {carregandoHistorico ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                    Atualizar
                                </button>
                                <button
                                    type="button"
                                    onClick={fecharHistorico}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="pc-scrollbar max-h-[72vh] overflow-y-auto p-4 sm:p-5">
                            <div className="grid gap-3 md:grid-cols-4">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Localização atual</p>
                                    <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">{historicoEquipamento.secretaria}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{historicoEquipamento.setor}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Movimentações</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{historicoMovimentacoes.length}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Trocas de secretaria/setor</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Status</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{historicoStatus.length}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Alterações registradas</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Leituras</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{historicoLeituras.length}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Competências localizadas</p>
                                </div>
                            </div>

                            {carregandoHistorico ? (
                                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 p-8 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    <Loader2 size={18} className="animate-spin" />
                                    Carregando histórico completo...
                                </div>
                            ) : (
                                <div className="mt-5 space-y-6">
                                    <section className="rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100">Movimentações de secretaria/setor</h4>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Histórico gravado na tabela equipamentos_movimentacoes_log.</p>
                                        </div>
                                        <div className="p-4">
                                            {historicoMovimentacoes.length === 0 ? (
                                                <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                                    Nenhuma movimentação registrada para este equipamento.
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {historicoMovimentacoes.map((movimento) => (
                                                        <div key={movimento.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                                        {formatDate(movimento.dataMovimentacao)} — {movimento.numeroSerie}
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                        Registrado em {formatDateTime(movimento.createdAt)}
                                                                    </p>
                                                                </div>
                                                                <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                                                                    Movimentação
                                                                </span>
                                                            </div>

                                                            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                                                                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                                                                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Origem</p>
                                                                    <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{movimento.secretariaOrigemNome}</p>
                                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{movimento.setorOrigemNome}</p>
                                                                </div>
                                                                <div className="hidden justify-center text-slate-400 md:flex">
                                                                    <MoveRight size={22} />
                                                                </div>
                                                                <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-500/10">
                                                                    <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">Destino</p>
                                                                    <p className="mt-1 font-semibold text-emerald-950 dark:text-emerald-100">{movimento.secretariaDestinoNome}</p>
                                                                    <p className="text-sm text-emerald-700 dark:text-emerald-200">{movimento.setorDestinoNome}</p>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                                                                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Motivo</p>
                                                                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{movimento.motivo}</p>
                                                                {movimento.observacao && (
                                                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Obs.: {movimento.observacao}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section className="rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100">Alterações de status</h4>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Histórico gravado na tabela equipamentos_status_log.</p>
                                        </div>
                                        <div className="p-4">
                                            {historicoStatus.length === 0 ? (
                                                <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                                    Nenhuma alteração de status registrada para este equipamento.
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {historicoStatus.map((statusItem) => (
                                                        <div key={statusItem.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatDate(statusItem.dataEvento)}</p>
                                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Registrado em {formatDateTime(statusItem.createdAt)}</p>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{statusItem.statusAnterior}</span>
                                                                    <MoveRight size={16} className="text-slate-400" />
                                                                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">{statusItem.statusNovo}</span>
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                                                                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Motivo</p>
                                                                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{statusItem.motivo}</p>
                                                                {statusItem.observacao && (
                                                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Obs.: {statusItem.observacao}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section className="rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100">Leituras mensais vinculadas</h4>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Busca por equipamento_id e também pelo número de série no PDF.</p>
                                        </div>
                                        <div className="pc-table-scroll">
                                            {historicoLeituras.length === 0 ? (
                                                <div className="m-4 rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                                    Nenhuma leitura mensal localizada para este equipamento.
                                                </div>
                                            ) : (
                                                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                                                    <thead className="bg-slate-50 dark:bg-slate-950">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Competência</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Relatório</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Local no PDF</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">P/B</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Cor</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Valor</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {historicoLeituras.map((leitura) => (
                                                            <tr key={leitura.id} className="align-top">
                                                                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{formatMonth(leitura.mesReferencia)}</td>
                                                                <td className="px-4 py-3">
                                                                    <div className="font-medium text-slate-800 dark:text-slate-200">{leitura.nomeArquivo}</div>
                                                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{leitura.classificacaoAf}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="font-medium text-slate-800 dark:text-slate-200">{leitura.siteTextoPdf}</div>
                                                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{leitura.deptoTextoPdf}</div>
                                                                    <div className="mt-1 text-xs text-slate-400">Série PDF: {leitura.serieTextoPdf}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                                    <div>Ant.: {formatNumber(leitura.antPb)}</div>
                                                                    <div>Atu.: {formatNumber(leitura.atuPb)}</div>
                                                                    <strong>Saldo: {formatNumber(leitura.saldoPb)}</strong>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                                    <div>Ant.: {formatNumber(leitura.antCor)}</div>
                                                                    <div>Atu.: {formatNumber(leitura.atuCor)}</div>
                                                                    <strong>Saldo: {formatNumber(leitura.saldoCor)}</strong>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(leitura.totalCalculado)}</div>
                                                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">PDF: {formatCurrency(leitura.totalGeralPdf)}</div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400">Relatório: {leitura.statusRelatorio}</div>
                                                                    {leitura.divergente && (
                                                                        <span className="mt-2 inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                                                                            Divergente
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}



            {cotasModeloAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
                    <div className="w-full pc-modal-medium overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Cotas operacionais por modelo</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Use esta ação apenas quando quiser criar uma cota operacional por modelo para apoiar alertas. A regra principal do contrato continua sendo a cota geral por tecnologia.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={fecharCotasPorModelo}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitCotasPorModelo} className="space-y-5 p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Contrato</span>
                                    <select
                                        value={cotaModeloForm.contratoId}
                                        onChange={(event) => atualizarCampoCotaModelo('contratoId', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    >
                                        <option value="">Selecione o contrato</option>
                                        {contratos.map((contrato) => (
                                            <option key={contrato.id} value={contrato.id}>
                                                {contrato.numeroContrato} {contrato.fornecedor ? `- ${contrato.fornecedor}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-2 text-sm">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Modelo</span>
                                    <select
                                        value={cotaModeloForm.modeloId}
                                        onChange={(event) => atualizarCampoCotaModelo('modeloId', event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-hidden transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    >
                                        <option value="">Selecione o modelo</option>
                                        {modelos.map((modelo) => {
                                            const totalModelo = equipamentos.filter((item) => item.modeloId === modelo.id).length
                                            return (
                                                <option key={modelo.id} value={modelo.id}>
                                                    {modelo.modelo} ({formatNumber(totalModelo)} equip.)
                                                </option>
                                            )
                                        })}
                                    </select>
                                </label>
                            </div>

                            <div className="grid gap-3 lg:grid-cols-4">
                                {ITENS_CONTRATO_REFERENCIA.map((item) => (
                                    <div key={item.codigo} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/70">
                                        <p className="font-bold text-slate-900 dark:text-slate-100">{item.codigo}</p>
                                        <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">{item.titulo}</p>
                                        <p className="mt-1 text-slate-500 dark:text-slate-400">Média/mês: {formatNumber(item.mediaMensal)}</p>
                                        <p className="text-slate-500 dark:text-slate-400">Unit.: {item.valorUnitario}</p>
                                    </div>
                                ))}
                            </div>

                            {sugestaoCotaModeloSelecionado && (
                                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Sugestão operacional para o modelo selecionado</p>
                                            <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">{sugestaoCotaModeloSelecionado.modelo} · {sugestaoCotaModeloSelecionado.tituloGrupo}</h4>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                Item base: <strong>{sugestaoCotaModeloSelecionado.codigoItemPrincipal}</strong> — {sugestaoCotaModeloSelecionado.descricaoItemPrincipal}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {sugestaoCotaModeloSelecionado.observacao}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={usarSugestaoCotaSelecionada}
                                            disabled={!sugestaoCotaModeloSelecionado.aplicavel}
                                            className="inline-flex items-center justify-center rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-500/30 dark:bg-slate-950 dark:text-indigo-200 dark:hover:bg-indigo-500/10"
                                        >
                                            Usar sugestão
                                        </button>
                                    </div>

                                    <div className="mt-4 grid gap-3 md:grid-cols-5">
                                        <div className="rounded-xl bg-white p-3 dark:bg-slate-950/80">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Equip. do modelo</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatNumber(sugestaoCotaModeloSelecionado.quantidadeEquipamentosModelo)}</p>
                                        </div>
                                        <div className="rounded-xl bg-white p-3 dark:bg-slate-950/80">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Equip. do grupo</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatNumber(sugestaoCotaModeloSelecionado.quantidadeEquipamentosGrupo)}</p>
                                        </div>
                                        <div className="rounded-xl bg-white p-3 dark:bg-slate-950/80">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">P/B operacional</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatNumber(sugestaoCotaModeloSelecionado.cotaPbMensal)}</p>
                                        </div>
                                        <div className="rounded-xl bg-white p-3 dark:bg-slate-950/80">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Cor operacional</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatNumber(sugestaoCotaModeloSelecionado.cotaCorMensal)}</p>
                                        </div>
                                        <div className="rounded-xl bg-white p-3 dark:bg-slate-950/80">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Total operacional</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatNumber(sugestaoCotaModeloSelecionado.cotaTotalMensal)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-3">
                                <label className="space-y-2 text-sm">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Cota P/B mensal</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cotaModeloForm.cotaPbMensal}
                                        onChange={(event) => atualizarCampoCotaModelo('cotaPbMensal', event.target.value)}
                                        placeholder="Ex: 5000"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-hidden transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </label>

                                <label className="space-y-2 text-sm">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Cota colorida mensal</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cotaModeloForm.cotaCorMensal}
                                        onChange={(event) => atualizarCampoCotaModelo('cotaCorMensal', event.target.value)}
                                        placeholder="Ex: 1000"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-hidden transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </label>

                                <label className="space-y-2 text-sm">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Cota total mensal</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cotaModeloForm.cotaTotalMensal}
                                        onChange={(event) => atualizarCampoCotaModelo('cotaTotalMensal', event.target.value)}
                                        placeholder="Ex: 10000"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-hidden transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </label>
                            </div>

                            <label className="space-y-2 text-sm">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Observação</span>
                                <textarea
                                    value={cotaModeloForm.observacoes}
                                    onChange={(event) => atualizarCampoCotaModelo('observacoes', event.target.value)}
                                    rows={3}
                                    placeholder="Ex: Cota padrão aplicada por modelo conforme contrato 183/2024."
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-hidden transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                />
                            </label>

                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                                <strong>Atenção:</strong> esta ação cria uma cota operacional por modelo para apoio aos alertas. A cota contratual principal continua sendo geral por tecnologia. Futuramente, use o botão Editar para cadastrar exceção individual por equipamento.
                            </div>

                            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={fecharCotasPorModelo}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={salvando}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Cotas por modelo ao modelo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selecionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full pc-modal-medium overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Detalhes do equipamento</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selecionado.numeroSerie} · {selecionado.modelo}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelecionado(null)}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="pc-scrollbar max-h-[70vh] overflow-y-auto p-4 sm:p-5">
                            <div className="mb-4 flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => abrirMovimentacao(selecionado)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    <MoveRight size={16} />
                                    Mover equipamento
                                </button>
                                <button
                                    type="button"
                                    onClick={() => abrirHistoricoEquipamento(selecionado)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
                                >
                                    <History size={16} />
                                    Histórico
                                </button>
                                <button
                                    type="button"
                                    onClick={() => abrirEditarEquipamento(selecionado)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                >
                                    <Edit3 size={16} />
                                    Editar equipamento
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Localização</p>
                                    <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{selecionado.secretaria}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{selecionado.setor}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Contrato e status</p>
                                    <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">Contrato {selecionado.contrato}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Status: {selecionado.status}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Custo mensal</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(selecionado.valorLocacaoMensal)}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Valor de locação cadastrado no modelo</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Última leitura</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{formatNumber(selecionado.ultimoTotalPaginas)}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatMonth(selecionado.ultimoMesReferencia)} · {formatCurrency(selecionado.ultimoValorCalculado)}</p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Regra de cota</p>
                                        <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{selecionado.origemCotaLabel}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{selecionado.origemCotaDescricao}</p>
                                    </div>
                                    <span className={classNames('inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold', getAlertaClasses(selecionado.alerta))}>
                                        {getAlertaLabel(selecionado.alerta)}
                                    </span>
                                </div>
                                <div className="mt-3 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">P/B</p>
                                        <p className="font-bold text-slate-900 dark:text-slate-100">{formatNumber(selecionado.cotaPbMensal)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Uso: {formatPercent(selecionado.percentualUsoPb)}</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Colorida</p>
                                        <p className="font-bold text-slate-900 dark:text-slate-100">{formatNumber(selecionado.cotaCorMensal)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Uso: {formatPercent(selecionado.percentualUsoCor)}</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                                        <p className="font-bold text-slate-900 dark:text-slate-100">{formatNumber(selecionado.cotaTotalMensal)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Uso: {formatPercent(selecionado.percentualUsoTotal)}</p>
                                    </div>
                                </div>
                            </div>

                            {selecionado.observacoes && (
                                <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Observações</p>
                                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{selecionado.observacoes}</p>
                                </div>
                            )}

                            <div className={classNames('mt-4 rounded-xl border p-4', getAlertaClasses(selecionado.alerta))}>
                                <div className="flex items-center gap-2 font-semibold">
                                    {selecionado.alerta === 'normal' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                                    Situação: {getAlertaLabel(selecionado.alerta)}
                                </div>
                                <p className="mt-1 text-sm">
                                    Quando houver cota operacional por modelo ou cota individual, o alerta usa o maior percentual de consumo. Quando houver apenas cota geral por tecnologia, o controle principal fica no contrato/tecnologia, não no equipamento individual.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
