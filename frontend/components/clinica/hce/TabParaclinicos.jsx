'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TestTube,
  FileImage,
  Calendar,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye
} from 'lucide-react';

export default function TabParaclinicos({ pacienteId, admisionId }) {
  const [laboratorios, setLaboratorios] = useState([]);
  const [imagenologia, setImagenologia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todos');

  useEffect(() => {
    if (pacienteId) {
      cargarParaclinicos();
    }
  }, [pacienteId, admisionId]);

  const cargarParaclinicos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const [labRes, imgRes] = await Promise.all([
        fetch(`${apiUrl}/laboratorio?paciente_id=${pacienteId}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${apiUrl}/imagenologia?paciente_id=${pacienteId}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null)
      ]);

      if (labRes && labRes.ok) {
        const labData = await labRes.json();
        setLaboratorios(labData.data || []);
      }

      if (imgRes && imgRes.ok) {
        const imgData = await imgRes.json();
        setImagenologia(imgData.data || []);
      }
    } catch (error) {
      console.error('Error cargando paraclínicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (estado) => {
    switch (estado?.toUpperCase()) {
      case 'COMPLETADO':
      case 'RESULTADO':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'PENDIENTE':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'EN_PROCESO':
        return <Badge className="bg-blue-100 text-blue-800"><Loader2 className="h-3 w-3 mr-1 animate-spin" />En proceso</Badge>;
      default:
        return <Badge variant="secondary">{estado || 'N/A'}</Badge>;
    }
  };

  const getTrendIcon = (tendencia) => {
    switch (tendencia) {
      case 'ALTO':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'BAJO':
        return <TrendingDown className="h-4 w-4 text-blue-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  // Combinar y ordenar todos los resultados
  const todosResultados = [
    ...laboratorios.map(l => ({ ...l, tipo: 'laboratorio', fecha: l.fechaSolicitud || l.createdAt })),
    ...imagenologia.map(i => ({ ...i, tipo: 'imagenologia', fecha: i.fechaSolicitud || i.createdAt }))
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600 mb-4" />
          <p className="text-gray-600">Cargando resultados paraclínicos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-600 rounded-lg">
                <TestTube className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Paraclínicos</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Resultados de laboratorio e imagenología
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 bg-white rounded-lg border">
                <p className="text-2xl font-bold text-teal-600">{laboratorios.length}</p>
                <p className="text-xs text-gray-500">Laboratorios</p>
              </div>
              <div className="text-center px-4 py-2 bg-white rounded-lg border">
                <p className="text-2xl font-bold text-cyan-600">{imagenologia.length}</p>
                <p className="text-xs text-gray-500">Imágenes</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs de tipo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border shadow-sm p-1">
          <TabsTrigger
            value="todos"
            className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Todos ({todosResultados.length})
          </TabsTrigger>
          <TabsTrigger
            value="laboratorio"
            className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Laboratorio ({laboratorios.length})
          </TabsTrigger>
          <TabsTrigger
            value="imagenologia"
            className="data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-700"
          >
            <FileImage className="h-4 w-4 mr-2" />
            Imagenología ({imagenologia.length})
          </TabsTrigger>
        </TabsList>

        {/* Todos los resultados */}
        <TabsContent value="todos" className="mt-6">
          {todosResultados.length > 0 ? (
            <div className="space-y-4">
              {todosResultados.map((resultado, index) => (
                <ResultadoCard key={index} resultado={resultado} formatDate={formatDate} getStatusBadge={getStatusBadge} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        {/* Laboratorios */}
        <TabsContent value="laboratorio" className="mt-6">
          {laboratorios.length > 0 ? (
            <div className="space-y-4">
              {laboratorios.map((lab, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="bg-teal-50 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TestTube className="h-5 w-5 text-teal-600" />
                        <div>
                          <h4 className="font-semibold">{lab.nombre || lab.examen}</h4>
                          <p className="text-sm text-gray-500">{formatDate(lab.fechaSolicitud || lab.createdAt)}</p>
                        </div>
                      </div>
                      {getStatusBadge(lab.estado)}
                    </div>
                  </CardHeader>
                  {lab.resultados && (
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(lab.resultados).map(([key, value], idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase">{key}</p>
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">{value?.valor || value}</p>
                              {value?.tendencia && getTrendIcon(value.tendencia)}
                            </div>
                            {value?.referencia && (
                              <p className="text-xs text-gray-400">Ref: {value.referencia}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState message="No hay resultados de laboratorio" />
          )}
        </TabsContent>

        {/* Imagenología */}
        <TabsContent value="imagenologia" className="mt-6">
          {imagenologia.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {imagenologia.map((img, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="bg-cyan-50 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileImage className="h-5 w-5 text-cyan-600" />
                        <div>
                          <h4 className="font-semibold">{img.nombre || img.estudio}</h4>
                          <p className="text-sm text-gray-500">{formatDate(img.fechaSolicitud || img.createdAt)}</p>
                        </div>
                      </div>
                      {getStatusBadge(img.estado)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {img.hallazgos && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 uppercase mb-1">Hallazgos</p>
                        <p className="text-sm text-gray-700">{img.hallazgos}</p>
                      </div>
                    )}
                    {img.conclusion && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 uppercase mb-1">Conclusión</p>
                        <p className="text-sm text-gray-700">{img.conclusion}</p>
                      </div>
                    )}
                    {img.urlImagen && (
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Imagen
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState message="No hay estudios de imagenología" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResultadoCard({ resultado, formatDate, getStatusBadge }) {
  const esLab = resultado.tipo === 'laboratorio';
  const Icon = esLab ? TestTube : FileImage;
  const bgColor = esLab ? 'bg-teal-50' : 'bg-cyan-50';
  const iconColor = esLab ? 'text-teal-600' : 'text-cyan-600';

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`${bgColor} py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            <div>
              <h4 className="font-semibold">{resultado.nombre || resultado.examen || resultado.estudio}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDate(resultado.fecha)}
                <Badge variant="outline" className="ml-2">
                  {esLab ? 'Laboratorio' : 'Imagen'}
                </Badge>
              </div>
            </div>
          </div>
          {getStatusBadge(resultado.estado)}
        </div>
      </CardHeader>
      {(resultado.resultados || resultado.hallazgos || resultado.conclusion) && (
        <CardContent className="pt-4">
          {resultado.resultados && typeof resultado.resultados === 'object' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              {Object.entries(resultado.resultados).slice(0, 4).map(([key, value], idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded text-center">
                  <p className="text-xs text-gray-500">{key}</p>
                  <p className="font-semibold text-sm">{value?.valor || value}</p>
                </div>
              ))}
            </div>
          )}
          {resultado.hallazgos && (
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Hallazgos:</span> {resultado.hallazgos}
            </p>
          )}
          {resultado.conclusion && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Conclusión:</span> {resultado.conclusion}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function EmptyState({ message = 'No hay resultados paraclínicos registrados' }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <TestTube className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">{message}</p>
        <p className="text-sm text-gray-500">
          Los resultados aparecerán aquí cuando se registren órdenes de laboratorio o imagenología
        </p>
      </CardContent>
    </Card>
  );
}
