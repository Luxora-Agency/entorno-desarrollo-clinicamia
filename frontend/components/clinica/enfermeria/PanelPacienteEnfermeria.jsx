'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Activity, Droplets, FileText, Droplet,
  HeartPulse, Thermometer, Heart, MapPin, Clock,
  Plus, Save, TrendingUp, AlertTriangle, Calendar,
  User, Stethoscope
} from 'lucide-react';
import GlucometriaModule from './GlucometriaModule';
import BalanceLiquidosModule from './BalanceLiquidosModule';
import TransfusionesModule from './TransfusionesModule';
import NotasEnfermeria from './NotasEnfermeria';

export default function PanelPacienteEnfermeria({ paciente, onBack, user }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('signos');
  const [signosVitales, setSignosVitales] = useState([]);
  const [loadingSignos, setLoadingSignos] = useState(true);
  const [showSignosModal, setShowSignosModal] = useState(false);
  const [formSignos, setFormSignos] = useState({
    temperatura: '',
    presionArterial: '',
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    saturacionO2: '',
    peso: '',
    talla: '',
    escalaDolor: '',
    observaciones: ''
  });

  // Helper to ensure we have the correct IDs
  const pacienteId = paciente.pacienteId || paciente.id;
  const admisionId = paciente.admisionId || paciente.id;

  useEffect(() => {
    if (pacienteId) {
      loadSignosVitales();
    }
  }, [pacienteId]);

  const loadSignosVitales = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/signos-vitales?paciente_id=${pacienteId}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSignosVitales(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando signos vitales:', error);
    } finally {
      setLoadingSignos(false);
    }
  };

  const handleRegistrarSignos = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      let sistolica = null;
      let diastolica = null;
      if (formSignos.presionArterial && formSignos.presionArterial.includes('/')) {
        const partes = formSignos.presionArterial.split('/');
        sistolica = parseInt(partes[0]);
        diastolica = parseInt(partes[1]);
      }

      const response = await fetch(`${apiUrl}/signos-vitales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paciente_id: pacienteId,
          admision_id: admisionId,
          registrado_por: user?.id,
          temperatura: formSignos.temperatura ? parseFloat(formSignos.temperatura) : null,
          presion_sistolica: sistolica,
          presion_diastolica: diastolica,
          frecuencia_cardiaca: formSignos.frecuenciaCardiaca ? parseInt(formSignos.frecuenciaCardiaca) : null,
          frecuencia_respiratoria: formSignos.frecuenciaRespiratoria ? parseInt(formSignos.frecuenciaRespiratoria) : null,
          saturacion_oxigeno: formSignos.saturacionO2 ? parseFloat(formSignos.saturacionO2) : null,
          peso: formSignos.peso ? parseFloat(formSignos.peso) : null,
          talla: formSignos.talla ? parseFloat(formSignos.talla) : null,
          escala_dolor: formSignos.escalaDolor ? parseInt(formSignos.escalaDolor) : null,
          observaciones: formSignos.observaciones
        })
      });

      if (response.ok) {
        toast({ description: 'Signos vitales registrados correctamente' });
        setShowSignosModal(false);
        setFormSignos({
          temperatura: '',
          presionArterial: '',
          frecuenciaCardiaca: '',
          frecuenciaRespiratoria: '',
          saturacionO2: '',
          peso: '',
          talla: '',
          escalaDolor: '',
          observaciones: ''
        });
        loadSignosVitales();
      } else {
        const error = await response.json();
        toast({ description: error.message || 'Error al registrar', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ description: 'Error al registrar signos vitales', variant: 'destructive' });
    }
  };

  // Get latest vital signs
  const ultimoSigno = signosVitales.length > 0 ? signosVitales[0] : null;

  // Helper para status de signos vitales
  const getVitalStatus = (tipo, valor) => {
    if (!valor) return { color: 'gray', status: 'Sin datos' };

    const ranges = {
      temperatura: { low: 36, high: 37.5, unit: '°C' },
      fc: { low: 60, high: 100, unit: 'lpm' },
      fr: { low: 12, high: 20, unit: 'rpm' },
      spo2: { low: 95, high: 100, unit: '%' },
      pas: { low: 90, high: 140, unit: 'mmHg' },
      pad: { low: 60, high: 90, unit: 'mmHg' }
    };

    const range = ranges[tipo];
    if (!range) return { color: 'gray', status: 'N/A' };

    if (valor < range.low) return { color: 'blue', status: 'Bajo' };
    if (valor > range.high) return { color: 'red', status: 'Alto' };
    return { color: 'green', status: 'Normal' };
  };

  return (
    <div className="space-y-6">
      {/* Header con info del paciente */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="hover:bg-white/50">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </Button>
              <div className="h-8 w-px bg-emerald-200" />
              <Avatar className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-teal-600">
                <AvatarFallback className="text-white font-bold text-lg">
                  {paciente.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2) ||
                   `${paciente.nombre?.[0] || ''}${paciente.apellido?.[0] || ''}`}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {paciente.nombre} {paciente.apellido}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Habitación {paciente.habitacion || 'N/A'}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="w-4 h-4" />
                    {paciente.diagnostico || 'Sin diagnóstico'}
                  </span>
                </div>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              {new Date().toLocaleString('es-CO', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
      timeZone: 'America/Bogota'
    })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white p-1 shadow-lg border w-full justify-start overflow-x-auto rounded-xl h-auto">
          <TabsTrigger
            value="signos"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg py-3 px-4"
          >
            <HeartPulse className="w-4 h-4 mr-2" />
            Signos Vitales
          </TabsTrigger>
          <TabsTrigger
            value="glucometria"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg py-3 px-4"
          >
            <Droplet className="w-4 h-4 mr-2" />
            Glucometría
          </TabsTrigger>
          <TabsTrigger
            value="balance"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-lg py-3 px-4"
          >
            <Droplets className="w-4 h-4 mr-2" />
            Balance Hídrico
          </TabsTrigger>
          <TabsTrigger
            value="transfusiones"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white rounded-lg py-3 px-4"
          >
            <Droplet className="w-4 h-4 mr-2" />
            Transfusiones
          </TabsTrigger>
          <TabsTrigger
            value="notas"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg py-3 px-4"
          >
            <FileText className="w-4 h-4 mr-2" />
            Notas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Signos Vitales */}
        <TabsContent value="signos" className="space-y-4">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <HeartPulse className="w-5 h-5" />
                    Control de Signos Vitales
                  </CardTitle>
                  <CardDescription>Historial y registro de signos vitales del paciente</CardDescription>
                </div>
                <Button
                  onClick={() => setShowSignosModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Panel de últimos signos */}
              {ultimoSigno && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Último Registro - {new Date(ultimoSigno.fechaRegistro || ultimoSigno.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Presión Arterial */}
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-4 text-center">
                        <Activity className="w-6 h-6 mx-auto text-red-500 mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Presión Arterial</p>
                        <p className="text-xl font-bold text-gray-900">
                          {ultimoSigno.presionSistolica && ultimoSigno.presionDiastolica
                            ? `${ultimoSigno.presionSistolica}/${ultimoSigno.presionDiastolica}`
                            : '--/--'}
                        </p>
                        <p className="text-xs text-gray-400">mmHg</p>
                      </CardContent>
                    </Card>

                    {/* Frecuencia Cardíaca */}
                    <Card className="bg-pink-50 border-pink-200">
                      <CardContent className="p-4 text-center">
                        <Heart className="w-6 h-6 mx-auto text-pink-500 mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Frec. Cardíaca</p>
                        <p className="text-xl font-bold text-gray-900">
                          {ultimoSigno.frecuenciaCardiaca || '--'}
                        </p>
                        <p className="text-xs text-gray-400">lpm</p>
                      </CardContent>
                    </Card>

                    {/* Frecuencia Respiratoria */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4 text-center">
                        <Activity className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Frec. Respiratoria</p>
                        <p className="text-xl font-bold text-gray-900">
                          {ultimoSigno.frecuenciaRespiratoria || '--'}
                        </p>
                        <p className="text-xs text-gray-400">rpm</p>
                      </CardContent>
                    </Card>

                    {/* Temperatura */}
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-4 text-center">
                        <Thermometer className="w-6 h-6 mx-auto text-orange-500 mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Temperatura</p>
                        <p className="text-xl font-bold text-gray-900">
                          {ultimoSigno.temperatura || '--'}
                        </p>
                        <p className="text-xs text-gray-400">°C</p>
                      </CardContent>
                    </Card>

                    {/* Saturación O2 */}
                    <Card className="bg-cyan-50 border-cyan-200">
                      <CardContent className="p-4 text-center">
                        <Droplet className="w-6 h-6 mx-auto text-cyan-500 mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Saturación O₂</p>
                        <p className="text-xl font-bold text-gray-900">
                          {ultimoSigno.saturacionOxigeno || '--'}
                        </p>
                        <p className="text-xs text-gray-400">%</p>
                      </CardContent>
                    </Card>

                    {/* Escala de Dolor */}
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4 text-center">
                        <AlertTriangle className="w-6 h-6 mx-auto text-purple-500 mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Escala Dolor</p>
                        <p className="text-xl font-bold text-gray-900">
                          {ultimoSigno.escalaDolor !== null ? ultimoSigno.escalaDolor : '--'}
                        </p>
                        <p className="text-xs text-gray-400">/10</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Historial */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Historial de Registros
                </h4>
                {loadingSignos ? (
                  <div className="text-center py-8 text-gray-500">Cargando...</div>
                ) : signosVitales.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <HeartPulse className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No hay registros de signos vitales</p>
                    <Button
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowSignosModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Primeros Signos
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha/Hora</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-600">PA</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-600">FC</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-600">FR</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-600">Temp</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-600">SpO₂</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-600">Dolor</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Obs.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {signosVitales.map((sv, idx) => (
                          <tr key={sv.id || idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">
                              {new Date(sv.fechaRegistro || sv.createdAt).toLocaleString('es-CO', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Bogota'
    })}
                            </td>
                            <td className="px-4 py-3 text-center font-medium">
                              {sv.presionSistolica && sv.presionDiastolica
                                ? `${sv.presionSistolica}/${sv.presionDiastolica}`
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">{sv.frecuenciaCardiaca || '-'}</td>
                            <td className="px-4 py-3 text-center">{sv.frecuenciaRespiratoria || '-'}</td>
                            <td className="px-4 py-3 text-center">{sv.temperatura || '-'}</td>
                            <td className="px-4 py-3 text-center">{sv.saturacionOxigeno || '-'}</td>
                            <td className="px-4 py-3 text-center">{sv.escalaDolor ?? '-'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs max-w-[150px] truncate">
                              {sv.observaciones || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="glucometria">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <GlucometriaModule pacienteId={pacienteId} admisionId={admisionId} />
          </div>
        </TabsContent>

        <TabsContent value="balance">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <BalanceLiquidosModule pacienteId={pacienteId} admisionId={admisionId} />
          </div>
        </TabsContent>

        <TabsContent value="transfusiones">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <TransfusionesModule pacienteId={pacienteId} admisionId={admisionId} />
          </div>
        </TabsContent>

        <TabsContent value="notas">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <NotasEnfermeria pacienteId={pacienteId} admisionId={admisionId} user={user} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Registrar Signos Vitales */}
      <Dialog open={showSignosModal} onOpenChange={setShowSignosModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <HeartPulse className="w-5 h-5" />
              Registrar Signos Vitales
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Grid de signos vitales */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <Label className="text-red-700 text-xs font-medium flex items-center gap-1 mb-2">
                  <Activity className="w-3 h-3" />
                  Presión Arterial (mmHg)
                </Label>
                <Input
                  placeholder="120/80"
                  value={formSignos.presionArterial}
                  onChange={(e) => setFormSignos(prev => ({ ...prev, presionArterial: e.target.value }))}
                  className="bg-white border-red-200 focus:border-red-400"
                />
              </div>
              <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                <Label className="text-pink-700 text-xs font-medium flex items-center gap-1 mb-2">
                  <Heart className="w-3 h-3" />
                  Frec. Cardíaca (lpm)
                </Label>
                <Input
                  type="number"
                  placeholder="72"
                  value={formSignos.frecuenciaCardiaca}
                  onChange={(e) => setFormSignos(prev => ({ ...prev, frecuenciaCardiaca: e.target.value }))}
                  className="bg-white border-pink-200 focus:border-pink-400"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <Label className="text-blue-700 text-xs font-medium flex items-center gap-1 mb-2">
                  <Activity className="w-3 h-3" />
                  Frec. Respiratoria (rpm)
                </Label>
                <Input
                  type="number"
                  placeholder="18"
                  value={formSignos.frecuenciaRespiratoria}
                  onChange={(e) => setFormSignos(prev => ({ ...prev, frecuenciaRespiratoria: e.target.value }))}
                  className="bg-white border-blue-200 focus:border-blue-400"
                />
              </div>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <Label className="text-orange-700 text-xs font-medium flex items-center gap-1 mb-2">
                  <Thermometer className="w-3 h-3" />
                  Temperatura (°C)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  value={formSignos.temperatura}
                  onChange={(e) => setFormSignos(prev => ({ ...prev, temperatura: e.target.value }))}
                  className="bg-white border-orange-200 focus:border-orange-400"
                />
              </div>
              <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                <Label className="text-cyan-700 text-xs font-medium flex items-center gap-1 mb-2">
                  <Droplet className="w-3 h-3" />
                  Saturación O₂ (%)
                </Label>
                <Input
                  type="number"
                  placeholder="98"
                  value={formSignos.saturacionO2}
                  onChange={(e) => setFormSignos(prev => ({ ...prev, saturacionO2: e.target.value }))}
                  className="bg-white border-cyan-200 focus:border-cyan-400"
                />
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <Label className="text-purple-700 text-xs font-medium flex items-center gap-1 mb-2">
                  <AlertTriangle className="w-3 h-3" />
                  Escala de Dolor (0-10)
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="0"
                  value={formSignos.escalaDolor}
                  onChange={(e) => setFormSignos(prev => ({ ...prev, escalaDolor: e.target.value }))}
                  className="bg-white border-purple-200 focus:border-purple-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="70"
                  value={formSignos.peso}
                  onChange={(e) => setFormSignos(prev => ({ ...prev, peso: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Talla (cm)</Label>
                <Input
                  type="number"
                  placeholder="170"
                  value={formSignos.talla}
                  onChange={(e) => setFormSignos(prev => ({ ...prev, talla: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Observaciones</Label>
              <Textarea
                placeholder="Observaciones adicionales sobre el estado del paciente..."
                rows={2}
                value={formSignos.observaciones}
                onChange={(e) => setFormSignos(prev => ({ ...prev, observaciones: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSignosModal(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              onClick={handleRegistrarSignos}
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Signos Vitales
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
