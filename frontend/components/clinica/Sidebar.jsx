'use client';

import { useState } from 'react';
import { LayoutDashboard, Users, Calendar, LogOut, ChevronRight, Building2, ChevronDown, Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function Sidebar({ user, activeModule, setActiveModule, onLogout }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
    { id: 'pacientes', icon: Users, label: 'Pacientes' },
    { id: 'citas', icon: Calendar, label: 'Agenda De Consulta' },
  ];

  const getInitials = (nombre, apellido) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`;
  };

  const handleNavigation = (moduleId) => {
    setActiveModule(moduleId);
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        className="md:hidden fixed top-4 left-4 z-50 bg-teal-500 hover:bg-teal-600"
        size="icon"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-gray-200 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center">
            <img
              src="/clinica-mia-logo.png"
              alt="Clínica Mía Logo"
              className="h-12 w-auto"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {/* Menu items principales */}
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-teal-600' : 'text-gray-500'
                    }`}
                  />
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 text-teal-600" />}
                </button>
              );
            })}

            {/* Separador */}
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                GESTIÓN MÉDICA
              </p>
            </div>

            {/* Departamentos con acordeón */}
            <div>
              <button
                onClick={() => setIsDeptOpen(!isDeptOpen)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeModule === 'departamentos' || activeModule === 'especialidades'
                    ? 'bg-teal-50 text-teal-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building2
                  className={`w-5 h-5 ${
                    activeModule === 'departamentos' || activeModule === 'especialidades'
                      ? 'text-teal-600'
                      : 'text-gray-500'
                  }`}
                />
                <span className="flex-1 text-left text-sm">Departamentos</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isDeptOpen ? 'rotate-0' : '-rotate-90'
                  } ${
                    activeModule === 'departamentos' || activeModule === 'especialidades'
                      ? 'text-teal-600'
                      : 'text-gray-500'
                  }`}
                />
              </button>

              {/* Sub-items */}
              {isDeptOpen && (
                <div className="mt-1 ml-4 space-y-1">
                  <button
                    onClick={() => handleNavigation('especialidades')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                      activeModule === 'especialidades'
                        ? 'bg-teal-50 text-teal-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      activeModule === 'especialidades' ? 'bg-teal-600' : 'bg-gray-400'
                    }`} />
                    <span className="flex-1 text-left">Especialidades</span>
                    {activeModule === 'especialidades' && (
                      <ChevronRight className="w-4 h-4 text-teal-600" />
                    )}
                  </button>

                  <button
                    onClick={() => handleNavigation('departamentos')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                      activeModule === 'departamentos'
                        ? 'bg-teal-50 text-teal-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      activeModule === 'departamentos' ? 'bg-teal-600' : 'bg-gray-400'
                    }`} />
                    <span className="flex-1 text-left">Agregar Departamento</span>
                    {activeModule === 'departamentos' && (
                      <ChevronRight className="w-4 h-4 text-teal-600" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10 bg-teal-500">
              <AvatarFallback className="bg-teal-500 text-white font-semibold">
                {getInitials(user.nombre, user.apellido)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.nombre} {user.apellido}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.rol}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
