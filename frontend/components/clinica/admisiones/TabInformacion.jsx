'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Tipo de Documento:</span>
            <p className="font-semibold">{paciente.tipoDocumento || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Número de Documento:</span>
            <p className="font-semibold">{paciente.cedula}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Fecha de Nacimiento:</span>
            <p className="font-semibold">
              {paciente.fechaNacimiento ? new Date(paciente.fechaNacimiento).toLocaleDateString('es-CO') : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Género:</span>
            <p className="font-semibold">{paciente.genero || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">País de Nacimiento:</span>
            <p className="font-semibold">{paciente.paisNacimiento || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Departamento:</span>
            <p className="font-semibold">{paciente.departamento || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Municipio:</span>
            <p className="font-semibold">{paciente.municipio || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Barrio:</span>
            <p className="font-semibold">{paciente.barrio || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Aseguramiento en Salud */}
      <Card>
        <CardHeader>
          <CardTitle>Aseguramiento en Salud</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">EPS/Aseguradora:</span>
            <p className="font-semibold">{paciente.eps || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Régimen:</span>
            <p className="font-semibold">{paciente.regimen || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Tipo de Afiliación:</span>
            <p className="font-semibold">{paciente.tipoAfiliacion || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Nivel SISBEN:</span>
            <p className="font-semibold">{paciente.nivelSisben || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Información Médica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Médica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-600">Tipo de Sangre:</span>
              <p className="font-semibold">
                {paciente.tipoSangre ? (
                  <Badge className="bg-red-100 text-red-700">{paciente.tipoSangre}</Badge>
                ) : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Peso:</span>
              <p className="font-semibold">{paciente.peso ? `${paciente.peso} kg` : 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Altura:</span>
              <p className="font-semibold">{paciente.altura ? `${paciente.altura} m` : 'N/A'}</p>
            </div>
          </div>

          {paciente.alergias && (
            <div>
              <span className="text-sm text-gray-600 block mb-2">Alergias:</span>
              <div className="flex flex-wrap gap-2">
                {(typeof paciente.alergias === 'string' 
                  ? paciente.alergias.split(',').map(a => a.trim())
                  : paciente.alergias
                ).map((alergia, i) => (
                  <Badge key={i} className="bg-red-100 text-red-700">{alergia}</Badge>
                ))}
              </div>
            </div>
          )}

          {paciente.enfermedadesCronicas && (
            <div>
              <span className="text-sm text-gray-600 block mb-2">Enfermedades Crónicas:</span>
              <div className="flex flex-wrap gap-2">
                {(typeof paciente.enfermedadesCronicas === 'string'
                  ? paciente.enfermedadesCronicas.split(',').map(e => e.trim())
                  : paciente.enfermedadesCronicas
                ).map((enfermedad, i) => (
                  <Badge key={i} className="bg-yellow-100 text-yellow-700">{enfermedad}</Badge>
                ))}
              </div>
            </div>
          )}

          {paciente.medicamentosActuales && (
            <div>
              <span className="text-sm text-gray-600 block mb-2">Medicamentos Actuales:</span>
              <div className="flex flex-wrap gap-2">
                {(typeof paciente.medicamentosActuales === 'string'
                  ? paciente.medicamentosActuales.split(',').map(m => m.trim())
                  : paciente.medicamentosActuales
                ).map((medicamento, i) => (
                  <Badge key={i} className="bg-blue-100 text-blue-700">{medicamento}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Adjuntos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600 text-sm">Cargando documentos...</p>
          ) : documentos.length > 0 ? (
            <div className="space-y-2">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-sm">{doc.nombreOriginal}</p>
                      <p className="text-xs text-gray-500">
                        {(doc.tamano / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc.id, doc.nombreOriginal)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No hay documentos adjuntos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
