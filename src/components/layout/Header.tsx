import { useLocation } from 'react-router-dom';
import { Menu, Bell, Search, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard':
        return { title: 'Dashboard', parent: 'Visão Geral' };
      case '/relatorios-pdf':
        return { title: 'Relatórios PDF', parent: 'Relatórios' };
      case '/leituras':
        return { title: 'Leituras', parent: 'Medição' };
      case '/equipamentos':
        return { title: 'Equipamentos', parent: 'Cadastro' };
      case '/modelos':
        return { title: 'Modelos', parent: 'Cadastro' };
      case '/secretarias':
        return { title: 'Secretarias', parent: 'Estrutura' };
      case '/setores':
        return { title: 'Setores', parent: 'Estrutura' };
      case '/contratos':
        return { title: 'Contratos', parent: 'Gestão' };
      case '/saldos':
        return { title: 'Saldos & Alertas', parent: 'Gestão' };
      case '/papel-a4':
        return { title: 'Papel A4', parent: 'Recursos' };
      case '/configuracoes':
        return { title: 'Configurações', parent: 'Sistema' };
      default:
        return { title: 'PrintControl NAS', parent: 'Início' };
    }
  };

  const { title, parent } = getPageTitle(location.pathname);
  const formattedDate = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full min-w-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 shadow-xs transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 sm:h-16 sm:px-4 xl:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile Menu Toggle Button */}
        <button
          onClick={onMenuToggle}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 lg:hidden dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumbs / Page Title */}
        <div className="hidden min-w-0 flex-col sm:flex">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
            <span>{parent}</span>
            <ChevronRight size={12} />
            <span className="text-slate-500 dark:text-slate-400 font-semibold">{title}</span>
          </div>
          <h1 className="truncate text-base font-bold text-slate-800 dark:text-slate-100 sm:text-lg">{title}</h1>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-3 xl:gap-4">
        {/* Search Bar - Desktop Only */}
        <div className="relative hidden w-52 md:block lg:w-64 xl:w-80 2xl:w-96">
          <Search className="absolute top-2.5 left-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar no sistema..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-950 transition-all duration-200"
          />
        </div>

        {/* Date Display */}
        <div className="hidden items-center gap-1.5 border-r border-slate-200 pr-3 text-sm font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400 xl:flex 2xl:pr-4">
          <Calendar size={16} className="text-indigo-500" />
          <span className="capitalize">{formattedDate}</span>
        </div>

        {/* Notification Bell */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800">
          <Bell size={20} className="hover:scale-105 duration-200" />
          {/* Notification Badge Dot */}
          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        </button>
      </div>
    </header>
  );
}
