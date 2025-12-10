'use client';

import { useState } from 'react';
import { Search, UserCheck, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function SuscriptoresMiaPassModule() {
  const [suscriptores, setSuscriptores] = useState([
    {
      id: 1,
      nombre: 'María García',
      email: 'maria.garcia@email.com',
      telefono: '+1 (555) 123-4567',
      direccion: 'Calle Principal 123, Ciudad',
      planActual: 'Plan Premium',
      fechaRegistro: '2024-01-15',
      estadoSuscripcion: 'activa',
      totalPagado: 599.88
    },
    {
      id: 2,
      nombre: 'Juan Pérez',
      email: 'juan.perez@email.com',
      telefono: '+1 (555) 234-5678',
      direccion: 'Avenida Central 456, Ciudad',
      planActual: 'Plan Básico',
      fechaRegistro: '2024-02-01',
      estadoSuscripcion: 'activa',
      totalPagado: 359.88
    },
    {
      id: 3,
      nombre: 'Ana Martínez',
      email: 'ana.martinez@email.com',
      telefono: '+1 (555) 345-6789',
      direccion: 'Plaza Mayor 789, Ciudad',
      planActual: 'Plan Familiar',
      fechaRegistro: '2023-12-01',
      estadoSuscripcion: 'vencida',
      totalPagado: 1079.88
    },
    {
      id: 4,
      nombre: 'Carlos López',
      email: 'carlos.lopez@email.com',
      telefono: '+1 (555) 456-7890',
      direccion: 'Boulevard Norte 321, Ciudad',
      planActual: 'Plan Premium',
      fechaRegistro: '2024-03-15',
      estadoSuscripcion: 'activa',
      totalPagado: 199.96
    },
    {
      id: 5,
      nombre: 'Laura Sánchez',
      email: 'laura.sanchez@email.com',
      telefono: '+1 (555) 567-8901',
      direccion: 'Calle Sur 654, Ciudad',
      planActual: 'Plan Básico',
      fechaRegistro: '2024-04-01',
      estadoSuscripcion: 'activa',
      totalPagado: 89.97
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuscriptor, setSelectedSuscriptor] = useState(null);

  const filteredSuscriptores = suscriptores.filter(sus =>
    sus.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sus.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sus.telefono.includes(searchTerm) ||
    sus.planActual.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: suscriptores.length,
    activos: suscriptores.filter(s => s.estadoSuscripcion === 'activa').length,
    ingresos: suscriptores.reduce((acc, s) => acc + s.totalPagado, 0)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suscriptores MíaPass</h1>
          <p className="text-gray-600 mt-1">Gestión de usuarios suscritos</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Suscriptores</p>
              <p className="text-2xl font-bold text-purple-900">{stats.total}</p>
            </div>
            <UserCheck className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Activos</p>
              <p className="text-2xl font-bold text-green-900">{stats.activos}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600 font-medium">Ingresos Totales</p>
              <p className="text-2xl font-bold text-emerald-900">${stats.ingresos.toFixed(2)}</p>
            </div>
            <Calendar className="w-8 h-8 text-emerald-600" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar por nombre, email, teléfono o plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Suscriptores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuscriptores.map((suscriptor) => (
          <Card key={suscriptor.id} className="p-6 hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {suscriptor.nombre.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{suscriptor.nombre}</h3>
                  <p className={`text-xs font-semibold ${
                    suscriptor.estadoSuscripcion === 'activa' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {suscriptor.estadoSuscripcion === 'activa' ? '● Activo' : '● Inactivo'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{suscriptor.email}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{suscriptor.telefono}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="truncate">{suscriptor.direccion}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Plan:</span>
                <span className="text-sm font-semibold text-emerald-600">{suscriptor.planActual}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Registro:</span>
                <span className="text-sm text-gray-900">
                  {new Date(suscriptor.fechaRegistro).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total pagado:</span>
                <span className="text-sm font-bold text-gray-900">${suscriptor.totalPagado.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedSuscriptor(suscriptor)}
              >
                Ver Detalles
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredSuscriptores.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron suscriptores</p>
        </div>
      )}

      {/* Modal de Detalles */}
      {selectedSuscriptor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedSuscriptor.nombre}</h2>
                  <p className={`text-sm font-semibold mt-1 ${
                    selectedSuscriptor.estadoSuscripcion === 'activa' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {selectedSuscriptor.estadoSuscripcion === 'activa' ? 'Suscripción Activa' : 'Suscripción Inactiva'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSuscriptor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedSuscriptor.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Teléfono</label>
                  <p className="text-gray-900">{selectedSuscriptor.telefono}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Dirección</label>
                  <p className="text-gray-900">{selectedSuscriptor.direccion}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Plan Actual</label>
                  <p className="text-gray-900 font-semibold">{selectedSuscriptor.planActual}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Registro</label>
                  <p className="text-gray-900">
                    {new Date(selectedSuscriptor.fechaRegistro).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Total Pagado</label>
                  <p className="text-2xl font-bold text-emerald-600">${selectedSuscriptor.totalPagado.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  className="w-full"
                  onClick={() => setSelectedSuscriptor(null)}
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