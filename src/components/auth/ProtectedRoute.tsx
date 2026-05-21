import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

type ProtectedRouteProps = {
    children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [carregando, setCarregando] = useState(true)
    const [autenticado, setAutenticado] = useState(false)

    useEffect(() => {
        let mounted = true

        async function verificarSessao() {
            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (!mounted) return

            setAutenticado(!!session)
            setCarregando(false)
        }

        verificarSessao()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setAutenticado(!!session)
            setCarregando(false)
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    if (carregando) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                    Verificando sessão...
                </div>
            </div>
        )
    }

    if (!autenticado) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}