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
import { useComites } from '@/hooks/useComites';
import { useToast } from '@/hooks/use-toast';
import { COMITES_OBLIGATORIOS } from '@/constants/calidad';
import {
  Users,
  Calendar,
  FileText,
  Search,
  Plus,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserPlus,
  ClipboardList,
} from 'lucide-react';

export default function ComitesModule({ user }) {
  const { toast } = useToast();
  const {
    comites,
    integrantes,
    reuniones,
    compromisos,
    loading,
    fetchComites,
    fetchIntegrantes,
    fetchReuniones,
    fetchCompromisos,
    createReunion,
    updateCompromiso,
  } = useComites();

  const [activeTab, setActiveTab] = useState('comites');
  const [selectedComite, setSelectedComite] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNuevaReunion, setShowNuevaReunion] = useState(false);
  const [nuevaReunion, setNuevaReunion] = useState({
    comiteId: '',
    fechaProgramada: '',
    lugar: '',
    ordenDelDia: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchComites(),
      fetchReuniones(),
      fetchCompromisos(),
    ]);
  };

  const handleSelectComite = async (comite) => {
    setSelectedComite(comite);
    await fetchIntegrantes(comite.id);
  };

  const handleCrearReunion = async () => {
    if (!nuevaReunion.comiteId || !nuevaReunion.fechaProgramada) {
      toast({ title: 'Complete los campos requeridos', variant: 'destructive' });
      return;
    }

    const result = await createReunion({
      ...nuevaReunion,
      ordenDelDia: nuevaReunion.ordenDelDia.split('\n').filter(i => i.trim()),
    });

    if (result.success) {
      toast({ title: 'Reunión programada exitosamente' });
      setShowNuevaReunion(false);
      setNuevaReunion({ comiteId: '', fechaProgramada: '', lugar: '', ordenDelDia: '' });
      await fetchReuniones();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleActualizarCompromiso = async (compromisoId, nuevoEstado) => {
    const result = await updateCompromiso(compromisoId, { estado: nuevoEstado });
    if (result.success) {
      toast({ title: 'Compromiso actualizado' });
      await fetchCompromisos();
    }
  };

  const getEstadoCompromisoColor = (estado) => {
    switch (estado) {
      case 'Cumplido': return 'bg-green-100 text-green-700';
      case 'Vencido': return 'bg-red-100 text-red-700';
      case 'En Proceso': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'Presidente': return 'bg-purple-100 text-purple-700';
      case 'Secretario': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Estadísticas
  const comitesActivos = comites.filter(c => c.activo).length;
  const reunionesEsteMes = reuniones.filter(r => {
    const fecha = new Date(r.fechaProgramada);
    const now = new Date();
    return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
  }).length;
  const compromisosPendientes = compromisos.filter(c => c.estado === 'Pendiente').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Comités Institucionales
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de comités obligatorios según normativa vigente
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={showNuevaReunion} onOpenChange={setShowNuevaReunion}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Programar Reunión
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programar Nueva Reunión</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Comité *</label>
                  <Select
                    value={nuevaReunion.comiteId}
                    onValueChange={(value) => setNuevaReunion({ ...nuevaReunion, comiteId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione comité" />
                    </SelectTrigger>
                    <SelectContent>
                      {comites.map(comite => (
                        <SelectItem key={comite.id} value={comite.id}>
                          {comite.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha Programada *</label>
                  <Input
                    type="datetime-local"
                    value={nuevaReunion.fechaProgramada}
                    onChange={(e) => setNuevaReunion({ ...nuevaReunion, fechaProgramada: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Lugar</label>
                  <Input
                    placeholder="Sala de reuniones, virtual, etc."
                    value={nuevaReunion.lugar}
                    onChange={(e) => setNuevaReunion({ ...nuevaReunion, lugar: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Orden del Día</label>
                  <Textarea
                    placeholder="Un tema por línea"
                    rows={4}
                    value={nuevaReunion.ordenDelDia}
                    onChange={(e) => setNuevaReunion({ ...nuevaReunion, ordenDelDia: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNuevaReunion(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCrearReunion}>
                    Programar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Comités Activos</p>
                <p className="text-2xl font-bold">{comitesActivos}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reuniones Este Mes</p>
                <p className="text-2xl font-bold">{reunionesEsteMes}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Compromisos Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{compromisosPendientes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="comites">Comités</TabsTrigger>
          <TabsTrigger value="reuniones">Reuniones</TabsTrigger>
          <TabsTrigger value="compromisos">Compromisos</TabsTrigger>
        </TabsList>

        {/* Tab: Comités */}
        <TabsContent value="comites" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comites.map((comite, index) => (
              <Card
                key={index}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedComite?.id === comite.id ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => handleSelectComite(comite)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono">{comite.codigo}</Badge>
                        <Badge variant={comite.activo ? 'default' : 'secondary'}>
                          {comite.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <h4 className="font-medium line-clamp-2">{comite.nombre}</h4>
                      {comite.normativaBase && (
                        <p className="text-xs text-gray-500 mt-1">{comite.normativaBase}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      <Users className="h-4 w-4 inline mr-1" />
                      {comite._count?.integrantes || 0} integrantes
                    </span>
                    <Badge variant="outline">{comite.periodicidad}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {comites.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-gray-500">
                  No hay comités registrados
                </CardContent>
              </Card>
            )}
          </div>

          {/* Detalle del comité seleccionado */}
          {selectedComite && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Integrantes - {selectedComite.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {integrantes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Acta Designación</TableHead>
                        <TableHead>Fecha Ingreso</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {integrantes.map((integrante, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {integrante.usuario?.nombre || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getRolColor(integrante.rol)}>
                              {integrante.rol}
                            </Badge>
                          </TableCell>
                          <TableCell>{integrante.actaDesignacion || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(integrante.fechaIngreso).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={integrante.activo ? 'default' : 'secondary'}>
                              {integrante.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No hay integrantes registrados en este comité
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Reuniones */}
        <TabsContent value="reuniones" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar reunión..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Acta</TableHead>
                <TableHead>Comité</TableHead>
                <TableHead>Fecha Programada</TableHead>
                <TableHead>Lugar</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reuniones
                .filter(r =>
                  r.comite?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  r.numeroActa?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((reunion, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{reunion.numeroActa || '-'}</TableCell>
                    <TableCell>{reunion.comite?.nombre || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(reunion.fechaProgramada).toLocaleString()}
                    </TableCell>
                    <TableCell>{reunion.lugar || 'Por definir'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{reunion.estado}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {reuniones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No hay reuniones programadas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab: Compromisos */}
        <TabsContent value="compromisos" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comité</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compromisos.map((compromiso, index) => {
                const vencido = new Date(compromiso.fechaLimite) < new Date() &&
                  compromiso.estado === 'Pendiente';
                return (
                  <TableRow key={index} className={vencido ? 'bg-red-50' : ''}>
                    <TableCell>{compromiso.reunion?.comite?.nombre || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {compromiso.descripcion}
                    </TableCell>
                    <TableCell>{compromiso.responsable?.nombre || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={vencido ? 'text-red-600 font-medium' : ''}>
                        {new Date(compromiso.fechaLimite).toLocaleDateString()}
                        {vencido && <AlertCircle className="h-4 w-4 inline ml-1" />}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstadoCompromisoColor(compromiso.estado)}>
                        {compromiso.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {compromiso.estado !== 'Cumplido' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActualizarCompromiso(compromiso.id, 'Cumplido')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Cumplir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {compromisos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No hay compromisos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
