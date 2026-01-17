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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Siren, Users, Calendar, FileText } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function EmergenciasTab({ user }) {
  const {
    planEmergencias,
    brigada,
    simulacros,
    getPlanEmergencias,
    getBrigada,
    fetchSimulacros,
    loading
  } = useSST();

  const [activeTab, setActiveTab] = useState('plan');

  useEffect(() => {
    getPlanEmergencias();
    getBrigada();
    fetchSimulacros();
  }, [getPlanEmergencias, getBrigada, fetchSimulacros]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Plan de Emergencias</h2>
          <p className="text-sm text-gray-500">Prevencion, preparacion y respuesta ante emergencias</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plan" className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            Plan
          </TabsTrigger>
          <TabsTrigger value="brigada" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Brigada
          </TabsTrigger>
          <TabsTrigger value="simulacros" className="flex items-center gap-1">
            <Siren className="w-4 h-4" />
            Simulacros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="mt-4">
          {planEmergencias ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Plan de Emergencias</CardTitle>
                    <Badge variant="success">Vigente</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Version:</span>
                      <p className="font-medium">{planEmergencias.version}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Fecha:</span>
                      <p className="font-medium">
                        {new Date(planEmergencias.fechaElaboracion).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Amenazas:</span>
                      <p className="font-medium">{planEmergencias.amenazas?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analisis de Amenazas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Analisis de Amenazas y Vulnerabilidad</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amenaza</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Probabilidad</TableHead>
                        <TableHead>Nivel Riesgo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(planEmergencias.amenazas || []).map((amenaza) => (
                        <TableRow key={amenaza.id}>
                          <TableCell>{amenaza.descripcion}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{amenaza.tipo}</Badge>
                          </TableCell>
                          <TableCell>{amenaza.probabilidad}</TableCell>
                          <TableCell>
                            <Badge variant={
                              amenaza.nivelRiesgo === 'ALTO' ? 'destructive' :
                              amenaza.nivelRiesgo === 'MEDIO' ? 'warning' : 'success'
                            }>
                              {amenaza.nivelRiesgo}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay plan de emergencias</p>
                <Button className="mt-4" onClick={() => {}}>
                  Crear Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="brigada" className="mt-4">
          {brigada ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Brigada de Emergencias</CardTitle>
                  <Button size="sm" onClick={() => {}}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Miembro
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Rol Brigada</TableHead>
                      <TableHead>Especialidad</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(brigada.miembros || []).map((miembro) => (
                      <TableRow key={miembro.id}>
                        <TableCell>
                          {miembro.empleado?.nombre} {miembro.empleado?.apellido}
                        </TableCell>
                        <TableCell>{miembro.empleado?.cargo?.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{miembro.rolBrigada}</Badge>
                        </TableCell>
                        <TableCell>{miembro.especialidad}</TableCell>
                        <TableCell>
                          <Badge variant={miembro.activo ? 'success' : 'secondary'}>
                            {miembro.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay brigada conformada</p>
                <Button className="mt-4" onClick={() => {}}>
                  Crear Brigada
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="simulacros" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Simulacros</CardTitle>
                <Button size="sm" onClick={() => {}}>
                  <Plus className="w-4 h-4 mr-2" />
                  Programar Simulacro
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo Emergencia</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead>Tiempo Resp.</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Calificacion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulacros.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No hay simulacros registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    simulacros.map((simulacro) => (
                      <TableRow key={simulacro.id}>
                        <TableCell>
                          {new Date(simulacro.fechaProgramada).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                        </TableCell>
                        <TableCell>{simulacro.tipoEmergencia}</TableCell>
                        <TableCell>{simulacro.participantes || 0}</TableCell>
                        <TableCell>{simulacro.tiempoRespuesta || '-'} min</TableCell>
                        <TableCell>
                          <Badge variant={simulacro.estado === 'REALIZADO' ? 'success' : 'outline'}>
                            {simulacro.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{simulacro.calificacion || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
