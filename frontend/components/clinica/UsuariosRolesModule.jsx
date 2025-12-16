'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, Plus, Edit2, Trash2, Power, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function UsuariosRolesModule() {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModalUsuario, setShowModalUsuario] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [selectedRol, setSelectedRol] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    rol: '',
    telefono: '',
    cedula: ''
  });

  // Lista de todos los módulos disponibles
  const modulosDisponibles = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'admisiones', label: 'Admisiones' },
    { key: 'pacientes', label: 'Pacientes' },
    { key: 'citas', label: 'Citas' },
    { key: 'hce', label: 'Historia Clínica' },
    { key: 'enfermeria', label: 'Enfermería' },
    { key: 'farmacia', label: 'Farmacia' },
    { key: 'laboratorio', label: 'Laboratorio' },
    { key: 'imagenologia', label: 'Imagenología' },
    { key: 'urgencias', label: 'Urgencias' },
    { key: 'hospitalizacion', label: 'Hospitalización' },
    { key: 'facturacion', label: 'Facturación' },
    { key: 'quirofano', label: 'Quirófano' },
    { key: 'reportes', label: 'Reportes' },
    { key: 'doctores', label: 'Doctores' },
    { key: 'especialidades', label: 'Especialidades' },
    { key: 'departamentos', label: 'Departamentos' },
    { key: 'examenes', label: 'Exámenes' },
    { key: 'categorias-examenes', label: 'Categorías Exámenes' },
    { key: 'categorias-productos', label: 'Categorías Productos' },
    { key: 'etiquetas-productos', label: 'Etiquetas Productos' },
    { key: 'unidades', label: 'Unidades' },
    { key: 'habitaciones', label: 'Habitaciones' },
    { key: 'camas', label: 'Camas' },
    { key: 'planes-miapass', label: 'Planes MíaPass' },
    { key: 'suscripciones-miapass', label: 'Suscripciones MíaPass' },
    { key: 'suscriptores-miapass', label: 'Suscriptores MíaPass' },
    { key: 'cupones-miapass', label: 'Cupones MíaPass' },
    { key: 'ordenes-medicas', label: 'Órdenes Médicas' },
    { key: 'tickets-soporte', label: 'Tickets Soporte' },
    { key: 'publicaciones', label: 'Publicaciones' },
    { key: 'usuarios-roles', label: 'Usuarios y Roles' }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar usuarios
      const resUsuarios = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`);
      const dataUsuarios = await resUsuarios.json();
      if (dataUsuarios.success) {
        setUsuarios(dataUsuarios.data);
      }

      // Cargar roles
      const resRoles = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles/lista`);
      const dataRoles = await resRoles.json();
      if (dataRoles.success) {
        setRoles(dataRoles.data);
      }

      // Cargar permisos
      const resPermisos = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles/permisos`);
      const dataPermisos = await resPermisos.json();
      if (dataPermisos.success) {
        setPermisos(dataPermisos.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de Usuarios
  const handleAddUsuario = () => {
    setEditingUsuario(null);
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      rol: '',
      telefono: '',
      cedula: ''
    });
    setShowModalUsuario(true);
  };

  const handleEditUsuario = (usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      email: usuario.email,
      password: '',
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      telefono: usuario.telefono || '',
      cedula: usuario.cedula || ''
    });
    setShowModalUsuario(true);
  };

  const handleSubmitUsuario = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingUsuario 
        ? `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${editingUsuario.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/usuarios`;
      
      const method = editingUsuario ? 'PUT' : 'POST';
      
      const dataToSend = { ...formData };
      if (editingUsuario && !dataToSend.password) {
        delete dataToSend.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setShowModalUsuario(false);
        cargarDatos();
      } else {
        alert(data.message || 'Error al guardar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar usuario');
    }
  };

  const handleToggleActivo = async (id) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${id}/toggle-activo`, {
        method: 'PUT'
      });

      const data = await res.json();

      if (data.success) {
        cargarDatos();
      } else {
        alert(data.message || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cambiar estado');
    }
  };

  const handleDeleteUsuario = async (id) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        cargarDatos();
      } else {
        alert(data.message || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar usuario');
    }
  };

  // Funciones de Permisos
  const handleTogglePermiso = async (rol, modulo) => {
    const permisoActual = permisos[rol]?.find(p => p.modulo === modulo);
    const nuevoAcceso = permisoActual ? !permisoActual.acceso : true;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles/permisos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol, modulo, acceso: nuevoAcceso })
      });

      const data = await res.json();

      if (data.success) {
        cargarDatos();
      } else {
        alert(data.message || 'Error al actualizar permiso');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar permiso');
    }
  };

  const tieneAcceso = (rol, modulo) => {
    return permisos[rol]?.some(p => p.modulo === modulo && p.acceso) || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Usuarios y Roles</h1>
        <p className="text-gray-600 mt-1">Gestión de usuarios y permisos del sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
            activeTab === 'usuarios'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-5 h-5" />
          Usuarios
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
            activeTab === 'roles'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-5 h-5" />
          Roles y Permisos
        </button>
      </div>

      {/* Contenido de Usuarios */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total: {usuarios.length} usuarios</p>
            </div>
            <Button
              onClick={handleAddUsuario}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Rol
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Teléfono
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Cédula
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {usuario.nombre} {usuario.apellido}
                          </div>
                          <div className="text-sm text-gray-500">{usuario.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {usuario.telefono || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {usuario.cedula || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActivo(usuario.id)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            usuario.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUsuario(usuario)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUsuario(usuario.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Contenido de Roles y Permisos */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {roles.map((rol) => (
            <Card key={rol.value} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{rol.label}</h3>
                    <p className="text-sm text-gray-600">
                      {permisos[rol.value]?.filter(p => p.acceso).length || 0} permisos activos
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRol(selectedRol === rol.value ? null : rol.value)}
                >
                  {selectedRol === rol.value ? 'Ocultar' : 'Ver'} Permisos
                </Button>
              </div>

              {selectedRol === rol.value && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-4 border-t">
                  {modulosDisponibles.map((modulo) => {
                    const activo = tieneAcceso(rol.value, modulo.key);
                    return (
                      <button
                        key={modulo.key}
                        onClick={() => handleTogglePermiso(rol.value, modulo.key)}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          activo
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <span className={`text-sm font-medium ${
                          activo ? 'text-emerald-900' : 'text-gray-600'
                        }`}>
                          {modulo.label}
                        </span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          activo ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}>
                          {activo && <span className="text-white text-xs">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Usuario */}
      <Dialog open={showModalUsuario} onOpenChange={setShowModalUsuario}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitUsuario} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
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
                  Apellido *
                </label>
                <Input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña {editingUsuario && '(dejar vacío para no cambiar)'}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUsuario}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map((rol) => (
                    <option key={rol.value} value={rol.value}>
                      {rol.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <Input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cédula
              </label>
              <Input
                type="text"
                value={formData.cedula}
                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModalUsuario(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                {editingUsuario ? 'Actualizar' : 'Crear'} Usuario
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
