'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, User, Phone, MapPin, Building2, Heart, AlertCircle, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TabInformacion({ paciente }) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentos();
  }, [paciente]);

  const fetchDocumentos = async () => {
    if (!paciente?.id) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/documentos-paciente/paciente/${paciente.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setDocumentos(result.data?.documentos || []);
      }
    } catch (error) {
      console.error('Error al cargar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentoId, nombreOriginal) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/documentos-paciente/download/${documentoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreOriginal;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error al descargar documento:', error);
      alert('Error al descargar el documento');
    }
  };

  const tieneDiscapacidad = paciente.discapacidad === 'Aplica';

  return (
    <div className="space-y-6">
      {/* Condición de Discapacidad */}
      {tieneDiscapacidad && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <AlertCircle className="w-5 h-5" />
              Condición de Discapacidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-purple-900">Paciente con Discapacidad</p>
                <p className="text-sm text-purple-700">
                  Tipo: {paciente.tipoDiscapacidad || 'No especificado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responsable del Paciente */}
      {paciente.responsable && paciente.responsable.nombre && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <UserCheck className="w-5 h-5" />
              Responsable del Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-orange-900">{paciente.responsable.nombre}</p>
                <p className="text-sm text-orange-700">
                  {paciente.responsable.parentesco && `${paciente.responsable.parentesco}`}
                  {paciente.responsable.telefono && ` | Tel: ${paciente.responsable.telefono}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acompañante */}
      {paciente.acompanante && paciente.acompanante.nombre && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Users className="w-5 h-5" />
              Acompañante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blue-900">{paciente.acompanante.nombre}</p>
                <p className="text-sm text-blue-700">
                  {paciente.acompanante.parentesco && `${paciente.acompanante.parentesco}`}
                  {paciente.acompanante.telefono && ` | Tel: ${paciente.acompanante.telefono}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Tipo de Documento</span>
            <p className="font-semibold text-gray-900">{paciente.tipoDocumento || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Número de Documento</span>
            <p className="font-semibold text-gray-900">{paciente.cedula}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Fecha de Nacimiento</span>
            <p className="font-semibold text-gray-900">
              {paciente.fechaNacimiento ? new Date(paciente.fechaNacimiento).toLocaleDateString('es-CO') : 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Género</span>
            <p className="font-semibold text-gray-900">{paciente.genero || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Estado Civil</span>
            <p className="font-semibold text-gray-900 capitalize">{paciente.estadoCivil?.replace('_', ' ') || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Ocupación</span>
            <p className="font-semibold text-gray-900">{paciente.ocupacion || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">País</span>
            <p className="font-semibold text-gray-900">{paciente.pais || paciente.paisNacimiento || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Escolaridad</span>
            <p className="font-semibold text-gray-900">{paciente.escolaridad || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Etnia</span>
            <p className="font-semibold text-gray-900">{paciente.etnia || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-600" />
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Departamento</span>
            <p className="font-semibold text-gray-900">{paciente.departamento || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Municipio</span>
            <p className="font-semibold text-gray-900">{paciente.municipio || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Barrio</span>
            <p className="font-semibold text-gray-900">{paciente.barrio || 'N/A'}</p>
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Dirección</span>
            <p className="font-semibold text-gray-900 break-words">{paciente.direccion || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Información de Contacto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-gray-600" />
            Información de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Teléfono</span>
            <p className="font-semibold text-gray-900">{paciente.telefono || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Celular</span>
            <p className="font-semibold text-gray-900">{paciente.celular || 'N/A'}</p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <span className="text-xs text-gray-500 uppercase font-medium">Email</span>
            <p className="font-semibold text-gray-900 break-all">{paciente.email || 'N/A'}</p>
          </div>
          {paciente.contactosEmergencia && (
            <div className="sm:col-span-2 pt-2 border-t">
              <span className="text-xs text-gray-500 uppercase font-medium block mb-3">Contactos de Emergencia</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Array.isArray(paciente.contactosEmergencia)
                  ? paciente.contactosEmergencia
                  : JSON.parse(paciente.contactosEmergencia || '[]')
                ).map((contacto, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{contacto.nombre}</p>
                      <p className="text-xs text-gray-600">{contacto.parentesco} | {contacto.telefono}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aseguramiento en Salud */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            Aseguramiento y Convenios
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">EPS/Aseguradora</span>
            <p className="font-semibold text-gray-900">{paciente.eps || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Régimen</span>
            <p className="font-semibold text-gray-900 capitalize">{paciente.regimen || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Tipo de Afiliación</span>
            <p className="font-semibold text-gray-900 capitalize">{paciente.tipoAfiliacion || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Nivel SISBEN</span>
            <p className="font-semibold text-gray-900">{paciente.nivelSisben || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">ARL</span>
            <p className="font-semibold text-gray-900">{paciente.arl || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Convenio</span>
            <p className="font-semibold text-gray-900">{paciente.convenio || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Tipo de Usuario</span>
            <p className="font-semibold text-gray-900 capitalize">{paciente.tipoUsuario || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-medium">Carnet/Póliza</span>
            <p className="font-semibold text-gray-900">{paciente.carnetPoliza || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Información Laboral */}
      {(paciente.nivelEducacion || paciente.empleadorActual) && (
        <Card>
          <CardHeader>
            <CardTitle>Información Laboral y Educativa</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-medium">Nivel de Educación</span>
              <p className="font-semibold text-gray-900 capitalize">{paciente.nivelEducacion?.replace('_', ' ') || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-medium">Empleador Actual</span>
              <p className="font-semibold text-gray-900">{paciente.empleadorActual || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de Referencia */}
      {(paciente.referidoPor || paciente.tipoPaciente || paciente.categoria) && (
        <Card>
          <CardHeader>
            <CardTitle>Información de Referencia</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-medium">Referido Por</span>
              <p className="font-semibold text-gray-900">{paciente.referidoPor || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-medium">Nombre de Quien Refiere</span>
              <p className="font-semibold text-gray-900">{paciente.nombreRefiere || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-medium">Tipo de Paciente</span>
              <p className="font-semibold text-gray-900">{paciente.tipoPaciente || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-medium">Categoría</span>
              <p className="font-semibold text-gray-900">{paciente.categoria || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información Médica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-gray-600" />
            Información Médica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-medium">Tipo de Sangre</span>
              <div>
                {paciente.tipoSangre ? (
                  <Badge className="bg-red-100 text-red-700 border-red-200">{paciente.tipoSangre}</Badge>
                ) : <span className="text-gray-900 font-semibold">N/A</span>}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-medium">Peso</span>
              <p className="font-semibold text-gray-900">{paciente.peso ? `${paciente.peso} kg` : 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-medium">Altura</span>
              <p className="font-semibold text-gray-900">
                {paciente.altura ? `${paciente.altura > 3 ? paciente.altura : (paciente.altura * 100).toFixed(0)} cm` : 'N/A'}
              </p>
            </div>
            {paciente.peso && paciente.altura && (
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase font-medium">IMC</span>
                <p className="font-semibold text-gray-900">
                  {(() => {
                    const altura = paciente.altura > 3 ? paciente.altura / 100 : paciente.altura;
                    return (paciente.peso / (altura * altura)).toFixed(1);
                  })()}
                </p>
              </div>
            )}
          </div>

          {paciente.alergias && (
            <div className="pt-3 border-t">
              <span className="text-xs text-gray-500 uppercase font-medium block mb-2">Alergias</span>
              <div className="flex flex-wrap gap-2">
                {(typeof paciente.alergias === 'string'
                  ? paciente.alergias.split(',').map(a => a.trim()).filter(Boolean)
                  : paciente.alergias
                ).map((alergia, i) => (
                  <Badge key={i} className="bg-red-100 text-red-700 border-red-200">{alergia}</Badge>
                ))}
              </div>
            </div>
          )}

          {paciente.enfermedadesCronicas && (
            <div className="pt-3 border-t">
              <span className="text-xs text-gray-500 uppercase font-medium block mb-2">Enfermedades Crónicas</span>
              <div className="flex flex-wrap gap-2">
                {(typeof paciente.enfermedadesCronicas === 'string'
                  ? paciente.enfermedadesCronicas.split(',').map(e => e.trim()).filter(Boolean)
                  : paciente.enfermedadesCronicas
                ).map((enfermedad, i) => (
                  <Badge key={i} className="bg-yellow-100 text-yellow-700 border-yellow-200">{enfermedad}</Badge>
                ))}
              </div>
            </div>
          )}

          {paciente.medicamentosActuales && (
            <div className="pt-3 border-t">
              <span className="text-xs text-gray-500 uppercase font-medium block mb-2">Medicamentos Actuales</span>
              <div className="flex flex-wrap gap-2">
                {(typeof paciente.medicamentosActuales === 'string'
                  ? paciente.medicamentosActuales.split(',').map(m => m.trim()).filter(Boolean)
                  : paciente.medicamentosActuales
                ).map((medicamento, i) => (
                  <Badge key={i} className="bg-blue-100 text-blue-700 border-blue-200">{medicamento}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Documentos Adjuntos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600 text-sm">Cargando documentos...</p>
          ) : documentos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{doc.nombreOriginal}</p>
                      <p className="text-xs text-gray-500">
                        {(doc.tamano / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0"
                    onClick={() => handleDownload(doc.id, doc.nombreOriginal)}
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Descargar</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No hay documentos adjuntos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
