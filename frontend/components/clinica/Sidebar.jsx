'use client';

import { LayoutDashboard, Users, Calendar, LogOut, ChevronRight, Building2, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Sidebar({ user, activeModule, setActiveModule, onLogout }) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
    { id: 'pacientes', icon: Users, label: 'Pacientes' },
    { id: 'citas', icon: Calendar, label: 'Agenda De Consulta' },
  ];

  const getInitials = (nombre, apellido) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
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
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${
                  isActive ? 'text-teal-600' : 'text-gray-500'
                }`} />
                <span className="flex-1 text-left text-sm">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-teal-600" />}
              </button>
            );
          })}

          {/* Acordeón de Departamentos */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="departamentos" className="border-0">
              <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700">Departamentos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0 pt-1 pl-4">
                <button
                  onClick={() => setActiveModule('especialidades')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                    activeModule === 'especialidades'
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Especialidades
                  {activeModule === 'especialidades' && <ChevronRight className="w-4 h-4 text-teal-600 ml-auto" />}
                </button>
                <button
                  onClick={() => setActiveModule('departamentos')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                    activeModule === 'departamentos'
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Agregar Departamento
                  {activeModule === 'departamentos' && <ChevronRight className="w-4 h-4 text-teal-600 ml-auto" />}
                </button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
  );
}
