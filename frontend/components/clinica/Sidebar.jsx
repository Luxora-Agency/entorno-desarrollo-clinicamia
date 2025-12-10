'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, Users, Calendar, X, Menu, Building2, ChevronDown, LogOut, 
  Stethoscope, ClipboardList, Beaker, Pill, FolderOpen, Tags, ShoppingCart,
  CreditCard, UserCheck, Ticket, Megaphone, FileText, Mail, Settings,
  FileText as OrderIcon, Activity, Building as Hospital, Bed, MapPin as Map, DoorOpen, ArrowRightLeft,
  UserMinus, BarChart3, Scan, Receipt, Scissors
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function Sidebar({ user, activeModule, setActiveModule, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  // Configuración de permisos por rol
  const userRole = (user?.rol || 'Admin').toLowerCase();
  
  const rolePermissions = {
    admin: ['*'], // Acceso a todo
    'super_admin': ['*'],
    doctor: ['dashboard', 'pacientes', 'hce', 'citas', 'enfermeria', 'laboratorio', 'imagenologia'],
    recepcionista: ['dashboard', 'admisiones', 'pacientes', 'citas'],
    enfermera: ['dashboard', 'pacientes', 'hce', 'enfermeria', 'hospitalizacion'],
    pharmacist: ['dashboard', 'farmacia', 'pacientes'],
    lab_technician: ['dashboard', 'laboratorio', 'pacientes'],
  };

  const hasAccess = (module) => {
    const permissions = rolePermissions[userRole] || [];
    return permissions.includes('*') || permissions.includes(module);
  };

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
        } md:translate-x-0 shadow-xl md:shadow-none`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src="/clinica-mia-logo.png" 
                alt="Clínica Mía" 
                className="h-10 w-auto"
              />
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
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {/* Panel - Todos tienen acceso */}
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

              {hasAccess('farmacia') && (
                <button
                  onClick={() => {
                    setActiveModule('farmacia');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeModule === 'farmacia'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Pill className="w-4 h-4" />
                  <span>Farmacia</span>
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

              {hasAccess('hospitalizacion') && (
                <button
                  onClick={() => {
                    setActiveModule('hospitalizacion');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeModule === 'hospitalizacion'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Mapa Hospitalización</span>
                </button>
              )}

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
