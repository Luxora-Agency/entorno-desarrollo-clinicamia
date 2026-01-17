'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  Bell, Mail, Plus, Trash2, Settings, Send, Clock, Users,
  CheckCircle2, XCircle, RefreshCw, AlertTriangle, History, Zap
} from 'lucide-react';
import useAlertasNotificaciones from '@/hooks/useAlertasNotificaciones';
import useTalentoHumano from '@/hooks/useTalentoHumano';
import useSST from '@/hooks/useSST';

const PRIORIDAD_COLORS = {
  BAJA: 'bg-blue-100 text-blue-700',
  MEDIA: 'bg-yellow-100 text-yellow-700',
  ALTA: 'bg-orange-100 text-orange-700',
  URGENTE: 'bg-red-100 text-red-700',
};

const ESTADO_COLORS = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  ENVIADO: 'bg-green-100 text-green-700',
  FALLIDO: 'bg-red-100 text-red-700',
  REBOTADO: 'bg-gray-100 text-gray-500',
};

export default function AlertasConfigTab({ user }) {
  const {
    loading, error, configuraciones, historial, pagination,
    getEstado, enviarPrueba, fetchConfiguraciones, saveConfiguracion,
    toggleConfiguracion, agregarDestinatario, eliminarDestinatario,
    fetchHistorial, reintentarAlerta, procesarPendientes,
    getTiposAlerta, getFrecuencias, getPrioridades, getTiposDestinatario
  } = useAlertasNotificaciones();

  const { cargos, fetchCargos, empleados, fetchEmpleados } = useTalentoHumano();
  const { programarAlertas } = useSST();

  const [estadoServicio, setEstadoServicio] = useState(null);
  const [tiposAlerta, setTiposAlerta] = useState([]);
  const [frecuencias, setFrecuencias] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [tiposDestinatario, setTiposDestinatario] = useState([]);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDestinatarioModal, setShowDestinatarioModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);

  const [formData, setFormData] = useState({
    modulo: 'SST',
    tipoAlerta: '',
    nombre: '',
    descripcion: '',
    diasAnticipacion: [30, 15, 7, 1],
    horaEnvio: '08:00',
    frecuenciaRecordatorio: 'UNICA',
    prioridad: 'MEDIA',
    asuntoTemplate: '',
    cuerpoTemplate: ''
  });

  const [destinatarioForm, setDestinatarioForm] = useState({
    tipoDestinatario: '',
    email: '',
    cargoId: '',
    empleadoId: ''
  });

  const [testEmail, setTestEmail] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [estado, tipos, freqs, prios, tiposDest] = await Promise.all([
        getEstado(),
        getTiposAlerta(),
        getFrecuencias(),
        getPrioridades(),
        getTiposDestinatario()
      ]);

      setEstadoServicio(estado);
      setTiposAlerta(tipos || []);
      setFrecuencias(freqs || []);
      setPrioridades(prios || []);
      setTiposDestinatario(tiposDest || []);

      await Promise.all([
        fetchConfiguraciones(),
        fetchHistorial({ limit: 20 }),
        fetchCargos(),
        fetchEmpleados({ estado: 'ACTIVO', limit: 100 })
      ]);
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await saveConfiguracion(formData);
      setShowConfigModal(false);
      resetForm();
    } catch (err) {
      console.error('Error guardando configuración:', err);
    }
  };

  const handleAddDestinatario = async () => {
    if (!selectedConfig) return;
    try {
      await agregarDestinatario(selectedConfig.id, destinatarioForm);
      setShowDestinatarioModal(false);
      setDestinatarioForm({ tipoDestinatario: '', email: '', cargoId: '', empleadoId: '' });
      await fetchConfiguraciones();
    } catch (err) {
      console.error('Error agregando destinatario:', err);
    }
  };

  const handleDeleteDestinatario = async (id) => {
    if (!confirm('¿Eliminar este destinatario?')) return;
    try {
      await eliminarDestinatario(id);
      await fetchConfiguraciones();
    } catch (err) {
      console.error('Error eliminando destinatario:', err);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    try {
      await enviarPrueba(testEmail);
      alert('Email de prueba enviado correctamente');
      setShowTestModal(false);
      setTestEmail('');
    } catch (err) {
      alert('Error enviando email: ' + err.message);
    }
  };

  const handleProgramarAlertas = async () => {
    setProcesando(true);
    try {
      const result = await programarAlertas();
      await fetchHistorial({ limit: 20 });
      alert(`Alertas procesadas:\n- Documentos: ${result?.documentos?.programadas || 0}\n- Examenes: ${result?.examenes?.programadas || 0}\n- Enviadas: ${result?.procesadas?.exitosas || 0}`);
    } catch (err) {
      alert('Error procesando alertas: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleRetry = async (id) => {
    try {
      await reintentarAlerta(id);
      await fetchHistorial({ limit: 20 });
    } catch (err) {
      console.error('Error reintentando:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      modulo: 'SST',
      tipoAlerta: '',
      nombre: '',
      descripcion: '',
      diasAnticipacion: [30, 15, 7, 1],
      horaEnvio: '08:00',
      frecuenciaRecordatorio: 'UNICA',
      prioridad: 'MEDIA',
      asuntoTemplate: '',
      cuerpoTemplate: ''
    });
  };

  const openEditConfig = (config) => {
    setFormData({
      modulo: config.modulo,
      tipoAlerta: config.tipoAlerta,
      nombre: config.nombre,
      descripcion: config.descripcion || '',
      diasAnticipacion: config.diasAnticipacion || [30, 15, 7, 1],
      horaEnvio: config.horaEnvio || '08:00',
      frecuenciaRecordatorio: config.frecuenciaRecordatorio || 'UNICA',
      prioridad: config.prioridad || 'MEDIA',
      asuntoTemplate: config.asuntoTemplate || '',
      cuerpoTemplate: config.cuerpoTemplate || ''
    });
    setShowConfigModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Configuracion de Alertas
          </h2>
          <p className="text-sm text-gray-500">
            Sistema de notificaciones por email con Resend
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleProgramarAlertas} disabled={procesando}>
            <Zap className="w-4 h-4 mr-2" />
            {procesando ? 'Procesando...' : 'Procesar Alertas'}
          </Button>
          <Button variant="outline" onClick={() => setShowTestModal(true)}>
            <Send className="w-4 h-4 mr-2" />
            Enviar Prueba
          </Button>
          <Button onClick={() => { resetForm(); setShowConfigModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Alerta
          </Button>
        </div>
      </div>

      {/* Estado del Servicio */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${estadoServicio?.habilitado ? 'bg-green-100' : 'bg-red-100'}`}>
                <Mail className={`w-5 h-5 ${estadoServicio?.habilitado ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="font-medium">
                  Servicio de Email: {estadoServicio?.habilitado ? 'Activo' : 'Inactivo'}
                </p>
                <p className="text-sm text-gray-500">
                  {estadoServicio?.fromName} ({estadoServicio?.fromEmail})
                </p>
              </div>
            </div>
            {!estadoServicio?.habilitado && (
              <Badge variant="destructive">
                Configurar RESEND_API_KEY en .env
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="configuraciones">
        <TabsList>
          <TabsTrigger value="configuraciones">
            <Settings className="w-4 h-4 mr-2" />
            Configuraciones
          </TabsTrigger>
          <TabsTrigger value="historial">
            <History className="w-4 h-4 mr-2" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Tab Configuraciones */}
        <TabsContent value="configuraciones">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alerta</TableHead>
                    <TableHead>Modulo</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Anticipacion</TableHead>
                    <TableHead>Destinatarios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configuraciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No hay configuraciones. Cree una nueva alerta.
                      </TableCell>
                    </TableRow>
                  ) : (
                    configuraciones.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{config.nombre}</p>
                            <p className="text-xs text-gray-500">{config.tipoAlerta.replace(/_/g, ' ')}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{config.modulo}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={PRIORIDAD_COLORS[config.prioridad]}>
                            {config.prioridad}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {config.diasAnticipacion?.map((d) => (
                              <Badge key={d} variant="secondary" className="text-xs">
                                {d}d
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedConfig(config); setShowDestinatarioModal(true); }}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            {config.destinatarios?.length || 0}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={config.activo}
                            onCheckedChange={() => toggleConfiguracion(config.id)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEditConfig(config)}>
                            <Settings className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Historial */}
        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Historial de Envios</CardTitle>
                <Button variant="outline" size="sm" onClick={() => fetchHistorial({ limit: 20 })}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Destinatarios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No hay alertas enviadas
                      </TableCell>
                    </TableRow>
                  ) : (
                    historial.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {new Date(item.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.tipoAlerta?.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{item.asunto}</TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {item.destinatariosEmail?.length || 0} email(s)
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={ESTADO_COLORS[item.estado]}>
                            {item.estado === 'ENVIADO' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {item.estado === 'FALLIDO' && <XCircle className="w-3 h-3 mr-1" />}
                            {item.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.estado === 'FALLIDO' && (
                            <Button variant="ghost" size="sm" onClick={() => handleRetry(item.id)}>
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
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

      {/* Modal Configuración */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar Alerta</DialogTitle>
            <DialogDescription>
              Configure los parametros de la alerta y sus destinatarios
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Modulo</Label>
                <Select value={formData.modulo} onValueChange={(v) => setFormData({...formData, modulo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SST">SST</SelectItem>
                    <SelectItem value="RRHH">RRHH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Alerta</Label>
                <Select value={formData.tipoAlerta} onValueChange={(v) => {
                  const tipo = tiposAlerta.find(t => t.value === v);
                  setFormData({...formData, tipoAlerta: v, nombre: tipo?.label || ''});
                }}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {tiposAlerta.filter(t => t.modulo === formData.modulo).map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Nombre</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Nombre descriptivo de la alerta"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Prioridad</Label>
                <Select value={formData.prioridad} onValueChange={(v) => setFormData({...formData, prioridad: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {prioridades.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Frecuencia</Label>
                <Select value={formData.frecuenciaRecordatorio} onValueChange={(v) => setFormData({...formData, frecuenciaRecordatorio: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {frecuencias.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hora de Envio</Label>
                <Input
                  type="time"
                  value={formData.horaEnvio}
                  onChange={(e) => setFormData({...formData, horaEnvio: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Dias de Anticipacion (separados por coma)</Label>
              <Input
                value={formData.diasAnticipacion?.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  diasAnticipacion: e.target.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
                })}
                placeholder="30, 15, 7, 1"
              />
            </div>

            <div>
              <Label>Asunto del Email</Label>
              <Input
                value={formData.asuntoTemplate}
                onChange={(e) => setFormData({...formData, asuntoTemplate: e.target.value})}
                placeholder="Usar {{variable}} para datos dinamicos"
              />
            </div>

            <div>
              <Label>Cuerpo del Email (HTML)</Label>
              <Textarea
                value={formData.cuerpoTemplate}
                onChange={(e) => setFormData({...formData, cuerpoTemplate: e.target.value})}
                placeholder="Usar {{variable}} para datos dinamicos"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveConfig} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Destinatarios */}
      <Dialog open={showDestinatarioModal} onOpenChange={setShowDestinatarioModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Destinatarios: {selectedConfig?.nombre}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Lista actual */}
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              {selectedConfig?.destinatarios?.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">Sin destinatarios configurados</p>
              ) : (
                <div className="space-y-2">
                  {selectedConfig?.destinatarios?.map((d) => (
                    <div key={d.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <Badge variant="outline" className="text-xs">{d.tipoDestinatario}</Badge>
                        <span className="ml-2 text-sm">
                          {d.email || d.empleado?.email || d.cargo?.nombre || 'Sin especificar'}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDestinatario(d.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agregar nuevo */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Agregar destinatario</Label>
              <div className="grid gap-3 mt-2">
                <Select
                  value={destinatarioForm.tipoDestinatario}
                  onValueChange={(v) => setDestinatarioForm({...destinatarioForm, tipoDestinatario: v})}
                >
                  <SelectTrigger><SelectValue placeholder="Tipo de destinatario" /></SelectTrigger>
                  <SelectContent>
                    {tiposDestinatario.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {destinatarioForm.tipoDestinatario === 'EMAIL_FIJO' && (
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={destinatarioForm.email}
                    onChange={(e) => setDestinatarioForm({...destinatarioForm, email: e.target.value})}
                  />
                )}

                {destinatarioForm.tipoDestinatario === 'CARGO' && (
                  <Select
                    value={destinatarioForm.cargoId}
                    onValueChange={(v) => setDestinatarioForm({...destinatarioForm, cargoId: v})}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar cargo" /></SelectTrigger>
                    <SelectContent>
                      {cargos?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {destinatarioForm.tipoDestinatario === 'EMPLEADO_ESPECIFICO' && (
                  <Select
                    value={destinatarioForm.empleadoId}
                    onValueChange={(v) => setDestinatarioForm({...destinatarioForm, empleadoId: v})}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar empleado" /></SelectTrigger>
                    <SelectContent>
                      {empleados?.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button onClick={handleAddDestinatario} disabled={!destinatarioForm.tipoDestinatario}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Test Email */}
      <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email de Prueba</DialogTitle>
            <DialogDescription>
              Envie un email de prueba para verificar la configuracion
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label>Email de destino</Label>
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestModal(false)}>Cancelar</Button>
            <Button onClick={handleSendTest} disabled={loading || !testEmail}>
              <Send className="w-4 h-4 mr-2" />
              Enviar Prueba
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
