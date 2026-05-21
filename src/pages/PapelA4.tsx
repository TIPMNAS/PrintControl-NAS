import { useState } from 'react';
import { Scroll, Search, Plus, Calendar, User, ArrowDownCircle, Check, Info } from 'lucide-react';

interface PaperDistribution {
  id: string;
  secretariatName: string;
  reamsDistributed: number;
  deliveryDate: string;
  receivedBy: string;
  notes: string;
}

const mockLogs: PaperDistribution[] = [
  { id: '1', secretariatName: 'Secretaria de Educação', reamsDistributed: 30, deliveryDate: '2026-05-18', receivedBy: 'Carlos Alberto', notes: 'Distribuição mensal regular para o setor pedagógico.' },
  { id: '2', secretariatName: 'Secretaria de Saúde', reamsDistributed: 20, deliveryDate: '2026-05-15', receivedBy: 'Dra. Sandra Lúcia', notes: 'Abastecimento extraordinário para Posto de Saúde Central.' },
  { id: '3', secretariatName: 'Secretaria de Administração', reamsDistributed: 15, deliveryDate: '2026-05-10', receivedBy: 'Marcos Dias', notes: 'Para uso no setor de Protocolo Geral.' },
  { id: '4', secretariatName: 'Secretaria da Fazenda', reamsDistributed: 10, deliveryDate: '2026-05-05', receivedBy: 'Fernanda Lima', notes: 'Consumo regular de resmas do mês.' },
];

export default function PapelA4() {
  const [logs, setLogs] = useState<PaperDistribution[]>(mockLogs);
  const [totalStock, setTotalStock] = useState(142); // Reams in Central Warehouse
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form States
  const [secName, setSecName] = useState('Secretaria de Educação');
  const [reams, setReams] = useState('');
  const [receiver, setReceiver] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [success, setSuccess] = useState(false);

  const handleDistribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reams || !receiver) return;

    const count = parseInt(reams);
    if (count > totalStock) {
      alert('Quantidade de resmas solicitadas excede o estoque disponível!');
      return;
    }

    const newLog: PaperDistribution = {
      id: String(logs.length + 1),
      secretariatName: secName,
      reamsDistributed: count,
      deliveryDate: date,
      receivedBy: receiver,
      notes: notes || 'Nenhuma observação',
    };

    setLogs([newLog, ...logs]);
    setTotalStock(totalStock - count);
    setReams('');
    setReceiver('');
    setNotes('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const filtered = logs.filter(l =>
    l.secretariatName.toLowerCase().includes(search.toLowerCase()) ||
    l.receivedBy.toLowerCase().includes(search.toLowerCase())
  );

  const totalDistributed = logs.reduce((acc, curr) => acc + curr.reamsDistributed, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Controle de Papel A4</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Controle o estoque de resmas de papel A4 no almoxarifado central e monitore as entregas realizadas.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          {showForm ? 'Fechar Cadastro' : 'Registrar Distribuição'}
        </button>
      </div>

      {/* Stock Widgets */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-sm font-semibold">Estoque Central Disponível</span>
            <Scroll size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalStock} Resmas</h3>
            <p className="mt-1 text-xs text-slate-400">Armazenamento no Almoxarifado Central.</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-sm font-semibold">Resmas Entregues (Acumulado)</span>
            <ArrowDownCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalDistributed} Resmas</h3>
            <p className="mt-1 text-xs text-slate-400">Total distribuído no período cadastrado.</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-sm font-semibold">Status de Abastecimento</span>
            <Info size={18} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Estoque Estável</h3>
            <p className="mt-1 text-xs text-amber-600 font-medium">Recomendado reabastecer ao atingir 50 resmas.</p>
          </div>
        </div>
      </div>

      {/* Distribution Form */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-top duration-300">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Scroll size={18} className="text-indigo-600 dark:text-indigo-400" />
            Registrar Saída de Papel A4
          </h3>
          <form onSubmit={handleDistribute} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Secretaria Destino</label>
                <select
                  value={secName}
                  onChange={(e) => setSecName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="Secretaria de Educação">Secretaria de Educação</option>
                  <option value="Secretaria de Saúde">Secretaria de Saúde</option>
                  <option value="Secretaria de Administração">Secretaria de Administração</option>
                  <option value="Secretaria da Fazenda">Secretaria da Fazenda</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Quantidade (Resmas)</label>
                <input
                  type="number"
                  placeholder="Ex: 10"
                  value={reams}
                  onChange={(e) => setReams(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Quem Recebeu (Nome completo)</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Data da Entrega</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Observações / Finalidade</label>
              <textarea
                placeholder="Ex: Impressão de provas bimestrais..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-5 h-10 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
              >
                Registrar Entrega
              </button>
            </div>

            {success && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-500/5 dark:border-emerald-500/10 dark:text-emerald-300">
                <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Distribuição efetuada! Estoque central subtraído.</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Distribution Log */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Table Header Filter */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Histórico de Saídas</h3>
            <p className="text-xs text-slate-400">Log de movimentações e distribuições de resmas de papel para secretarias.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute top-2.5 left-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar por secretaria ou recebedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:bg-slate-950 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase dark:bg-slate-900 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Secretaria Destino</th>
                <th scope="col" className="px-6 py-4 text-center">Resmas Entregues</th>
                <th scope="col" className="px-6 py-4">Data Distribuição</th>
                <th scope="col" className="px-6 py-4">Recebido por</th>
                <th scope="col" className="px-6 py-4">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length > 0 ? (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{log.secretariatName}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-900 dark:text-slate-100">{log.reamsDistributed} resmas</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(log.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        <span>{log.receivedBy}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-500 max-w-xs truncate" title={log.notes}>
                      {log.notes}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                    Nenhum registro de distribuição de papel localizado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
