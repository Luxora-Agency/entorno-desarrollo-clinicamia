'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
} from 'lucide-react';

/**
 * Checklist de Auditoría de Historia Clínica
 * Basado en Resolución 1995/1999 del Ministerio de Salud de Colombia
 */

const CHECKLIST_ITEMS = [
  {
    id: 'identificacion',
    titulo: '1. Identificación del Paciente',
    descripcion: 'Verificar datos completos y correctos del paciente',
    criterios: [
      { id: 'id_nombre', texto: 'Nombre completo del paciente' },
      { id: 'id_documento', texto: 'Tipo y número de documento de identidad' },
      { id: 'id_edad', texto: 'Edad y fecha de nacimiento' },
      { id: 'id_sexo', texto: 'Sexo biológico' },
      { id: 'id_direccion', texto: 'Dirección de residencia y teléfono' },
      { id: 'id_aseguradora', texto: 'Aseguradora y tipo de afiliación' },
    ],
    norma: 'Res. 1995/1999 Art. 5',
  },
  {
    id: 'anamnesis',
    titulo: '2. Anamnesis y Motivo de Consulta',
    descripcion: 'Evaluar la calidad de la historia clínica inicial',
    criterios: [
      { id: 'anam_motivo', texto: 'Motivo de consulta claramente documentado' },
      { id: 'anam_enfermedad', texto: 'Enfermedad actual descrita cronológicamente' },
      { id: 'anam_antecedentes', texto: 'Antecedentes personales completos' },
      { id: 'anam_familiares', texto: 'Antecedentes familiares registrados' },
      { id: 'anam_alergias', texto: 'Alergias medicamentosas documentadas' },
      { id: 'anam_habitos', texto: 'Hábitos (tabaco, alcohol, drogas)' },
    ],
    norma: 'Res. 1995/1999 Art. 6',
  },
  {
    id: 'examen_fisico',
    titulo: '3. Examen Físico',
    descripcion: 'Verificar completitud del examen físico',
    criterios: [
      { id: 'ef_signos', texto: 'Signos vitales registrados (PA, FC, FR, T°, Sat)' },
      { id: 'ef_general', texto: 'Examen físico general documentado' },
      { id: 'ef_sistemas', texto: 'Revisión por sistemas realizada' },
      { id: 'ef_pertinente', texto: 'Examen físico pertinente al motivo de consulta' },
      { id: 'ef_completo', texto: 'Examen completo y coherente con la patología' },
    ],
    norma: 'Res. 1995/1999 Art. 7',
  },
  {
    id: 'diagnostico',
    titulo: '4. Impresión Diagnóstica',
    descripcion: 'Evaluar diagnósticos y codificación',
    criterios: [
      { id: 'dx_principal', texto: 'Diagnóstico principal claramente establecido' },
      { id: 'dx_cie10', texto: 'Codificación CIE-10 correcta' },
      { id: 'dx_diferenciales', texto: 'Diagnósticos diferenciales si aplica' },
      { id: 'dx_coherente', texto: 'Coherencia entre anamnesis, examen y diagnóstico' },
    ],
    norma: 'Res. 1995/1999 Art. 8',
  },
  {
    id: 'plan_manejo',
    titulo: '5. Plan de Manejo',
    descripcion: 'Verificar plan terapéutico y seguimiento',
    criterios: [
      { id: 'plan_tratamiento', texto: 'Tratamiento farmacológico completo (dosis, vía, frecuencia)' },
      { id: 'plan_procedimientos', texto: 'Procedimientos ordenados si corresponde' },
      { id: 'plan_examenes', texto: 'Exámenes paraclínicos solicitados y justificados' },
      { id: 'plan_interconsulta', texto: 'Interconsultas a especialidades si aplica' },
      { id: 'plan_educacion', texto: 'Educación al paciente documentada' },
      { id: 'plan_seguimiento', texto: 'Plan de seguimiento establecido' },
    ],
    norma: 'Res. 1995/1999 Art. 9',
  },
  {
    id: 'evoluciones',
    titulo: '6. Notas de Evolución',
    descripcion: 'Evaluar calidad de las evoluciones médicas',
    criterios: [
      { id: 'evol_diarias', texto: 'Evoluciones diarias en hospitalización' },
      { id: 'evol_soap', texto: 'Estructura SOAP o equivalente' },
      { id: 'evol_cambios', texto: 'Cambios en el estado del paciente documentados' },
      { id: 'evol_conducta', texto: 'Conducta terapéutica actualizada' },
      { id: 'evol_fecha', texto: 'Fecha y hora de cada evolución' },
    ],
    norma: 'Res. 1995/1999 Art. 10',
  },
  {
    id: 'ordenes',
    titulo: '7. Órdenes Médicas',
    descripcion: 'Verificar órdenes y prescripciones',
    criterios: [
      { id: 'ord_legibles', texto: 'Órdenes legibles y completas' },
      { id: 'ord_medicamentos', texto: 'Medicamentos con dosis, vía y frecuencia' },
      { id: 'ord_firma', texto: 'Todas las órdenes firmadas por médico' },
      { id: 'ord_administracion', texto: 'Registro de administración de medicamentos' },
    ],
    norma: 'Res. 1995/1999 Art. 11',
  },
  {
    id: 'consentimientos',
    titulo: '8. Consentimientos Informados',
    descripcion: 'Verificar consentimientos según procedimientos',
    criterios: [
      { id: 'cons_requeridos', texto: 'Consentimientos requeridos presentes' },
      { id: 'cons_firmados', texto: 'Firma del paciente o representante legal' },
      { id: 'cons_riesgos', texto: 'Riesgos explicados y documentados' },
      { id: 'cons_testigos', texto: 'Testigos cuando sea necesario' },
    ],
    norma: 'Ley 23/1981 Art. 15',
  },
  {
    id: 'calidad_formal',
    titulo: '9. Calidad Formal',
    descripcion: 'Aspectos formales de la HC',
    criterios: [
      { id: 'cf_legible', texto: 'HC legible (letra clara o digital)' },
      { id: 'cf_tinta', texto: 'Uso de tinta indeleble si es física' },
      { id: 'cf_firmas', texto: 'Firma y sello en cada entrada' },
      { id: 'cf_registro', texto: 'Registro médico del profesional' },
      { id: 'cf_correcciones', texto: 'Correcciones adecuadas (sin tachones)' },
      { id: 'cf_secuencial', texto: 'Orden cronológico de las entradas' },
    ],
    norma: 'Res. 1995/1999 Art. 12',
  },
  {
    id: 'oportunidad',
    titulo: '10. Oportunidad',
    descripcion: 'Tiempos de diligenciamiento',
    criterios: [
      { id: 'op_urgencias', texto: 'HC de urgencias completada < 30 minutos' },
      { id: 'op_consulta', texto: 'HC de consulta externa en el momento' },
      { id: 'op_hospitalizacion', texto: 'HC de ingreso < 24 horas' },
      { id: 'op_cirugia', texto: 'Descripción quirúrgica < 24 horas post-cirugía' },
      { id: 'op_epicrisis', texto: 'Epicrisis al momento del egreso' },
    ],
    norma: 'Res. 1995/1999 Art. 13',
  },
];

export default function ChecklistAuditoriaHC({ onGenerateHallazgos }) {
  const [resultados, setResultados] = useState({});
  const [observaciones, setObservaciones] = useState({});
  const [expandedAll, setExpandedAll] = useState(false);

  const handleCheckChange = (seccionId, criterioId, checked) => {
    setResultados({
      ...resultados,
      [`${seccionId}_${criterioId}`]: checked,
    });
  };

  const handleObservacionChange = (seccionId, value) => {
    setObservaciones({
      ...observaciones,
      [seccionId]: value,
    });
  };

  const calcularEstadisticas = () => {
    const totalCriterios = CHECKLIST_ITEMS.reduce(
      (sum, seccion) => sum + seccion.criterios.length,
      0
    );
    const cumplidos = Object.values(resultados).filter((v) => v === true).length;
    const noCumplidos = Object.values(resultados).filter((v) => v === false).length;
    const porcentajeCumplimiento =
      totalCriterios > 0 ? ((cumplidos / totalCriterios) * 100).toFixed(1) : 0;

    return {
      totalCriterios,
      cumplidos,
      noCumplidos,
      pendientes: totalCriterios - cumplidos - noCumplidos,
      porcentajeCumplimiento,
    };
  };

  const generarHallazgos = () => {
    const hallazgos = [];

    CHECKLIST_ITEMS.forEach((seccion) => {
      const criteriosNoCumplidos = seccion.criterios.filter((criterio) => {
        const key = `${seccion.id}_${criterio.id}`;
        return resultados[key] === false;
      });

      if (criteriosNoCumplidos.length > 0) {
        const descripcion = `Se encontraron ${criteriosNoCumplidos.length} criterios no cumplidos en ${seccion.titulo}:\n${criteriosNoCumplidos.map((c) => `- ${c.texto}`).join('\n')}`;

        hallazgos.push({
          tipo:
            criteriosNoCumplidos.length > seccion.criterios.length / 2
              ? 'NO_CONFORMIDAD_MAYOR'
              : 'NO_CONFORMIDAD_MENOR',
          severidad:
            seccion.id === 'identificacion' ||
            seccion.id === 'diagnostico' ||
            seccion.id === 'consentimientos'
              ? 'MAYOR'
              : 'MENOR',
          criterio: seccion.norma,
          descripcion,
          evidencia: observaciones[seccion.id] || '',
        });
      }
    });

    // Generar hallazgo de cumplimiento global si es < 90%
    const stats = calcularEstadisticas();
    if (parseFloat(stats.porcentajeCumplimiento) < 90) {
      hallazgos.push({
        tipo: 'OPORTUNIDAD_MEJORA',
        severidad: 'MAYOR',
        criterio: 'Cumplimiento global de calidad HC',
        descripcion: `El cumplimiento global de la auditoría es del ${stats.porcentajeCumplimiento}%, por debajo del estándar esperado del 90%.`,
        evidencia: `Total criterios: ${stats.totalCriterios}. Cumplidos: ${stats.cumplidos}. No cumplidos: ${stats.noCumplidos}.`,
      });
    }

    if (onGenerateHallazgos) {
      onGenerateHallazgos(hallazgos);
    }

    return hallazgos;
  };

  const exportarChecklist = () => {
    const stats = calcularEstadisticas();
    let contenido = '=== CHECKLIST DE AUDITORÍA DE HISTORIA CLÍNICA ===\n\n';
    contenido += `Fecha: ${new Date().toLocaleDateString('es-CO')}\n`;
    contenido += `Cumplimiento: ${stats.porcentajeCumplimiento}%\n`;
    contenido += `Criterios cumplidos: ${stats.cumplidos}/${stats.totalCriterios}\n\n`;

    CHECKLIST_ITEMS.forEach((seccion) => {
      contenido += `\n${seccion.titulo}\n`;
      contenido += `Norma: ${seccion.norma}\n`;
      contenido += `${'-'.repeat(50)}\n`;

      seccion.criterios.forEach((criterio) => {
        const key = `${seccion.id}_${criterio.id}`;
        const estado = resultados[key] === true ? '✓' : resultados[key] === false ? '✗' : '○';
        contenido += `${estado} ${criterio.texto}\n`;
      });

      if (observaciones[seccion.id]) {
        contenido += `\nObservaciones: ${observaciones[seccion.id]}\n`;
      }
    });

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `checklist-auditoria-hc-${new Date().getTime()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = calcularEstadisticas();

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Checklist de Auditoría HC</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpandedAll(!expandedAll)}
              >
                {expandedAll ? 'Colapsar Todo' : 'Expandir Todo'}
              </Button>
              <Button size="sm" variant="outline" onClick={exportarChecklist}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Criterios</p>
              <p className="text-2xl font-bold">{stats.totalCriterios}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Cumplidos</p>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{stats.cumplidos}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">No Cumplidos</p>
              <div className="flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{stats.noCumplidos}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Pendientes</p>
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5 text-gray-400" />
                <p className="text-2xl font-bold text-gray-600">{stats.pendientes}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">% Cumplimiento</p>
              <p
                className={`text-2xl font-bold ${
                  parseFloat(stats.porcentajeCumplimiento) >= 90
                    ? 'text-green-600'
                    : parseFloat(stats.porcentajeCumplimiento) >= 70
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {stats.porcentajeCumplimiento}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Criterios de Evaluación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={expandedAll ? CHECKLIST_ITEMS.map((s) => s.id) : []}>
            {CHECKLIST_ITEMS.map((seccion) => {
              const criteriosSeccion = seccion.criterios.length;
              const cumplidosSeccion = seccion.criterios.filter((criterio) => {
                const key = `${seccion.id}_${criterio.id}`;
                return resultados[key] === true;
              }).length;
              const porcentajeSeccion =
                criteriosSeccion > 0
                  ? ((cumplidosSeccion / criteriosSeccion) * 100).toFixed(0)
                  : 0;

              return (
                <AccordionItem key={seccion.id} value={seccion.id}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full pr-4">
                      <span>{seccion.titulo}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {cumplidosSeccion}/{criteriosSeccion}
                        </Badge>
                        <Badge
                          className={
                            parseFloat(porcentajeSeccion) >= 90
                              ? 'bg-green-100 text-green-800'
                              : parseFloat(porcentajeSeccion) >= 70
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }
                        >
                          {porcentajeSeccion}%
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>Descripción:</strong> {seccion.descripcion}
                        </p>
                        <p className="text-sm text-blue-900 mt-1">
                          <strong>Norma:</strong> {seccion.norma}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {seccion.criterios.map((criterio) => {
                          const key = `${seccion.id}_${criterio.id}`;
                          const checked = resultados[key];

                          return (
                            <div
                              key={criterio.id}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <Checkbox
                                    id={`${key}_si`}
                                    checked={checked === true}
                                    onCheckedChange={(c) =>
                                      handleCheckChange(seccion.id, criterio.id, c ? true : null)
                                    }
                                  />
                                  <Label
                                    htmlFor={`${key}_si`}
                                    className="text-xs text-green-600 cursor-pointer"
                                  >
                                    Sí
                                  </Label>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Checkbox
                                    id={`${key}_no`}
                                    checked={checked === false}
                                    onCheckedChange={(c) =>
                                      handleCheckChange(seccion.id, criterio.id, c ? false : null)
                                    }
                                  />
                                  <Label
                                    htmlFor={`${key}_no`}
                                    className="text-xs text-red-600 cursor-pointer"
                                  >
                                    No
                                  </Label>
                                </div>
                              </div>
                              <Label className="text-sm flex-1 cursor-pointer">
                                {criterio.texto}
                              </Label>
                            </div>
                          );
                        })}
                      </div>

                      <div>
                        <Label htmlFor={`obs_${seccion.id}`} className="text-sm">
                          Observaciones de la sección
                        </Label>
                        <Textarea
                          id={`obs_${seccion.id}`}
                          value={observaciones[seccion.id] || ''}
                          onChange={(e) => handleObservacionChange(seccion.id, e.target.value)}
                          placeholder="Registre observaciones adicionales sobre esta sección..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={exportarChecklist}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Checklist
        </Button>
        <Button
          onClick={generarHallazgos}
          disabled={stats.noCumplidos === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="h-4 w-4 mr-2" />
          Generar Hallazgos ({stats.noCumplidos})
        </Button>
      </div>
    </div>
  );
}
