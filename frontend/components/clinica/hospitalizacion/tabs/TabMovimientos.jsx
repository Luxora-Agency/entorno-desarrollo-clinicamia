'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TabMovimientos({ admision, movimientos, onReload }) {
  const { toast } = useToast();
  const [showNuevo, setShowNuevo] = useState(false);
  const [unidades, setUnidades] = useState([]);
  const [camas, setCamas] = useState([]);
  const [movimientoData, setMovimientoData] = useState({
    tipo: 'Traslado',
    unidadDestinoId: '',
    camaDestinoId: '',
    motivo: '',
    observaciones: '',
  });

  useEffect(() => {
    if (showNuevo) {
      cargarUnidades();
    }
  }, [showNuevo]);

  useEffect(() => {
    if (movimientoData.unidadDestinoId) {
      cargarCamas(movimientoData.unidadDestinoId);
    }
  }, [movimientoData.unidadDestinoId]);

  const cargarUnidades = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/unidades?activo=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUnidades(data.data.unidades || data.data || []);
      }
    } catch (error) {
      console.error('Error cargando unidades:', error);
    }
  };

  const cargarCamas = async (unidadId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/camas/disponibles?unidadId=${unidadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCamas(data.data.camas || data.data || []);
      }
    } catch (error) {
      console.error('Error cargando camas:', error);
    }
  };

  const crearMovimiento = async () => {
    if (!movimientoData.unidadDestinoId || !movimientoData.camaDestinoId || !movimientoData.motivo) {
      toast({
        title: 'Campos requeridos',
        description: 'Complete todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movimientos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          admisionId: admision.id,
          tipo: movimientoData.tipo,
          unidadOrigenId: admision.unidadId,
          unidadDestinoId: movimientoData.unidadDestinoId,
          camaOrigenId: admision.camaId,
          camaDestinoId: movimientoData.camaDestinoId,
          motivo: movimientoData.motivo,
          observaciones: movimientoData.observaciones,
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Movimiento registrado correctamente',
        });
        setShowNuevo(false);
        setMovimientoData({
          tipo: 'Traslado',
          unidadDestinoId: '',
          camaDestinoId: '',
          motivo: '',
          observaciones: '',
        });
        onReload();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'No se pudo registrar el movimiento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Ubicación Actual */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Ubicación Actual
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Unidad:</span>
              <span className="ml-2 font-medium">{admision.unidad?.nombre}</span>
            </div>
            <div>
              <span className="text-gray-600">Cama:</span>
              <span className="ml-2 font-medium">
                Cama {admision.cama?.numero} - Habitación {admision.cama?.habitacion?.numero}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Historial de Movimientos</h3>
        <Button onClick={() => setShowNuevo(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Movimiento
        </Button>
      </div>

      {/* Lista de Movimientos */}
      <div className="space-y-3">
        {movimientos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay movimientos registrados</p>
        ) : (
          movimientos.map((mov) => (
            <Card key={mov.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Badge className="mb-2">{mov.tipo}</Badge>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Origen:</span>
                        <span className="ml-2 font-medium">
                          {mov.unidadOrigen?.nombre} - Cama {mov.camaOrigen?.numero}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Destino:</span>
                        <span className="ml-2 font-medium">
                          {mov.unidadDestino?.nombre} - Cama {mov.camaDestino?.numero}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Motivo:</span>
                      <p className="mt-1">{mov.motivo}</p>
                    </div>
                    {mov.observaciones && (
                      <p className="text-sm text-gray-500 mt-2">{mov.observaciones}</p>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(mov.fechaMovimiento).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal Nuevo Movimiento */}
      <Dialog open={showNuevo} onOpenChange={setShowNuevo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Movimiento</Label>
              <Select
                value={movimientoData.tipo}
                onValueChange={(value) => setMovimientoData({ ...movimientoData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Traslado">Traslado</SelectItem>
                  <SelectItem value="Ingreso">Ingreso</SelectItem>
                  <SelectItem value="Egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Unidad de Destino *</Label>
              <Select
                value={movimientoData.unidadDestinoId}
                onValueChange={(value) => setMovimientoData({ ...movimientoData, unidadDestinoId: value, camaDestinoId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione unidad" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidad) => (
                    <SelectItem key={unidad.id} value={unidad.id}>
                      {unidad.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {camas.length > 0 && (
              <div>
                <Label>Cama de Destino *</Label>
                <Select
                  value={movimientoData.camaDestinoId}
                  onValueChange={(value) => setMovimientoData({ ...movimientoData, camaDestinoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione cama" />
                  </SelectTrigger>
                  <SelectContent>
                    {camas.map((cama) => (
                      <SelectItem key={cama.id} value={cama.id}>
                        Cama {cama.numero} - Hab. {cama.habitacion?.numero} ({cama.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Motivo del Movimiento *</Label>
              <Textarea
                value={movimientoData.motivo}
                onChange={(e) => setMovimientoData({ ...movimientoData, motivo: e.target.value })}
                placeholder="Describa el motivo del traslado..."
                rows={3}
              />
            </div>

            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={movimientoData.observaciones}
                onChange={(e) => setMovimientoData({ ...movimientoData, observaciones: e.target.value })}
                placeholder="Observaciones adicionales..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNuevo(false)}>
                Cancelar
              </Button>
              <Button onClick={crearMovimiento}>
                Registrar Movimiento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
