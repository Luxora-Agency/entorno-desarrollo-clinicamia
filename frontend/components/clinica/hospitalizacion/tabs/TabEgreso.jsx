'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TabEgreso({ admision, onReload }) {
  const { toast } = useToast();
  const [egresoData, setEgresoData] = useState({
    diagnosticoSalida: '',
    descripcionDiagnostico: '',
    resumenClinico: '',
    tratamientoDomiciliario: '',
    recomendaciones: '',
    tipoEgreso: 'Alta',
    estadoPaciente: 'Mejorado',
    requiereControl: false,
    fechaControl: '',
  });

  const diagnosticosComunesCIE11 = [
    { codigo: 'A09', descripcion: 'Diarrea y gastroenteritis de presunto origen infeccioso' },
    { codigo: 'J18.9', descripcion: 'Neumonía, no especificada' },
    { codigo: 'K35.8', descripcion: 'Apendicitis aguda' },
    { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
    { codigo: 'E11.9', descripcion: 'Diabetes mellitus no insulinodependiente sin complicaciones' },
    { codigo: 'K80.2', descripcion: 'Colelitiasis sin colecistitis' },
    { codigo: 'N39.0', descripcion: 'Infección de vías urinarias' },
    { codigo: 'O80', descripcion: 'Parto único espontáneo' },
    { codigo: 'S72.0', descripcion: 'Fractura del cuello del fémur' },
    { codigo: 'J45.9', descripcion: 'Asma, no especificada' },
    { codigo: 'K29.7', descripcion: 'Gastritis, no especificada' },
    { codigo: 'M54.5', descripcion: 'Lumbago' },
    { codigo: 'I50.9', descripcion: 'Insuficiencia cardíaca, no especificada' },
    { codigo: 'J44.9', descripcion: 'Enfermedad pulmonar obstructiva crónica' },
    { codigo: 'N20.0', descripcion: 'Cálculo del riñón' },
  ];

  const registrarEgreso = async () => {
    if (!egresoData.diagnosticoSalida || !egresoData.descripcionDiagnostico || !egresoData.resumenClinico) {
      toast({
        title: 'Campos requeridos',
        description: 'Complete todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admisiones/${admision.id}/administrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          diagnosticoSalida: egresoData.diagnosticoSalida,
          descripcionDiagnostico: egresoData.descripcionDiagnostico,
          resumenClinico: egresoData.resumenClinico,
          tratamientoDomiciliario: egresoData.tratamientoDomiciliario,
          recomendaciones: egresoData.recomendaciones,
          tipoEgreso: egresoData.tipoEgreso,
          estadoPaciente: egresoData.estadoPaciente,
          requiereControl: egresoData.requiereControl,
          fechaControl: egresoData.requiereControl ? egresoData.fechaControl : null,
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Éxito',
          description: 'Egreso registrado correctamente',
        });
        onReload();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'No se pudo registrar el egreso',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error',
        variant: 'destructive',
      });
    }
  };

  if (admision.estado !== 'Activa') {
    return (
      <div className="p-4">
        <Card className="bg-gray-50">
          <CardContent className="pt-4 text-center">
            <p className="text-gray-600">Esta admisión ya ha sido egresada</p>
            <Badge className="mt-2">{admision.estado}</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Formulario de Egreso</h3>

      <div className="space-y-4">
        <div>
          <Label>Código Diagnóstico (CIE-11) *</Label>
          <Input
            value={egresoData.diagnosticoSalida}
            onChange={(e) => setEgresoData({ ...egresoData, diagnosticoSalida: e.target.value })}
            placeholder="Ej: J18.9, K35.8, I10"
          />
        </div>
        
        <div>
          <Label>Descripción del Diagnóstico *</Label>
          <Input
            value={egresoData.descripcionDiagnostico}
            onChange={(e) => setEgresoData({ ...egresoData, descripcionDiagnostico: e.target.value })}
            placeholder="Descripción completa del diagnóstico"
          />
        </div>
        
        <div>
          <Label className="text-sm text-gray-600">Diagnósticos Comunes CIE-11</Label>
          <Select
            value=""
            onValueChange={(value) => {
              const diag = diagnosticosComunesCIE11.find(d => d.codigo === value);
              if (diag) {
                setEgresoData({ 
                  ...egresoData, 
                  diagnosticoSalida: diag.codigo,
                  descripcionDiagnostico: diag.descripcion
                });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un diagnóstico predefinido para autocompletar" />
            </SelectTrigger>
            <SelectContent>
              {diagnosticosComunesCIE11.map((diag) => (
                <SelectItem key={diag.codigo} value={diag.codigo}>
                  {diag.codigo} - {diag.descripcion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Resumen Clínico *</Label>
          <Textarea
            value={egresoData.resumenClinico}
            onChange={(e) => setEgresoData({ ...egresoData, resumenClinico: e.target.value })}
            placeholder="Resumen de la estancia hospitalaria..."
            rows={4}
          />
        </div>

        <div>
          <Label>Tratamiento Domiciliario</Label>
          <Textarea
            value={egresoData.tratamientoDomiciliario}
            onChange={(e) => setEgresoData({ ...egresoData, tratamientoDomiciliario: e.target.value })}
            placeholder="Medicamentos y tratamiento a seguir en casa..."
            rows={3}
          />
        </div>

        <div>
          <Label>Recomendaciones</Label>
          <Textarea
            value={egresoData.recomendaciones}
            onChange={(e) => setEgresoData({ ...egresoData, recomendaciones: e.target.value })}
            placeholder="Recomendaciones para el paciente..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tipo de Egreso</Label>
            <Select
              value={egresoData.tipoEgreso}
              onValueChange={(value) => setEgresoData({ ...egresoData, tipoEgreso: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Remisión">Remisión</SelectItem>
                <SelectItem value="Fuga">Fuga</SelectItem>
                <SelectItem value="Defunción">Defunción</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Estado del Paciente</Label>
            <Select
              value={egresoData.estadoPaciente}
              onValueChange={(value) => setEgresoData({ ...egresoData, estadoPaciente: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mejorado">Mejorado</SelectItem>
                <SelectItem value="Curado">Curado</SelectItem>
                <SelectItem value="Igual">Igual</SelectItem>
                <SelectItem value="Empeorado">Empeorado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requiereControl"
            checked={egresoData.requiereControl}
            onChange={(e) => setEgresoData({ ...egresoData, requiereControl: e.target.checked })}
            className="rounded border-gray-300"
          />
          <Label htmlFor="requiereControl" className="font-normal cursor-pointer">
            Requiere control posterior
          </Label>
        </div>

        {egresoData.requiereControl && (
          <div>
            <Label>Fecha de Control Sugerida</Label>
            <Input
              type="date"
              value={egresoData.fechaControl}
              onChange={(e) => setEgresoData({ ...egresoData, fechaControl: e.target.value })}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={registrarEgreso} className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            Registrar Egreso
          </Button>
        </div>
      </div>
    </div>
  );
}
