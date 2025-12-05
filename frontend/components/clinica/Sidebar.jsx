'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, Users, Calendar, X, Menu, Building2, ChevronDown, LogOut, 
  Stethoscope, ClipboardList, Beaker, Pill, FolderOpen, Tags, ShoppingCart,
  CreditCard, UserCheck, Ticket, Megaphone, FileText, Mail, Settings,
  FileText as OrderIcon, Activity, Building as Hospital, Bed, MapPin as Map, DoorOpen, ArrowRightLeft,
  UserMinus, BarChart3
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function Sidebar({ user, activeModule, setActiveModule, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDepartamentosOpen, setIsDepartamentosOpen] = useState(false);
  const [isDoctoresOpen, setIsDoctoresOpen] = useState(false);
  const [isExamenesOpen, setIsExamenesOpen] = useState(false);
  const [isHospitalizacionOpen, setIsHospitalizacionOpen] = useState(false);
  const [isFarmaciaOpen, setIsFarmaciaOpen] = useState(false);
  const [isPublicacionesOpen, setIsPublicacionesOpen] = useState(false);

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
              {/* Panel y Admisiones - sin sección */}
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

              {/* GESTIÓN MÉDICA */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="px-3 mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gestión Médica</p>
                </div>
                
                {/* Departamentos */}
                <button
                  onClick={() => setIsDepartamentosOpen(!isDepartamentosOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4" />
                    <span>Departamentos</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDepartamentosOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isDepartamentosOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
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
                      <span>Ver Departamentos</span>
                    </button>
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
                      <span>Ver Especialidades</span>
                    </button>
                  </div>
                </div>

                {/* Doctores */}
                <button
                  onClick={() => setIsDoctoresOpen(!isDoctoresOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all mt-1"
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
                      <span>Ver Doctores</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveModule('agregar-doctor');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'agregar-doctor'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Agregar Doctor</span>
                    </button>
                  </div>
                </div>

                {/* Pacientes - sin sub-items */}
                <button
                  onClick={() => {
                    setActiveModule('pacientes');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all mt-1 ${
                    activeModule === 'pacientes'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Pacientes</span>
                </button>

                {/* Agenda de Consulta - sin sub-items */}
                <button
                  onClick={() => {
                    setActiveModule('citas');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all mt-1 ${
                    activeModule === 'citas'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agenda de Consulta</span>
                </button>

                {/* Exámenes y Procedimientos */}
                <button
                  onClick={() => setIsExamenesOpen(!isExamenesOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all mt-1"
                >
                  <div className="flex items-center gap-3">
                    <Beaker className="w-4 h-4" />
                    <span>Exámenes y Procedimientos</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExamenesOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExamenesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
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
                  </div>
                </div>

                {/* Órdenes Médicas - sin sub-items */}
                <button
                  onClick={() => {
                    setActiveModule('ordenes-medicas');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all mt-1 ${
                    activeModule === 'ordenes-medicas'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <OrderIcon className="w-4 h-4" />
                  <span>Órdenes Médicas</span>
                </button>

                {/* Historia Clínica - sin sub-items */}
                <button
                  onClick={() => {
                    setActiveModule('historia-clinica');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all mt-1 ${
                    activeModule === 'historia-clinica'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Historia Clínica</span>
                </button>

                {/* Hospitalización - con sub-items */}
                <button
                  onClick={() => setIsHospitalizacionOpen(!isHospitalizacionOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all mt-1"
                >
                  <div className="flex items-center gap-3">
                    <Hospital className="w-4 h-4" />
                    <span>Hospitalización</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isHospitalizacionOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isHospitalizacionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                    <button
                      onClick={() => {
                        setActiveModule('hospitalizacion-dashboard');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'hospitalizacion-dashboard'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveModule('mapa-camas');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'mapa-camas'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Mapa de Camas</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveModule('gestion-camas');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'gestion-camas'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Gestión de Camas</span>
                    </button>
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
                    <button
                      onClick={() => {
                        setActiveModule('movimientos');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'movimientos'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Movimientos</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveModule('altas');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'altas'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Altas</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveModule('reportes-hospitalizacion');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'reportes-hospitalizacion'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Reportes</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* FARMACIA */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="px-3 mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Farmacia</p>
                </div>
                
                <button
                  onClick={() => setIsFarmaciaOpen(!isFarmaciaOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Pill className="w-4 h-4" />
                    <span>Productos</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isFarmaciaOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isFarmaciaOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
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
                      <span>Farmacia</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveModule('categorias-farmacia');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'categorias-farmacia'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Categorías</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveModule('etiquetas-farmacia');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'etiquetas-farmacia'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Etiquetas</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveModule('ordenes-pedidos');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'ordenes-pedidos'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Órdenes y Pedidos</span>
                    </button>
                  </div>
                )}
              </div>

              {/* PROGRAMA MÍA PASS */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="px-3 mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Programa Mía Pass</p>
                </div>
                
                <button
                  onClick={() => {
                    setActiveModule('planes');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeModule === 'planes'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Planes</span>
                </button>

                <button
                  onClick={() => {
                    setActiveModule('suscriptores-pass');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all mt-1 ${
                    activeModule === 'suscriptores-pass'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Suscriptores</span>
                </button>

                <button
                  onClick={() => {
                    setActiveModule('cupones');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all mt-1 ${
                    activeModule === 'cupones'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>Cupones</span>
                </button>

                <button
                  onClick={() => {
                    setActiveModule('talento-medico');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all mt-1 ${
                    activeModule === 'talento-medico'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Talento Médico</span>
                </button>
              </div>

              {/* ATENCIÓN Y SOPORTE */}
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

              {/* CONTENIDO Y COMUNICACIÓN */}
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
                  <ChevronDown className={`w-4 h-4 transition-transform ${isPublicacionesOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isPublicacionesOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-4">
                    <button
                      onClick={() => {
                        setActiveModule('todas-publicaciones');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'todas-publicaciones'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Todas las Publicaciones</span>
                    </button>
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
                    <button
                      onClick={() => {
                        setActiveModule('etiquetas-publicaciones');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'etiquetas-publicaciones'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Etiquetas</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveModule('comentarios');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeModule === 'comentarios'
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      <span>Comentarios</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    setActiveModule('suscriptores-boletin');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all mt-1 ${
                    activeModule === 'suscriptores-boletin'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Suscriptores al Boletín</span>
                </button>
              </div>

              {/* CONFIGURACIÓN */}
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
