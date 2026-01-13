'use client';

import { useState, useEffect, useRef } from 'react';
import { X, TrendingUp, Activity, Heart, Thermometer, Wind, Scale, Droplet, TestTube, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { apiGet } from '@/services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

const TIPOS_GRAFICO = [
  { id: 'imc', label: 'IMC', icon: Scale, color: '#8b5cf6' },
  { id: 'presion', label: 'Presión Arterial', icon: Heart, color: '#ef4444' },
  { id: 'frecuenciaCardiaca', label: 'Frec. Cardíaca', icon: Activity, color: '#10b981' },
  { id: 'saturacionOxigeno', label: 'Sat. O₂', icon: Wind, color: '#06b6d4' },
  { id: 'temperatura', label: 'Temperatura', icon: Thermometer, color: '#f97316' },
  { id: 'glucosa', label: 'Glucosa', icon: Droplet, color: '#eab308' },
  { id: 'lipidos', label: 'Perfil Lipídico', icon: TestTube, color: '#f59e0b' },
  { id: 'renal', label: 'Función Renal', icon: Activity, color: '#3b82f6' },
  { id: 'tiroides', label: 'Perfil Tiroideo', icon: Sparkles, color: '#ec4899' },
];

// Referencias normales
const REFERENCIAS = {
  imc: { min: 18.5, max: 24.9, label: 'Normal' },
  temperatura: { min: 36, max: 37.5, label: 'Normal' },
  frecuenciaCardiaca: { min: 60, max: 100, label: 'Normal' },
  saturacionOxigeno: { min: 95, max: 100, label: 'Normal' },
  presionSistolica: { min: 90, max: 120, label: 'Normal' },
  presionDiastolica: { min: 60, max: 80, label: 'Normal' },
  glucosaAyunas: { min: 70, max: 100, label: 'Normal' },
  hba1c: { min: 4, max: 5.7, label: 'Normal' },
  creatinina: { min: 0.7, max: 1.3, label: 'Normal' },
  // Perfil Tiroideo - Valores de referencia normales
  tsh: { min: 0.4, max: 4.0, label: 'Normal (mUI/L)' },
  tiroxinaLibre: { min: 0.8, max: 1.8, label: 'Normal (ng/dL)' },
  tiroglobulina: { min: 0, max: 40, label: 'Normal (ng/mL)' },
  anticuerposAntitiroglobulina: { min: 0, max: 40, label: 'Normal (UI/mL)' },
};

export default function HistoricoSignosVitalesModal({ pacienteId, onClose }) {
  const [activeTab, setActiveTab] = useState('imc');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diasAtras, setDiasAtras] = useState(90);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchHistorico();
  }, [pacienteId, diasAtras]);

  // Auto-refresh cada 60 segundos cuando está activado
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchHistorico();
      }, 60000); // 60 segundos
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, pacienteId, diasAtras]);

  const fetchHistorico = async () => {
    setLoading(true);
    try {
      // Calcular fecha desde según diasAtras
      const fechaDesde = new Date();
      fechaDesde.setDate(fechaDesde.getDate() - diasAtras);
      const fechaDesdeISO = fechaDesde.toISOString().split('T')[0];

      // Usar el endpoint existente de signos vitales con filtro de fecha
      const response = await apiGet(`/signos-vitales?paciente_id=${pacienteId}&fecha_desde=${fechaDesdeISO}&limit=100`);
      if (response.success && response.data) {
        // Procesar datos para los gráficos
        const processed = response.data.map((item) => ({
          fecha: new Date(item.fechaRegistro || item.createdAt).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
          }),
          fechaCompleta: new Date(item.fechaRegistro || item.createdAt),
          imc: item.imc ? parseFloat(item.imc) : null,
          peso: item.peso ? parseFloat(item.peso) : null,
          talla: item.talla ? parseFloat(item.talla) : null,
          temperatura: item.temperatura ? parseFloat(item.temperatura) : null,
          presionSistolica: item.presionSistolica ? parseInt(item.presionSistolica) : null,
          presionDiastolica: item.presionDiastolica ? parseInt(item.presionDiastolica) : null,
          frecuenciaCardiaca: item.frecuenciaCardiaca ? parseInt(item.frecuenciaCardiaca) : null,
          frecuenciaRespiratoria: item.frecuenciaRespiratoria ? parseInt(item.frecuenciaRespiratoria) : null,
          saturacionOxigeno: item.saturacionOxigeno ? parseInt(item.saturacionOxigeno) : null,
          // Antropometría
          perimetroAbdominal: item.perimetroAbdominal ? parseFloat(item.perimetroAbdominal) : null,
          // Nuevos campos
          glucosaAyunas: item.glucosaAyunas ? parseFloat(item.glucosaAyunas) : null,
          hba1c: item.hba1c ? parseFloat(item.hba1c) : null,
          colesterolTotal: item.colesterolTotal ? parseFloat(item.colesterolTotal) : null,
          colesterolLDL: item.colesterolLDL ? parseFloat(item.colesterolLDL) : null,
          colesterolHDL: item.colesterolHDL ? parseFloat(item.colesterolHDL) : null,
          trigliceridos: item.trigliceridos ? parseFloat(item.trigliceridos) : null,
          creatinina: item.creatinina ? parseFloat(item.creatinina) : null,
          tfgCkdEpi: item.tfgCkdEpi ? parseFloat(item.tfgCkdEpi) : null,
          potasio: item.potasio ? parseFloat(item.potasio) : null,
          calcio: item.calcio ? parseFloat(item.calcio) : null,
          pth: item.pth ? parseFloat(item.pth) : null,
          // Perfil Tiroideo
          tsh: item.tsh ? parseFloat(item.tsh) : null,
          tiroxinaLibre: item.tiroxinaLibre ? parseFloat(item.tiroxinaLibre) : null,
          tiroglobulina: item.tiroglobulina ? parseFloat(item.tiroglobulina) : null,
          anticuerposAntitiroglobulina: item.anticuerposAntitiroglobulina ? parseFloat(item.anticuerposAntitiroglobulina) : null,
          analisisTiroideo: item.analisisTiroideo || null,
        })).reverse(); // Ordenar de más antiguo a más reciente

        setData(processed);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error al cargar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-500">
          No hay registros históricos disponibles
        </div>
      );
    }

    const tipoActivo = TIPOS_GRAFICO.find((t) => t.id === activeTab);

    if (activeTab === 'lipidos') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <ReferenceLine y={200} stroke="#ef4444" strokeDasharray="3 3" label="Total Max" />
            <Line type="monotone" dataKey="colesterolTotal" stroke="#f59e0b" name="Col. Total" connectNulls />
            <Line type="monotone" dataKey="colesterolLDL" stroke="#ef4444" name="LDL" connectNulls />
            <Line type="monotone" dataKey="colesterolHDL" stroke="#10b981" name="HDL" connectNulls />
            <Line type="monotone" dataKey="trigliceridos" stroke="#8b5cf6" name="Triglicéridos" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (activeTab === 'glucosa') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 20, right: 50, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: 'Glucosa (mg/dL)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: 'HbA1c (%)', angle: 90, position: 'insideRight' }} />
            <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Legend />
            <ReferenceLine yAxisId="left" y={100} stroke="#10b981" strokeDasharray="3 3" label="Ayunas Max" />
            <ReferenceLine yAxisId="right" y={5.7} stroke="#f59e0b" strokeDasharray="3 3" label="HbA1c Max" />
            <Line yAxisId="left" type="monotone" dataKey="glucosaAyunas" stroke="#eab308" name="Glucosa" connectNulls />
            <Line yAxisId="right" type="monotone" dataKey="hba1c" stroke="#ef4444" name="HbA1c" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (activeTab === 'renal') {
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: 'Creatinina', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: 'TFG', angle: 90, position: 'insideRight' }} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <ReferenceLine yAxisId="left" y={1.2} stroke="#ef4444" strokeDasharray="3 3" />
              <Line yAxisId="left" type="monotone" dataKey="creatinina" stroke="#ef4444" name="Creatinina" connectNulls />
              <Line yAxisId="right" type="monotone" dataKey="tfgCkdEpi" stroke="#10b981" name="TFG (CKD-EPI)" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        );
      }

    // Gráfico de Perfil Tiroideo
    if (activeTab === 'tiroides') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 20, right: 50, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{ value: 'TSH (mUI/L)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#ec4899' } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: 'T4 Libre (ng/dL)', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#8b5cf6' } }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              formatter={(value, name) => {
                if (name === 'TSH') return [`${value} mUI/L`, name];
                if (name === 'T4 Libre') return [`${value} ng/dL`, name];
                if (name === 'Tiroglobulina') return [`${value} ng/mL`, name];
                if (name === 'Anti-TG') return [`${value} UI/mL`, name];
                return [value, name];
              }}
            />
            <Legend />
            {/* Líneas de referencia TSH */}
            <ReferenceLine yAxisId="left" y={0.4} stroke="#22c55e" strokeDasharray="3 3" />
            <ReferenceLine yAxisId="left" y={4.0} stroke="#22c55e" strokeDasharray="3 3" />
            {/* Líneas de referencia T4 Libre */}
            <ReferenceLine yAxisId="right" y={0.8} stroke="#a855f7" strokeDasharray="3 3" />
            <ReferenceLine yAxisId="right" y={1.8} stroke="#a855f7" strokeDasharray="3 3" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="tsh"
              stroke="#ec4899"
              strokeWidth={2}
              name="TSH"
              dot={{ r: 4, fill: '#ec4899' }}
              connectNulls
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="tiroxinaLibre"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="T4 Libre"
              dot={{ r: 4, fill: '#8b5cf6' }}
              connectNulls
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="tiroglobulina"
              stroke="#f59e0b"
              strokeWidth={1}
              strokeDasharray="5 5"
              name="Tiroglobulina"
              dot={{ r: 3, fill: '#f59e0b' }}
              connectNulls
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="anticuerposAntitiroglobulina"
              stroke="#06b6d4"
              strokeWidth={1}
              strokeDasharray="5 5"
              name="Anti-TG"
              dot={{ r: 3, fill: '#06b6d4' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (activeTab === 'presion') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
            <YAxis domain={[40, 180]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              labelStyle={{ fontWeight: 'bold' }}
              formatter={(value, name) => [`${value} mmHg`, name]}
            />
            <Legend />
            <ReferenceLine y={120} stroke="#ef4444" strokeDasharray="3 3" label="Sistólica máx" />
            <ReferenceLine y={80} stroke="#3b82f6" strokeDasharray="3 3" label="Diastólica máx" />
            <Line
              type="monotone"
              dataKey="presionSistolica"
              stroke="#ef4444"
              strokeWidth={2}
              name="Sistólica"
              dot={{ r: 4 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="presionDiastolica"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Diastólica"
              dot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Gráfico de Saturación de Oxígeno
    if (activeTab === 'saturacionOxigeno') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="satGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
            <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              formatter={(value) => [`${value}%`, 'SpO₂']}
            />
            <ReferenceLine y={95} stroke="#22c55e" strokeDasharray="3 3" label="Mín Normal" />
            <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" label="Crítico" />
            <Area
              type="monotone"
              dataKey="saturacionOxigeno"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#satGradient)"
              name="SpO₂"
              dot={{ r: 4, fill: '#06b6d4' }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // Gráfico de Frecuencia Cardíaca
    if (activeTab === 'frecuenciaCardiaca') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="fcGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
            <YAxis domain={[40, 140]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              formatter={(value) => [`${value} lpm`, 'FC']}
            />
            <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="3 3" label="Mín" />
            <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="3 3" label="Máx" />
            <Area
              type="monotone"
              dataKey="frecuenciaCardiaca"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#fcGradient)"
              name="Frec. Cardíaca"
              dot={{ r: 4, fill: '#10b981' }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // Gráfico de Temperatura
    if (activeTab === 'temperatura') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
            <YAxis domain={[35, 41]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              formatter={(value) => [`${value}°C`, 'Temperatura']}
            />
            <ReferenceLine y={36} stroke="#3b82f6" strokeDasharray="3 3" label="Mín" />
            <ReferenceLine y={37.5} stroke="#22c55e" strokeDasharray="3 3" label="Máx Normal" />
            <ReferenceLine y={38} stroke="#ef4444" strokeDasharray="3 3" label="Fiebre" />
            <Area
              type="monotone"
              dataKey="temperatura"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#tempGradient)"
              name="Temperatura"
              dot={{ r: 4, fill: '#f97316' }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (activeTab === 'imc') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 20, right: 50, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />

            {/* EJE IZQUIERDO: IMC */}
            <YAxis
              yAxisId="left"
              domain={[15, 40]}
              tick={{ fontSize: 12 }}
              label={{ value: 'IMC', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#8b5cf6' } }}
            />

            {/* EJE DERECHO: PESO */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[40, 120]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Peso (kg)', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#06b6d4' } }}
            />

            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />

            {/* Líneas de referencia IMC */}
            <ReferenceLine yAxisId="left" y={18.5} stroke="#eab308" strokeDasharray="3 3" />
            <ReferenceLine yAxisId="left" y={24.9} stroke="#22c55e" strokeDasharray="3 3" />
            <ReferenceLine yAxisId="left" y={29.9} stroke="#f97316" strokeDasharray="3 3" />

            {/* LÍNEA IMC */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="imc"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="IMC"
              dot={{ r: 4, fill: '#8b5cf6' }}
              connectNulls
            />

            {/* LÍNEA PESO (NUEVA) */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="peso"
              stroke="#06b6d4"
              strokeWidth={2}
              name="Peso (kg)"
              dot={{ r: 4, fill: '#06b6d4' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Gráfico genérico para otros tipos
    const ref = REFERENCIAS[activeTab];
    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
          {ref && (
            <>
              <ReferenceLine y={ref.min} stroke="#22c55e" strokeDasharray="3 3" />
              <ReferenceLine y={ref.max} stroke="#22c55e" strokeDasharray="3 3" />
            </>
          )}
          <Line
            type="monotone"
            dataKey={activeTab}
            stroke={tipoActivo?.color || '#8b5cf6'}
            strokeWidth={2}
            dot={{ r: 4, fill: tipoActivo?.color || '#8b5cf6' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Calcular estadísticas del IMC
  const imcStats = () => {
    const imcData = data.filter((d) => d.imc !== null);
    if (imcData.length === 0) return null;

    const valores = imcData.map((d) => d.imc);
    const ultimo = valores[valores.length - 1];
    const primero = valores[0];
    const cambio = ultimo - primero;

    return {
      actual: ultimo?.toFixed(1),
      cambio: cambio?.toFixed(1),
      tendencia: cambio > 0 ? 'subió' : cambio < 0 ? 'bajó' : 'estable',
      color: cambio > 0 ? 'text-red-600' : cambio < 0 ? 'text-green-600' : 'text-gray-600',
    };
  };

  const stats = imcStats();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-bold">Histórico de Signos Vitales</h2>
              <p className="text-sm text-purple-200">Evolución del paciente</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Estadísticas rápidas de IMC */}
          {stats && activeTab === 'imc' && (
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-xs text-purple-600 uppercase">IMC Actual</p>
                <p className="text-2xl font-bold text-purple-700">{stats.actual}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 uppercase">Cambio</p>
                <p className={`text-2xl font-bold ${stats.color}`}>
                  {stats.cambio > 0 ? '+' : ''}
                  {stats.cambio}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 uppercase">Registros</p>
                <p className="text-2xl font-bold text-gray-700">{data.filter((d) => d.imc).length}</p>
              </div>
            </div>
          )}

          {/* Tabs de tipos de gráfico */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {TIPOS_GRAFICO.map((tipo) => {
              const Icon = tipo.icon;
              return (
                <button
                  key={tipo.id}
                  onClick={() => setActiveTab(tipo.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tipo.id
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tipo.label}
                </button>
              );
            })}
          </div>

          {/* Leyenda de referencia para IMC */}
          {activeTab === 'imc' && (
            <div className="flex gap-4 mb-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-400"></span> Bajo peso (&lt;18.5)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span> Normal (18.5-24.9)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-orange-500"></span> Sobrepeso (25-29.9)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500"></span> Obesidad (&gt;30)
              </span>
            </div>
          )}

          {/* Leyenda de referencia para Tiroides */}
          {activeTab === 'tiroides' && (
            <div className="flex flex-wrap gap-4 mb-4 text-xs bg-pink-50 p-3 rounded-lg">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-pink-700">Valores de Referencia:</span>
              </div>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#ec4899' }}></span> TSH: 0.4-4.0 mUI/L
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#8b5cf6' }}></span> T4 Libre: 0.8-1.8 ng/dL
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></span> Tiroglobulina: 0-40 ng/mL
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#06b6d4' }}></span> Anti-TG: &lt;40 UI/mL
              </span>
            </div>
          )}

          {/* Leyenda para Presión Arterial */}
          {activeTab === 'presion' && (
            <div className="flex flex-wrap gap-4 mb-4 text-xs bg-red-50 p-3 rounded-lg">
              <span className="font-semibold text-red-700">Clasificación:</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span> Normal: &lt;120/80
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-500"></span> Elevada: 120-129/&lt;80
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-orange-500"></span> HTA Grado 1: 130-139/80-89
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500"></span> HTA Grado 2: ≥140/90
              </span>
            </div>
          )}

          {/* Leyenda para Saturación de Oxígeno */}
          {activeTab === 'saturacionOxigeno' && (
            <div className="flex flex-wrap gap-4 mb-4 text-xs bg-cyan-50 p-3 rounded-lg">
              <span className="font-semibold text-cyan-700">Clasificación SpO₂:</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span> Normal: 95-100%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-500"></span> Hipoxemia leve: 91-94%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500"></span> Hipoxemia grave: &lt;90%
              </span>
            </div>
          )}

          {/* Leyenda para Frecuencia Cardíaca */}
          {activeTab === 'frecuenciaCardiaca' && (
            <div className="flex flex-wrap gap-4 mb-4 text-xs bg-emerald-50 p-3 rounded-lg">
              <span className="font-semibold text-emerald-700">Clasificación FC:</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-500"></span> Bradicardia: &lt;60 lpm
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span> Normal: 60-100 lpm
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500"></span> Taquicardia: &gt;100 lpm
              </span>
            </div>
          )}

          {/* Leyenda para Glucosa */}
          {activeTab === 'glucosa' && (
            <div className="flex flex-wrap gap-4 mb-4 text-xs bg-yellow-50 p-3 rounded-lg">
              <span className="font-semibold text-yellow-700">Valores de Referencia:</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span> Glucosa ayunas: 70-100 mg/dL
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-500"></span> Prediabetes: 100-125 mg/dL
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500"></span> Diabetes: ≥126 mg/dL
              </span>
              <span className="flex items-center gap-1 ml-4">|</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span> HbA1c normal: &lt;5.7%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500"></span> HbA1c diabetes: ≥6.5%
              </span>
            </div>
          )}

          {/* Leyenda para Perfil Lipídico */}
          {activeTab === 'lipidos' && (
            <div className="flex flex-wrap gap-4 mb-4 text-xs bg-amber-50 p-3 rounded-lg">
              <span className="font-semibold text-amber-700">Valores Objetivo:</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></span> Col. Total: &lt;200 mg/dL
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></span> LDL: &lt;100 mg/dL
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></span> HDL: &gt;40 mg/dL
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#8b5cf6' }}></span> Triglicéridos: &lt;150 mg/dL
              </span>
            </div>
          )}

          {/* Leyenda para Función Renal */}
          {activeTab === 'renal' && (
            <div className="flex flex-wrap gap-4 mb-4 text-xs bg-blue-50 p-3 rounded-lg">
              <span className="font-semibold text-blue-700">Clasificación ERC (TFG ml/min):</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span> G1: ≥90 (Normal)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-lime-500"></span> G2: 60-89 (Leve)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-500"></span> G3a: 45-59
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-orange-500"></span> G3b: 30-44
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500"></span> G4-5: &lt;30
              </span>
            </div>
          )}

          {/* Leyenda para Temperatura */}
          {activeTab === 'temperatura' && (
            <div className="flex flex-wrap gap-4 mb-4 text-xs bg-orange-50 p-3 rounded-lg">
              <span className="font-semibold text-orange-700">Clasificación:</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-500"></span> Hipotermia: &lt;36°C
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span> Normal: 36-37.5°C
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-500"></span> Febrícula: 37.5-38°C
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500"></span> Fiebre: &gt;38°C
              </span>
            </div>
          )}

          {/* Gráfico */}
          <div className="bg-gray-50 rounded-lg p-4">{renderChart()}</div>

          {/* Filtro de tiempo y auto-refresh */}
          <div className="mt-4 flex items-center justify-between">
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh" className="text-sm text-gray-600 cursor-pointer">
                  Actualizar automáticamente
                </Label>
              </div>
              {autoRefresh && (
                <span className="flex items-center gap-1 text-xs text-green-600 animate-pulse">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Cada 60s
                </span>
              )}
              {lastUpdate && (
                <span className="text-xs text-gray-400">
                  Última: {lastUpdate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchHistorico}
                disabled={loading}
                className="text-purple-600 hover:text-purple-800"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>

            {/* Filtro de días */}
            <div className="flex gap-2">
              {[30, 90, 180, 365].map((dias) => (
                <button
                  key={dias}
                  onClick={() => setDiasAtras(dias)}
                  className={`px-3 py-1 rounded text-sm ${
                    diasAtras === dias
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {dias === 365 ? '1 año' : `${dias} días`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
