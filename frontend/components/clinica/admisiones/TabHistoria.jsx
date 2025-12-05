'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Activity, 
  Pill, 
  AlertTriangle, 
  Stethoscope, 
  Heart,
  Calendar,
  User,
  ClipboardList
} from 'lucide-react';

export default function TabHistoria({ pacienteId, paciente }) {
  const [citas, setCitas] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [admisiones, setAdmisiones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pacienteId) {
      loadHistoriaClinica();
    }
  }, [pacienteId]);

  const loadHistoriaClinica = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // Cargar citas completadas
      const citasRes = await fetch(
        `${apiUrl}/citas?paciente_id=${pacienteId}&estado=Completada&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const citasData = await citasRes.json();
      setCitas(citasData.data || []);

      // Cargar documentos de historia clínica
      const docsRes = await fetch(
        `${apiUrl}/documentos-paciente?paciente_id=${pacienteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        const historiaClinicaDocs = (docsData.data || []).filter(
          doc => doc.categoria?.toLowerCase().includes('historia') || 
                 doc.categoria?.toLowerCase().includes('resultados')
        );
        setDocumentos(historiaClinicaDocs);
      }

      // Cargar admisiones
      const admRes = await fetch(
        `${apiUrl}/admisiones?paciente_id=${pacienteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (admRes.ok) {
        const admData = await admRes.json();
        setAdmisiones(admData.data || []);
      }
    } catch (error) {
      console.error('Error cargando historia clínica:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEstadoColor = (estado) => {
    const colors = {
      Completada: 'bg-green-100 text-green-800',
      Alta: 'bg-blue-100 text-blue-800',
      Hospitalizado: 'bg-yellow-100 text-yellow-800',
      default: 'bg-gray-100 text-gray-800',
    };
    return colors[estado] || colors.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historia clínica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información Médica General */}
      <Card className="border-emerald-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Información Médica General</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tipo de Sangre */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-red-500" />
                <p className="text-sm font-medium text-gray-700">Tipo de Sangre</p>
              </div>
              <p className="text-gray-900 font-semibold">
                {paciente?.tipoSangre || 'No registrado'}
              </p>
            </div>

            {/* Peso y Altura */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-medium text-gray-700">Peso / Altura</p>
              </div>
              <p className="text-gray-900">
                {paciente?.peso ? `${paciente.peso} kg` : 'N/A'} / {paciente?.altura ? `${paciente.altura} cm` : 'N/A'}
              </p>
            </div>

            {/* Alergias */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <p className="text-sm font-medium text-gray-700">Alergias</p>
              </div>
              <p className="text-gray-900">
                {paciente?.alergias || 'Sin alergias registradas'}
              </p>
            </div>

            {/* Enfermedades Crónicas */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="h-4 w-4 text-purple-500" />
                <p className="text-sm font-medium text-gray-700">Enfermedades Crónicas</p>
              </div>
              <p className="text-gray-900">
                {paciente?.enfermedadesCronicas || 'Sin enfermedades crónicas registradas'}
              </p>
            </div>

            {/* Medicamentos Actuales */}
            <div className="md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <Pill className="h-4 w-4 text-green-500" />
                <p className="text-sm font-medium text-gray-700">Medicamentos Actuales</p>
              </div>
              <p className="text-gray-900">
                {paciente?.medicamentosActuales || 'Sin medicamentos actuales'}
              </p>
            </div>

            {/* Antecedentes Quirúrgicos */}
            <div className="md:col-span-3">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="h-4 w-4 text-indigo-500" />
                <p className="text-sm font-medium text-gray-700">Antecedentes Quirúrgicos</p>
              </div>
              <p className="text-gray-900">
                {paciente?.antecedentesQuirurgicos || 'Sin antecedentes quirúrgicos'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultas Previas */}
      <Card className="border-emerald-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Consultas Previas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {citas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No hay consultas completadas registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {citas.map((cita) => (
                <div
                  key={cita.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getEstadoColor(cita.estado)}>
                          {cita.estado}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {formatDate(cita.fecha)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">
                        {cita.especialidad?.titulo || 'Consulta General'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dr(a). {cita.doctor?.nombre} {cita.doctor?.apellido}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Motivo:</p>
                    <p className="text-sm text-gray-900">{cita.motivo}</p>
                  </div>
                  {cita.notas && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Notas:</p>
                      <p className="text-sm text-gray-600">{cita.notas}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hospitalizaciones */}
      {admisiones.length > 0 && (
        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Historial de Hospitalizaciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {admisiones.map((admision) => (
                <div
                  key={admision.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getEstadoColor(admision.estado)}>
                          {admision.estado}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {formatDate(admision.fechaIngreso)}
                          {admision.fechaAlta && ` - ${formatDate(admision.fechaAlta)}`}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">{admision.diagnostico}</p>
                      <p className="text-sm text-gray-600">
                        Cama: {admision.cama?.numero || 'N/A'} - {admision.cama?.habitacion?.nombre || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {admision.observaciones && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Observaciones:</p>
                      <p className="text-sm text-gray-600">{admision.observaciones}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentos Clínicos */}
      {documentos.length > 0 && (
        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Documentos Clínicos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {doc.nombreOriginal}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {doc.categoria || 'Sin categoría'}
                      </p>
                      {doc.descripcion && (
                        <p className="text-sm text-gray-500 mt-2">{doc.descripcion}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
