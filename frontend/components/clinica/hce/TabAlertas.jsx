'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  AlertTriangle, 
  AlertCircle,
  Clock,
  ShieldAlert,
  Pill,
  Siren,
  XCircle
} from 'lucide-react';

export default function TabAlertas({ pacienteId, paciente, user }) {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'Alergia',
    descripcion: '',
    severidad: 'Media',
    estado: 'Activa',
    observaciones: '',
  });

  useEffect(() => {
    if (pacienteId) {
      loadAlertas();
    }
  }, [pacienteId]);

  const loadAlertas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/alertas?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAlertas(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.descripcion) {
      alert('La descripción de la alerta es obligatoria');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const payload = {
        paciente_id: pacienteId,
        profesional_id: user?.id,
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        severidad: formData.severidad,
        estado: formData.estado,
        observaciones: formData.observaciones,
      };

      const response = await fetch(`${apiUrl}/alertas`, {
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
        loadAlertas();
        alert('Alerta clínica registrada exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'No se pudo guardar la alerta'}`);
      }
    } catch (error) {
      console.error('Error al guardar alerta:', error);
      alert('Error al guardar la alerta');
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'Alergia',
      descripcion: '',
      severidad: 'Media',
      estado: 'Activa',
      observaciones: '',
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

  const getSeveridadColor = (severidad) => {
    const colors = {
      'Baja': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Media': 'bg-orange-100 text-orange-700 border-orange-300',
      'Alta': 'bg-red-100 text-red-700 border-red-300',
      'Critica': 'bg-red-600 text-white border-red-700',
    };
    return colors[severidad] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getTipoIcon = (tipo) => {
    const icons = {
      'Alergia': <Pill className="w-5 h-5" />,
      'Contraindicacion': <ShieldAlert className="w-5 h-5" />,
      'RiesgoQuirurgico': <Siren className="w-5 h-5" />,
      'Otro': <AlertCircle className="w-5 h-5" />,
    };
    return icons[tipo] || <AlertCircle className="w-5 h-5" />;
  };

  const getTipoColor = (tipo) => {
    const colors = {
      'Alergia': 'text-red-600 bg-red-50',
      'Contraindicacion': 'text-orange-600 bg-orange-50',
      'RiesgoQuirurgico': 'text-purple-600 bg-purple-50',
      'Otro': 'text-blue-600 bg-blue-50',
    };
    return colors[tipo] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header con Botón */}
      <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Alertas Clínicas</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Alergias, contraindicaciones y riesgos del paciente
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Alerta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Registrar Alerta Clínica
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información del Paciente */}
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">Paciente:</span> {paciente?.nombre} {paciente?.apellido}
                        </div>
                        <div>
                          <span className="font-semibold">Profesional:</span> {user?.nombre} {user?.apellido}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tipo y Severidad */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipo">Tipo de Alerta *</Label>
                      <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alergia">
                            <div className="flex items-center gap-2">
                              <Pill className="w-4 h-4" />
                              Alergia
                            </div>
                          </SelectItem>
                          <SelectItem value="Contraindicacion">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4" />
                              Contraindicación
                            </div>
                          </SelectItem>
                          <SelectItem value="RiesgoQuirurgico">
                            <div className="flex items-center gap-2">
                              <Siren className="w-4 h-4" />
                              Riesgo Quirúrgico
                            </div>
                          </SelectItem>
                          <SelectItem value="Otro">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Otro
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="severidad">Severidad *</Label>
                      <Select value={formData.severidad} onValueChange={(value) => setFormData({ ...formData, severidad: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baja">Baja</SelectItem>
                          <SelectItem value="Media">Media</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Critica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <Label htmlFor="descripcion">Descripción de la Alerta *</Label>
                    <Input
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Ej: Alergia a la penicilina"
                      required
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activa">Activa</SelectItem>
                        <SelectItem value="Inactiva">Inactiva</SelectItem>
                        <SelectItem value="Resuelta">Resuelta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={3}
                      placeholder="Detalles adicionales sobre la alerta (reacciones previas, manejo recomendado, etc.)"
                    />
                  </div>

                  {/* Alerta de Importancia */}
                  <Card className="bg-amber-50 border-amber-300">
                    <CardContent className="p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Las alertas clínicas son visibles en todo el sistema para prevenir eventos adversos.
                        Asegúrate de incluir toda la información relevante.
                      </p>
                    </CardContent>
                  </Card>

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
                      className="bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800"
                    >
                      Guardar Alerta
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Alertas Activas Destacadas */}
      {alertas.filter(a => a.estado === 'Activa').length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alertas
            .filter(a => a.estado === 'Activa')
            .map((alerta) => (
              <Card 
                key={alerta.id}
                className={`border-2 ${getSeveridadColor(alerta.severidad)} shadow-lg`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getTipoColor(alerta.tipo)}`}>
                      {getTipoIcon(alerta.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge className={`${getSeveridadColor(alerta.severidad)} border-2`}>
                          {alerta.severidad}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alerta.tipo}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">
                        {alerta.descripcion}
                      </h4>
                      {alerta.observaciones && (
                        <p className="text-xs text-gray-600 mb-2">
                          {alerta.observaciones}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(alerta.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Tabla de Todas las Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de Alertas</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-center text-gray-600 py-8">Cargando alertas...</p>
          ) : alertas.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay alertas registradas</p>
              <p className="text-sm text-gray-500">
                Haz clic en "Nueva Alerta" para registrar la primera alerta clínica
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertas.map((alerta) => (
                <Card 
                  key={alerta.id} 
                  className={`border-l-4 ${
                    alerta.estado === 'Activa' 
                      ? 'border-l-red-500 bg-red-50/30' 
                      : 'border-l-gray-300'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${getTipoColor(alerta.tipo)}`}>
                          {getTipoIcon(alerta.tipo)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${getSeveridadColor(alerta.severidad)} border`}>
                              {alerta.severidad}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {alerta.tipo}
                            </Badge>
                            {alerta.estado !== 'Activa' && (
                              <Badge variant="outline" className="text-xs">
                                <XCircle className="w-3 h-3 mr-1" />
                                {alerta.estado}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-bold text-gray-900 mb-1">
                            {alerta.descripcion}
                          </h4>
                          {alerta.observaciones && (
                            <p className="text-sm text-gray-600 mb-2">
                              {alerta.observaciones}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(alerta.createdAt)}
                            </div>
                            <div>
                              Registrado por: {alerta.profesional?.nombre} {alerta.profesional?.apellido}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
