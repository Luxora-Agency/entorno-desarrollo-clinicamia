'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Scale, Ruler, Baby, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// Datos de percentiles OMS 2006/2007 simplificados
// Peso para la edad (kg) - Niños (M) y Niñas (F)
const PESO_EDAD_OMS = {
  M: {
    // edad en meses: [P3, P15, P50, P85, P97]
    0: [2.5, 2.9, 3.3, 3.9, 4.4],
    3: [5.0, 5.6, 6.4, 7.2, 7.9],
    6: [6.4, 7.1, 7.9, 8.8, 9.7],
    9: [7.2, 8.0, 8.9, 9.9, 10.9],
    12: [7.8, 8.6, 9.6, 10.8, 11.8],
    18: [8.8, 9.7, 10.9, 12.2, 13.5],
    24: [9.7, 10.8, 12.2, 13.6, 15.1],
    36: [11.3, 12.5, 14.3, 16.2, 18.1],
    48: [12.7, 14.1, 16.3, 18.7, 21.2],
    60: [14.1, 15.8, 18.3, 21.2, 24.4],
    72: [15.5, 17.4, 20.5, 24.0, 27.9],
    84: [17.0, 19.1, 22.9, 27.1, 31.9],
    96: [18.6, 21.1, 25.6, 30.7, 36.5],
    108: [20.4, 23.3, 28.6, 34.7, 41.8],
    120: [22.2, 25.6, 31.9, 39.3, 48.0],
    132: [24.3, 28.2, 35.6, 44.4, 54.9],
    144: [26.8, 31.3, 39.9, 50.2, 62.5],
    156: [29.9, 35.0, 44.9, 56.7, 70.6],
    168: [33.6, 39.4, 50.6, 63.6, 78.8],
    180: [37.8, 44.2, 56.5, 70.3, 86.2],
    192: [42.1, 49.1, 62.3, 76.5, 92.6],
    204: [46.1, 53.5, 67.3, 81.6, 97.5],
    216: [49.7, 57.3, 71.4, 85.6, 101.1],
    228: [52.6, 60.3, 74.4, 88.5, 103.6],
  },
  F: {
    0: [2.4, 2.8, 3.2, 3.7, 4.2],
    3: [4.6, 5.1, 5.8, 6.6, 7.3],
    6: [5.8, 6.4, 7.3, 8.2, 9.1],
    9: [6.6, 7.3, 8.2, 9.3, 10.3],
    12: [7.1, 7.9, 8.9, 10.1, 11.3],
    18: [8.1, 9.0, 10.2, 11.6, 13.0],
    24: [9.0, 10.0, 11.5, 13.1, 14.8],
    36: [10.6, 11.8, 13.9, 16.0, 18.3],
    48: [12.0, 13.5, 16.1, 18.9, 22.0],
    60: [13.5, 15.3, 18.2, 21.8, 25.8],
    72: [15.0, 17.0, 20.5, 24.9, 29.9],
    84: [16.5, 18.9, 23.1, 28.4, 34.5],
    96: [18.3, 21.1, 26.2, 32.5, 40.0],
    108: [20.3, 23.6, 29.7, 37.3, 46.3],
    120: [22.6, 26.5, 33.7, 42.8, 53.5],
    132: [25.5, 30.0, 38.4, 49.1, 61.5],
    144: [29.0, 34.1, 43.8, 56.0, 70.0],
    156: [33.0, 38.7, 49.5, 62.8, 77.8],
    168: [37.1, 43.3, 54.8, 68.8, 84.2],
    180: [40.7, 47.2, 59.2, 73.6, 89.1],
    192: [43.6, 50.2, 62.4, 77.0, 92.4],
    204: [45.8, 52.4, 64.6, 79.2, 94.6],
    216: [47.3, 53.9, 66.0, 80.6, 95.9],
    228: [48.4, 55.0, 67.0, 81.5, 96.7],
  }
};

// Talla/Estatura para la edad (cm)
const TALLA_EDAD_OMS = {
  M: {
    0: [46.3, 48.0, 49.9, 51.8, 53.4],
    3: [57.6, 59.5, 61.4, 63.4, 65.3],
    6: [63.6, 65.7, 67.6, 69.7, 71.6],
    9: [68.0, 70.1, 72.0, 74.2, 76.2],
    12: [71.3, 73.4, 75.7, 78.0, 80.2],
    18: [77.2, 79.5, 82.3, 85.0, 87.5],
    24: [82.1, 84.6, 87.8, 90.9, 93.8],
    36: [89.4, 92.4, 96.1, 99.8, 103.2],
    48: [95.4, 98.9, 103.3, 107.6, 111.5],
    60: [100.7, 104.7, 109.4, 114.2, 118.5],
    72: [106.1, 110.3, 115.5, 120.8, 125.4],
    84: [111.2, 115.7, 121.4, 127.0, 132.0],
    96: [116.0, 120.8, 127.0, 133.1, 138.4],
    108: [120.5, 125.6, 132.2, 138.8, 144.4],
    120: [124.8, 130.2, 137.2, 144.2, 150.2],
    132: [129.2, 134.8, 142.3, 149.7, 156.2],
    144: [133.8, 139.8, 147.6, 155.6, 162.6],
    156: [139.0, 145.4, 153.8, 162.2, 169.6],
    168: [144.8, 151.6, 160.4, 169.2, 176.8],
    180: [150.4, 157.4, 166.4, 175.2, 182.8],
    192: [155.0, 162.0, 171.0, 179.8, 187.2],
    204: [158.4, 165.2, 174.0, 182.8, 190.0],
    216: [160.6, 167.2, 175.8, 184.4, 191.6],
    228: [161.8, 168.4, 176.8, 185.2, 192.4],
  },
  F: {
    0: [45.6, 47.2, 49.1, 51.1, 52.7],
    3: [56.2, 58.0, 59.8, 61.8, 63.5],
    6: [61.8, 63.8, 65.7, 67.8, 69.8],
    9: [66.0, 68.1, 70.1, 72.4, 74.5],
    12: [69.2, 71.4, 74.0, 76.6, 79.0],
    18: [74.8, 77.4, 80.7, 83.9, 86.8],
    24: [79.6, 82.5, 86.4, 90.2, 93.6],
    36: [87.0, 90.4, 95.1, 99.7, 103.8],
    48: [93.4, 97.2, 102.7, 108.0, 112.6],
    60: [99.0, 103.4, 109.4, 115.4, 120.6],
    72: [104.8, 109.6, 115.9, 122.4, 128.0],
    84: [110.2, 115.4, 122.2, 129.0, 135.0],
    96: [115.4, 121.0, 128.3, 135.6, 142.0],
    108: [120.4, 126.4, 134.2, 142.0, 148.8],
    120: [125.4, 131.8, 140.2, 148.6, 155.8],
    132: [130.6, 137.6, 146.6, 155.6, 163.2],
    144: [136.4, 143.8, 153.4, 163.0, 170.8],
    156: [142.2, 149.8, 159.6, 169.4, 177.0],
    168: [146.6, 154.0, 163.6, 173.2, 180.4],
    180: [149.4, 156.6, 165.8, 175.0, 182.0],
    192: [151.0, 157.8, 166.8, 175.6, 182.6],
    204: [151.8, 158.4, 167.2, 176.0, 183.0],
    216: [152.2, 158.8, 167.6, 176.2, 183.2],
    228: [152.4, 159.0, 167.8, 176.4, 183.4],
  }
};

// IMC para la edad (kg/m²) - Para mayores de 2 años
const IMC_EDAD_OMS = {
  M: {
    24: [13.4, 14.2, 15.2, 16.3, 17.3],
    36: [13.1, 13.9, 15.0, 16.2, 17.4],
    48: [12.9, 13.8, 14.9, 16.2, 17.6],
    60: [12.8, 13.7, 14.9, 16.3, 17.9],
    72: [12.8, 13.7, 15.0, 16.5, 18.3],
    84: [12.9, 13.8, 15.2, 16.8, 18.8],
    96: [13.0, 14.0, 15.4, 17.2, 19.4],
    108: [13.2, 14.2, 15.8, 17.8, 20.2],
    120: [13.5, 14.6, 16.2, 18.5, 21.1],
    132: [13.9, 15.0, 16.8, 19.3, 22.2],
    144: [14.4, 15.6, 17.5, 20.2, 23.4],
    156: [15.0, 16.3, 18.4, 21.3, 24.7],
    168: [15.7, 17.1, 19.3, 22.4, 26.0],
    180: [16.5, 17.9, 20.3, 23.5, 27.2],
    192: [17.2, 18.7, 21.2, 24.5, 28.2],
    204: [17.8, 19.4, 22.0, 25.3, 29.0],
    216: [18.4, 20.0, 22.6, 25.9, 29.6],
    228: [18.8, 20.5, 23.1, 26.4, 30.0],
  },
  F: {
    24: [13.2, 14.0, 15.2, 16.5, 17.6],
    36: [12.9, 13.7, 15.0, 16.4, 17.8],
    48: [12.7, 13.6, 14.9, 16.5, 18.1],
    60: [12.6, 13.5, 14.9, 16.6, 18.5],
    72: [12.6, 13.5, 15.0, 16.9, 19.0],
    84: [12.7, 13.7, 15.3, 17.3, 19.6],
    96: [12.9, 13.9, 15.6, 17.8, 20.4],
    108: [13.2, 14.3, 16.1, 18.5, 21.4],
    120: [13.6, 14.8, 16.7, 19.4, 22.5],
    132: [14.1, 15.4, 17.5, 20.4, 23.8],
    144: [14.8, 16.1, 18.4, 21.6, 25.2],
    156: [15.5, 16.9, 19.4, 22.8, 26.6],
    168: [16.2, 17.7, 20.4, 24.0, 27.9],
    180: [16.9, 18.5, 21.3, 25.0, 28.9],
    192: [17.4, 19.1, 22.0, 25.8, 29.7],
    204: [17.9, 19.5, 22.5, 26.3, 30.2],
    216: [18.2, 19.9, 22.8, 26.7, 30.6],
    228: [18.4, 20.1, 23.1, 26.9, 30.8],
  }
};

// Función para interpolar percentiles
const interpolarPercentil = (valor, datos, edadMeses, genero) => {
  const generoKey = genero === 'Femenino' || genero === 'F' ? 'F' : 'M';
  const datosGenero = datos[generoKey];

  if (!datosGenero) return null;

  // Encontrar los dos puntos más cercanos para interpolar
  const edades = Object.keys(datosGenero).map(Number).sort((a, b) => a - b);

  let edadInferior = edades[0];
  let edadSuperior = edades[edades.length - 1];

  for (let i = 0; i < edades.length - 1; i++) {
    if (edadMeses >= edades[i] && edadMeses <= edades[i + 1]) {
      edadInferior = edades[i];
      edadSuperior = edades[i + 1];
      break;
    }
  }

  if (edadMeses <= edades[0]) {
    edadInferior = edadSuperior = edades[0];
  } else if (edadMeses >= edades[edades.length - 1]) {
    edadInferior = edadSuperior = edades[edades.length - 1];
  }

  const percentiles = datosGenero[edadInferior];
  if (!percentiles) return null;

  // P3, P15, P50, P85, P97
  const [p3, p15, p50, p85, p97] = percentiles;

  if (valor < p3) return { percentil: '<3', color: 'text-red-600', bg: 'bg-red-100', estado: 'Muy bajo' };
  if (valor < p15) return { percentil: '3-15', color: 'text-orange-600', bg: 'bg-orange-100', estado: 'Bajo' };
  if (valor < p50) return { percentil: '15-50', color: 'text-yellow-600', bg: 'bg-yellow-100', estado: 'Normal-bajo' };
  if (valor < p85) return { percentil: '50-85', color: 'text-green-600', bg: 'bg-green-100', estado: 'Normal' };
  if (valor < p97) return { percentil: '85-97', color: 'text-yellow-600', bg: 'bg-yellow-100', estado: 'Normal-alto' };
  return { percentil: '>97', color: 'text-red-600', bg: 'bg-red-100', estado: 'Muy alto' };
};

// Función para calcular percentil exacto aproximado
const calcularPercentilExacto = (valor, datos, edadMeses, genero) => {
  const generoKey = genero === 'Femenino' || genero === 'F' ? 'F' : 'M';
  const datosGenero = datos[generoKey];

  if (!datosGenero) return null;

  const edades = Object.keys(datosGenero).map(Number).sort((a, b) => a - b);
  let edadCercana = edades[0];

  for (const edad of edades) {
    if (Math.abs(edad - edadMeses) < Math.abs(edadCercana - edadMeses)) {
      edadCercana = edad;
    }
  }

  const percentiles = datosGenero[edadCercana];
  if (!percentiles) return null;

  const [p3, p15, p50, p85, p97] = percentiles;
  const puntosRef = [
    { p: 3, v: p3 },
    { p: 15, v: p15 },
    { p: 50, v: p50 },
    { p: 85, v: p85 },
    { p: 97, v: p97 }
  ];

  if (valor <= p3) return Math.max(1, Math.round(3 * valor / p3));
  if (valor >= p97) return Math.min(99, Math.round(97 + (valor - p97) / (p97 - p85) * 2));

  for (let i = 0; i < puntosRef.length - 1; i++) {
    if (valor >= puntosRef[i].v && valor <= puntosRef[i + 1].v) {
      const rango = puntosRef[i + 1].v - puntosRef[i].v;
      const posicion = valor - puntosRef[i].v;
      const percentilRango = puntosRef[i + 1].p - puntosRef[i].p;
      return Math.round(puntosRef[i].p + (posicion / rango) * percentilRango);
    }
  }

  return 50;
};

// Componente de gráfica simple de percentiles
const GraficaPercentil = ({ titulo, valor, percentilInfo, percentilExacto, unidad, icon: Icon, datosReferencia, edadMeses, genero }) => {
  const generoKey = genero === 'Femenino' || genero === 'F' ? 'F' : 'M';

  // Obtener valores de referencia para la edad
  const edades = Object.keys(datosReferencia[generoKey] || {}).map(Number).sort((a, b) => a - b);
  let edadCercana = edades[0];
  for (const edad of edades) {
    if (Math.abs(edad - edadMeses) < Math.abs(edadCercana - edadMeses)) {
      edadCercana = edad;
    }
  }
  const refs = datosReferencia[generoKey]?.[edadCercana] || [0, 0, 0, 0, 0];
  const [p3, p15, p50, p85, p97] = refs;

  // Calcular posición del valor en la barra (0-100%)
  const min = p3 * 0.8;
  const max = p97 * 1.2;
  const posicion = Math.min(100, Math.max(0, ((valor - min) / (max - min)) * 100));

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-800">{titulo}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">{valor}</span>
          <span className="text-sm text-gray-500">{unidad}</span>
        </div>
      </div>

      {/* Barra de percentiles */}
      <div className="relative h-8 bg-gradient-to-r from-red-200 via-yellow-200 via-green-200 via-yellow-200 to-red-200 rounded-full overflow-hidden">
        {/* Marcadores de percentiles */}
        <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-gray-600">
          <span>P3</span>
          <span>P15</span>
          <span>P50</span>
          <span>P85</span>
          <span>P97</span>
        </div>
        {/* Indicador del valor actual */}
        <div
          className="absolute top-0 h-full w-1 bg-blue-600 shadow-lg transition-all"
          style={{ left: `${posicion}%` }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
            P{percentilExacto}
          </div>
        </div>
      </div>

      {/* Valores de referencia */}
      <div className="grid grid-cols-5 gap-1 text-xs text-center text-gray-500">
        <span>{p3.toFixed(1)}</span>
        <span>{p15.toFixed(1)}</span>
        <span className="font-semibold">{p50.toFixed(1)}</span>
        <span>{p85.toFixed(1)}</span>
        <span>{p97.toFixed(1)}</span>
      </div>

      {/* Estado */}
      <div className={`flex items-center justify-center gap-2 py-2 rounded-lg ${percentilInfo?.bg || 'bg-gray-100'}`}>
        {percentilInfo?.estado === 'Normal' ? (
          <CheckCircle className={`h-4 w-4 ${percentilInfo?.color}`} />
        ) : (
          <AlertTriangle className={`h-4 w-4 ${percentilInfo?.color}`} />
        )}
        <span className={`font-medium ${percentilInfo?.color}`}>
          {percentilInfo?.estado || 'Sin datos'} - Percentil {percentilInfo?.percentil || '--'}
        </span>
      </div>
    </div>
  );
};

export default function CurvasCrecimientoOMS({ peso, talla, edadAnios, edadMeses: edadMesesProp, genero }) {
  const [tabActiva, setTabActiva] = useState('resumen');

  // Calcular edad en meses
  const edadMeses = useMemo(() => {
    if (edadMesesProp) return edadMesesProp;
    if (edadAnios) return Math.round(edadAnios * 12);
    return 0;
  }, [edadAnios, edadMesesProp]);

  // Calcular IMC
  const imc = useMemo(() => {
    if (!peso || !talla) return null;
    const pesoNum = parseFloat(peso);
    const tallaM = parseFloat(talla) / 100;
    if (pesoNum <= 0 || tallaM <= 0) return null;
    return pesoNum / (tallaM * tallaM);
  }, [peso, talla]);

  // Calcular percentiles
  const percentilPeso = useMemo(() => {
    if (!peso || !edadMeses) return null;
    return interpolarPercentil(parseFloat(peso), PESO_EDAD_OMS, edadMeses, genero);
  }, [peso, edadMeses, genero]);

  const percentilTalla = useMemo(() => {
    if (!talla || !edadMeses) return null;
    return interpolarPercentil(parseFloat(talla), TALLA_EDAD_OMS, edadMeses, genero);
  }, [talla, edadMeses, genero]);

  const percentilIMC = useMemo(() => {
    if (!imc || !edadMeses || edadMeses < 24) return null;
    return interpolarPercentil(imc, IMC_EDAD_OMS, edadMeses, genero);
  }, [imc, edadMeses, genero]);

  // Calcular percentiles exactos
  const percentilExactoPeso = useMemo(() => {
    if (!peso || !edadMeses) return null;
    return calcularPercentilExacto(parseFloat(peso), PESO_EDAD_OMS, edadMeses, genero);
  }, [peso, edadMeses, genero]);

  const percentilExactoTalla = useMemo(() => {
    if (!talla || !edadMeses) return null;
    return calcularPercentilExacto(parseFloat(talla), TALLA_EDAD_OMS, edadMeses, genero);
  }, [talla, edadMeses, genero]);

  const percentilExactoIMC = useMemo(() => {
    if (!imc || !edadMeses || edadMeses < 24) return null;
    return calcularPercentilExacto(imc, IMC_EDAD_OMS, edadMeses, genero);
  }, [imc, edadMeses, genero]);

  // Verificar si hay datos suficientes
  const hayDatos = peso || talla;

  if (!hayDatos) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <Info className="h-8 w-8 text-blue-400 mx-auto mb-2" />
        <p className="text-sm text-blue-700">
          Ingrese peso y/o talla para ver las curvas de crecimiento según la OMS.
        </p>
      </div>
    );
  }

  const edadTexto = edadMeses < 24
    ? `${edadMeses} meses`
    : `${Math.floor(edadMeses / 12)} años ${edadMeses % 12 > 0 ? `${edadMeses % 12} meses` : ''}`;

  return (
    <Card className="border-blue-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <TrendingUp className="h-5 w-5" />
          Curvas de Crecimiento OMS
          <Badge variant="outline" className="ml-2 bg-white">
            {genero === 'Femenino' || genero === 'F' ? 'Niña' : 'Niño'} - {edadTexto}
          </Badge>
        </CardTitle>
        <p className="text-xs text-blue-600 mt-1">
          Patrones de crecimiento infantil OMS 2006/2007
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={tabActiva} onValueChange={setTabActiva}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="peso">Peso/Edad</TabsTrigger>
            <TabsTrigger value="talla">Talla/Edad</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-4">
            {/* Resumen de percentiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Peso */}
              <div className={`rounded-lg border p-4 ${percentilPeso?.bg || 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Peso</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{peso || '--'} <span className="text-sm font-normal">kg</span></div>
                <div className={`text-sm mt-2 ${percentilPeso?.color || 'text-gray-500'}`}>
                  Percentil {percentilExactoPeso || '--'} ({percentilPeso?.estado || 'Sin datos'})
                </div>
              </div>

              {/* Talla */}
              <div className={`rounded-lg border p-4 ${percentilTalla?.bg || 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Talla</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{talla || '--'} <span className="text-sm font-normal">cm</span></div>
                <div className={`text-sm mt-2 ${percentilTalla?.color || 'text-gray-500'}`}>
                  Percentil {percentilExactoTalla || '--'} ({percentilTalla?.estado || 'Sin datos'})
                </div>
              </div>

              {/* IMC */}
              <div className={`rounded-lg border p-4 ${percentilIMC?.bg || 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Baby className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">IMC</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {imc ? imc.toFixed(1) : '--'} <span className="text-sm font-normal">kg/m²</span>
                </div>
                <div className={`text-sm mt-2 ${percentilIMC?.color || 'text-gray-500'}`}>
                  {edadMeses >= 24
                    ? `Percentil ${percentilExactoIMC || '--'} (${percentilIMC?.estado || 'Sin datos'})`
                    : 'Disponible desde los 2 años'
                  }
                </div>
              </div>
            </div>

            {/* Interpretación */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Interpretación
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• <span className="text-green-600 font-medium">P15-P85:</span> Rango normal de crecimiento</p>
                <p>• <span className="text-yellow-600 font-medium">P3-P15 o P85-P97:</span> Vigilar evolución</p>
                <p>• <span className="text-red-600 font-medium">&lt;P3 o &gt;P97:</span> Evaluar causas, posible derivación</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="peso">
            {peso ? (
              <GraficaPercentil
                titulo="Peso para la Edad"
                valor={parseFloat(peso)}
                percentilInfo={percentilPeso}
                percentilExacto={percentilExactoPeso}
                unidad="kg"
                icon={Scale}
                datosReferencia={PESO_EDAD_OMS}
                edadMeses={edadMeses}
                genero={genero}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                Ingrese el peso para ver la gráfica
              </div>
            )}
          </TabsContent>

          <TabsContent value="talla">
            {talla ? (
              <GraficaPercentil
                titulo="Talla para la Edad"
                valor={parseFloat(talla)}
                percentilInfo={percentilTalla}
                percentilExacto={percentilExactoTalla}
                unidad="cm"
                icon={Ruler}
                datosReferencia={TALLA_EDAD_OMS}
                edadMeses={edadMeses}
                genero={genero}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                Ingrese la talla para ver la gráfica
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
