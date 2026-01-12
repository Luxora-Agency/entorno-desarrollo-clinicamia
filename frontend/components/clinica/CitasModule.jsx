'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Stethoscope, TestTube, Activity, FileText, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDateLong, formatTime } from '@/services/formatters';
import FormularioCita from './FormularioCita';

export default function CitasModule() {
  const { toast } = useToast();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCita, setEditingCita] = useState(null);
  const [editingEstado, setEditingEstado] = useState(null);
  const [editingPago, setEditingPago] = useState(null);
  
  // Estados para filtros
  const [doctores, setDoctores] = useState([]);
  const [filtros, setFiltros] = useState({
    fecha: new Date().toISOString().split('T')[0], // Default: hoy
    estado: 'todos',
    doctorId: 'todos',
  });

  useEffect(() => {
    cargarDoctores();
    cargarCitas();
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [filtros]);

  const cargarDoctores = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/doctores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDoctores(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando doctores:', error);
    }
  };

  const cargarCitas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Construir query params con filtros
      const params = new URLSearchParams();
      if (filtros.fecha) params.append('fecha', filtros.fecha);
      if (filtros.estado && filtros.estado !== 'todos') params.append('estado', filtros.estado);
      if (filtros.doctorId && filtros.doctorId !== 'todos') params.append('doctorId', filtros.doctorId);
      params.append('limit', '100');

      const citasRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/citas?${params.toString()}`, { headers });
      const citasData = await citasRes.json();

      // Soportar ambas estructuras de respuesta: { success, data } o { status, citas }
      const isSuccess = citasData.success === true || citasData.status === 'success';

      if (isSuccess) {
        const citas = citasData.data || citasData.citas || [];

        // Cargar información de facturación en batch (optimizado)
        let facturasMap = {};
        if (citas.length > 0) {
          try {
            const citaIds = citas.map(c => c.id).join(',');
            const facturaResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/facturas/batch?citaIds=${citaIds}`,
              { headers }
            );
            const facturaData = await facturaResponse.json();
            facturasMap = facturaData.data || {};
          } catch (error) {
            console.error('Error cargando facturas en batch:', error);
          }
        }

        // Asociar facturas a las citas
        const citasConFactura = citas.map(cita => ({
          ...cita,
          factura: facturasMap[cita.id] || null
        }));

        setCitas(citasConFactura);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los datos de las citas',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha: new Date().toISOString().split('T')[0],
      estado: 'todos',
      doctorId: 'todos',
    });
  };

  const handleAddNew = () => {
    setEditingCita(null);
    setShowModal(true);
  };

  const handleFormSuccess = (citaData) => {
    setShowModal(false);
    setEditingCita(null);

    // Si la cita creada/editada es para una fecha diferente, actualizar el filtro
    if (citaData?.cita?.fecha) {
      const fechaCita = new Date(citaData.cita.fecha).toISOString().split('T')[0];
      if (fechaCita !== filtros.fecha) {
        // Cambiar filtro a la fecha de la cita creada (esto dispara cargarCitas automáticamente)
        setFiltros(prev => ({ ...prev, fecha: fechaCita }));
        toast({
          title: 'Cita guardada',
          description: `La tabla se actualizó a la fecha ${fechaCita}`,
        });
        return;
      }
    }

    // Si es la misma fecha, solo recargar
    cargarCitas();
  };

  const handleFormCancel = () => {
    setShowModal(false);
    setEditingCita(null);
  };

  const handleEdit = (cita) => {
    setEditingCita(cita);
    setShowModal(true);
  };

  const handlePagoChange = async (facturaId, campo, valor) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/facturas/${facturaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [campo]: valor })
      });

      const data = await res.json();
      const isSuccess = data.success === true || data.status === 'success';

      if (isSuccess) {
        toast({
          title: 'Éxito',
          description: `${campo === 'estado' ? 'Estado de pago' : 'Método de pago'} actualizado correctamente`,
        });
        cargarCitas();
        setEditingPago(null);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.message || 'No se pudo actualizar',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al actualizar',
      });
    }
  };

  const handleEstadoChange = async (citaId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/citas/estado/${citaId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const data = await res.json();
      const isSuccess = data.success === true || data.status === 'success';

      if (isSuccess) {
        toast({
          title: 'Éxito',
          description: `Estado cambiado a: ${nuevoEstado}`,
        });
        cargarCitas();
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

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta cita?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/citas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const isSuccess = data.success === true || data.status === 'success';

      if (isSuccess) {
        toast({
          title: '✅ Cita eliminada',
          description: 'La cita se ha eliminado exitosamente',
        });
        cargarCitas();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.message || 'No se pudo eliminar la cita',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al eliminar la cita',
      });
    }
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'Especialidad':
        return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case 'Examen':
        return <TestTube className="w-4 h-4 text-purple-600" />;
      case 'Procedimiento':
        return <Activity className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEstadoBadge = (estado) => {
    const configs = {
      Programada: { bg: 'bg-blue-100', text: 'text-blue-800' },
      Confirmada: { bg: 'bg-green-100', text: 'text-green-800' },
      EnEspera: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      Atendiendo: { bg: 'bg-purple-100', text: 'text-purple-800' },
      Completada: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      Cancelada: { bg: 'bg-red-100', text: 'text-red-800' },
      NoAsistio: { bg: 'bg-gray-100', text: 'text-gray-800' }
    };
    const config = configs[estado] || configs.Programada;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {estado}
      </span>
    );
  };

  const getEstadoPagoBadge = (estado) => {
    const configs = {
      Pendiente: { bg: 'bg-red-100', text: 'text-red-800' },
      Pagada: { bg: 'bg-green-100', text: 'text-green-800' },
      Parcial: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    };
    const config = configs[estado] || configs.Pendiente;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {estado}
      </span>
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Citas Médicas</h1>
          <p className="text-gray-600 mt-1">Gestión de citas y consultas</p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4 bg-gradient-to-r from-gray-50 to-white border-2">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros de Búsqueda</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro de Fecha */}
          <div>
            <Label htmlFor="filtroFecha" className="text-sm font-medium text-gray-700">
              Fecha
            </Label>
            <Input
              id="filtroFecha"
              type="date"
              value={filtros.fecha}
              onChange={(e) => handleFiltroChange('fecha', e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Filtro de Estado */}
          <div>
            <Label htmlFor="filtroEstado" className="text-sm font-medium text-gray-700">
              Estado
            </Label>
            <Select
              value={filtros.estado}
              onValueChange={(value) => handleFiltroChange('estado', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="PorAgendar">PorAgendar</SelectItem>
                <SelectItem value="Programada">Programada</SelectItem>
                <SelectItem value="Confirmada">Confirmada</SelectItem>
                <SelectItem value="EnEspera">En Espera</SelectItem>
                <SelectItem value="Atendiendo">Atendiendo</SelectItem>
                <SelectItem value="Completada">Completada</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
                <SelectItem value="NoAsistio">No Asistió</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Doctor */}
          <div>
            <Label htmlFor="filtroDoctor" className="text-sm font-medium text-gray-700">
              Doctor
            </Label>
            <Select
              value={filtros.doctorId}
              onValueChange={(value) => handleFiltroChange('doctorId', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los doctores</SelectItem>
                {doctores.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.usuarioId}>
                    Dr. {doctor.nombre} {doctor.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botón Limpiar */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={limpiarFiltros}
              className="w-full"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
        
        {/* Indicador de resultados */}
        <div className="mt-3 text-sm text-gray-600">
          Mostrando <strong>{citas.length}</strong> cita(s)
        </div>
      </Card>

      {/* Tabla de Citas */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Detalle de Consulta</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Paciente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Doctor Asignado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fecha y Hora</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Duración</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Costo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado Cita</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado Pago</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Método Pago</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {citas.map((cita) => (
                <tr key={cita.id} className="hover:bg-gray-50">
                  {/* Tipo */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getIconoTipo(cita.tipoCita)}
                      <span className="text-sm font-medium">{cita.tipoCita}</span>
                    </div>
                  </td>
                  
                  {/* Detalle de Consulta */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">
                        {cita.especialidad?.titulo || cita.examenProcedimiento?.nombre || 'N/A'}
                      </div>
                      {cita.motivo && (
                        <div className="text-xs text-gray-600">
                          <span className="font-semibold">Motivo:</span> {cita.motivo}
                        </div>
                      )}
                      {cita.notas && (
                        <div className="text-xs text-gray-500">
                          <span className="font-semibold">Observación:</span> {cita.notas}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Paciente */}
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {cita.paciente?.nombre} {cita.paciente?.apellido}
                      </div>
                      <div className="text-gray-500">{cita.paciente?.cedula}</div>
                    </div>
                  </td>
                  
                  {/* Doctor */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {cita.doctor?.usuario?.nombre || cita.doctor?.nombre || 'Sin asignar'} {cita.doctor?.usuario?.apellido || cita.doctor?.apellido || ''}
                    </div>
                  </td>
                  
                  {/* Fecha y Hora */}
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {formatDateLong(cita.fecha)}
                      </div>
                      <div className="text-gray-500">{formatTime(cita.hora)}</div>
                    </div>
                  </td>
                  
                  {/* Duración */}
                  <td className="px-6 py-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{cita.duracionMinutos || 30}</div>
                      <div className="text-xs text-gray-500">min</div>
                    </div>
                  </td>
                  
                  {/* Costo */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {cita.costo ? formatCurrency(cita.costo) : 'N/A'}
                    </div>
                  </td>
                  
                  {/* Estado Cita - Clickeable */}
                  <td className="px-6 py-4">
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
                        <option value="EnEspera">En Espera</option>
                        <option value="Atendiendo">Atendiendo</option>
                        <option value="Completada">Completada</option>
                        <option value="Cancelada">Cancelada</option>
                        <option value="NoAsistio">No Asistió</option>
                      </select>
                    ) : (
                      <div 
                        className="cursor-pointer"
                        onClick={() => setEditingEstado(cita.id)}
                        title="Click para cambiar estado"
                      >
                        {getEstadoBadge(cita.estado)}
                      </div>
                    )}
                  </td>

                  {/* Estado Pago - Clickeable */}
                  <td className="px-6 py-4">
                    {cita.factura ? (
                      editingPago === `${cita.id}-estado` ? (
                        <select
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                          defaultValue={cita.factura.estado}
                          onChange={(e) => handlePagoChange(cita.factura.id, 'estado', e.target.value)}
                          onBlur={() => setEditingPago(null)}
                          autoFocus
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Pagada">Pagada</option>
                          <option value="Parcial">Parcial</option>
                        </select>
                      ) : (
                        <div 
                          className="cursor-pointer"
                          onClick={() => setEditingPago(`${cita.id}-estado`)}
                          title="Click para cambiar estado de pago"
                        >
                          {getEstadoPagoBadge(cita.factura.estado)}
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">Sin factura</span>
                    )}
                  </td>

                  {/* Método Pago - Clickeable */}
                  <td className="px-6 py-4">
                    {cita.factura ? (
                      editingPago === `${cita.id}-metodo` ? (
                        <select
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                          defaultValue={cita.factura.metodoPago || 'Efectivo'}
                          onChange={(e) => handlePagoChange(cita.factura.id, 'metodoPago', e.target.value)}
                          onBlur={() => setEditingPago(null)}
                          autoFocus
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="EPS">EPS</option>
                        </select>
                      ) : (
                        <div 
                          className="cursor-pointer text-sm text-gray-700 hover:text-emerald-600"
                          onClick={() => setEditingPago(`${cita.id}-metodo`)}
                          title="Click para cambiar método de pago"
                        >
                          {cita.factura.metodoPago || 'Efectivo'}
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">Sin factura</span>
                    )}
                  </td>
                  
                  {/* Acciones */}
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(cita)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(cita.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {citas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay citas registradas</p>
          </div>
        )}
      </Card>

      {/* Modal con Formulario Reutilizable */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50 sticky top-0 z-10">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-gray-900">{editingCita ? 'Editar Cita Médica' : 'Agendar Nueva Cita'}</span>
                <p className="text-sm font-normal text-gray-500 mt-0.5">
                  {editingCita ? 'Modifica los datos de la cita seleccionada' : 'Complete los datos para programar una cita'}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <FormularioCita
              editingCita={editingCita}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
