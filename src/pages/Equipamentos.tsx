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
    Layers3,
    Loader2,
    Plus,
    Printer,
    RefreshCw,
    Save,
    Search,
    X,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

type AlertaCota = 'normal' | 'atencao' | 'critico' | 'sem_cota' | 'inativo'
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

function calcularAlerta(status: string, percentualUsoPb: number | null, percentualUsoCor: number | null, percentualUsoTotal: number | null): AlertaCota {
    const statusNormalizado = status.toLowerCase()

    if (statusNormalizado && !['ativo', 'online', 'em_uso', 'em uso'].includes(statusNormalizado)) {
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
        return 'Sem cota'
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

function classNames(...items: Array<string | false | null | undefined>): string {
    return items.filter(Boolean).join(' ')
}

function getAlertaLabel(alerta: AlertaCota): string {
    const labels: Record<AlertaCota, string> = {
        normal: 'Normal',
        atencao: 'Atenção',
        critico: 'Crítico',
        sem_cota: 'Sem cota',
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

    return {
        id: toText(row.id ?? row.equipamento_id ?? row.numero_serie, safeId()),
        numeroSerie: toText(row.numero_serie ?? row.serie ?? row.serial ?? row.numero_serie_equipamento),
        modeloId: toText(row.modelo_id, '') || null,
        modelo: toText(row.modelo ?? row.modelo_nome ?? row.nome_modelo ?? row.modelo_equipamento ?? row.modelo_texto_pdf),
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
        ultimoMesReferencia: toText(row.ultimo_mes_referencia ?? row.mes_referencia, '') || null,
        ultimoConsumoPb,
        ultimoConsumoCor,
        ultimoTotalPaginas,
        ultimoValorCalculado: toNumber(row.ultimo_total_calculado ?? row.total_calculado ?? row.valor_calculado),
        percentualUsoPb,
        percentualUsoCor,
        percentualUsoTotal,
        alerta: calcularAlerta(status, percentualUsoPb, percentualUsoCor, percentualUsoTotal),
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

        return {
            id: equipamentoId,
            numeroSerie: toText(item.numero_serie),
            modeloId: toText(item.modelo_id, '') || toText(modelo.id, '') || null,
            modelo: toText(modelo.modelo),
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
            ultimoMesReferencia: toText(relatorio.mes_referencia, '') || null,
            ultimoConsumoPb,
            ultimoConsumoCor,
            ultimoTotalPaginas,
            ultimoValorCalculado: toNumber(leitura.total_calculado),
            percentualUsoPb,
            percentualUsoCor,
            percentualUsoTotal,
            alerta: calcularAlerta(status, percentualUsoPb, percentualUsoCor, percentualUsoTotal),
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

function CardResumo({ titulo, valor, descricao, icon: Icon, tom = 'azul' }: CardResumoProps) {
    const tons = {
        azul: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
        verde: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        amarelo: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        vermelho: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
        cinza: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
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
        const semCota = equipamentos.filter((item) => item.alerta === 'sem_cota').length
        const atencao = equipamentos.filter((item) => item.alerta === 'atencao').length
        const criticos = equipamentos.filter((item) => item.alerta === 'critico').length
        const paginasUltimoMes = equipamentos.reduce((total, item) => total + item.ultimoTotalPaginas, 0)
        const locacaoMensal = equipamentos.reduce((total, item) => total + item.valorLocacaoMensal, 0)
        const modelosDiferentes = new Set(equipamentos.map((item) => item.modelo).filter((item) => item && item !== '-')).size

        return {
            total: equipamentos.length,
            ativos: ativos.length,
            semCota,
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
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-300">
                        <Printer size={16} />
                        Etapa 82 — Controle de Equipamentos
                    </div>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Equipamentos locados</h2>
                    <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                        Cadastro, edição e consulta operacional dos equipamentos reais do contrato, vinculando série, modelo, secretaria, setor, cotas e último consumo aprovado.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
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

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <CardResumo titulo="Equipamentos" valor={formatNumber(resumo.total)} descricao={`${formatNumber(resumo.ativos)} ativos no parque`} icon={Printer} tom="azul" />
                <CardResumo titulo="Modelos" valor={formatNumber(resumo.modelos)} descricao="Modelos diferentes em uso" icon={Layers3} tom="cinza" />
                <CardResumo titulo="Último consumo" valor={formatNumber(resumo.paginasUltimoMes)} descricao="Páginas no último registro aprovado" icon={BarChart3} tom="verde" />
                <CardResumo titulo="Locação mensal" valor={formatCurrency(resumo.locacaoMensal)} descricao="Soma dos valores dos modelos" icon={Building2} tom="azul" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <button
                    type="button"
                    onClick={() => setFiltros((atual) => ({ ...atual, alerta: 'sem_cota' }))}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sem cota</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">{formatNumber(resumo.semCota)}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Equipamentos sem cota cadastrada</p>
                </button>
                <button
                    type="button"
                    onClick={() => setFiltros((atual) => ({ ...atual, alerta: 'atencao' }))}
                    className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left shadow-xs transition hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:hover:bg-amber-500/20"
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Atenção</p>
                    <p className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-100">{formatNumber(resumo.atencao)}</p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Uso igual ou acima de 70%</p>
                </button>
                <button
                    type="button"
                    onClick={() => setFiltros((atual) => ({ ...atual, alerta: 'critico' }))}
                    className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left shadow-xs transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Crítico</p>
                    <p className="mt-2 text-2xl font-bold text-rose-900 dark:text-rose-100">{formatNumber(resumo.criticos)}</p>
                    <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">Uso igual ou acima de 95%</p>
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Filtros</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Combine busca, secretaria, modelo, status e faixa de alerta.</p>
                    </div>
                    <button type="button" onClick={limparFiltros} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200">
                        Limpar filtros
                    </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <div className="relative xl:col-span-2">
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
                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    >
                        <option value="todos">Todos os alertas</option>
                        <option value="normal">Normal</option>
                        <option value="atencao">Atenção</option>
                        <option value="critico">Crítico</option>
                        <option value="sem_cota">Sem cota</option>
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

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
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
                                            <div className="text-xs text-slate-500 dark:text-slate-400">P/B: {formatNumber(item.cotaPbMensal)}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Cor: {formatNumber(item.cotaCorMensal)}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Total: {formatNumber(item.cotaTotalMensal)}</div>
                                        </td>
                                        <td className="px-5 py-4">
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
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={classNames('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', getAlertaClasses(item.alerta))}>
                                                {getAlertaLabel(item.alerta)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex justify-end gap-2">
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
                    <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
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

                        <form onSubmit={handleSubmitFormulario} className="max-h-[76vh] overflow-y-auto p-5">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Número de série *</label>
                                    <input
                                        type="text"
                                        value={form.numeroSerie}
                                        onChange={(event) => atualizarCampoForm('numeroSerie', event.target.value)}
                                        placeholder="Ex: U64198F2N917883"
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Modelo *</label>
                                    <select
                                        value={form.modeloId}
                                        onChange={(event) => atualizarCampoForm('modeloId', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Data de instalação</label>
                                    <input
                                        type="date"
                                        value={form.dataInstalacao}
                                        onChange={(event) => atualizarCampoForm('dataInstalacao', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Data de retirada</label>
                                    <input
                                        type="date"
                                        value={form.dataRetirada}
                                        onChange={(event) => atualizarCampoForm('dataRetirada', event.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-hidden transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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

            {selecionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
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

                        <div className="max-h-[70vh] overflow-y-auto p-5">
                            <div className="mb-4 flex justify-end">
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
                                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Cotas e percentual de uso</p>
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
                                    O alerta é calculado com base no maior percentual de uso encontrado entre P/B, colorida e total. Sem cota significa que ainda não há franquia cadastrada para o equipamento.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
