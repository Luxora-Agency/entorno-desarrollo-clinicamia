import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Pill, AlertTriangle } from 'lucide-react';
import { formatDateLong } from '@/lib/dateUtils';
import { useState } from 'react';

export function DispensingModal({ isOpen, onClose, orden, onDespachar }) {
  const [loading, setLoading] = useState(false);

  if (!orden) return null;

  const handleDespachar = async () => {
    setLoading(true);
    const success = await onDespachar(orden.id);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Pill className="w-6 h-6 text-emerald-600" />
            Detalle de Orden de Medicamentos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Paciente</p>
                <p className="font-semibold text-gray-900">
                  {orden.paciente?.nombre} {orden.paciente?.apellido}
                </p>
                <p className="text-xs text-gray-500">C.C. {orden.paciente?.cedula}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Doctor</p>
                <p className="font-semibold text-gray-900">
                  {orden.doctor?.nombre} {orden.doctor?.apellido}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Fecha Orden</p>
                <p className="font-medium text-gray-900">
                  {orden.fechaOrden ? formatDateLong(orden.fechaOrden).fecha : '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={orden.estado === 'Pendiente' ? 'secondary' : orden.estado === 'Despachada' ? 'success' : 'outline'}>
                {orden.estado}
              </Badge>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-3">Medicamentos Solicitados</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Medicamento</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead>Indicaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orden.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.producto?.nombre}</div>
                        <div className="text-xs text-gray-500">
                          {item.producto?.principioActivo} - {item.producto?.presentacion}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {item.cantidad}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {item.indicaciones || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Observaciones */}
          {orden.observaciones && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-800">Observaciones</span>
              </div>
              <p className="text-sm text-yellow-800">{orden.observaciones}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t pt-4 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cerrar
          </Button>
          {orden.estado === 'Pendiente' && (
            <Button 
              onClick={handleDespachar} 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? 'Procesando...' : 'Despachar Orden'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
