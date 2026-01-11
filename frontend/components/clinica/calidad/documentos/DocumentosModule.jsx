'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDocumentosCalidad } from '@/hooks/useDocumentosCalidad';
import { useToast } from '@/hooks/use-toast';
import { TIPOS_DOCUMENTO_CALIDAD, ESTADOS_DOCUMENTO } from '@/constants/calidad';
import {
  FileText,
  Search,
  Plus,
  Eye,
  RefreshCw,
  Upload,
  Download,
  History,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Edit,
  FileCheck,
} from 'lucide-react';

export default function DocumentosModule({ user }) {
  const { toast } = useToast();
  const {
    documentos,
    historialVersiones,
    socializaciones,
    loading,
    fetchDocumentos,
    fetchHistorialVersiones,
    fetchSocializaciones,
    createDocumento,
    updateDocumento,
    createSocializacion,
  } = useDocumentosCalidad();

  const [activeTab, setActiveTab] = useState('listado');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [selectedDocumento, setSelectedDocumento] = useState(null);
  const [showNuevoDocumento, setShowNuevoDocumento] = useState(false);
  const [showSocializacion, setShowSocializacion] = useState(false);

  const [nuevoDocumento, setNuevoDocumento] = useState({
    codigo: '',
    nombre: '',
    tipo: '',
    version: '1.0',
    resumen: '',
    procesoRelacionado: '',
    palabrasClave: '',
  });

  const [nuevaSocializacion, setNuevaSocializacion] = useState({
    documentoId: '',
    fechaSocializacion: '',
    metodologia: '',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchDocumentos();
  };

  const handleSelectDocumento = async (documento) => {
    setSelectedDocumento(documento);
    await Promise.all([
      fetchHistorialVersiones(documento.id),
      fetchSocializaciones(documento.id),
    ]);
  };

  const handleCrearDocumento = async () => {
    if (!nuevoDocumento.codigo || !nuevoDocumento.nombre || !nuevoDocumento.tipo) {
      toast({ title: 'Complete los campos requeridos', variant: 'destructive' });
      return;
    }

    const result = await createDocumento({
      ...nuevoDocumento,
      palabrasClave: nuevoDocumento.palabrasClave.split(',').map(p => p.trim()).filter(p => p),
    });

    if (result.success) {
      toast({ title: 'Documento creado exitosamente' });
      setShowNuevoDocumento(false);
      setNuevoDocumento({
        codigo: '',
        nombre: '',
        tipo: '',
        version: '1.0',
        resumen: '',
        procesoRelacionado: '',
        palabrasClave: '',
      });
      await fetchDocumentos();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleCrearSocializacion = async () => {
    if (!nuevaSocializacion.documentoId || !nuevaSocializacion.fechaSocializacion || !nuevaSocializacion.metodologia) {
      toast({ title: 'Complete los campos requeridos', variant: 'destructive' });
      return;
    }

    const result = await createSocializacion(nuevaSocializacion);
    if (result.success) {
      toast({ title: 'Socialización registrada' });
      setShowSocializacion(false);
      if (selectedDocumento) {
        await fetchSocializaciones(selectedDocumento.id);
      }
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'VIGENTE': return 'bg-green-100 text-green-700';
      case 'APROBADO': return 'bg-blue-100 text-blue-700';
      case 'EN_REVISION': return 'bg-yellow-100 text-yellow-700';
      case 'BORRADOR': return 'bg-gray-100 text-gray-700';
      case 'OBSOLETO': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'POLITICA': return <FileCheck className="h-4 w-4" />;
      case 'MANUAL': return <FileText className="h-4 w-4" />;
      case 'PROTOCOLO': return <FileText className="h-4 w-4" />;
      case 'PROCEDIMIENTO': return <FileText className="h-4 w-4" />;
      case 'FORMATO': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Estadísticas
  const documentosVigentes = documentos.filter(d => d.estado === 'VIGENTE').length;
  const documentosEnRevision = documentos.filter(d => d.estado === 'EN_REVISION').length;
  const documentosBorrador = documentos.filter(d => d.estado === 'BORRADOR').length;
  const documentosProximosVencer = documentos.filter(d => {
    if (!d.fechaProximaRevision) return false;
    const fechaRevision = new Date(d.fechaProximaRevision);
    const now = new Date();
    const diffDays = Math.ceil((fechaRevision - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Gestión Documental de Calidad
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Control de documentos, versiones y socialización
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={showNuevoDocumento} onOpenChange={setShowNuevoDocumento}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Código *</label>
                    <Input
                      placeholder="DOC-001"
                      value={nuevoDocumento.codigo}
                      onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, codigo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Versión *</label>
                    <Input
                      value={nuevoDocumento.version}
                      onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, version: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    placeholder="Nombre del documento"
                    value={nuevoDocumento.nombre}
                    onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo *</label>
                  <Select
                    value={nuevoDocumento.tipo}
                    onValueChange={(value) => setNuevoDocumento({ ...nuevoDocumento, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPOS_DOCUMENTO_CALIDAD).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Proceso Relacionado</label>
                  <Input
                    placeholder="Proceso al que pertenece"
                    value={nuevoDocumento.procesoRelacionado}
                    onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, procesoRelacionado: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Resumen</label>
                  <Textarea
                    placeholder="Breve descripción del documento"
                    value={nuevoDocumento.resumen}
                    onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, resumen: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Palabras Clave</label>
                  <Input
                    placeholder="Separadas por coma"
                    value={nuevoDocumento.palabrasClave}
                    onChange={(e) => setNuevoDocumento({ ...nuevoDocumento, palabrasClave: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNuevoDocumento(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCrearDocumento}>
                    Crear Documento
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vigentes</p>
                <p className="text-2xl font-bold text-green-600">{documentosVigentes}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En Revisión</p>
                <p className="text-2xl font-bold text-yellow-600">{documentosEnRevision}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Borradores</p>
                <p className="text-2xl font-bold text-gray-600">{documentosBorrador}</p>
              </div>
              <Edit className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Próximos a Revisar</p>
                <p className="text-2xl font-bold text-orange-600">{documentosProximosVencer}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="listado">Listado Maestro</TabsTrigger>
          <TabsTrigger value="historial">Historial de Versiones</TabsTrigger>
          <TabsTrigger value="socializacion">Socialización</TabsTrigger>
        </TabsList>

        {/* Tab: Listado Maestro */}
        <TabsContent value="listado" className="space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(TIPOS_DOCUMENTO_CALIDAD).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(ESTADOS_DOCUMENTO).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Versión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Próxima Revisión</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentos
                .filter(d => {
                  const matchSearch = searchTerm === '' ||
                    d.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    d.nombre.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchTipo = filtroTipo === 'all' || d.tipo === filtroTipo;
                  const matchEstado = filtroEstado === 'all' || d.estado === filtroEstado;
                  return matchSearch && matchTipo && matchEstado;
                })
                .map((documento, index) => (
                  <TableRow
                    key={index}
                    className={`cursor-pointer ${selectedDocumento?.id === documento.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleSelectDocumento(documento)}
                  >
                    <TableCell className="font-mono">{documento.codigo}</TableCell>
                    <TableCell className="max-w-xs truncate font-medium">
                      {documento.nombre}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {getTipoIcon(documento.tipo)}
                        {TIPOS_DOCUMENTO_CALIDAD[documento.tipo]?.label || documento.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{documento.version}</TableCell>
                    <TableCell>
                      <Badge className={getEstadoColor(documento.estado)}>
                        {ESTADOS_DOCUMENTO[documento.estado]?.label || documento.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {documento.fechaProximaRevision
                        ? new Date(documento.fechaProximaRevision).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {documentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No hay documentos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab: Historial de Versiones */}
        <TabsContent value="historial" className="space-y-4">
          {selectedDocumento ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historial - {selectedDocumento.codigo}: {selectedDocumento.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {historialVersiones.length > 0 ? (
                    <div className="space-y-4">
                      {historialVersiones.map((version, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-16 text-center">
                            <Badge variant="outline" className="font-mono">
                              v{version.versionNueva}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(version.fechaCambio).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{version.cambiosRealizados}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Modificado por: {version.modificador?.nombre || 'N/A'}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge variant="outline">
                              v{version.versionAnterior} → v{version.versionNueva}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No hay historial de versiones para este documento
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Seleccione un documento del listado maestro para ver su historial
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Socialización */}
        <TabsContent value="socializacion" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Registro de Socializaciones</h3>
            <Dialog open={showSocializacion} onOpenChange={setShowSocializacion}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Socialización
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Socialización</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Documento *</label>
                    <Select
                      value={nuevaSocializacion.documentoId}
                      onValueChange={(value) => setNuevaSocializacion({ ...nuevaSocializacion, documentoId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione documento" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentos
                          .filter(d => d.estado === 'VIGENTE')
                          .map(doc => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.codigo} - {doc.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fecha de Socialización *</label>
                    <Input
                      type="datetime-local"
                      value={nuevaSocializacion.fechaSocializacion}
                      onChange={(e) => setNuevaSocializacion({ ...nuevaSocializacion, fechaSocializacion: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Metodología *</label>
                    <Select
                      value={nuevaSocializacion.metodologia}
                      onValueChange={(value) => setNuevaSocializacion({ ...nuevaSocializacion, metodologia: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Capacitacion">Capacitación</SelectItem>
                        <SelectItem value="Reunion">Reunión</SelectItem>
                        <SelectItem value="Correo">Correo Electrónico</SelectItem>
                        <SelectItem value="Plataforma">Plataforma Virtual</SelectItem>
                        <SelectItem value="Cartelera">Cartelera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Observaciones</label>
                    <Textarea
                      value={nuevaSocializacion.observaciones}
                      onChange={(e) => setNuevaSocializacion({ ...nuevaSocializacion, observaciones: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowSocializacion(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCrearSocializacion}>
                      Registrar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {selectedDocumento ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Socializaciones - {selectedDocumento.codigo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {socializaciones.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Metodología</TableHead>
                        <TableHead>Realizado por</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {socializaciones.map((soc, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(soc.fechaSocializacion).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{soc.metodologia}</Badge>
                          </TableCell>
                          <TableCell>{soc.realizador?.nombre || 'N/A'}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {soc.observaciones || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No hay socializaciones registradas para este documento
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Seleccione un documento del listado maestro para ver sus socializaciones
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
