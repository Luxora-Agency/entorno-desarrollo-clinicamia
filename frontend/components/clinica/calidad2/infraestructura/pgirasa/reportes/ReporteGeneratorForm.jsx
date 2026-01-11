'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInfraestructuraReportes } from '@/hooks/useInfraestructuraReportes';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

export default function ReporteGeneratorForm({ tipo, isOpen, onClose }) {
  const fechaActual = new Date();
  const anioActual = fechaActual.getFullYear();
  const mesActual = fechaActual.getMonth() + 1;

  const [formData, setFormData] = useState({
    mes: mesActual,
    anio: anioActual,
    semestre: 1,
    nombre: '',
    descripcion: '',
  });

  const {
    generando,
    generarReporteMensualRH1,
    generarReporteSemestralIndicadores,
    generarReportePersonalizado,
  } = useInfraestructuraReportes();

  useEffect(() => {
    // Inicializar nombre según tipo
    let nombreDefault = '';
    if (tipo === 'MENSUAL_RH1') {
      nombreDefault = `Reporte RH1 - ${getMesNombre(mesActual)} ${anioActual}`;
    } else if (tipo === 'SEMESTRAL_INDICADORES') {
      nombreDefault = `Indicadores - Semestre 1 ${anioActual}`;
    } else if (tipo === 'ANUAL_CONCEPTO') {
      nombreDefault = `Concepto Sanitario ${anioActual}`;
    }

    setFormData(prev => ({
      ...prev,
      nombre: nombreDefault,
    }));
  }, [tipo, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Actualizar nombre cuando cambian mes/año/semestre
      if (field === 'mes' || field === 'anio') {
        if (tipo === 'MENSUAL_RH1') {
          updated.nombre = `Reporte RH1 - ${getMesNombre(updated.mes)} ${updated.anio}`;
        }
      }

      if (field === 'semestre' || field === 'anio') {
        if (tipo === 'SEMESTRAL_INDICADORES') {
          updated.nombre = `Indicadores - Semestre ${updated.semestre} ${updated.anio}`;
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let reporte = null;

    if (tipo === 'MENSUAL_RH1') {
      reporte = await generarReporteMensualRH1(formData.mes, formData.anio);
    } else if (tipo === 'SEMESTRAL_INDICADORES') {
      reporte = await generarReporteSemestralIndicadores(formData.semestre, formData.anio);
    } else if (tipo === 'PERSONALIZADO') {
      reporte = await generarReportePersonalizado({
        tipo: 'PERSONALIZADO',
        periodo: `${formData.anio}`,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        filtros: {},
      });
    }

    if (reporte) {
      onClose();
    }
  };

  // Años disponibles
  const aniosDisponibles = Array.from(
    { length: 5 },
    (_, i) => anioActual - 2 + i
  );

  // Meses del año
  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const getMesNombre = (mes) => {
    const m = meses.find(m => m.value === mes);
    return m ? m.label : mes;
  };

  // Título del modal según tipo
  const getTitulo = () => {
    switch (tipo) {
      case 'MENSUAL_RH1':
        return 'Generar Reporte RH1 Mensual';
      case 'SEMESTRAL_INDICADORES':
        return 'Generar Reporte de Indicadores Semestral';
      case 'ANUAL_CONCEPTO':
        return 'Generar Reporte de Concepto Sanitario';
      case 'PERSONALIZADO':
        return 'Generar Reporte Personalizado';
      default:
        return 'Generar Reporte';
    }
  };

  const getIcono = () => {
    if (tipo === 'MENSUAL_RH1') {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    return <FileText className="w-5 h-5 text-red-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcono()}
            {getTitulo()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Formulario para RH1 Mensual */}
          {tipo === 'MENSUAL_RH1' && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-green-900">Reporte Excel</div>
                    <div className="text-xs text-green-700 mt-1">
                      Este reporte generará un archivo Excel con los datos RH1 del mes seleccionado,
                      incluyendo todos los registros diarios y totales mensuales.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mes">Mes</Label>
                  <Select
                    value={String(formData.mes)}
                    onValueChange={(val) => handleChange('mes', parseInt(val))}
                  >
                    <SelectTrigger id="mes">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meses.map(mes => (
                        <SelectItem key={mes.value} value={String(mes.value)}>
                          {mes.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anio">Año</Label>
                  <Select
                    value={String(formData.anio)}
                    onValueChange={(val) => handleChange('anio', parseInt(val))}
                  >
                    <SelectTrigger id="anio">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aniosDisponibles.map(anio => (
                        <SelectItem key={anio} value={String(anio)}>
                          {anio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Formulario para Indicadores Semestral */}
          {tipo === 'SEMESTRAL_INDICADORES' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">Reporte PDF</div>
                    <div className="text-xs text-blue-700 mt-1">
                      Este reporte generará un PDF con los 7 indicadores PGIRASA del semestre,
                      incluyendo mediciones, promedios y cumplimiento de metas.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semestre">Semestre</Label>
                  <Select
                    value={String(formData.semestre)}
                    onValueChange={(val) => handleChange('semestre', parseInt(val))}
                  >
                    <SelectTrigger id="semestre">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semestre 1 (Ene-Jun)</SelectItem>
                      <SelectItem value="2">Semestre 2 (Jul-Dic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anio-sem">Año</Label>
                  <Select
                    value={String(formData.anio)}
                    onValueChange={(val) => handleChange('anio', parseInt(val))}
                  >
                    <SelectTrigger id="anio-sem">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aniosDisponibles.map(anio => (
                        <SelectItem key={anio} value={String(anio)}>
                          {anio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Formulario para Personalizado */}
          {tipo === 'PERSONALIZADO' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre-custom">Nombre del Reporte</Label>
                <Input
                  id="nombre-custom"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Reporte Personalizado..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  placeholder="Describe el contenido del reporte..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="anio-custom">Año</Label>
                <Select
                  value={String(formData.anio)}
                  onValueChange={(val) => handleChange('anio', parseInt(val))}
                >
                  <SelectTrigger id="anio-custom">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aniosDisponibles.map(anio => (
                      <SelectItem key={anio} value={String(anio)}>
                        {anio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Nombre del reporte (editable) */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Archivo</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={generando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={generando}>
              {generando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  {tipo === 'MENSUAL_RH1' ? (
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Generar Reporte
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
