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
      costo: 29.99,
      duracion: 1,
      color: '#10B981',
      icono: 'medical-services',
      activo: true,
      destacado: false,
      beneficios: ['2 consultas generales', 'Descuento 10% en medicamentos'],
      descuentos: {
        consultas: { tipo: 'porcentaje', valor: 10 },
        examenes: { tipo: 'porcentaje', valor: 5 },
        farmacia: { tipo: 'porcentaje', valor: 10 },
        procedimientos: { tipo: 'porcentaje', valor: 0 }
      },
      itemsConsumibles: []
    },
    {
      id: 2,
      nombre: 'Plan Premium',
      descripcion: 'Plan premium con beneficios extendidos',
      costo: 49.99,
      duracion: 1,
      color: '#3B82F6',
      icono: 'medical-services',
      activo: true,
      destacado: true,
      beneficios: ['Consultas ilimitadas', 'Descuento 20% en medicamentos', 'Prioridad en citas'],
      descuentos: {
        consultas: { tipo: 'porcentaje', valor: 20 },
        examenes: { tipo: 'porcentaje', valor: 15 },
        farmacia: { tipo: 'porcentaje', valor: 20 },
        procedimientos: { tipo: 'porcentaje', valor: 10 }
      },
      itemsConsumibles: []
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    costo: '',
    duracion: 12,
    color: '#3B82F6',
    icono: 'medical-services',
    activo: true,
    destacado: false,
    beneficios: [''],
    descuentos: {
      consultas: { tipo: 'porcentaje', valor: 0 },
      examenes: { tipo: 'porcentaje', valor: 0 },
      farmacia: { tipo: 'porcentaje', valor: 0 },
      procedimientos: { tipo: 'porcentaje', valor: 0 }
    },
    itemsConsumibles: []
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
      costo: '',
      duracion: 12,
      color: '#3B82F6',
      icono: 'medical-services',
      activo: true,
      destacado: false,
      beneficios: [''],
      descuentos: {
        consultas: { tipo: 'porcentaje', valor: 0 },
        examenes: { tipo: 'porcentaje', valor: 0 },
        farmacia: { tipo: 'porcentaje', valor: 0 },
        procedimientos: { tipo: 'porcentaje', valor: 0 }
      },
      itemsConsumibles: []
    });
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      costo: plan.costo,
      duracion: plan.duracion,
      color: plan.color,
      icono: plan.icono,
      activo: plan.activo,
      destacado: plan.destacado,
      beneficios: plan.beneficios.length > 0 ? plan.beneficios : [''],
      descuentos: plan.descuentos,
      itemsConsumibles: plan.itemsConsumibles || []
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
    
    const beneficiosFiltrados = formData.beneficios.filter(b => b.trim().length > 0);

    if (editingPlan) {
      setPlanes(planes.map(p => 
        p.id === editingPlan.id 
          ? { 
              ...p, 
              ...formData, 
              costo: parseFloat(formData.costo),
              duracion: parseInt(formData.duracion),
              beneficios: beneficiosFiltrados
            }
          : p
      ));
    } else {
      const newPlan = {
        id: Math.max(...planes.map(p => p.id), 0) + 1,
        ...formData,
        costo: parseFloat(formData.costo),
        duracion: parseInt(formData.duracion),
        beneficios: beneficiosFiltrados
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

  const addBeneficio = () => {
    setFormData({
      ...formData,
      beneficios: [...formData.beneficios, '']
    });
  };

  const removeBeneficio = (index) => {
    setFormData({
      ...formData,
      beneficios: formData.beneficios.filter((_, i) => i !== index)
    });
  };

  const updateBeneficio = (index, value) => {
    const newBeneficios = [...formData.beneficios];
    newBeneficios[index] = value;
    setFormData({
      ...formData,
      beneficios: newBeneficios
    });
  };

  const updateDescuento = (categoria, field, value) => {
    setFormData({
      ...formData,
      descuentos: {
        ...formData.descuentos,
        [categoria]: {
          ...formData.descuentos[categoria],
          [field]: value
        }
      }
    });
  };

  const addItemConsumible = () => {
    setFormData({
      ...formData,
      itemsConsumibles: [
        ...formData.itemsConsumibles,
        {
          tipo: 'Examen',
          especialidad: 'Todos',
          examen: 'Todos',
          nombre: '',
          costoOriginal: '',
          costoConPlan: '',
          cantidadIncluida: 1,
          descripcion: ''
        }
      ]
    });
  };

  const removeItemConsumible = (index) => {
    setFormData({
      ...formData,
      itemsConsumibles: formData.itemsConsumibles.filter((_, i) => i !== index)
    });
  };

  const updateItemConsumible = (index, field, value) => {
    const newItems = [...formData.itemsConsumibles];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setFormData({
      ...formData,
      itemsConsumibles: newItems
    });
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
          <Card key={plan.id} className="p-6 hover:shadow-xl transition-shadow relative">
            {plan.destacado && (
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                DESTACADO
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4 mt-2">
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
                <span className="text-3xl font-bold" style={{ color: plan.color }}>
                  ${plan.costo}
                </span>
                <span className="text-gray-600 ml-2">/ {plan.duracion} {plan.duracion === 1 ? 'mes' : 'meses'}</span>
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
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header Fijo */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido Scrolleable */}
            <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información Básica */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Plan *
                      </label>
                      <Input
                        type="text"
                        placeholder="Ej: Plan MiaPass Premium"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Costo *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="150000"
                        value={formData.costo}
                        onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duración (meses) *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.duracion}
                        onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Icono
                      </label>
                      <Input
                        type="text"
                        value={formData.icono}
                        onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                        placeholder="medical-services"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      rows={3}
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción detallada del plan..."
                    />
                  </div>

                  <div className="flex gap-4 mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Plan Activo</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.destacado}
                        onChange={(e) => setFormData({ ...formData, destacado: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Plan Destacado</span>
                    </label>
                  </div>
                </div>

                {/* Beneficios */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Beneficios</h3>
                    <Button
                      type="button"
                      onClick={addBeneficio}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Beneficio
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.beneficios.map((beneficio, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="text"
                          value={beneficio}
                          onChange={(e) => updateBeneficio(index, e.target.value)}
                          placeholder="Ej: Consultas ilimitadas"
                          className="flex-1"
                        />
                        {formData.beneficios.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeBeneficio(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Descuentos por Categoría */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Descuentos por Categoría</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['consultas', 'examenes', 'farmacia', 'procedimientos'].map((categoria) => (
                      <div key={categoria} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3 capitalize">{categoria}</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                            <select
                              value={formData.descuentos[categoria].tipo}
                              onChange={(e) => updateDescuento(categoria, 'tipo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="porcentaje">Porcentaje</option>
                              <option value="valor">Valor Fijo</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Valor</label>
                            <Input
                              type="number"
                              min="0"
                              value={formData.descuentos[categoria].valor}
                              onChange={(e) => updateDescuento(categoria, 'valor', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items Consumibles */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Items Consumibles</h3>
                    <Button
                      type="button"
                      onClick={addItemConsumible}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Item
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {formData.itemsConsumibles.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                          <Button
                            type="button"
                            onClick={() => removeItemConsumible(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                            <select
                              value={item.tipo}
                              onChange={(e) => updateItemConsumible(index, 'tipo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="Examen">Examen</option>
                              <option value="Consulta">Consulta</option>
                              <option value="Procedimiento">Procedimiento</option>
                              <option value="Medicamento">Medicamento</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Especialidad</label>
                            <select
                              value={item.especialidad}
                              onChange={(e) => updateItemConsumible(index, 'especialidad', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="Todos">Todos</option>
                              <option value="Cardiología">Cardiología</option>
                              <option value="Neurología">Neurología</option>
                              <option value="Pediatría">Pediatría</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Examen</label>
                            <select
                              value={item.examen}
                              onChange={(e) => updateItemConsumible(index, 'examen', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="Todos">Todos</option>
                              <option value="Hemograma">Hemograma</option>
                              <option value="Glucosa">Glucosa</option>
                              <option value="Colesterol">Colesterol</option>
                            </select>
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                            <Input
                              type="text"
                              value={item.nombre}
                              onChange={(e) => updateItemConsumible(index, 'nombre', e.target.value)}
                              placeholder="Ej: Consulta de Cardiología"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Costo Original</label>
                            <Input
                              type="number"
                              value={item.costoOriginal}
                              onChange={(e) => updateItemConsumible(index, 'costoOriginal', e.target.value)}
                              placeholder="100000"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Costo con Plan</label>
                            <Input
                              type="number"
                              value={item.costoConPlan}
                              onChange={(e) => updateItemConsumible(index, 'costoConPlan', e.target.value)}
                              placeholder="50000"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Cantidad Incluida</label>
                            <Input
                              type="number"
                              min="1"
                              value={item.cantidadIncluida}
                              onChange={(e) => updateItemConsumible(index, 'cantidadIncluida', parseInt(e.target.value) || 1)}
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-sm text-gray-600 mb-1">Descripción</label>
                            <textarea
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              rows={2}
                              value={item.descripcion}
                              onChange={(e) => updateItemConsumible(index, 'descripcion', e.target.value)}
                              placeholder="Descripción del item..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {formData.itemsConsumibles.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No hay items consumibles. Haz clic en "Agregar Item" para añadir uno.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t">
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
