import { useState } from 'react';
import { Search, Plus, FileSignature } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

interface LeaseContract {
  id: string;
  contractNumber: string;
  providerName: string;
  monthlyBaseValue: number;
  startDate: string;
  endDate: string;
  slaHours: number;
  totalPrintersLeased: number;
  status: 'active' | 'warning' | 'expired';
}

const mockContracts: LeaseContract[] = [
  { id: '1', contractNumber: 'CT-2024-001', providerName: 'CopyCorp Soluções em Impressão Ltda', monthlyBaseValue: 18500, startDate: '2024-01-10', endDate: '2027-01-10', slaHours: 24, totalPrintersLeased: 25, status: 'active' },
  { id: '2', contractNumber: 'CT-2025-003', providerName: 'PrimePrint Outsourcing S/A', monthlyBaseValue: 9250, startDate: '2025-03-01', endDate: '2026-06-01', slaHours: 12, totalPrintersLeased: 20, status: 'active' },
  { id: '3', contractNumber: 'CT-2021-008', providerName: 'TecnoDoc Sistemas de Imagem', monthlyBaseValue: 4800, startDate: '2021-05-20', endDate: '2026-05-20', slaHours: 48, totalPrintersLeased: 3, status: 'expired' },
];

export default function Contratos() {
  const [contracts, setContracts] = useState<LeaseContract[]>(mockContracts);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form States
  const [number, setNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [value, setValue] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [sla, setSla] = useState('24');
  const [printersCount, setPrintersCount] = useState('0');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number || !provider || !value || !start || !end) return;

    const newContract: LeaseContract = {
      id: String(contracts.length + 1),
      contractNumber: number.toUpperCase(),
      providerName: provider,
      monthlyBaseValue: parseFloat(value),
      startDate: start,
      endDate: end,
      slaHours: parseInt(sla),
      totalPrintersLeased: parseInt(printersCount) || 0,
      status: 'active',
    };

    setContracts([...contracts, newContract]);
    setNumber('');
    setProvider('');
    setValue('');
    setStart('');
    setEnd('');
    setShowForm(false);
  };

  const filtered = contracts.filter(c =>
    c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.providerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Contratos de Locação</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie e monitore a vigência, SLAs e custos fixos dos contratos de outsourcing de impressão.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          {showForm ? 'Fechar Form' : 'Adicionar Contrato'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-top duration-300">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <FileSignature size={18} className="text-indigo-600 dark:text-indigo-400" />
            Adicionar Novo Contrato de Outsourcing
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Número do Contrato</label>
                <input
                  type="text"
                  placeholder="Ex: CT-2026-004"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Fornecedor / Razão Social</label>
                <input
                  type="text"
                  placeholder="Ex: CopyCorp Outsourcing"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Valor Base Mensal (R$)</label>
                <input
                  type="number"
                  placeholder="Ex: 15400"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Data de Início</label>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Data Fim (Vencimento)</label>
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">SLA de Reparo (Horas)</label>
                <select
                  value={sla}
                  onChange={(e) => setSla(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="12">12 horas</option>
                  <option value="24">24 horas</option>
                  <option value="48">48 horas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Impressoras Contratadas</label>
                <input
                  type="number"
                  placeholder="Ex: 10"
                  value={printersCount}
                  onChange={(e) => setPrintersCount(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-5 h-10 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
              >
                Salvar Contrato
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contracts List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Table Header Filter */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Contratos Ativos</h3>
            <p className="text-xs text-slate-400">Listagem de termos jurídicos de outsourcing de impressão de equipamentos.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute top-2.5 left-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar por contrato ou fornecedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:bg-slate-950 transition-all"
            />
          </div>
        </div>

        {/* List mapping */}
        <div className="p-6 grid gap-6 lg:grid-cols-2">
          {filtered.map((c) => {
            const today = new Date();
            const endD = new Date(c.endDate + 'T00:00:00');
            const totalDaysLeft = differenceInDays(endD, today);
            const formattedStart = format(new Date(c.startDate + 'T00:00:00'), 'dd/MM/yyyy');
            const formattedEnd = format(endD, 'dd/MM/yyyy');

            return (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {c.contractNumber}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1.5">{c.providerName}</h4>
                  </div>

                  {c.status === 'active' && totalDaysLeft > 90 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      Vigente
                    </span>
                  ) : c.status === 'expired' || totalDaysLeft <= 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                      Expirado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                      Vencendo Logo
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 dark:bg-slate-950/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Período de Vigência</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formattedStart} a {formattedEnd}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Tempo para Vencimento</span>
                    <span className={`font-semibold ${totalDaysLeft <= 90 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      {totalDaysLeft > 0 ? `${totalDaysLeft} dias restantes` : 'Expirado'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <span className="text-slate-400">SLA:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{c.slaHours}h</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <span className="text-slate-400">Equipamentos:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{c.totalPrintersLeased}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold text-indigo-650 dark:text-indigo-400 text-sm">
                    R$ {c.monthlyBaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
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
