'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  AlertTriangle, Shield, Stethoscope, GraduationCap,
  HardHat, FileText, RefreshCw, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import useSST from '@/hooks/useSST';

const APTITUD_COLORS = {
  APTO: 'bg-green-100 text-green-700',
  APTO_CON_RESTRICCIONES: 'bg-yellow-100 text-yellow-700',
  NO_APTO: 'bg-red-100 text-red-700',
  APLAZADO: 'bg-orange-100 text-orange-700',
  SIN_EVALUAR: 'bg-gray-100 text-gray-500',
};

const ESTADO_EXAMEN_COLORS = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  PROGRAMADO: 'bg-blue-100 text-blue-700',
  REALIZADO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-gray-100 text-gray-500',
};

const NIVEL_EXPOSICION_COLORS = {
  BAJO: 'bg-green-100 text-green-700',
  MEDIO: 'bg-yellow-100 text-yellow-700',
  ALTO: 'bg-orange-100 text-orange-700',
  MUY_ALTO: 'bg-red-100 text-red-700',
};

/**
 * Componente para mostrar el perfil SST de un empleado
 * Integrado en el modulo RRHH
 */
export default function PerfilSSTEmpleado({ empleadoId, onClose }) {
  const { getPerfilSSTEmpleado, inicializarSSTEmpleado, loading, error } = useSST();
  const [perfilSST, setPerfilSST] = useState(null);
  const [inicializando, setInicializando] = useState(false);

  useEffect(() => {
    if (empleadoId) {
      cargarPerfil();
    }
  }, [empleadoId]);

  const cargarPerfil = async () => {
    try {
      const data = await getPerfilSSTEmpleado(empleadoId);
      setPerfilSST(data);
    } catch (err) {
      console.error('Error cargando perfil SST:', err);
    }
  };

  const handleInicializarSST = async () => {
    setInicializando(true);
    try {
      await inicializarSSTEmpleado(empleadoId);
      await cargarPerfil();
    } catch (err) {
      console.error('Error inicializando SST:', err);
    } finally {
      setInicializando(false);
    }
  };

  if (loading && !perfilSST) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Cargando perfil SST...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <XCircle className="w-12 h-12 mx-auto text-red-400 mb-2" />
        <p className="text-red-600">{error}</p>
        <Button variant="outline" className="mt-4" onClick={cargarPerfil}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!perfilSST) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-500">No hay datos SST para este empleado</p>
        <Button className="mt-4" onClick={handleInicializarSST} disabled={inicializando}>
          {inicializando ? 'Inicializando...' : 'Inicializar SST'}
        </Button>
      </div>
    );
  }

  const { empleado, profesiograma, riesgosExpuestos, aptitudActual, estadisticas } = perfilSST;

  return (
    <div className="space-y-4">
      {/* Header con resumen */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Aptitud Actual</p>
                <Badge className={APTITUD_COLORS[aptitudActual] || APTITUD_COLORS.SIN_EVALUAR}>
                  {aptitudActual?.replace(/_/g, ' ') || 'SIN EVALUAR'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Examenes Pendientes</p>
                <p className="text-xl font-bold">{estadisticas?.examenesPendientes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <GraduationCap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Capacitaciones SST</p>
                <p className="text-xl font-bold">{estadisticas?.capacitacionesCompletadas || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Accidentes</p>
                <p className="text-xl font-bold">{estadisticas?.accidentesRegistrados || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con detalles */}
      <Tabs defaultValue="riesgos" className="w-full">
        <TabsList>
          <TabsTrigger value="riesgos">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Riesgos
          </TabsTrigger>
          <TabsTrigger value="examenes">
            <Stethoscope className="w-4 h-4 mr-2" />
            Examenes Medicos
          </TabsTrigger>
          <TabsTrigger value="capacitaciones">
            <GraduationCap className="w-4 h-4 mr-2" />
            Capacitaciones
          </TabsTrigger>
          <TabsTrigger value="epp">
            <HardHat className="w-4 h-4 mr-2" />
            EPP
          </TabsTrigger>
          <TabsTrigger value="accidentes">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Accidentes
          </TabsTrigger>
        </TabsList>

        {/* Tab Riesgos */}
        <TabsContent value="riesgos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Riesgos Asociados al Cargo
                {profesiograma && (
                  <Badge variant="outline" className="ml-2">{profesiograma.nombre}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {riesgosExpuestos?.length > 0 ? (
                <div className="space-y-3">
                  {riesgosExpuestos.map((riesgo, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Matriz IPVR</p>
                        <p className="text-sm text-gray-500">
                          {riesgo.peligrosPrincipales?.length || 0} peligros identificados
                        </p>
                      </div>
                      <Badge className={NIVEL_EXPOSICION_COLORS[riesgo.nivelExposicion]}>
                        {riesgo.nivelExposicion}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No hay riesgos identificados para este cargo
                </p>
              )}

              {profesiograma && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Profesiograma del Cargo</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Periodicidad examenes:</span>
                      <p className="font-medium">{profesiograma.periodicidadMeses} meses</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Contraindicaciones:</span>
                      <p className="font-medium">{profesiograma.contraindicaciones || 'Ninguna'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Examenes */}
        <TabsContent value="examenes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Examenes Medicos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Examen</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Concepto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfilSST.examenesMedicos?.length > 0 ? (
                    perfilSST.examenesMedicos.map((examen) => (
                      <TableRow key={examen.id}>
                        <TableCell>
                          {new Date(examen.fechaProgramada).toLocaleDateString('es-CO')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{examen.tipoExamen}</Badge>
                        </TableCell>
                        <TableCell>{examen.nombreExamen}</TableCell>
                        <TableCell>
                          <Badge className={ESTADO_EXAMEN_COLORS[examen.estado]}>
                            {examen.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {examen.conceptoAptitud ? (
                            <Badge className={APTITUD_COLORS[examen.conceptoAptitud]}>
                              {examen.conceptoAptitud?.replace(/_/g, ' ')}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No hay examenes registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Capacitaciones */}
        <TabsContent value="capacitaciones">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Capacitaciones SST Completadas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Capacitacion</TableHead>
                    <TableHead>Duracion</TableHead>
                    <TableHead>Asistio</TableHead>
                    <TableHead>Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfilSST.capacitacionesSST?.length > 0 ? (
                    perfilSST.capacitacionesSST.map((asistencia) => (
                      <TableRow key={asistencia.id}>
                        <TableCell>
                          {new Date(asistencia.capacitacion?.fechaProgramada).toLocaleDateString('es-CO')}
                        </TableCell>
                        <TableCell>{asistencia.capacitacion?.nombre}</TableCell>
                        <TableCell>{asistencia.capacitacion?.duracionHoras}h</TableCell>
                        <TableCell>
                          {asistencia.asistio ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          {asistencia.notaEvaluacion ? `${asistencia.notaEvaluacion}%` : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No hay capacitaciones registradas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab EPP */}
        <TabsContent value="epp">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">EPP Asignado</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EPP</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vida Util</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfilSST.eppAsignado?.length > 0 ? (
                    perfilSST.eppAsignado.map((entrega) => (
                      <TableRow key={entrega.id}>
                        <TableCell className="font-medium">{entrega.epp?.nombre}</TableCell>
                        <TableCell>
                          {new Date(entrega.fechaEntrega).toLocaleDateString('es-CO')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={entrega.fechaDevolucion ? 'secondary' : 'success'}>
                            {entrega.fechaDevolucion ? 'Devuelto' : 'Activo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {entrega.epp?.vidaUtilMeses ? `${entrega.epp.vidaUtilMeses} meses` : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No hay EPP asignado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Accidentes */}
        <TabsContent value="accidentes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Accidentes e Incidentes</CardTitle>
            </CardHeader>
            <CardContent>
              {perfilSST.accidentes?.length > 0 || perfilSST.incidentes?.length > 0 ? (
                <div className="space-y-4">
                  {perfilSST.accidentes?.map((accidente) => (
                    <div key={accidente.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="destructive">ACCIDENTE</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(accidente.fechaAccidente).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      <p className="font-medium">{accidente.tipoAccidente}</p>
                      <p className="text-sm text-gray-600 mt-1">{accidente.descripcionHechos}</p>
                      {accidente.diasIncapacidad > 0 && (
                        <p className="text-sm text-orange-600 mt-2">
                          Dias de incapacidad: {accidente.diasIncapacidad}
                        </p>
                      )}
                    </div>
                  ))}

                  {perfilSST.incidentes?.map((incidente) => (
                    <div key={incidente.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="warning" className="bg-yellow-100 text-yellow-700">INCIDENTE</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(incidente.fechaIncidente).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      <p className="font-medium">{incidente.tipoIncidente}</p>
                      <p className="text-sm text-gray-600 mt-1">{incidente.descripcion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-400 mb-2" />
                  No hay accidentes ni incidentes registrados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
