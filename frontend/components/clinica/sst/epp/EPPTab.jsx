'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, HardHat, AlertTriangle, Package } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function EPPTab({ user }) {
  const {
    epp,
    entregasEpp,
    fetchElementosEPP,
    fetchEntregasEPP,
    getEPPVencidos,
    loading
  } = useSST();

  const [vencidos, setVencidos] = useState([]);
  const [vista, setVista] = useState('catalogo');

  useEffect(() => {
    fetchElementosEPP();
    fetchEntregasEPP();
    getEPPVencidos().then(data => setVencidos(data || []));
  }, [fetchElementosEPP, fetchEntregasEPP, getEPPVencidos]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Elementos de Proteccion Personal</h2>
          <p className="text-sm text-gray-500">Control de entrega y vencimiento de EPP</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setVista(vista === 'catalogo' ? 'entregas' : 'catalogo')}>
            {vista === 'catalogo' ? 'Ver Entregas' : 'Ver Catalogo'}
          </Button>
          <Button onClick={() => {}}>
            <Plus className="w-4 h-4 mr-2" />
            {vista === 'catalogo' ? 'Nuevo Elemento' : 'Registrar Entrega'}
          </Button>
        </div>
      </div>

      {/* Alerta de vencidos */}
      {vencidos.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="font-medium text-orange-700">{vencidos.length} EPP vencidos</p>
                <p className="text-sm text-orange-600">Requieren reemplazo inmediato</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {vista === 'catalogo' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-5 h-5" />
              Catalogo de EPP
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Vida Util</TableHead>
                  <TableHead>Norma</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {epp.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No hay elementos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  epp.map((elemento) => (
                    <TableRow key={elemento.id}>
                      <TableCell>{elemento.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{elemento.categoria}</Badge>
                      </TableCell>
                      <TableCell>{elemento.vidaUtilMeses} meses</TableCell>
                      <TableCell>{elemento.normaAplicable || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={elemento.activo ? 'success' : 'secondary'}>
                          {elemento.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HardHat className="w-5 h-5" />
              Entregas de EPP
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Elemento</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entregasEpp.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No hay entregas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  entregasEpp.map((entrega) => (
                    <TableRow key={entrega.id}>
                      <TableCell>
                        {new Date(entrega.fechaEntrega).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                      </TableCell>
                      <TableCell>
                        {entrega.empleado?.nombre} {entrega.empleado?.apellido}
                      </TableCell>
                      <TableCell>{entrega.elemento?.nombre}</TableCell>
                      <TableCell>{entrega.cantidad}</TableCell>
                      <TableCell>
                        {entrega.fechaVencimiento && (
                          <span className={
                            new Date(entrega.fechaVencimiento) < new Date()
                              ? 'text-red-500 font-medium'
                              : ''
                          }>
                            {new Date(entrega.fechaVencimiento).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entrega.estado === 'ENTREGADO' ? 'success' : 'outline'}>
                          {entrega.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
