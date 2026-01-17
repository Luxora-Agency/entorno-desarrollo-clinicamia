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
import FarmaciaHospitalariaModule from './farmacia/FarmaciaHospitalariaModule';
import CategoriasProductosModule from './CategoriasProductosModule';
import EtiquetasProductosModule from './EtiquetasProductosModule';
import AdmisionesView from './AdmisionesView';
import PacienteStepperForm from './PacienteStepperForm';
import VerPaciente from './VerPaciente';
import UnidadesModule from './UnidadesModule';
import HabitacionesModule from './HabitacionesModule';
import CamasModule from './CamasModule';
import HospitalizacionModule from './HospitalizacionModule';
import AdmisionesHospitalizacionModule from './AdmisionesHospitalizacionModule';
import HCEModule from './HCEModule';
import EnfermeriaModule from './EnfermeriaModule';
import LaboratorioModule from './LaboratorioModule';
import ImagenologiaModule from './ImagenologiaModule';
import UrgenciasModule from './UrgenciasModule';
import FacturacionModule from './FacturacionModule';
import QuirofanoModule from './QuirofanoModule';
import ReportesModule from './ReportesModule';
import PlanesMiaPassModule from './PlanesMiaPassModule';
import SuscripcionesMiaPassModule from './SuscripcionesMiaPassModule';
import SuscriptoresMiaPassModule from './SuscriptoresMiaPassModule';
import CuponesMiaPassModule from './CuponesMiaPassModule';
import FormulariosMiaPassModule from './FormulariosMiaPassModule';
import ComisionesMiaPassModule from './ComisionesMiaPassModule';
// Órdenes Médicas
import OrdenesMedicasModule from './OrdenesMedicasModule';
import OrdenesTiendaModule from './OrdenesTiendaModule';
import UsuariosRolesModule from './UsuariosRolesModule';
import DashboardRecepcionistaNew from './DashboardRecepcionistaNew';
import DashboardDoctor from './DashboardDoctor';
import AttentionTypeSelector from './doctor/AttentionTypeSelector';
import DashboardDoctorHospitalizacion from './doctor/DashboardDoctorHospitalizacion';
import DoctorSettingsModule from './doctor/DoctorSettingsModule';
import DoctorScheduleManager from './DoctorScheduleManager';
import BloqueoAgendaManager from './doctor/BloqueoAgendaManager';
import MisCitasDelDiaView from './doctor/MisCitasDelDiaView';
import MiAgendaView from './doctor/MiAgendaView';
import AIMedicalAssistant from './doctor/AIMedicalAssistant';
import ClinicalWorkspace from './doctor/ClinicalWorkspace';
import CalidadModule from './calidad/CalidadModule';
import DocsInscripcionModule from './calidad2/docs-inscripcion/DocsInscripcionModule';
import TalentoHumanoModule from './calidad2/talento-humano/TalentoHumanoModule';
import InfraestructuraModule from './calidad2/infraestructura/InfraestructuraModule';
import MedicamentosModule from './calidad2/medicamentos/MedicamentosModule';
import ProcesosPrioritariosModule from './calidad2/procesos-prioritarios/ProcesosPrioritariosModule';
import HistoriaClinicaModule from './calidad2/historia-clinica/HistoriaClinicaModule';
import SSTModule from './sst/SSTModule';
import RRHHModule from './rrhh/RRHHModule';
import DrogueriaModule from './drogueria/DrogueriaModule';
import ChecklistsModule from './calidad2/ChecklistsModule';
import PlantillasDoctorModule from './templates/PlantillasDoctorModule';
import PublicacionesModule from './publicaciones/PublicacionesModule';
import ContabilidadModule from './contabilidad/ContabilidadModule';
import DashboardFinancieroModule from './contabilidad/DashboardFinancieroModule';
import ActivosFijosModule from './contabilidad/ActivosFijosModule';
import BancosModule from './contabilidad/BancosModule';
import ComprasModule from './compras/ComprasModule';
import SiigoConfigModule from './admin/SiigoConfigModule';
import SolicitudesHCModule from './admin/SolicitudesHCModule';
import TiposUsuarioConvenioModule from './TiposUsuarioConvenioModule';

export default function Dashboard({ user, onLogout }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const [loadingPaciente, setLoadingPaciente] = useState(false);
  // Estado para consulta médica
  const [consultaCita, setConsultaCita] = useState(null);
  const [loadingCita, setLoadingCita] = useState(false);

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

    // Cargar cita si es módulo de consulta
    const citaId = searchParams.get('citaId');
    if (module === 'consulta' && citaId) {
      loadCita(citaId);
    } else if (module !== 'consulta') {
      setConsultaCita(null);
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

  // Cargar cita para consulta médica
  const loadCita = async (citaId) => {
    setLoadingCita(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/citas/${citaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const cita = result.data?.cita || result.data || result;
        setConsultaCita(cita);
      } else {
        console.error('Error al cargar cita:', response.status);
        setConsultaCita(null);
      }
    } catch (error) {
      console.error('Error al cargar cita:', error);
      setConsultaCita(null);
    } finally {
      setLoadingCita(false);
    }
  };

  // Finalizar consulta y volver al dashboard
  const handleFinishConsulta = async (consultaData) => {
    try {
      // Actualizar estado de la cita a Completada
      const citaId = consultaData?.citaId || consultaCita?.id;
      if (citaId) {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        await fetch(`${apiUrl}/citas/${citaId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ estado: 'Completada' }),
        });
      }
    } catch (error) {
      console.error('Error actualizando estado de cita:', error);
    } finally {
      setConsultaCita(null);
      router.push('/?module=mis-citas', { scroll: false });
    }
  };

  // Función para cambiar de módulo y actualizar URL
  const changeModule = (module, params = {}) => {
    setActiveModule(module);
    // Construir query string con parámetros adicionales
    const queryParams = new URLSearchParams({ module });
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.set(key, value);
      }
    });
    router.push(`/?${queryParams.toString()}`, { scroll: false });
  };

  const renderModule = () => {
    // Manejar vista de paciente individual
    const pacienteId = searchParams.get('pacienteId');
    
    if (activeModule === 'pacientes' && pacienteId) {
      return <VerPaciente 
        pacienteId={pacienteId} 
        onBack={() => changeModule('pacientes')}
        user={user}
      />;
    }
    
    // Determinar si es doctor
    const userRole = (user?.rol || '').toLowerCase();
    const isDoctor = userRole === 'doctor' || userRole === 'medico';

    switch (activeModule) {
      case 'dashboard':
        // Dashboard personalizado según rol
        if (user.rol === 'Recepcionista') {
          return <DashboardRecepcionistaNew user={user} />;
        }
        // Para doctores, mostrar directamente el panel del doctor (no el selector de atención)
        if (isDoctor) {
          return <DashboardDoctor user={user} onNavigateModule={changeModule} />;
        }
        return <DashboardHome user={user} />;

      // Tipos de atención - muestra el selector para doctores
      case 'tipos-atencion':
        if (isDoctor) {
          return (
            <AttentionTypeSelector
              user={user}
              skipSavedPreference={true}
              onSelect={(type) => {
                if (type === 'consulta') {
                  changeModule('mis-citas');
                } else if (type === 'hospitalizacion') {
                  changeModule('mis-hospitalizados');
                } else if (type === 'quirofano') {
                  changeModule('mis-cirugias');
                }
              }}
            />
          );
        }
        return <DashboardHome user={user} />;

      // Consulta médica - vista de trabajo clínico
      case 'consulta':
        if (isDoctor) {
          if (loadingCita) {
            return (
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando consulta...</p>
                </div>
              </div>
            );
          }
          if (consultaCita) {
            return (
              <ClinicalWorkspace
                cita={consultaCita}
                user={user}
                onClose={() => {
                  if (confirm('¿Salir sin finalizar? Se perderán los datos no guardados.')) {
                    setConsultaCita(null);
                    router.push('/?module=mis-citas', { scroll: false });
                  }
                }}
                onFinish={handleFinishConsulta}
              />
            );
          }
          // Si no hay cita, volver a mis citas
          return <MisCitasDelDiaView user={user} />;
        }
        return <DashboardHome user={user} />;

      // Mis Citas del Día - vista dedicada del doctor
      case 'mis-citas':
        if (isDoctor) {
          return <MisCitasDelDiaView user={user} />;
        }
        return <CitasModule user={user} />;

      // Mis Hospitalizados - vista de hospitalización del doctor
      case 'mis-hospitalizados':
        if (isDoctor) {
          return <DashboardDoctorHospitalizacion user={user} />;
        }
        return <HospitalizacionModule user={user} />;

      // Mis Cirugías - vista de quirófano del doctor
      case 'mis-cirugias':
        if (isDoctor) {
          return <DashboardDoctor user={user} initialMode="quirofano" onNavigateModule={changeModule} />;
        }
        return <QuirofanoModule user={user} />;

      // Configuración del doctor
      case 'configuracion-doctor':
        if (isDoctor) {
          return <DoctorSettingsModule user={user} />;
        }
        return <DashboardHome user={user} />;

      // Mi Agenda - vista de agenda del doctor
      case 'mi-agenda':
        if (isDoctor) {
          return <MiAgendaView user={user} />;
        }
        return <DashboardHome user={user} />;

      // Asistente IA - vista independiente para el doctor
      case 'asistente-ia':
        if (isDoctor) {
          return <AIMedicalAssistant isOpen={true} onClose={() => changeModule('dashboard')} />;
        }
        return <DashboardHome user={user} />;

      case 'admisiones':
        return <AdmisionesModule user={user} />;
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
      case 'farmacia-hospitalaria':
        return <FarmaciaHospitalariaModule user={user} />;
      case 'farmacia-inventario':
        return <FarmaciaModule user={user} />;
      case 'ordenes-tienda':
        return <OrdenesTiendaModule user={user} />;
      case 'categorias-productos':
        return <CategoriasProductosModule user={user} />;
      case 'etiquetas-productos':
        return <EtiquetasProductosModule user={user} />;
      // Módulos de Hospitalización
      case 'admisiones-hospitalizacion':
        return <AdmisionesHospitalizacionModule user={user} />;
      case 'unidades':
        return <UnidadesModule user={user} />;
      case 'habitaciones':
        return <HabitacionesModule user={user} />;
      case 'camas':
        return <CamasModule user={user} />;
      case 'hospitalizacion':
        return <HospitalizacionModule user={user} />;
      case 'hce':
        return <HCEModule user={user} />;
      case 'enfermeria':
        return <EnfermeriaModule user={user} />;
      case 'laboratorio':
        return <LaboratorioModule user={user} />;
      case 'imagenologia':
        return <ImagenologiaModule user={user} />;
      case 'urgencias':
        return <UrgenciasModule user={user} />;
      case 'facturacion':
        return <FacturacionModule user={user} />;
      case 'quirofano':
        return <QuirofanoModule user={user} />;
      case 'reportes':
        return <ReportesModule user={user} />;
      // Módulos MiaPass
      case 'planes-miapass':
        return <PlanesMiaPassModule user={user} />;
      case 'suscripciones-miapass':
        return <SuscripcionesMiaPassModule user={user} />;
      case 'suscriptores-miapass':
        return <SuscriptoresMiaPassModule user={user} />;
      case 'cupones-miapass':
        return <CuponesMiaPassModule user={user} />;
      case 'formularios-miapass':
        return <FormulariosMiaPassModule user={user} />;
      case 'comisiones-miapass':
        return <ComisionesMiaPassModule user={user} />;
      // Órdenes Médicas
      case 'ordenes-medicas':
        return <OrdenesMedicasModule user={user} />;
      // Configuración
      case 'usuarios-roles':
        return <UsuariosRolesModule user={user} />;
      // Talento Humano (RRHH)
      case 'rrhh':
        return <RRHHModule user={user} />;
      // Droguería
      case 'drogueria':
        return <DrogueriaModule user={user} />;
      // Contabilidad
      case 'contabilidad':
        return <ContabilidadModule user={user} />;
      case 'dashboard-financiero':
        return <DashboardFinancieroModule user={user} />;
      case 'activos-fijos':
        return <ActivosFijosModule user={user} />;
      case 'bancos':
        return <BancosModule user={user} />;
      // Compras
      case 'compras':
        return <ComprasModule user={user} />;
      // Configuración Siigo
      case 'siigo-config':
        return <SiigoConfigModule user={user} />;
      // Solicitudes de Historia Clínica
      case 'solicitudes-hc':
        return <SolicitudesHCModule user={user} />;
      // Tipos de Usuario y Convenios
      case 'tipos-usuario-convenio':
        return <TiposUsuarioConvenioModule user={user} />;
      // Publicaciones
      case 'publicaciones':
      case 'categorias-publicaciones':
        return <PublicacionesModule user={user} activeTab={activeModule === 'categorias-publicaciones' ? 'categorias' : 'publicaciones'} />;
      // Módulo de Calidad
      case 'calidad':
        return <CalidadModule user={user} />;
      // Módulos de Calidad 2.0
      case 'calidad2-inscripcion':
        return <DocsInscripcionModule user={user} />;
      case 'calidad2-talento':
        return <TalentoHumanoModule user={user} />;
      case 'calidad2-infraestructura':
        return <InfraestructuraModule user={user} />;
      case 'calidad2-medicamentos':
        return <MedicamentosModule user={user} />;
      case 'calidad2-procesos-prioritarios':
        return <ProcesosPrioritariosModule user={user} />;
      case 'calidad2-historia-clinica':
        return <HistoriaClinicaModule user={user} />;
      case 'sst':
        return <SSTModule user={user} />;
      case 'calidad2-checklists':
        return <ChecklistsModule user={user} />;
      case 'plantillas-doctor':
        return <PlantillasDoctorModule user={user} />;
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
