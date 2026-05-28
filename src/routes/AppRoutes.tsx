import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import AppLayout from '../components/layout/AppLayout'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

const Login = lazy(() => import('../pages/Login'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const RelatoriosPdf = lazy(() => import('../pages/RelatoriosPdf'))
const RelatorioDetalhe = lazy(() => import('../pages/RelatorioDetalhe'))
const FilaProcessamento = lazy(() => import('../pages/FilaProcessamento'))
const Leituras = lazy(() => import('../pages/Leituras'))
const Equipamentos = lazy(() => import('../pages/Equipamentos'))
const Modelos = lazy(() => import('../pages/Modelos'))
const Secretarias = lazy(() => import('../pages/Secretarias'))
const Setores = lazy(() => import('../pages/Setores'))
const Contratos = lazy(() => import('../pages/Contratos'))
const Saldos = lazy(() => import('../pages/Saldos'))
const PapelA4 = lazy(() => import('../pages/PapelA4'))
const Configuracoes = lazy(() => import('../pages/Configuracoes'))

function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center px-4 py-10">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-6 py-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-violet-500 dark:border-slate-700 dark:border-t-violet-400" />
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Carregando tela...</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Aguarde enquanto o módulo é carregado.</p>
        </div>
      </div>
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/relatorios-pdf" element={<RelatoriosPdf />} />
          <Route path="/relatorios-pdf/:id" element={<RelatorioDetalhe />} />
          <Route path="/fila-processamento" element={<FilaProcessamento />} />
          <Route path="/leituras" element={<Leituras />} />
          <Route path="/equipamentos" element={<Equipamentos />} />
          <Route path="/modelos" element={<Modelos />} />
          <Route path="/secretarias" element={<Secretarias />} />
          <Route path="/setores" element={<Setores />} />
          <Route path="/contratos" element={<Contratos />} />
          <Route path="/saldos" element={<Saldos />} />
          <Route path="/papel-a4" element={<PapelA4 />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
