'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from './Sidebar';
import DashboardHome from './DashboardHome';
import AdmisionesModule from './AdmisionesModule';
import PacientesModule from './PacientesModule';
import CitasModule from './CitasModule';
import EspecialidadesModule from './EspecialidadesModule';
import DepartamentosModule from './DepartamentosModule';
import DoctoresModule from './DoctoresModule';
import DoctorForm from './DoctorForm';
import ExamenesModule from './ExamenesModule';
import CategoriasExamenesModule from './CategoriasExamenesModule';
import FarmaciaModule from './FarmaciaModule';
import CategoriasProductosModule from './CategoriasProductosModule';
import EtiquetasProductosModule from './EtiquetasProductosModule';

export default function Dashboard({ user, onLogout }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [editingDoctor, setEditingDoctor] = useState(null);

  // Sincronizar con la URL
  useEffect(() => {
    const module = searchParams.get('module') || 'dashboard';
    setActiveModule(module);
  }, [searchParams]);

  // Función para cambiar de módulo y actualizar URL
  const changeModule = (module) => {
    setActiveModule(module);
    router.push(`/?module=${module}`, { scroll: false });
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardHome user={user} />;
      case 'admisiones':
        return <AdmisionesModule user={user} />;
      case 'pacientes':
        return <PacientesModule user={user} />;
      case 'citas':
        return <CitasModule user={user} />;
      case 'especialidades':
        return <EspecialidadesModule user={user} />;
      case 'departamentos':
        return <DepartamentosModule user={user} />;
      case 'examenes':
        return <ExamenesModule user={user} />;
      case 'categorias-examenes':
        return <CategoriasExamenesModule user={user} />;
      case 'doctores':
        return <DoctoresModule user={user} onEdit={(doctor) => {
          setEditingDoctor(doctor);
          changeModule('agregar-doctor');
        }} onAdd={() => {
          setEditingDoctor(null);
          changeModule('agregar-doctor');
        }} />;
      case 'agregar-doctor':
        return <DoctorForm user={user} editingDoctor={editingDoctor} onBack={() => {
          setEditingDoctor(null);
          changeModule('doctores');
        }} />;
      // Módulos de Farmacia
      case 'farmacia':
        return <FarmaciaModule user={user} />;
      case 'categorias-farmacia':
        return <CategoriasProductosModule user={user} />;
      case 'etiquetas-farmacia':
        return <EtiquetasProductosModule user={user} />;
      default:
        return <DashboardHome user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        user={user}
        activeModule={activeModule}
        setActiveModule={changeModule}
        onLogout={onLogout}
      />
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        {renderModule()}
      </main>
    </div>
  );
}
