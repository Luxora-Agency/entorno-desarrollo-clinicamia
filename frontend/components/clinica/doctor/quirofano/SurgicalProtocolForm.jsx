'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

export default function SurgicalProtocolForm({ data, onChange, readOnly = false }) {
  const handleChange = (field, value) => {
    if (readOnly) return;
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Descripción Quirúrgica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Hallazgos Intraoperatorios</Label>
            <Textarea
              placeholder="Describa lo encontrado durante la cirugía..."
              value={data.hallazgos || ''}
              onChange={(e) => handleChange('hallazgos', e.target.value)}
              className="min-h-[100px]"
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción del Procedimiento (Técnica)</Label>
            <Textarea
              placeholder="Detalle paso a paso del procedimiento realizado..."
              value={data.descripcion || ''}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              className="min-h-[150px]"
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label>Complicaciones</Label>
            <Textarea
              placeholder="Describa si hubo complicaciones (o niegue)..."
              value={data.complicaciones || ''}
              onChange={(e) => handleChange('complicaciones', e.target.value)}
              readOnly={readOnly}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pérdida Sanguínea Estimada (cc)</Label>
              <Input
                type="number"
                value={data.sangrado || ''}
                onChange={(e) => handleChange('sangrado', e.target.value)}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Recuento de Materiales</Label>
              <Input
                value={data.recuento || 'Completo'}
                onChange={(e) => handleChange('recuento', e.target.value)}
                readOnly={readOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Muestras y Patología</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Muestras Enviadas</Label>
            <Textarea
              placeholder="Liste las muestras enviadas a patología..."
              value={data.muestras || ''}
              onChange={(e) => handleChange('muestras', e.target.value)}
              readOnly={readOnly}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
