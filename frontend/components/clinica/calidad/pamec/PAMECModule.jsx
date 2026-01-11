'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePAMEC } from '@/hooks/usePAMEC';
import { useToast } from '@/hooks/use-toast';
import { PASOS_RUTA_CRITICA } from '@/constants/calidad';
import {
  ClipboardCheck,
  Users,
  Target,
  BarChart3,
  Search,
  Plus,
  Eye,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function PAMECModule({ user }) {
  const { toast } = useToast();
  const {
    equipo,
    procesos,
    indicadores,
    auditorias,
    hallazgos,
    dashboard,
    loading,
    fetchEquipo,
    fetchProcesos,
    fetchIndicadores,
    fetchAuditorias,
    fetchHallazgos,
    fetchDashboard,
    getRutaCritica,
  } = usePAMEC();

  const [activeTab, setActiveTab] = useState('ruta-critica');
  const [rutaCritica, setRutaCritica] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchEquipo(),
      fetchProcesos(),
      fetchIndicadores(),
      fetchAuditorias(),
      fetchDashboard(),
    ]);
    const rcResult = await getRutaCritica();
    if (rcResult.success) {
      setRutaCritica(rcResult.data);
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-green-600" />
            PAMEC - Programa de Auditor\u00eda para el Mejoramiento de la Calidad
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Ruta cr\u00edtica de 9 pasos para el mejoramiento continuo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proceso
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ruta-critica">Ruta Cr\u00edtica</TabsTrigger>
          <TabsTrigger value="equipo">Equipo PAMEC</TabsTrigger>
          <TabsTrigger value="procesos">Procesos</TabsTrigger>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
          <TabsTrigger value="auditorias">Auditor\u00edas</TabsTrigger>
          <TabsTrigger value="hallazgos">Hallazgos</TabsTrigger>
        </TabsList>

        {/* Tab: Ruta Cr\u00edtica */}
        <TabsContent value="ruta-critica" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Los 9 Pasos de la Ruta Cr\u00edtica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PASOS_RUTA_CRITICA.map((paso, index) => (
                  <div
                    key={paso.numero}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      index < 3 ? 'bg-green-100 text-green-700' :
                      index < 6 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      <span className="font-bold">{paso.numero}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{paso.nombre}</h4>
                      <p className="text-sm text-gray-500 mt-1">{paso.descripcion}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{paso.fase}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {paso.herramientas.slice(0, 2).join(', ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Progress value={rutaCritica?.progreso?.[paso.numero] || 0} className="w-24 h-2" />
                      <p className="text-xs text-gray-500 text-right mt-1">
                        {rutaCritica?.progreso?.[paso.numero] || 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Equipo */}
        <TabsContent value="equipo" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Equipo PAMEC</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Miembro
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipo.map((miembro, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">{miembro.usuario?.nombre || 'Usuario'}</p>
                      <p className="text-sm text-gray-500">{miembro.rol}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant={miembro.activo ? 'default' : 'secondary'}>
                      {miembro.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Desde: {new Date(miembro.fechaIngreso).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {equipo.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-gray-500">
                  No hay miembros en el equipo PAMEC
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Procesos */}
        <TabsContent value="procesos" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar proceso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>\u00c1rea</TableHead>
                <TableHead>Calidad Observada</TableHead>
                <TableHead>Calidad Esperada</TableHead>
                <TableHead>Brecha</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procesos
                .filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((proceso, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{proceso.nombre}</TableCell>
                    <TableCell>{proceso.areaResponsable}</TableCell>
                    <TableCell>{proceso.calidadObservada}%</TableCell>
                    <TableCell>{proceso.calidadEsperada}%</TableCell>
                    <TableCell>
                      <Badge variant={proceso.brecha > 20 ? 'destructive' : 'outline'}>
                        {proceso.brecha}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{proceso.prioridad}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{proceso.estado}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              {procesos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No hay procesos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab: Indicadores */}
        <TabsContent value="indicadores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicadores.map((indicador, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">{indicador.codigo}</Badge>
                      <h4 className="font-medium">{indicador.nombre}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {indicador.objetivo}
                      </p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Meta: {indicador.metaInstitucional}</span>
                    <Badge>{indicador.frecuenciaMedicion}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {indicadores.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-gray-500">
                  No hay indicadores registrados
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Auditor\u00edas */}
        <TabsContent value="auditorias" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Auditor\u00edas PAMEC</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Programar Auditor\u00eda
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Proceso</TableHead>
                <TableHead>Auditor</TableHead>
                <TableHead>Fecha Programada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditorias.map((auditoria, index) => (
                <TableRow key={index}>
                  <TableCell>{auditoria.tipoAuditoria}</TableCell>
                  <TableCell>{auditoria.proceso?.nombre || 'N/A'}</TableCell>
                  <TableCell>{auditoria.auditor?.usuario?.nombre || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(auditoria.fechaProgramada).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{auditoria.estado}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {auditorias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No hay auditor\u00edas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab: Hallazgos */}
        <TabsContent value="hallazgos" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripci\u00f3n</TableHead>
                <TableHead>Auditor\u00eda</TableHead>
                <TableHead>Requiere Acci\u00f3n</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hallazgos.map((hallazgo, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant={hallazgo.tipo === 'NC_Mayor' ? 'destructive' : 'outline'}>
                      {hallazgo.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{hallazgo.descripcion}</TableCell>
                  <TableCell>{hallazgo.auditoria?.tipoAuditoria || 'N/A'}</TableCell>
                  <TableCell>
                    {hallazgo.requiereAccion ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{hallazgo.estado}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {hallazgos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No hay hallazgos registrados
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
