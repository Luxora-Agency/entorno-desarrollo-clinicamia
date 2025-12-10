'use client';

import { 
  Users, Calendar, Activity, TrendingUp, CalendarCheck, 
  Stethoscope, Pill, AlertCircle, CheckCircle, Clock,
  Scissors, Beaker, DollarSign, FileText, Heart, Bed,
  ClipboardList, UserCheck, ArrowRight, Syringe, User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardDoctor from './DashboardDoctor';
import DashboardRecepcionista from './DashboardRecepcionista';

export default function DashboardHome({ user }) {
  // Determinar el tipo de usuario
  const userRole = (user?.rol || user?.role || 'admin').toLowerCase();

  // Renderizar dashboard según el rol
  if (userRole === 'doctor' || userRole === 'medico') {
    return <DashboardDoctor user={user} />;
  } else if (userRole === 'recepcionista' || userRole === 'receptionist') {
    return <DashboardRecepcionista user={user} />;
  } else if (userRole === 'enfermera' || userRole === 'enfermero' || userRole === 'nurse') {
    return <DashboardEnfermera user={user} />;
  } else {
    return <DashboardAdmin user={user} />;
  }
}

// Dashboard para Administrador
function DashboardAdmin({ user }) {
  const datosOcupacion = [
    { dia: 'Lun', ocupacion: 78 },
    { dia: 'Mar', ocupacion: 82 },
    { dia: 'Mié', ocupacion: 75 },
    { dia: 'Jue', ocupacion: 88 },
    { dia: 'Vie', ocupacion: 85 },
    { dia: 'Sáb', ocupacion: 72 },
    { dia: 'Dom', ocupacion: 68 },
  ];

  const statCards = [
    { title: 'Total Pacientes', value: '1,247', change: '+89 este mes', icon: Users, color: 'blue' },
    { title: 'Ingresos Mes', value: '$24.8M', change: '+12% vs mes anterior', icon: DollarSign, color: 'green' },
    { title: 'Ocupación', value: '78%', change: 'Promedio semanal', icon: Bed, color: 'purple' },
    { title: 'Satisfacción', value: '4.6/5', change: 'Rating promedio', icon: Heart, color: 'pink' },
  ];

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenido, {user?.nombre || 'Administrador'}
        </h1>
        <p className="text-gray-600">Panel de Control Administrativo - Clínica Mía</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`bg-${stat.color}-50 p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ocupación Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={datosOcupacion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ocupacion" fill="#8b5cf6" name="Ocupación %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <UserCheck className="w-4 h-4 mr-2" />
              Admisiones
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Reportes
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="w-4 h-4 mr-2" />
              Facturación
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ClipboardList className="w-4 h-4 mr-2" />
              Auditoría
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Dashboard para Médico
function DashboardMedico({ user }) {
  const citasHoy = [
    { hora: '08:00', paciente: 'María González', motivo: 'Control', estado: 'Completada' },
    { hora: '09:00', paciente: 'Juan Pérez', motivo: 'Consulta General', estado: 'Completada' },
    { hora: '10:00', paciente: 'Laura Rodríguez', motivo: 'Control Prenatal', estado: 'EnCurso' },
    { hora: '11:00', paciente: 'Pedro Martínez', motivo: 'Seguimiento', estado: 'Pendiente' },
    { hora: '14:00', paciente: 'Ana López', motivo: 'Primera Consulta', estado: 'Pendiente' },
  ];

  const statCards = [
    { title: 'Citas Hoy', value: '5', icon: Calendar, color: 'blue' },
    { title: 'Pacientes Atendidos', value: '2', icon: CheckCircle, color: 'green' },
    { title: 'Pendientes', value: '2', icon: Clock, color: 'yellow' },
    { title: 'Cirugías Mes', value: '12', icon: Scissors, color: 'purple' },
  ];

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Completada': return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
      case 'EnCurso': return <Badge className="bg-blue-100 text-blue-800">En Curso</Badge>;
      case 'Pendiente': return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenido, Dr. {user?.nombre || 'Doctor'}
        </h1>
        <p className="text-gray-600">Panel Médico - Clínica Mía</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-l-4 border-l-teal-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-teal-50 p-3 rounded-xl">
                    <Icon className="w-6 h-6 text-teal-600" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Agenda del Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {citasHoy.map((cita, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">{cita.hora}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cita.paciente}</p>
                      <p className="text-xs text-gray-600">{cita.motivo}</p>
                    </div>
                  </div>
                  {getEstadoBadge(cita.estado)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Stethoscope className="w-4 h-4 mr-2" />
              Atender Paciente
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Registrar Evolución
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Pill className="w-4 h-4 mr-2" />
              Prescribir Medicamento
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Beaker className="w-4 h-4 mr-2" />
              Ordenar Laboratorio
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Scissors className="w-4 h-4 mr-2" />
              Programar Cirugía
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Dashboard para Enfermera
function DashboardEnfermera({ user }) {
  const medicamentosHoy = [
    { hora: '08:00', paciente: 'María González', medicamento: 'Paracetamol 500mg', estado: 'Administrado' },
    { hora: '08:30', paciente: 'Juan Pérez', medicamento: 'Omeprazol 20mg', estado: 'Administrado' },
    { hora: '10:00', paciente: 'Laura Rodríguez', medicamento: 'Insulina 10UI', estado: 'Pendiente' },
    { hora: '12:00', paciente: 'Pedro Martínez', medicamento: 'Amoxicilina 500mg', estado: 'Pendiente' },
    { hora: '14:00', paciente: 'Ana López', medicamento: 'Losartán 50mg', estado: 'Pendiente' },
  ];

  const statCards = [
    { title: 'Medicamentos Hoy', value: '5', icon: Pill, color: 'green' },
    { title: 'Administrados', value: '2', icon: CheckCircle, color: 'blue' },
    { title: 'Pendientes', value: '3', icon: Clock, color: 'yellow' },
    { title: 'Pacientes Asignados', value: '8', icon: Users, color: 'purple' },
  ];

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Administrado': return <Badge className="bg-green-100 text-green-800">Administrado</Badge>;
      case 'Pendiente': return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenida, Enf. {user?.nombre || 'Enfermera'}
        </h1>
        <p className="text-gray-600">Panel de Enfermería - Clínica Mía</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-50 p-3 rounded-xl">
                    <Icon className="w-6 h-6 text-green-600" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Administración de Medicamentos Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {medicamentosHoy.map((med, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">{med.hora}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{med.paciente}</p>
                      <p className="text-xs text-gray-600">{med.medicamento}</p>
                    </div>
                  </div>
                  {getEstadoBadge(med.estado)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Syringe className="w-4 h-4 mr-2" />
              Administrar Medicamento
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Activity className="w-4 h-4 mr-2" />
              Registrar Signos Vitales
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ClipboardList className="w-4 h-4 mr-2" />
              Ver Órdenes Médicas
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <AlertCircle className="w-4 h-4 mr-2" />
              Reportar Evento Adverso
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <User className="w-4 h-4 mr-2" />
              Pacientes Asignados
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
