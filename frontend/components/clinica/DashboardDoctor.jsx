'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Clock, User, Activity, CheckCircle, 
  AlertCircle, FileText, Stethoscope, Pill, ClipboardList,
  Eye, Play, CheckCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Componentes de formulario para consulta
import FormularioSOAPConsulta from './consulta/FormularioSOAPConsulta';
import FormularioSignosVitalesConsulta from './consulta/FormularioSignosVitalesConsulta';
import FormularioDiagnosticoConsulta from './consulta/FormularioDiagnosticoConsulta';
import FormularioAlertasConsulta from './consulta/FormularioAlertasConsulta';
import FormularioProcedimientosExamenesConsulta from './consulta/FormularioProcedimientosExamenesConsulta';
import FormularioPrescripcionesConsulta from './consulta/FormularioPrescripcionesConsulta';

export default function DashboardDoctor({ user }) {
  const { toast } = useToast();
  const getFechaHoy = () => new Date().toISOString().split('T')[0];
  
  const [fechaSeleccionada, setFechaSeleccionada] = useState(getFechaHoy());
  const [citasHoy, setCitasHoy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [citaActual, setCitaActual] = useState(null);
  const [showModalAtencion, setShowModalAtencion] = useState(false);
  const [stats, setStats] = useState({
    enEspera: 0,
    atendiendo: 0,
    completadas: 0,
    total: 0,
  });
  
  // Estado para los datos de la consulta
  const [consultaData, setConsultaData] = useState({
    soap: null,
    vitales: null,
    diagnostico: null,
    alertas: null,
    procedimientos: null,
    prescripciones: null,
  });
  
  const [validacionForms, setValidacionForms] = useState({
    soap: false,
    vitales: true,
    diagnostico: true,
    alertas: true,
    procedimientos: true,
    prescripciones: true,
  });

  const loadCitasHoy = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      console.log('🔍 Cargando citas con:');
      console.log('  - fecha:', fechaSeleccionada);
      console.log('  - doctorId (user.id):', user.id);
      
      if (!user.id) {
        console.log('⚠️ user.id es null, no se pueden cargar citas');
        setLoading(false);
        return;
      }
      
      // Cargar citas del doctor para la fecha seleccionada
      const url = `${apiUrl}/citas?fecha=${fechaSeleccionada}&doctorId=${user.id}&limit=100`;
      console.log('📡 URL citas:', url);
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      console.log('📦 Respuesta citas:', data);
      
      const citas = data.data || [];
      console.log('✅ Total citas:', citas.length);
      
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
      console.error('❌ Error loading citas:', error);
      setLoading(false);
    }
  }, [fechaSeleccionada, user.id]);

  useEffect(() => {
    loadCitasHoy();
  }, [fechaSeleccionada, loadCitasHoy]);

  const cambiarEstado = async (citaId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      
      await fetch(`${apiUrl}/citas/estado/${citaId}`, {
        method: 'POST',
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
    if (!hora) return 'Sin hora';
    try {
      // Si hora es una fecha completa ISO
      if (hora.includes('T')) {
        const date = new Date(hora);
        return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      }
      // Si es solo la hora (HH:MM:SS o HH:MM)
      const [hours, minutes] = hora.split(':');
      return `${hours}:${minutes}`;
    } catch (e) {
      return hora;
    }
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              Bienvenido, Dr(a). {user?.nombre} {user?.apellido}
            </h1>
            <p className="text-gray-600">Panel de Consultas</p>
          </div>
          
          {/* Filtro de Fecha */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
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
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setCitaActual(cita);
                                  setShowModalAtencion(true);
                                }}
                              >
                                Continuar Atención
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

      {/* Modal de Atención - Formularios de Consulta */}
      {showModalAtencion && citaActual && (
        <Dialog open={showModalAtencion} onOpenChange={(open) => {
          if (!open) {
            // Reset al cerrar
            setConsultaData({
              soap: null,
              vitales: null,
              diagnostico: null,
              alertas: null,
              procedimientos: null,
              prescripciones: null,
            });
            setValidacionForms({
              soap: false,
              vitales: true,
              diagnostico: true,
              alertas: true,
              procedimientos: true,
              prescripciones: true,
            });
          }
          setShowModalAtencion(open);
        }}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-blue-600" />
                Atención en Consulta - {citaActual.paciente?.nombre} {citaActual.paciente?.apellido}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Cédula: {citaActual.paciente?.cedula} | Cita: {citaActual.motivo}
              </p>
            </DialogHeader>

            <Tabs defaultValue="soap" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="soap" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  SOAP {!validacionForms.soap && <span className="ml-1 text-red-500">*</span>}
                </TabsTrigger>
                <TabsTrigger value="diagnostico" className="flex items-center gap-1">
                  <ClipboardList className="h-4 w-4" />
                  Diagnóstico
                </TabsTrigger>
                <TabsTrigger value="vitales" className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Vitales
                </TabsTrigger>
                <TabsTrigger value="alertas" className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Alertas
                </TabsTrigger>
                <TabsTrigger value="procedimientos" className="flex items-center gap-1">
                  <Stethoscope className="h-4 w-4" />
                  Procedimientos
                </TabsTrigger>
                <TabsTrigger value="prescripciones" className="flex items-center gap-1">
                  <Pill className="h-4 w-4" />
                  Prescripciones
                </TabsTrigger>
              </TabsList>

              <TabsContent value="soap" className="mt-4">
                <FormularioSOAPConsulta
                  data={consultaData.soap}
                  onChange={(data, isValid) => {
                    setConsultaData({ ...consultaData, soap: data });
                    setValidacionForms({ ...validacionForms, soap: isValid });
                  }}
                />
              </TabsContent>

              <TabsContent value="diagnostico" className="mt-4">
                <FormularioDiagnosticoConsulta
                  data={consultaData.diagnostico}
                  onChange={(data, isValid) => {
                    setConsultaData({ ...consultaData, diagnostico: data });
                    setValidacionForms({ ...validacionForms, diagnostico: isValid });
                  }}
                />
              </TabsContent>

              <TabsContent value="vitales" className="mt-4">
                <FormularioSignosVitalesConsulta
                  data={consultaData.vitales}
                  onChange={(data, isValid) => {
                    setConsultaData({ ...consultaData, vitales: data });
                    setValidacionForms({ ...validacionForms, vitales: isValid });
                  }}
                />
              </TabsContent>

              <TabsContent value="alertas" className="mt-4">
                <FormularioAlertasConsulta
                  data={consultaData.alertas}
                  onChange={(data, isValid) => {
                    setConsultaData({ ...consultaData, alertas: data });
                    setValidacionForms({ ...validacionForms, alertas: isValid });
                  }}
                />
              </TabsContent>

              <TabsContent value="procedimientos" className="mt-4">
                <FormularioProcedimientosExamenesConsulta
                  data={consultaData.procedimientos}
                  onChange={(data, isValid) => {
                    setConsultaData({ ...consultaData, procedimientos: data });
                    setValidacionForms({ ...validacionForms, procedimientos: isValid });
                  }}
                />
              </TabsContent>

              <TabsContent value="prescripciones" className="mt-4">
                <FormularioPrescripcionesConsulta
                  data={consultaData.prescripciones}
                  onChange={(data, isValid) => {
                    setConsultaData({ ...consultaData, prescripciones: data });
                    setValidacionForms({ ...validacionForms, prescripciones: isValid });
                  }}
                />
              </TabsContent>
            </Tabs>

            {/* Botón para Finalizar Consulta */}
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowModalAtencion(false)}
              >
                Cerrar
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!Object.values(validacionForms).every(v => v)}
                onClick={async () => {
                  if (!Object.values(validacionForms).every(v => v)) {
                    toast({ description: '⚠️ Complete todos los campos obligatorios (SOAP) y los formularios que haya iniciado' });
                    return;
                  }
                  
                  if (!confirm('¿Confirmas que deseas finalizar esta consulta?')) {
                    return;
                  }
                  
                  try {
                    const token = localStorage.getItem('token');
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
                    
                    // Enviar todos los datos al endpoint
                    const response = await fetch(`${apiUrl}/consultas/finalizar`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        citaId: citaActual.id,
                        pacienteId: citaActual.pacienteId,
                        doctorId: user.id,
                        ...consultaData,
                      }),
                    });
                    
                    if (response.ok) {
                      toast({ title: 'Éxito', description: ' Consulta finalizada exitosamente' });
                      setShowModalAtencion(false);
                      setCitaActual(null);
                      // Reset
                      setConsultaData({
                        soap: null,
                        vitales: null,
                        diagnostico: null,
                        alertas: null,
                        procedimientos: null,
                        prescripciones: null,
                      });
                      loadCitasHoy();
                    } else {
                      const error = await response.json();
                      alert(`❌ Error: ${error.message || 'No se pudo finalizar la consulta'}`);
                    }
                  } catch (error) {
                    console.error('Error finalizando consulta:', error);
                    toast({ title: 'Error', description: ' Error al finalizar la consulta', variant: 'destructive' });
                  }
                }}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Finalizar Consulta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
