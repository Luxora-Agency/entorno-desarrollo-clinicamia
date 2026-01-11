'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Search, Calendar, User, MapPin, Clock, Heart, AlertTriangle } from 'lucide-react';
import useSST from '@/hooks/useSST';

export default function AccidenteDetail({ accidente, onClose }) {
  const { generarFURAT, descargarFURAT, loading } = useSST();

  const handleGenerarFURAT = async () => {
    await generarFURAT(accidente.id);
    // Recargar para obtener el estado actualizado
    window.location.reload();
  };

  const handleDescargarFURAT = async () => {
    const blob = await descargarFURAT(accidente.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FURAT_${accidente.id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const emp = accidente.empleado || {};

  return (
    <div className="space-y-6">
      {/* Estado y acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={accidente.estado === 'CERRADO' ? 'success' : 'outline'}>
            {accidente.estado}
          </Badge>
          {accidente.tipoAccidente && (
            <Badge variant="secondary">{accidente.tipoAccidente}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!accidente.furatGenerado ? (
            <Button onClick={handleGenerarFURAT} disabled={loading}>
              <FileText className="w-4 h-4 mr-2" />
              Generar FURAT
            </Button>
          ) : (
            <Button variant="outline" onClick={handleDescargarFURAT}>
              <Download className="w-4 h-4 mr-2" />
              Descargar FURAT
            </Button>
          )}
        </div>
      </div>

      {/* Informacion del trabajador */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4" />
            Datos del Trabajador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Nombre:</span>
              <p className="font-medium">{emp.nombre} {emp.apellido}</p>
            </div>
            <div>
              <span className="text-gray-500">Documento:</span>
              <p className="font-medium">{emp.tipoDocumento} {emp.documento}</p>
            </div>
            <div>
              <span className="text-gray-500">Cargo:</span>
              <p className="font-medium">{emp.cargo?.nombre || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Area:</span>
              <p className="font-medium">{emp.area || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informacion del accidente */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Datos del Accidente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-500">Fecha:</span>
                <p className="font-medium">
                  {new Date(accidente.fechaAccidente).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-500">Hora:</span>
                <p className="font-medium">{accidente.horaAccidente || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 col-span-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-500">Lugar:</span>
                <p className="font-medium">{accidente.lugarAccidente}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Descripcion */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Descripcion de los Hechos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{accidente.descripcionHechos || 'Sin descripcion'}</p>
          {accidente.actividadRealizaba && (
            <div className="mt-4">
              <span className="text-sm text-gray-500">Actividad que realizaba:</span>
              <p className="text-sm">{accidente.actividadRealizaba}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agente y Lesion */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Agente, Mecanismo y Lesion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Agente:</span>
              <p className="font-medium">{accidente.agenteAccidente || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Mecanismo:</span>
              <p className="font-medium">{accidente.mecanismoAccidente || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Tipo de Lesion:</span>
              <p className="font-medium">{accidente.tipoLesion || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Parte Afectada:</span>
              <p className="font-medium">{accidente.parteCuerpoAfectada || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Atencion Medica */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Atencion Medica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Recibio atencion:</span>
              <p className="font-medium">{accidente.atencionMedica ? 'Si' : 'No'}</p>
            </div>
            <div>
              <span className="text-gray-500">Hospitalizacion:</span>
              <p className="font-medium">{accidente.hospitalizacion ? 'Si' : 'No'}</p>
            </div>
            {accidente.nombreIPS && (
              <div>
                <span className="text-gray-500">IPS que atendio:</span>
                <p className="font-medium">{accidente.nombreIPS}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500">Dias de incapacidad:</span>
              <p className="font-medium">{accidente.diasIncapacidad || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investigacion */}
      {accidente.investigacion && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="w-4 h-4" />
              Investigacion (Res. 1401/2007)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Estado:</span>
                <Badge className="ml-2" variant="outline">
                  {accidente.investigacion.estado}
                </Badge>
              </div>
              {accidente.investigacion.causaInmediata && (
                <div>
                  <span className="text-gray-500">Causa Inmediata:</span>
                  <p>{accidente.investigacion.causaInmediata}</p>
                </div>
              )}
              {accidente.investigacion.causaBasica && (
                <div>
                  <span className="text-gray-500">Causa Basica:</span>
                  <p>{accidente.investigacion.causaBasica}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
