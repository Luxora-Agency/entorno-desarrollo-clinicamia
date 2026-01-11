'use client';

import { useState, useEffect } from 'react';
import { Search, UserCheck, Mail, Phone, Calendar, DollarSign, Loader2, RefreshCcw, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { miaPassService } from '@/services/miaPass.service';

const ESTADOS_BADGE = {
  ACTIVA: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Activa' },
  PENDIENTE_PAGO: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'Pendiente Pago' },
  PAGADA: { color: 'bg-blue-100 text-blue-700', icon: DollarSign, label: 'Pagada' },
  VENCIDA: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Vencida' },
  CANCELADA: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelada' },
  ANULADA: { color: 'bg-orange-100 text-orange-700', icon: XCircle, label: 'Anulada' },
  DEVUELTA: { color: 'bg-purple-100 text-purple-700', icon: XCircle, label: 'Devuelta' }
};

export default function SuscriptoresMiaPassModule() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [suscripciones, setSuscripciones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuscripcion, setSelectedSuscripcion] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    activas: 0,
    ingresosTotales: 0
  });

  useEffect(() => {
    fetchSuscripciones();
  }, []);

  const fetchSuscripciones = async () => {
    setLoading(true);
    try {
      const response = await miaPassService.getAllSuscripciones();
      const data = response?.data?.suscripciones || [];
      setSuscripciones(data);

      // Calcular estadísticas
      const activas = data.filter(s => s.estado === 'ACTIVA').length;
      const ingresosTotales = data
        .filter(s => s.estado === 'ACTIVA')
        .reduce((sum, s) => sum + Number(s.precioPagado || 0), 0);

      setStats({
        total: data.length,
        activas,
        ingresosTotales
      });
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las suscripciones',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(val || 0);

  const filteredSuscripciones = suscripciones.filter(sus => {
    const paciente = sus.paciente || {};
    const plan = sus.plan || {};
    const searchLower = searchTerm.toLowerCase();
    return (
      (paciente.nombre || '').toLowerCase().includes(searchLower) ||
      (paciente.apellido || '').toLowerCase().includes(searchLower) ||
      (paciente.email || '').toLowerCase().includes(searchLower) ||
      (paciente.telefono || '').includes(searchTerm) ||
      (plan.nombre || '').toLowerCase().includes(searchLower) ||
      (sus.estado || '').toLowerCase().includes(searchLower)
    );
  });

  const getEstadoBadge = (estado) => {
    const config = ESTADOS_BADGE[estado] || ESTADOS_BADGE.ACTIVA;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600">Cargando suscripciones...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suscriptores MiaPass</h1>
          <p className="text-gray-600 mt-1">Gestión de membresías activas</p>
        </div>
        <Button variant="outline" onClick={fetchSuscripciones}>
          <RefreshCcw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Suscripciones</p>
              <p className="text-2xl font-bold text-purple-900">{stats.total}</p>
            </div>
            <UserCheck className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Activas</p>
              <p className="text-2xl font-bold text-green-900">{stats.activas}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600 font-medium">Ingresos Activos</p>
              <p className="text-2xl font-bold text-emerald-900">{formatCurrency(stats.ingresosTotales)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-600" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar por nombre, email, teléfono, plan o estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Suscripciones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuscripciones.map((suscripcion) => {
          const paciente = suscripcion.paciente || {};
          const plan = suscripcion.plan || {};
          const nombreCompleto = `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim() || 'Sin nombre';
          const iniciales = nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('');

          return (
            <Card key={suscripcion.id} className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {iniciales || '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{nombreCompleto}</h3>
                    {getEstadoBadge(suscripcion.estado)}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {paciente.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{paciente.email}</span>
                  </div>
                )}

                {paciente.telefono && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{paciente.telefono}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    {new Date(suscripcion.fechaInicio).toLocaleDateString('es-CO')} -
                    {new Date(suscripcion.fechaFin).toLocaleDateString('es-CO')}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Plan:</span>
                  <span className="text-sm font-semibold text-emerald-600">{plan.nombre || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Canal:</span>
                  <span className="text-sm text-gray-900">{suscripcion.canal || 'Presencial'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Precio pagado:</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(suscripcion.precioPagado)}</span>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedSuscripcion(suscripcion)}
                >
                  Ver Detalles
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredSuscripciones.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron suscripciones</p>
        </div>
      )}

      {/* Modal de Detalles */}
      {selectedSuscripcion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedSuscripcion.paciente?.nombre} {selectedSuscripcion.paciente?.apellido}
                  </h2>
                  {getEstadoBadge(selectedSuscripcion.estado)}
                </div>
                <button
                  onClick={() => setSelectedSuscripcion(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Plan</label>
                  <p className="text-gray-900 font-semibold">{selectedSuscripcion.plan?.nombre}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedSuscripcion.paciente?.email || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Teléfono</label>
                  <p className="text-gray-900">{selectedSuscripcion.paciente?.telefono || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha Inicio</label>
                    <p className="text-gray-900">
                      {new Date(selectedSuscripcion.fechaInicio).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha Fin</label>
                    <p className="text-gray-900">
                      {new Date(selectedSuscripcion.fechaFin).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Canal de Venta</label>
                  <p className="text-gray-900">{selectedSuscripcion.canal || 'Presencial'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Método de Pago</label>
                  <p className="text-gray-900">{selectedSuscripcion.metodoPago || 'N/A'}</p>
                </div>

                {selectedSuscripcion.vendedor && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendedor</label>
                    <p className="text-gray-900">
                      {selectedSuscripcion.vendedor.nombre} {selectedSuscripcion.vendedor.apellido}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">Precio Pagado</label>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(selectedSuscripcion.precioPagado)}
                  </p>
                </div>

                {selectedSuscripcion.motivoAnulacion && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <label className="text-sm font-medium text-red-600">Motivo de Anulación</label>
                    <p className="text-red-800">{selectedSuscripcion.motivoAnulacion}</p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button
                  className="w-full"
                  onClick={() => setSelectedSuscripcion(null)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
