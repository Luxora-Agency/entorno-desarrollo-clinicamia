'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, Search, CheckCircle2, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Modal para distribuir documento a usuarios
 *
 * Features:
 * - Búsqueda de usuarios
 * - Selección múltiple de usuarios
 * - Historial de distribución
 * - Estado de confirmación de lectura
 *
 * TODO: Integrar con API de usuarios para búsqueda real
 */
export default function DistribucionDocumentoModal({ documento, onDistribuir, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // TODO: Reemplazar con llamada real a API de usuarios
  const mockUsuarios = [
    { id: 'user-1', nombre: 'Juan', apellido: 'Pérez', email: 'juan@example.com', cargo: 'Médico' },
    { id: 'user-2', nombre: 'María', apellido: 'García', email: 'maria@example.com', cargo: 'Enfermera' },
    { id: 'user-3', nombre: 'Carlos', apellido: 'López', email: 'carlos@example.com', cargo: 'Auditor' },
    { id: 'user-4', nombre: 'Ana', apellido: 'Martínez', email: 'ana@example.com', cargo: 'Coordinadora' },
    { id: 'user-5', nombre: 'Pedro', apellido: 'Rodríguez', email: 'pedro@example.com', cargo: 'Director' },
  ];

  // Filtrar usuarios por búsqueda
  const filteredUsers = mockUsuarios.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.nombre.toLowerCase().includes(searchLower) ||
      user.apellido.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.cargo.toLowerCase().includes(searchLower)
    );
  });

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  const handleDistribuir = async () => {
    if (selectedUsers.length === 0) {
      return;
    }

    setLoading(true);
    try {
      await onDistribuir(selectedUsers);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error distributing:', error);
    } finally {
      setLoading(false);
    }
  };

  // Historial de distribución del documento
  const distribucionHistorial = documento?.distribucion || [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Distribuir Documento
          </DialogTitle>
          <DialogDescription>
            {documento?.codigo} - {documento?.nombre}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Historial de distribución */}
          {distribucionHistorial.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-sm font-medium mb-3">
                  Distribución Actual ({distribucionHistorial.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {distribucionHistorial.map((dist) => (
                    <div
                      key={dist.id}
                      className="flex items-center justify-between text-sm p-2 rounded-md border"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {dist.usuario?.nombre} {dist.usuario?.apellido}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {dist.confirmado ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Leído
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            Pendiente
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(dist.fechaEntrega), 'dd/MM/yy', { locale: es })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Búsqueda de usuarios */}
          <div className="space-y-2">
            <Label>Seleccionar Usuarios</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Seleccionar todos */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={
                filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length
              }
              onCheckedChange={toggleAll}
            />
            <Label htmlFor="select-all" className="cursor-pointer">
              Seleccionar todos ({filteredUsers.length})
            </Label>
          </div>

          {/* Lista de usuarios */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-3">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron usuarios
              </p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => toggleUser(user.id)}
                >
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => toggleUser(user.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {user.nombre} {user.apellido}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {user.cargo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Contador de seleccionados */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-md">
              <span className="text-sm font-medium">
                {selectedUsers.length} usuario(s) seleccionado(s)
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUsers([])}>
                Limpiar selección
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDistribuir}
            disabled={selectedUsers.length === 0 || loading}
          >
            {loading ? 'Distribuyendo...' : `Distribuir a ${selectedUsers.length} usuario(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
