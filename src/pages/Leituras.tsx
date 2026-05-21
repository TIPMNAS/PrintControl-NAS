import { useState } from 'react';
import { Gauge, Plus, Search, Calendar, Check, AlertCircle } from 'lucide-react';

interface Reading {
  id: string;
  printerSerial: string;
  printerModel: string;
  secretariat: string;
  monoCounter: number;
  colorCounter: number;
  totalCounter: number;
  readingDate: string;
  recordedBy: string;
}

const mockReadings: Reading[] = [
  { id: '1', printerSerial: 'HP-M404-001', printerModel: 'HP LaserJet M404dn', secretariat: 'Secretaria de Educação', monoCounter: 45230, colorCounter: 0, totalCounter: 45230, readingDate: '2026-05-19', recordedBy: 'Carlos Silva' },
  { id: '2', printerSerial: 'KYO-3055-002', printerModel: 'Kyocera ECOSYS P3055dn', secretariat: 'Secretaria de Saúde', monoCounter: 89410, colorCounter: 0, totalCounter: 89410, readingDate: '2026-05-18', recordedBy: 'Carlos Silva' },
  { id: '3', printerSerial: 'HP-MFP479-001', printerModel: 'HP Color LaserJet MFP M479fdw', secretariat: 'Secretaria de Administração', monoCounter: 15400, colorCounter: 9600, totalCounter: 25000, readingDate: '2026-05-15', recordedBy: 'Ana Santos' },
  { id: '4', printerSerial: 'KYO-3055-003', printerModel: 'Kyocera ECOSYS P3055dn', secretariat: 'Secretaria da Fazenda', monoCounter: 19200, colorCounter: 0, totalCounter: 19200, readingDate: '2026-05-12', recordedBy: 'Ana Santos' },
];

export default function Leituras() {
  const [readings, setReadings] = useState<Reading[]>(mockReadings);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [formSerial, setFormSerial] = useState('HP-M404-001');
  const [formMono, setFormMono] = useState('');
  const [formColor, setFormColor] = useState('0');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formUser, setFormUser] = useState('Carlos Silva');
  const [success, setSuccess] = useState(false);

  const handleAddReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMono) return;

    const monoVal = parseInt(formMono);
    const colorVal = parseInt(formColor) || 0;
    const totalVal = monoVal + colorVal;

    const matchedPrinter = readings.find(r => r.printerSerial === formSerial);
    const model = matchedPrinter?.printerModel || 'Generic Printer';
    const sec = matchedPrinter?.secretariat || 'Secretaria de Educação';

    const newReading: Reading = {
      id: String(readings.length + 1),
      printerSerial: formSerial,
      printerModel: model,
      secretariat: sec,
      monoCounter: monoVal,
      colorCounter: colorVal,
      totalCounter: totalVal,
      readingDate: formDate,
      recordedBy: formUser,
    };

    setReadings([newReading, ...readings]);
    setFormMono('');
    setFormColor('0');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const filteredReadings = readings.filter(r =>
    r.printerSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.secretariat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.printerModel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Lançamento de Leituras</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Registre e consulte os contadores mecânicos das impressoras ativas para fins de fechamento de faturamento.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          {showAddForm ? 'Ocultar Formulário' : 'Nova Leitura Manual'}
        </button>
      </div>

      {/* Manual Insert Form */}
      {showAddForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-top duration-300">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Gauge size={18} className="text-indigo-600 dark:text-indigo-400" />
            Inserir Leitura de Contador
          </h3>

          <form onSubmit={handleAddReading} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Equipamento (Serial)</label>
                <select
                  value={formSerial}
                  onChange={(e) => setFormSerial(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="HP-M404-001">HP-M404-001 (Pedagógico)</option>
                  <option value="KYO-3055-002">KYO-3055-002 (Posto Central)</option>
                  <option value="HP-MFP479-001">HP-MFP479-001 (RH)</option>
                  <option value="KYO-3055-003">KYO-3055-003 (Protocolo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Contador Mono (Preto & Branco)</label>
                <input
                  type="number"
                  placeholder="Ex: 45890"
                  value={formMono}
                  onChange={(e) => setFormMono(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Contador Colorido</label>
                <input
                  type="number"
                  placeholder="Ex: 9800"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Data da Leitura</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Operador</label>
                <input
                  type="text"
                  value={formUser}
                  onChange={(e) => setFormUser(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Certifique-se de que os contadores são maiores do que a última leitura registrada para este equipamento.
              </span>
              <button
                type="submit"
                className="px-5 h-10 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
              >
                Salvar Lançamento
              </button>
            </div>

            {success && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-500/5 dark:border-emerald-500/10 dark:text-emerald-300">
                <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Leitura manual salva com sucesso no banco temporário do frontend!</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Readings Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Histórico de Lançamentos</h3>
            <p className="text-xs text-slate-400">Visualização de todas as leituras de contadores cadastradas no sistema.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute top-2.5 left-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar por serial ou secretaria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:bg-slate-950 transition-all"
            />
          </div>
        </div>

        {/* Table Element */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase dark:bg-slate-900 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Equipamento / Modelo</th>
                <th scope="col" className="px-6 py-4">Secretaria</th>
                <th scope="col" className="px-6 py-4 text-right">Contador Mono</th>
                <th scope="col" className="px-6 py-4 text-right">Contador Color</th>
                <th scope="col" className="px-6 py-4 text-right">Total Acumulado</th>
                <th scope="col" className="px-6 py-4">Data Leitura</th>
                <th scope="col" className="px-6 py-4">Registrado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReadings.length > 0 ? (
                filteredReadings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{reading.printerSerial}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{reading.printerModel}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{reading.secretariat}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-800 dark:text-slate-200">{reading.monoCounter.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-800 dark:text-slate-200">{reading.colorCounter.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {reading.totalCounter.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(reading.readingDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{reading.recordedBy}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={24} className="text-slate-300 dark:text-slate-700" />
                      <span>Nenhum lançamento encontrado correspondente aos filtros.</span>
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
