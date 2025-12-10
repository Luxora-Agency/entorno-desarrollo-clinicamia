'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, CheckCircle, XCircle, 
  AlertCircle, UserCheck, Users, ClipboardList,
  Search, Phone, Mail, MapPin, Eye, UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function DashboardRecepcionista({ user }) {
  const [citasHoy, setCitasHoy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    programadas: 0,
    enEspera: 0,
    completadas: 0,
    noAsistio: 0,
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
      
      // Cargar todas las citas de hoy
      const response = await fetch(`${apiUrl}/citas?fecha=${hoy}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      const citas = data.data || [];
      
      setCitasHoy(citas);
      
      // Calcular estadísticas
      setStats({
        programadas: citas.filter(c => c.estado === 'Programada').length,
        enEspera: citas.filter(c => c.estado === 'EnEspera').length,
        completadas: citas.filter(c => c.estado === 'Completada').length,
        noAsistio: citas.filter(c => c.estado === 'NoAsistio').length,
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

  const getEstadoBadge = (estado) => {
    const estilos = {
      Programada: 'bg-blue-100 text-blue-700 border-blue-300',
      EnEspera: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      Atendiendo: 'bg-green-100 text-green-700 border-green-300',
      Completada: 'bg-gray-100 text-gray-700 border-gray-300',
      NoAsistio: 'bg-red-100 text-red-700 border-red-300',
    };
    
    const labels = {
      Programada: 'Programada',
      EnEspera: 'En Espera',
      Atendiendo: 'Atendiendo',
      Completada: 'Completada',
      NoAsistio: 'No Asistió',
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

  const citasFiltradas = citasHoy.filter(cita => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      cita.paciente?.nombre?.toLowerCase().includes(search) ||
      cita.paciente?.apellido?.toLowerCase().includes(search) ||
      cita.paciente?.cedula?.includes(search) ||
      cita.doctor?.nombre?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <ClipboardList className="h-8 w-8 text-emerald-600" />
          Bienvenida, {user?.nombre} {user?.apellido}
        </h1>
        <p className="text-gray-600">Panel de Recepción - {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Hoy</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Calendar className="h-10 w-10 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Programadas</p>
                <p className="text-3xl font-bold text-blue-600">{stats.programadas}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-500" />
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
              <UserCheck className="h-10 w-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completadas</p>
                <p className="text-3xl font-bold text-green-600">{stats.completadas}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">No Asistieron</p>
                <p className="text-3xl font-bold text-red-600">{stats.noAsistio}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Citas */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Citas del Día
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar paciente o doctor..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {citasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'No se encontraron citas' : 'No hay citas programadas para hoy'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {citasFiltradas
                    .sort((a, b) => a.hora.localeCompare(b.hora))
                    .map((cita) => (
                      <TableRow key={cita.id} className={
                        cita.estado === 'EnEspera' ? 'bg-yellow-50' : 
                        cita.estado === 'Atendiendo' ? 'bg-green-50' : ''
                      }>
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
                              {cita.paciente?.telefono && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {cita.paciente.telefono}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">Dr. {cita.doctor?.nombre} {cita.doctor?.apellido}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{cita.especialidad?.nombre}</p>
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
                            {/* Pasar a En Espera */}
                            {cita.estado === 'Programada' && (
                              <Button
                                size="sm"
                                onClick={() => cambiarEstado(cita.id, 'EnEspera')}
                                className="gap-1 bg-yellow-600 hover:bg-yellow-700"
                              >
                                <UserCheck className="h-4 w-4" />
                                En Espera
                              </Button>
                            )}

                            {/* Ver Paciente */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `/?module=pacientes&id=${cita.pacienteId}`}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Ver
                            </Button>

                            {/* Marcar No Asistió */}
                            {(cita.estado === 'Programada' || cita.estado === 'EnEspera') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cambiarEstado(cita.id, 'NoAsistio')}
                                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4" />
                                No Asistió
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/?module=admisiones'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-xl">
                <ClipboardList className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Admisiones</p>
                <p className="text-sm text-gray-600">Registrar llegada</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/?module=pacientes'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Pacientes</p>
                <p className="text-sm text-gray-600">Gestionar pacientes</p>
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
                <p className="font-semibold text-gray-900">Agendar Cita</p>
                <p className="text-sm text-gray-600">Nueva cita</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/?module=pacientes&action=new'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-xl">
                <UserPlus className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Nuevo Paciente</p>
                <p className="text-sm text-gray-600">Registrar paciente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
