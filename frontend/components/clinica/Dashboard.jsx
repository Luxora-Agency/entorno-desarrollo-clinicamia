'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import DashboardHome from './DashboardHome';
import PacientesModule from './PacientesModule';
import CitasModule from './CitasModule';
import EspecialidadesModule from './EspecialidadesModule';
import DepartamentosModule from './DepartamentosModule';

export default function Dashboard({ user, onLogout }) {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardHome user={user} />;
      case 'pacientes':
        return <PacientesModule user={user} />;
      case 'citas':
        return <CitasModule user={user} />;
      case 'especialidades':
        return <EspecialidadesModule user={user} />;
      case 'departamentos':
        return <DepartamentosModule user={user} />;
      default:
        return <DashboardHome user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        user={user}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onLogout={onLogout}
      />
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        {renderModule()}
      </main>
    </div>
  );
}
