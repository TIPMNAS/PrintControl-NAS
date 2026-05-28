import { useRef, useState, type FormEvent, type ReactNode, type UIEvent } from 'react';
import { Scroll, Search, Plus, Calendar, User, ArrowDownCircle, Check, Info } from 'lucide-react';

interface PaperDistribution {
  id: string;
  secretariatName: string;
  reamsDistributed: number;
  deliveryDate: string;
  receivedBy: string;
  notes: string;
}

type SyncedTableScrollProps = {
  children: ReactNode;
  minWidth?: number;
};

function SyncedTableScroll({ children, minWidth = 980 }: SyncedTableScrollProps) {
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const isSyncingRef = useRef<'top' | 'table' | null>(null);

  const syncTopToTable = (event: UIEvent<HTMLDivElement>) => {
    if (isSyncingRef.current === 'table') return;

    isSyncingRef.current = 'top';

    if (tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }

    requestAnimationFrame(() => {
      isSyncingRef.current = null;
    });
  };

  const syncTableToTop = (event: UIEvent<HTMLDivElement>) => {
    if (isSyncingRef.current === 'top') return;

    isSyncingRef.current = 'table';

    if (topScrollRef.current) {
      topScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }

    requestAnimationFrame(() => {
      isSyncingRef.current = null;
    });
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/70">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Rolagem horizontal da tabela
        </p>
        <div
          ref={topScrollRef}
          onScroll={syncTopToTable}
          className="h-4 overflow-x-auto overflow-y-hidden rounded bg-white dark:bg-slate-900 custom-scrollbar"
          aria-label="Rolagem horizontal superior da tabela"
        >
          <div style={{ width: minWidth, height: 1 }} />
        </div>
      </div>

      <div
        ref={tableScrollRef}
        onScroll={syncTableToTop}
        className="overflow-x-auto custom-scrollbar"
      >
        <div style={{ minWidth }}>{children}</div>
      </div>
    </div>
  );
}

const mockLogs: PaperDistribution[] = [
  { id: '1', secretariatName: 'Secretaria de Educação', reamsDistributed: 30, deliveryDate: '2026-05-18', receivedBy: 'Carlos Alberto', notes: 'Distribuição mensal regular para o setor pedagógico.' },
  { id: '2', secretariatName: 'Secretaria de Saúde', reamsDistributed: 20, deliveryDate: '2026-05-15', receivedBy: 'Dra. Sandra Lúcia', notes: 'Abastecimento extraordinário para Posto de Saúde Central.' },
  { id: '3', secretariatName: 'Secretaria de Administração', reamsDistributed: 15, deliveryDate: '2026-05-10', receivedBy: 'Marcos Dias', notes: 'Para uso no setor de Protocolo Geral.' },
  { id: '4', secretariatName: 'Secretaria da Fazenda', reamsDistributed: 10, deliveryDate: '2026-05-05', receivedBy: 'Fernanda Lima', notes: 'Consumo regular de resmas do mês.' },
];

export default function PapelA4() {
  const [logs, setLogs] = useState<PaperDistribution[]>(mockLogs);
  const [totalStock, setTotalStock] = useState(142); // Resmas no Almoxarifado Central
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Estados do formulário
  const [secName, setSecName] = useState('Secretaria de Educação');
  const [reams, setReams] = useState('');
  const [receiver, setReceiver] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [success, setSuccess] = useState(false);

  const handleDistribute = (e: FormEvent) => {
    e.preventDefault();
    if (!reams || !receiver) return;

    const count = parseInt(reams, 10);
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

  const filtered = logs.filter((log) =>
    log.secretariatName.toLowerCase().includes(search.toLowerCase()) ||
    log.receivedBy.toLowerCase().includes(search.toLowerCase()) ||
    log.notes.toLowerCase().includes(search.toLowerCase())
  );

  const totalDistributed = logs.reduce((acc, curr) => acc + curr.reamsDistributed, 0);

  return (
    <div className="w-full max-w-none space-y-6 px-0 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-5xl">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-300">
            <Scroll size={15} />
            Etapa 84 — Controle de Papel A4
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Controle de Papel A4
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Controle o estoque de resmas de papel A4 no almoxarifado central, registre distribuições e acompanhe as entregas realizadas por secretaria.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto xl:justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition-all hover:bg-indigo-700"
          >
            <Plus size={16} />
            {showForm ? 'Fechar cadastro' : 'Registrar distribuição'}
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-[0.14em]">Estoque Central</span>
            <span className="rounded-xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-300">
              <Scroll size={19} />
            </span>
          </div>
          <div className="mt-5">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalStock}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Resmas disponíveis no Almoxarifado Central.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-[0.14em]">Resmas Entregues</span>
            <span className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-300">
              <ArrowDownCircle size={19} />
            </span>
          </div>
          <div className="mt-5">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalDistributed}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Total distribuído no período cadastrado.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-xs dark:border-amber-500/30 dark:bg-amber-500/10 sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
            <span className="text-xs font-bold uppercase tracking-[0.14em]">Status de Abastecimento</span>
            <span className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-300">
              <Info size={19} />
            </span>
          </div>
          <div className="mt-5">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalStock <= 50 ? 'Reabastecer' : 'Estoque Estável'}
            </h3>
            <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-300">
              Recomendado reabastecer ao atingir 50 resmas.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
            <Scroll size={18} className="text-indigo-600 dark:text-indigo-400" />
            Registrar Saída de Papel A4
          </h3>

          <form onSubmit={handleDistribute} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Secretaria Destino</label>
                <select
                  value={secName}
                  onChange={(e) => setSecName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="Secretaria de Educação">Secretaria de Educação</option>
                  <option value="Secretaria de Saúde">Secretaria de Saúde</option>
                  <option value="Secretaria de Administração">Secretaria de Administração</option>
                  <option value="Secretaria da Fazenda">Secretaria da Fazenda</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Quantidade (Resmas)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 10"
                  value={reams}
                  onChange={(e) => setReams(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Quem Recebeu</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Data da Entrega</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">Observações / Finalidade</label>
              <textarea
                placeholder="Ex: Impressão de provas bimestrais..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition-all hover:bg-indigo-700"
              >
                Registrar Entrega
              </button>
            </div>

            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/10 dark:bg-emerald-500/5 dark:text-emerald-300">
                <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Distribuição efetuada! Estoque central subtraído.</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Histórico */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Histórico de Saídas</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Log de movimentações e distribuições de resmas de papel para secretarias.</p>
          </div>

          <div className="relative w-full lg:max-w-lg xl:max-w-xl">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar por secretaria, recebedor ou observação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        <SyncedTableScroll minWidth={1060}>
          <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
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
                  <tr key={log.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{log.secretariatName}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-900 dark:text-slate-100">{log.reamsDistributed} resmas</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(log.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <User size={14} className="text-slate-400" />
                        <span>{log.receivedBy}</span>
                      </div>
                    </td>
                    <td className="max-w-md px-6 py-4 text-slate-500 dark:text-slate-400" title={log.notes}>
                      <span className="line-clamp-2">{log.notes}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">
                    Nenhum registro de distribuição de papel localizado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SyncedTableScroll>
      </div>
    </div>
  );
}
