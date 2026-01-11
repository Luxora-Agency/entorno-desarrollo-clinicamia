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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Search, ChevronRight, ChevronDown, RefreshCw,
  Building2, Edit, Loader2, BarChart3, Eye, Building
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut } from '@/services/api';
import ReactECharts from 'echarts-for-react';

export default function CentrosCostoModule() {
  const [centros, setCentros] = useState([]);
  const [centrosArbol, setCentrosArbol] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [vistaArbol, setVistaArbol] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reporteDialogOpen, setReporteDialogOpen] = useState(false);
  const [editingCentro, setEditingCentro] = useState(null);
  const [selectedCentro, setSelectedCentro] = useState(null);
  const [reporteData, setReporteData] = useState(null);
  const [centrosPadre, setCentrosPadre] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'OPERATIVO',
    departamentoId: '',
    centroPadreId: ''
  });

  useEffect(() => {
    fetchCentros();
    fetchCentrosPadre();
    fetchDepartamentos();
  }, [filtroTipo]);

  const fetchCentros = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filtroTipo !== 'all') filters.tipo = filtroTipo;
      if (search) filters.search = search;

      const [listResponse, arbolResponse] = await Promise.all([
        apiGet('/contabilidad/centros-costo', filters),
        apiGet('/contabilidad/centros-costo/arbol')
      ]);

      setCentros(listResponse.data || []);
      setCentrosArbol(arbolResponse.data || []);
    } catch (error) {
      toast.error('Error cargando centros de costo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCentrosPadre = async () => {
    try {
      const response = await apiGet('/contabilidad/centros-costo/selector');
      setCentrosPadre(response.data || []);
    } catch (error) {
      console.error('Error cargando centros padre:', error);
    }
  };

  const fetchDepartamentos = async () => {
    try {
      const response = await apiGet('/departamentos');
      setDepartamentos(response.data || []);
    } catch (error) {
      console.error('Error cargando departamentos:', error);
    }
  };

  const handleInitFromDepartments = async () => {
    try {
      await apiPost('/contabilidad/centros-costo/inicializar');
      toast.success('Centros de costo inicializados desde departamentos');
      fetchCentros();
    } catch (error) {
      toast.error('Error inicializando: ' + error.message);
    }
  };

  const handleSyncSiigo = async () => {
    try {
      await apiPost('/contabilidad/centros-costo/sync-siigo');
      toast.success('Sincronización con Siigo completada');
      fetchCentros();
    } catch (error) {
      toast.error('Error sincronizando: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        departamentoId: formData.departamentoId || null,
        centroPadreId: formData.centroPadreId || null
      };

      if (editingCentro) {
        await apiPut(`/contabilidad/centros-costo/${editingCentro.id}`, submitData);
        toast.success('Centro de costo actualizado');
      } else {
        await apiPost('/contabilidad/centros-costo', submitData);
        toast.success('Centro de costo creado');
      }
      setDialogOpen(false);
      setEditingCentro(null);
      resetForm();
      fetchCentros();
      fetchCentrosPadre();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: 'OPERATIVO',
      departamentoId: '',
      centroPadreId: ''
    });
  };

  const openEditDialog = (centro) => {
    setEditingCentro(centro);
    setFormData({
      codigo: centro.codigo,
      nombre: centro.nombre,
      descripcion: centro.descripcion || '',
      tipo: centro.tipo,
      departamentoId: centro.departamentoId || '',
      centroPadreId: centro.centroPadreId || ''
    });
    setDialogOpen(true);
  };

  const openReporteDialog = async (centro) => {
    try {
      setSelectedCentro(centro);
      setReporteDialogOpen(true);

      const response = await apiGet(`/contabilidad/centros-costo/${centro.id}/reporte`, {
        fechaInicio: new Date(new Date().getFullYear(), 0, 1).toISOString(),
        fechaFin: new Date().toISOString()
      });

      setReporteData(response.data);
    } catch (error) {
      toast.error('Error cargando reporte: ' + error.message);
    }
  };

  const getTipoBadgeColor = (tipo) => {
    const colors = {
      'OPERATIVO': 'bg-blue-100 text-blue-800',
      'ADMINISTRATIVO': 'bg-purple-100 text-purple-800',
      'SOPORTE': 'bg-green-100 text-green-800',
      'COMERCIAL': 'bg-orange-100 text-orange-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const getChartOptions = () => {
    if (!reporteData?.movimientosPorMes) return {};

    const meses = reporteData.movimientosPorMes.map(m => m.mes);
    const debitos = reporteData.movimientosPorMes.map(m => parseFloat(m.debitos));
    const creditos = reporteData.movimientosPorMes.map(m => parseFloat(m.creditos));

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          let html = `<strong>${params[0].name}</strong><br/>`;
          params.forEach(p => {
            html += `${p.marker} ${p.seriesName}: ${formatCurrency(p.value)}<br/>`;
          });
          return html;
        }
      },
      legend: {
        data: ['Débitos', 'Créditos'],
        bottom: 0
      },
      xAxis: {
        type: 'category',
        data: meses
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value) => formatCurrency(value)
        }
      },
      series: [
        {
          name: 'Débitos',
          type: 'bar',
          data: debitos,
          itemStyle: { color: '#3b82f6' }
        },
        {
          name: 'Créditos',
          type: 'bar',
          data: creditos,
          itemStyle: { color: '#22c55e' }
        }
      ]
    };
  };

  const CentroArbolItem = ({ centro, nivel = 0 }) => {
    const [isOpen, setIsOpen] = useState(nivel < 2);
    const hasChildren = centro.hijos && centro.hijos.length > 0;

    return (
      <div className={`border-l-2 border-gray-200 ${nivel > 0 ? 'ml-4' : ''}`}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center py-2 px-3 hover:bg-muted/50">
            {hasChildren ? (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            ) : (
              <span className="w-6" />
            )}
            <span className="font-mono text-sm text-muted-foreground mr-2">{centro.codigo}</span>
            <span className="flex-1">{centro.nombre}</span>
            <Badge className={`${getTipoBadgeColor(centro.tipo)} mr-2`}>{centro.tipo}</Badge>
            {centro.departamento && (
              <Badge variant="outline" className="mr-2">
                <Building className="h-3 w-3 mr-1" />
                {centro.departamento.nombre}
              </Badge>
            )}
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => openReporteDialog(centro)}>
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openEditDialog(centro)}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {hasChildren && (
            <CollapsibleContent>
              {centro.hijos.map((hijo) => (
                <CentroArbolItem key={hijo.id} centro={hijo} nivel={nivel + 1} />
              ))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header y acciones */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Centros de Costo
              </CardTitle>
              <CardDescription>
                Gestión de centros de costo por departamento
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleInitFromDepartments}>
                <Building className="h-4 w-4 mr-1" />
                Desde Departamentos
              </Button>
              <Button variant="outline" size="sm" onClick={handleSyncSiigo}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync Siigo
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => { setEditingCentro(null); resetForm(); }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nuevo Centro
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingCentro ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Código *</Label>
                        <Input
                          value={formData.codigo}
                          onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                          placeholder="CC-001"
                          disabled={!!editingCentro}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Select
                          value={formData.tipo}
                          onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPERATIVO">Operativo</SelectItem>
                            <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                            <SelectItem value="SOPORTE">Soporte</SelectItem>
                            <SelectItem value="COMERCIAL">Comercial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Nombre del centro de costo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Input
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Descripción opcional"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Departamento</Label>
                        <Select
                          value={formData.departamentoId}
                          onValueChange={(v) => setFormData({ ...formData, departamentoId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin departamento</SelectItem>
                            {departamentos.map((d) => (
                              <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Centro Padre</Label>
                        <Select
                          value={formData.centroPadreId}
                          onValueChange={(v) => setFormData({ ...formData, centroPadreId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin padre (raíz)</SelectItem>
                            {centrosPadre
                              .filter(c => c.id !== editingCentro?.id)
                              .map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.codigo} - {c.nombre}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleSubmit} className="w-full">
                      {editingCentro ? 'Actualizar' : 'Crear'} Centro de Costo
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                onKeyDown={(e) => e.key === 'Enter' && fetchCentros()}
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="OPERATIVO">Operativo</SelectItem>
                <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                <SelectItem value="SOPORTE">Soporte</SelectItem>
                <SelectItem value="COMERCIAL">Comercial</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={vistaArbol ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVistaArbol(true)}
              >
                Árbol
              </Button>
              <Button
                variant={!vistaArbol ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVistaArbol(false)}
              >
                Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : vistaArbol ? (
            <div className="space-y-1">
              {centrosArbol.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay centros de costo registrados. Haga clic en "Desde Departamentos" para crear automáticamente.
                </div>
              ) : (
                centrosArbol.map((centro) => (
                  <CentroArbolItem key={centro.id} centro={centro} nivel={0} />
                ))
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Centro Padre</TableHead>
                  <TableHead>Siigo ID</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No hay centros de costo que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  centros.map((centro) => (
                    <TableRow key={centro.id}>
                      <TableCell className="font-mono">{centro.codigo}</TableCell>
                      <TableCell>{centro.nombre}</TableCell>
                      <TableCell>
                        <Badge className={getTipoBadgeColor(centro.tipo)}>
                          {centro.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{centro.departamento?.nombre || '-'}</TableCell>
                      <TableCell>{centro.centroPadre?.nombre || '-'}</TableCell>
                      <TableCell>
                        {centro.siigoId ? (
                          <Badge variant="outline" className="text-green-600">
                            {centro.siigoId}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            Sin sync
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openReporteDialog(centro)}>
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(centro)}>
                            <Edit className="h-4 w-4" />
                          </Button>
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

      {/* Dialog de Reporte */}
      <Dialog open={reporteDialogOpen} onOpenChange={setReporteDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Reporte: {selectedCentro?.nombre}
            </DialogTitle>
          </DialogHeader>

          {reporteData ? (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Total Débitos</div>
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(reporteData.resumen?.totalDebitos)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Total Créditos</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(reporteData.resumen?.totalCreditos)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Saldo Neto</div>
                    <div className={`text-xl font-bold ${
                      (reporteData.resumen?.saldoNeto || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(reporteData.resumen?.saldoNeto)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Total Movimientos</div>
                    <div className="text-xl font-bold">
                      {reporteData.resumen?.cantidadMovimientos || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico */}
              {reporteData.movimientosPorMes?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Movimientos por Mes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReactECharts option={getChartOptions()} style={{ height: '300px' }} />
                  </CardContent>
                </Card>
              )}

              {/* Movimientos por cuenta */}
              {reporteData.movimientosPorCuenta?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Distribución por Cuenta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cuenta</TableHead>
                          <TableHead className="text-right">Débitos</TableHead>
                          <TableHead className="text-right">Créditos</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reporteData.movimientosPorCuenta.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">
                              {item.cuentaCodigo} - {item.cuentaNombre}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.debitos)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.creditos)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              parseFloat(item.saldo) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(item.saldo)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Últimos movimientos */}
              {reporteData.ultimosMovimientos?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Últimos Movimientos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Asiento</TableHead>
                          <TableHead>Cuenta</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right">Débito</TableHead>
                          <TableHead className="text-right">Crédito</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reporteData.ultimosMovimientos.map((mov, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {new Date(mov.fecha).toLocaleDateString('es-CO')}
                            </TableCell>
                            <TableCell className="font-mono">{mov.asientoNumero}</TableCell>
                            <TableCell className="font-mono">{mov.cuentaCodigo}</TableCell>
                            <TableCell>{mov.descripcion}</TableCell>
                            <TableCell className="text-right">
                              {mov.debito > 0 ? formatCurrency(mov.debito) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {mov.credito > 0 ? formatCurrency(mov.credito) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
