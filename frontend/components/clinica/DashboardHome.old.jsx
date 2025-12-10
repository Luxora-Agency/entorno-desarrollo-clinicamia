'use client';

import { useEffect, useState } from 'react';
import { 
  Users, Calendar, Activity, TrendingUp, CalendarCheck, 
  Stethoscope, Pill, AlertCircle, CheckCircle, Clock,
  Scissors, Beaker, DollarSign, FileText, Heart, Bed,
  ClipboardList, UserCheck, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardHome({ user }) {
  const [stats, setStats] = useState({
    totalPacientes: 1247,
    citasHoy: 24,
    citasPendientes: 12,
  });

  // Determinar el tipo de usuario
  const userRole = user?.rol || user?.role || 'admin';

  // Renderizar dashboard según el rol
  if (userRole === 'medico' || userRole === 'doctor') {
    return <DashboardMedico user={user} />;
  } else if (userRole === 'enfermera' || userRole === 'enfermero') {
    return <DashboardEnfermera user={user} />;
  } else {
    return <DashboardAdmin user={user} stats={stats} />;
  }
}

// Dashboard para Administrador
function DashboardAdmin({ user, stats }) {
  const datosOcupacion = [
    { dia: 'Lun', ocupacion: 78 },
    { dia: 'Mar', ocupacion: 82 },
    { dia: 'Mié', ocupacion: 75 },
    { dia: 'Jue', ocupacion: 88 },
    { dia: 'Vie', ocupacion: 85 },
    { dia: 'Sáb', ocupacion: 72 },
    { dia: 'Dom', ocupacion: 68 },
  ];

  const datosIngresos = [
    { mes: 'Jul', monto: 21.5 },
    { mes: 'Ago', monto: 23.8 },
    { mes: 'Sep', monto: 22.1 },
    { mes: 'Oct', monto: 25.3 },
    { mes: 'Nov', monto: 26.7 },
    { mes: 'Dic', monto: 28.5 },
    { mes: 'Ene', monto: 24.8 },
  ];

  const statCards = [
    {
      title: 'Total Pacientes',
      value: '1,247',
      change: '+89 este mes',
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Ingresos Mes',
      value: '$24.8M',
      change: '+12% vs mes anterior',
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Ocupación',
      value: '78%',
      change: 'Promedio semanal',
      icon: Bed,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Satisfacción',
      value: '4.6/5',
      change: 'Rating promedio',
      icon: Heart,
      color: 'pink',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
    },
  ];

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenido, {user?.nombre || 'Administrador'}
        </h1>
        <p className="text-gray-600">
          Panel de Control Administrativo - Clínica Mía
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`border-l-4 border-l-${stat.color}-500 shadow-sm hover:shadow-md transition-shadow`}>
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
