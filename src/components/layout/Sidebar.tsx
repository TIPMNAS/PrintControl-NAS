import { NavLink } from 'react-router-dom'
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
  ChevronRight,
  Bot,
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export default function Sidebar({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/relatorios-pdf', label: 'Relatórios PDF', icon: FileText },
    { path: '/fila-processamento', label: 'Fila n8n/IA', icon: Bot },
    { path: '/leituras', label: 'Leituras', icon: Gauge },
    { path: '/equipamentos', label: 'Equipamentos', icon: Printer },
    { path: '/modelos', label: 'Modelos', icon: Tag },
    { path: '/secretarias', label: 'Secretarias', icon: Building2 },
    { path: '/setores', label: 'Setores', icon: Network },
    { path: '/contratos', label: 'Contratos', icon: FileCheck2 },
    { path: '/saldos', label: 'Saldos/Alertas', icon: Scale },
    { path: '/papel-a4', label: 'Papel A4', icon: Scroll },
    { path: '/configuracoes', label: 'Configurações', icon: Settings },
  ]

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-200 transition-all duration-300 ease-in-out lg:static
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-[min(18rem,calc(100vw-2rem))] lg:w-64 2xl:w-72'}
        `}
      >
        {/* Sidebar Header */}
        {isCollapsed ? (
          <div className="hidden h-20 flex-col items-center justify-center gap-2 border-b border-slate-800 px-2 lg:flex">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/20">
              P
            </div>

            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 text-slate-400 transition-colors hover:bg-slate-900 hover:text-white"
              onClick={() => setIsCollapsed(false)}
              aria-label="Expandir menu lateral"
              title="Expandir menu lateral"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        ) : (
          <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4 sm:h-16">
            <div className="flex min-w-0 items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/20">
                P
              </div>

              <span className="truncate bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                PrintControl NAS
              </span>
            </div>

            {/* Close button for Mobile */}
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar menu lateral"
            >
              <X size={20} />
            </button>

            {/* Collapse toggle for Desktop */}
            <button
              type="button"
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-800 text-slate-400 transition-colors hover:bg-slate-900 hover:text-white lg:flex"
              onClick={() => setIsCollapsed(true)}
              aria-label="Recolher menu lateral"
              title="Recolher menu lateral"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}

        {/* Sidebar Nav */}
        <nav
          className={`scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800 flex-1 space-y-1 overflow-y-auto py-4 ${
            isCollapsed ? 'px-2' : 'px-3'
          }`}
        >
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  group flex items-center rounded-lg text-sm font-medium transition-all
                  ${isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'}
                  ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  size={20}
                  className="shrink-0 transition-transform duration-200 group-hover:scale-105"
                />

                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4">
          <div className={`flex items-center overflow-hidden ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-500/20 bg-slate-800 text-xs font-bold text-indigo-400">
              ADM
            </div>

            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200">Administrador</p>
                <p className="truncate text-[10px] text-slate-500">
                  admin@printcontrol.local
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
