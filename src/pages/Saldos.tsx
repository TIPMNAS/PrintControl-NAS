import { useState } from 'react';
import { Scale, Search, ShieldAlert, Plus, ArrowUpRight } from 'lucide-react';

interface QuotaBalance {
  id: string;
  secretariatCode: string;
  secretariatName: string;
  allocatedQuota: number;
  consumedQuota: number;
  remainingQuota: number;
  status: 'normal' | 'warning' | 'critical';
}

const mockBalances: QuotaBalance[] = [
  { id: '1', secretariatCode: 'SEMEC', secretariatName: 'Secretaria Municipal de Educação', allocatedQuota: 90000, consumedQuota: 82000, remainingQuota: 800, status: 'critical' }, // wait, 82k/90k is 91%
  { id: '2', secretariatCode: 'SEMSA', secretariatName: 'Secretaria Municipal de Saúde', allocatedQuota: 50000, consumedQuota: 48500, remainingQuota: 1500, status: 'critical' }, // 97%
  { id: '3', secretariatCode: 'SEMAD', secretariatName: 'Secretaria Municipal de Administração', allocatedQuota: 40000, consumedQuota: 25000, remainingQuota: 15000, status: 'normal' },
  { id: '4', secretariatCode: 'SEMEF', secretariatName: 'Secretaria Municipal da Fazenda', allocatedQuota: 20000, consumedQuota: 19200, remainingQuota: 800, status: 'critical' }, // 96%
  { id: '5', secretariatCode: 'SEMOB', secretariatName: 'Secretaria Municipal de Obras', allocatedQuota: 15000, consumedQuota: 10300, remainingQuota: 4700, status: 'warning' }, // 68%
];

export default function Saldos() {
  const [balances, setBalances] = useState<QuotaBalance[]>(mockBalances);
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');
  const [search, setSearch] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Adjust Form States
  const [secCode, setSecCode] = useState('SEMEC');
  const [addedQuota, setAddedQuota] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAdjustQuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addedQuota) return;

    const val = parseInt(addedQuota);
    setBalances(balances.map(b => {
      if (b.secretariatCode === secCode) {
        const newAllocated = b.allocatedQuota + val;
        const newRemaining = newAllocated - b.consumedQuota;
        const usageRatio = b.consumedQuota / newAllocated;
        const newStatus = usageRatio >= 0.9 ? 'critical' : usageRatio >= 0.7 ? 'warning' : 'normal';

        return {
          ...b,
          allocatedQuota: newAllocated,
          remainingQuota: newRemaining,
          status: newStatus
        };
      }
      return b;
    }));

    setAddedQuota('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const filtered = balances.filter(b => {
    // Search
    const matchesSearch = b.secretariatName.toLowerCase().includes(search.toLowerCase()) ||
                          b.secretariatCode.toLowerCase().includes(search.toLowerCase());

    // Status Filter
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && b.status === filterType;
  });

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Saldos & Alertas Contratuais</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitore as cotas contratadas de impressão por órgão público e receba avisos preventivos de excedente.</p>
        </div>
        <button
          onClick={() => setShowAdjustModal(!showAdjustModal)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition-all hover:bg-indigo-700 sm:w-auto xl:self-start"
        >
          <Plus size={16} />
          {showAdjustModal ? 'Fechar Ajuste' : 'Ajustar Cota Temporária'}
        </button>
      </div>

      {/* Adjust Quota form */}
      {showAdjustModal && (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in slide-in-from-top duration-300 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Scale size={18} className="text-indigo-600 dark:text-indigo-400" />
            Adicionar Aditivo de Impressões (Cota Extra)
          </h3>
          <form onSubmit={handleAdjustQuota} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_minmax(220px,0.8fr)_220px]">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Secretaria</label>
                <select
                  value={secCode}
                  onChange={(e) => setSecCode(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="SEMEC">SEMEC (Educação)</option>
                  <option value="SEMSA">SEMSA (Saúde)</option>
                  <option value="SEMAD">SEMAD (Administração)</option>
                  <option value="SEMEF">SEMEF (Fazenda)</option>
                  <option value="SEMOB">SEMOB (Obras)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Páginas Extras a Inserir</label>
                <input
                  type="number"
                  placeholder="Ex: 5000"
                  value={addedQuota}
                  onChange={(e) => setAddedQuota(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
                >
                  <ArrowUpRight size={16} />
                  Aplicar Aditivo
                </button>
              </div>
            </div>

            {success && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-500/5 dark:border-emerald-500/10 dark:text-emerald-300">
                <span>Aditivo contratual adicionado com sucesso! Cota expandida para a secretaria.</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Filter and balance view */}
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {/* Table Header Filter */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between sm:p-5">
          <div className="flex flex-wrap gap-2 lg:flex-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors
                ${filterType === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-50 hover:bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}
              `}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('critical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors
                ${filterType === 'critical' ? 'bg-rose-500 text-white' : 'bg-rose-50/50 hover:bg-rose-100/50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20'}
              `}
            >
              Crítico (&gt;90%)
            </button>
            <button
              onClick={() => setFilterType('warning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors
                ${filterType === 'warning' ? 'bg-amber-500 text-white' : 'bg-amber-50/50 hover:bg-amber-100/50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20'}
              `}
            >
              Alerta (70%-90%)
            </button>
            <button
              onClick={() => setFilterType('normal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors
                ${filterType === 'normal' ? 'bg-emerald-500 text-white' : 'bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'}
              `}
            >
              Sob Controle (&lt;70%)
            </button>
          </div>

          <div className="relative w-full lg:max-w-md xl:max-w-xl">
            <Search className="absolute top-2.5 left-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:bg-slate-950 transition-all"
            />
          </div>
        </div>

        {/* Balance progress bars list */}
        <div className="space-y-4 p-4 sm:p-6">
          {filtered.length > 0 ? (
            filtered.map((b) => {
              const ratio = Math.round((b.consumedQuota / b.allocatedQuota) * 100);
              return (
                <div key={b.id} className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-800/80 dark:bg-slate-900/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-550 px-2 py-0.5 rounded">
                        {b.secretariatCode}
                      </span>
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {b.secretariatName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {b.status === 'critical' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                          Excedendo / Crítico
                        </span>
                      ) : b.status === 'warning' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                          Atenção
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Regular
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {ratio}% Utilizado
                      </span>
                    </div>
                  </div>

                  {/* Quota bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        b.status === 'critical' ? 'bg-rose-500' : b.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>

                  {/* Quota details */}
                  <div className="grid gap-2 pt-1 text-xs text-slate-450 dark:text-slate-500 sm:grid-cols-3">
                    <span>Impresso: <strong>{b.consumedQuota.toLocaleString()} pág.</strong></span>
                    <span>Cota Contratual: <strong>{b.allocatedQuota.toLocaleString()} pág.</strong></span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Saldo Restante: {b.remainingQuota > 0 ? `${b.remainingQuota.toLocaleString()} pág.` : 'Cota esgotada!'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
              <ShieldAlert size={24} className="text-slate-350 dark:text-slate-750" />
              <span>Nenhum saldo encontrado correspondente à pesquisa e aos filtros.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
