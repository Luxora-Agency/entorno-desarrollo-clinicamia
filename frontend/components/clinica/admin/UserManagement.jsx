import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Power, Eye, EyeOff, Search, Loader2 } from 'lucide-react';
import { toast } from "sonner";

export default function UserManagement() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    rol: '', // This will now store the Role ID
    telefono: '',
    cedula: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching users and roles...');
      
      const [usersResult, rolesResult] = await Promise.allSettled([
        apiGet('/usuarios'),
        apiGet('/roles')
      ]);

      // Handle Users
      if (usersResult.status === 'fulfilled') {
        const usersRes = usersResult.value;
        console.log('Users response:', usersRes);
        
        if (usersRes && Array.isArray(usersRes.data)) {
          setUsuarios(usersRes.data);
        } else if (Array.isArray(usersRes)) {
          setUsuarios(usersRes);
        } else {
          console.warn('Unexpected users data format:', usersRes);
          setUsuarios([]);
        }
      } else {
        console.error('Error fetching users:', usersResult.reason);
        toast.error('Error al cargar usuarios: ' + (usersResult.reason.message || 'Error desconocido'));
        setUsuarios([]);
      }

      // Handle Roles
      if (rolesResult.status === 'fulfilled') {
        setRoles(rolesResult.value.data || []);
      } else {
        console.error('Error fetching roles:', rolesResult.reason);
        toast.error('Error al cargar roles: ' + (rolesResult.reason.message || 'Error desconocido'));
        setRoles([]);
      }
    } catch (error) {
      console.error('Critical error in fetchData:', error);
      toast.error('Error crítico al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      rol: '',
      telefono: '',
      cedula: ''
    });
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    // Find role ID if possible, otherwise use the string for backward compatibility
    // In the new system, we should fetch user roles. For now, we assume simple mapping or single role.
    // If the backend returns `user.rol` as the role name, we might need to find the ID.
    const role = roles.find(r => r.name === user.rol || r.id === user.rol);
    
    setFormData({
      email: user.email,
      password: '',
      nombre: user.nombre,
      apellido: user.apellido,
      rol: role ? role.id : user.rol, // Try to match ID
      telefono: user.telefono || '',
      cedula: user.cedula || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingUser 
        ? `/usuarios/${editingUser.id}`
        : '/usuarios';
      
      const method = editingUser ? apiPut : apiPost;
      
      const dataToSend = { ...formData };
      if (editingUser && !dataToSend.password) {
        delete dataToSend.password;
      }
      
      // If we are using the new role system, we might need to assign the role separately 
      // or the backend handles it. Let's assume backend handles 'rol' field in body 
      // by assigning the role ID to UserRole.
      
      const response = await method(url, dataToSend);

      if (response.success) {
        toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado');
        setShowModal(false);
        fetchData();
      } else {
        toast.error(response.message || 'Error al guardar usuario');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;
    try {
      const response = await apiDelete(`/usuarios/${id}`);
      if (response.success) {
        toast.success('Usuario eliminado');
        fetchData();
      }
    } catch (error) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  const filteredUsers = Array.isArray(usuarios) ? usuarios.filter(u => 
    (u.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.apellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando usuarios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Buscar usuario..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.nombre} {user.apellido}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.rol || 'Sin rol'}</Badge>
                  </TableCell>
                  <TableCell>{user.telefono || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={user.activo ? "success" : "destructive"}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Apellido *</label>
                <Input
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña {editingUser && '(opcional)'}</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol *</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cédula</label>
              <Input
                value={formData.cedula}
                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingUser ? 'Actualizar' : 'Crear'} Usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
