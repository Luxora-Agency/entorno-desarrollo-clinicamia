'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePQRS } from '@/hooks/usePQRS';
import { useToast } from '@/hooks/use-toast';
import { TIPOS_PQRS, CANALES_PQRS, ESTADOS_PQRS, calcularDiasHabiles } from '@/constants/calidad';
import {
  MessageSquare,
  Search,
  Plus,
  Eye,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  Mail,
  Phone,
} from 'lucide-react';

export default function PQRSModule({ user }) {
  const { toast } = useToast();
  const {
    pqrs,
    dashboard,
    loading,
    fetchPQRS,
    fetchDashboard,
    createPQRS,
    responderPQRS,
    fetchPQRSPorVencer,
    fetchPQRSVencidas,
  } = usePQRS();

  const [activeTab, setActiveTab] = useState('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [showNuevoPQRS, setShowNuevoPQRS] = useState(false);
  const [pqrsVencidas, setPqrsVencidas] = useState([]);
  const [pqrsPorVencer, setPqrsPorVencer] = useState([]);

  const [nuevoPQRS, setNuevoPQRS] = useState({
    tipo: '',
    canal: '',
    nombrePeticionario: '',
    emailPeticionario: '',
    telefonoPeticionario: '',
    asunto: '',
    descripcion: '',
    esAnonimo: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchPQRS(),
      fetchDashboard(),
    ]);
    const vencidasResult = await fetchPQRSVencidas();
    const porVencerResult = await fetchPQRSPorVencer(5);
    if (vencidasResult.success) setPqrsVencidas(vencidasResult.data?.pqrs || []);
    if (porVencerResult.success) setPqrsPorVencer(porVencerResult.data?.pqrs || []);
  };

  const handleCrearPQRS = async () => {
    const result = await createPQRS(nuevoPQRS);
    if (result.success) {
      toast({ title: 'PQRS radicada exitosamente', description: `Radicado: ${result.data?.radicado}` });
      setShowNuevoPQRS(false);
      setNuevoPQRS({
        tipo: '', canal: '', nombrePeticionario: '', emailPeticionario: '',
        telefonoPeticionario: '', asunto: '', descripcion: '', esAnonimo: false,
      });
      loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const getTipoColor = (tipo) => {
    const colores = {
      PETICION: 'bg-blue-100 text-blue-700',
      QUEJA: 'bg-red-100 text-red-700',
      RECLAMO: 'bg-orange-100 text-orange-700',
      SUGERENCIA: 'bg-green-100 text-green-700',
      DENUNCIA: 'bg-purple-100 text-purple-700',
      FELICITACION: 'bg-yellow-100 text-yellow-700',
    };
    return colores[tipo] || 'bg-gray-100 text-gray-700';
  };

  const getEstadoColor = (estado) => {
    const colores = {
      RADICADA: 'bg-blue-100 text-blue-700',
      EN_TRAMITE: 'bg-yellow-100 text-yellow-700',
      RESPONDIDA: 'bg-green-100 text-green-700',
      CERRADA: 'bg-gray-100 text-gray-700',
      VENCIDA: 'bg-red-100 text-red-700',
    };
    return colores[estado] || 'bg-gray-100 text-gray-700';
  };

  const getDiasRestantes = (fechaLimite) => {
    const hoy = new Date();
    const limite = new Date(fechaLimite);
    const diff = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));
    return diff;
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-yellow-600" />
            PQRS - Peticiones, Quejas, Reclamos, Sugerencias
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Ley 1755/2015 - Derecho de petici\u00f3n
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setShowNuevoPQRS(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Radicar PQRS
          </Button>
        </div>
      </div>

      {/* Estad\u00edsticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Radicadas</p>
                <p className="text-2xl font-bold">{dashboard?.totalRadicadas || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En Tr\u00e1mite</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboard?.enTramite || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{pqrsVencidas.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Respondidas</p>
                <p className="text-2xl font-bold text-green-600">{dashboard?.respondidas || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de vencimiento */}
      {(pqrsVencidas.length > 0 || pqrsPorVencer.length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">Alertas de vencimiento</p>
                <p className="text-sm text-orange-700 mt-1">
                  {pqrsVencidas.length > 0 && `${pqrsVencidas.length} PQRS vencidas. `}
                  {pqrsPorVencer.length > 0 && `${pqrsPorVencer.length} por vencer en los pr\u00f3ximos 5 d\u00edas.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista de PQRS</TabsTrigger>
          <TabsTrigger value="vencidas">Vencidas ({pqrsVencidas.length})</TabsTrigger>
          <TabsTrigger value="estadisticas">Estad\u00edsticas</TabsTrigger>
        </TabsList>

        {/* Tab: Lista */}
        <TabsContent value="lista" className="space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por radicado o peticionario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(TIPOS_PQRS).map(([key, value]) => (
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
                {Object.entries(ESTADOS_PQRS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Radicado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Peticionario</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Fecha Radicaci\u00f3n</TableHead>
                <TableHead>D\u00edas Restantes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pqrs
                .filter(p => {
                  const matchSearch = searchTerm === '' ||
                    p.radicado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.nombrePeticionario?.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchTipo = filtroTipo === 'all' || p.tipo === filtroTipo;
                  const matchEstado = filtroEstado === 'all' || p.estado === filtroEstado;
                  return matchSearch && matchTipo && matchEstado;
                })
                .map((item, index) => {
                  const diasRestantes = getDiasRestantes(item.fechaLimiteRespuesta);
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{item.radicado}</TableCell>
                      <TableCell>
                        <Badge className={getTipoColor(item.tipo)}>
                          {TIPOS_PQRS[item.tipo]?.label || item.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.esAnonimo ? (
                          <span className="text-gray-400 italic">An\u00f3nimo</span>
                        ) : (
                          item.nombrePeticionario
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{item.asunto}</TableCell>
                      <TableCell>
                        {new Date(item.fechaRecepcion).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={diasRestantes < 0 ? 'destructive' : diasRestantes <= 3 ? 'warning' : 'outline'}>
                          {diasRestantes < 0 ? `Vencido (${Math.abs(diasRestantes)}d)` : `${diasRestantes}d`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(item.estado)}>
                          {ESTADOS_PQRS[item.estado]?.label || item.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {pqrs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No hay PQRS registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab: Vencidas */}
        <TabsContent value="vencidas" className="space-y-4">
          {pqrsVencidas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Radicado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Peticionario</TableHead>
                  <TableHead>D\u00edas Vencido</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pqrsVencidas.map((item, index) => (
                  <TableRow key={index} className="bg-red-50">
                    <TableCell className="font-mono">{item.radicado}</TableCell>
                    <TableCell>
                      <Badge className={getTipoColor(item.tipo)}>
                        {TIPOS_PQRS[item.tipo]?.label || item.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.nombrePeticionario}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {Math.abs(getDiasRestantes(item.fechaLimiteRespuesta))} d\u00edas
                      </Badge>
                    </TableCell>
                    <TableCell>{item.responsable?.nombre || 'Sin asignar'}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Responder
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                No hay PQRS vencidas
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Estad\u00edsticas */}
        <TabsContent value="estadisticas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(TIPOS_PQRS).map(([key, value]) => {
                    const count = pqrs.filter(p => p.tipo === key).length;
                    const percentage = pqrs.length > 0 ? Math.round((count / pqrs.length) * 100) : 0;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{value.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getTipoColor(key).replace('text-', 'bg-').replace('-100', '-400')}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(CANALES_PQRS).map(([key, value]) => {
                    const count = pqrs.filter(p => p.canal === key).length;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{value.label}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Nuevo PQRS */}
      <Dialog open={showNuevoPQRS} onOpenChange={setShowNuevoPQRS}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Radicar Nueva PQRS</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo *</label>
                <Select
                  value={nuevoPQRS.tipo}
                  onValueChange={(v) => setNuevoPQRS({ ...nuevoPQRS, tipo: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPOS_PQRS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Canal *</label>
                <Select
                  value={nuevoPQRS.canal}
                  onValueChange={(v) => setNuevoPQRS({ ...nuevoPQRS, canal: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CANALES_PQRS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonimo"
                checked={nuevoPQRS.esAnonimo}
                onChange={(e) => setNuevoPQRS({ ...nuevoPQRS, esAnonimo: e.target.checked })}
              />
              <label htmlFor="anonimo" className="text-sm">Es an\u00f3nimo</label>
            </div>
            {!nuevoPQRS.esAnonimo && (
              <>
                <div>
                  <label className="text-sm font-medium">Nombre del Peticionario *</label>
                  <Input
                    className="mt-1"
                    value={nuevoPQRS.nombrePeticionario}
                    onChange={(e) => setNuevoPQRS({ ...nuevoPQRS, nombrePeticionario: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      className="mt-1"
                      type="email"
                      value={nuevoPQRS.emailPeticionario}
                      onChange={(e) => setNuevoPQRS({ ...nuevoPQRS, emailPeticionario: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tel\u00e9fono</label>
                    <Input
                      className="mt-1"
                      value={nuevoPQRS.telefonoPeticionario}
                      onChange={(e) => setNuevoPQRS({ ...nuevoPQRS, telefonoPeticionario: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium">Asunto *</label>
              <Input
                className="mt-1"
                value={nuevoPQRS.asunto}
                onChange={(e) => setNuevoPQRS({ ...nuevoPQRS, asunto: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripci\u00f3n *</label>
              <Textarea
                className="mt-1"
                rows={4}
                value={nuevoPQRS.descripcion}
                onChange={(e) => setNuevoPQRS({ ...nuevoPQRS, descripcion: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNuevoPQRS(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCrearPQRS}>
                Radicar PQRS
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
