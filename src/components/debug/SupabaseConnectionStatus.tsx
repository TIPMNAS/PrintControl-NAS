import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

type ConnectionState = 'loading' | 'success' | 'warning' | 'error'

export function SupabaseConnectionStatus() {
    const [state, setState] = useState<ConnectionState>('loading')
    const [message, setMessage] = useState('Testando configuração do Supabase...')

    useEffect(() => {
        async function testConnection() {
            try {
                const { error } = await supabase
                    .from('contratos')
                    .select('id, numero_contrato, fornecedor')
                    .limit(1)

                if (error) {
                    setState('warning')
                    setMessage(
                        `Supabase configurado, mas a consulta foi bloqueada ou falhou: ${error.message}`
                    )
                    return
                }

                setState('success')
                setMessage('Supabase configurado e consulta de teste executada com sucesso.')
            } catch (error) {
                setState('error')
                setMessage(
                    error instanceof Error
                        ? error.message
                        : 'Erro desconhecido ao testar conexão com Supabase.'
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
        ) : (
            <AlertTriangle className="h-5 w-5 text-amber-400" />
        )

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200 shadow-sm">
            <div className="flex items-start gap-3">
                {icon}

                <div>
                    <h3 className="font-semibold text-white">Status Supabase</h3>
                    <p className="mt-1 text-slate-300">{message}</p>

                    {state === 'warning' && (
                        <p className="mt-2 text-xs text-amber-300">
                            Observação: se o erro for de RLS/permissão, isso pode ser normal antes da tela de login.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}