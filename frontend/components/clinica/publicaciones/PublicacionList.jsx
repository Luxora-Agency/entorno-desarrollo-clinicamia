
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, X, Loader2, Save, Send, CheckCircle, XCircle, Upload, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

// Estados de publicación
const ESTADOS_PUBLICACION = [
  { value: 'Borrador', label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
  { value: 'Pendiente', label: 'Pendiente Aprobación', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'Rechazado', label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  { value: 'Publicado', label: 'Publicado', color: 'bg-green-100 text-green-700' },
];

// Estados visibles para doctores (sin Publicado - eso solo lo hace el admin)
const ESTADOS_DOCTOR = [
  { value: 'Borrador', label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
];

export default function PublicacionList({ user }) {
  const [publicaciones, setPublicaciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPub, setSelectedPub] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    extracto: '',
    imagenPortada: '',
    categoriaId: '',
    estado: 'Borrador',
  });

  // Verificar rol del usuario
  const userRole = (user?.rol || user?.role || user?.rolNombre || '').toLowerCase();
  const isAdmin = ['admin', 'administrador', 'super_admin', 'superadmin'].includes(userRole);
  const userId = user?.id;

  // Verificar si el usuario puede editar/eliminar una publicación
  const canEditDelete = (pub) => {
    if (isAdmin) return true;
    if (pub.estado === 'Publicado' || pub.estado === 'Aprobado') return false;
    return pub.autorId === userId || pub.autor?.id === userId;
  };

  const fetchPublicaciones = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/publicaciones?search=${searchTerm}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPublicaciones(data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", { description: "No se pudieron cargar las publicaciones" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/publicaciones/categorias/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategorias(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categorias:', error);
    }
  };

  useEffect(() => {
    fetchPublicaciones();
    fetchCategorias();
  }, [searchTerm]);

  // Generar slug desde título
  const generateSlug = (titulo) => {
    return titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Abrir modal para nueva publicación
  const handleNueva = () => {
    setIsEditing(false);
    setSelectedPub(null);
    setFormData({
      titulo: '',
      contenido: '',
      extracto: '',
      imagenPortada: '',
      categoriaId: '',
      estado: 'Borrador',
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEditar = (pub) => {
    setIsEditing(true);
    setSelectedPub(pub);
    setFormData({
      titulo: pub.titulo || '',
      contenido: pub.contenido || '',
      extracto: pub.extracto || '',
      imagenPortada: pub.imagenPortada || '',
      categoriaId: pub.categoriaId || '',
      estado: pub.estado || 'Borrador',
    });
    setShowModal(true);
  };

  // Guardar publicación
  const handleGuardar = async () => {
    if (!formData.titulo.trim()) {
      toast.error("Error", { description: "El título es requerido" });
      return;
    }
    if (!formData.contenido.trim()) {
      toast.error("Error", { description: "El contenido es requerido" });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const slug = generateSlug(formData.titulo);

      const payload = {
        ...formData,
        slug,
        categoriaId: formData.categoriaId || null,
      };

      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/publicaciones/${selectedPub.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/publicaciones`;

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Éxito", {
          description: isEditing ? "Publicación actualizada" : "Publicación creada"
        });
        setShowModal(false);
        fetchPublicaciones();
      } else {
        const error = await res.json();
        toast.error("Error", { description: error.message || "No se pudo guardar la publicación" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", { description: "Error al guardar la publicación" });
    } finally {
      setSaving(false);
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = (pub) => {
    setSelectedPub(pub);
    setShowDeleteDialog(true);
  };

  // Eliminar publicación
  const handleEliminar = async () => {
    if (!selectedPub) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/publicaciones/${selectedPub.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Éxito", { description: "Publicación eliminada" });
        setShowDeleteDialog(false);
        setSelectedPub(null);
        fetchPublicaciones();
      } else {
        const error = await res.json();
        toast.error("Error", { description: error.message || "No se pudo eliminar" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", { description: "Error al eliminar la publicación" });
    }
  };

  // Solicitar publicación (doctor)
  const handleSolicitarPublicacion = async (pub) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/publicaciones/${pub.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'Pendiente' }),
      });

      if (res.ok) {
        toast.success("Solicitud enviada", {
          description: "Tu publicación ha sido enviada para aprobación"
        });
        fetchPublicaciones();
      } else {
        const error = await res.json();
        toast.error("Error", { description: error.message || "No se pudo enviar la solicitud" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", { description: "Error al solicitar publicación" });
    }
  };

  // Aprobar publicación (admin)
  const handleAprobar = async (pub) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/publicaciones/${pub.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'Publicado', fechaPublicacion: new Date().toISOString() }),
      });

      if (res.ok) {
        toast.success("Publicación aprobada", {
          description: "La publicación ha sido aprobada y publicada"
        });
        fetchPublicaciones();
      } else {
        const error = await res.json();
        toast.error("Error", { description: error.message || "No se pudo aprobar" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", { description: "Error al aprobar publicación" });
    }
  };

  // Rechazar publicación (admin)
  const handleRechazar = async (pub) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/publicaciones/${pub.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'Rechazado' }),
      });

      if (res.ok) {
        toast.info("Publicación rechazada", {
          description: "La publicación ha sido rechazada"
        });
        fetchPublicaciones();
      } else {
        const error = await res.json();
        toast.error("Error", { description: error.message || "No se pudo rechazar" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", { description: "Error al rechazar publicación" });
    }
  };

  // Subir imagen
  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Error", { description: "Solo se permiten imágenes (JPEG, PNG, GIF, WebP)" });
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Error", { description: "La imagen no puede superar 5MB" });
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/publicaciones/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}${data.data.url}`;
        setFormData(prev => ({ ...prev, imagenPortada: imageUrl }));
        toast.success("Imagen subida", { description: "La imagen se ha subido correctamente" });
      } else {
        const error = await res.json();
        toast.error("Error", { description: error.message || "No se pudo subir la imagen" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", { description: "Error al subir la imagen" });
    } finally {
      setUploading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const config = ESTADOS_PUBLICACION.find(e => e.value === estado) || ESTADOS_PUBLICACION[0];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Listado de Publicaciones</CardTitle>
          <Button onClick={handleNueva}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Publicación
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead>Fecha Publicación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publicaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No hay publicaciones encontradas
                    </TableCell>
                  </TableRow>
                ) : (
                  publicaciones.map((pub) => (
                    <TableRow key={pub.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{pub.titulo}</span>
                          <span className="text-xs text-gray-500">{pub.slug}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(pub.estado)}
                      </TableCell>
                      <TableCell>
                        {pub.autor ? (
                          <span>Dr(a). {pub.autor.nombre} {pub.autor.apellido}</span>
                        ) : (
                          <span className="text-gray-400">Sin autor</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {pub.createdAt
                          ? new Date(pub.createdAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {pub.fechaPublicacion ? (
                          <span className="text-green-600 font-medium">
                            {new Date(pub.fechaPublicacion).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {/* Admin: botones de aprobar/rechazar para publicaciones pendientes */}
                          {isAdmin && pub.estado === 'Pendiente' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleAprobar(pub)}
                                title="Aprobar publicación"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleRechazar(pub)}
                                title="Rechazar publicación"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {/* Editar y eliminar si tiene permisos */}
                          {canEditDelete(pub) && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditar(pub)}
                                title="Editar publicación"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500"
                                onClick={() => handleConfirmDelete(pub)}
                                title="Eliminar publicación"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {/* Doctor: solicitar publicación si está en borrador */}
                          {!isAdmin && pub.estado === 'Borrador' && canEditDelete(pub) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => handleSolicitarPublicacion(pub)}
                              title="Solicitar publicación"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Solicitar
                            </Button>
                          )}

                          {/* Mensaje si no tiene permisos */}
                          {!canEditDelete(pub) && !isAdmin && (
                            <span className="text-xs text-gray-400 italic">
                              {pub.estado === 'Publicado' ? 'Publicada' :
                               pub.estado === 'Pendiente' ? 'En revisión' : 'Sin permisos'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Nueva/Editar Publicación */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Publicación' : 'Nueva Publicación'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Modifica los datos de la publicación'
                : 'Completa los datos para crear una nueva publicación'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título de la publicación"
                className="mt-1"
              />
              {formData.titulo && (
                <p className="text-xs text-gray-500 mt-1">
                  Slug: {generateSlug(formData.titulo)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="extracto">Extracto</Label>
              <Textarea
                id="extracto"
                value={formData.extracto}
                onChange={(e) => setFormData({ ...formData, extracto: e.target.value })}
                placeholder="Breve resumen de la publicación (opcional)"
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="contenido">Contenido *</Label>
              <Textarea
                id="contenido"
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                placeholder="Contenido completo de la publicación"
                className="mt-1"
                rows={8}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formData.categoriaId || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, categoriaId: v === 'none' ? '' : v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isAdmin ? (
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(v) => setFormData({ ...formData, estado: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_PUBLICACION.map((est) => (
                        <SelectItem key={est.value} value={est.value}>
                          {est.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>Estado</Label>
                  <div className="mt-1 p-2 bg-gray-100 rounded-md text-sm text-gray-600">
                    {isEditing ? (
                      <>
                        {formData.estado === 'Borrador' && 'Borrador'}
                        {formData.estado === 'Pendiente' && 'Pendiente Aprobación'}
                        {formData.estado === 'Rechazado' && 'Rechazado - Puedes editar y volver a solicitar'}
                        {formData.estado === 'Publicado' && 'Publicado'}
                      </>
                    ) : (
                      'Borrador (se guardará como borrador)'
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Usa el botón "Solicitar" para enviar a aprobación
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label>Imagen de Portada</Label>
              <div className="mt-2 space-y-3">
                {/* Preview de imagen */}
                {formData.imagenPortada && (
                  <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={formData.imagenPortada}
                      alt="Portada"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => setFormData({ ...formData, imagenPortada: '' })}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Botón de subir */}
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleUploadImage}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        {uploading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {uploading ? 'Subiendo...' : 'Subir imagen'}
                      </span>
                    </Button>
                  </label>
                </div>

                {/* O ingresar URL */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">o ingresa URL:</span>
                  <Input
                    value={formData.imagenPortada}
                    onChange={(e) => setFormData({ ...formData, imagenPortada: e.target.value })}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="flex-1 h-8 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Formatos: JPEG, PNG, GIF, WebP. Máx 5MB.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la publicación
              "{selectedPub?.titulo}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
