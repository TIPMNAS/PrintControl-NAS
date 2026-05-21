import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setCarregando(true)
        setErro(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: senha,
        })

        setCarregando(false)

        if (error) {
            setErro('E-mail ou senha inválidos. Verifique os dados e tente novamente.')
            return
        }

        navigate('/dashboard')
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                <div className="mb-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-lg font-bold">
                        P
                    </div>

                    <h1 className="text-2xl font-bold">Entrar no PrintControl NAS</h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Acesse com seu usuário autorizado para consultar os dados reais dos relatórios de impressoras.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            E-mail
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                            placeholder="admin@printcontrol.local"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Senha
                        </label>

                        <input
                            type="password"
                            value={senha}
                            onChange={(event) => setSenha(event.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                            placeholder="Digite sua senha"
                            required
                        />
                    </div>

                    {erro && (
                        <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                            {erro}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={carregando}
                        className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {carregando ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    )
}