import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, Loader2, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

type ConnectionState = 'loading' | 'success' | 'warning' | 'error'

type ContratoBasico = {
    id: string
    numero_contrato: string
    fornecedor: string
}

export function SupabaseConnectionStatus() {
    const [state, setState] = useState<ConnectionState>('loading')
    const [message, setMessage] = useState('Testando configuração do Supabase...')

    useEffect(() => {
        async function testConnection() {
            try {
                setState('loading')
                setMessage('Testando configuração do Supabase...')

                const {
                    data: { session },
                } = await supabase.auth.getSession()

                const { data: contratosRaw, error } = await supabase
                    .from('contratos')
                    .select('id, numero_contrato, fornecedor')
                    .limit(1)

                if (error) {
                    setState('warning')
                    setMessage(
                        `Supabase configurado, mas a consulta foi bloqueada ou falhou: ${error.message}`,
                    )
                    return
                }

                const contratos = (contratosRaw ?? []) as unknown as ContratoBasico[]

                if (contratos.length === 0) {
                    setState('warning')

                    if (!session) {
                        setMessage(
                            'Supabase configurado, mas nenhum contrato ficou visível porque o usuário ainda não está logado.',
                        )
                        return
                    }

                    setMessage(
                        'Supabase configurado, mas nenhum contrato ficou visível para o usuário autenticado. Verifique as políticas RLS/permissões.',
                    )
                    return
                }

                const contrato = contratos[0]

                setState('success')
                setMessage(
                    `Supabase configurado. Contrato visível: ${contrato.numero_contrato} - ${contrato.fornecedor}.`,
                )
            } catch (error) {
                setState('error')
                setMessage(
                    error instanceof Error
                        ? error.message
                        : 'Erro desconhecido ao testar conexão com Supabase.',
                )
            }
        }

        testConnection()
    }, [])

    const icon =
        state === 'loading' ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
        ) : state === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : state === 'error' ? (
            <XCircle className="h-5 w-5 text-red-400" />
        ) : (
            <AlertTriangle className="h-5 w-5 text-amber-400" />
        )

    const borderColor =
        state === 'success'
            ? 'border-emerald-900/60'
            : state === 'error'
                ? 'border-red-900/60'
                : state === 'warning'
                    ? 'border-amber-900/60'
                    : 'border-slate-800'

    return (
        <div
            className={`rounded-2xl border ${borderColor} bg-slate-900/80 p-4 text-sm text-slate-200 shadow-sm`}
        >
            <div className="flex items-start gap-3">
                {icon}

                <div>
                    <h3 className="font-semibold text-white">Status Supabase</h3>

                    <p className="mt-1 text-slate-300">{message}</p>

                    {state === 'warning' && (
                        <p className="mt-2 text-xs text-amber-300">
                            Observação: se o usuário ainda não estiver logado, é normal que o Supabase não retorne os dados protegidos por RLS.
                        </p>
                    )}

                    {state === 'error' && (
                        <p className="mt-2 text-xs text-red-300">
                            Verifique se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão corretas no arquivo .env.local.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}