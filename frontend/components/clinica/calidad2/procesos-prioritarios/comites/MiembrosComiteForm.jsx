'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet } from '@/services/api';

/**
 * Formulario para gestionar miembros de un comité
 * Permite agregar/quitar miembros y asignar cargos
 */
export default function MiembrosComiteForm({ open, onClose, comite, onAddMiembro, onRemoveMiembro }) {
  const [miembrosActuales, setMiembrosActuales] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [cargo, setCargo] = useState('MIEMBRO');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && comite) {
      setMiembrosActuales(comite.miembros || []);
      fetchUsuariosDisponibles();
    }
  }, [open, comite]);

  const fetchUsuariosDisponibles = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/usuarios', { limit: 1000 });
      setUsuariosDisponibles(response.data || []);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMiembro = async () => {
    if (!selectedUsuario) {
      toast.error('Debe seleccionar un usuario');
      return;
    }

    // Verificar si ya está en el comité
    if (miembrosActuales.some((m) => m.usuarioId === selectedUsuario)) {
      toast.error('Este usuario ya es miembro del comité');
      return;
    }

    const data = {
      comiteId: comite.id,
      usuarioId: selectedUsuario,
      cargo,
    };

    await onAddMiembro(data);
    setSelectedUsuario('');
    setCargo('MIEMBRO');
  };

  const handleRemoveMiembro = async (miembroId) => {
    if (confirm('¿Está seguro de remover este miembro del comité?')) {
      await onRemoveMiembro(miembroId);
    }
  };

  const getCargoColor = (cargo) => {
    const colors = {
      PRESIDENTE: 'blue',
      SECRETARIO: 'purple',
      MIEMBRO: 'default',
      ASESOR: 'green',
    };
    return colors[cargo] || 'default';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Gestión de Miembros
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {comite?.nombre || 'Comité'}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Sobre los miembros</p>
                  <p className="text-blue-700">
                    Los comités deben contar con presidente, secretario y miembros según lo establecido
                    en la Resolución 2003/2014. El presidente coordina las reuniones y el secretario
                    elabora las actas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agregar Miembro */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Agregar Nuevo Miembro
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="usuario">Usuario</Label>
                <Select value={selectedUsuario} onValueChange={setSelectedUsuario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuariosDisponibles
                      .filter((u) => !miembrosActuales.some((m) => m.usuarioId === u.id))
                      .map((usuario) => (
                        <SelectItem key={usuario.id} value={usuario.id}>
                          {usuario.nombre} - {usuario.rol}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select value={cargo} onValueChange={setCargo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESIDENTE">Presidente</SelectItem>
                    <SelectItem value="SECRETARIO">Secretario</SelectItem>
                    <SelectItem value="MIEMBRO">Miembro</SelectItem>
                    <SelectItem value="ASESOR">Asesor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAddMiembro} disabled={!selectedUsuario}>
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Miembro
            </Button>
          </div>

          {/* Lista de Miembros Actuales */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Miembros Actuales
              </h3>
              <Badge variant="outline">{miembrosActuales.length}</Badge>
            </div>

            {miembrosActuales.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay miembros registrados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {miembrosActuales.map((miembro) => (
                  <Card key={miembro.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">
                                {miembro.usuario?.nombre || 'Usuario'}
                              </p>
                              <Badge variant={getCargoColor(miembro.cargo)}>
                                {miembro.cargo}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {miembro.usuario?.email || ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {miembro.fechaIngreso && (
                            <p className="text-xs text-muted-foreground">
                              Desde:{' '}
                              {new Date(miembro.fechaIngreso).toLocaleDateString('es-CO')}
                            </p>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMiembro(miembro.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
