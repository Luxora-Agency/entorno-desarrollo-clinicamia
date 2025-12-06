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
import AdmisionesView from './AdmisionesView';
import PacienteStepperForm from './PacienteStepperForm';
import UnidadesModule from './UnidadesModule';
import HabitacionesModule from './HabitacionesModule';
import CamasModule from './CamasModule';
import HCEModule from './HCEModule';

export default function Dashboard({ user, onLogout }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const [loadingPaciente, setLoadingPaciente] = useState(false);

  // Sincronizar con la URL
  useEffect(() => {
    const module = searchParams.get('module') || 'dashboard';
    setActiveModule(module);
    
    // Cargar paciente si está en modo edición
    const pacienteId = searchParams.get('pacienteId');
    if (module === 'agregar-paciente' && pacienteId) {
      loadPaciente(pacienteId);
    } else {
      setEditingPaciente(null);
    }
  }, [searchParams]);

  const loadPaciente = async (id) => {
    setLoadingPaciente(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      const response = await fetch(`${apiUrl}/pacientes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setEditingPaciente(result.data?.paciente || result.data || result);
      }
    } catch (error) {
      console.error('Error al cargar paciente:', error);
    } finally {
      setLoadingPaciente(false);
    }
  };

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
        return <AdmisionesView user={user} />;
      case 'pacientes':
        return <PacientesModule user={user} />;
      case 'agregar-paciente':
        if (loadingPaciente) {
          return <div className="p-8 text-center">Cargando información del paciente...</div>;
        }
        return <PacienteStepperForm
          user={user}
          editingPaciente={editingPaciente}
          onBack={() => {
            setEditingPaciente(null);
            changeModule('pacientes');
          }}
          onSuccess={() => {
            setEditingPaciente(null);
            changeModule('pacientes');
          }}
        />;
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
      // Módulos de Hospitalización
      case 'unidades':
        return <UnidadesModule user={user} />;
      case 'habitaciones':
        return <HabitacionesModule user={user} />;
      case 'gestion-camas':
        return <CamasModule user={user} />;
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
