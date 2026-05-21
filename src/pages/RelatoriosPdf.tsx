import { useState } from 'react';
import { FileText, Download, CheckCircle, RefreshCw } from 'lucide-react';

interface Report {
  id: string;
  secretariat: string;
  period: string;
  totalPages: number;
  totalCost: number;
  status: 'available' | 'generating';
}

const mockReports: Report[] = [
  { id: 'REP-2026-05-SECED', secretariat: 'Secretaria de Educação', period: 'Maio / 2026', totalPages: 82000, totalCost: 12300, status: 'available' },
  { id: 'REP-2026-05-SECSA', secretariat: 'Secretaria de Saúde', period: 'Maio / 2026', totalPages: 48500, totalCost: 7275, status: 'available' },
  { id: 'REP-2026-05-SECAD', secretariat: 'Secretaria de Administração', period: 'Maio / 2026', totalPages: 25000, totalCost: 3750, status: 'available' },
  { id: 'REP-2026-05-SECFZ', secretariat: 'Secretaria da Fazenda', period: 'Maio / 2026', totalPages: 19200, totalCost: 2880, status: 'available' },
  { id: 'REP-2026-04-SECED', secretariat: 'Secretaria de Educação', period: 'Abril / 2026', totalPages: 78000, totalCost: 11700, status: 'available' },
  { id: 'REP-2026-04-SECSA', secretariat: 'Secretaria de Saúde', period: 'Abril / 2026', totalPages: 45000, totalCost: 6750, status: 'available' },
];

export default function RelatoriosPdf() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [filterSecretariat, setFilterSecretariat] = useState('');
  const [filterMonth, setFilterMonth] = useState('05');
  const [filterYear, setFilterYear] = useState('2026');
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setSuccessMsg('');

    setTimeout(() => {
      const newReport: Report = {
        id: `REP-${filterYear}-${filterMonth}-CUSTOM`,
        secretariat: filterSecretariat || 'Geral Consolidado',
        period: `${filterMonth === '05' ? 'Maio' : 'Abril'} / ${filterYear}`,
        totalPages: Math.floor(Math.random() * 50000) + 15000,
        totalCost: Math.floor(Math.random() * 8000) + 2000,
        status: 'available',
      };

      setReports([newReport, ...reports]);
      setGenerating(false);
      setSuccessMsg(`Relatório "${newReport.secretariat}" gerado com sucesso!`);
    }, 1500);
  };

  const handleDownload = (id: string) => {
    alert(`Iniciando download do arquivo PDF: ${id}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Relatórios Mensais (PDF)</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Gere e faça o download dos fechamentos mensais de auditoria de impressão para prestação de contas.</p>
      </div>

      {/* Generator Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Gerador de Relatório</h3>
        <form onSubmit={handleGenerateReport} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Secretaria</label>
            <select
              value={filterSecretariat}
              onChange={(e) => setFilterSecretariat(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="">Consolidado de Todas</option>
              <option value="Secretaria de Educação">Secretaria de Educação</option>
              <option value="Secretaria de Saúde">Secretaria de Saúde</option>
              <option value="Secretaria de Administração">Secretaria de Administração</option>
              <option value="Secretaria da Fazenda">Secretaria da Fazenda</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Mês de Referência</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="05">Maio</option>
              <option value="04">Abril</option>
              <option value="03">Março</option>
              <option value="02">Fevereiro</option>
              <option value="01">Janeiro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Ano</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={generating}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-400 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <FileText className="h-4.5 w-4.5" />
                  Gerar Relatório PDF
                </>
              )}
            </button>
          </div>
        </form>

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-500/5 dark:border-emerald-500/10 dark:text-emerald-300">
            <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Reports List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Relatórios Disponíveis</h3>
          <p className="text-xs text-slate-400">Lista de fechamentos disponíveis para download.</p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {reports.map((report) => (
            <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{report.secretariat}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Período: {report.period} • ID: {report.id}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{report.totalPages.toLocaleString()} páginas</p>
                  <p className="text-xs text-slate-400 mt-0.5">Custo: R$ {report.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <button
                  onClick={() => handleDownload(report.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
                  title="Baixar PDF"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
