import { useState } from 'react';
import { Building2, Search, Plus, User } from 'lucide-react';

interface Secretariat {
  id: string;
  name: string;
  code: string;
  quota: number; // pages/month
  usedPages: number; // current month
  activePrinters: number;
  departmentsCount: number;
  contactName: string;
}

const mockSecretariats: Secretariat[] = [
  { id: '1', name: 'Secretaria Municipal de Educação', code: 'SEMEC', quota: 90000, usedPages: 82000, activePrinters: 18, departmentsCount: 12, contactName: 'Mariana Costa' },
  { id: '2', name: 'Secretaria Municipal de Saúde', code: 'SEMSA', quota: 50000, usedPages: 48500, activePrinters: 14, departmentsCount: 8, contactName: 'Ricardo Oliveira' },
  { id: '3', name: 'Secretaria Municipal de Administração', code: 'SEMAD', quota: 40000, usedPages: 25000, activePrinters: 6, departmentsCount: 4, contactName: 'Luciana Pinheiro' },
  { id: '4', name: 'Secretaria Municipal da Fazenda', code: 'SEMEF', quota: 20000, usedPages: 19200, activePrinters: 4, departmentsCount: 3, contactName: 'Fernanda Lima' },
  { id: '5', name: 'Secretaria Municipal de Obras e Urbanismo', code: 'SEMOB', quota: 15000, usedPages: 10300, activePrinters: 3, departmentsCount: 2, contactName: 'Julio Cesar' },
];

export default function Secretarias() {
  const [secretariats, setSecretariats] = useState<Secretariat[]>(mockSecretariats);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [quota, setQuota] = useState('');
  const [contactName, setContactName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !quota || !contactName) return;

    const newSec: Secretariat = {
      id: String(secretariats.length + 1),
      name,
      code: code.toUpperCase(),
      quota: parseInt(quota),
      usedPages: 0,
      activePrinters: 0,
      departmentsCount: 0,
      contactName,
    };

    setSecretariats([...secretariats, newSec]);
    setName('');
    setCode('');
    setQuota('');
    setContactName('');
    setShowAddForm(false);
  };

  const filtered = secretariats.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.contactName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Secretarias Municipais</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie a estrutura organizacional da prefeitura, controlando as cotas globais de impressão por secretaria.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          {showAddForm ? 'Fechar Form' : 'Nova Secretaria'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-top duration-300">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-indigo-600 dark:text-indigo-400" />
            Cadastrar Nova Secretaria
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Nome da Secretaria</label>
                <input
                  type="text"
                  placeholder="Ex: Secretaria de Educação"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Sigla / Código</label>
                <input
                  type="text"
                  placeholder="Ex: SEMEC"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Cota Mensal (Páginas)</label>
                <input
                  type="number"
                  placeholder="Ex: 50000"
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Responsável / Contato</label>
                <input
                  type="text"
                  placeholder="Ex: Mariana Costa"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-5 h-10 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
              >
                Cadastrar Secretaria
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Secretariats Registry */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Table Header Filter */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Lista de Secretarias</h3>
            <p className="text-xs text-slate-400">Total de páginas permitidas versus páginas consumidas no mês corrente.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute top-2.5 left-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:bg-slate-950 transition-all"
            />
          </div>
        </div>

        {/* List of cards for Secretariats (gives more premium details) */}
        <div className="p-4 sm:p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((s) => {
            const usagePercent = Math.min(Math.round((s.usedPages / s.quota) * 100), 100);
            return (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {s.code}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1.5 line-clamp-1" title={s.name}>
                      {s.name}
                    </h4>
                  </div>
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Building2 size={18} />
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>Cota Consumida</span>
                    <span className={`font-bold ${usagePercent >= 90 ? 'text-rose-500 animate-pulse' : 'text-slate-700 dark:text-slate-300'}`}>
                      {usagePercent}% ({s.usedPages.toLocaleString()} / {s.quota.toLocaleString()})
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        usagePercent >= 90 ? 'bg-rose-500' : usagePercent >= 75 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                {/* Footer specs */}
                <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.activePrinters}</span> Impressoras
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.departmentsCount}</span> Setores
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 truncate max-w-28" title={s.contactName}>
                    <User size={12} />
                    <span className="truncate">{s.contactName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
