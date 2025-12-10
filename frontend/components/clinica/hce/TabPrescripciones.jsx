'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Pill, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search,
  Trash2,
  Calendar
} from 'lucide-react';
import { apiGet, apiPost } from '@/services/api';
import { formatDateTime, formatDate } from '@/services/formatters';
import { useToast } from '@/hooks/use-toast';

export default function TabPrescripciones({ pacienteId, admisionId, user }) {
  const { toast } = useToast();
  const [prescripciones, setPrescripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [admisionActiva, setAdmisionActiva] = useState(null);
  
  // Formulario de prescripción
  const [formData, setFormData] = useState({
    diagnostico: '',
    observaciones: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    medicamentos: [],
  });

  // Búsqueda de medicamentos
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Alertas
  const [alertas, setAlertas] = useState({ interacciones: [], alergias: [] });

  useEffect(() => {
    if (pacienteId) {
      cargarDatos();
    }
  }, [pacienteId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar prescripciones activas
      const responsePrescripciones = await apiGet(`/prescripciones/activas/${pacienteId}`);
      setPrescripciones(responsePrescripciones.data || []);

      // Verificar si hay admisión activa
      if (!admisionId) {
        const responseAdmisiones = await apiGet('/admisiones', { pacienteId });
        const admisionesActivas = responseAdmisiones.data.admisiones?.filter(
          (adm) => adm.estado === 'Activa'
        );
        if (admisionesActivas && admisionesActivas.length > 0) {
          setAdmisionActiva(admisionesActivas[0]);
        }
      } else {
        setAdmisionActiva({ id: admisionId });
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las prescripciones',
      });
    } finally {
      setLoading(false);
    }
  };

  const buscarMedicamentos = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await apiGet('/productos', { 
        search: term,
        limit: 10,
      });
      
      // Filtrar solo productos que son medicamentos (tienen principio activo)
      const medicamentos = (response.data || []).filter(
        p => p.principioActivo && p.activo
      );
      
      setSearchResults(medicamentos);
    } catch (error) {
      console.error('Error al buscar medicamentos:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const agregarMedicamento = (producto) => {
    // Verificar que no esté ya agregado
    if (formData.medicamentos.find(m => m.productoId === producto.id)) {
      toast({
        variant: 'destructive',
        title: 'Medicamento duplicado',
        description: 'Este medicamento ya está en la prescripción',
      });
      return;
    }

    const nuevoMedicamento = {
      productoId: producto.id,
      nombre: producto.nombre,
      principioActivo: producto.principioActivo,
      concentracion: producto.concentracion,
      presentacion: producto.presentacion,
      dosis: '',
      via: producto.viaAdministracion || 'Oral',
      frecuencia: 'Cada8Horas',
      frecuenciaDetalle: '',
      duracionDias: 7,
      instrucciones: '',
      prn: false,
    };

    setFormData({
      ...formData,
      medicamentos: [...formData.medicamentos, nuevoMedicamento],
    });

    // Limpiar búsqueda
    setSearchTerm('');
    setSearchResults([]);

    // Verificar interacciones y alergias
    verificarSeguridad([...formData.medicamentos, nuevoMedicamento]);
  };

  const eliminarMedicamento = (index) => {
    const nuevosMedicamentos = formData.medicamentos.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      medicamentos: nuevosMedicamentos,
    });
    verificarSeguridad(nuevosMedicamentos);
  };

  const actualizarMedicamento = (index, campo, valor) => {
    const nuevosMedicamentos = [...formData.medicamentos];
    nuevosMedicamentos[index][campo] = valor;
    setFormData({
      ...formData,
      medicamentos: nuevosMedicamentos,
    });
  };

  const verificarSeguridad = async (medicamentos) => {
    if (medicamentos.length === 0) {
      setAlertas({ interacciones: [], alergias: [] });
      return;
    }

    try {
      const productoIds = medicamentos.map(m => m.productoId);
      
      // Verificar alergias
      const responseAlergias = await apiPost('/productos/verificar-alergias', {
        pacienteId,
        medicamentosIds: productoIds,
      });

      setAlertas({
        interacciones: [], // Las interacciones se verifican en el backend al crear
        alergias: responseAlergias.data || [],
      });
    } catch (error) {
      console.error('Error al verificar seguridad:', error);
    }
  };

  const handleCrearPrescripcion = async (e) => {
    e.preventDefault();

    // Verificar admisión activa
    const admisionIdAUsar = admisionId || admisionActiva?.id;
    
    if (!admisionIdAUsar) {
      toast({
        variant: 'destructive',
        title: 'Admisión requerida',
        description: 'El paciente debe tener una admisión hospitalaria activa para prescribir medicamentos.',
      });
      return;
    }

    // Validar que haya al menos un medicamento
    if (formData.medicamentos.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Medicamentos requeridos',
        description: 'Debe agregar al menos un medicamento a la prescripción.',
      });
      return;
    }

    // Validar que todos los medicamentos tengan dosis
    const medicamentosSinDosis = formData.medicamentos.filter(m => !m.dosis);
    if (medicamentosSinDosis.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Dosis incompletas',
        description: 'Todos los medicamentos deben tener dosis especificada.',
      });
      return;
    }

    try {
      const response = await apiPost('/prescripciones', {
        pacienteId,
        admisionId: admisionIdAUsar,
        diagnostico: formData.diagnostico,
        observaciones: formData.observaciones,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin || null,
        medicamentos: formData.medicamentos,
      });

      // Mostrar alertas si las hay
      if (response.alertas) {
        if (response.alertas.alergias.length > 0) {
          toast({
            variant: 'destructive',
            title: '⚠️ ALERTA DE ALERGIAS',
            description: `Se detectaron ${response.alertas.alergias.length} alertas de alergias. Revise el paciente.`,
          });
        }
        if (response.alertas.interacciones.length > 0) {
          toast({
            title: '⚠️ Interacciones detectadas',
            description: `Se detectaron ${response.alertas.interacciones.length} posibles interacciones medicamentosas.`,
          });
        }
      }

      toast({
        title: '✅ Prescripción creada',
        description: `Prescripción registrada con ${formData.medicamentos.length} medicamentos.`,
      });

      setIsDialogOpen(false);
      resetForm();
      await cargarDatos();
    } catch (error) {
      console.error('Error al crear prescripción:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear prescripción',
        description: error.message || 'No se pudo crear la prescripción.',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      diagnostico: '',
      observaciones: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: '',
      medicamentos: [],
    });
    setAlertas({ interacciones: [], alergias: [] });
  };

  const getEstadoBadge = (estado) => {
    const variants = {
      'Activa': 'default',
      'Suspendida': 'secondary',
      'Completada': 'outline',
      'Cancelada': 'destructive',
    };
    return variants[estado] || 'default';
  };

  const getViaIcon = (via) => {
    return <Pill className="w-4 h-4" />;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando prescripciones...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Prescripciones Médicas</h3>
          <p className="text-sm text-gray-500">Gestión de medicamentos prescritos</p>
          {!admisionId && !admisionActiva && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Requiere admisión hospitalaria activa
            </p>
          )}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Prescripción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Prescripción Médica</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCrearPrescripcion} className="space-y-6">
              {/* Información general */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Diagnóstico</Label>
                  <Textarea
                    value={formData.diagnostico}
                    onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                    placeholder="Diagnóstico principal..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Observaciones</Label>
                  <Textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Observaciones adicionales..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha Inicio</Label>
                  <Input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fecha Fin (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  />
                </div>
              </div>

              {/* Alertas */}
              {alertas.alergias.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>⚠️ ALERTAS DE ALERGIAS:</strong>
                    <ul className="mt-2 space-y-1">
                      {alertas.alergias.map((alerta, i) => (
                        <li key={i} className="text-sm">• {alerta.mensaje}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Búsqueda de medicamentos */}
              <div>
                <Label>Buscar Medicamento</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      buscarMedicamentos(e.target.value);
                    }}
                    placeholder="Buscar por nombre, principio activo..."
                    className="pl-10"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((producto) => (
                      <div
                        key={producto.id}
                        onClick={() => agregarMedicamento(producto)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">{producto.nombre}</div>
                        <div className="text-sm text-gray-600">
                          {producto.principioActivo} - {producto.concentracion}
                        </div>
                        <div className="text-xs text-gray-500">{producto.presentacion}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lista de medicamentos agregados */}
              <div>
                <Label>Medicamentos Prescritos ({formData.medicamentos.length})</Label>
                <div className="mt-2 space-y-4">
                  {formData.medicamentos.map((med, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium">{med.nombre}</div>
                            <div className="text-sm text-gray-600">
                              {med.principioActivo} - {med.concentracion}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarMedicamento(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs">Dosis *</Label>
                            <Input
                              value={med.dosis}
                              onChange={(e) => actualizarMedicamento(index, 'dosis', e.target.value)}
                              placeholder="500mg"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Vía</Label>
                            <Select
                              value={med.via}
                              onValueChange={(value) => actualizarMedicamento(index, 'via', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Oral">Oral</SelectItem>
                                <SelectItem value="Intravenosa">Intravenosa</SelectItem>
                                <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                                <SelectItem value="Subcutanea">Subcutánea</SelectItem>
                                <SelectItem value="Topica">Tópica</SelectItem>
                                <SelectItem value="Inhalatoria">Inhalatoria</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Frecuencia</Label>
                            <Select
                              value={med.frecuencia}
                              onValueChange={(value) => actualizarMedicamento(index, 'frecuencia', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Unica">Única</SelectItem>
                                <SelectItem value="Cada4Horas">Cada 4 horas</SelectItem>
                                <SelectItem value="Cada6Horas">Cada 6 horas</SelectItem>
                                <SelectItem value="Cada8Horas">Cada 8 horas</SelectItem>
                                <SelectItem value="Cada12Horas">Cada 12 horas</SelectItem>
                                <SelectItem value="Cada24Horas">Cada 24 horas</SelectItem>
                                <SelectItem value="PRN">PRN (si necesita)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Duración (días)</Label>
                            <Input
                              type="number"
                              value={med.duracionDias}
                              onChange={(e) => actualizarMedicamento(index, 'duracionDias', parseInt(e.target.value))}
                              min="1"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Label className="text-xs">Instrucciones Especiales</Label>
                          <Input
                            value={med.instrucciones}
                            onChange={(e) => actualizarMedicamento(index, 'instrucciones', e.target.value)}
                            placeholder="Ej: Tomar con alimentos, evitar lácteos..."
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {formData.medicamentos.length === 0 && (
                    <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
                      <Pill className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No hay medicamentos agregados</p>
                      <p className="text-sm">Busque y agregue medicamentos arriba</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={formData.medicamentos.length === 0}>
                  Crear Prescripción
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de prescripciones activas */}
      {prescripciones.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Pill className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay prescripciones activas
            </h3>
            <p className="text-gray-600 mb-4">
              El paciente no tiene medicamentos prescritos actualmente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescripciones.map((prescripcion) => (
            <Card key={prescripcion.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Prescripción del {formatDate(prescripcion.fechaPrescripcion)}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Dr. {prescripcion.medico?.nombre} {prescripcion.medico?.apellido}
                    </p>
                  </div>
                  <Badge variant={getEstadoBadge(prescripcion.estado)}>
                    {prescripcion.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {prescripcion.diagnostico && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Diagnóstico:</div>
                    <div className="text-sm text-blue-800">{prescripcion.diagnostico}</div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {prescripcion.medicamentos?.map((medPrescrito) => (
                    <div
                      key={medPrescrito.id}
                      className={`p-4 border rounded-lg ${
                        medPrescrito.suspendido ? 'bg-gray-50 opacity-60' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getViaIcon(medPrescrito.via)}
                            <span className="font-medium">
                              {medPrescrito.producto?.nombre || medPrescrito.medicamento?.nombre}
                            </span>
                            {medPrescrito.suspendido && (
                              <Badge variant="secondary">Suspendido</Badge>
                            )}
                            {medPrescrito.prn && (
                              <Badge variant="outline">PRN</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>
                              <strong>Dosis:</strong> {medPrescrito.dosis} - {medPrescrito.via}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <strong>Frecuencia:</strong> {medPrescrito.frecuenciaDetalle || medPrescrito.frecuencia}
                            </div>
                            {medPrescrito.duracionDias && (
                              <div>
                                <strong>Duración:</strong> {medPrescrito.duracionDias} días
                              </div>
                            )}
                            {medPrescrito.instrucciones && (
                              <div className="mt-2 p-2 bg-amber-50 rounded text-xs">
                                <strong>Instrucciones:</strong> {medPrescrito.instrucciones}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {prescripcion.observaciones && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-900">Observaciones:</div>
                    <div className="text-sm text-gray-700">{prescripcion.observaciones}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
