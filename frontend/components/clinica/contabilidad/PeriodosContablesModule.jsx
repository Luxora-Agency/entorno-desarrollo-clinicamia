'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar, Plus, Lock, Unlock, AlertTriangle, CheckCircle,
  Clock, Loader2, FileText, CalendarPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/services/api';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  ,
      timeZone: 'America/Bogota'
    });
};

export default function PeriodosContablesModule() {
  const [periodos, setPeriodos] = useState([]);
  const [periodoActual, setPeriodoActual] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriodo, setSelectedPeriodo] = useState(null);
  const [dialogType, setDialogType] = useState(null);
  const [motivo, setMotivo] = useState('');

  const currentDate = new Date();
  const [anioFiltro, setAnioFiltro] = useState(currentDate.getFullYear());
  const [formAnio, setFormAnio] = useState(currentDate.getFullYear() + 1);

  useEffect(() => {
    fetchPeriodos();
    fetchStats();
  }, [anioFiltro]);

  const fetchPeriodos = async () => {
    try {
      setLoading(true);
      const [periodosRes, actualRes] = await Promise.all([
        apiGet('/contabilidad/periodos', { anio: anioFiltro }),
        apiGet('/contabilidad/periodos/actual')
      ]);
      setPeriodos(periodosRes.data || []);
      setPeriodoActual(actualRes.data);
    } catch (error) {
      toast.error('Error cargando períodos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiGet('/contabilidad/periodos/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleCrearPeriodo = async (anio, mes) => {
    try {
      await apiPost('/contabilidad/periodos', { anio, mes });
      toast.success('Período creado');
      fetchPeriodos();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleCrearPeriodosAnio = async () => {
    try {
      await apiPost('/contabilidad/periodos/crear-anio', { anio: formAnio });
      toast.success(`Períodos de ${formAnio} creados`);
      setAnioFiltro(formAnio);
      fetchPeriodos();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleCerrarPeriodo = async (periodoId) => {
    try {
      await apiPost(`/contabilidad/periodos/${periodoId}/cerrar`);
      toast.success('Período cerrado correctamente');
      fetchPeriodos();
      fetchStats();
    } catch (error) {
      toast.error('Error cerrando período: ' + error.message);
    }
  };

  const handleReabrirPeriodo = async (periodoId) => {
    if (!motivo) {
      toast.error('Debe ingresar un motivo para reabrir el período');
      return;
    }
    try {
      await apiPost(`/contabilidad/periodos/${periodoId}/reabrir`, { motivo });
      toast.success('Período reabierto');
      setDialogType(null);
      setMotivo('');
      fetchPeriodos();
      fetchStats();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleCierreAnual = async () => {
    try {
      await apiPost('/contabilidad/periodos/cierre-anual', { anio: anioFiltro });
      toast.success(`Cierre anual ${anioFiltro} realizado`);
      fetchPeriodos();
      fetchStats();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const getEstadoBadge = (estado) => {
    const config = {
      'ABIERTO': { color: 'bg-green-100 text-green-800', icon: Unlock },
      'CERRADO': { color: 'bg-red-100 text-red-800', icon: Lock },
    };
    const c = config[estado] || config['ABIERTO'];
    const Icon = c.icon;
    return (
      <Badge className={`${c.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {estado}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header y Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Período Actual</div>
                <div className="text-lg font-bold">{periodoActual?.nombre || '-'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">Períodos Abiertos</div>
                <div className="text-lg font-bold">{stats?.periodosAbiertos || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-sm text-muted-foreground">Períodos Cerrados</div>
                <div className="text-lg font-bold">{stats?.periodosCerrados || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Último Cierre</div>
                <div className="text-lg font-bold">{stats?.ultimoCierre || '-'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Períodos Contables
              </CardTitle>
              <CardDescription>
                Gestión de períodos y cierre contable
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <CalendarPlus className="h-4 w-4 mr-1" />
                    Crear Año
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Períodos del Año</DialogTitle>
                    <DialogDescription>
                      Se crearán los 12 períodos mensuales para el año seleccionado.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label>Año</Label>
                    <Select
                      value={String(formAnio)}
                      onValueChange={(v) => setFormAnio(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026, 2027].map(a => (
                          <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCrearPeriodosAnio}>
                      Crear Períodos
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <FileText className="h-4 w-4 mr-1" />
                    Cierre Anual
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cierre Anual {anioFiltro}</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción realizará el cierre anual del año {anioFiltro}:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Se verificará que todos los períodos estén cerrados</li>
                        <li>Se generará el asiento de cierre de resultados</li>
                        <li>Se trasladará la utilidad/pérdida al patrimonio</li>
                      </ul>
                      <p className="mt-2 font-bold text-destructive">Esta acción no se puede deshacer.</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCierreAnual}>
                      Realizar Cierre Anual
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="space-y-1">
              <Label className="text-xs">Año</Label>
              <Select
                value={String(anioFiltro)}
                onValueChange={(v) => setAnioFiltro(parseInt(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(a => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Períodos */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Asientos</TableHead>
                  <TableHead>Fecha Cierre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="space-y-2">
                        <p className="text-muted-foreground">No hay períodos para {anioFiltro}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setFormAnio(anioFiltro); }}
                        >
                          Crear períodos de {anioFiltro}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  periodos.map((periodo) => (
                    <TableRow
                      key={periodo.id}
                      className={periodo.id === periodoActual?.id ? 'bg-primary/5' : ''}
                    >
                      <TableCell className="font-medium">
                        {periodo.nombre}
                        {periodo.id === periodoActual?.id && (
                          <Badge variant="outline" className="ml-2">Actual</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(periodo.fechaInicio)}</TableCell>
                      <TableCell>{formatDate(periodo.fechaFin)}</TableCell>
                      <TableCell>{getEstadoBadge(periodo.estado)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{periodo._count?.asientos || 0}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(periodo.fechaCierre)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {periodo.estado === 'ABIERTO' ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Lock className="h-4 w-4 mr-1" />
                                  Cerrar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cerrar {periodo.nombre}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Al cerrar el período:
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                      <li>Se verificará que no haya asientos en borrador</li>
                                      <li>Se recalculará el libro mayor</li>
                                      <li>No se podrán crear más asientos en este período</li>
                                    </ul>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCerrarPeriodo(periodo.id)}>
                                    Cerrar Período
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Dialog
                              open={dialogType === `reabrir-${periodo.id}`}
                              onOpenChange={(open) => {
                                setDialogType(open ? `reabrir-${periodo.id}` : null);
                                if (!open) setMotivo('');
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Unlock className="h-4 w-4 mr-1" />
                                  Reabrir
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reabrir {periodo.nombre}</DialogTitle>
                                  <DialogDescription>
                                    Solo se puede reabrir si no hay períodos posteriores cerrados.
                                    Ingrese el motivo de la reapertura.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <Label>Motivo</Label>
                                  <Textarea
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    placeholder="Describa el motivo de la reapertura..."
                                    rows={3}
                                  />
                                </div>
                                <DialogFooter>
                                  <Button onClick={() => handleReabrirPeriodo(periodo.id)}>
                                    Reabrir Período
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
