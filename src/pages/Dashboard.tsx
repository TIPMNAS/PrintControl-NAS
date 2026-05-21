import {
  TrendingUp,
  Printer,
  FileCheck2,
  Scroll,
  AlertTriangle,
  ArrowRight,
  Plus
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
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';

// Mock Data
const monthlyPrintTrend = [
  { month: 'Jan', paginas: 120000, custo: 18000 },
  { month: 'Fev', paginas: 145000, custo: 21750 },
  { month: 'Mar', paginas: 130000, custo: 19500 },
  { month: 'Abr', paginas: 165000, custo: 24750 },
  { month: 'Mai', paginas: 185000, custo: 27750 },
];

const printVolumeBySecretariat = [
  { name: 'Educação', limite: 90000, impresso: 82000 },
  { name: 'Saúde', limite: 50000, impresso: 48500 },
  { name: 'Administração', limite: 40000, impresso: 25000 },
  { name: 'Fazenda', limite: 20000, impresso: 19200 },
  { name: 'Assistência Social', limite: 25000, impresso: 12000 },
];

const alerts = [
  { id: 1, type: 'danger', message: 'Toner da impressora HP M404 (Setor Pedagógico) está com 3% de capacidade.', date: 'Há 10 minutos' },
  { id: 2, type: 'warning', message: 'Secretaria de Saúde atingiu 97% da cota mensal de impressão.', date: 'Há 1 hora' },
  { id: 3, type: 'info', message: 'Leitura mensal pendente para 3 impressoras na Secretaria de Obras.', date: 'Há 3 horas' },
  { id: 4, type: 'danger', message: 'Equipamento Kyocera P3055 (Protocolo Geral) está offline há mais de 24 horas.', date: 'Ontem' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Bem-vindo, Administrador</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Consolidado mensal das cotas, custos e monitoramento de impressões.</p>
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

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Impresso */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Impresso (Mês)</span>
            <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-500/10">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">185.000</h3>
            <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <TrendingUp size={12} />
              <span>+12.1% em relação ao mês anterior</span>
            </p>
          </div>
        </div>

        {/* Card 2: Equipamentos Ativos */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Equipamentos Ativos</span>
            <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-500/10">
              <Printer className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">42 / 45</h3>
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
              <AlertTriangle size={12} />
              <span>3 impressoras offline ou com erro</span>
            </p>
          </div>
        </div>

        {/* Card 3: Custos Contratuais */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Custo Estimado (Mês)</span>
            <div className="rounded-lg bg-sky-50 p-2 dark:bg-sky-500/10">
              <FileCheck2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">R$ 27.750,00</h3>
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
              <TrendingUp size={12} />
              <span>Custo excedente: R$ 3.420,00</span>
            </p>
          </div>
        </div>

        {/* Card 4: Papel A4 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Estoque Papel A4</span>
            <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-500/10">
              <Scroll className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">142 Resmas</h3>
            <p className="mt-1 text-xs text-amber-600 flex items-center gap-1 font-medium">
              <AlertTriangle size={12} />
              <span>Necessário reabastecer em 12 dias</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Graphics Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left/Middle Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart 1: Print Volume Trend */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Tendência de Impressão e Custos</h4>
              <p className="text-xs text-slate-400">Evolução do volume total de páginas e custos associados nos últimos 5 meses.</p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyPrintTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
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

          {/* Chart 2: Volume by Secretariat */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Consumo vs Limite por Secretaria</h4>
              <p className="text-xs text-slate-400">Comparativo das páginas impressas no mês atual contra a cota contratada.</p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={printVolumeBySecretariat} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
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
                  <Bar dataKey="limite" name="Cota Limite" fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={0.3} />
                  <Bar dataKey="impresso" name="Páginas Impressas" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Quick Stats */}
        <div className="space-y-6">
          {/* Alerts Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800 mb-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Alertas Recentes</h4>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                {alerts.length} Notificações
              </span>
            </div>
            <div className="space-y-3.5">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex gap-3 p-3 rounded-lg border text-sm
                    ${alert.type === 'danger'
                      ? 'bg-rose-50/50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/10 text-rose-800 dark:text-rose-300'
                      : alert.type === 'warning'
                      ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/10 text-amber-800 dark:text-amber-300'
                      : 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/10 text-indigo-800 dark:text-indigo-300'
                    }
                  `}
                >
                  <AlertTriangle
                    size={18}
                    className={`shrink-0 mt-0.5
                      ${alert.type === 'danger'
                        ? 'text-rose-600 dark:text-rose-400'
                        : alert.type === 'warning'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-indigo-600 dark:text-indigo-400'
                      }
                    `}
                  />
                  <div className="space-y-1">
                    <p className="font-medium leading-relaxed">{alert.message}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{alert.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info Registry Card */}
          <div className="rounded-xl border border-slate-200 bg-indigo-900 p-6 text-white shadow-lg shadow-indigo-900/20">
            <h4 className="text-lg font-bold">PrintControl NAS</h4>
            <p className="mt-2 text-xs text-indigo-200 leading-relaxed">
              Sistema integrado para controle completo do parque de impressões municipais, gerenciando contratos de locação, consumos setoriais e controle de papel A4.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex justify-between text-xs border-b border-indigo-800 pb-2">
                <span className="text-indigo-200">Suporte técnico:</span>
                <span className="font-semibold">suporte@nas.gov.br</span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-indigo-200">Versão da Plataforma:</span>
                <span className="font-semibold">v1.0.0 (Skeleton Beta)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
