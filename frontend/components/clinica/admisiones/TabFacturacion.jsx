'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  DollarSign, 
  Calendar,
  FileText,
  TrendingUp,
  CreditCard,
  AlertCircle
} from 'lucide-react';

export default function TabFacturacion({ pacienteId, paciente }) {
  const [citas, setCitas] = useState([]);
  const [admisiones, setAdmisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoCuenta, setEstadoCuenta] = useState({
    totalCitas: 0,
    totalAdmisiones: 0,
    total: 0,
  });

  useEffect(() => {
    if (pacienteId) {
      loadFacturacion();
    }
  }, [pacienteId]);

  const loadFacturacion = async () => {
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
      const citasCompletadas = citasData.data || [];
      setCitas(citasCompletadas);

      // Cargar admisiones
      const admRes = await fetch(
        `${apiUrl}/admisiones?paciente_id=${pacienteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const admData = await admRes.json();
      const admisionesData = admData.data || [];
      setAdmisiones(admisionesData);

      // Calcular totales
      const totalCitas = citasCompletadas.reduce((acc, cita) => {
        const costo = parseFloat(cita.especialidad?.costoCOP || 0);
        return acc + costo;
      }, 0);

      const totalAdmisiones = admisionesData.reduce((acc, adm) => {
        // Estimación: $500,000 por día de hospitalización
        const dias = adm.fechaAlta 
          ? Math.ceil((new Date(adm.fechaAlta) - new Date(adm.fechaIngreso)) / (1000 * 60 * 60 * 24))
          : Math.ceil((new Date() - new Date(adm.fechaIngreso)) / (1000 * 60 * 60 * 24));
        return acc + (dias * 500000);
      }, 0);

      setEstadoCuenta({
        totalCitas,
        totalAdmisiones,
        total: totalCitas + totalAdmisiones,
      });
    } catch (error) {
      console.error('Error cargando facturación:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount || 0);
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

  const calcularDiasHospitalizacion = (admision) => {
    const fechaFin = admision.fechaAlta ? new Date(admision.fechaAlta) : new Date();
    const fechaInicio = new Date(admision.fechaIngreso);
    return Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de facturación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Cuenta */}
      <Card className="border-emerald-200 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-600" />
            <CardTitle className="text-xl">Estado de Cuenta</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Citas */}
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <p className="text-sm font-medium text-gray-600">Consultas</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(estadoCuenta.totalCitas)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {citas.length} consulta{citas.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Total Hospitalizaciones */}
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-5 w-5 text-purple-500" />
                <p className="text-sm font-medium text-gray-600">Hospitalizaciones</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(estadoCuenta.totalAdmisiones)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {admisiones.length} admision{admisiones.length !== 1 ? 'es' : ''}
              </p>
            </div>

            {/* Total General */}
            <div className="bg-emerald-600 rounded-lg p-4 text-white border border-emerald-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" />
                <p className="text-sm font-medium">Total General</p>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(estadoCuenta.total)}
              </p>
              <p className="text-xs opacity-90 mt-1">Acumulado</p>
            </div>
          </div>

          {/* Información EPS */}
          {paciente?.eps && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Aseguramiento</p>
                  <p className="text-sm text-blue-700 mt-1">
                    <span className="font-semibold">EPS:</span> {paciente.eps}
                  </p>
                  {paciente.regimen && (
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Régimen:</span> {paciente.regimen}
                    </p>
                  )}
                  {paciente.numeroAutorizacion && (
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Autorización:</span> {paciente.numeroAutorizacion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalle de Consultas */}
      <Card className="border-emerald-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Detalle de Consultas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {citas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No hay consultas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {citas.map((cita) => (
                <div
                  key={cita.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
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
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">
                      {formatCurrency(cita.especialidad?.costoCOP || 0)}
                    </p>
                    <Badge className="bg-green-100 text-green-800 mt-1">
                      Completada
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalle de Hospitalizaciones */}
      {admisiones.length > 0 && (
        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Detalle de Hospitalizaciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Nota:</span> Los costos mostrados son estimaciones basadas en $500,000 COP por día de hospitalización. Los valores reales pueden variar según servicios adicionales.
              </p>
            </div>
            <div className="space-y-3">
              {admisiones.map((admision) => {
                const dias = calcularDiasHospitalizacion(admision);
                const costoEstimado = dias * 500000;
                
                return (
                  <div
                    key={admision.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(admision.fechaIngreso)}
                          {admision.fechaAlta && ` - ${formatDate(admision.fechaAlta)}`}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">{admision.diagnostico}</p>
                      <p className="text-sm text-gray-600">
                        Cama: {admision.cama?.numero || 'N/A'} - {admision.cama?.habitacion?.nombre || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dias} día{dias !== 1 ? 's' : ''} de hospitalización
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(costoEstimado)}
                      </p>
                      <Badge className={
                        admision.estado === 'Alta' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }>
                        {admision.estado}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
