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
  Edit
} from 'lucide-react';
import { useImagenologia } from '../../hooks/useImagenologia';
import PatientSelect from './PatientSelect'; // Asegúrate de que la ruta sea correcta
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ImagenologiaModule({ user }) {
  const { estudios, loading, stats, fetchEstudios, fetchStats, createEstudio, updateInforme, updateEstado } = useImagenologia();
  const [activeTab, setActiveTab] = useState('pendientes');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEstudios({ estado: activeTab === 'todos' ? '' : (activeTab === 'proceso' ? 'EnProceso' : (activeTab === 'completados' ? 'Completado' : 'Pendiente')) });
    fetchStats();
  }, [activeTab, fetchEstudios, fetchStats]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEstudios({ search: searchTerm, estado: activeTab === 'todos' ? '' : (activeTab === 'proceso' ? 'EnProceso' : (activeTab === 'completados' ? 'Completado' : 'Pendiente')) });
  };

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
              <FormularioNuevoEstudio 
                onClose={() => setShowNewOrder(false)} 
                onSubmit={async (data) => {
                  await createEstudio(data);
                  setShowNewOrder(false);
                  fetchStats();
                  fetchEstudios();
                }}
              />
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
                  <p className="text-2xl font-bold text-gray-900">{stats?.pendientes || 0}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats?.enProceso || 0}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats?.completadosHoy || 0}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalMes || 0}</p>
                </div>
                <Scan className="w-8 h-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por ID, paciente o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="ghost">Buscar</Button>
            </form>
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
                    {loading ? (
                       <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">Cargando...</TableCell>
                       </TableRow>
                    ) : estudios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                          No se encontraron estudios
                        </TableCell>
                      </TableRow>
                    ) : (
                      estudios.map((estudio) => (
                        <TableRow key={estudio.id}>
                          <TableCell className="font-medium text-xs">{estudio.codigo || estudio.id.substring(0, 8)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{estudio.paciente?.nombre} {estudio.paciente?.apellido}</p>
                              <p className="text-xs text-gray-500">CC: {estudio.paciente?.cedula}</p>
                              <p className="text-xs text-gray-500">{estudio.paciente?.edad} años</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{estudio.medicoSolicitante?.nombre} {estudio.medicoSolicitante?.apellido}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getIconoEstudio(estudio.tipoEstudio)}
                              <span className="text-sm">{estudio.tipoEstudio}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{estudio.zonaCuerpo}</TableCell>
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
                            {estudio.fechaSolicitud && format(new Date(estudio.fechaSolicitud), 'dd/MM/yyyy', { locale: es })}
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
                                {estudio.estado === 'Completado' ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                              </Button>
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
              <DialogTitle>
                  {selectedStudy?.estado === 'Completado' ? 'Informe Radiológico' : 'Gestión de Estudio'}
              </DialogTitle>
            </DialogHeader>
            {selectedStudy && (
              <DetalleInforme 
                estudio={selectedStudy} 
                onUpdate={updateInforme} 
                onStatusChange={updateEstado}
                refresh={() => {
                    fetchEstudios();
                    setShowResults(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Componente de Formulario de Nuevo Estudio
function FormularioNuevoEstudio({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    pacienteId: '',
    tipoEstudio: '',
    zonaCuerpo: '',
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
    if (!formData.pacienteId) {
        alert('Seleccione un paciente');
        return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label>Paciente *</Label>
          <PatientSelect 
            onSelect={(p) => setFormData({...formData, pacienteId: p.id})} 
          />
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
          <Select value={formData.zonaCuerpo} onValueChange={(val) => setFormData({...formData, zonaCuerpo: val})} required>
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

// Componente de Detalle de Informe (Lectura/Escritura)
function DetalleInforme({ estudio, onUpdate, onStatusChange, refresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [reportData, setReportData] = useState({
      hallazgos: estudio.hallazgos || '',
      conclusion: estudio.conclusion || '',
      recomendaciones: estudio.recomendaciones || ''
  });

  const handleSave = async () => {
      await onUpdate(estudio.id, reportData);
      setIsEditing(false);
      refresh();
  };

  const handleStatus = async (newStatus) => {
      await onStatusChange(estudio.id, newStatus);
      refresh();
  };

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
              <p className="font-medium">{estudio.codigo || estudio.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge className={estudio.estado === 'Completado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {estudio.estado}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paciente</p>
              <p className="font-medium">{estudio.paciente?.nombre} {estudio.paciente?.apellido}</p>
              <p className="text-xs text-gray-500">CC: {estudio.paciente?.cedula}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Médico Solicitante</p>
              <p className="font-medium">{estudio.medicoSolicitante?.nombre} {estudio.medicoSolicitante?.apellido}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo de Estudio</p>
              <p className="font-medium">{estudio.tipoEstudio}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Zona</p>
              <p className="font-medium">{estudio.zonaCuerpo}</p>
            </div>
          </div>
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-600 mb-1">Indicación Clínica</p>
            <p className="text-sm">{estudio.indicacionClinica}</p>
          </div>
        </CardContent>
      </Card>

      {/* Acciones de estado */}
      {estudio.estado === 'Pendiente' && (
          <div className="flex justify-end">
              <Button onClick={() => handleStatus('EnProceso')} className="bg-blue-600">
                  Iniciar Estudio
              </Button>
          </div>
      )}

      {/* Informe Radiológico */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Informe Radiológico</CardTitle>
          {!isEditing && estudio.estado !== 'Pendiente' && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  {estudio.estado === 'Completado' ? 'Editar Informe' : 'Redactar Informe'}
              </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
              <div className="space-y-4">
                  <div>
                      <Label>Hallazgos</Label>
                      <Textarea 
                          value={reportData.hallazgos} 
                          onChange={e => setReportData({...reportData, hallazgos: e.target.value})}
                          rows={6}
                      />
                  </div>
                  <div>
                      <Label>Conclusión</Label>
                      <Textarea 
                          value={reportData.conclusion} 
                          onChange={e => setReportData({...reportData, conclusion: e.target.value})}
                          rows={3}
                      />
                  </div>
                  <div>
                      <Label>Recomendaciones</Label>
                      <Textarea 
                          value={reportData.recomendaciones} 
                          onChange={e => setReportData({...reportData, recomendaciones: e.target.value})}
                          rows={2}
                      />
                  </div>
                  <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                      <Button onClick={handleSave}>Guardar y Finalizar</Button>
                  </div>
              </div>
          ) : (
              <>
                {estudio.hallazgos ? (
                    <>
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">HALLAZGOS:</p>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {estudio.hallazgos}
                            </p>
                        </div>

                        <div className="pt-3 border-t">
                            <p className="text-sm font-semibold text-gray-700 mb-2">CONCLUSIÓN:</p>
                            <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap">
                            {estudio.conclusion}
                            </p>
                        </div>

                        <div className="pt-3 border-t">
                            <p className="text-sm font-semibold text-gray-700 mb-2">RECOMENDACIONES:</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {estudio.recomendaciones}
                            </p>
                        </div>

                        <div className="pt-3 border-t flex items-center justify-between">
                            <div>
                            <p className="text-sm text-gray-600">Radiólogo</p>
                            <p className="text-sm font-medium">{estudio.radiologo?.nombre} {estudio.radiologo?.apellido}</p>
                            </div>
                            <div className="text-right">
                            <p className="text-sm text-gray-600">Fecha de Informe</p>
                            <p className="text-sm font-medium">{estudio.fechaInforme && format(new Date(estudio.fechaInforme), 'dd/MM/yyyy HH:mm')}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-gray-500 italic text-center py-4">Informe pendiente de redacción</p>
                )}
              </>
          )}
        </CardContent>
      </Card>

      {/* Simulación de Visor de Imágenes (Solo visual) */}
      <Card>
        <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Imágenes
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Módulo de carga y visualización de imágenes (PACS)</p>
                <p className="text-xs text-gray-400">Integración con servidor DICOM pendiente</p>
                <Button variant="outline" className="mt-4">
                    <Download className="w-4 h-4 mr-2" /> Subir Imágenes (Simulación)
                </Button>
            </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
        {estudio.estado === 'Completado' && (
             <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
            </Button>
        )}
        <Button className="bg-gradient-to-r from-cyan-600 to-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Enviar a HCE
        </Button>
      </div>
    </div>
  );
}
