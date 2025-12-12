'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Copy, Percent, Calendar, Users, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function CuponesMiaPassModule() {
  const [cupones, setCupones] = useState([
    {
      id: 1,
      codigo: 'BIENVENIDA2024',
      descripcion: 'Cupón de bienvenida para nuevos usuarios',
      tipoDescuento: 'porcentaje',
      valorDescuento: 20,
      fechaInicio: '2024-01-01',
      fechaFin: '2024-12-31',
      usos: 45,
      usosMaximos: 100,
      activo: true,
      planes: ['Plan Básico', 'Plan Premium']
    },
    {
      id: 2,
      codigo: 'VERANO50',
      descripcion: 'Descuento especial de verano',
      tipoDescuento: 'porcentaje',
      valorDescuento: 50,
      fechaInicio: '2024-06-01',
      fechaFin: '2024-08-31',
      usos: 12,
      usosMaximos: 50,
      activo: true,
      planes: ['Plan Premium', 'Plan Familiar']
    },
    {
      id: 3,
      codigo: 'PRIMERAVEZ',
      descripcion: 'Descuento para primera compra',
      tipoDescuento: 'valor',
      valorDescuento: 10000,
      fechaInicio: '2024-01-01',
      fechaFin: '2024-12-31',
      usos: 78,
      usosMaximos: 200,
      activo: true,
      planes: ['Todos']
    },
    {
      id: 4,
      codigo: 'BLACKFRIDAY',
      descripcion: 'Super descuento Black Friday',
      tipoDescuento: 'porcentaje',
      valorDescuento: 70,
      fechaInicio: '2024-11-24',
      fechaFin: '2024-11-30',
      usos: 156,
      usosMaximos: 150,
      activo: false,
      planes: ['Todos']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCupon, setEditingCupon] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    tipoDescuento: 'porcentaje',
    valorDescuento: '',
    fechaInicio: '',
    fechaFin: '',
    usosMaximos: '',
    activo: true,
    planes: []
  });

  const planesDisponibles = ['Plan Básico', 'Plan Premium', 'Plan Familiar', 'Todos'];

  const filteredCupones = cupones.filter(cupon =>
    cupon.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cupon.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setEditingCupon(null);
    setFormData({
      codigo: '',
      descripcion: '',
      tipoDescuento: 'porcentaje',
      valorDescuento: '',
      fechaInicio: '',
      fechaFin: '',
      usosMaximos: '',
      activo: true,
      planes: []
    });
    setShowModal(true);
  };

  const handleEdit = (cupon) => {
    setEditingCupon(cupon);
    setFormData({
      codigo: cupon.codigo,
      descripcion: cupon.descripcion,
      tipoDescuento: cupon.tipoDescuento,
      valorDescuento: cupon.valorDescuento,
      fechaInicio: cupon.fechaInicio,
      fechaFin: cupon.fechaFin,
      usosMaximos: cupon.usosMaximos,
      activo: cupon.activo,
      planes: cupon.planes
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('¿Está seguro de eliminar este cupón?')) {
      setCupones(cupones.filter(c => c.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingCupon) {
      setCupones(cupones.map(c => 
        c.id === editingCupon.id 
          ? { 
              ...c, 
              ...formData,
              valorDescuento: parseFloat(formData.valorDescuento),
              usosMaximos: parseInt(formData.usosMaximos)
            }
          : c
      ));
    } else {
      const newCupon = {
        id: Math.max(...cupones.map(c => c.id), 0) + 1,
        ...formData,
        valorDescuento: parseFloat(formData.valorDescuento),
        usosMaximos: parseInt(formData.usosMaximos),
        usos: 0
      };
      setCupones([...cupones, newCupon]);
    }
    
    setShowModal(false);
  };

  const toggleActivo = (id) => {
    setCupones(cupones.map(c => 
      c.id === id ? { ...c, activo: !c.activo } : c
    ));
  };

  const copiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo);
    alert(`Código "${codigo}" copiado al portapapeles`);
  };

  const togglePlan = (plan) => {
    if (formData.planes.includes(plan)) {
      setFormData({
        ...formData,
        planes: formData.planes.filter(p => p !== plan)
      });
    } else {
      setFormData({
        ...formData,
        planes: [...formData.planes, plan]
      });
    }
  };

  const stats = {
    total: cupones.length,
    activos: cupones.filter(c => c.activo).length,
    usosTotal: cupones.reduce((acc, c) => acc + c.usos, 0),
    vencidos: cupones.filter(c => new Date(c.fechaFin) < new Date()).length
  };

  const getDescuentoDisplay = (cupon) => {
    if (cupon.tipoDescuento === 'porcentaje') {
      return `${cupon.valorDescuento}%`;
    }
    return `$${cupon.valorDescuento.toFixed(2)}`;
  };

  const isCuponVencido = (fechaFin) => {
    return new Date(fechaFin) < new Date();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cupones MíaPass</h1>
          <p className="text-gray-600 mt-1">Gestión de cupones de descuento</p>
        </div>
        <Button 
          onClick={handleAddNew}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cupón
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Cupones</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Tag className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Activos</p>
              <p className="text-2xl font-bold text-green-900">{stats.activos}</p>
            </div>
            <Percent className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Usos Totales</p>
              <p className="text-2xl font-bold text-purple-900">{stats.usosTotal}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Vencidos</p>
              <p className="text-2xl font-bold text-red-900">{stats.vencidos}</p>
            </div>
            <Calendar className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar cupones por código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Cupones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCupones.map((cupon) => {
          const vencido = isCuponVencido(cupon.fechaFin);
          const porcentajeUso = (cupon.usos / cupon.usosMaximos) * 100;
          
          return (
            <Card key={cupon.id} className={`p-6 hover:shadow-xl transition-shadow ${vencido ? 'opacity-60' : ''}`}>
              {/* Código del cupón */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-xl font-bold text-gray-900">{cupon.codigo}</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copiarCodigo(cupon.codigo)}
                    className="p-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">{cupon.descripcion}</p>
              </div>

              {/* Descuento */}
              <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700 font-medium">Descuento</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {getDescuentoDisplay(cupon)}
                  </span>
                </div>
              </div>

              {/* Información */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vigencia:</span>
                  <span className={`font-semibold ${vencido ? 'text-red-600' : 'text-gray-900'}`}>
                    {vencido ? 'Vencido' : new Date(cupon.fechaFin).toLocaleDateString('es-ES')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Usos:</span>
                  <span className="font-semibold text-gray-900">
                    {cupon.usos} / {cupon.usosMaximos}
                  </span>
                </div>

                {/* Barra de progreso de usos */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      porcentajeUso >= 100 ? 'bg-red-500' :
                      porcentajeUso >= 75 ? 'bg-yellow-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(porcentajeUso, 100)}%` }}
                  />
                </div>

                <div className="pt-2">
                  <span className="text-gray-600 text-xs">Planes aplicables:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cupon.planes.map((plan, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {plan}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  cupon.activo 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {cupon.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActivo(cupon.id)}
                  className="flex-1"
                >
                  {cupon.activo ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(cupon)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(cupon.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredCupones.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron cupones</p>
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCupon ? 'Editar Cupón' : 'Nuevo Cupón'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código del Cupón *
                  </label>
                  <Input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="VERANO2024"
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
                    placeholder="Descripción del cupón..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Descuento *
                    </label>
                    <select
                      value={formData.tipoDescuento}
                      onChange={(e) => setFormData({ ...formData, tipoDescuento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="porcentaje">Porcentaje</option>
                      <option value="valor">Valor Fijo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor del Descuento *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.valorDescuento}
                      onChange={(e) => setFormData({ ...formData, valorDescuento: e.target.value })}
                      placeholder={formData.tipoDescuento === 'porcentaje' ? '20' : '10000'}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio *
                    </label>
                    <Input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Fin *
                    </label>
                    <Input
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usos Máximos *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.usosMaximos}
                    onChange={(e) => setFormData({ ...formData, usosMaximos: e.target.value })}
                    placeholder="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planes Aplicables *
                  </label>
                  <div className="space-y-2">
                    {planesDisponibles.map((plan) => (
                      <label key={plan} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.planes.includes(plan)}
                          onChange={() => togglePlan(plan)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{plan}</span>
                      </label>
                    ))}
                  </div>
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
                    Cupón activo
                  </label>
                </div>

            <div className="flex gap-3 pt-4 border-t">
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
                {editingCupon ? 'Actualizar' : 'Crear'} Cupón
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
