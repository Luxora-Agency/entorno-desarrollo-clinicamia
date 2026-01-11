'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  CheckCircle2,
  Download,
  User,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente para Registro de Entrada/Salida de HC Físicas
 *
 * Permite controlar préstamos de historias clínicas físicas:
 * - Registro de salida (préstamo)
 * - Registro de entrada (devolución)
 * - Historial de movimientos
 * - Exportación a Excel
 */
export default function RegistroEntradaSalida() {
  const [movimientos, setMovimientos] = useState([
    {
      id: '1',
      tipo: 'SALIDA',
      numeroHC: 'HC-2024-001234',
      paciente: 'Juan Pérez García',
      solicitante: 'Dr. María González',
      area: 'Consulta Externa',
      motivo: 'Revisión médica programada',
      fechaSalida: new Date('2024-01-05T10:30:00'),
      fechaEntrada: null,
      observaciones: '',
      estado: 'PENDIENTE',
    },
    {
      id: '2',
      tipo: 'DEVOLUCION',
      numeroHC: 'HC-2024-001122',
      paciente: 'Ana Martínez López',
      solicitante: 'Dr. Carlos Ruiz',
      area: 'Urgencias',
      motivo: 'Atención de urgencia',
      fechaSalida: new Date('2024-01-04T14:15:00'),
      fechaEntrada: new Date('2024-01-04T18:45:00'),
      observaciones: 'HC devuelta completa',
      estado: 'DEVUELTA',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [modalTipo, setModalTipo] = useState('SALIDA'); // SALIDA o ENTRADA
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    numeroHC: '',
    paciente: '',
    solicitante: '',
    area: '',
    motivo: '',
    observaciones: '',
  });

  const handleNuevaSalida = () => {
    setModalTipo('SALIDA');
    setFormData({
      numeroHC: '',
      paciente: '',
      solicitante: '',
      area: '',
      motivo: '',
      observaciones: '',
    });
    setShowModal(true);
  };

  const handleRegistrarEntrada = (movimiento) => {
    setModalTipo('ENTRADA');
    setFormData({
      numeroHC: movimiento.numeroHC,
      paciente: movimiento.paciente,
      solicitante: movimiento.solicitante,
      area: movimiento.area,
      motivo: movimiento.motivo,
      observaciones: '',
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (modalTipo === 'SALIDA') {
      // Registrar nueva salida
      const nuevoMovimiento = {
        id: Date.now().toString(),
        tipo: 'SALIDA',
        ...formData,
        fechaSalida: new Date(),
        fechaEntrada: null,
        estado: 'PENDIENTE',
      };
      setMovimientos([nuevoMovimiento, ...movimientos]);
    } else {
      // Registrar entrada (devolución)
      setMovimientos(
        movimientos.map((m) =>
          m.numeroHC === formData.numeroHC && m.estado === 'PENDIENTE'
            ? {
                ...m,
                tipo: 'DEVOLUCION',
                fechaEntrada: new Date(),
                observaciones: formData.observaciones,
                estado: 'DEVUELTA',
              }
            : m
        )
      );
    }
    setShowModal(false);
  };

  const handleExportarExcel = () => {
    console.log('Exportando a Excel...');
    // En producción: generar archivo Excel con ExcelJS
  };

  const movimientosFiltrados = movimientos.filter(
    (m) =>
      m.numeroHC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.solicitante.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const estadisticas = {
    total: movimientos.length,
    pendientes: movimientos.filter((m) => m.estado === 'PENDIENTE').length,
    devueltas: movimientos.filter((m) => m.estado === 'DEVUELTA').length,
  };

  return (
    <div className="space-y-4">
      {/* Cards de Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
            <p className="text-xs text-muted-foreground">Registros históricos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HC Prestadas</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{estadisticas.pendientes}</div>
            <p className="text-xs text-muted-foreground">Pendientes de devolución</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HC Devueltas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.devueltas}</div>
            <p className="text-xs text-muted-foreground">Ciclo completado</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Registro de Movimientos</span>
            <div className="flex gap-2">
              <Button onClick={handleExportarExcel} variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
              <Button onClick={handleNuevaSalida} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Salida
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Control de préstamos de historias clínicas físicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Búsqueda */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por HC, paciente o solicitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabla de Movimientos */}
          <div className="space-y-2">
            {movimientosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay movimientos registrados</p>
              </div>
            ) : (
              movimientosFiltrados.map((movimiento) => (
                <Card
                  key={movimiento.id}
                  className={`${
                    movimiento.estado === 'PENDIENTE' ? 'border-orange-200 bg-orange-50/30' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {movimiento.tipo === 'SALIDA' || movimiento.estado === 'PENDIENTE' ? (
                            <ArrowDownToLine className="h-4 w-4 text-orange-600" />
                          ) : (
                            <ArrowUpFromLine className="h-4 w-4 text-green-600" />
                          )}
                          <span className="font-semibold text-sm">{movimiento.numeroHC}</span>
                          <Badge
                            className={
                              movimiento.estado === 'PENDIENTE'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            {movimiento.estado}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Paciente</p>
                            <p className="font-medium">{movimiento.paciente}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Solicitante</p>
                            <p className="font-medium">{movimiento.solicitante}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Área</p>
                            <p>{movimiento.area}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Motivo</p>
                            <p>{movimiento.motivo}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Fecha Salida</p>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <p>
                                {format(movimiento.fechaSalida, "dd/MM/yyyy HH:mm", { locale: es })}
                              </p>
                            </div>
                          </div>
                          {movimiento.fechaEntrada && (
                            <div>
                              <p className="text-xs text-muted-foreground">Fecha Entrada</p>
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                <p>
                                  {format(movimiento.fechaEntrada, "dd/MM/yyyy HH:mm", {
                                    locale: es,
                                  })}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {movimiento.observaciones && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground">Observaciones</p>
                            <p className="text-sm">{movimiento.observaciones}</p>
                          </div>
                        )}
                      </div>

                      {movimiento.estado === 'PENDIENTE' && (
                        <Button
                          size="sm"
                          onClick={() => handleRegistrarEntrada(movimiento)}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <ArrowUpFromLine className="h-4 w-4" />
                          Registrar Entrada
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal: Registrar Salida/Entrada */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {modalTipo === 'SALIDA' ? (
                <div className="flex items-center gap-2">
                  <ArrowDownToLine className="h-5 w-5 text-orange-600" />
                  Registrar Salida de HC
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ArrowUpFromLine className="h-5 w-5 text-green-600" />
                  Registrar Entrada de HC
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {modalTipo === 'SALIDA' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numeroHC">
                      Número de HC <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="numeroHC"
                      placeholder="HC-2024-XXXXXX"
                      value={formData.numeroHC}
                      onChange={(e) => setFormData({ ...formData, numeroHC: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paciente">
                      Nombre del Paciente <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="paciente"
                      placeholder="Nombre completo"
                      value={formData.paciente}
                      onChange={(e) => setFormData({ ...formData, paciente: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="solicitante">
                      Solicitante <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="solicitante"
                      placeholder="Nombre del solicitante"
                      value={formData.solicitante}
                      onChange={(e) => setFormData({ ...formData, solicitante: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="area">
                      Área <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="area"
                      placeholder="Ej: Consulta Externa, Urgencias"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="motivo">
                    Motivo del Préstamo <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="motivo"
                    placeholder="Describa el motivo por el cual se solicita la HC..."
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 p-3 rounded">
                  <p className="text-sm font-medium text-green-900 mb-1">HC a devolver:</p>
                  <p className="text-sm text-green-700">
                    {formData.numeroHC} - {formData.paciente}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Solicitado por: {formData.solicitante} ({formData.area})
                  </p>
                </div>

                <div>
                  <Label htmlFor="observaciones">Observaciones de la Devolución</Label>
                  <Textarea
                    id="observaciones"
                    placeholder="Observaciones sobre el estado de la HC al devolverla (opcional)..."
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ej: HC completa sin novedades, HC con hojas sueltas, etc.
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                modalTipo === 'SALIDA' &&
                (!formData.numeroHC ||
                  !formData.paciente ||
                  !formData.solicitante ||
                  !formData.area ||
                  !formData.motivo)
              }
              className={
                modalTipo === 'SALIDA' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
              }
            >
              {modalTipo === 'SALIDA' ? 'Registrar Salida' : 'Registrar Entrada'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
