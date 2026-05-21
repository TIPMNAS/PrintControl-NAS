import { useMemo, useState } from 'react'
import {
    AlertTriangle,
    Bot,
    CheckCircle2,
    Clock3,
    Database,
    FileText,
    Filter,
    Loader2,
    RefreshCw,
    Search,
    XCircle,
} from 'lucide-react'

import { useFilaProcessamento } from '../hooks/useFilaProcessamento'
import type { FilaProcessamentoItem } from '../types/filaProcessamento'
import { formatNumber } from '../utils/formatters'

function normalizarTexto(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
}

function formatarDataHora(value: string | null) {
    if (!value) return 'Não informado'

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value))
}

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        aguardando_processamento: 'Aguardando',
        em_processamento: 'Em processamento',
        extraido: 'Extraído',
        normalizado: 'Normalizado',
        validado: 'Validado',
        importado: 'Importado',
        aprovado: 'Aprovado',
        rejeitado: 'Rejeitado',
        erro: 'Erro',
    }

    return labels[status] ?? status
}

function getStatusClasses(status: string) {
    if (status === 'aprovado' || status === 'importado' || status === 'validado') {
        return 'border-emerald-800 bg-emerald-950/50 text-emerald-300'
    }

    if (status === 'erro' || status === 'rejeitado') {
        return 'border-red-800 bg-red-950/50 text-red-300'
    }

    if (status === 'em_processamento') {
        return 'border-blue-800 bg-blue-950/50 text-blue-300'
    }

    if (status === 'aguardando_processamento') {
        return 'border-amber-800 bg-amber-950/50 text-amber-300'
    }

    return 'border-violet-800 bg-violet-950/50 text-violet-300'
}

function getStatusIcon(status: string) {
    if (status === 'aprovado' || status === 'importado' || status === 'validado') {
        return <CheckCircle2 className="h-4 w-4" />
    }

    if (status === 'erro' || status === 'rejeitado') {
        return <XCircle className="h-4 w-4" />
    }

    if (status === 'em_processamento') {
        return <Loader2 className="h-4 w-4 animate-spin" />
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

function SimNaoBadge({ ativo, label }: { ativo: boolean; label: string }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${ativo
                    ? 'border-emerald-800 bg-emerald-950/50 text-emerald-300'
                    : 'border-slate-700 bg-slate-950 text-slate-400'
                }`}
        >
            {ativo ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
            {label}
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

export default function FilaProcessamento() {
    const { data, isLoading, isError, error, refetch, isFetching } =
        useFilaProcessamento()

    const [busca, setBusca] = useState('')
    const [statusFiltro, setStatusFiltro] = useState('todos')

    const itensFiltrados = useMemo(() => {
        const textoBusca = normalizarTexto(busca.trim())

        return (
            data?.itens.filter((item: FilaProcessamentoItem) => {
                const bateStatus = statusFiltro === 'todos' || item.status === statusFiltro

                const textoItem = normalizarTexto(
                    [
                        item.nomeArquivo,
                        item.arquivoHash ?? '',
                        item.status,
                        item.mensagemErro ?? '',
                    ].join(' '),
                )

                const bateBusca = !textoBusca || textoItem.includes(textoBusca)

                return bateStatus && bateBusca
            }) ?? []
        )
    }, [busca, data?.itens, statusFiltro])

    if (isLoading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm text-slate-200">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                    Carregando fila de processamento...
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
                            Não foi possível carregar a fila de processamento.
                        </h2>

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

    const resumo = data?.resumo

    return (
        <div className="space-y-6">
            <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-sm font-medium text-violet-300">n8n / IA</p>

                    <h1 className="mt-1 text-2xl font-bold text-white">
                        Fila de processamento de PDFs
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm text-slate-400">
                        Acompanhe os relatórios enviados para leitura automática com n8n,
                        OCR/IA, validação do JSON e importação para as tabelas reais.
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
                    titulo="Total na fila"
                    valor={formatNumber(resumo?.total ?? 0)}
                    descricao="PDFs registrados para processamento"
                />

                <ResumoCard
                    titulo="Aguardando"
                    valor={formatNumber(resumo?.aguardando ?? 0)}
                    descricao="Ainda não reservados pelo n8n"
                />

                <ResumoCard
                    titulo="Em processamento"
                    valor={formatNumber(resumo?.emProcessamento ?? 0)}
                    descricao="Reservados ou em leitura pela automação"
                />

                <ResumoCard
                    titulo="Erros/Rejeitados"
                    valor={formatNumber((resumo?.erros ?? 0) + (resumo?.rejeitados ?? 0))}
                    descricao="Necessitam análise manual"
                />
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />

                        <input
                            value={busca}
                            onChange={(event) => setBusca(event.target.value)}
                            placeholder="Buscar por arquivo, hash, status ou erro..."
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
                            <option value="aguardando_processamento">Aguardando</option>
                            <option value="em_processamento">Em processamento</option>
                            <option value="extraido">Extraído</option>
                            <option value="normalizado">Normalizado</option>
                            <option value="validado">Validado</option>
                            <option value="importado">Importado</option>
                            <option value="aprovado">Aprovado</option>
                            <option value="erro">Erro</option>
                            <option value="rejeitado">Rejeitado</option>
                        </select>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-sm">
                <div className="border-b border-slate-800 px-5 py-4">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                        <Bot className="h-5 w-5 text-violet-300" />
                        Itens da fila
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Esta tela é apenas de acompanhamento. Reprocessar ou cancelar será
                        implementado em etapa futura.
                    </p>
                </div>

                {itensFiltrados.length === 0 ? (
                    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
                        <Database className="h-10 w-10 text-slate-600" />

                        <h3 className="mt-4 text-base font-semibold text-slate-200">
                            Nenhum item encontrado na fila
                        </h3>

                        <p className="mt-1 max-w-md text-sm text-slate-500">
                            Quando um PDF for enviado para processamento, ele aparecerá aqui
                            com o status atual da automação.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[1220px] w-full text-left text-sm">
                            <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">Arquivo</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Tentativas</th>
                                    <th className="px-5 py-3">Payloads</th>
                                    <th className="px-5 py-3">Erro</th>
                                    <th className="px-5 py-3">Criado em</th>
                                    <th className="px-5 py-3">Atualizado em</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800">
                                {itensFiltrados.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-800/40">
                                        <td className="px-5 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 rounded-xl bg-violet-950/60 p-2 text-violet-300">
                                                    <FileText className="h-4 w-4" />
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-slate-100">
                                                        {item.nomeArquivo}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        ID: {item.id.slice(0, 8)}
                                                    </p>

                                                    <p className="mt-1 max-w-[360px] truncate text-xs text-slate-500">
                                                        Hash: {item.arquivoHash ?? 'Não informado'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <StatusBadge status={item.status} />
                                        </td>

                                        <td className="px-5 py-4 text-right text-slate-300">
                                            {formatNumber(item.tentativas)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <SimNaoBadge ativo={item.temPayloadExtraido} label="Extraído" />
                                                <SimNaoBadge
                                                    ativo={item.temPayloadNormalizado}
                                                    label="Normalizado"
                                                />
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            {item.mensagemErro ? (
                                                <div className="flex max-w-[360px] items-start gap-2 text-xs text-red-300">
                                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                                    <span>{item.mensagemErro}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-500">Sem erro registrado</span>
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-slate-400">
                                            {formatarDataHora(item.criadoEm)}
                                        </td>

                                        <td className="px-5 py-4 text-slate-400">
                                            {formatarDataHora(item.atualizadoEm)}
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