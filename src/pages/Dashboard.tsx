import { SupabaseConnectionStatus } from '../components/debug/SupabaseConnectionStatus';
import { useDashboardInicial } from '../hooks/useDashboardInicial';
import { formatNumber, formatCurrency, formatDecimal } from '../utils/formatters';
import type { DashboardAlerta } from '../types/dashboard';

import {
  TrendingUp,
  Printer,
  FileCheck2,
  Scroll,
  AlertTriangle,
  ArrowRight,
  Plus,
  Loader2,
  XCircle,
  FileText,
  DollarSign,
  Layers,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

// Static trend mock kept — série histórica real será ligada em etapa futura
const monthlyPrintTrend = [
  { month: 'Jan', paginas: 120000, custo: 18000 },
  { month: 'Fev', paginas: 145000, custo: 21750 },
  { month: 'Mar', paginas: 130000, custo: 19500 },
  { month: 'Abr', paginas: 165000, custo: 24750 },
  { month: 'Mai', paginas: 185000, custo: 27750 },
];

// Helpers: map DashboardAlerta.nivel → CSS classes
function alertStyles(nivel: DashboardAlerta['nivel']) {
  switch (nivel) {
    case 'vermelho':
      return {
        wrapper:
          'bg-rose-50/50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/10 text-rose-800 dark:text-rose-300',
        icon: 'text-rose-600 dark:text-rose-400',
      };
    case 'laranja':
    case 'amarelo':
      return {
        wrapper:
          'bg-amber-50/50 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/10 text-amber-800 dark:text-amber-300',
        icon: 'text-amber-600 dark:text-amber-400',
      };
    default:
      return {
        wrapper:
          'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/10 text-indigo-800 dark:text-indigo-300',
        icon: 'text-indigo-600 dark:text-indigo-400',
      };
  }
}

// ─── Skeleton card for loading state ────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="mt-4">
        <div className="h-7 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-3 w-40 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError, error } = useDashboardInicial();

  const resumo = data?.resumo;
  const alertas = data?.alertas ?? [];
  const secretarias = data?.secretarias ?? [];

  // Build bar chart data from real secretarias (fallback: empty)
  const secretariasChartData = secretarias.map((s) => ({
    name: s.secretaria.length > 14 ? s.secretaria.substring(0, 13) + '…' : s.secretaria,
    impresso: s.totalPaginas,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {resumo ? (
              <>
                {resumo.fornecedor}
                <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">
                  Contrato {resumo.contratoNumero} · {resumo.mesReferencia}
                </span>
              </>
            ) : (
              'Bem-vindo, Administrador'
            )}
          </h2>
          <SupabaseConnectionStatus />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Consolidado mensal das cotas, custos e monitoramento de impressões.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/leituras"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-600/10 hover:shadow-lg transition-all"
          >
            <Plus size={16} />
            Lançar Leitura
          </Link>
          <Link
            to="/relatorios-pdf"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
          >
            Relatórios
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Global error banner */}
      {isError && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-300">
          <XCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold">Não foi possível carregar os dados do Supabase.</p>
            <p className="mt-0.5 text-xs opacity-80">
              {error instanceof Error ? error.message : 'Erro desconhecido.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Row 1: Cards P/B e Coloridas ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Impresso */}
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Total Impresso (Mês)
              </span>
              <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-500/10">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(resumo?.totalPaginas)}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>
                  P/B: {formatNumber(resumo?.paginasPb)} · Cor: {formatNumber(resumo?.paginasColoridas)}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Card 2: Equipamentos com leitura */}
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Equipamentos c/ Leitura
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-500/10">
                <Printer className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(resumo?.totalEquipamentos)}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <FileText size={12} />
                <span>{formatNumber(resumo?.totalRelatoriosAprovados)} relatório(s) aprovado(s)</span>
              </p>
            </div>
          </div>
        )}

        {/* Card 3: Valor Líquido (NF) */}
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Valor Líquido / NF
              </span>
              <div className="rounded-lg bg-sky-50 p-2 dark:bg-sky-500/10">
                <FileCheck2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(resumo?.valorLiquido)}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <DollarSign size={12} />
                <span>
                  Bruto: {formatCurrency(resumo?.valorBruto)} · Retenção:{' '}
                  {formatCurrency(resumo?.valorRetencao)}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Card 4: Papel A4 estimado */}
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Papel A4 Estimado
              </span>
              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-500/10">
                <Scroll className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatDecimal(resumo?.resmasEstimadas, 0)} Resmas
              </h3>
              <p className="mt-1 text-xs text-amber-600 flex items-center gap-1 font-medium">
                <Layers size={12} />
                <span>≈ {formatDecimal(resumo?.caixasEstimadas, 1)} caixas estimadas</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Graphics Section ────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left/Middle Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart 1: Print Volume Trend (série histórica — mock estático) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Tendência de Impressão e Custos
              </h4>
              <p className="text-xs text-slate-400">
                Evolução do volume total de páginas e custos associados nos últimos 5 meses.
              </p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyPrintTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-slate-200 dark:stroke-slate-800"
                  />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="paginas"
                    name="Páginas Impressas"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPages)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Volume por Secretaria — dados reais se disponíveis */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Páginas por Secretaria (Mês Atual)
              </h4>
              <p className="text-xs text-slate-400">
                Volume real de páginas impressas por secretaria no período de referência.
              </p>
            </div>

            {isLoading ? (
              <div className="flex h-72 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : secretariasChartData.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                <BarChart2 size={28} />
                <span className="text-sm">Sem dados de secretarias para o período.</span>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={secretariasChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-slate-200 dark:stroke-slate-800"
                    />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderColor: '#1e293b',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="impresso"
                      name="Páginas Impressas"
                      fill="#4f46e5"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Alerts & Quick Stats */}
        <div className="space-y-6">
          {/* Alerts Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800 mb-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Alertas Recentes
              </h4>
              {alertas.length > 0 && (
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                  {alertas.length} Notificações
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : alertas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-400 dark:text-slate-500">
                <AlertTriangle size={22} />
                <span className="text-sm text-center">
                  Nenhum alerta crítico encontrado para o período.
                </span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {alertas.map((alerta, idx) => {
                  const styles = alertStyles(alerta.nivel);
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 p-3 rounded-lg border text-sm ${styles.wrapper}`}
                    >
                      <AlertTriangle
                        size={18}
                        className={`shrink-0 mt-0.5 ${styles.icon}`}
                      />
                      <div className="space-y-1">
                        <p className="font-semibold leading-tight">{alerta.titulo}</p>
                        <p className="leading-relaxed opacity-90">{alerta.descricao}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Info Registry Card */}
          <div className="rounded-xl border border-slate-200 bg-indigo-900 p-6 text-white shadow-lg shadow-indigo-900/20">
            <h4 className="text-lg font-bold">PrintControl NAS</h4>
            <p className="mt-2 text-xs text-indigo-200 leading-relaxed">
              Sistema integrado para controle completo do parque de impressões municipais, gerenciando
              contratos de locação, consumos setoriais e controle de papel A4.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {resumo && (
                <div className="flex justify-between text-xs border-b border-indigo-800 pb-2">
                  <span className="text-indigo-200">Contrato ativo:</span>
                  <span className="font-semibold">{resumo.contratoNumero}</span>
                </div>
              )}
              <div className="flex justify-between text-xs border-b border-indigo-800 pb-2">
                <span className="text-indigo-200">Suporte técnico:</span>
                <span className="font-semibold">suporte@nas.gov.br</span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-indigo-200">Versão da Plataforma:</span>
                <span className="font-semibold">v1.1.0 (Etapa 63)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
