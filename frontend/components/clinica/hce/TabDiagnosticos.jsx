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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  FileText, 
  Clock,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clipboard
} from 'lucide-react';

export default function TabDiagnosticos({ pacienteId, paciente, user }) {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo_cie11: '',
    descripcion: '',
    tipo: 'Principal',
    estado: 'Activo',
    observaciones: '',
  });

  useEffect(() => {
    if (pacienteId) {
      loadDiagnosticos();
    }
  }, [pacienteId]);

  const loadDiagnosticos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const response = await fetch(
        `${apiUrl}/diagnosticos?paciente_id=${pacienteId}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setDiagnosticos(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando diagnósticos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.codigo_cie11 || !formData.descripcion) {
      alert('El código CIE-11 y la descripción son obligatorios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const payload = {
        paciente_id: pacienteId,
        profesional_id: user?.id,
        codigo_cie11: formData.codigo_cie11,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        estado: formData.estado,
        observaciones: formData.observaciones,
      };

      const response = await fetch(`${apiUrl}/diagnosticos`, {
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
        loadDiagnosticos();
        alert('Diagnóstico registrado exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'No se pudo guardar el diagnóstico'}`);
      }
    } catch (error) {
      console.error('Error al guardar diagnóstico:', error);
      alert('Error al guardar el diagnóstico');
    }
  };

  const resetForm = () => {
    setFormData({
      codigo_cie11: '',
      descripcion: '',
      tipo: 'Principal',
      estado: 'Activo',
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

  const getTipoColor = (tipo) => {
    const colors = {
      'Principal': 'bg-red-100 text-red-700 border-red-200',
      'Secundario': 'bg-blue-100 text-blue-700 border-blue-200',
      'Complicacion': 'bg-orange-100 text-orange-700 border-orange-200',
      'Presuntivo': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getEstadoIcon = (estado) => {
    if (estado === 'Activo') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (estado === 'Resuelto') return <XCircle className="w-4 h-4 text-gray-600" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  };

  // Códigos CIE-11 comunes para búsqueda rápida (ejemplo)
  const diagnosticosComunes = [
    { codigo: '2E20', descripcion: 'Diabetes mellitus tipo 2' },
    { codigo: 'BA00', descripcion: 'Hipertensión esencial' },
    { codigo: 'CA40', descripcion: 'Insuficiencia cardíaca' },
    { codigo: 'DA0Z', descripcion: 'Asma' },
    { codigo: 'MD11.0', descripcion: 'Lumbalgia' },
    { codigo: 'KA00', descripcion: 'Dispepsia funcional' },
    { codigo: '8B20', descripcion: 'Obesidad' },
    { codigo: 'AB30.1', descripcion: 'Rinofaringitis aguda' },
    { codigo: 'MB24.0', descripcion: 'Cefalea tensional' },
    { codigo: '6B71', descripcion: 'Trastorno de ansiedad generalizada' },
  ];

  return (
    <div className="space-y-6">
      {/* Header con Botón */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Clipboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Diagnósticos CIE-11</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Registro de diagnósticos según la Clasificación Internacional de Enfermedades
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Diagnóstico
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Clipboard className="w-5 h-5 text-purple-600" />
                    Registrar Diagnóstico
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información del Paciente */}
                  <Card className="bg-purple-50 border-purple-200">
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

                  {/* Búsqueda Rápida de Diagnósticos Comunes */}
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                      <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Diagnósticos Frecuentes (click para seleccionar)
                      </Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {diagnosticosComunes.map((diag) => (
                          <Button
                            key={diag.codigo}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="justify-start text-xs h-auto py-2"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                codigo_cie11: diag.codigo,
                                descripcion: diag.descripcion,
                              });
                            }}
                          >
                            <span className="font-bold mr-2">{diag.codigo}</span>
                            <span className="truncate">{diag.descripcion}</span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Código y Descripción */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="codigo_cie11">Código CIE-11 *</Label>
                      <Input
                        id="codigo_cie11"
                        value={formData.codigo_cie11}
                        onChange={(e) => setFormData({ ...formData, codigo_cie11: e.target.value })}
                        placeholder="Ej: 2E20"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="descripcion">Descripción del Diagnóstico *</Label>
                      <Input
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Ej: Diabetes mellitus tipo 2"
                        required
                      />
                    </div>
                  </div>

                  {/* Tipo y Estado */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipo">Tipo de Diagnóstico</Label>
                      <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Principal">Principal</SelectItem>
                          <SelectItem value="Secundario">Secundario</SelectItem>
                          <SelectItem value="Complicacion">Complicación</SelectItem>
                          <SelectItem value="Presuntivo">Presuntivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="estado">Estado</Label>
                      <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Activo">Activo</SelectItem>
                          <SelectItem value="Resuelto">Resuelto</SelectItem>
                          <SelectItem value="EnSeguimiento">En Seguimiento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={3}
                      placeholder="Notas adicionales sobre el diagnóstico..."
                    />
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
                      className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800"
                    >
                      Guardar Diagnóstico
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Tabla de Diagnósticos */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-center text-gray-600 py-8">Cargando diagnósticos...</p>
          ) : diagnosticos.length === 0 ? (
            <div className="text-center py-12">
              <Clipboard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hay diagnósticos registrados</p>
              <p className="text-sm text-gray-500">
                Haz clic en "Nuevo Diagnóstico" para registrar el primer diagnóstico
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Código CIE-11</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnosticos.map((diagnostico) => (
                    <TableRow key={diagnostico.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDate(diagnostico.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-700 font-mono">
                          {diagnostico.codigo_cie11}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {diagnostico.descripcion}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTipoColor(diagnostico.tipo)} border`}>
                          {diagnostico.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEstadoIcon(diagnostico.estado)}
                          <span className="text-sm">{diagnostico.estado}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {diagnostico.profesional?.nombre} {diagnostico.profesional?.apellido}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {diagnostico.observaciones || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de Diagnósticos Activos */}
      {diagnosticos.filter(d => d.estado === 'Activo').length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Diagnósticos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {diagnosticos
                .filter(d => d.estado === 'Activo')
                .map((diagnostico) => (
                  <Badge 
                    key={diagnostico.id}
                    className="bg-white border-green-300 text-green-800 px-3 py-1.5"
                  >
                    <span className="font-mono font-bold mr-2">{diagnostico.codigo_cie11}</span>
                    {diagnostico.descripcion}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
