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
import { Plus, LayoutGrid, AlertTriangle, CheckCircle2 } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function MatrizIPVRTab({ user }) {
  const { matrizIPVR, getMatrizVigente, fetchMatrices, createMatriz, loading } = useSST();
  const [matrices, setMatrices] = useState([]);

  useEffect(() => {
    getMatrizVigente();
    fetchMatrices().then(data => setMatrices(data?.data || []));
  }, [getMatrizVigente, fetchMatrices]);

  const getNivelRiesgoBadge = (nivel) => {
    const colores = {
      I: 'bg-red-500 text-white',
      II: 'bg-orange-500 text-white',
      III: 'bg-yellow-500 text-black',
      IV: 'bg-green-500 text-white',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${colores[nivel] || 'bg-gray-200'}`}>{nivel}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Matriz IPVR</h2>
          <p className="text-sm text-gray-500">Identificacion de Peligros y Valoracion de Riesgos - GTC 45</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Matriz
        </Button>
      </div>

      {/* Matriz Vigente */}
      {matrizIPVR ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                Matriz Vigente: {matrizIPVR.nombre}
              </CardTitle>
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Activa
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Version:</span>
                <p className="font-medium">{matrizIPVR.version}</p>
              </div>
              <div>
                <span className="text-gray-500">Fecha Elaboracion:</span>
                <p className="font-medium">
                  {new Date(matrizIPVR.fechaElaboracion).toLocaleDateString('es-CO')}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Peligros Identificados:</span>
                <p className="font-medium">{matrizIPVR.peligros?.length || 0}</p>
              </div>
              <div>
                <span className="text-gray-500">Elaborado por:</span>
                <p className="font-medium">{matrizIPVR.elaboradoPor || 'N/A'}</p>
              </div>
            </div>

            {matrizIPVR.peligros?.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proceso/Area</TableHead>
                    <TableHead>Peligro</TableHead>
                    <TableHead>Clasificacion</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>NR</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Controles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrizIPVR.peligros.slice(0, 10).map((peligro) => (
                    <TableRow key={peligro.id}>
                      <TableCell>{peligro.procesoArea}</TableCell>
                      <TableCell className="max-w-40 truncate">{peligro.descripcionPeligro}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{peligro.clasificacion}</Badge>
                      </TableCell>
                      <TableCell className="max-w-32 truncate">{peligro.fuenteGeneradora}</TableCell>
                      <TableCell>
                        {peligro.valoraciones?.[0]?.nivelRiesgo || '-'}
                      </TableCell>
                      <TableCell>
                        {peligro.valoraciones?.[0]?.interpretacionNR &&
                          getNivelRiesgoBadge(peligro.valoraciones[0].interpretacionNR)}
                      </TableCell>
                      <TableCell>
                        {peligro.valoraciones?.[0]?.medidasIntervencion?.length || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <LayoutGrid className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay matriz IPVR vigente</p>
            <Button className="mt-4" onClick={() => {}}>
              Crear Primera Matriz
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Historial de Matrices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de Matrices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Peligros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    Sin matrices registradas
                  </TableCell>
                </TableRow>
              ) : (
                matrices.map((matriz) => (
                  <TableRow key={matriz.id}>
                    <TableCell>{matriz.nombre}</TableCell>
                    <TableCell>{matriz.version}</TableCell>
                    <TableCell>
                      {new Date(matriz.fechaElaboracion).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={matriz.estado === 'VIGENTE' ? 'success' : 'secondary'}>
                        {matriz.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{matriz._count?.peligros || 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
