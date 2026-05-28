import { useRef, useState, type ReactNode, type UIEvent } from 'react';
import { Network, Search, Plus, Building2, User, Mail, ShieldAlert } from 'lucide-react';

interface Sector {
  id: string;
  name: string;
  secretariatName: string;
  printerSerial: string;
  supervisor: string;
  email: string;
  status: 'active' | 'inactive';
}


function SyncedTableScroll({
    children,
    minWidth = 1200,
}: {
    children: ReactNode
    minWidth?: number
}) {
    const topScrollRef = useRef<HTMLDivElement | null>(null)
    const bottomScrollRef = useRef<HTMLDivElement | null>(null)
    const syncingRef = useRef(false)

    const syncScroll = (source: 'top' | 'bottom') => (event: UIEvent<HTMLDivElement>) => {
        if (syncingRef.current) return

        syncingRef.current = true

        const origem = event.currentTarget
        const destino = source === 'top' ? bottomScrollRef.current : topScrollRef.current

        if (destino) {
            destino.scrollLeft = origem.scrollLeft
        }

        requestAnimationFrame(() => {
            syncingRef.current = false
        })
    }

    return (
        <div className="space-y-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2">
                <div className="mb-1 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>Rolagem horizontal rápida</span>
                    <span>Arraste aqui para ver as colunas finais sem descer até o fim da tabela.</span>
                </div>

                <div
                    ref={topScrollRef}
                    onScroll={syncScroll('top')}
                    className="overflow-x-auto pb-1"
                >
                    <div style={{ width: minWidth, height: 1 }} />
                </div>
            </div>

            <div
                ref={bottomScrollRef}
                onScroll={syncScroll('bottom')}
                className="overflow-x-auto"
            >
                {children}
            </div>
        </div>
    )
}

const mockSectors: Sector[] = [
  { id: '1', name: 'Setor Pedagógico', secretariatName: 'Secretaria Municipal de Educação', printerSerial: 'HP-M404-001', supervisor: 'Carlos Alberto', email: 'pedagogico@educacao.local', status: 'active' },
  { id: '2', name: 'Recursos Humanos', secretariatName: 'Secretaria Municipal de Administração', printerSerial: 'HP-MFP479-001', supervisor: 'Renata Souza', email: 'rh@admin.local', status: 'active' },
  { id: '3', name: 'Protocolo Geral', secretariatName: 'Secretaria Municipal de Administração', printerSerial: 'KYO-3055-003', supervisor: 'Marcos Dias', email: 'protocolo@admin.local', status: 'active' },
  { id: '4', name: 'Posto de Saúde Central', secretariatName: 'Secretaria Municipal de Saúde', printerSerial: 'KYO-3055-002', supervisor: 'Dr. Lucas Nogueira', email: 'postocentral@saude.local', status: 'active' },
  { id: '5', name: 'Vigilância Sanitária', secretariatName: 'Secretaria Municipal de Saúde', printerSerial: 'Nenhum', supervisor: 'Sandra Lúcia', email: 'vigilancia@saude.local', status: 'active' },
];

export default function Setores() {
  const [sectors, setSectors] = useState<Sector[]>(mockSectors);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [secName, setSecName] = useState('Secretaria Municipal de Educação');
  const [printer, setPrinter] = useState('Nenhum');
  const [supervisor, setSupervisor] = useState('');
  const [email, setEmail] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !supervisor || !email) return;

    const newSec: Sector = {
      id: String(sectors.length + 1),
      name,
      secretariatName: secName,
      printerSerial: printer,
      supervisor,
      email,
      status: 'active',
    };

    setSectors([...sectors, newSec]);
    setName('');
    setSupervisor('');
    setEmail('');
    setShowForm(false);
  };

  const filtered = sectors.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.secretariatName.toLowerCase().includes(search.toLowerCase()) ||
    s.supervisor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Setores Internos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie os setores de alocação física de cada secretaria municipal e seus responsáveis directos.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          {showForm ? 'Fechar Form' : 'Novo Setor'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-top duration-300">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Network size={18} className="text-indigo-600 dark:text-indigo-400" />
            Cadastrar Novo Setor
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Nome do Setor</label>
                <input
                  type="text"
                  placeholder="Ex: Almoxarifado Central"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Secretaria Vinculada</label>
                <select
                  value={secName}
                  onChange={(e) => setSecName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="Secretaria Municipal de Educação">Secretaria Municipal de Educação</option>
                  <option value="Secretaria Municipal de Saúde">Secretaria Municipal de Saúde</option>
                  <option value="Secretaria Municipal de Administração">Secretaria Municipal de Administração</option>
                  <option value="Secretaria Municipal da Fazenda">Secretaria Municipal da Fazenda</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Impressora Alocada (Opcional)</label>
                <select
                  value={printer}
                  onChange={(e) => setPrinter(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="Nenhum">Nenhum equipamento alocado</option>
                  <option value="HP-M404-001">HP-M404-001</option>
                  <option value="KYO-3055-002">KYO-3055-002</option>
                  <option value="HP-MFP479-001">HP-MFP479-001</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Supervisor do Setor</label>
                <input
                  type="text"
                  placeholder="Ex: Renata Souza"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">E-mail de Contato</label>
                <input
                  type="email"
                  placeholder="Ex: rh@admin.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                Cadastrar Setor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sectors Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Table Header Filter */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Setores Mapeados</h3>
            <p className="text-xs text-slate-400">Listagem de todos os departamentos internos vinculados.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute top-2.5 left-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar por setor, secretaria, supervisor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:bg-slate-950 transition-all"
            />
          </div>
        </div>

        {/* Sectors Table */}
        <SyncedTableScroll minWidth={1080}>
          <table className="min-w-[1080px] w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase dark:bg-slate-900 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Setor</th>
                <th scope="col" className="px-6 py-4">Secretaria Vinculada</th>
                <th scope="col" className="px-6 py-4">Equipamento Vinculado</th>
                <th scope="col" className="px-6 py-4">Supervisor / Responsável</th>
                <th scope="col" className="px-6 py-4">E-mail</th>
                <th scope="col" className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length > 0 ? (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">{s.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={14} className="text-slate-450 shrink-0" />
                        <span>{s.secretariatName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {s.printerSerial !== 'Nenhum' ? (
                        <span className="font-mono text-xs font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 px-2.5 py-1 rounded-md">
                          {s.printerSerial}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Nenhum</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-slate-400 shrink-0" />
                        <span>{s.supervisor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span>{s.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert size={24} className="text-slate-300 dark:text-slate-700" />
                      <span>Nenhum setor encontrado para os critérios informados.</span>
                    </div>
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
