'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Filter, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { miaPassService } from '@/services/miaPass.service';
import { useToast } from '@/hooks/use-toast';

export default function SuscripcionesMiaPassModule() {
  const { toast } = useToast();
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todas');

  const fetchSuscripciones = async () => {
    try {
      setLoading(true);
      const response = await miaPassService.getAllSuscripciones();
      if (response.success) {
        setSuscripciones(response.data?.suscripciones || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las suscripciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuscripciones();
  }, []);

  const filteredSuscripciones = suscripciones.filter(sub => {
    const pacienteNombre = sub.paciente ? `${sub.paciente.nombre} ${sub.paciente.apellido}` : 'Usuario desconocido';
    const pacienteEmail = sub.paciente?.email || '';
    const planNombre = sub.plan?.nombre || 'Plan desconocido';

    const matchesSearch =
      pacienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pacienteEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planNombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = filterEstado === 'todas' || sub.estado?.toLowerCase() === filterEstado;

    return matchesSearch && matchesEstado;
  });

  // Calcular días restantes para vencimiento
  const getDiasRestantes = (fechaFin) => {
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diffTime = fin - hoy;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getEstadoBadge = (estado) => {
    const estadoLower = estado?.toLowerCase() || 'pendiente';
    const configs = {
      activa: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Activa' },
      vencida: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Vencida' },
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pendiente' },
      pendiente_pago: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pendiente Pago' },
      pagada: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Pagada' },
      cancelada: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: 'Cancelada' },
      anulada: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: 'Anulada' },
      devuelta: { bg: 'bg-orange-100', text: 'text-orange-800', icon: XCircle, label: 'Devuelta' }
    };

    const config = configs[estadoLower] || configs.pendiente;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const handleCancelarSuscripcion = async (id) => {
    if (!confirm('¿Está seguro de cancelar esta suscripción?')) return;
    
    try {
      await miaPassService.cancelSuscripcion(id);
      toast({
        title: 'Éxito',
        description: 'Suscripción cancelada correctamente',
      });
      fetchSuscripciones();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Error al cancelar la suscripción',
        variant: 'destructive',
      });
    }
  };

  const stats = {
    activas: suscripciones.filter(s => s.estado?.toUpperCase() === 'ACTIVA').length,
    vencidas: suscripciones.filter(s => s.estado?.toUpperCase() === 'VENCIDA').length,
    pendientes: suscripciones.filter(s => ['PENDIENTE', 'PENDIENTE_PAGO'].includes(s.estado?.toUpperCase())).length,
    proximasVencer: suscripciones.filter(s => {
      if (s.estado?.toUpperCase() !== 'ACTIVA') return false;
      const dias = getDiasRestantes(s.fechaFin);
      return dias > 0 && dias <= 30;
    }).length,
    total: suscripciones.length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suscripciones MíaPass</h1>
          <p className="text-gray-600 mt-1">Gestión de suscripciones activas y vencidas</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Activas</p>
              <p className="text-2xl font-bold text-green-900">{stats.activas}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Por Vencer</p>
              <p className="text-2xl font-bold text-amber-900">{stats.proximasVencer}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pendientes}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Vencidas</p>
              <p className="text-2xl font-bold text-red-900">{stats.vencidas}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por usuario, email o plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todas">Todas</option>
              <option value="activa">Activas</option>
              <option value="pendiente">Pendientes</option>
              <option value="vencida">Vencidas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha Inicio
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha Fin
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuscripciones.map((sub) => {
                  const diasRestantes = getDiasRestantes(sub.fechaFin);
                  const proximaAVencer = sub.estado?.toUpperCase() === 'ACTIVA' && diasRestantes > 0 && diasRestantes <= 30;

                  return (
                    <tr key={sub.id} className={`hover:bg-gray-50 transition-colors ${proximaAVencer ? 'bg-amber-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {sub.paciente ? `${sub.paciente.nombre} ${sub.paciente.apellido}` : 'Usuario desconocido'}
                          </div>
                          <div className="text-sm text-gray-500">{sub.paciente?.email || 'Sin email'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sub.plan?.nombre || 'Plan desconocido'}</div>
                        <div className="text-sm text-gray-500">{sub.metodoPago}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(sub.fechaInicio).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>
                          {new Date(sub.fechaFin).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        {proximaAVencer && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Vence en {diasRestantes} día{diasRestantes !== 1 ? 's' : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(sub.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${parseFloat(sub.precioPagado || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sub.estado?.toUpperCase() === 'ACTIVA' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelarSuscripcion(sub.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Cancelar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {!loading && filteredSuscripciones.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron suscripciones</p>
          </div>
        )}
      </Card>
    </div>
  );
}
