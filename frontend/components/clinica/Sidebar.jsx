'use client';

import { useState } from 'react';
import { LayoutDashboard, Users, Calendar, X, Menu, Building2, ChevronDown, LogOut, UserCog, Stethoscope } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function Sidebar({ user, activeModule, setActiveModule, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGestionMedicaOpen, setIsGestionMedicaOpen] = useState(true);
  const [isDoctoresOpen, setIsDoctoresOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pacientes', label: 'Pacientes', icon: Users },
    { id: 'citas', label: 'Citas', icon: Calendar },
  ];

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
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white shadow-sm">
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
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeModule === item.id
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Departamentos Section */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="px-3 mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gestión Médica</p>
                </div>
                
                <button
                  onClick={() => setIsGestionMedicaOpen(!isGestionMedicaOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4" />
                    <span>Departamentos</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isGestionMedicaOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isGestionMedicaOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                    <button
                      onClick={() => {
                        setActiveModule('departamentos');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'departamentos'
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Ver Departamentos</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveModule('especialidades');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'especialidades'
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Ver Especialidades</span>
                    </button>
                  </div>
                )}

                {/* Doctores Section */}
                <button
                  onClick={() => setIsDoctoresOpen(!isDoctoresOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all mt-1"
                >
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-4 h-4" />
                    <span>Doctores</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDoctoresOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDoctoresOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                    <button
                      onClick={() => {
                        setActiveModule('doctores');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'doctores'
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Ver Doctores</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveModule('agregar-doctor');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'agregar-doctor'
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Agregar Doctor</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <Button
              onClick={onLogout}
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-700 hover:bg-red-50 hover:text-red-600 text-sm font-medium"
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
