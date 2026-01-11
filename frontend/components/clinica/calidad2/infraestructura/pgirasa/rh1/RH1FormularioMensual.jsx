'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function RH1FormularioMensual({
  registrosIniciales = [],
  mes,
  anio,
  onSave,
  onChange,
  loading = false
}) {
  const [registros, setRegistros] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Inicializar registros cuando cambien los iniciales o mes/año
  useEffect(() => {
    // Generar 31 días
    const dias = Array.from({ length: 31 }, (_, i) => {
      const dia = i + 1;
      const registroExistente = registrosIniciales?.find(r => r.dia === dia);

      if (registroExistente) {
        return {
          ...registroExistente,
          residuosAprovechables: registroExistente.residuosAprovechables || 0,
          residuosNoAprovechables: registroExistente.residuosNoAprovechables || 0,
          residuosInfecciosos: registroExistente.residuosInfecciosos || 0,
          residuosBiosanitarios: registroExistente.residuosBiosanitarios || 0,
        };
      }

      return {
        dia,
        mes: parseInt(mes),
        anio: parseInt(anio),
        residuosAprovechables: 0,
        residuosNoAprovechables: 0,
        residuosInfecciosos: 0,
        residuosBiosanitarios: 0,
        totalNoPeligrosos: 0,
        totalPeligrosos: 0,
        totalGenerado: 0,
        nuevo: true,
      };
    });

    setRegistros(dias);
    setHasChanges(false);
  }, [registrosIniciales, mes, anio]);

  // Calcular totales de un registro
  const calcularTotales = (aprovechables, noAprovechables, infecciosos, biosanitarios) => {
    const totalNoPeligrosos = aprovechables + noAprovechables;
    const totalPeligrosos = infecciosos + biosanitarios;
    const totalGenerado = totalNoPeligrosos + totalPeligrosos;

    return { totalNoPeligrosos, totalPeligrosos, totalGenerado };
  };

  // Manejar cambio en un input
  const handleInputChange = (dia, campo, valor) => {
    const valorNum = parseFloat(valor) || 0;

    setRegistros(prev => prev.map(r => {
      if (r.dia === dia) {
        const updated = { ...r, [campo]: valorNum };

        // Calcular totales
        const totales = calcularTotales(
          updated.residuosAprovechables,
          updated.residuosNoAprovechables,
          updated.residuosInfecciosos,
          updated.residuosBiosanitarios
        );

        return {
          ...updated,
          ...totales,
        };
      }
      return r;
    }));

    setHasChanges(true);
    if (onChange) onChange();
  };

  // Calcular totales del mes
  const totalesMes = useMemo(() => {
    return registros.reduce((acc, r) => ({
      aprovechables: acc.aprovechables + (r.residuosAprovechables || 0),
      noAprovechables: acc.noAprovechables + (r.residuosNoAprovechables || 0),
      infecciosos: acc.infecciosos + (r.residuosInfecciosos || 0),
      biosanitarios: acc.biosanitarios + (r.residuosBiosanitarios || 0),
      totalNoPeligrosos: acc.totalNoPeligrosos + (r.totalNoPeligrosos || 0),
      totalPeligrosos: acc.totalPeligrosos + (r.totalPeligrosos || 0),
      totalGenerado: acc.totalGenerado + (r.totalGenerado || 0),
    }), {
      aprovechables: 0,
      noAprovechables: 0,
      infecciosos: 0,
      biosanitarios: 0,
      totalNoPeligrosos: 0,
      totalPeligrosos: 0,
      totalGenerado: 0,
    });
  }, [registros]);

  // Contar días con datos
  const diasConDatos = useMemo(() => {
    return registros.filter(r =>
      r.residuosAprovechables > 0 ||
      r.residuosNoAprovechables > 0 ||
      r.residuosInfecciosos > 0 ||
      r.residuosBiosanitarios > 0
    ).length;
  }, [registros]);

  // Manejar guardado
  const handleSave = () => {
    if (!hasChanges) return;

    // Preparar registros para enviar (agregar fecha si es nuevo)
    const registrosParaGuardar = registros.map(r => {
      const registro = {
        ...r,
        mes: parseInt(mes),
        anio: parseInt(anio),
      };

      // Generar fecha si no existe
      if (!registro.fecha || registro.nuevo) {
        const fecha = new Date(anio, mes - 1, r.dia);
        registro.fecha = fecha.toISOString();
      }

      return registro;
    });

    onSave(registrosParaGuardar);
    setHasChanges(false);
  };

  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="space-y-4">
      {/* Header con botón de guardar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Registro Diario - {MESES[mes - 1]} {anio}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {diasConDatos} de 31 días registrados
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {/* Tabla de registros */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-16 text-center sticky left-0 bg-gray-50 z-10">Día</TableHead>
                  <TableHead colSpan={2} className="text-center border-r-2 border-gray-300">
                    Residuos No Peligrosos (kg/día)
                  </TableHead>
                  <TableHead colSpan={2} className="text-center border-r-2 border-gray-300">
                    Residuos Peligrosos (kg/día)
                  </TableHead>
                  <TableHead colSpan={3} className="text-center bg-blue-50">
                    Totales Calculados (kg)
                  </TableHead>
                </TableRow>
                <TableRow className="bg-gray-50">
                  <TableHead className="sticky left-0 bg-gray-50 z-10"></TableHead>
                  <TableHead className="text-center min-w-[120px]">Aprovechables</TableHead>
                  <TableHead className="text-center min-w-[130px] border-r-2 border-gray-300">No Aprovechables</TableHead>
                  <TableHead className="text-center min-w-[120px]">Infecciosos</TableHead>
                  <TableHead className="text-center min-w-[120px] border-r-2 border-gray-300">Biosanitarios</TableHead>
                  <TableHead className="text-center min-w-[120px] bg-blue-50">No Peligrosos</TableHead>
                  <TableHead className="text-center min-w-[120px] bg-blue-50">Peligrosos</TableHead>
                  <TableHead className="text-center min-w-[120px] bg-blue-50 font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {registros.map((registro) => {
                  const tieneValores = registro.residuosAprovechables > 0 ||
                                     registro.residuosNoAprovechables > 0 ||
                                     registro.residuosInfecciosos > 0 ||
                                     registro.residuosBiosanitarios > 0;

                  return (
                    <TableRow
                      key={registro.dia}
                      className={tieneValores ? 'bg-green-50/30' : 'hover:bg-gray-50'}
                    >
                      {/* Día */}
                      <TableCell className="text-center font-medium sticky left-0 bg-white">
                        {registro.dia}
                      </TableCell>

                      {/* Aprovechables */}
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={registro.residuosAprovechables}
                          onChange={(e) => handleInputChange(registro.dia, 'residuosAprovechables', e.target.value)}
                          className="text-center h-9"
                          placeholder="0.00"
                        />
                      </TableCell>

                      {/* No Aprovechables */}
                      <TableCell className="p-2 border-r-2 border-gray-300">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={registro.residuosNoAprovechables}
                          onChange={(e) => handleInputChange(registro.dia, 'residuosNoAprovechables', e.target.value)}
                          className="text-center h-9"
                          placeholder="0.00"
                        />
                      </TableCell>

                      {/* Infecciosos */}
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={registro.residuosInfecciosos}
                          onChange={(e) => handleInputChange(registro.dia, 'residuosInfecciosos', e.target.value)}
                          className="text-center h-9"
                          placeholder="0.00"
                        />
                      </TableCell>

                      {/* Biosanitarios */}
                      <TableCell className="p-2 border-r-2 border-gray-300">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={registro.residuosBiosanitarios}
                          onChange={(e) => handleInputChange(registro.dia, 'residuosBiosanitarios', e.target.value)}
                          className="text-center h-9"
                          placeholder="0.00"
                        />
                      </TableCell>

                      {/* Total No Peligrosos (calculado) */}
                      <TableCell className="text-center bg-blue-50/50 font-medium">
                        {(registro.totalNoPeligrosos || 0).toFixed(2)}
                      </TableCell>

                      {/* Total Peligrosos (calculado) */}
                      <TableCell className="text-center bg-blue-50/50 font-medium">
                        {(registro.totalPeligrosos || 0).toFixed(2)}
                      </TableCell>

                      {/* Total Generado (calculado) */}
                      <TableCell className="text-center bg-blue-100 font-bold text-blue-900">
                        {(registro.totalGenerado || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Fila de totales del mes */}
                <TableRow className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold border-t-4 border-blue-800">
                  <TableCell className="text-center sticky left-0 bg-blue-600">
                    TOTAL MES
                  </TableCell>
                  <TableCell className="text-center text-base">
                    {(Number(totalesMes.aprovechables) || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center text-base border-r-2 border-blue-800">
                    {(Number(totalesMes.noAprovechables) || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center text-base">
                    {(Number(totalesMes.infecciosos) || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center text-base border-r-2 border-blue-800">
                    {(Number(totalesMes.biosanitarios) || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center text-base bg-blue-700">
                    {(Number(totalesMes.totalNoPeligrosos) || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center text-base bg-blue-700">
                    {(Number(totalesMes.totalPeligrosos) || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center text-xl bg-blue-800">
                    {(Number(totalesMes.totalGenerado) || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Indicador de cambios */}
      {hasChanges && (
        <div className="flex items-center justify-center gap-2 text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
          <span className="text-sm font-medium">
            Hay cambios sin guardar. Haz clic en "Guardar Cambios" para persistir los datos.
          </span>
        </div>
      )}

      {/* Instrucciones */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Instrucciones de uso:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Ingrese los valores diarios de residuos generados en kilogramos (kg)</li>
              <li>Los totales se calculan automáticamente en tiempo real</li>
              <li>Las filas con datos aparecen resaltadas en verde claro</li>
              <li>Solo se guardarán los días con valores mayores a 0</li>
              <li>El total del mes se muestra en la última fila</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
