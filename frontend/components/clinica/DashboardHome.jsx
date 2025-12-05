'use client';

import { useEffect, useState } from 'react';
import { Users, Calendar, Activity, TrendingUp, UserPlus, CalendarCheck, Building2, Stethoscope } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardHome({ user }) {
  const [stats, setStats] = useState({
    totalPacientes: 0,
    citasHoy: 0,
    citasPendientes: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      const pacientesRes = await fetch(`${apiUrl}/pacientes?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pacientesData = await pacientesRes.json();
      
      const today = new Date().toISOString().split('T')[0];
      const citasRes = await fetch(`${apiUrl}/citas?fecha=${today}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const citasData = await citasRes.json();
      
      setStats({
        totalPacientes: pacientesData.pagination?.total || 0,
        citasHoy: citasData.data?.length || 0,
        citasPendientes: citasData.data?.filter(c => c.estado === 'Programada' || c.estado === 'Confirmada').length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Pacientes',
      value: stats.totalPacientes,
      icon: Users,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100'
    },
    {
      title: 'Citas de Hoy',
      value: stats.citasHoy,
      icon: Calendar,
      color: 'teal',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-100'
    },
    {
      title: 'Citas Pendientes',
      value: stats.citasPendientes,
      icon: CalendarCheck,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100'
    },
    {
      title: 'Tasa Ocupación',
      value: '85%',
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-100'
    },
  ];

  return (
    <div className="p-6 lg:p-8 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenido, {user.nombre}
        </h1>
        <p className="text-gray-600">
          Resumen general del sistema de Clínica Mía
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`border ${stat.borderColor} shadow-sm hover:shadow-md transition-shadow`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Acciones Rápidas</h3>
                <p className="text-sm text-gray-600">Tareas frecuentes del sistema</p>
              </div>
            </div>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors text-left group">
                <UserPlus className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Registrar Nuevo Paciente</p>
                  <p className="text-xs text-gray-500">Agregar paciente al sistema</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors text-left group">
                <Calendar className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Agendar Cita</p>
                  <p className="text-xs text-gray-500">Programar nueva cita médica</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors text-left group">
                <Stethoscope className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Agregar Doctor</p>
                  <p className="text-xs text-gray-500">Registrar nuevo doctor</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Resumen del Sistema</h3>
                <p className="text-sm text-gray-600">Información general</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Departamentos</span>
                </div>
                <span className="text-sm font-bold text-gray-900">5</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Especialidades</span>
                </div>
                <span className="text-sm font-bold text-gray-900">12</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Doctores</span>
                </div>
                <span className="text-sm font-bold text-gray-900">8</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
