'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Search, FileText, Calendar, AlertTriangle,
  CheckCircle, Clock, MoreVertical, Download, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import useTalentoHumano from '@/hooks/useTalentoHumano';

const ESTADO_COLORS = {
  ACTIVO: 'bg-green-100 text-green-700',
  TERMINADO: 'bg-gray-100 text-gray-700',
  SUSPENDIDO: 'bg-orange-100 text-orange-700',
  EN_RENOVACION: 'bg-blue-100 text-blue-700',
};

const TIPO_CONTRATO_LABELS = {
  INDEFINIDO: 'Indefinido',
  FIJO: 'Termino Fijo',
  OBRA_LABOR: 'Obra o Labor',
  PRESTACION_SERVICIOS: 'Prestacion Servicios',
  APRENDIZAJE: 'Aprendizaje',
  TEMPORAL: 'Temporal',
};

export default function ContratosTab({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { contratos, empleados, loading, fetchContratos, fetchEmpleados, createContrato } = useTalentoHumano();

  useEffect(() => {
    fetchContratos();
    fetchEmpleados();
  }, []);

  const handleCreateContrato = async (data) => {
    try {
      await createContrato(data);
      setShowCreateModal(false);
      fetchContratos();
    } catch (error) {
      console.error('Error creating contrato:', error);
    }
  };

  const filteredContratos = contratos.filter(c =>
    c.empleado?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.empleado?.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.numeroContrato?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const contratosProximosVencer = contratos.filter(c => {
    if (!c.fechaFin || c.estado !== 'ACTIVO') return false;
    const diasRestantes = Math.ceil((new Date(c.fechaFin) - new Date()) / (1000 * 60 * 60 * 24));
    return diasRestantes <= 30 && diasRestantes > 0;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contratos.length}</p>
                <p className="text-sm text-gray-500">Total Contratos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {contratos.filter(c => c.estado === 'ACTIVO').length}
                </p>
                <p className="text-sm text-gray-500">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contratosProximosVencer.length}</p>
                <p className="text-sm text-gray-500">Por Vencer (30 dias)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {contratos.filter(c => c.estado === 'EN_RENOVACION').length}
                </p>
                <p className="text-sm text-gray-500">En Renovacion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por empleado o numero de contrato..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Contrato
          </Button>
        </div>
      </div>

      {/* Alertas de contratos por vencer */}
      {contratosProximosVencer.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Contratos Proximos a Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contratosProximosVencer.slice(0, 5).map(contrato => {
                const diasRestantes = Math.ceil((new Date(contrato.fechaFin) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={contrato.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                    <div>
                      <span className="font-medium">{contrato.empleado?.nombre} {contrato.empleado?.apellido}</span>
                      <span className="text-gray-500 ml-2">- {contrato.numeroContrato}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-orange-600">
                        {diasRestantes} dias restantes
                      </Badge>
                      <Button variant="outline" size="sm">Renovar</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de contratos */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando contratos...</div>
          ) : filteredContratos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">No hay contratos</h3>
              <p className="text-sm text-gray-400 mt-1">Crea un nuevo contrato para comenzar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>No. Contrato</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Salario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContratos.map(contrato => (
                  <TableRow key={contrato.id}>
                    <TableCell className="font-medium">
                      {contrato.empleado?.nombre} {contrato.empleado?.apellido}
                    </TableCell>
                    <TableCell>{contrato.numeroContrato}</TableCell>
                    <TableCell>{TIPO_CONTRATO_LABELS[contrato.tipoContrato]}</TableCell>
                    <TableCell>{new Date(contrato.fechaInicio).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {contrato.fechaFin ? new Date(contrato.fechaFin).toLocaleDateString() : 'Indefinido'}
                    </TableCell>
                    <TableCell>${contrato.salarioBase?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={ESTADO_COLORS[contrato.estado]}>
                        {contrato.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Descargar PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Nuevo Contrato */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Contrato</DialogTitle>
            <DialogDescription>
              Registrar un nuevo contrato laboral
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleCreateContrato({
              empleadoId: formData.get('empleadoId'),
              numeroContrato: formData.get('numeroContrato'),
              tipoContrato: formData.get('tipoContrato'),
              fechaInicio: formData.get('fechaInicio'),
              fechaFin: formData.get('fechaFin') || null,
              salarioBase: parseFloat(formData.get('salarioBase')),
              cargoId: formData.get('cargoId') || null,
              estado: 'ACTIVO'
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Empleado</Label>
                <Select name="empleadoId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {empleados.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nombre} {emp.apellido} - {emp.documento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Contrato</Label>
                  <Input name="numeroContrato" placeholder="CNT-2025-001" required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Contrato</Label>
                  <Select name="tipoContrato" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDEFINIDO">Indefinido</SelectItem>
                      <SelectItem value="FIJO">Término Fijo</SelectItem>
                      <SelectItem value="OBRA_LABOR">Obra o Labor</SelectItem>
                      <SelectItem value="PRESTACION_SERVICIOS">Prestación de Servicios</SelectItem>
                      <SelectItem value="APRENDIZAJE">Aprendizaje</SelectItem>
                      <SelectItem value="TEMPORAL">Temporal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio</Label>
                  <Input name="fechaInicio" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Fin (Opcional)</Label>
                  <Input name="fechaFin" type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Salario Base</Label>
                <Input name="salarioBase" type="number" min="0" step="0.01" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Crear Contrato
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
