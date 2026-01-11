'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ClipboardList,
  Plus,
  Search,
  Check,
  X,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  Microscope,
  Stethoscope,
  Utensils,
  FlaskConical,
  ScanLine,
  BedDouble,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost } from '@/services/api';

// Tipos de órdenes
const TIPOS_ORDEN = [
  { value: 'Laboratorio', label: 'Laboratorio', icon: FlaskConical, color: 'text-blue-500' },
  { value: 'Imagenologia', label: 'Imagenología', icon: ScanLine, color: 'text-purple-500' },
  { value: 'Procedimiento', label: 'Procedimiento', icon: Stethoscope, color: 'text-green-500' },
  { value: 'Interconsulta', label: 'Interconsulta', icon: Microscope, color: 'text-amber-500' },
  { value: 'Dieta', label: 'Dieta', icon: Utensils, color: 'text-orange-500' },
  { value: 'Otro', label: 'Otro', icon: FileText, color: 'text-gray-500' },
];

// Prioridades
const PRIORIDADES = [
  { value: 'Baja', label: 'Baja', color: 'bg-gray-100 text-gray-700' },
  { value: 'Media', label: 'Media', color: 'bg-blue-100 text-blue-700' },
  { value: 'Alta', label: 'Alta', color: 'bg-amber-100 text-amber-700' },
  { value: 'Urgente', label: 'Urgente', color: 'bg-red-100 text-red-700' },
];

// Paquetes predefinidos
const PAQUETES = [
  {
    nombre: 'Laboratorios de Ingreso',
    ordenes: [
      { tipo: 'Laboratorio', descripcion: 'Hemograma completo', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Glicemia', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Creatinina', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Electrolitos', prioridad: 'Alta' },
    ],
  },
  {
    nombre: 'Control Metabólico',
    ordenes: [
      { tipo: 'Laboratorio', descripcion: 'Glicemia', prioridad: 'Media' },
      { tipo: 'Laboratorio', descripcion: 'HbA1c', prioridad: 'Media' },
      { tipo: 'Laboratorio', descripcion: 'Perfil lipídico', prioridad: 'Media' },
    ],
  },
  {
    nombre: 'Control Infeccioso',
    ordenes: [
      { tipo: 'Laboratorio', descripcion: 'Hemograma completo', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'PCR', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Procalcitonina', prioridad: 'Alta' },
      { tipo: 'Laboratorio', descripcion: 'Hemocultivos x2', prioridad: 'Urgente' },
    ],
  },
];

export default function ModalOrdenesMedicas({
  open,
  onOpenChange,
  admision,
  user,
  onSuccess,
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pendientes');
  const [loading, setLoading] = useState(false);
  const [ordenes, setOrdenes] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [searchExamen, setSearchExamen] = useState('');

  // Formulario de nueva orden
  const [nuevaOrden, setNuevaOrden] = useState({
    tipo: 'Laboratorio',
    examenProcedimientoId: '',
    descripcion: '',
    prioridad: 'Media',
    observaciones: '',
  });

  // Cargar órdenes y exámenes
  useEffect(() => {
    if (open && admision?.id) {
      loadOrdenes();
      loadExamenes();
    }
  }, [open, admision?.id]);

  const loadOrdenes = async () => {
    setLoading(true);
    try {
      const response = await apiGet(`/ordenes-medicas?admision_id=${admision.id}`);
      if (response.success) {
        setOrdenes(response.data || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExamenes = async () => {
    try {
      const response = await apiGet('/examenes-procedimientos?limit=100');
      if (response.success) {
        setExamenes(response.data?.data || response.data || []);
      }
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  };

  // Filtrar exámenes
  const examenesFiltrados = examenes.filter(e =>
    e.nombre?.toLowerCase().includes(searchExamen.toLowerCase()) ||
    e.codigo?.toLowerCase().includes(searchExamen.toLowerCase())
  );

  // Crear nueva orden
  const handleCrearOrden = async () => {
    if (!nuevaOrden.descripcion && !nuevaOrden.examenProcedimientoId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe especificar el examen o procedimiento.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiPost('/ordenes-medicas', {
        paciente_id: admision.paciente.id,
        admision_id: admision.id,
        tipo: nuevaOrden.tipo,
        examen_procedimiento_id: nuevaOrden.examenProcedimientoId || null,
        descripcion: nuevaOrden.descripcion,
        prioridad: nuevaOrden.prioridad,
        observaciones: nuevaOrden.observaciones,
      });

      if (response.success) {
        toast({
          title: 'Orden creada',
          description: 'La orden médica ha sido creada correctamente.',
        });
        loadOrdenes();
        setNuevaOrden({
          tipo: 'Laboratorio',
          examenProcedimientoId: '',
          descripcion: '',
          prioridad: 'Media',
          observaciones: '',
        });
        setActiveTab('pendientes');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear la orden.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear paquete de órdenes
  const handleCrearPaquete = async (paquete) => {
    setLoading(true);
    try {
      for (const orden of paquete.ordenes) {
        await apiPost('/ordenes-medicas', {
          paciente_id: admision.paciente.id,
          admision_id: admision.id,
          tipo: orden.tipo,
          descripcion: orden.descripcion,
          prioridad: orden.prioridad,
        });
      }

      toast({
        title: 'Paquete creado',
        description: `Se crearon ${paquete.ordenes.length} órdenes del paquete "${paquete.nombre}".`,
      });
      loadOrdenes();
      setActiveTab('pendientes');
    } catch (error) {
      console.error('Error creating package:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el paquete de órdenes.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Completar orden
  const handleCompletarOrden = async (ordenId) => {
    try {
      await apiPost(`/ordenes-medicas/${ordenId}/completar`, {
        resultados: 'Completado',
      });
      toast({
        title: 'Orden completada',
        description: 'La orden ha sido marcada como completada.',
      });
      loadOrdenes();
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo completar la orden.',
      });
    }
  };

  // Cancelar orden
  const handleCancelarOrden = async (ordenId) => {
    try {
      await apiPost(`/ordenes-medicas/${ordenId}/cancelar`, {
        motivo: 'Cancelada por el médico',
      });
      toast({
        title: 'Orden cancelada',
        description: 'La orden ha sido cancelada.',
      });
      loadOrdenes();
    } catch (error) {
      console.error('Error canceling order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cancelar la orden.',
      });
    }
  };

  // Obtener icono por tipo
  const getIconByType = (tipo) => {
    const found = TIPOS_ORDEN.find(t => t.value === tipo);
    if (found) {
      const Icon = found.icon;
      return <Icon className={`h-4 w-4 ${found.color}`} />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  // Separar órdenes por estado
  const ordenesPendientes = ordenes.filter(o => o.estado === 'Pendiente' || o.estado === 'EnProceso');
  const ordenesHistorial = ordenes.filter(o => o.estado === 'Completada' || o.estado === 'Cancelada');

  if (!admision) return null;

  const paciente = admision.paciente;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Órdenes Médicas
          </DialogTitle>
        </DialogHeader>

        {/* Header del paciente */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {paciente?.nombre} {paciente?.apellido}
                </p>
                <p className="text-xs text-gray-500">
                  {admision.diagnosticoIngreso}
                </p>
              </div>
              <Badge variant="outline" className="bg-white">
                <BedDouble className="h-3 w-3 mr-1" />
                {admision.unidad?.nombre} - Cama {admision.cama?.numero || '--'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="w-full">
            <TabsTrigger value="pendientes" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Pendientes ({ordenesPendientes.length})
            </TabsTrigger>
            <TabsTrigger value="nueva" className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Tab Pendientes */}
          <TabsContent value="pendientes" className="mt-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 280px)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : ordenesPendientes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No hay órdenes pendientes</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenesPendientes.map((orden) => (
                    <TableRow key={orden.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getIconByType(orden.tipo)}
                          <span className="text-sm">{orden.tipo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{orden.examenProcedimiento?.nombre || orden.descripcion}</p>
                        {orden.observaciones && (
                          <p className="text-xs text-gray-500">{orden.observaciones}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORIDADES.find(p => p.value === orden.prioridad)?.color}>
                          {orden.prioridad}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{orden.estado}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCompletarOrden(orden.id)}
                            title="Marcar como completada"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelarOrden(orden.id)}
                            title="Cancelar orden"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={loadOrdenes}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </TabsContent>

          {/* Tab Nueva Orden */}
          <TabsContent value="nueva" className="mt-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 280px)' }}>
            <div className="space-y-4">
              {/* Paquetes rápidos */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">Paquetes Predefinidos:</Label>
                <div className="flex flex-wrap gap-2">
                  {PAQUETES.map((paquete, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleCrearPaquete(paquete)}
                      disabled={loading}
                    >
                      {paquete.nombre}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Orden Individual:</h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Tipo */}
                  <div>
                    <Label>Tipo de Orden</Label>
                    <Select
                      value={nuevaOrden.tipo}
                      onValueChange={(v) => setNuevaOrden(prev => ({ ...prev, tipo: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_ORDEN.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            <div className="flex items-center gap-2">
                              <tipo.icon className={`h-4 w-4 ${tipo.color}`} />
                              {tipo.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Prioridad */}
                  <div>
                    <Label>Prioridad</Label>
                    <Select
                      value={nuevaOrden.prioridad}
                      onValueChange={(v) => setNuevaOrden(prev => ({ ...prev, prioridad: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORIDADES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <Badge className={p.color}>{p.label}</Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Búsqueda de examen */}
                <div className="mt-4">
                  <Label>Examen / Procedimiento</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchExamen}
                      onChange={(e) => setSearchExamen(e.target.value)}
                      placeholder="Buscar examen o procedimiento..."
                      className="pl-10"
                    />
                  </div>
                  {searchExamen && examenesFiltrados.length > 0 && (
                    <div className="mt-2 border rounded-lg max-h-32 overflow-y-auto">
                      {examenesFiltrados.slice(0, 5).map((examen) => (
                        <div
                          key={examen.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer text-sm"
                          onClick={() => {
                            setNuevaOrden(prev => ({
                              ...prev,
                              examenProcedimientoId: examen.id,
                              descripcion: examen.nombre,
                            }));
                            setSearchExamen('');
                          }}
                        >
                          <span className="font-medium">{examen.nombre}</span>
                          {examen.codigo && (
                            <span className="text-gray-500 ml-2">({examen.codigo})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Descripción manual */}
                <div className="mt-4">
                  <Label>Descripción</Label>
                  <Input
                    value={nuevaOrden.descripcion}
                    onChange={(e) => setNuevaOrden(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción del examen o procedimiento"
                    className="mt-1"
                  />
                </div>

                {/* Observaciones */}
                <div className="mt-4">
                  <Label>Observaciones</Label>
                  <Textarea
                    value={nuevaOrden.observaciones}
                    onChange={(e) => setNuevaOrden(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Indicaciones especiales, preparación del paciente..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Botón crear */}
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleCrearOrden} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Crear Orden
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab Historial */}
          <TabsContent value="historial" className="mt-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 280px)' }}>
            {ordenesHistorial.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No hay órdenes en el historial</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenesHistorial.map((orden) => (
                    <TableRow key={orden.id} className={orden.estado === 'Cancelada' ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getIconByType(orden.tipo)}
                          <span className="text-sm">{orden.tipo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {orden.examenProcedimiento?.nombre || orden.descripcion}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={orden.estado === 'Completada' ? 'default' : 'destructive'}
                          className={orden.estado === 'Completada' ? 'bg-green-100 text-green-700' : ''}
                        >
                          {orden.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(orden.updatedAt || orden.createdAt).toLocaleDateString('es-CO')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
