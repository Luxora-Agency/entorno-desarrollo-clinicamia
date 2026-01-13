'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Activity,
  Scale,
  Ruler,
  X,
  RefreshCw
} from 'lucide-react';

// Datos de referencia OMS para peso y talla esperados por edad (percentil 50)
const REFERENCIA_OMS = {
  masculino: {
    // edad en meses: { pesoEsperado (kg), tallaEsperada (cm) }
    0: { peso: 3.3, talla: 49.9 },
    1: { peso: 4.5, talla: 54.7 },
    2: { peso: 5.6, talla: 58.4 },
    3: { peso: 6.4, talla: 61.4 },
    6: { peso: 7.9, talla: 67.6 },
    9: { peso: 9.0, talla: 72.0 },
    12: { peso: 9.6, talla: 75.7 },
    18: { peso: 10.9, talla: 82.3 },
    24: { peso: 12.2, talla: 87.8 },
    36: { peso: 14.3, talla: 96.1 },
    48: { peso: 16.3, talla: 103.3 },
    60: { peso: 18.3, talla: 110.0 },
    72: { peso: 20.5, talla: 116.0 },
    84: { peso: 22.9, talla: 121.7 },
    96: { peso: 25.6, talla: 127.3 },
    108: { peso: 28.6, talla: 132.6 },
    120: { peso: 31.9, talla: 137.8 },
    132: { peso: 35.6, talla: 143.0 },
    144: { peso: 39.9, talla: 149.1 },
    156: { peso: 45.0, talla: 156.0 },
    168: { peso: 50.8, talla: 163.2 },
    180: { peso: 56.7, talla: 169.8 },
    192: { peso: 61.5, talla: 174.0 },
    204: { peso: 64.4, talla: 176.1 },
    216: { peso: 66.3, talla: 177.0 },
  },
  femenino: {
    0: { peso: 3.2, talla: 49.1 },
    1: { peso: 4.2, talla: 53.7 },
    2: { peso: 5.1, talla: 57.1 },
    3: { peso: 5.8, talla: 59.8 },
    6: { peso: 7.3, talla: 65.7 },
    9: { peso: 8.2, talla: 70.1 },
    12: { peso: 8.9, talla: 74.0 },
    18: { peso: 10.2, talla: 80.7 },
    24: { peso: 11.5, talla: 86.4 },
    36: { peso: 13.9, talla: 95.1 },
    48: { peso: 16.1, talla: 102.7 },
    60: { peso: 18.2, talla: 109.4 },
    72: { peso: 20.2, talla: 115.1 },
    84: { peso: 22.4, talla: 120.8 },
    96: { peso: 25.0, talla: 126.6 },
    108: { peso: 28.2, talla: 132.5 },
    120: { peso: 32.0, talla: 138.6 },
    132: { peso: 36.9, talla: 145.0 },
    144: { peso: 42.1, talla: 151.2 },
    156: { peso: 47.0, talla: 156.4 },
    168: { peso: 50.6, talla: 159.8 },
    180: { peso: 52.5, talla: 161.3 },
    192: { peso: 53.5, talla: 162.0 },
    204: { peso: 54.0, talla: 162.5 },
    216: { peso: 54.5, talla: 163.0 },
  }
};

// Peso esperado para la talla (aproximación OMS)
const PESO_PARA_TALLA = {
  masculino: {
    50: 3.3, 55: 4.5, 60: 5.9, 65: 7.4, 70: 8.6, 75: 9.6, 80: 10.4,
    85: 11.2, 90: 12.2, 95: 13.4, 100: 14.8, 105: 16.4, 110: 18.3,
    115: 20.3, 120: 22.6
  },
  femenino: {
    50: 3.2, 55: 4.4, 60: 5.7, 65: 7.2, 70: 8.4, 75: 9.4, 80: 10.2,
    85: 11.0, 90: 12.0, 95: 13.2, 100: 14.6, 105: 16.2, 110: 18.0,
    115: 20.0, 120: 22.4
  }
};

// Función para interpolar valores de referencia
const interpolar = (datos, edadMeses) => {
  const edades = Object.keys(datos).map(Number).sort((a, b) => a - b);

  if (edadMeses <= edades[0]) return datos[edades[0]];
  if (edadMeses >= edades[edades.length - 1]) return datos[edades[edades.length - 1]];

  for (let i = 0; i < edades.length - 1; i++) {
    if (edadMeses >= edades[i] && edadMeses <= edades[i + 1]) {
      const ratio = (edadMeses - edades[i]) / (edades[i + 1] - edades[i]);
      return {
        peso: datos[edades[i]].peso + ratio * (datos[edades[i + 1]].peso - datos[edades[i]].peso),
        talla: datos[edades[i]].talla + ratio * (datos[edades[i + 1]].talla - datos[edades[i]].talla)
      };
    }
  }
  return datos[edades[0]];
};

// Función para obtener peso esperado para talla
const getPesoParaTalla = (talla, genero) => {
  const datos = PESO_PARA_TALLA[genero] || PESO_PARA_TALLA.masculino;
  const tallas = Object.keys(datos).map(Number).sort((a, b) => a - b);

  if (talla <= tallas[0]) return datos[tallas[0]];
  if (talla >= tallas[tallas.length - 1]) return datos[tallas[tallas.length - 1]];

  for (let i = 0; i < tallas.length - 1; i++) {
    if (talla >= tallas[i] && talla <= tallas[i + 1]) {
      const ratio = (talla - tallas[i]) / (tallas[i + 1] - tallas[i]);
      return datos[tallas[i]] + ratio * (datos[tallas[i + 1]] - datos[tallas[i]]);
    }
  }
  return datos[tallas[0]];
};

// Componente de barra de progreso visual
const ProgressBar = ({ value, ranges, unit = '%' }) => {
  const getColor = () => {
    for (const range of ranges) {
      if (value >= range.min && value < range.max) {
        return range.color;
      }
    }
    return 'bg-gray-400';
  };

  const getPosition = () => {
    const min = ranges[ranges.length - 1]?.min || 0;
    const max = ranges[0]?.max || 100;
    const pos = ((value - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, pos));
  };

  return (
    <div className="relative mt-2">
      <div className="h-3 rounded-full overflow-hidden flex">
        {ranges.slice().reverse().map((range, idx) => (
          <div
            key={idx}
            className={`h-full ${range.color}`}
            style={{ width: `${100 / ranges.length}%` }}
          />
        ))}
      </div>
      <div
        className="absolute top-0 w-1 h-5 bg-gray-900 rounded -mt-1"
        style={{ left: `${getPosition()}%`, transform: 'translateX(-50%)' }}
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        {ranges.slice().reverse().map((range, idx) => (
          <span key={idx}>{range.label}</span>
        ))}
      </div>
    </div>
  );
};

// Componente de resultado de índice
const IndiceResult = ({ titulo, valor, unidad, clasificacion, color, descripcion, ranges }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  const iconByColor = {
    green: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    yellow: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    orange: <AlertTriangle className="h-5 w-5 text-orange-600" />,
    red: <AlertTriangle className="h-5 w-5 text-red-600" />,
    blue: <Info className="h-5 w-5 text-blue-600" />,
  };

  return (
    <Card className={`border-2 ${colorClasses[color] || colorClasses.blue}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{titulo}</h4>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold">{valor?.toFixed(2) || '--'}</span>
              <span className="text-sm text-gray-600">{unidad}</span>
            </div>
            <Badge className={`mt-2 ${colorClasses[color]}`}>
              {clasificacion}
            </Badge>
          </div>
          <div className="ml-2">{iconByColor[color]}</div>
        </div>
        {descripcion && (
          <p className="text-xs text-gray-600 mt-2">{descripcion}</p>
        )}
        {ranges && valor && (
          <ProgressBar value={valor} ranges={ranges} />
        )}
      </CardContent>
    </Card>
  );
};

// Componente principal
export default function IndicesNutricionales({
  pacienteData = null,
  onClose = null,
  isModal = false
}) {
  const [datos, setDatos] = useState({
    peso: pacienteData?.peso || '',
    talla: pacienteData?.talla || '',
    edadAnios: pacienteData?.edadAnios || '',
    edadMeses: pacienteData?.edadMeses || '',
    genero: pacienteData?.genero || 'masculino',
    perimetroCefalico: pacienteData?.perimetroCefalico || '',
    perimetroBraquial: pacienteData?.perimetroBraquial || '',
    circunferenciaCintura: pacienteData?.circunferenciaCintura || '',
  });

  const [resultados, setResultados] = useState(null);
  const [activeTab, setActiveTab] = useState('formulario');

  // Actualizar datos si cambia pacienteData
  useEffect(() => {
    if (pacienteData) {
      setDatos(prev => ({
        ...prev,
        peso: pacienteData.peso || prev.peso,
        talla: pacienteData.talla || prev.talla,
        edadAnios: pacienteData.edadAnios || prev.edadAnios,
        edadMeses: pacienteData.edadMeses || prev.edadMeses,
        genero: pacienteData.genero || prev.genero,
        perimetroCefalico: pacienteData.perimetroCefalico || prev.perimetroCefalico,
        perimetroBraquial: pacienteData.perimetroBraquial || prev.perimetroBraquial,
        circunferenciaCintura: pacienteData.circunferenciaCintura || prev.circunferenciaCintura,
      }));
    }
  }, [pacienteData]);

  const handleChange = (campo, valor) => {
    setDatos(prev => ({ ...prev, [campo]: valor }));
  };

  const calcularIndices = () => {
    const peso = parseFloat(datos.peso);
    const talla = parseFloat(datos.talla);
    const edadMeses = (parseInt(datos.edadAnios) || 0) * 12 + (parseInt(datos.edadMeses) || 0);
    const perimetroCefalico = parseFloat(datos.perimetroCefalico);
    const perimetroBraquial = parseFloat(datos.perimetroBraquial);
    const circunferenciaCintura = parseFloat(datos.circunferenciaCintura);
    const genero = datos.genero === 'Masculino' || datos.genero === 'masculino' || datos.genero === 'M'
      ? 'masculino' : 'femenino';

    const refOMS = REFERENCIA_OMS[genero];
    const datosReferencia = interpolar(refOMS, edadMeses);
    const pesoEsperadoEdad = datosReferencia.peso;
    const tallaEsperadaEdad = datosReferencia.talla;
    const pesoEsperadoTalla = getPesoParaTalla(talla, genero);

    const indices = {};

    // 1. Índice de Waterlow (Peso) = (Peso actual / Peso esperado para la edad) × 100
    if (peso && pesoEsperadoEdad) {
      const waterlowPeso = (peso / pesoEsperadoEdad) * 100;
      let clasificacion, color;
      if (waterlowPeso > 90) { clasificacion = 'Normal'; color = 'green'; }
      else if (waterlowPeso >= 80) { clasificacion = 'Desnutrición leve'; color = 'yellow'; }
      else if (waterlowPeso >= 70) { clasificacion = 'Desnutrición moderada'; color = 'orange'; }
      else { clasificacion = 'Desnutrición severa'; color = 'red'; }

      indices.waterlowPeso = {
        valor: waterlowPeso,
        unidad: '%',
        clasificacion,
        color,
        descripcion: `Peso actual (${peso}kg) vs esperado para edad (${pesoEsperadoEdad.toFixed(1)}kg)`,
        ranges: [
          { min: 90, max: 150, color: 'bg-green-400', label: '>90%' },
          { min: 80, max: 90, color: 'bg-yellow-400', label: '80-90%' },
          { min: 70, max: 80, color: 'bg-orange-400', label: '70-80%' },
          { min: 0, max: 70, color: 'bg-red-400', label: '<70%' },
        ]
      };
    }

    // 2. Índice de Waterlow (Talla) = (Talla actual / Talla esperada para la edad) × 100
    if (talla && tallaEsperadaEdad) {
      const waterlowTalla = (talla / tallaEsperadaEdad) * 100;
      let clasificacion, color;
      if (waterlowTalla > 95) { clasificacion = 'Normal'; color = 'green'; }
      else if (waterlowTalla >= 90) { clasificacion = 'Desnutrición crónica leve'; color = 'yellow'; }
      else if (waterlowTalla >= 85) { clasificacion = 'Desnutrición crónica moderada'; color = 'orange'; }
      else { clasificacion = 'Desnutrición crónica severa'; color = 'red'; }

      indices.waterlowTalla = {
        valor: waterlowTalla,
        unidad: '%',
        clasificacion,
        color,
        descripcion: `Talla actual (${talla}cm) vs esperada para edad (${tallaEsperadaEdad.toFixed(1)}cm)`,
        ranges: [
          { min: 95, max: 120, color: 'bg-green-400', label: '>95%' },
          { min: 90, max: 95, color: 'bg-yellow-400', label: '90-95%' },
          { min: 85, max: 90, color: 'bg-orange-400', label: '85-90%' },
          { min: 0, max: 85, color: 'bg-red-400', label: '<85%' },
        ]
      };
    }

    // 3. Índice Nutricional de Shukla = (Peso actual / Peso esperado para la talla) × 100
    if (peso && pesoEsperadoTalla) {
      const shukla = (peso / pesoEsperadoTalla) * 100;
      let clasificacion, color;
      if (shukla > 90) { clasificacion = 'Normal'; color = 'green'; }
      else if (shukla >= 75) { clasificacion = 'Desnutrición Grado I'; color = 'yellow'; }
      else if (shukla >= 60) { clasificacion = 'Desnutrición Grado II'; color = 'orange'; }
      else { clasificacion = 'Desnutrición Grado III'; color = 'red'; }

      indices.shukla = {
        valor: shukla,
        unidad: '%',
        clasificacion,
        color,
        descripcion: `Peso actual (${peso}kg) vs esperado para talla (${pesoEsperadoTalla.toFixed(1)}kg)`,
        ranges: [
          { min: 90, max: 150, color: 'bg-green-400', label: '>90%' },
          { min: 75, max: 90, color: 'bg-yellow-400', label: '75-90%' },
          { min: 60, max: 75, color: 'bg-orange-400', label: '60-75%' },
          { min: 0, max: 60, color: 'bg-red-400', label: '<60%' },
        ]
      };
    }

    // 4. Índice de Kanawati-McLaren = Perímetro braquial / Perímetro cefálico
    if (perimetroBraquial && perimetroCefalico) {
      const kanawati = perimetroBraquial / perimetroCefalico;
      let clasificacion, color;
      if (kanawati > 0.31) { clasificacion = 'Normal'; color = 'green'; }
      else if (kanawati >= 0.28) { clasificacion = 'Desnutrición leve'; color = 'yellow'; }
      else if (kanawati >= 0.25) { clasificacion = 'Desnutrición moderada'; color = 'orange'; }
      else { clasificacion = 'Desnutrición severa'; color = 'red'; }

      indices.kanawati = {
        valor: kanawati,
        unidad: '',
        clasificacion,
        color,
        descripcion: `PB (${perimetroBraquial}cm) / PC (${perimetroCefalico}cm)`,
        ranges: [
          { min: 0.31, max: 0.5, color: 'bg-green-400', label: '>0.31' },
          { min: 0.28, max: 0.31, color: 'bg-yellow-400', label: '0.28-0.31' },
          { min: 0.25, max: 0.28, color: 'bg-orange-400', label: '0.25-0.28' },
          { min: 0, max: 0.25, color: 'bg-red-400', label: '<0.25' },
        ]
      };
    }

    // 5. Relación Peso/Talla (P/T)
    if (peso && talla) {
      const pesoTalla = (peso / talla) * 100;
      // Interpretación según edad pediátrica
      let clasificacion, color;
      const zScore = pesoEsperadoTalla ? ((peso - pesoEsperadoTalla) / pesoEsperadoTalla) * 100 : 0;
      if (zScore > 10) { clasificacion = 'Sobrepeso'; color = 'yellow'; }
      else if (zScore >= -10) { clasificacion = 'Normal'; color = 'green'; }
      else if (zScore >= -20) { clasificacion = 'Bajo peso'; color = 'orange'; }
      else { clasificacion = 'Muy bajo peso'; color = 'red'; }

      indices.pesoTalla = {
        valor: pesoTalla,
        unidad: 'g/cm',
        clasificacion,
        color,
        descripcion: `Relación peso/talla: ${peso}kg / ${talla}cm`,
        ranges: [
          { min: 20, max: 100, color: 'bg-yellow-400', label: 'Alto' },
          { min: 15, max: 20, color: 'bg-green-400', label: 'Normal' },
          { min: 10, max: 15, color: 'bg-orange-400', label: 'Bajo' },
          { min: 0, max: 10, color: 'bg-red-400', label: 'Muy bajo' },
        ]
      };
    }

    // 6. Índice de Masa Triponderal (IMT) = Peso / Talla³
    if (peso && talla) {
      const tallaM = talla / 100;
      const imt = peso / (tallaM * tallaM * tallaM);
      let clasificacion, color;
      // Rangos para adolescentes (10-18 años)
      if (edadMeses >= 120) {
        if (imt >= 11 && imt <= 13) { clasificacion = 'Normal'; color = 'green'; }
        else if (imt > 13 && imt <= 14) { clasificacion = 'Sobrepeso'; color = 'yellow'; }
        else if (imt > 14) { clasificacion = 'Obesidad'; color = 'orange'; }
        else { clasificacion = 'Bajo peso'; color = 'red'; }
      } else {
        // Para niños menores
        if (imt >= 10 && imt <= 14) { clasificacion = 'Normal'; color = 'green'; }
        else if (imt > 14) { clasificacion = 'Alto'; color = 'yellow'; }
        else { clasificacion = 'Bajo'; color = 'orange'; }
      }

      indices.imt = {
        valor: imt,
        unidad: 'kg/m³',
        clasificacion,
        color,
        descripcion: `IMT = ${peso}kg / (${tallaM.toFixed(2)}m)³ - Mejor predictor de grasa corporal en adolescentes`,
        ranges: [
          { min: 14, max: 20, color: 'bg-orange-400', label: '>14' },
          { min: 11, max: 14, color: 'bg-green-400', label: '11-14' },
          { min: 0, max: 11, color: 'bg-red-400', label: '<11' },
        ]
      };
    }

    // 7. Índice Cintura/Altura (ICT)
    if (circunferenciaCintura && talla) {
      const ict = circunferenciaCintura / talla;
      let clasificacion, color;
      if (ict < 0.4) { clasificacion = 'Bajo (delgadez)'; color = 'yellow'; }
      else if (ict < 0.5) { clasificacion = 'Normal'; color = 'green'; }
      else if (ict < 0.6) { clasificacion = 'Riesgo aumentado'; color = 'orange'; }
      else { clasificacion = 'Riesgo alto'; color = 'red'; }

      indices.ict = {
        valor: ict,
        unidad: '',
        clasificacion,
        color,
        descripcion: `Cintura (${circunferenciaCintura}cm) / Talla (${talla}cm) - Predictor de riesgo cardiovascular`,
        ranges: [
          { min: 0.6, max: 1, color: 'bg-red-400', label: '>0.6' },
          { min: 0.5, max: 0.6, color: 'bg-orange-400', label: '0.5-0.6' },
          { min: 0.4, max: 0.5, color: 'bg-green-400', label: '0.4-0.5' },
          { min: 0, max: 0.4, color: 'bg-yellow-400', label: '<0.4' },
        ]
      };
    }

    // IMC tradicional para referencia
    if (peso && talla) {
      const tallaM = talla / 100;
      const imc = peso / (tallaM * tallaM);
      let clasificacion, color;

      // Para niños usar percentiles, para adultos usar valores fijos
      if (edadMeses >= 228) { // >= 19 años
        if (imc < 18.5) { clasificacion = 'Bajo peso'; color = 'yellow'; }
        else if (imc < 25) { clasificacion = 'Normal'; color = 'green'; }
        else if (imc < 30) { clasificacion = 'Sobrepeso'; color = 'orange'; }
        else { clasificacion = 'Obesidad'; color = 'red'; }
      } else {
        // Para niños (referencia simplificada)
        if (imc < 14) { clasificacion = 'Bajo peso'; color = 'yellow'; }
        else if (imc < 18) { clasificacion = 'Normal'; color = 'green'; }
        else if (imc < 22) { clasificacion = 'Sobrepeso'; color = 'orange'; }
        else { clasificacion = 'Obesidad'; color = 'red'; }
      }

      indices.imc = {
        valor: imc,
        unidad: 'kg/m²',
        clasificacion,
        color,
        descripcion: `IMC = ${peso}kg / (${tallaM.toFixed(2)}m)²`,
        ranges: [
          { min: 30, max: 50, color: 'bg-red-400', label: '>30' },
          { min: 25, max: 30, color: 'bg-orange-400', label: '25-30' },
          { min: 18.5, max: 25, color: 'bg-green-400', label: '18.5-25' },
          { min: 0, max: 18.5, color: 'bg-yellow-400', label: '<18.5' },
        ]
      };
    }

    setResultados(indices);
    setActiveTab('resultados');
  };

  const limpiarFormulario = () => {
    setDatos({
      peso: '',
      talla: '',
      edadAnios: '',
      edadMeses: '',
      genero: 'masculino',
      perimetroCefalico: '',
      perimetroBraquial: '',
      circunferenciaCintura: '',
    });
    setResultados(null);
    setActiveTab('formulario');
  };

  const containerClass = isModal
    ? "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    : "";

  const content = (
    <Card className={isModal ? "w-full max-w-4xl max-h-[90vh] overflow-hidden" : ""}>
      <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            <CardTitle>Índices Nutricionales</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={limpiarFormulario}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={`p-0 ${isModal ? 'overflow-y-auto max-h-[calc(90vh-80px)]' : ''}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="formulario" className="flex-1">
              <Scale className="h-4 w-4 mr-2" />
              Datos del Paciente
            </TabsTrigger>
            <TabsTrigger value="resultados" className="flex-1" disabled={!resultados}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Resultados
            </TabsTrigger>
            <TabsTrigger value="interpretacion" className="flex-1">
              <Info className="h-4 w-4 mr-2" />
              Interpretación
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formulario" className="p-4 space-y-6">
            {/* Datos básicos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Peso (kg) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={datos.peso}
                  onChange={(e) => handleChange('peso', e.target.value)}
                  placeholder="ej: 25.5"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Talla (cm) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={datos.talla}
                  onChange={(e) => handleChange('talla', e.target.value)}
                  placeholder="ej: 120"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Edad (años)</Label>
                <Input
                  type="number"
                  value={datos.edadAnios}
                  onChange={(e) => handleChange('edadAnios', e.target.value)}
                  placeholder="ej: 5"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Meses adicionales</Label>
                <Input
                  type="number"
                  max="11"
                  value={datos.edadMeses}
                  onChange={(e) => handleChange('edadMeses', e.target.value)}
                  placeholder="0-11"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Género */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Género *</Label>
                <Select value={datos.genero} onValueChange={(v) => handleChange('genero', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Perímetros (opcionales) */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Perímetros (para índices adicionales)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Perímetro Cefálico (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={datos.perimetroCefalico}
                    onChange={(e) => handleChange('perimetroCefalico', e.target.value)}
                    placeholder="ej: 48"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Para índice Kanawati-McLaren</p>
                </div>
                <div>
                  <Label className="text-sm">Perímetro Braquial (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={datos.perimetroBraquial}
                    onChange={(e) => handleChange('perimetroBraquial', e.target.value)}
                    placeholder="ej: 15"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Circunferencia media del brazo</p>
                </div>
                <div>
                  <Label className="text-sm">Circunferencia Cintura (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={datos.circunferenciaCintura}
                    onChange={(e) => handleChange('circunferenciaCintura', e.target.value)}
                    placeholder="ej: 60"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Para índice cintura/altura</p>
                </div>
              </div>
            </div>

            <Button
              onClick={calcularIndices}
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={!datos.peso || !datos.talla}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Índices Nutricionales
            </Button>
          </TabsContent>

          <TabsContent value="resultados" className="p-4">
            {resultados && (
              <div className="space-y-6">
                {/* Resumen visual */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-teal-600" />
                    Resumen del Estado Nutricional
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(resultados).map(([key, data]) => (
                      <Badge
                        key={key}
                        className={`
                          ${data.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                          ${data.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${data.color === 'orange' ? 'bg-orange-100 text-orange-800' : ''}
                          ${data.color === 'red' ? 'bg-red-100 text-red-800' : ''}
                        `}
                      >
                        {data.clasificacion}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Grid de índices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resultados.waterlowPeso && (
                    <IndiceResult
                      titulo="Índice de Waterlow (Peso)"
                      {...resultados.waterlowPeso}
                    />
                  )}
                  {resultados.waterlowTalla && (
                    <IndiceResult
                      titulo="Índice de Waterlow (Talla)"
                      {...resultados.waterlowTalla}
                    />
                  )}
                  {resultados.shukla && (
                    <IndiceResult
                      titulo="Índice Nutricional (Shukla)"
                      {...resultados.shukla}
                    />
                  )}
                  {resultados.kanawati && (
                    <IndiceResult
                      titulo="Índice de Kanawati-McLaren"
                      {...resultados.kanawati}
                    />
                  )}
                  {resultados.pesoTalla && (
                    <IndiceResult
                      titulo="Relación Peso/Talla"
                      {...resultados.pesoTalla}
                    />
                  )}
                  {resultados.imt && (
                    <IndiceResult
                      titulo="Índice de Masa Triponderal"
                      {...resultados.imt}
                    />
                  )}
                  {resultados.ict && (
                    <IndiceResult
                      titulo="Índice Cintura/Altura"
                      {...resultados.ict}
                    />
                  )}
                  {resultados.imc && (
                    <IndiceResult
                      titulo="IMC (Referencia)"
                      {...resultados.imc}
                    />
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="interpretacion" className="p-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Índice de Waterlow (Peso)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p>Evalúa la desnutrición aguda comparando el peso actual con el peso esperado para la edad.</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li><span className="text-green-600 font-medium">&gt;90%:</span> Normal</li>
                    <li><span className="text-yellow-600 font-medium">80-90%:</span> Desnutrición leve</li>
                    <li><span className="text-orange-600 font-medium">70-80%:</span> Desnutrición moderada</li>
                    <li><span className="text-red-600 font-medium">&lt;70%:</span> Desnutrición severa</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Índice de Waterlow (Talla)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p>Evalúa la desnutrición crónica comparando la talla actual con la talla esperada para la edad.</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li><span className="text-green-600 font-medium">&gt;95%:</span> Normal</li>
                    <li><span className="text-yellow-600 font-medium">90-95%:</span> Desnutrición crónica leve</li>
                    <li><span className="text-orange-600 font-medium">85-90%:</span> Desnutrición crónica moderada</li>
                    <li><span className="text-red-600 font-medium">&lt;85%:</span> Desnutrición crónica severa</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Índice Nutricional de Shukla</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p>Compara el peso actual con el peso esperado para la talla, independiente de la edad.</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li><span className="text-green-600 font-medium">&gt;90%:</span> Normal</li>
                    <li><span className="text-yellow-600 font-medium">75-90%:</span> Desnutrición Grado I</li>
                    <li><span className="text-orange-600 font-medium">60-75%:</span> Desnutrición Grado II</li>
                    <li><span className="text-red-600 font-medium">&lt;60%:</span> Desnutrición Grado III</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Índice de Kanawati-McLaren</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p>Relación entre perímetro braquial y cefálico. Útil en menores de 5 años.</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li><span className="text-green-600 font-medium">&gt;0.31:</span> Normal</li>
                    <li><span className="text-yellow-600 font-medium">0.28-0.31:</span> Desnutrición leve</li>
                    <li><span className="text-orange-600 font-medium">0.25-0.28:</span> Desnutrición moderada</li>
                    <li><span className="text-red-600 font-medium">&lt;0.25:</span> Desnutrición severa</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Índice de Masa Triponderal (kg/m³)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p>Peso dividido por el cubo de la talla. Mejor predictor de grasa corporal en adolescentes que el IMC tradicional.</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li><span className="text-green-600 font-medium">11-14 kg/m³:</span> Normal (adolescentes)</li>
                    <li><span className="text-yellow-600 font-medium">&gt;14 kg/m³:</span> Sobrepeso/Obesidad</li>
                    <li><span className="text-red-600 font-medium">&lt;11 kg/m³:</span> Bajo peso</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Índice Cintura/Altura</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p>Predictor de riesgo cardiovascular y metabólico. Aplicable a todas las edades.</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li><span className="text-yellow-600 font-medium">&lt;0.4:</span> Bajo (delgadez)</li>
                    <li><span className="text-green-600 font-medium">0.4-0.5:</span> Normal</li>
                    <li><span className="text-orange-600 font-medium">0.5-0.6:</span> Riesgo aumentado</li>
                    <li><span className="text-red-600 font-medium">&gt;0.6:</span> Riesgo alto</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  if (isModal) {
    return (
      <div className={containerClass} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
        {content}
      </div>
    );
  }

  return content;
}
