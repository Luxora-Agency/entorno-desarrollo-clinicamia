'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Filter, Plus, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDateLong, formatTime } from '@/services/formatters';
import FormularioCita from './FormularioCita';

export default function DashboardRecepcionistaNew({ user }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [doctores, setDoctores] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null); // Info del doctor seleccionado
  const [citas, setCitas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  
  // Filtros
  const getFechaHoy = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };
  
  const [fechaSeleccionada, setFechaSeleccionada] = useState(getFechaHoy());
  const [doctorSeleccionado, setDoctorSeleccionado] = useState('');
  
  // Modal de nueva cita
  const [showModalCita, setShowModalCita] = useState(false);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null);
  const [initialDataCita, setInitialDataCita] = useState({});
  const [editingEstado, setEditingEstado] = useState(null);

  // Modal de asignar doctor
  const [showModalAsignarDoctor, setShowModalAsignarDoctor] = useState(false);
  const [citaAsignar, setCitaAsignar] = useState(null);
  const [doctorAsignar, setDoctorAsignar] = useState('');

  useEffect(() => {
    cargarDoctores();
  }, []);

  useEffect(() => {
    if (fechaSeleccionada) {
      cargarDatos();
    }
  }, [fechaSeleccionada, doctorSeleccionado]);

  const cargarDoctores = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/agenda/doctores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDoctores(data.data.doctores);
      }
    } catch (error) {
      console.error('Error al cargar doctores:', error);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Si hay doctor seleccionado, cargar bloques
      if (doctorSeleccionado) {
        const resB = await fetch(`/api/agenda/bloques/${doctorSeleccionado}?fecha=${fechaSeleccionada}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataB = await resB.json();
        if (dataB.success) {
          setBloques(dataB.data.bloques.bloques || []);
          setDoctorInfo(dataB.data.bloques.doctor); // Guardar info del doctor incluyendo usuarioId
        }
      } else {
        setBloques([]);
        setDoctorInfo(null);
      }

      // Cargar citas
      const url = doctorSeleccionado 
        ? `/api/agenda/citas?fecha=${fechaSeleccionada}&doctorId=${doctorSeleccionado}`
        : `/api/agenda/citas?fecha=${fechaSeleccionada}`;
      
      const resC = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataC = await resC.json();
      if (dataC.success) {
        setCitas(dataC.data.citas);
        calcularEstadisticas(dataC.data.citas);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los datos',
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (citasData) => {
    setEstadisticas({
      total: citasData.length,
      programadas: citasData.filter(c => c.estado === 'Programada').length,
      confirmadas: citasData.filter(c => c.estado === 'Confirmada').length,
      enEspera: citasData.filter(c => c.estado === 'EnEspera').length,
      completadas: citasData.filter(c => c.estado === 'Completada').length,
    });
  };

  const handleClickBloque = (bloque) => {
    if (bloque.estado === 'disponible') {
      setBloqueSeleccionado(bloque);
      // Prellenar datos para el formulario reutilizable
      setInitialDataCita({
        doctorId: doctorInfo?.usuarioId || '',
        fecha: fechaSeleccionada,
        hora: bloque.hora,
        duracionMinutos: bloque.duracion || 30
      });
      setShowModalCita(true);
    }
  };

  const handleCitaSuccess = () => {
    setShowModalCita(false);
    setBloqueSeleccionado(null);
    setInitialDataCita({});
    cargarDatos();
  };

  const handleCitaCancel = () => {
    setShowModalCita(false);
    setBloqueSeleccionado(null);
    setInitialDataCita({});
  };

  const handleEstadoChange = async (citaId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/citas/${citaId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: '✅ Estado actualizado',
          description: `Estado cambiado a: ${nuevoEstado}`,
        });
        cargarDatos();
        setEditingEstado(null);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.message || 'No se pudo actualizar el estado',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al actualizar el estado',
      });
    }
  };

  const handleAsignarDoctor = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/citas/${citaAsignar.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doctor_id: doctorAsignar })
      });
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: '✅ Doctor asignado',
          description: 'El doctor se asignó correctamente',
        });
        setShowModalAsignarDoctor(false);
        cargarDatos();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.message || 'No se pudo asignar el doctor',
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getEstadoBadge = (estado) => {
    const colores = {
      Programada: 'bg-blue-100 text-blue-800',
      Confirmada: 'bg-green-100 text-green-800',
      EnEspera: 'bg-yellow-100 text-yellow-800',
      Atendiendo: 'bg-purple-100 text-purple-800',
      Completada: 'bg-gray-100 text-gray-800',
      Cancelada: 'bg-red-100 text-red-800',
      NoAsistio: 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colores[estado] || 'bg-gray-100 text-gray-800'}`}>
        {estado === 'EnEspera' ? 'En Espera' : estado === 'NoAsistio' ? 'No Asistió' : estado}
      </span>
    );
  };

  const getTipoBadge = (tipo) => {
    const colores = {
      Especialidad: 'bg-blue-100 text-blue-800',
      Examen: 'bg-purple-100 text-purple-800',
      Procedimiento: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colores[tipo] || 'bg-gray-100 text-gray-800'}`}>
        {tipo}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Recepción</h1>
            <p className="text-gray-600">Gestión de citas y agenda médica</p>
          </div>
          <Button onClick={() => setShowModalCita(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cita
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha
            </label>
            <Input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Doctor
            </label>
            <select
              value={doctorSeleccionado}
              onChange={(e) => setDoctorSeleccionado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos los doctores</option>
              {doctores.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.nombre} - {doc.especialidades}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={cargarDatos} className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Citas</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.total || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Programadas</p>
              <p className="text-2xl font-bold text-blue-600">{estadisticas.programadas || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmadas</p>
              <p className="text-2xl font-bold text-green-600">{estadisticas.confirmadas || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Espera</p>
              <p className="text-2xl font-bold text-yellow-600">{estadisticas.enEspera || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-gray-600">{estadisticas.completadas || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* Vista de Bloques (solo si hay doctor seleccionado) */}
      {doctorSeleccionado && bloques.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Agenda de {doctores.find(d => d.id === doctorSeleccionado)?.nombre}
          </h2>
          <p className="text-sm text-gray-600 mb-4">{formatDateLong(fechaSeleccionada)}</p>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bloques.map((bloque, idx) => {
              // Verificar si la fecha es pasada
              const esFechaPasada = fechaSeleccionada < getFechaHoy();
              const esDisponible = bloque.estado === 'disponible';
              const esClickeable = esDisponible && !esFechaPasada;
              
              return (
                <div
                  key={idx}
                  onClick={() => esClickeable && handleClickBloque(bloque)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    esFechaPasada && esDisponible
                      ? 'border-solid border-red-300 bg-red-50 cursor-not-allowed opacity-60'
                      : esDisponible
                      ? 'border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer'
                      : 'border-solid border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{bloque.hora}</div>
                        <div className="text-xs text-gray-500">{bloque.duracion} min</div>
                      </div>
                      
                      {bloque.estado === 'disponible' ? (
                        <div className={`flex items-center gap-2 ${esFechaPasada ? 'text-red-600' : 'text-emerald-600'}`}>
                          <Plus className="w-5 h-5" />
                          <span className="font-semibold">
                            {esFechaPasada ? 'No disponible - Fecha pasada' : 'Disponible - Click para agendar'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getTipoBadge(bloque.cita.tipo)}
                            {getEstadoBadge(bloque.cita.estadoCita)}
                          </div>
                          <div className="font-semibold text-gray-900">{bloque.cita.paciente}</div>
                          <div className="text-sm text-gray-600">{bloque.cita.cedula}</div>
                          <div className="text-sm text-gray-700 mt-1">{bloque.cita.servicio}</div>
                          {bloque.cita.motivo && (
                            <div className="text-xs text-gray-500 mt-1">Motivo: {bloque.cita.motivo}</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {bloque.cita && bloque.cita.costo && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${parseFloat(bloque.cita.costo).toLocaleString('es-CO')}
                        </div>
                        <div className="text-xs text-gray-500">COP</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tabla de Citas */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Lista de Citas - {formatDateLong(fechaSeleccionada)}
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {citas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No hay citas para la fecha seleccionada
                  </td>
                </tr>
              ) : (
                citas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatTime(cita.hora)}
                      </div>
                      <div className="text-xs text-gray-500">{cita.duracionMinutos} min</div>
                    </td>
                    <td className="px-6 py-4">
                      {getTipoBadge(cita.tipoCita)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {cita.especialidad?.titulo || cita.examenProcedimiento?.nombre || 'N/A'}
                      </div>
                      {cita.motivo && (
                        <div className="text-xs text-gray-500 mt-1">{cita.motivo}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {cita.paciente.nombre} {cita.paciente.apellido}
                        </div>
                        <div className="text-gray-500">{cita.paciente.cedula}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {cita.doctorNombre === 'Sin asignar' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCitaAsignar(cita);
                              setShowModalAsignarDoctor(true);
                            }}
                            className="text-blue-600"
                          >
                            Asignar Doctor
                          </Button>
                        ) : (
                          cita.doctorNombre
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div onClick={() => setEditingEstado(cita.id)} className="cursor-pointer">
                        {editingEstado === cita.id ? (
                          <select
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            defaultValue={cita.estado}
                            onChange={(e) => handleEstadoChange(cita.id, e.target.value)}
                            onBlur={() => setEditingEstado(null)}
                            autoFocus
                          >
                            <option value="Programada">Programada</option>
                            <option value="Confirmada">Confirmada</option>
                            <option value="EnCurso">En Curso</option>
                            <option value="Completada">Completada</option>
                            <option value="Cancelada">Cancelada</option>
                            <option value="NoAsistio">No Asistió</option>
                          </select>
                        ) : (
                          getEstadoBadge(cita.estado)
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        ${parseFloat(cita.costo || 0).toLocaleString('es-CO')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Nueva Cita con Formulario Completo */}
      <Dialog open={showModalCita} onOpenChange={setShowModalCita}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Agendar Cita - {bloqueSeleccionado?.hora} 
              {doctorInfo && ` con Dr. ${doctorInfo.nombre}`}
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-900">
            📅 <strong>Fecha:</strong> {formatDateLong(fechaSeleccionada)} | 
            🕐 <strong>Hora:</strong> {bloqueSeleccionado?.hora} | 
            ⏱️ <strong>Duración:</strong> {bloqueSeleccionado?.duracion || 30} min
          </div>
          <FormularioCita
            initialData={initialDataCita}
            onSuccess={handleCitaSuccess}
            onCancel={handleCitaCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Asignar Doctor */}
      <Dialog open={showModalAsignarDoctor} onOpenChange={setShowModalAsignarDoctor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Seleccione el doctor</label>
              <select
                value={doctorAsignar}
                onChange={(e) => setDoctorAsignar(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccione...</option>
                {doctores.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.nombre} - {doc.especialidades}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAsignarDoctor} className="flex-1" disabled={!doctorAsignar}>
                Asignar
              </Button>
              <Button variant="outline" onClick={() => setShowModalAsignarDoctor(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
