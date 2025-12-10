'use client';

import { useState } from 'react';
import { Plus, Search, Calendar, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function SuscripcionesMiaPassModule() {
  const [suscripciones, setSuscripciones] = useState([
    {
      id: 1,
      planNombre: 'Plan Premium',
      usuarioNombre: 'María García',
      usuarioEmail: 'maria.garcia@email.com',
      fechaInicio: '2024-01-15',
      fechaFin: '2025-01-15',
      estado: 'activa',
      metodoPago: 'Tarjeta de Crédito',
      precio: 49.99
    },
    {
      id: 2,
      planNombre: 'Plan Básico',
      usuarioNombre: 'Juan Pérez',
      usuarioEmail: 'juan.perez@email.com',
      fechaInicio: '2024-02-01',
      fechaFin: '2025-02-01',
      estado: 'activa',
      metodoPago: 'PayPal',
      precio: 29.99
    },
    {
      id: 3,
      planNombre: 'Plan Familiar',
      usuarioNombre: 'Ana Martínez',
      usuarioEmail: 'ana.martinez@email.com',
      fechaInicio: '2023-12-01',
      fechaFin: '2024-12-01',
      estado: 'vencida',
      metodoPago: 'Transferencia',
      precio: 89.99
    },
    {
      id: 4,
      planNombre: 'Plan Premium',
      usuarioNombre: 'Carlos López',
      usuarioEmail: 'carlos.lopez@email.com',
      fechaInicio: '2024-03-15',
      fechaFin: '2024-06-20',
      estado: 'pendiente',
      metodoPago: 'Tarjeta de Débito',
      precio: 49.99
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todas');

  const filteredSuscripciones = suscripciones.filter(sub => {
    const matchesSearch = 
      sub.usuarioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.usuarioEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.planNombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === 'todas' || sub.estado === filterEstado;
    
    return matchesSearch && matchesEstado;
  });

  const getEstadoBadge = (estado) => {
    const configs = {
      activa: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      vencida: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock }
    };
    
    const config = configs[estado] || configs.pendiente;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const handleCambiarEstado = (id, nuevoEstado) => {
    setSuscripciones(suscripciones.map(sub =>
      sub.id === id ? { ...sub, estado: nuevoEstado } : sub
    ));
  };

  const stats = {
    activas: suscripciones.filter(s => s.estado === 'activa').length,
    vencidas: suscripciones.filter(s => s.estado === 'vencida').length,
    pendientes: suscripciones.filter(s => s.estado === 'pendiente').length,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuscripciones.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sub.usuarioNombre}</div>
                      <div className="text-sm text-gray-500">{sub.usuarioEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sub.planNombre}</div>
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
                    {new Date(sub.fechaFin).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getEstadoBadge(sub.estado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${sub.precio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={sub.estado}
                      onChange={(e) => handleCambiarEstado(sub.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="activa">Activa</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="vencida">Vencida</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSuscripciones.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron suscripciones</p>
          </div>
        )}
      </Card>
    </div>
  );
}