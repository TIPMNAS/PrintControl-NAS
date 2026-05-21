import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Gauge,
  Printer,
  Tag,
  Building2,
  Network,
  FileCheck2,
  Scale,
  Scroll,
  Settings,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/relatorios-pdf', label: 'Relatórios PDF', icon: FileText },
    { path: '/leituras', label: 'Leituras', icon: Gauge },
    { path: '/equipamentos', label: 'Equipamentos', icon: Printer },
    { path: '/modelos', label: 'Modelos', icon: Tag },
    { path: '/secretarias', label: 'Secretarias', icon: Building2 },
    { path: '/setores', label: 'Setores', icon: Network },
    { path: '/contratos', label: 'Contratos', icon: FileCheck2 },
    { path: '/saldos', label: 'Saldos/Alertas', icon: Scale },
    { path: '/papel-a4', label: 'Papel A4', icon: Scroll },
    { path: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-950 border-r border-slate-800 text-slate-200 transition-all duration-300 ease-in-out lg:static
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/20">
              P
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-transparent truncate">
                PrintControl NAS
              </span>
            )}
          </div>

          {/* Close button for Mobile */}
          <button
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>

          {/* Collapse toggle for Desktop */}
          <button
            className="hidden lg:flex p-1 rounded-md text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  }
                `}
              >
                <Icon
                  size={20}
                  className={`shrink-0 transition-colors group-hover:scale-105 duration-200`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400 border border-indigo-500/20 shrink-0">
              ADM
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200">Administrador</p>
                <p className="text-[10px] text-slate-500 truncate">admin@printcontrol.local</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
