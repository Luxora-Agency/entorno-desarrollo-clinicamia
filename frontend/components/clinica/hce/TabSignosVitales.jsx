'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Activity, 
  Clock,
  TrendingUp,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Scale
} from 'lucide-react';

export default function TabSignosVitales({ pacienteId, paciente, user }) {
  const [signosVitales, setSignosVitales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    presion_arterial_sistolica: '',
    presion_arterial_diastolica: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    temperatura: '',
    saturacion_oxigeno: '',
    peso: '',
    talla: '',
  });

  useEffect(() => {
    if (pacienteId) {
      loadSignosVitales();
    }
  }, [pacienteId]);

  const loadSignosVitales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/signos-vitales?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSignosVitales(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando signos vitales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const payload = {
        paciente_id: pacienteId,
        profesional_id: user?.id,
        presion_arterial_sistolica: formData.presion_arterial_sistolica ? parseInt(formData.presion_arterial_sistolica) : null,
        presion_arterial_diastolica: formData.presion_arterial_diastolica ? parseInt(formData.presion_arterial_diastolica) : null,
        frecuencia_cardiaca: formData.frecuencia_cardiaca ? parseInt(formData.frecuencia_cardiaca) : null,
        frecuencia_respiratoria: formData.frecuencia_respiratoria ? parseInt(formData.frecuencia_respiratoria) : null,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
        saturacion_oxigeno: formData.saturacion_oxigeno ? parseInt(formData.saturacion_oxigeno) : null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        talla: formData.talla ? parseFloat(formData.talla) : null,
      };

      const response = await fetch(`${apiUrl}/signos-vitales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        loadSignosVitales();
        alert('Signos vitales registrados exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'No se pudieron guardar los signos vitales'}`);
      }
    } catch (error) {
      console.error('Error al guardar signos vitales:', error);
      alert('Error al guardar los signos vitales');
    }
  };

  const resetForm = () => {
    setFormData({
      presion_arterial_sistolica: '',
      presion_arterial_diastolica: '',
      frecuencia_cardiaca: '',
      frecuencia_respiratoria: '',
      temperatura: '',
      saturacion_oxigeno: '',
      peso: '',
      talla: '',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Función para calcular el IMC
  const calcularIMC = (peso, talla) => {
    if (!peso || !talla) return null;
    const imc = peso / (talla * talla);
    return imc.toFixed(2);
  };

  // Función para clasificar el IMC
  const clasificarIMC = (imc) => {
    if (!imc) return { label: 'N/A', color: 'gray' };
    if (imc < 18.5) return { label: 'Bajo peso', color: 'yellow' };
    if (imc < 25) return { label: 'Normal', color: 'green' };
    if (imc < 30) return { label: 'Sobrepeso', color: 'orange' };
    return { label: 'Obesidad', color: 'red' };
  };

  // Gráfica simple de tendencias (últimos 5 registros)
  const renderGrafica = () => {
    if (signosVitales.length < 2) return null;

    const ultimos5 = signosVitales.slice(0, 5).reverse();
    const maxPA = Math.max(...ultimos5.map(s => s.presion_arterial_sistolica || 0).filter(v => v > 0));
    const maxFC = Math.max(...ultimos5.map(s => s.frecuencia_cardiaca || 0).filter(v => v > 0));

    return (
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Tendencia de Signos Vitales (Últimos 5 registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfica de Presión Arterial */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Presión Arterial Sistólica (mmHg)
              </h4>
              <div className="flex items-end gap-2 h-32 border-b border-l border-gray-300 p-2">
                {ultimos5.map((signo, idx) => {
                  const altura = signo.presion_arterial_sistolica 
                    ? (signo.presion_arterial_sistolica / maxPA) * 100 
                    : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="text-xs font-semibold text-gray-700 mb-1">
                        {signo.presion_arterial_sistolica || '-'}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-red-500 to-pink-400 rounded-t transition-all"
                        style={{ height: `${altura}%`, minHeight: altura > 0 ? '20px' : '0' }}
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(signo.createdAt).getDate()}/{new Date(signo.createdAt).getMonth() + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfica de Frecuencia Cardíaca */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Frecuencia Cardíaca (lpm)
              </h4>
              <div className="flex items-end gap-2 h-32 border-b border-l border-gray-300 p-2">
                {ultimos5.map((signo, idx) => {
                  const altura = signo.frecuencia_cardiaca 
                    ? (signo.frecuencia_cardiaca / maxFC) * 100 
                    : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="text-xs font-semibold text-gray-700 mb-1">
                        {signo.frecuencia_cardiaca || '-'}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all"
                        style={{ height: `${altura}%`, minHeight: altura > 0 ? '20px' : '0' }}
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(signo.createdAt).getDate()}/{new Date(signo.createdAt).getMonth() + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con Botón */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Signos Vitales</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Registro y monitoreo de constantes vitales del paciente
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Signos Vitales
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Registro de Signos Vitales
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información del Paciente */}
                  <Card className="bg-indigo-50 border-indigo-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">Paciente:</span> {paciente?.nombre} {paciente?.apellido}
                        </div>
                        <div>
                          <span className="font-semibold">Fecha:</span> {new Date().toLocaleString('es-CO')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Presión Arterial */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pa_sistolica" className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        Presión Arterial Sistólica (mmHg)
                      </Label>
                      <Input
                        id="pa_sistolica"
                        type="number"
                        value={formData.presion_arterial_sistolica}
                        onChange={(e) => setFormData({ ...formData, presion_arterial_sistolica: e.target.value })}
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pa_diastolica" className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        Presión Arterial Diastólica (mmHg)
                      </Label>
                      <Input
                        id="pa_diastolica"
                        type="number"
                        value={formData.presion_arterial_diastolica}
                        onChange={(e) => setFormData({ ...formData, presion_arterial_diastolica: e.target.value })}
                        placeholder="80"
                      />
                    </div>
                  </div>

                  {/* Frecuencias */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fc" className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Frecuencia Cardíaca (lpm)
                      </Label>
                      <Input
                        id="fc"
                        type="number"
                        value={formData.frecuencia_cardiaca}
                        onChange={(e) => setFormData({ ...formData, frecuencia_cardiaca: e.target.value })}
                        placeholder="72"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fr" className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-cyan-500" />
                        Frecuencia Respiratoria (rpm)
                      </Label>
                      <Input
                        id="fr"
                        type="number"
                        value={formData.frecuencia_respiratoria}
                        onChange={(e) => setFormData({ ...formData, frecuencia_respiratoria: e.target.value })}
                        placeholder="16"
                      />
                    </div>
                  </div>

                  {/* Temperatura y Saturación */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="temperatura" className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-orange-500" />
                        Temperatura (°C)
                      </Label>
                      <Input
                        id="temperatura"
                        type="number"
                        step="0.1"
                        value={formData.temperatura}
                        onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                        placeholder="36.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="saturacion" className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-600" />
                        Saturación de Oxígeno (%)
                      </Label>
                      <Input
                        id="saturacion"
                        type="number"
                        value={formData.saturacion_oxigeno}
                        onChange={(e) => setFormData({ ...formData, saturacion_oxigeno: e.target.value })}
                        placeholder="98"
                      />
                    </div>
                  </div>

                  {/* Peso y Talla */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="peso" className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-purple-500" />
                        Peso (kg)
                      </Label>
                      <Input
                        id="peso"
                        type="number"
                        step="0.1"
                        value={formData.peso}
                        onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                        placeholder="70.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="talla" className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-purple-500" />
                        Talla (m)
                      </Label>
                      <Input
                        id="talla"
                        type="number"
                        step="0.01"
                        value={formData.talla}
                        onChange={(e) => setFormData({ ...formData, talla: e.target.value })}
                        placeholder="1.70"
                      />
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800"
                    >
                      Guardar Signos Vitales
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Gráficas de Tendencias */}
      {renderGrafica()}

      {/* Tabla de Registros */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-center text-gray-600 py-8">Cargando signos vitales...</p>
          ) : signosVitales.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay signos vitales registrados</p>
              <p className="text-sm text-gray-500">
                Haz clic en "Registrar Signos Vitales" para crear el primer registro
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>PA (mmHg)</TableHead>
                    <TableHead>FC (lpm)</TableHead>
                    <TableHead>FR (rpm)</TableHead>
                    <TableHead>Temp (°C)</TableHead>
                    <TableHead>SpO2 (%)</TableHead>
                    <TableHead>Peso (kg)</TableHead>
                    <TableHead>Talla (m)</TableHead>
                    <TableHead>IMC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signosVitales.map((signo) => {
                    const imc = calcularIMC(signo.peso, signo.talla);
                    const imcClasificacion = clasificarIMC(imc);
                    return (
                      <TableRow key={signo.id}>
                        <TableCell className="text-xs">{formatDate(signo.createdAt)}</TableCell>
                        <TableCell>
                          {signo.presion_arterial_sistolica && signo.presion_arterial_diastolica
                            ? `${signo.presion_arterial_sistolica}/${signo.presion_arterial_diastolica}`
                            : '-'}
                        </TableCell>
                        <TableCell>{signo.frecuencia_cardiaca || '-'}</TableCell>
                        <TableCell>{signo.frecuencia_respiratoria || '-'}</TableCell>
                        <TableCell>{signo.temperatura || '-'}</TableCell>
                        <TableCell>{signo.saturacion_oxigeno || '-'}</TableCell>
                        <TableCell>{signo.peso || '-'}</TableCell>
                        <TableCell>{signo.talla || '-'}</TableCell>
                        <TableCell>
                          {imc ? (
                            <Badge className={`bg-${imcClasificacion.color}-100 text-${imcClasificacion.color}-700`}>
                              {imc} - {imcClasificacion.label}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
