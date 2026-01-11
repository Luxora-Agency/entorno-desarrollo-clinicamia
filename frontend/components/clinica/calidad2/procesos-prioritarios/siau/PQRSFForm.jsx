'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCalidad2PQRSF } from '@/hooks/useCalidad2PQRSF';

export default function PQRSFForm({ pqrsf, open, onClose, onSuccess }) {
  const { createPQRSF, updatePQRSF } = useCalidad2PQRSF();
  const isEditing = Boolean(pqrsf?.id);

  const [formData, setFormData] = useState({
    tipo: '',
    nombrePeticionario: '',
    tipoDocumento: '',
    numeroDocumento: '',
    email: '',
    telefono: '',
    direccion: '',
    canalRecepcion: '',
    lugarApertura: '',
    asunto: '',
    descripcion: '',
    servicioRelacionado: '',
    funcionarioRelacionado: '',
    area: '',
    prioridad: 'MEDIA',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (pqrsf) {
      setFormData({
        tipo: pqrsf.tipo || '',
        nombrePeticionario: pqrsf.nombrePeticionario || '',
        tipoDocumento: pqrsf.tipoDocumento || '',
        numeroDocumento: pqrsf.numeroDocumento || '',
        email: pqrsf.email || '',
        telefono: pqrsf.telefono || '',
        direccion: pqrsf.direccion || '',
        canalRecepcion: pqrsf.canalRecepcion || '',
        lugarApertura: pqrsf.lugarApertura || '',
        asunto: pqrsf.asunto || '',
        descripcion: pqrsf.descripcion || '',
        servicioRelacionado: pqrsf.servicioRelacionado || '',
        funcionarioRelacionado: pqrsf.funcionarioRelacionado || '',
        area: pqrsf.area || '',
        prioridad: pqrsf.prioridad || 'MEDIA',
      });
    }
  }, [pqrsf]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      if (isEditing) {
        await updatePQRSF(pqrsf.id, formData);
      } else {
        await createPQRSF(formData);
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error guardando PQRSF:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar PQRSF' : 'Nueva PQRSF'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza la información de la PQRSF'
              : 'Registra una nueva Petición, Queja, Reclamo, Sugerencia o Felicitación'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo y Canal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PETICION">Petición</SelectItem>
                  <SelectItem value="QUEJA">Queja</SelectItem>
                  <SelectItem value="RECLAMO">Reclamo</SelectItem>
                  <SelectItem value="SUGERENCIA">Sugerencia</SelectItem>
                  <SelectItem value="FELICITACION">Felicitación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="canalRecepcion">
                Canal de Recepción <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.canalRecepcion} onValueChange={(value) => handleChange('canalRecepcion', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="VIRTUAL">Virtual</SelectItem>
                  <SelectItem value="TELEFONICA">Telefónica</SelectItem>
                  <SelectItem value="CORREO">Correo Electrónico</SelectItem>
                  <SelectItem value="BUZON">Buzón</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lugar de apertura (si es buzón) */}
          {formData.canalRecepcion === 'BUZON' && (
            <div className="space-y-2">
              <Label htmlFor="lugarApertura">Lugar de Apertura del Buzón</Label>
              <Input
                id="lugarApertura"
                value={formData.lugarApertura}
                onChange={(e) => handleChange('lugarApertura', e.target.value)}
                placeholder="Ej: Recepción principal, Sala de espera..."
              />
            </div>
          )}

          {/* Datos del Peticionario */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Datos del Peticionario</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombrePeticionario">
                  Nombre Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombrePeticionario"
                  value={formData.nombrePeticionario}
                  onChange={(e) => handleChange('nombrePeticionario', e.target.value)}
                  required
                  placeholder="Nombre completo del peticionario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                <Select value={formData.tipoDocumento} onValueChange={(value) => handleChange('tipoDocumento', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="PA">Pasaporte</SelectItem>
                    <SelectItem value="RC">Registro Civil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroDocumento">Número de Documento</Label>
                <Input
                  id="numeroDocumento"
                  value={formData.numeroDocumento}
                  onChange={(e) => handleChange('numeroDocumento', e.target.value)}
                  placeholder="Número de documento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  placeholder="Número de teléfono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  placeholder="Dirección de residencia"
                />
              </div>
            </div>
          </div>

          {/* Contenido de la PQRSF */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Contenido de la PQRSF</h3>

            <div className="space-y-2">
              <Label htmlFor="asunto">
                Asunto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="asunto"
                value={formData.asunto}
                onChange={(e) => handleChange('asunto', e.target.value)}
                required
                placeholder="Resumen breve del asunto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                required
                placeholder="Describe detalladamente la petición, queja, reclamo, sugerencia o felicitación..."
                rows={6}
              />
            </div>
          </div>

          {/* Clasificación */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Clasificación</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Área</Label>
                <Select value={formData.area} onValueChange={(value) => handleChange('area', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMINISTRATIVA">Administrativa</SelectItem>
                    <SelectItem value="ASISTENCIAL">Asistencial</SelectItem>
                    <SelectItem value="FACTURACION">Facturación</SelectItem>
                    <SelectItem value="FARMACIA">Farmacia</SelectItem>
                    <SelectItem value="ADMISIONES">Admisiones</SelectItem>
                    <SelectItem value="LABORATORIO">Laboratorio</SelectItem>
                    <SelectItem value="IMAGENOLOGIA">Imagenología</SelectItem>
                    <SelectItem value="URGENCIAS">Urgencias</SelectItem>
                    <SelectItem value="HOSPITALIZACION">Hospitalización</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select value={formData.prioridad} onValueChange={(value) => handleChange('prioridad', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="MEDIA">Media</SelectItem>
                    <SelectItem value="BAJA">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="servicioRelacionado">Servicio Relacionado</Label>
                <Input
                  id="servicioRelacionado"
                  value={formData.servicioRelacionado}
                  onChange={(e) => handleChange('servicioRelacionado', e.target.value)}
                  placeholder="Ej: Consulta externa, Urgencias..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="funcionarioRelacionado">Funcionario Relacionado (opcional)</Label>
              <Input
                id="funcionarioRelacionado"
                value={formData.funcionarioRelacionado}
                onChange={(e) => handleChange('funcionarioRelacionado', e.target.value)}
                placeholder="Nombre del funcionario (si aplica)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Radicar PQRSF'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
