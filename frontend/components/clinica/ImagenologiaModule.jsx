'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Scan,
  Plus,
  Search,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  User,
  Calendar,
  Download,
  Eye,
  Image as ImageIcon,
  Film,
  Radio,
  Activity,
  Microscope,
} from 'lucide-react';

export default function ImagenologiaModule({ user }) {
  const [activeTab, setActiveTab] = useState('pendientes');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Datos mockeados de estudios de imagenología
  const [estudios, setEstudios] = useState([
    {
      id: 'IMG-2025-001',
      paciente: { nombre: 'Carlos Mendoza', cedula: '1122334455', edad: 58 },
      medico: { nombre: 'Dr. Jorge Ramírez', especialidad: 'Cardiología' },
      tipoEstudio: 'Radiografía',
      zona: 'Tórax AP y Lateral',
      prioridad: 'Alta',
      estado: 'Pendiente',
      fechaSolicitud: '2025-01-15 09:00',
      fechaProgramada: '2025-01-15 14:00',
      indicacionClinica: 'Dolor torácico. Descartar neumotórax.',
      observaciones: 'Paciente con EPOC',
    },
    {
      id: 'IMG-2025-002',
      paciente: { nombre: 'Ana Martínez', cedula: '9988776655', edad: 42 },
      medico: { nombre: 'Dra. Patricia Gómez', especialidad: 'Neurología' },
      tipoEstudio: 'TAC',
      zona: 'Cráneo Simple',
      prioridad: 'Urgente',
      estado: 'EnProceso',
      fechaSolicitud: '2025-01-15 10:30',
      fechaProgramada: '2025-01-15 11:00',
      indicacionClinica: 'Cefalea intensa súbita. R/O HSA',
      observaciones: 'Sin contraindicaciones',
    },
    {
      id: 'IMG-2025-003',
      paciente: { nombre: 'Roberto Silva', cedula: '5544332211', edad: 35 },
      medico: { nombre: 'Dr. Eduardo Torres', especialidad: 'Traumatología' },
      tipoEstudio: 'Radiografía',
      zona: 'Rodilla Derecha',
      prioridad: 'Normal',
      estado: 'Completado',
      fechaSolicitud: '2025-01-14 15:20',
      fechaRealizacion: '2025-01-14 16:30',
      indicacionClinica: 'Trauma deportivo. Dolor e inflamación.',
      resultado: {
        hallazgos: 'Fractura no desplazada de meseta tibial lateral. Sin compromiso articular evidente.',
        conclusion: 'Fractura de Schatzker tipo I.',
        recomendaciones: 'Control con ortopedia. Considerar TAC para planificación quirúrgica.',
        imagenes: 3,
      },
      radiologo: 'Dr. Andrés Vargas',
      fechaInforme: '2025-01-14 18:00',
    },
    {
      id: 'IMG-2025-004',
      paciente: { nombre: 'María López', cedula: '3344556677', edad: 28 },
      medico: { nombre: 'Dra. Sandra Reyes', especialidad: 'Ginecología' },
      tipoEstudio: 'Ecografía',
      zona: 'Obstétrica',
      prioridad: 'Normal',
      estado: 'Completado',
      fechaSolicitud: '2025-01-13 11:00',
      fechaRealizacion: '2025-01-13 14:00',
      indicacionClinica: 'Control prenatal. 22 semanas de gestación.',
      resultado: {
        hallazgos: 'Feto único vivo intrauterino en presentación cefálica. Movimientos fetales presentes. Frecuencia cardíaca: 145 lpm. Líquido amniótico normal. Placenta anterior grado I.',
        conclusion: 'Embarazo de 22 semanas + 3 días. Sin alteraciones morfológicas evidentes.',
        recomendaciones: 'Control prenatal según protocolo.',
        imagenes: 8,
      },
      radiologo: 'Dr. Luis Moreno',
      fechaInforme: '2025-01-13 15:30',
    },
    {
      id: 'IMG-2025-005',
      paciente: { nombre: 'Pedro Jiménez', cedula: '7788990011', edad: 65 },
      medico: { nombre: 'Dr. Carlos Méndez', especialidad: 'Medicina Interna' },
      tipoEstudio: 'Resonancia Magnética',
      zona: 'Columna Lumbar',
      prioridad: 'Alta',
      estado: 'Completado',
      fechaSolicitud: '2025-01-12 08:00',
      fechaRealizacion: '2025-01-13 10:00',
      indicacionClinica: 'Lumbalgia crónica. Radiculopatía L5-S1.',
      resultado: {
        hallazgos: 'Hernia discal central y foraminal izquierda L5-S1 con compresión radicular. Discopatía degenerativa L4-L5. Canal espinal sin estenosis significativa.',
        conclusion: 'Hernia discal L5-S1 con compromiso radicular. Cambios degenerativos multinivel.',
        recomendaciones: 'Valoración por neurocirugía.',
        imagenes: 24,
      },
      radiologo: 'Dra. Carmen Ruiz',
      fechaInforme: '2025-01-13 16:00',
    },
  ]);

  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'EnProceso': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Completado': return 'bg-green-100 text-green-800 border-green-300';
      case 'Informado': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'Urgente': return 'bg-red-100 text-red-800 border-red-300';
      case 'Alta': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Normal': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Baja': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getIconoEstudio = (tipo) => {
    switch (tipo) {
      case 'Radiografía': return <Radio className="w-5 h-5" />;
      case 'TAC': return <Scan className="w-5 h-5" />;
      case 'Resonancia Magnética': return <Activity className="w-5 h-5" />;
      case 'Ecografía': return <Microscope className="w-5 h-5" />;
      case 'Mamografía': return <ImageIcon className="w-5 h-5" />;
      default: return <Film className="w-5 h-5" />;
    }
  };

  const estudiosFiltrados = estudios.filter(estudio => {
    const matchSearch = searchTerm === '' ||
      estudio.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudio.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudio.paciente.cedula.includes(searchTerm);
    
    const matchTab = 
      (activeTab === 'pendientes' && estudio.estado === 'Pendiente') ||
      (activeTab === 'proceso' && estudio.estado === 'EnProceso') ||
      (activeTab === 'completados' && estudio.estado === 'Completado') ||
      (activeTab === 'todos');
    
    return matchSearch && matchTab;
  });

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-lg shadow-lg">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Imagenología y Diagnóstico</h1>
              <p className="text-sm text-gray-600">Gestión de Estudios de Imagen</p>
            </div>
          </div>
          <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Estudio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Solicitud de Estudio</DialogTitle>
              </DialogHeader>
              <FormularioNuevoEstudio onClose={() => setShowNewOrder(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Proceso</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completados Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Mes</p>
                  <p className="text-2xl font-bold text-gray-900">186</p>
                </div>
                <Scan className="w-8 h-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por ID, paciente o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Estudios */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border shadow-sm">
            <TabsTrigger value="pendientes" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700">
              Pendientes
            </TabsTrigger>
            <TabsTrigger value="proceso" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              En Proceso
            </TabsTrigger>
            <TabsTrigger value="completados" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              Completados
            </TabsTrigger>
            <TabsTrigger value="todos" className="data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-700">
              Todos
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Estudio</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estudiosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                          No se encontraron estudios
                        </TableCell>
                      </TableRow>
                    ) : (
                      estudiosFiltrados.map((estudio) => (
                        <TableRow key={estudio.id}>
                          <TableCell className="font-medium">{estudio.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{estudio.paciente.nombre}</p>
                              <p className="text-xs text-gray-500">CC: {estudio.paciente.cedula}</p>
                              <p className="text-xs text-gray-500">{estudio.paciente.edad} años</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{estudio.medico.nombre}</p>
                              <p className="text-xs text-gray-500">{estudio.medico.especialidad}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getIconoEstudio(estudio.tipoEstudio)}
                              <span className="text-sm">{estudio.tipoEstudio}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{estudio.zona}</TableCell>
                          <TableCell>
                            <Badge className={getPrioridadColor(estudio.prioridad)}>
                              {estudio.prioridad}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getBadgeColor(estudio.estado)}>
                              {estudio.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {estudio.fechaSolicitud}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedStudy(estudio);
                                  setShowResults(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {estudio.estado === 'Completado' && (
                                <Button size="sm" variant="outline">
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Informe */}
        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Informe Radiológico</DialogTitle>
            </DialogHeader>
            {selectedStudy && (
              <DetalleInforme estudio={selectedStudy} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Componente de Formulario de Nuevo Estudio
function FormularioNuevoEstudio({ onClose }) {
  const [formData, setFormData] = useState({
    paciente: '',
    tipoEstudio: '',
    zona: '',
    prioridad: 'Normal',
    indicacionClinica: '',
    observaciones: '',
  });

  const tiposEstudio = [
    { valor: 'Radiografía', zonas: ['Tórax AP', 'Tórax Lateral', 'Abdomen Simple', 'Columna Cervical', 'Columna Lumbar', 'Extremidades'] },
    { valor: 'TAC', zonas: ['Cráneo Simple', 'Cráneo Contrastado', 'Tórax', 'Abdomen', 'Columna'] },
    { valor: 'Resonancia Magnética', zonas: ['Cerebro', 'Columna Cervical', 'Columna Lumbar', 'Rodilla', 'Hombro'] },
    { valor: 'Ecografía', zonas: ['Obstétrica', 'Abdominal', 'Pélvica', 'Renal', 'Mamaria', 'Tiroides'] },
    { valor: 'Mamografía', zonas: ['Bilateral', 'Unilateral Derecha', 'Unilateral Izquierda'] },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Estudio solicitado exitosamente (mockup)');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Paciente *</Label>
          <Input placeholder="Buscar paciente..." required />
        </div>
        <div>
          <Label>Médico Solicitante *</Label>
          <Input value="Usuario actual" disabled />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo de Estudio *</Label>
          <Select value={formData.tipoEstudio} onValueChange={(val) => setFormData({...formData, tipoEstudio: val})} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent>
              {tiposEstudio.map(tipo => (
                <SelectItem key={tipo.valor} value={tipo.valor}>{tipo.valor}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Zona Anatómica *</Label>
          <Select value={formData.zona} onValueChange={(val) => setFormData({...formData, zona: val})} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione tipo primero..." />
            </SelectTrigger>
            <SelectContent>
              {formData.tipoEstudio && tiposEstudio.find(t => t.valor === formData.tipoEstudio)?.zonas.map(zona => (
                <SelectItem key={zona} value={zona}>{zona}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Prioridad *</Label>
        <Select value={formData.prioridad} onValueChange={(val) => setFormData({...formData, prioridad: val})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Urgente">Urgente</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="Baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Indicación Clínica *</Label>
        <Textarea
          placeholder="Motivo del estudio, sospecha diagnóstica..."
          value={formData.indicacionClinica}
          onChange={(e) => setFormData({...formData, indicacionClinica: e.target.value})}
          rows={2}
          required
        />
      </div>

      <div>
        <Label>Observaciones</Label>
        <Textarea
          placeholder="Contraindicaciones, alergias, embarazo, etc."
          value={formData.observaciones}
          onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-cyan-600 to-blue-700">
          Solicitar Estudio
        </Button>
      </div>
    </form>
  );
}

// Componente de Detalle de Informe
function DetalleInforme({ estudio }) {
  return (
    <div className="space-y-6">
      {/* Información del Estudio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Estudio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">ID Estudio</p>
              <p className="font-medium">{estudio.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge className={estudio.estado === 'Completado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {estudio.estado}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paciente</p>
              <p className="font-medium">{estudio.paciente.nombre}</p>
              <p className="text-xs text-gray-500">CC: {estudio.paciente.cedula} - {estudio.paciente.edad} años</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Médico Solicitante</p>
              <p className="font-medium">{estudio.medico.nombre}</p>
              <p className="text-xs text-gray-500">{estudio.medico.especialidad}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo de Estudio</p>
              <p className="font-medium">{estudio.tipoEstudio}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Zona</p>
              <p className="font-medium">{estudio.zona}</p>
            </div>
          </div>
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-600 mb-1">Indicación Clínica</p>
            <p className="text-sm">{estudio.indicacionClinica}</p>
          </div>
        </CardContent>
      </Card>

      {/* Informe Radiológico */}
      {estudio.resultado && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informe Radiológico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">HALLAZGOS:</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {estudio.resultado.hallazgos}
                </p>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm font-semibold text-gray-700 mb-2">CONCLUSIÓN:</p>
                <p className="text-sm text-gray-700 font-medium">
                  {estudio.resultado.conclusion}
                </p>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm font-semibold text-gray-700 mb-2">RECOMENDACIONES:</p>
                <p className="text-sm text-gray-700">
                  {estudio.resultado.recomendaciones}
                </p>
              </div>

              <div className="pt-3 border-t flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Radiólogo</p>
                  <p className="text-sm font-medium">{estudio.radiologo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Fecha de Informe</p>
                  <p className="text-sm font-medium">{estudio.fechaInforme}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simulación de Visor de Imágenes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Imágenes ({estudio.resultado.imagenes})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(Math.min(estudio.resultado.imagenes, 6))].map((_, idx) => (
                  <div key={idx} className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center relative group cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Imagen {idx + 1}</p>
                    </div>
                    <div className="absolute inset-0 bg-cyan-500 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all" />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <Eye className="w-4 h-4 inline mr-1" />
                  Click en las imágenes para ver en visor DICOM (Simulación)
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
        <Button className="bg-gradient-to-r from-cyan-600 to-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Enviar a HCE
        </Button>
      </div>
    </div>
  );
}
