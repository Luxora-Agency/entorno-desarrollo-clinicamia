'use client';

import { useState, useEffect } from 'react';
import {
  Users, Briefcase, FileText, Clock, TrendingUp,
  TrendingDown, AlertCircle, Calendar, DollarSign,
  UserPlus, UserMinus, Award, GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import useTalentoHumano from '@/hooks/useTalentoHumano';

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-3">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trendValue}
            </span>
            <span className="text-xs text-gray-400">vs mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertItem({ title, description, type, date }) {
  const typeColors = {
    warning: 'border-orange-500 bg-orange-50',
    danger: 'border-red-500 bg-red-50',
    info: 'border-blue-500 bg-blue-50',
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${typeColors[type]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <span className="text-xs text-gray-400">{date}</span>
      </div>
    </div>
  );
}

export default function DashboardRRHH({ user }) {
  const {
    dashboardStats, empleados, capacitaciones, eventos, loading,
    fetchDashboardStats, fetchEmpleados, fetchCapacitaciones, fetchEventos
  } = useTalentoHumano();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchDashboardStats();
    setStats(data);
    await fetchEmpleados({ estado: 'ACTIVO' });
    await fetchCapacitaciones({ estado: 'PROGRAMADA' });
    await fetchEventos();
  };

  // Default stats while loading
  const defaultStats = {
    empleados: { total: 0, activos: 0, nuevos: 0, retirados: 0 },
    vacantes: { total: 0, abiertas: 0, enProceso: 0 },
    contratos: { porVencer: 0, vencidos: 0 },
    capacitaciones: { enCurso: 0, programadas: 0 },
    asistencia: { presente: 0, ausente: 0, tardanzas: 0 },
    nomina: { totalMes: 0 },
    distribucion: {},
  };

  const data = stats || defaultStats;

  // Calcular distribucion por tipo de empleado
  const distribucion = empleados.reduce((acc, emp) => {
    const tipo = emp.tipoEmpleado || 'OTROS';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  const distribucionConfig = [
    { tipo: 'MEDICO', label: 'Medico', color: 'bg-blue-500' },
    { tipo: 'ENFERMERIA', label: 'Enfermeria', color: 'bg-green-500' },
    { tipo: 'ADMINISTRATIVO', label: 'Administrativo', color: 'bg-purple-500' },
    { tipo: 'ASISTENCIAL', label: 'Asistencial', color: 'bg-orange-500' },
    { tipo: 'TECNICO', label: 'Tecnico', color: 'bg-cyan-500' },
    { tipo: 'OTROS', label: 'Otros', color: 'bg-gray-500' },
  ];

  // Proximos eventos (capacitaciones y eventos de bienestar)
  const proximosEventos = [
    ...capacitaciones.filter(c => c.fechaInicio && new Date(c.fechaInicio) > new Date()).slice(0, 2).map(c => ({
      tipo: 'CAPACITACION',
      titulo: c.nombre,
      fecha: c.fechaInicio,
      participantes: c._count?.asistentes || 0,
      color: 'blue'
    })),
    ...eventos.filter(e => e.fecha && new Date(e.fecha) > new Date()).slice(0, 2).map(e => ({
      tipo: 'EVENTO',
      titulo: e.titulo,
      fecha: e.fecha,
      participantes: e._count?.asistentes || 0,
      color: e.tipo === 'CELEBRACION' ? 'purple' : 'green'
    }))
  ].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Empleados"
          value={data.empleados?.total || empleados.length || 0}
          subtitle={`${data.empleados?.activos || empleados.filter(e => e.estado === 'ACTIVO').length || 0} activos`}
          icon={Users}
          color="blue"
          trend={data.empleados?.nuevos > 0 ? 'up' : undefined}
          trendValue={data.empleados?.nuevos > 0 ? `+${data.empleados.nuevos}` : undefined}
        />
        <StatCard
          title="Vacantes Abiertas"
          value={data.vacantes?.abiertas || 0}
          subtitle={`${data.vacantes?.enProceso || 0} en proceso`}
          icon={Briefcase}
          color="green"
        />
        <StatCard
          title="Contratos por Vencer"
          value={data.contratos?.porVencer || 0}
          subtitle="Proximos 30 dias"
          icon={FileText}
          color="orange"
        />
        <StatCard
          title="Capacitaciones"
          value={data.capacitaciones?.enCurso || capacitaciones.filter(c => c.estado === 'EN_CURSO').length || 0}
          subtitle={`${data.capacitaciones?.programadas || capacitaciones.filter(c => c.estado === 'PROGRAMADA').length || 0} programadas`}
          icon={GraduationCap}
          color="purple"
        />
      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asistencia del dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Asistencia Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Presentes</span>
                <span className="font-semibold text-green-600">
                  {data.asistencia?.presente || 0}
                </span>
              </div>
              <Progress
                value={empleados.length > 0 ? ((data.asistencia?.presente || 0) / empleados.length) * 100 : 0}
                className="h-2"
              />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{data.asistencia?.ausente || 0}</p>
                  <p className="text-xs text-gray-500">Ausentes</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{data.asistencia?.tardanzas || 0}</p>
                  <p className="text-xs text-gray-500">Tardanzas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Alertas y Recordatorios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.contratos?.porVencer > 0 && (
                <AlertItem
                  type="warning"
                  title={`${data.contratos.porVencer} contratos por vencer`}
                  description="Revisa los contratos que estan proximos a vencer"
                  date="Proximos 30 dias"
                />
              )}
              {(data.capacitaciones?.programadas || capacitaciones.filter(c => c.estado === 'PROGRAMADA').length) > 0 && (
                <AlertItem
                  type="info"
                  title={`${data.capacitaciones?.programadas || capacitaciones.filter(c => c.estado === 'PROGRAMADA').length} capacitaciones programadas`}
                  description="Capacitaciones pendientes de iniciar"
                  date="Este mes"
                />
              )}
              {(data.empleados?.retirados || 0) > 0 && (
                <AlertItem
                  type="danger"
                  title={`${data.empleados.retirados} empleados retirados`}
                  description="Empleados retirados este mes"
                  date="Este mes"
                />
              )}
              {data.vacantes?.abiertas > 0 && (
                <AlertItem
                  type="info"
                  title={`${data.vacantes.abiertas} vacantes abiertas`}
                  description="Posiciones pendientes de cubrir"
                  date="Actualmente"
                />
              )}
              {!data.contratos?.porVencer && !data.capacitaciones?.programadas && !data.vacantes?.abiertas && (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay alertas pendientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tercera fila */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribucion por tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribucion por Tipo de Empleado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distribucionConfig.map(item => {
                const count = distribucion[item.tipo] || data.distribucion?.[item.tipo] || 0;
                const total = empleados.length || data.empleados?.total || 1;
                return (
                  <div key={item.tipo} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="flex-1 text-sm text-gray-600">{item.label}</span>
                    <span className="font-medium">{count}</span>
                    <span className="text-xs text-gray-400 w-12 text-right">
                      {total > 0 ? Math.round((count / total) * 100) : 0}%
                    </span>
                  </div>
                );
              })}
            </div>
            {empleados.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex h-3 rounded-full overflow-hidden">
                  {distribucionConfig.map(item => {
                    const count = distribucion[item.tipo] || 0;
                    const percentage = empleados.length > 0 ? (count / empleados.length) * 100 : 0;
                    if (percentage === 0) return null;
                    return (
                      <div
                        key={item.tipo}
                        className={item.color}
                        style={{ width: `${percentage}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proximos eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Proximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximosEventos.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay eventos proximos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proximosEventos.map((evento, idx) => {
                  const fecha = new Date(evento.fecha);
                  const colorClasses = {
                    blue: { bg: 'bg-blue-100', text: 'text-blue-600', bold: 'text-blue-800' },
                    green: { bg: 'bg-green-100', text: 'text-green-600', bold: 'text-green-800' },
                    purple: { bg: 'bg-purple-100', text: 'text-purple-600', bold: 'text-purple-800' },
                  };
                  const colors = colorClasses[evento.color] || colorClasses.blue;

                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-12 h-12 ${colors.bg} rounded-lg flex flex-col items-center justify-center`}>
                        <span className={`text-xs font-medium ${colors.text}`}>
                          {fecha.toLocaleDateString('es', { month: 'short' }).toUpperCase()}
                        </span>
                        <span className={`text-lg font-bold ${colors.bold}`}>
                          {fecha.getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{evento.titulo}</p>
                          <Badge variant="outline" className="text-xs">
                            {evento.tipo === 'CAPACITACION' ? 'Capacitacion' : 'Evento'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {evento.participantes} {evento.tipo === 'CAPACITACION' ? 'inscritos' : 'confirmados'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
