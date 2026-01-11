'use client';

import { useState, useEffect } from 'react';
import { 
  History, Search, Eye, FileText, 
  Calendar, User, ArrowUpRight, Filter, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useDrogueria } from '@/hooks/useDrogueria';
import { formatDateLong } from '@/lib/dateUtils';

export default function VentasHistory({ user }) {
  const { ventas, fetchVentas, anularVenta, loading } = useDrogueria();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  const handleAnular = async (id) => {
    const motivo = prompt('Motivo de la anulación:');
    if (!motivo) return;
    await anularVenta(id, motivo);
    fetchVentas();
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" /> Historial de Ventas POS
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Nro Factura o Cliente..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => fetchVentas()}><RefreshCw className="w-4 h-4 mr-2" /> Recargar</Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-bold">Factura</TableHead>
              <TableHead className="font-bold">Fecha / Hora</TableHead>
              <TableHead className="font-bold">Cliente</TableHead>
              <TableHead className="font-bold text-right">Subtotal</TableHead>
              <TableHead className="font-bold text-right">IVA</TableHead>
              <TableHead className="font-bold text-right">Total</TableHead>
              <TableHead className="font-bold text-center">Estado</TableHead>
              <TableHead className="text-right font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {ventas.map(v => (
              <TableRow key={v.id} className={`hover:bg-gray-50 ${v.estado === 'Anulada' ? 'opacity-50' : ''}`}>
                <TableCell className="font-bold text-blue-600">{v.numeroFactura}</TableCell>
                <TableCell>
                  <div className="text-xs">
                    <p className="font-medium text-gray-900">{formatDateLong(v.fechaVenta).fecha}</p>
                    <p className="text-gray-500">{new Date(v.fechaVenta).toLocaleTimeString()}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    <p className="font-medium text-gray-900">{v.clienteNombre || 'Consumidor Final'}</p>
                    <p className="text-gray-500">{v.clienteDocumento || '-'}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs font-medium text-gray-500">
                  {formatCurrency(v.subtotal)}
                </TableCell>
                <TableCell className="text-right text-xs font-medium text-gray-500">
                  {formatCurrency(v.impuestos)}
                </TableCell>
                <TableCell className="text-right font-black text-gray-900">
                  {formatCurrency(v.total)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={v.estado === 'Completada' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
                    {v.estado}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {v.estado === 'Completada' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-400 hover:text-red-600"
                        onClick={() => handleAnular(v.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {ventas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-gray-400">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No hay registros de ventas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
