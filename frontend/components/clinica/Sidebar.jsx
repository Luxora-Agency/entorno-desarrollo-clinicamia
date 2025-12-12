'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Calendar, X, Menu, Building2, ChevronDown, LogOut, 
  Stethoscope, ClipboardList, Beaker, Pill, Tags, 
  CreditCard, UserCheck, Ticket, Megaphone, FileText, 
  Activity, Bed, Receipt, Scissors, BarChart3, Scan, Settings
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function Sidebar({ user, activeModule, setActiveModule, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDoctoresOpen, setIsDoctoresOpen] = useState(false);
  const [isExamenesOpen, setIsExamenesOpen] = useState(false);
  const [isFarmaciaOpen, setIsFarmaciaOpen] = useState(false);
  const [isHospitalizacionOpen, setIsHospitalizacionOpen] = useState(false);
  const [isMiaPassOpen, setIsMiaPassOpen] = useState(false);
  const [isPublicacionesOpen, setIsPublicacionesOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Configuración de permisos por rol
  const userRole = (user?.rol || 'admin').toLowerCase();

  // Cargar permisos desde la base de datos
  useEffect(() => {
    const cargarPermisos = async () => {
      try {
        const res = await fetch(`/api/roles/permisos/${userRole}`);
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
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
              <Avatar className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-white shadow-sm">
                <AvatarFallback className="text-white font-semibold text-sm">
                  {user.nombre?.[0]}{user.apellido?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.nombre} {user.apellido}
                </p>
                <p className="text-xs text-gray-600 truncate">{user.rol}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
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

              {hasAccess('pacientes') && (
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

              {hasAccess('citas') && (
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

                {/* Farmacia */}
                {(hasAccess('farmacia') || hasAccess('ordenes-medicas') || hasAccess('categorias-productos') || hasAccess('etiquetas-productos')) && (
                  <>
                    <button
                      onClick={() => setIsFarmaciaOpen(!isFarmaciaOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Pill className="w-4 h-4" />
                        <span>Farmacia</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isFarmaciaOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isFarmaciaOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                        {hasAccess('farmacia') && (
                          <button
                            onClick={() => {
                              setActiveModule('farmacia');
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              activeModule === 'farmacia'
                                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                            <span>Inventario</span>
                          </button>
                        )}
                        
                        {/* Órdenes Médicas */}
                        {hasAccess('ordenes-medicas') && (
                          <button
                            onClick={() => {
                              setActiveModule('ordenes-medicas');
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              activeModule === 'ordenes-medicas'
                                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                            <span>Órdenes Médicas</span>
                          </button>
                        )}
                        
                        {hasAccess('categorias-productos') && (
                          <button
                            onClick={() => {
                              setActiveModule('categorias-productos');
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              activeModule === 'categorias-productos'
                                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                            <span>Categorías</span>
                          </button>
                        )}
                        {hasAccess('etiquetas-productos') && (
                          <button
                            onClick={() => {
                              setActiveModule('etiquetas-productos');
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              activeModule === 'etiquetas-productos'
                                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                            <span>Etiquetas</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
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

              {/* PROGRAMA MÍA PASS */}
              {(hasAccess('planes-miapass') || hasAccess('suscripciones-miapass') || hasAccess('suscriptores-miapass') || hasAccess('cupones-miapass')) && (
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
                </div>
              )}
            </div>
          </nav>

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
