import { useState } from 'react';
import { Printer, Search, Plus, Trash2, CheckCircle2, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';

interface Equipment {
  id: string;
  serial: string;
  modelName: string;
  ipAddress: string;
  secretariat: string;
  sector: string;
  tonerLevel: number; // percentage
  status: 'online' | 'warning' | 'offline';
  statusDetails: string;
}

const mockEquipment: Equipment[] = [
  { id: '1', serial: 'HP-M404-001', modelName: 'HP LaserJet M404dn', ipAddress: '192.168.10.150', secretariat: 'Secretaria de Educação', sector: 'Setor Pedagógico', tonerLevel: 8, status: 'warning', statusDetails: 'Toner Preto muito baixo (8%)' },
  { id: '2', serial: 'KYO-3055-002', modelName: 'Kyocera ECOSYS P3055dn', ipAddress: '192.168.12.80', secretariat: 'Secretaria de Saúde', sector: 'Posto Central', tonerLevel: 65, status: 'online', statusDetails: 'Operando normalmente' },
  { id: '3', serial: 'HP-MFP479-001', modelName: 'HP Color LaserJet MFP M479fdw', ipAddress: '192.168.10.32', secretariat: 'Secretaria de Administração', sector: 'Recursos Humanos', tonerLevel: 45, status: 'online', statusDetails: 'Operando normalmente' },
  { id: '4', serial: 'KYO-3055-003', modelName: 'Kyocera ECOSYS P3055dn', ipAddress: '192.168.15.200', secretariat: 'Secretaria de Obras', sector: 'Protocolo Geral', tonerLevel: 90, status: 'offline', statusDetails: 'Sem ping / Equipamento desligado' },
];

export default function Equipamentos() {
  const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [serial, setSerial] = useState('');
  const [modelName, setModelName] = useState('HP LaserJet M404dn');
  const [ip, setIp] = useState('');
  const [sec, setSec] = useState('Secretaria de Educação');
  const [sector, setSector] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial || !ip || !sector) return;

    const newEquip: Equipment = {
      id: String(equipment.length + 1),
      serial: serial.toUpperCase(),
      modelName,
      ipAddress: ip,
      secretariat: sec,
      sector,
      tonerLevel: 100,
      status: 'online',
      statusDetails: 'Equipamento instalado recentemente',
    };

    setEquipment([...equipment, newEquip]);
    setSerial('');
    setIp('');
    setSector('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const filteredEquipment = equipment.filter(e =>
    e.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.secretariat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.ipAddress.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Equipamentos Registrados</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie a lista de impressoras e multifuncionais alocadas nas secretarias e departamentos.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          {showAddForm ? 'Ocultar Formulário' : 'Cadastrar Equipamento'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-top duration-300">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Printer size={18} className="text-indigo-600 dark:text-indigo-400" />
            Adicionar Novo Equipamento ao Parque
          </h3>

          <form onSubmit={handleAddEquipment} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Número de Série (Serial)</label>
                <input
                  type="text"
                  placeholder="Ex: HP-M404-004"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Modelo do Equipamento</label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="HP LaserJet M404dn">HP LaserJet M404dn (Mono)</option>
                  <option value="Kyocera ECOSYS P3055dn">Kyocera ECOSYS P3055dn (Mono)</option>
                  <option value="HP Color LaserJet MFP M479fdw">HP Color LaserJet MFP M479fdw</option>
                  <option value="Kyocera ECOSYS M5526cdw">Kyocera ECOSYS M5526cdw</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Endereço IP</label>
                <input
                  type="text"
                  placeholder="Ex: 192.168.10.155"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Secretaria Destino</label>
                <select
                  value={sec}
                  onChange={(e) => setSec(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="Secretaria de Educação">Secretaria de Educação</option>
                  <option value="Secretaria de Saúde">Secretaria de Saúde</option>
                  <option value="Secretaria de Administração">Secretaria de Administração</option>
                  <option value="Secretaria da Fazenda">Secretaria da Fazenda</option>
                  <option value="Secretaria de Obras">Secretaria de Obras</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Setor de Alocação</label>
                <input
                  type="text"
                  placeholder="Ex: Protocolo / Almoxarifado"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Os dados acima serão mantidos em memória. O monitoramento automático por ping ou SNMP será simulado.
              </span>
              <button
                type="submit"
                className="px-5 h-10 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
              >
                Cadastrar Impressora
              </button>
            </div>

            {success && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-500/5 dark:border-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Impressora adicionada temporariamente ao frontend!</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Equipment List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Filter Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Parque de Impressoras</h3>
            <p className="text-xs text-slate-400">Lista completa com status de funcionamento e níveis de suprimento (toner).</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute top-2.5 left-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar por serial, modelo, IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:bg-slate-950 transition-all"
            />
          </div>
        </div>

        {/* Table element */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase dark:bg-slate-900 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Serial / Modelo</th>
                <th scope="col" className="px-6 py-4">Endereço IP</th>
                <th scope="col" className="px-6 py-4">Localização (Secretaria / Setor)</th>
                <th scope="col" className="px-6 py-4 text-center">Nível de Toner</th>
                <th scope="col" className="px-6 py-4">Status Monitoramento</th>
                <th scope="col" className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEquipment.length > 0 ? (
                filteredEquipment.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{item.serial}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.modelName}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">{item.ipAddress}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">{item.secretariat}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.sector}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 max-w-28">
                          <div
                            className={`h-2 rounded-full ${
                              item.tonerLevel <= 10 ? 'bg-rose-500' : item.tonerLevel <= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${item.tonerLevel}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.tonerLevel}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {item.status === 'online' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <CheckCircle2 size={12} />
                            Online
                          </span>
                        ) : item.status === 'warning' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            <AlertTriangle size={12} />
                            Alerta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                            <XCircle size={12} />
                            Offline
                          </span>
                        )}
                        <span className="text-xs text-slate-400 max-w-40 truncate" title={item.statusDetails}>
                          {item.statusDetails}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEquipment(equipment.filter(e => e.id !== item.id))}
                        className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        title="Remover Equipamento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={24} className="text-slate-300 dark:text-slate-700" />
                      <span>Nenhuma impressora localizada para os filtros inseridos.</span>
                    </div>
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
