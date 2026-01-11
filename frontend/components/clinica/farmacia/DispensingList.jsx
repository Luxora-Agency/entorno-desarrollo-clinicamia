import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDateLong } from '@/lib/dateUtils';
import { Skeleton } from '@/components/ui/skeleton';

export function DispensingList({ ordenes, loading, onViewDetails }) {
  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ordenes.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">No hay órdenes pendientes para despachar</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1"/> Pendiente</Badge>;
      case 'Despachada':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1"/> Despachada</Badge>;
      case 'Cancelada':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1"/> Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Órdenes de Medicamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenes.map((orden) => (
                <TableRow key={orden.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="text-sm">
                        <p className="font-medium">{formatDateLong(orden.fechaOrden).fecha}</p>
                        <p className="text-xs text-gray-500">{new Date(orden.fechaOrden).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                        <p className="font-medium">{orden.paciente?.nombre} {orden.paciente?.apellido}</p>
                        <p className="text-xs text-gray-500">CC {orden.paciente?.cedula}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-700">Dr. {orden.doctor?.apellido}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono">
                        {orden.items?.length || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(orden.estado)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetails(orden)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
