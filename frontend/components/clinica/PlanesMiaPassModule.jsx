'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function PlanesMiaPassModule() {
  const [planes, setPlanes] = useState([
    {
      id: 1,
      nombre: 'Plan Básico',
      descripcion: 'Plan básico con consultas mensuales',
      precio: 29.99,
      duracion: 30,
      beneficios: ['2 consultas generales', 'Descuento 10% en medicamentos', 'Atención telefónica'],
      activo: true
    },
    {
      id: 2,
      nombre: 'Plan Premium',
      descripcion: 'Plan premium con beneficios extendidos',
      precio: 49.99,
      duracion: 30,
      beneficios: ['Consultas ilimitadas', 'Descuento 20% en medicamentos', 'Prioridad en citas', 'Exámenes de laboratorio'],
      activo: true
    },
    {
      id: 3,
      nombre: 'Plan Familiar',
      descripcion: 'Plan para toda la familia',
      precio: 89.99,
      duracion: 30,
      beneficios: ['Hasta 4 miembros', 'Consultas ilimitadas', 'Descuento 25% en medicamentos', 'Chequeos preventivos'],
      activo: true
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracion: 30,
    beneficios: '',
    activo: true
  });

  const filteredPlanes = planes.filter(plan =>
    plan.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setEditingPlan(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      duracion: 30,
      beneficios: '',
      activo: true
    });
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      precio: plan.precio,
      duracion: plan.duracion,
      beneficios: plan.beneficios.join(', '),
      activo: plan.activo
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('¿Está seguro de eliminar este plan?')) {
      setPlanes(planes.filter(p => p.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const beneficiosArray = formData.beneficios
      .split(',')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    if (editingPlan) {
      setPlanes(planes.map(p => 
        p.id === editingPlan.id 
          ? { 
              ...p, 
              ...formData, 
              precio: parseFloat(formData.precio),
              duracion: parseInt(formData.duracion),
              beneficios: beneficiosArray 
            }
          : p
      ));
    } else {
      const newPlan = {
        id: Math.max(...planes.map(p => p.id), 0) + 1,
        ...formData,
        precio: parseFloat(formData.precio),
        duracion: parseInt(formData.duracion),
        beneficios: beneficiosArray
      };
      setPlanes([...planes, newPlan]);
    }
    
    setShowModal(false);
  };

  const toggleActivo = (id) => {
    setPlanes(planes.map(p => 
      p.id === id ? { ...p, activo: !p.activo } : p
    ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planes MíaPass</h1>
          <p className="text-gray-600 mt-1">Gestión de planes de suscripción</p>
        </div>
        <Button 
          onClick={handleAddNew}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar planes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlanes.map((plan) => (
          <Card key={plan.id} className="p-6 hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{plan.nombre}</h3>
                <p className="text-sm text-gray-600 mt-1">{plan.descripcion}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                plan.activo 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {plan.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-emerald-600">${plan.precio}</span>
                <span className="text-gray-600 ml-2">/ {plan.duracion} días</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Beneficios:</p>
              <ul className="space-y-1">
                {plan.beneficios?.map((beneficio, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start">
                    <Check className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{beneficio}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleActivo(plan.id)}
                className="flex-1"
              >
                {plan.activo ? 'Desactivar' : 'Activar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(plan)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(plan.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredPlanes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron planes</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Plan *
                  </label>
                  <Input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio (USD) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración (días) *
                    </label>
                    <Input
                      type="number"
                      value={formData.duracion}
                      onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beneficios (separados por comas) *
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={4}
                    value={formData.beneficios}
                    onChange={(e) => setFormData({ ...formData, beneficios: e.target.value })}
                    placeholder="Ej: Consultas ilimitadas, Descuento 20%, Prioridad en citas"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="activo" className="ml-2 text-sm text-gray-700">
                    Plan activo
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    {editingPlan ? 'Actualizar' : 'Crear'} Plan
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}