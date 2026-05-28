import { useState } from 'react';
import { Settings, Shield, User, Key, ToggleLeft, ToggleRight, Check } from 'lucide-react';

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'integrations'>('profile');
  
  // General configs states
  const [allowOverQuota, setAllowOverQuota] = useState(true);
  const [notifySlaBreaches, setNotifySlaBreaches] = useState(true);
  const [enableSNMPPolling, setEnableSNMPPolling] = useState(false);
  
  // Integrations state
  const [webhookUrl, setWebhookUrl] = useState('https://n8n.nas.gov.br/webhook/printcontrol-sync');
  
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Configurações do Sistema</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie as preferências de monitoramento, integração de webhooks e perfis de administração.</p>
      </div>

      {/* Tabs Layout */}
      <div className="flex w-full flex-col gap-6 xl:flex-row">
        {/* Navigation Sidebar for settings */}
        <div className="flex w-full shrink-0 flex-row gap-2 overflow-x-auto border-b border-slate-200 pb-4 dark:border-slate-800 xl:w-72 xl:flex-col xl:overflow-visible xl:border-b-0 xl:border-r xl:pb-0 xl:pr-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer
              ${activeTab === 'profile'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-450 dark:hover:text-slate-100'
              }
            `}
          >
            <User size={18} />
            Perfil do Usuário
          </button>
          
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer
              ${activeTab === 'general'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-450 dark:hover:text-slate-100'
              }
            `}
          >
            <Settings size={18} />
            Parâmetros Gerais
          </button>

          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer
              ${activeTab === 'integrations'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-450 dark:hover:text-slate-100'
              }
            `}
          >
            <Key size={18} />
            Integrações & n8n
          </button>
        </div>

        {/* Tab content wrapper */}
        <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Informações de Perfil</h3>
                <p className="text-xs text-slate-400">Identificação administrativa no sistema PrintControl NAS.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Nome Completo</label>
                  <input
                    type="text"
                    defaultValue="Administrador PrintControl"
                    className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">E-mail Corporativo</label>
                  <input
                    type="email"
                    defaultValue="admin@printcontrol.local"
                    className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Perfil de Acesso</label>
                  <input
                    type="text"
                    value="Administrador Geral (TI)"
                    disabled
                    className="w-full h-10 rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Organização</label>
                  <input
                    type="text"
                    value="Prefeitura Municipal (NAS)"
                    disabled
                    className="w-full h-10 rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-5 h-10 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
                >
                  Salvar Perfil
                </button>
              </div>
            </form>
          )}

          {activeTab === 'general' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Parâmetros de Gestão</h3>
                <p className="text-xs text-slate-400">Regras automáticas de comportamento do parque de impressões.</p>
              </div>

              <div className="space-y-4">
                {/* Rule 1 */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/50 dark:border-slate-800/80 dark:hover:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 sm:pr-4">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Permitir Extravasamento de Cota</h4>
                    <p className="text-xs text-slate-400">
                      Permitir que secretarias continuem imprimindo mesmo após atingir 100% da cota mensal planejada (faturamento excedente ativo).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowOverQuota(!allowOverQuota)}
                    className="text-indigo-600 dark:text-indigo-400 cursor-pointer"
                  >
                    {allowOverQuota ? <ToggleRight size={40} /> : <ToggleLeft size={40} className="text-slate-400" />}
                  </button>
                </div>

                {/* Rule 2 */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/50 dark:border-slate-800/80 dark:hover:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 sm:pr-4">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notificar Estouro de SLA de Impressora</h4>
                    <p className="text-xs text-slate-400">
                      Disparar alertas críticos caso um equipamento offline passe do prazo limite contratual de reparo (horas acordadas em contrato).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifySlaBreaches(!notifySlaBreaches)}
                    className="text-indigo-600 dark:text-indigo-400 cursor-pointer"
                  >
                    {notifySlaBreaches ? <ToggleRight size={40} /> : <ToggleLeft size={40} className="text-slate-400" />}
                  </button>
                </div>

                {/* Rule 3 */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/50 dark:border-slate-800/80 dark:hover:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 sm:pr-4">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Varredura SNMP Ativa</h4>
                    <p className="text-xs text-slate-400">
                      Habilitar varreduras automáticas de rede via SNMP para coletar os contadores de páginas físicos das impressoras em tempo real.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableSNMPPolling(!enableSNMPPolling)}
                    className="text-indigo-600 dark:text-indigo-400 cursor-pointer"
                  >
                    {enableSNMPPolling ? <ToggleRight size={40} /> : <ToggleLeft size={40} className="text-slate-400" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-5 h-10 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
                >
                  Salvar Parâmetros
                </button>
              </div>
            </form>
          )}

          {activeTab === 'integrations' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Integração n8n & IA</h3>
                <p className="text-xs text-slate-400">Configurações para envio automático de relatórios consolidados e webhooks de IA.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Webhook de Sincronização (n8n)</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    required
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    O sistema enviará um payload JSON contendo o fechamento mensal assim que a auditoria PDF de uma secretaria for gerada.
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-indigo-900 dark:border-indigo-500/10 dark:bg-indigo-500/5 dark:text-indigo-300 sm:flex-row">
                  <Shield size={20} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <div className="space-y-1">
                    <p className="font-semibold">Conexão Segura Supabase</p>
                    <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                      As variáveis <code className="font-mono text-indigo-600 dark:text-indigo-450 bg-indigo-100 dark:bg-indigo-950 px-1 py-0.5 rounded">SUPABASE_URL</code> e <code className="font-mono text-indigo-600 dark:text-indigo-450 bg-indigo-100 dark:bg-indigo-950 px-1 py-0.5 rounded">SUPABASE_ANON_KEY</code> serão carregadas dinamicamente a partir dos arquivos de ambiente local em uma fase futura, garantindo a integridade dos dados de produção.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-5 h-10 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
                >
                  Salvar Webhooks
                </button>
              </div>
            </form>
          )}

          {success && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-500/5 dark:border-emerald-500/10 dark:text-emerald-300">
              <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Configurações atualizadas temporariamente no frontend!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
