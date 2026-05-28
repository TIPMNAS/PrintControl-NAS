import { useState } from 'react';
import { Tag, Plus, CreditCard, Award } from 'lucide-react';

interface PrinterModel {
  id: string;
  brand: string;
  name: string;
  type: 'Mono' | 'Color';
  printSpeed: number; // ppm
  tonerModel: string;
  costMono: number; // R$
  costColor: number; // R$
}

const mockModels: PrinterModel[] = [
  { id: '1', brand: 'HP', name: 'HP LaserJet M404dn', type: 'Mono', printSpeed: 40, tonerModel: 'CF258A (58A) / CF258X (58X)', costMono: 0.15, costColor: 0 },
  { id: '2', brand: 'Kyocera', name: 'Kyocera ECOSYS P3055dn', type: 'Mono', printSpeed: 55, tonerModel: 'TK-3160 / TK-3170', costMono: 0.12, costColor: 0 },
  { id: '3', brand: 'HP', name: 'HP Color LaserJet MFP M479fdw', type: 'Color', printSpeed: 28, tonerModel: 'W2020A (414A) Series', costMono: 0.16, costColor: 0.85 },
  { id: '4', brand: 'Kyocera', name: 'Kyocera ECOSYS M5526cdw', type: 'Color', printSpeed: 26, tonerModel: 'TK-5240 K/C/M/Y', costMono: 0.14, costColor: 0.78 },
];

export default function Modelos() {
  const [models, setModels] = useState<PrinterModel[]>(mockModels);
  const [showForm, setShowForm] = useState(false);


  // Form States
  const [brand, setBrand] = useState('HP');
  const [name, setName] = useState('');
  const [type, setType] = useState<'Mono' | 'Color'>('Mono');
  const [speed, setSpeed] = useState('');
  const [toner, setToner] = useState('');
  const [costMono, setCostMono] = useState('');
  const [costColor, setCostColor] = useState('0');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !speed || !toner || !costMono) return;

    const newModel: PrinterModel = {
      id: String(models.length + 1),
      brand,
      name,
      type,
      printSpeed: parseInt(speed),
      tonerModel: toner,
      costMono: parseFloat(costMono),
      costColor: type === 'Color' ? parseFloat(costColor) : 0,
    };

    setModels([...models, newModel]);
    setName('');
    setSpeed('');
    setToner('');
    setCostMono('');
    setCostColor('0');
    setShowForm(false);
  };

  const filteredModels = models;

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Modelos de Equipamentos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie a tabela de modelos suportados, especificações técnicas de toners e custos contratuais por página.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          {showForm ? 'Fechar Cadastro' : 'Cadastrar Novo Modelo'}
        </button>
      </div>

      {/* Form Model */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-top duration-300">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Tag size={18} className="text-indigo-600 dark:text-indigo-400" />
            Cadastrar Novo Modelo de Impressora
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Fabricante / Marca</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="HP">HP</option>
                  <option value="Kyocera">Kyocera</option>
                  <option value="Brother">Brother</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Ricoh">Ricoh</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Nome do Modelo</label>
                <input
                  type="text"
                  placeholder="Ex: LaserJet M404dn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Tipo de Cor</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'Mono' | 'Color')}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="Mono">Monocromática (Preto/Branco)</option>
                  <option value="Color">Colorida</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Velocidade (Páginas por Minuto)</label>
                <input
                  type="number"
                  placeholder="Ex: 40"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Código / Modelo do Toner</label>
                <input
                  type="text"
                  placeholder="Ex: TK-3160 / CF258A"
                  value={toner}
                  onChange={(e) => setToner(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Valor Unitário Mono (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 0.15"
                  value={costMono}
                  onChange={(e) => setCostMono(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>

              {type === 'Color' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Valor Unitário Color (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 0.85"
                    value={costColor}
                    onChange={(e) => setCostColor(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-5 h-10 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
              >
                Adicionar Modelo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Model Catalog Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredModels.map((m) => (
          <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                  {m.brand}
                </span>
                <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">{m.name}</h3>
                <p className="text-xs text-slate-400">Modelo {m.type === 'Color' ? 'Colorido' : 'Monocromático (Preto/Branco)'}</p>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Award size={20} />
              </div>
            </div>

            {/* Spec Fields */}
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50/50 dark:bg-slate-950/50 rounded-lg p-3.5 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Velocidade</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{m.printSpeed} Páginas / Min</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Modelo do Toner</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block" title={m.tonerModel}>
                  {m.tonerModel}
                </span>
              </div>
            </div>

            {/* Cost Information */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-sm">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <CreditCard size={16} className="text-slate-400" />
                <span>Preço Pág. (Mono):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  R$ {m.costMono.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {m.type === 'Color' && (
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span>Color:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    R$ {m.costColor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
