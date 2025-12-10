'use client';

import { useState } from 'react';
import { Plus, Search, Filter, FileText, User, Calendar, Pill, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function OrdenesMedicasModule() {
  const [ordenes, setOrdenes] = useState([
    {
      id: 1,
      numeroOrden: 'OM-2024-001',
      paciente: 'María García',
      doctor: 'Dr. Juan Pérez',
      fecha: '2024-06-15',
      medicamentos: [
        { nombre: 'Paracetamol 500mg', cantidad: 20, frecuencia: 'Cada 8 horas' },
        { nombre: 'Ibuprofeno 400mg', cantidad: 15, frecuencia: 'Cada 12 horas' }
      ],
      diagnostico: 'Gripe común',
      estado: 'completada',
      prioridad: 'normal'
    },
    {
      id: 2,
      numeroOrden: 'OM-2024-002',
      paciente: 'Carlos López',
      doctor: 'Dra. Ana Martínez',
      fecha: '2024-06-16',
      medicamentos: [
        { nombre: 'Amoxicilina 500mg', cantidad: 21, frecuencia: 'Cada 8 horas' }
      ],
      diagnostico: 'Infección respiratoria',
      estado: 'pendiente',
      prioridad: 'alta'
    },
    {
      id: 3,
      numeroOrden: 'OM-2024-003',
      paciente: 'Laura Sánchez',
      doctor: 'Dr. Pedro Ramírez',
      fecha: '2024-06-16',
      medicamentos: [
        { nombre: 'Omeprazol 20mg', cantidad: 30, frecuencia: 'Una vez al día' },
        { nombre: 'Metformina 850mg', cantidad: 60, frecuencia: 'Dos veces al día' }
      ],
      diagnostico: 'Control de diabetes',
      estado: 'en_proceso',
      prioridad: 'normal'
    },
    {
      id: 4,
      numeroOrden: 'OM-2024-004',
      paciente: 'Roberto Fernández',
      doctor: 'Dra. Carmen Silva',
      fecha: '2024-06-17',
      medicamentos: [
        { nombre: 'Atorvastatina 20mg', cantidad: 30, frecuencia: 'Una vez al día' }
      ],
      diagnostico: 'Control de colesterol',
      estado: 'cancelada',
      prioridad: 'baja'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todas');
  const [selectedOrden, setSelectedOrden] = useState(null);

  const filteredOrdenes = ordenes.filter(orden => {
    const matchesSearch = 
      orden.numeroOrden.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orden.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orden.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orden.diagnostico.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === 'todas' || orden.estado === filterEstado;
    
    return matchesSearch && matchesEstado;
  });

  const getEstadoBadge = (estado) => {
    const configs = {
      completada: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Completada' },
      en_proceso: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock, label: 'En Proceso' },
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pendiente' },
      cancelada: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Cancelada' }
    };
    
    const config = configs[estado] || configs.pendiente;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getPrioridadBadge = (prioridad) => {
    const configs = {
      alta: { bg: 'bg-red-100', text: 'text-red-800' },
      normal: { bg: 'bg-gray-100', text: 'text-gray-800' },
      baja: { bg: 'bg-green-100', text: 'text-green-800' }
    };
    
    const config = configs[prioridad] || configs.normal;
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.text}`}>
        {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
      </span>
    );
  };

  const handleCambiarEstado = (id, nuevoEstado) => {
    setOrdenes(ordenes.map(orden =>
      orden.id === id ? { ...orden, estado: nuevoEstado } : orden
    ));
  };

  const stats = {
    total: ordenes.length,
    completadas: ordenes.filter(o => o.estado === 'completada').length,
    pendientes: ordenes.filter(o => o.estado === 'pendiente').length,
    enProceso: ordenes.filter(o => o.estado === 'en_proceso').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Órdenes Médicas</h1>
          <p className="text-gray-600 mt-1">Gestión de prescripciones y órdenes médicas</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
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

        <Card className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-600 font-medium">En Proceso</p>
              <p className="text-2xl font-bold text-cyan-900">{stats.enProceso}</p>
            </div>
            <Pill className="w-8 h-8 text-cyan-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Completadas</p>
              <p className="text-2xl font-bold text-green-900">{stats.completadas}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
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
              placeholder="Buscar por número, paciente, doctor o diagnóstico..."
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
              <option value="pendiente">Pendientes</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completada">Completadas</option>
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
                  Orden
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Diagnóstico
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrdenes.map((orden) => (
                <tr key={orden.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{orden.numeroOrden}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{orden.paciente}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {orden.doctor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(orden.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{orden.diagnostico}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPrioridadBadge(orden.prioridad)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getEstadoBadge(orden.estado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrden(orden)}
                    >
                      Ver Detalle
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrdenes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron órdenes médicas</p>
          </div>
        )}
      </Card>

      {/* Modal de Detalles */}
      {selectedOrden && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedOrden.numeroOrden}</h2>
                  <p className="text-gray-600 mt-1">Detalles de la orden médica</p>
                </div>
                <button
                  onClick={() => setSelectedOrden(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Paciente</label>
                    <p className="text-gray-900 font-semibold">{selectedOrden.paciente}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Doctor</label>
                    <p className="text-gray-900 font-semibold">{selectedOrden.doctor}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha</label>
                    <p className="text-gray-900">
                      {new Date(selectedOrden.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Estado</label>
                    <div className="mt-1">{getEstadoBadge(selectedOrden.estado)}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Diagnóstico</label>
                  <p className="text-gray-900 mt-1">{selectedOrden.diagnostico}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-3 block">Medicamentos Prescritos</label>
                  <div className="space-y-3">
                    {selectedOrden.medicamentos.map((med, idx) => (
                      <Card key={idx} className="p-4 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{med.nombre}</h4>
                            <p className="text-sm text-gray-600 mt-1">Cantidad: {med.cantidad} unidades</p>
                            <p className="text-sm text-gray-600">Frecuencia: {med.frecuencia}</p>
                          </div>
                          <Pill className="w-5 h-5 text-emerald-600" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Cambiar Estado</label>
                  <select
                    value={selectedOrden.estado}
                    onChange={(e) => {
                      handleCambiarEstado(selectedOrden.id, e.target.value);
                      setSelectedOrden({ ...selectedOrden, estado: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedOrden(null)}
                >
                  Cerrar
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  Imprimir Orden
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}