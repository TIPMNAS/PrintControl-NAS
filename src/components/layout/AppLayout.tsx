import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-50 font-sans text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Main Work Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header Navigation */}
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        {/* Dynamic Content Outlet */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 px-3 py-4 transition-colors duration-200 dark:bg-slate-950 sm:px-4 lg:px-5 xl:px-6 2xl:px-8">
          <div className="w-full max-w-none min-w-0 space-y-6 animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
