'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle, CheckCircle, Settings, RefreshCw, Loader2,
  CloudOff, Cloud, Database, FileText, Users, Package,
  ShieldCheck, AlertTriangle, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut } from '@/services/api';

export default function SiigoConfigModule({ user }) {
  const [activeTab, setActiveTab] = useState('config');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState(null);
  const [catalogs, setCatalogs] = useState({});
  const [formData, setFormData] = useState({
    userName: '',
    accessKey: '',
    ambiente: 'sandbox'
  });

  useEffect(() => {
    fetchConfig();
    fetchStatus();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/siigo/config');
      if (response.success && response.data) {
        setConfig(response.data);
        setFormData({
          userName: response.data.userName || '',
          accessKey: '',
          ambiente: response.data.ambiente || 'sandbox'
        });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await apiGet('/siigo/config/status');
      if (response.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Error cargando status:', error);
    }
  };

  const handleSaveConfig = async () => {
    // Validar: si no hay config existente, accessKey es requerido
    if (!formData.userName) {
      toast.error('Ingrese el email de usuario');
      return;
    }
    if (!config && !formData.accessKey) {
      toast.error('Ingrese el access key');
      return;
    }

    try {
      setSaving(true);
      // Solo enviar accessKey si se proporcionó uno nuevo
      const dataToSave = {
        userName: formData.userName,
        ambiente: formData.ambiente
      };
      if (formData.accessKey) {
        dataToSave.accessKey = formData.accessKey;
      }

      const response = await apiPut('/siigo/config', dataToSave);
      if (response.success) {
        toast.success('Configuración guardada exitosamente');
        setFormData(prev => ({ ...prev, accessKey: '' })); // Limpiar accessKey del form
        fetchConfig();
        fetchStatus();
      } else {
        toast.error(response.message || 'Error guardando configuración');
      }
    } catch (error) {
      toast.error('Error guardando: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      // Usar credenciales del formulario para test
      const testData = {
        userName: formData.userName || config?.userName,
        accessKey: formData.accessKey || 'stored' // El backend usará la almacenada si no se proporciona nueva
      };

      // Si hay accessKey nuevo, usar test; si no, usar connect con credenciales almacenadas
      const response = formData.accessKey
        ? await apiPost('/siigo/config/test', testData)
        : await apiPost('/siigo/config/connect');

      if (response.success) {
        toast.success('Conexión exitosa con Siigo');
      } else {
        toast.error(response.message || 'No se pudo conectar');
      }
      fetchStatus();
    } catch (error) {
      toast.error('Error de conexión: ' + (error.message || 'Error desconocido'));
    } finally {
      setTesting(false);
    }
  };

  const handleSyncCatalogs = async () => {
    try {
      setSyncing(true);
      await apiPost('/siigo/catalogs/sync');
      toast.success('Catálogos sincronizados');
      fetchCatalogs();
    } catch (error) {
      toast.error('Error sincronizando: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const fetchCatalogs = async () => {
    try {
      const [taxes, paymentTypes, docTypes, accountGroups] = await Promise.all([
        apiGet('/siigo/catalogs/taxes').catch(() => ({ data: [] })),
        apiGet('/siigo/catalogs/payment-types').catch(() => ({ data: [] })),
        apiGet('/siigo/catalogs/document-types').catch(() => ({ data: [] })),
        apiGet('/siigo/catalogs/account-groups').catch(() => ({ data: [] }))
      ]);

      setCatalogs({
        taxes: taxes.data || [],
        paymentTypes: paymentTypes.data || [],
        documentTypes: docTypes.data || [],
        accountGroups: accountGroups.data || []
      });
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'catalogs') {
      fetchCatalogs();
    }
  }, [activeTab]);

  const getConnectionIcon = () => {
    if (!config) return <CloudOff className="h-6 w-6 text-gray-400" />;
    if (status?.connected) return <Cloud className="h-6 w-6 text-green-500" />;
    return <CloudOff className="h-6 w-6 text-red-500" />;
  };

  const getSyncStat = (entidad) => {
    // El backend devuelve stats con clientes, productos, facturas, asientos, errores
    if (!status?.stats) return 0;
    const mapping = {
      'paciente': 'clientes',
      'producto': 'productos',
      'factura': 'facturas',
      'asiento': 'asientos'
    };
    return status.stats[mapping[entidad]] || 0;
  };

  const getTotalErrors = () => {
    return status?.stats?.errores || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuración Siigo
          </h1>
          <p className="text-muted-foreground">
            Integración con Siigo Nube para facturación electrónica y contabilidad
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getConnectionIcon()}
          <Badge variant={status?.connected ? 'default' : 'secondary'}>
            {status?.connected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 gap-2">
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="status">Estado</TabsTrigger>
          <TabsTrigger value="catalogs">Catálogos</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Configuración */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Credenciales de API</CardTitle>
              <CardDescription>
                Configure las credenciales de acceso a Siigo Nube. Obténgalas en{' '}
                <a href="https://developers.siigo.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  developers.siigo.com
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Usuario (Email) *</Label>
                  <Input
                    type="email"
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    placeholder="usuario@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ambiente</Label>
                  <Select
                    value={formData.ambiente}
                    onValueChange={(v) => setFormData({ ...formData, ambiente: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Pruebas)</SelectItem>
                      <SelectItem value="production">Producción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Access Key *</Label>
                <Input
                  type="password"
                  value={formData.accessKey}
                  onChange={(e) => setFormData({ ...formData, accessKey: e.target.value })}
                  placeholder="••••••••••••••••"
                />
                <p className="text-sm text-muted-foreground">
                  {config ? 'Deje en blanco para mantener el actual' : 'Requerido para configurar'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveConfig} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Guardar Configuración
                </Button>
                <Button variant="outline" onClick={handleTestConnection} disabled={testing || !config}>
                  {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Probar Conexión
                </Button>
              </div>

              {config && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Usuario:</span>
                      <p className="font-medium">{config.userName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ambiente:</span>
                      <Badge variant={config.ambiente === 'production' ? 'default' : 'secondary'}>
                        {config.ambiente === 'production' ? 'Producción' : 'Sandbox'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Última Sync:</span>
                      <p className="font-medium">
                        {config.ultimaSync ? new Date(config.ultimaSync).toLocaleString('es-CO') : 'Nunca'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estado */}
        <TabsContent value="status">
          <div className="space-y-4">
            {/* Resumen de Sincronización */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-muted-foreground">Clientes</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{getSyncStat('paciente')}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-muted-foreground">Productos</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{getSyncStat('producto')}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-muted-foreground">Facturas</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{getSyncStat('factura')}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-orange-600" />
                    <span className="text-sm text-muted-foreground">Asientos</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{getSyncStat('asiento')}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-muted-foreground">Errores</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-red-600">{getTotalErrors()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Logs Recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {status?.ultimosLogs?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Duración</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {status.ultimosLogs.map((log, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-sm">
                            {new Date(log.createdAt).toLocaleString('es-CO')}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.metodo}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.responseCode < 300 ? 'default' : 'destructive'}>
                              {log.responseCode}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.duracionMs}ms
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Database className="h-6 w-6 mr-2 opacity-50" />
                    Sin actividad reciente
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info de Conexión */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Información de Conexión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <p className="font-medium">
                      <Badge variant={status?.connected ? 'default' : 'secondary'}>
                        {status?.connected ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Último Health Check:</span>
                    <p className="font-medium">
                      {status?.lastHealthCheck
                        ? new Date(status.lastHealthCheck).toLocaleString('es-CO')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Intentos Reconexión:</span>
                    <p className="font-medium">{status?.reconnectAttempts || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Catálogos */}
        <TabsContent value="catalogs">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Catálogos de Siigo</CardTitle>
                  <CardDescription>
                    Sincronice los catálogos maestros desde Siigo
                  </CardDescription>
                </div>
                <Button onClick={handleSyncCatalogs} disabled={syncing || !status?.connected}>
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Sincronizar Catálogos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Impuestos */}
                <div>
                  <h4 className="font-medium mb-2">Impuestos ({catalogs.taxes?.length || 0})</h4>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {catalogs.taxes?.length > 0 ? (
                      <Table>
                        <TableBody>
                          {catalogs.taxes.map((tax, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm">{tax.nombre}</TableCell>
                              <TableCell className="text-right">{tax.porcentaje}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="p-4 text-center text-muted-foreground text-sm">Sin datos</p>
                    )}
                  </div>
                </div>

                {/* Tipos de Pago */}
                <div>
                  <h4 className="font-medium mb-2">Tipos de Pago ({catalogs.paymentTypes?.length || 0})</h4>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {catalogs.paymentTypes?.length > 0 ? (
                      <Table>
                        <TableBody>
                          {catalogs.paymentTypes.map((pt, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm">{pt.name}</TableCell>
                              <TableCell className="text-right font-mono">{pt.id}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="p-4 text-center text-muted-foreground text-sm">Sin datos</p>
                    )}
                  </div>
                </div>

                {/* Tipos de Documento */}
                <div>
                  <h4 className="font-medium mb-2">Tipos de Documento ({catalogs.documentTypes?.length || 0})</h4>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {catalogs.documentTypes?.length > 0 ? (
                      <Table>
                        <TableBody>
                          {catalogs.documentTypes.map((dt, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm">{dt.name}</TableCell>
                              <TableCell className="text-right font-mono">{dt.id}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="p-4 text-center text-muted-foreground text-sm">Sin datos</p>
                    )}
                  </div>
                </div>

                {/* Grupos Contables */}
                <div>
                  <h4 className="font-medium mb-2">Grupos Contables ({catalogs.accountGroups?.length || 0})</h4>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {catalogs.accountGroups?.length > 0 ? (
                      <Table>
                        <TableBody>
                          {catalogs.accountGroups.map((ag, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm">{ag.name}</TableCell>
                              <TableCell className="text-right font-mono">{ag.id}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="p-4 text-center text-muted-foreground text-sm">Sin datos</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Historial de Operaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Los logs detallados están disponibles en la base de datos</p>
                <p className="text-sm">Tabla: siigo_logs</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
