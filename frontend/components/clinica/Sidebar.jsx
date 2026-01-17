'use client';

import { useState, useEffect } from 'react';
import { getTodayColombia, formatDateISO } from '@/services/formatters';
import {
  LayoutDashboard, Users, Calendar, X, Menu, Building2, ChevronDown, LogOut,
  Stethoscope, ClipboardList, Beaker, Pill, Tags,
  CreditCard, UserCheck, Ticket, Megaphone, FileText,
  Activity, Bed, Receipt, Scissors, BarChart3, Scan, Settings, Shield,
  UserCog, Store, Calculator, Landmark, Package, ShoppingCart, Cloud,
  Heart, Clock, Siren, Bot, FolderOpen, TrendingUp, CalendarCheck
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Sidebar({ user, activeModule, setActiveModule, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDoctoresOpen, setIsDoctoresOpen] = useState(false);
  const [isExamenesOpen, setIsExamenesOpen] = useState(false);
  const [isFarmaciaOpen, setIsFarmaciaOpen] = useState(false);
  const [isHospitalizacionOpen, setIsHospitalizacionOpen] = useState(false);
  const [isMiaPassOpen, setIsMiaPassOpen] = useState(false);
  const [isPublicacionesOpen, setIsPublicacionesOpen] = useState(false);
  const [isCalidad2Open, setIsCalidad2Open] = useState(false);
  const [isTalentoHumanoOpen, setIsTalentoHumanoOpen] = useState(false);
  const [isContabilidadOpen, setIsContabilidadOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Estados para contadores del doctor
  const [doctorStats, setDoctorStats] = useState({
    citasHoy: 0,
    pacientesHospitalizados: 0,
    cirugiasProgramadas: 0,
    pendientesEspera: 0
  });

  // Doctor profile state (para obtener el ID real del doctor, foto y especialidad)
  const [doctorId, setDoctorId] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState({
    foto: null,
    especialidades: [],
    especialidadPrincipal: null
  });

  // Configuración de permisos por rol
  const userRole = (user?.rol || 'admin').toLowerCase();

  // Cargar permisos desde la base de datos
  useEffect(() => {
    const cargarPermisos = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
           console.log('No token found, skipping permission load');
           setUserPermissions(['dashboard']); // Default public/minimal
           return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/roles/permisos/${userRole}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          // Extraer solo los módulos con acceso activo
          const permisosActivos = data.data
            .filter(p => p.acceso)
            .map(p => p.modulo);
          setUserPermissions(permisosActivos);
        } else {
          console.error('Error al cargar permisos:', data.message);
          // Fallback a permisos mínimos
          setUserPermissions(['dashboard']);
        }
      } catch (error) {
        console.error('Error al cargar permisos:', error);
        // Fallback a permisos mínimos
        setUserPermissions(['dashboard']);
      } finally {
        setLoadingPermissions(false);
      }
    };

    if (userRole) {
      cargarPermisos();
    }
  }, [userRole]);

  const hasAccess = (module) => {
    // Si es superadmin, tiene acceso a todo
    if (userRole === 'superadmin') {
      return true;
    }
    // De lo contrario, verificar en los permisos cargados de la BD
    return userPermissions.includes(module);
  };

  // Cargar perfil del doctor para obtener el doctorId real, foto y especialidades
  useEffect(() => {
    const cargarDoctorProfile = async () => {
      if (userRole !== 'doctor' || !user?.id) return;

      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/doctores?usuarioId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.data?.length > 0) {
          const doctor = data.data[0];
          setDoctorId(doctor.id);
          setDoctorProfile({
            foto: doctor.foto || null,
            especialidades: doctor.especialidades || [],
            especialidadPrincipal: doctor.especialidades?.[0] || null
          });
        }
      } catch (error) {
        console.error('Error loading doctor profile:', error);
      }
    };
    cargarDoctorProfile();
  }, [userRole, user?.id]);

  // Cargar estadísticas del doctor
  useEffect(() => {
    const cargarStatsDoctor = async () => {
      if (userRole !== 'doctor' || !doctorId) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const today = getTodayColombia();

        // Cargar citas del día del doctor
        const citasRes = await fetch(`${apiUrl}/citas?doctorId=${doctorId}&fecha=${today}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!citasRes.ok) return;

        const citasData = await citasRes.json();

        if (citasData.success) {
          const citas = citasData.data || [];
          const pendientes = citas.filter(c => c.estado === 'EnEspera' || c.estado === 'Confirmada').length;

          setDoctorStats(prev => ({
            ...prev,
            citasHoy: citas.length,
            pendientesEspera: pendientes
          }));
        }
      } catch {
        // Silenciar errores de red transitorios
      }
    };

    cargarStatsDoctor();
    // Actualizar cada 60 segundos
    const interval = setInterval(cargarStatsDoctor, 60000);
    return () => clearInterval(interval);
  }, [userRole, doctorId]);

  // Renderizar sidebar específico para doctores
  const renderDoctorSidebar = () => {
    return (
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {/* MI PRÁCTICA */}
          <div className="px-3 mb-3">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-3 h-3" />
              Mi Práctica
            </p>
          </div>

          {/* Tipos de Atención - PRIMERO */}
          <button
            onClick={() => {
              setActiveModule('tipos-atencion');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeModule === 'tipos-atencion'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200'
                : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>Tipos de Atención</span>
          </button>

          {/* Mi Panel */}
          <button
            onClick={() => {
              setActiveModule('dashboard');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeModule === 'dashboard'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200'
                : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-5 h-5" />
              <span>Mi Panel</span>
            </div>
            {doctorStats.pendientesEspera > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-2 animate-pulse">
                {doctorStats.pendientesEspera}
              </Badge>
            )}
          </button>

          {/* Mi Agenda */}
          <button
            onClick={() => {
              setActiveModule('mi-agenda');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeModule === 'mi-agenda'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-200'
                : 'text-gray-700 hover:bg-cyan-50 hover:text-cyan-700'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Mi Agenda</span>
          </button>

          {/* Mis Citas del Día */}
          <button
            onClick={() => {
              setActiveModule('mis-citas');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeModule === 'mis-citas'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarCheck className="w-5 h-5" />
              <span>Mis Citas del Día</span>
            </div>
            {doctorStats.citasHoy > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs px-2">
                {doctorStats.citasHoy}
              </Badge>
            )}
          </button>

          {/* Mis Pacientes Hospitalizados */}
          <button
            onClick={() => {
              setActiveModule('mis-hospitalizados');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeModule === 'mis-hospitalizados'
                ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-200'
                : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bed className="w-5 h-5" />
              <span>Mis Hospitalizados</span>
            </div>
            {doctorStats.pacientesHospitalizados > 0 && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs px-2">
                {doctorStats.pacientesHospitalizados}
              </Badge>
            )}
          </button>

          {/* Mis Cirugías */}
          <button
            onClick={() => {
              setActiveModule('mis-cirugias');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeModule === 'mis-cirugias'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-200'
                : 'text-gray-700 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Scissors className="w-5 h-5" />
              <span>Mis Cirugías</span>
            </div>
          </button>

          {/* Mis Plantillas */}
          <button
            onClick={() => {
              setActiveModule('plantillas-doctor');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeModule === 'plantillas-doctor'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200'
                : 'text-gray-700 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Mis Plantillas</span>
          </button>

          {/* ÓRDENES Y RESULTADOS */}
          <div className="pt-5 mt-4 border-t border-gray-100">
            <div className="px-3 mb-3">
              <p className="text-xs font-bold text-cyan-600 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-3 h-3" />
                Órdenes y Resultados
              </p>
            </div>

            {/* Órdenes Médicas */}
            <button
              onClick={() => {
                setActiveModule('ordenes-medicas');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'ordenes-medicas'
                  ? 'bg-cyan-100 text-cyan-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Órdenes Médicas</span>
            </button>
          </div>

          {/* HISTORIA CLÍNICA */}
          <div className="pt-5 mt-4 border-t border-gray-100">
            <div className="px-3 mb-3">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                <FolderOpen className="w-3 h-3" />
                Historia Clínica
              </p>
            </div>

            {/* HCE */}
            <button
              onClick={() => {
                setActiveModule('hce');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'hce'
                  ? 'bg-indigo-100 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>HCE (Buscar Paciente)</span>
            </button>

            {/* Asistente IA */}
            <button
              onClick={() => {
                setActiveModule('asistente-ia');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'asistente-ia'
                  ? 'bg-violet-100 text-violet-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Asistente IA</span>
            </button>
          </div>

          {/* OTROS */}
          <div className="pt-5 mt-4 border-t border-gray-100">
            <div className="px-3 mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Otros
              </p>
            </div>

            {/* Publicaciones */}
            <button
              onClick={() => {
                setActiveModule('publicaciones');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'publicaciones'
                  ? 'bg-gray-100 text-gray-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Publicaciones</span>
            </button>

            {/* Reportes */}
            <button
              onClick={() => {
                setActiveModule('reportes');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'reportes'
                  ? 'bg-gray-100 text-gray-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Mis Reportes</span>
            </button>

            {/* Configuración */}
            <button
              onClick={() => {
                setActiveModule('configuracion-doctor');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeModule === 'configuracion-doctor'
                  ? 'bg-gray-100 text-gray-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configuración</span>
            </button>
          </div>
        </div>
      </nav>
    );
  };

  // Mostrar un loader mientras se cargan los permisos
  if (loadingPermissions) {
    return (
      <aside className="hidden md:block md:fixed md:left-0 md:top-0 md:h-screen w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando permisos...</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200"
      >
        {isOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-100 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 shadow-xl md:shadow-none overflow-y-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Clínica Mía
              </div>
            </div>
            
            {/* User Profile */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              userRole === 'doctor'
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100'
            }`}>
              <Avatar className={`h-12 w-12 border-2 border-white shadow-sm ${
                userRole === 'doctor' && !doctorProfile.foto
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  : !doctorProfile.foto ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : ''
              }`}>
                {userRole === 'doctor' && doctorProfile.foto ? (
                  <AvatarImage src={doctorProfile.foto} alt={`Dr. ${user.nombre}`} className="object-cover" />
                ) : null}
                <AvatarFallback className="text-white font-semibold text-sm">
                  {user.nombre?.[0]}{user.apellido?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userRole === 'doctor' ? `Dr(a). ${user.nombre} ${user.apellido}` : `${user.nombre} ${user.apellido}`}
                </p>
                <p className={`text-xs truncate ${userRole === 'doctor' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                  {userRole === 'doctor'
                    ? (doctorProfile.especialidadPrincipal || 'Médico General')
                    : user.rol}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation - Render doctor-specific or general sidebar */}
          {userRole === 'doctor' ? (
            renderDoctorSidebar()
          ) : (
            <nav className="flex-1 py-4 px-3">
              <div className="space-y-1">
                {/* GESTIÓN PRINCIPAL */}
                <div className="px-3 mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gestión Principal</p>
                </div>

                {hasAccess('dashboard') && (
                  <button
                    onClick={() => {
                      setActiveModule('dashboard');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'dashboard'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Panel</span>
                  </button>
                )}
              
              {hasAccess('admisiones') && (
                <button
                  onClick={() => {
                    setActiveModule('admisiones');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeModule === 'admisiones'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Admisiones</span>
                </button>
              )}

              {/* Doctores */}
              {(hasAccess('doctores') || hasAccess('especialidades') || hasAccess('departamentos')) && (
                <>
                  <button
                    onClick={() => setIsDoctoresOpen(!isDoctoresOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Stethoscope className="w-4 h-4" />
                      <span>Doctores</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDoctoresOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isDoctoresOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                      {hasAccess('doctores') && (
                        <button
                          onClick={() => {
                            setActiveModule('doctores');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'doctores'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Doctores</span>
                        </button>
                      )}
                      {hasAccess('especialidades') && (
                        <button
                          onClick={() => {
                            setActiveModule('especialidades');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'especialidades'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Especialidades</span>
                        </button>
                      )}
                      {hasAccess('departamentos') && (
                        <button
                          onClick={() => {
                            setActiveModule('departamentos');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'departamentos'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Departamentos</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Ocultar Pacientes para rol doctor - solo admisiones/recepcionistas pueden crear pacientes */}
              {hasAccess('pacientes') && userRole !== 'doctor' && (
                <button
                  onClick={() => {
                    setActiveModule('pacientes');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeModule === 'pacientes'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Pacientes</span>
                </button>
              )}

              {/* Ocultar Citas para rol doctor - doctores usan su panel específico */}
              {hasAccess('citas') && userRole !== 'doctor' && (
                <button
                  onClick={() => {
                    setActiveModule('citas');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeModule === 'citas'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agenda/Citas</span>
                </button>
              )}

              {/* Exámenes */}
              {(hasAccess('examenes') || hasAccess('categorias-examenes')) && (
                <>
                  <button
                    onClick={() => setIsExamenesOpen(!isExamenesOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Beaker className="w-4 h-4" />
                      <span>Exámenes</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExamenesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExamenesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                      {hasAccess('examenes') && (
                        <button
                          onClick={() => {
                            setActiveModule('examenes');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'examenes'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Todos</span>
                        </button>
                      )}
                      {hasAccess('categorias-examenes') && (
                        <button
                          onClick={() => {
                            setActiveModule('categorias-examenes');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'categorias-examenes'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Categorías</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ATENCIÓN MÉDICA */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="px-3 mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Atención Médica</p>
                </div>

                {hasAccess('hce') && (
                  <button
                    onClick={() => {
                      setActiveModule('hce');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'hce'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Historia Clínica (HCE)</span>
                  </button>
                )}

                {hasAccess('enfermeria') && (
                  <button
                    onClick={() => {
                      setActiveModule('enfermeria');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'enfermeria'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Panel de Enfermería</span>
                  </button>
                )}

                {/* Plantillas (Solo Doctores) */}
                {userRole === 'doctor' && (
                  <button
                    onClick={() => {
                      setActiveModule('plantillas-doctor');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'plantillas-doctor'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Mis Plantillas</span>
                  </button>
                )}

                {/* Farmacia Hospitalaria (Interna) */}
                {(hasAccess('farmacia') || userRole === 'superadmin') && (
                  <button
                    onClick={() => {
                      setActiveModule('farmacia');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'farmacia' || activeModule === 'farmacia-hospitalaria'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Pill className="w-4 h-4" />
                    <span>Farmacia Hospitalaria</span>
                  </button>
                )}

                {/* Droguería - Venta al Público */}
                {(hasAccess('drogueria') || hasAccess('ordenes-tienda') || userRole === 'superadmin') && (
                  <button
                    onClick={() => {
                      setActiveModule('drogueria');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'drogueria' || activeModule === 'ordenes-tienda'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Droguería (Ventas)</span>
                  </button>
                )}

                {hasAccess('laboratorio') && (
                  <button
                    onClick={() => {
                      setActiveModule('laboratorio');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'laboratorio'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Beaker className="w-4 h-4" />
                    <span>Laboratorio</span>
                  </button>
                )}

                {hasAccess('imagenologia') && (
                  <button
                    onClick={() => {
                      setActiveModule('imagenologia');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'imagenologia'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Scan className="w-4 h-4" />
                    <span>Imagenología</span>
                  </button>
                )}

                {hasAccess('urgencias') && (
                  <button
                    onClick={() => {
                      setActiveModule('urgencias');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'urgencias'
                        ? 'bg-gradient-to-r from-red-600 to-orange-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Urgencias</span>
                  </button>
                )}

                {/* Hospitalización */}
                {(hasAccess('hospitalizacion') || hasAccess('unidades') || hasAccess('habitaciones') || hasAccess('camas')) && (
                  <>
                    <button
                      onClick={() => setIsHospitalizacionOpen(!isHospitalizacionOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4" />
                        <span>Hospitalización</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isHospitalizacionOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isHospitalizacionOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                        <button
                          onClick={() => {
                            setActiveModule('admisiones-hospitalizacion');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'admisiones-hospitalizacion'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Admisiones</span>
                        </button>
                        {hasAccess('hospitalizacion') && (
                          <button
                            onClick={() => {
                              setActiveModule('hospitalizacion');
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              activeModule === 'hospitalizacion'
                                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                            <span>Mapa de Camas</span>
                          </button>
                        )}
                        {hasAccess('unidades') && (
                          <button
                            onClick={() => {
                              setActiveModule('unidades');
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              activeModule === 'unidades'
                                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                            <span>Unidades</span>
                          </button>
                        )}
                        {hasAccess('habitaciones') && (
                          <button
                            onClick={() => {
                              setActiveModule('habitaciones');
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              activeModule === 'habitaciones'
                                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                            <span>Habitaciones</span>
                          </button>
                        )}
                        {hasAccess('camas') && (
                          <button
                            onClick={() => {
                              setActiveModule('camas');
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              activeModule === 'camas'
                                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                            <span>Camas</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {hasAccess('quirofano') && (
                  <button
                    onClick={() => {
                      setActiveModule('quirofano');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'quirofano'
                        ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Scissors className="w-4 h-4" />
                    <span>Quirófano</span>
                  </button>
                )}

                {/* Publicaciones */}
                {(hasAccess('publicaciones') || hasAccess('categorias-publicaciones')) && (
                  <>
                    <button
                      onClick={() => setIsPublicacionesOpen(!isPublicacionesOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Megaphone className="w-4 h-4" />
                        <span>Publicaciones</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isPublicacionesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isPublicacionesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                        {hasAccess('publicaciones') && (
                          <button
                            onClick={() => {
                              setActiveModule('publicaciones');
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              activeModule === 'publicaciones'
                                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                            <span>Todas</span>
                          </button>
                        )}
                        {hasAccess('categorias-publicaciones') && (
                          <button
                            onClick={() => {
                              setActiveModule('categorias-publicaciones');
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              activeModule === 'categorias-publicaciones'
                                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                            <span>Categorías</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* FINANCIERO Y REPORTES */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="px-3 mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Financiero y Reportes</p>
                </div>

                {hasAccess('facturacion') && (
                  <button
                    onClick={() => {
                      setActiveModule('facturacion');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'facturacion'
                        ? 'bg-gradient-to-r from-amber-600 to-yellow-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Facturación</span>
                  </button>
                )}

                {hasAccess('reportes') && (
                  <button
                    onClick={() => {
                      setActiveModule('reportes');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'reportes'
                        ? 'bg-gradient-to-r from-slate-600 to-gray-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Reportes</span>
                  </button>
                )}

                              </div>

              {/* CONTABILIDAD */}
              {(hasAccess('contabilidad') || userRole === 'superadmin' || userRole === 'admin') && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="px-3 mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contabilidad</p>
                  </div>

                  {/* Contabilidad Principal */}
                  <button
                    onClick={() => {
                      setActiveModule('contabilidad');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'contabilidad'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Contabilidad</span>
                  </button>

                  {/* Dashboard Financiero */}
                  <button
                    onClick={() => {
                      setActiveModule('dashboard-financiero');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'dashboard-financiero'
                        ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Dashboard Financiero</span>
                  </button>

                  {/* Activos Fijos */}
                  <button
                    onClick={() => {
                      setActiveModule('activos-fijos');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'activos-fijos'
                        ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Activos Fijos</span>
                  </button>

                  {/* Bancos */}
                  <button
                    onClick={() => {
                      setActiveModule('bancos');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'bancos'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                    <span>Bancos</span>
                  </button>

                  {/* Compras */}
                  <button
                    onClick={() => {
                      setActiveModule('compras');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'compras'
                        ? 'bg-gradient-to-r from-orange-600 to-amber-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Compras</span>
                  </button>
                </div>
              )}

              {/* CALIDAD */}
              {hasAccess('calidad') && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="px-3 mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gestión de Calidad</p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveModule('calidad');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'calidad'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Sistema de Calidad</span>
                  </button>

                  {/* Calidad 2.0 */}
                  <button
                    onClick={() => setIsCalidad2Open(!isCalidad2Open)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4" />
                      <span>Calidad 2.0</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCalidad2Open ? 'rotate-180' : ''}`} />
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isCalidad2Open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                      <button
                        onClick={() => {
                          setActiveModule('calidad2-inscripcion');
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeModule === 'calidad2-inscripcion'
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                        <span>Docs Inscripcion</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveModule('calidad2-talento');
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeModule === 'calidad2-talento'
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                        <span>Talento Humano</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveModule('calidad2-infraestructura');
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeModule === 'calidad2-infraestructura'
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                        <span>Infraestructura</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveModule('calidad2-medicamentos');
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeModule === 'calidad2-medicamentos'
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                        <span>Medicamentos y Dispositivos</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveModule('calidad2-procesos-prioritarios');
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeModule === 'calidad2-procesos-prioritarios'
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                        <span>Procesos Prioritarios</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveModule('calidad2-historia-clinica');
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeModule === 'calidad2-historia-clinica'
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                        <span>Historia Clínica</span>
                      </button>
                      {userRole === 'superadmin' && (
                        <button
                          onClick={() => {
                            setActiveModule('calidad2-checklists');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'calidad2-checklists'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Config. Checklists</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PROGRAMA MÍA PASS */}
              {(hasAccess('planes-miapass') || hasAccess('suscripciones-miapass') || hasAccess('suscriptores-miapass') || hasAccess('cupones-miapass') || hasAccess('formularios-miapass')) && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="px-3 mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Programa Mía Pass</p>
                  </div>
                  
                  <button
                    onClick={() => setIsMiaPassOpen(!isMiaPassOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4" />
                      <span>Mía Pass</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMiaPassOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isMiaPassOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                      {/* Planes */}
                      {hasAccess('planes-miapass') && (
                        <button
                          onClick={() => {
                            setActiveModule('planes-miapass');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'planes-miapass'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Planes</span>
                        </button>
                      )}
                      
                      {/* Suscripciones */}
                      {hasAccess('suscripciones-miapass') && (
                        <button
                          onClick={() => {
                            setActiveModule('suscripciones-miapass');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'suscripciones-miapass'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Suscripciones</span>
                        </button>
                      )}
                      
                      {/* Suscriptores */}
                      {hasAccess('suscriptores-miapass') && (
                        <button
                          onClick={() => {
                            setActiveModule('suscriptores-miapass');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'suscriptores-miapass'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Suscriptores</span>
                        </button>
                      )}
                      
                      {/* Cupones */}
                      {hasAccess('cupones-miapass') && (
                        <button
                          onClick={() => {
                            setActiveModule('cupones-miapass');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'cupones-miapass'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Cupones</span>
                        </button>
                      )}

                      {/* Formularios de Contacto */}
                      {hasAccess('formularios-miapass') && (
                        <button
                          onClick={() => {
                            setActiveModule('formularios-miapass');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'formularios-miapass'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Formularios</span>
                        </button>
                      )}

                      {/* Comisiones (Mis Ventas) */}
                      {(hasAccess('comisiones-miapass') || userRole === 'superadmin') && (
                        <button
                          onClick={() => {
                            setActiveModule('comisiones-miapass');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'comisiones-miapass'
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Mis Comisiones</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ATENCIÓN Y SOPORTE */}
              {hasAccess('tickets-soporte') && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="px-3 mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Atención y Soporte</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setActiveModule('tickets-soporte');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'tickets-soporte'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Tickets de Soporte</span>
                  </button>
                </div>
              )}

              {/* CONTENIDO Y COMUNICACIÓN */}
              {hasAccess('publicaciones') && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="px-3 mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contenido y Comunicación</p>
                  </div>
                  
                  <button
                    onClick={() => setIsPublicacionesOpen(!isPublicacionesOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="w-4 h-4" />
                      <span>Publicaciones</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isPublicacionesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isPublicacionesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                      <button
                        onClick={() => {
                          setActiveModule('post-todas');
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeModule === 'post-todas'
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                        <span>Todas</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveModule('post-categorias');
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeModule === 'post-categorias'
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                        <span>Categorías</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TALENTO HUMANO */}
              {(hasAccess('talento-humano') || hasAccess('sst')) && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="px-3 mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Talento Humano</p>
                  </div>

                  <button
                    onClick={() => setIsTalentoHumanoOpen(!isTalentoHumanoOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <UserCog className="w-4 h-4" />
                      <span>Gestion de Personal</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isTalentoHumanoOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isTalentoHumanoOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                      {/* Gestion RRHH */}
                      {hasAccess('talento-humano') && (
                        <button
                          onClick={() => {
                            setActiveModule('rrhh');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'rrhh'
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>Gestion RRHH</span>
                        </button>
                      )}

                      {/* SST - Seguridad y Salud en el Trabajo */}
                      {hasAccess('sst') && (
                        <button
                          onClick={() => {
                            setActiveModule('sst');
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            activeModule === 'sst'
                              ? 'bg-orange-50 text-orange-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                          <span>SST</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CONFIGURACIÓN */}
              {hasAccess('usuarios-roles') && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="px-3 mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Configuración</p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveModule('usuarios-roles');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === 'usuarios-roles'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Usuarios y Roles</span>
                  </button>

                  {/* Configuración Siigo - Solo superadmin */}
                  {userRole === 'superadmin' && (
                    <button
                      onClick={() => {
                        setActiveModule('siigo-config');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeModule === 'siigo-config'
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Cloud className="w-4 h-4" />
                      <span>Configuración Siigo</span>
                    </button>
                  )}

                  {/* Solicitudes Historia Clínica - Admin/Superadmin */}
                  {(userRole === 'superadmin' || userRole === 'admin') && (
                    <button
                      onClick={() => {
                        setActiveModule('solicitudes-hc');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeModule === 'solicitudes-hc'
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Solicitudes HC</span>
                    </button>
                  )}

                  {/* Tipos de Usuario y Convenios - Admin/Superadmin */}
                  {(userRole === 'superadmin' || userRole === 'admin') && (
                    <button
                      onClick={() => {
                        setActiveModule('tipos-usuario-convenio');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeModule === 'tipos-usuario-convenio'
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Tipos Usuario</span>
                    </button>
                  )}
                </div>
              )}

              {/* FORMULARIOS MIA PASS */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setActiveModule('formularios-miapass');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeModule === 'formularios-miapass'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Formularios MiaPass</span>
                </button>
              </div>
            </div>
          </nav>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <Button
              variant="outline"
              className="w-full gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
