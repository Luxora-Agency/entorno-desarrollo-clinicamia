'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Activity, CheckCircle, 
  AlertCircle, FileText, Stethoscope, Pill, ClipboardList,
  Eye, Play, CheckCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function DashboardDoctor({ user }) {
  const [citasHoy, setCitasHoy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enEspera: 0,
    atendiendo: 0,
    completadas: 0,
    total: 0,
  });

  useEffect(() => {
    loadCitasHoy();
  }, []);

  const loadCitasHoy = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const hoy = new Date().toISOString().split('T')[0];
      
      // Cargar citas del doctor para hoy
      const response = await fetch(`${apiUrl}/citas?fecha=${hoy}&doctorId=${user.id}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      const citas = data.data || [];
      
      setCitasHoy(citas);
      
      // Calcular estadísticas
      setStats({
        enEspera: citas.filter(c => c.estado === 'EnEspera').length,
        atendiendo: citas.filter(c => c.estado === 'Atendiendo').length,
        completadas: citas.filter(c => c.estado === 'Completada').length,
        total: citas.length,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading citas:', error);
      setLoading(false);
    }
  };

  const cambiarEstado = async (citaId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      await fetch(`${apiUrl}/citas/${citaId}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      
      // Recargar datos
      loadCitasHoy();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const abrirHistoriaClinica = (pacienteId, citaId) => {
    // Navegar al módulo HCE con el paciente seleccionado
    window.location.href = `/?module=hce&pacienteId=${pacienteId}&citaId=${citaId}`;
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      Programada: 'bg-blue-100 text-blue-700 border-blue-300',
      EnEspera: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      Atendiendo: 'bg-green-100 text-green-700 border-green-300',
      Completada: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    
    const labels = {
      Programada: 'Programada',
      EnEspera: 'En Espera',
      Atendiendo: 'Atendiendo',
      Completada: 'Completada',
    };
    
    return (
      <Badge variant="outline" className={estilos[estado] || 'bg-gray-100'}>
        {labels[estado] || estado}
      </Badge>
    );
  };

  const formatHora = (hora) => {
    if (!hora) return '';
    const date = new Date(`1970-01-01T${hora}`);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando consultas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Stethoscope className="h-8 w-8 text-blue-600" />
          Bienvenido, Dr(a). {user?.nombre} {user?.apellido}
        </h1>
        <p className="text-gray-600">Panel de Consultas - {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Hoy</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En Espera</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.enEspera}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Atendiendo</p>
                <p className="text-3xl font-bold text-green-600">{stats.atendiendo}</p>
              </div>
              <Activity className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completadas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completadas}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pacientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Mis Pacientes de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {citasHoy.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No tienes consultas programadas para hoy</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {citasHoy
                    .sort((a, b) => a.hora.localeCompare(b.hora))
                    .map((cita) => (
                      <TableRow key={cita.id} className={cita.estado === 'Atendiendo' ? 'bg-green-50' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            {formatHora(cita.hora)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="font-medium">{cita.paciente?.nombre} {cita.paciente?.apellido}</p>
                              <p className="text-xs text-gray-500">{cita.paciente?.cedula}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{cita.motivo}</p>
                          {cita.notas && (
                            <p className="text-xs text-gray-500 mt-1">{cita.notas}</p>
                          )}
                        </TableCell>
                        <TableCell>{getEstadoBadge(cita.estado)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {/* Ver Historia Clínica */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirHistoriaClinica(cita.pacienteId, cita.id)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Ver HCE
                            </Button>

                            {/* Botón de acción según estado */}
                            {cita.estado === 'EnEspera' && (
                              <Button
                                size="sm"
                                onClick={() => cambiarEstado(cita.id, 'Atendiendo')}
                                className="gap-1 bg-green-600 hover:bg-green-700"
                              >
                                <Play className="h-4 w-4" />
                                Atender
                              </Button>
                            )}

                            {cita.estado === 'Atendiendo' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => abrirHistoriaClinica(cita.pacienteId, cita.id)}
                                className="gap-1 bg-blue-600 hover:bg-blue-700"
                              >
                                <FileText className="h-4 w-4" />
                                Continuar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/?module=hce'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Historia Clínica</p>
                <p className="text-sm text-gray-600">Ver historias de pacientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/?module=citas'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Mi Agenda</p>
                <p className="text-sm text-gray-600">Ver todas las citas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/?module=pacientes'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Pacientes</p>
                <p className="text-sm text-gray-600">Buscar pacientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
