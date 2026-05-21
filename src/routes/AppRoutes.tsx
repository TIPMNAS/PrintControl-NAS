import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Dashboard from '../pages/Dashboard';
import RelatoriosPdf from '../pages/RelatoriosPdf';
import Leituras from '../pages/Leituras';
import Equipamentos from '../pages/Equipamentos';
import Modelos from '../pages/Modelos';
import Secretarias from '../pages/Secretarias';
import Setores from '../pages/Setores';
import Contratos from '../pages/Contratos';
import Saldos from '../pages/Saldos';
import PapelA4 from '../pages/PapelA4';
import Configuracoes from '../pages/Configuracoes';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/relatorios-pdf" element={<RelatoriosPdf />} />
        <Route path="/leituras" element={<Leituras />} />
        <Route path="/equipamentos" element={<Equipamentos />} />
        <Route path="/modelos" element={<Modelos />} />
        <Route path="/secretarias" element={<Secretarias />} />
        <Route path="/setores" element={<Setores />} />
        <Route path="/contratos" element={<Contratos />} />
        <Route path="/saldos" element={<Saldos />} />
        <Route path="/papel-a4" element={<PapelA4 />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
