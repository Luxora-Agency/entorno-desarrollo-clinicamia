'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Activity, Plus, X, AlertCircle, TrendingUp, Scale, Calculator, TestTube, Sparkles,
  User, Heart, Wind, Utensils, Droplets, Brain, Hand, Thermometer, Droplet, Eye,
  UserCircle, Ear, Mic, Bone, Stethoscope, ChevronDown, ChevronUp
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HistoricoSignosVitalesModal from './HistoricoSignosVitalesModal';
import CurvasCrecimientoOMS from './CurvasCrecimientoOMS';
import IndicesNutricionales from './IndicesNutricionales';

// Configuración de sistemas para examen físico
const SISTEMAS_EXAMEN_FISICO = [
  { id: 'general', titulo: 'Aspecto General', icono: User },
  { id: 'cabezaCuello', titulo: 'Cabeza y Cuello', icono: UserCircle },
  { id: 'ojos', titulo: 'Ojos', icono: Eye },
  { id: 'oidos', titulo: 'Oídos', icono: Ear },
  { id: 'narizGarganta', titulo: 'Nariz y Garganta', icono: Mic },
  { id: 'cardiovascular', titulo: 'Cardiovascular', icono: Heart },
  { id: 'respiratorio', titulo: 'Respiratorio', icono: Wind },
  { id: 'gastrointestinal', titulo: 'Gastrointestinal', icono: Utensils },
  { id: 'genitourinario', titulo: 'Genitourinario', icono: Droplets },
  { id: 'musculoesqueletico', titulo: 'Musculoesquelético', icono: Bone },
  { id: 'neurologico', titulo: 'Neurológico', icono: Brain },
  { id: 'piel', titulo: 'Piel y Faneras', icono: Hand },
  { id: 'psiquiatrico', titulo: 'Estado Mental', icono: Brain },
  { id: 'endocrino', titulo: 'Endocrino', icono: Thermometer },
  { id: 'hematologico', titulo: 'Hematológico/Linfático', icono: Droplet },
];

// Función para calcular IMC y su clasificación
const calcularIMC = (peso, talla) => {
  if (!peso || !talla) return null;
  const pesoNum = parseFloat(peso);
  const tallaMetros = parseFloat(talla) / 100;
  if (pesoNum <= 0 || tallaMetros <= 0) return null;

  const imc = pesoNum / (tallaMetros * tallaMetros);

  let categoria = '';
  let color = '';
  let bgColor = '';

  if (imc < 18.5) {
    categoria = 'Bajo peso';
    color = 'text-yellow-700';
    bgColor = 'bg-yellow-100';
  } else if (imc < 25) {
    categoria = 'Normal';
    color = 'text-green-700';
    bgColor = 'bg-green-100';
  } else if (imc < 30) {
    categoria = 'Sobrepeso';
    color = 'text-orange-700';
    bgColor = 'bg-orange-100';
  } else {
    categoria = 'Obesidad';
    color = 'text-red-700';
    bgColor = 'bg-red-100';
  }

  return { value: imc.toFixed(1), categoria, color, bgColor };
};

// Fórmula CKD-EPI (Simplificada para ejemplo, se debería usar la completa validada)
const calcularTFG = (creatinina, edad, genero, esRazaNegra = false) => {
  if (!creatinina || !edad || !genero) return null;
  const creat = parseFloat(creatinina);
  const age = parseFloat(edad);
  if (creat <= 0) return null;

  let k = 0.9;
  let alpha = -0.411;
  let genderFactor = 1;

  if (genero === 'Femenino' || genero === 'F') {
    k = 0.7;
    alpha = -0.329;
    genderFactor = 1.018;
  }
  
  const raceFactor = esRazaNegra ? 1.159 : 1;
  
  // CKD-EPI 2009 equation
  const tfg = 141 * Math.pow(Math.min(creat/k, 1), alpha) * Math.pow(Math.max(creat/k, 1), -1.209) * Math.pow(0.993, age) * genderFactor * raceFactor;
  
  return tfg.toFixed(1);
};

// Fórmula Friedewald para LDL
const calcularLDL = (colTotal, hdl, trigliceridos) => {
  if (!colTotal || !hdl || !trigliceridos) return null;
  const ldl = parseFloat(colTotal) - parseFloat(hdl) - (parseFloat(trigliceridos) / 5);
  return ldl.toFixed(1);
};

export default function FormularioSignosVitalesConsulta({ onChange, data, pacienteId, pacienteEdad, pacienteGenero }) {
  const [quiereAgregar, setQuiereAgregar] = useState(data !== null && data !== undefined);
  const [showHistorico, setShowHistorico] = useState(false);
  const [showIndicesNutricionales, setShowIndicesNutricionales] = useState(false);
  const [formData, setFormData] = useState(data || {
    temperatura: '',
    presionSistolica: '',
    presionDiastolica: '',
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    saturacionOxigeno: '',
    peso: '',
    talla: '',
    // Perímetros
    perimetroAbdominal: '',
    perimetroCefalico: '', // Pediátrico
    perimetroBraquial: '', // Para índice Kanawati-McLaren
    // Paraclínicos Rápidos
    creatinina: '',
    tfg_ckdepi: '', // Calculado
    glucosaAyunas: '',
    hba1c: '',
    colesterolTotal: '',
    colesterolHDL: '',
    trigliceridos: '',
    colesterolLDL: '', // Calculado o directo
    calcio: '',
    potasio: '',
    pth: '',
    // Perfil Tiroideo
    tsh: '',
    tiroxinaLibre: '',
    tiroglobulina: '',
    anticuerposAntitiroglobulina: '',
    analisisTiroideo: '',
    // Paraclínicos personalizados (array para múltiples)
    otrosParaclinicos: [],
    // Examen Físico por Sistemas
    examenFisico: {
      general: 'Sin alteraciones',
      cabezaCuello: 'Sin alteraciones',
      ojos: 'Sin alteraciones',
      oidos: 'Sin alteraciones',
      narizGarganta: 'Sin alteraciones',
      cardiovascular: 'Sin alteraciones',
      respiratorio: 'Sin alteraciones',
      gastrointestinal: 'Sin alteraciones',
      genitourinario: 'Sin alteraciones',
      musculoesqueletico: 'Sin alteraciones',
      neurologico: 'Sin alteraciones',
      piel: 'Sin alteraciones',
      psiquiatrico: 'Sin alteraciones',
      endocrino: 'Sin alteraciones',
      hematologico: 'Sin alteraciones',
    },
  });

  // Calcular IMC en tiempo real
  const imcData = useMemo(() => calcularIMC(formData.peso, formData.talla), [formData.peso, formData.talla]);

  // Cálculos Automáticos de Laboratorio
  useMemo(() => {
    // Calcular TFG
    if (formData.creatinina && pacienteEdad) {
        const tfg = calcularTFG(formData.creatinina, pacienteEdad, pacienteGenero);
        if (tfg && tfg !== formData.tfg_ckdepi) {
            setFormData(prev => ({...prev, tfg_ckdepi: tfg}));
        }
    }
    // Calcular LDL
    if (formData.colesterolTotal && formData.colesterolHDL && formData.trigliceridos) {
        const ldl = calcularLDL(formData.colesterolTotal, formData.colesterolHDL, formData.trigliceridos);
        if (ldl && ldl !== formData.colesterolLDL) {
            setFormData(prev => ({...prev, colesterolLDL: ldl}));
        }
    }
  }, [formData.creatinina, formData.colesterolTotal, formData.colesterolHDL, formData.trigliceridos]);

  const handleToggle = (agregar) => {
    setQuiereAgregar(agregar);
    if (!agregar) {
      onChange(null, true);
    } else {
      onChange(formData, isComplete());
    }
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData, isComplete(newData));
  };

  // Funciones para manejar múltiples paraclínicos personalizados
  const agregarParaclinico = () => {
    const nuevoParaclinico = { id: Date.now(), tipo: 'estructurado', nombre: '', valor: '', textoLibre: '' };
    const nuevosParaclinicos = [...(formData.otrosParaclinicos || []), nuevoParaclinico];
    handleChange('otrosParaclinicos', nuevosParaclinicos);
  };

  const actualizarParaclinico = (id, campo, valor) => {
    const nuevosParaclinicos = (formData.otrosParaclinicos || []).map(p =>
      p.id === id ? { ...p, [campo]: valor } : p
    );
    handleChange('otrosParaclinicos', nuevosParaclinicos);
  };

  const eliminarParaclinico = (id) => {
    const nuevosParaclinicos = (formData.otrosParaclinicos || []).filter(p => p.id !== id);
    handleChange('otrosParaclinicos', nuevosParaclinicos);
  };

  // Función para manejar cambios en examen físico por sistemas
  const handleExamenFisicoChange = (sistema, valor) => {
    const nuevoExamenFisico = {
      ...(formData.examenFisico || {}),
      [sistema]: valor
    };
    handleChange('examenFisico', nuevoExamenFisico);
  };

  const isComplete = (data = formData) => {
    // Para que sea válido, al menos debe tener algunos signos vitales básicos
    return (data.temperatura || data.presionSistolica || data.frecuenciaCardiaca);
  };

  if (!quiereAgregar) {
    return (
      <Card className="border-purple-200">
        <CardContent className="p-6 text-center">
          <Activity className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">¿Desea registrar examen físico y signos vitales?</p>
          <Button 
            onClick={() => handleToggle(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Sí, agregar examen físico
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader className="bg-purple-50">
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Activity className="h-5 w-5" />
          Examen Físico y Paraclínicos (Point of Care)
          <div className="ml-auto flex items-center gap-2">
            {pacienteId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistorico(true)}
                className="text-purple-600 hover:text-purple-700 border-purple-300"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Ver Histórico
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIndicesNutricionales(true)}
              className="text-teal-600 hover:text-teal-700 border-teal-300"
            >
              <Calculator className="h-4 w-4 mr-1" />
              Índices Nutricionales
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle(false)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Ocultar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        
        {/* 1. SIGNOS VITALES BÁSICOS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="temperatura">Temp (°C)</Label>
            <Input
              id="temperatura"
              type="number"
              step="0.1"
              value={formData.temperatura}
              onChange={(e) => handleChange('temperatura', e.target.value)}
              placeholder="36.5"
            />
          </div>
          <div>
            <Label htmlFor="saturacion">Sat O₂ (%)</Label>
            <Input
              id="saturacion"
              type="number"
              value={formData.saturacionOxigeno}
              onChange={(e) => handleChange('saturacionOxigeno', e.target.value)}
              placeholder="98"
            />
          </div>
          <div>
            <Label htmlFor="presionSistolica">TA Sistólica</Label>
            <Input
              id="presionSistolica"
              type="number"
              value={formData.presionSistolica}
              onChange={(e) => handleChange('presionSistolica', e.target.value)}
              placeholder="120"
            />
          </div>
          <div>
            <Label htmlFor="presionDiastolica">TA Diastólica</Label>
            <Input
              id="presionDiastolica"
              type="number"
              value={formData.presionDiastolica}
              onChange={(e) => handleChange('presionDiastolica', e.target.value)}
              placeholder="80"
            />
          </div>
          <div>
            <Label htmlFor="frecuenciaCardiaca">FC (lpm)</Label>
            <Input
              id="frecuenciaCardiaca"
              type="number"
              value={formData.frecuenciaCardiaca}
              onChange={(e) => handleChange('frecuenciaCardiaca', e.target.value)}
              placeholder="72"
            />
          </div>
          <div>
            <Label htmlFor="frecuenciaRespiratoria">FR (rpm)</Label>
            <Input
              id="frecuenciaRespiratoria"
              type="number"
              value={formData.frecuenciaRespiratoria}
              onChange={(e) => handleChange('frecuenciaRespiratoria', e.target.value)}
              placeholder="16"
            />
          </div>
        </div>

        {/* 2. ANTROPOMETRÍA */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
           <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
             <Scale className="h-4 w-4" /> Antropometría
           </h4>
           <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
             <div>
                <Label>Peso (kg)</Label>
                <Input type="number" step="0.1" value={formData.peso} onChange={(e) => handleChange('peso', e.target.value)} />
             </div>
             <div>
                <Label>Talla (cm)</Label>
                <Input type="number" step="1" value={formData.talla} onChange={(e) => handleChange('talla', e.target.value)} />
             </div>
             <div>
                <Label>Perím. Abdominal</Label>
                <Input type="number" value={formData.perimetroAbdominal} onChange={(e) => handleChange('perimetroAbdominal', e.target.value)} placeholder="cm" />
             </div>
             {/* Perímetro Cefálico y Braquial solo para menores de 18 años */}
             {pacienteEdad !== undefined && pacienteEdad < 18 && (
               <>
                 <div>
                    <Label>Perím. Cefálico</Label>
                    <Input type="number" step="0.1" value={formData.perimetroCefalico} onChange={(e) => handleChange('perimetroCefalico', e.target.value)} placeholder="cm" />
                 </div>
                 <div>
                    <Label>Perím. Braquial</Label>
                    <Input type="number" step="0.1" value={formData.perimetroBraquial} onChange={(e) => handleChange('perimetroBraquial', e.target.value)} placeholder="cm" />
                 </div>
               </>
             )}
             <div className="md:col-span-1">
                <Label>IMC</Label>
                {imcData ? (
                  <div className={`mt-1 px-3 py-2 rounded border text-center ${imcData.bgColor} ${imcData.color} font-bold`}>
                    {imcData.value} - {imcData.categoria}
                  </div>
                ) : <div className="mt-1 px-3 py-2 bg-gray-100 text-gray-400 text-center rounded text-sm">--</div>}
             </div>
           </div>
        </div>

        {/* CURVAS DE CRECIMIENTO OMS (Solo pacientes pediátricos < 19 años) */}
        {pacienteEdad && pacienteEdad < 19 && (formData.peso || formData.talla) && (
          <CurvasCrecimientoOMS
            peso={formData.peso}
            talla={formData.talla}
            edadAnios={pacienteEdad}
            genero={pacienteGenero}
          />
        )}

        {/* 3. EXAMEN FÍSICO POR SISTEMAS */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-green-800 mb-4 flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Examen Físico por Sistemas
            <span className="ml-auto text-xs font-normal text-green-600">
              (Por defecto: Sin alteraciones)
            </span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SISTEMAS_EXAMEN_FISICO.map((sistema) => {
              const IconoSistema = sistema.icono;
              const valorActual = formData.examenFisico?.[sistema.id] || 'Sin alteraciones';
              const tieneAlteracion = valorActual !== 'Sin alteraciones';

              return (
                <div
                  key={sistema.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    tieneAlteracion
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-white border-green-200'
                  }`}
                >
                  <Label className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <IconoSistema className={`h-4 w-4 ${tieneAlteracion ? 'text-amber-600' : 'text-green-600'}`} />
                    {sistema.titulo}
                    {tieneAlteracion && (
                      <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                        Con hallazgos
                      </span>
                    )}
                  </Label>
                  <Textarea
                    value={valorActual}
                    onChange={(e) => handleExamenFisicoChange(sistema.id, e.target.value)}
                    placeholder="Sin alteraciones"
                    className={`text-sm resize-none ${
                      tieneAlteracion ? 'border-amber-300 focus:border-amber-400' : ''
                    }`}
                    rows={2}
                  />
                </div>
              );
            })}
          </div>

          {/* Botón para marcar todos sin alteraciones */}
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const resetExamen = {};
                SISTEMAS_EXAMEN_FISICO.forEach(s => {
                  resetExamen[s.id] = 'Sin alteraciones';
                });
                handleChange('examenFisico', resetExamen);
              }}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <X className="h-3 w-3 mr-1" />
              Marcar todos sin alteraciones
            </Button>
          </div>
        </div>

        {/* 4. PARACLÍNICOS RÁPIDOS (POINT OF CARE) */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <TestTube className="h-4 w-4" /> 
              Paraclínicos (Ingreso Manual)
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4">
              {/* Renal */}
              <div className="col-span-2 md:col-span-4 border-b border-blue-200 pb-2 mb-2 text-xs font-bold text-blue-600 uppercase">Función Renal</div>
              <div>
                <Label>Creatinina (mg/dL)</Label>
                <Input type="number" step="0.1" value={formData.creatinina} onChange={(e) => handleChange('creatinina', e.target.value)} />
              </div>
              <div>
                 <Label className="flex items-center gap-1">TFG (CKD-EPI) <Calculator className="h-3 w-3 text-gray-400" /></Label>
                 <Input value={formData.tfg_ckdepi} readOnly className="bg-gray-100" placeholder="Auto" />
              </div>
              <div>
                <Label>Potasio (K+)</Label>
                <Input type="number" step="0.1" value={formData.potasio} onChange={(e) => handleChange('potasio', e.target.value)} />
              </div>
              <div>
                <Label>Calcio Total</Label>
                <Input type="number" step="0.1" value={formData.calcio} onChange={(e) => handleChange('calcio', e.target.value)} />
              </div>

              {/* Metabólico */}
              <div className="col-span-2 md:col-span-4 border-b border-blue-200 pb-2 mb-2 mt-2 text-xs font-bold text-blue-600 uppercase">Perfil Metabólico</div>
              <div>
                <Label>Glucosa Ayunas</Label>
                <Input type="number" value={formData.glucosaAyunas} onChange={(e) => handleChange('glucosaAyunas', e.target.value)} />
              </div>
              <div>
                <Label>HbA1c (%)</Label>
                <Input type="number" step="0.1" value={formData.hba1c} onChange={(e) => handleChange('hba1c', e.target.value)} />
              </div>
              
              {/* Lípidos */}
              <div className="col-span-2 md:col-span-4 border-b border-blue-200 pb-2 mb-2 mt-2 text-xs font-bold text-blue-600 uppercase">Perfil Lipídico</div>
              <div>
                <Label>Colesterol Total</Label>
                <Input type="number" value={formData.colesterolTotal} onChange={(e) => handleChange('colesterolTotal', e.target.value)} />
              </div>
              <div>
                <Label>HDL</Label>
                <Input type="number" value={formData.colesterolHDL} onChange={(e) => handleChange('colesterolHDL', e.target.value)} />
              </div>
              <div>
                <Label>Triglicéridos</Label>
                <Input type="number" value={formData.trigliceridos} onChange={(e) => handleChange('trigliceridos', e.target.value)} />
              </div>
              <div>
                 <Label className="flex items-center gap-1">LDL (Calc) <Calculator className="h-3 w-3 text-gray-400" /></Label>
                 <Input value={formData.colesterolLDL} readOnly className="bg-gray-100" placeholder="Friedewald" />
              </div>

              {/* Perfil Tiroideo */}
              <div className="col-span-2 md:col-span-4 border-b border-blue-200 pb-2 mb-2 mt-2 text-xs font-bold text-blue-600 uppercase flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Perfil Tiroideo
              </div>
              <div>
                <Label>TSH (mUI/L)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tsh}
                  onChange={(e) => handleChange('tsh', e.target.value)}
                  placeholder="0.4-4.0"
                />
              </div>
              <div>
                <Label>T4 Libre (ng/dL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tiroxinaLibre}
                  onChange={(e) => handleChange('tiroxinaLibre', e.target.value)}
                  placeholder="0.8-1.8"
                />
              </div>
              <div>
                <Label>Tiroglobulina (ng/mL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.tiroglobulina}
                  onChange={(e) => handleChange('tiroglobulina', e.target.value)}
                  placeholder="<55"
                />
              </div>
              <div>
                <Label>Anti-TG (UI/mL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.anticuerposAntitiroglobulina}
                  onChange={(e) => handleChange('anticuerposAntitiroglobulina', e.target.value)}
                  placeholder="<4.0"
                />
              </div>
              <div className="col-span-2 md:col-span-4">
                <Label>Análisis/Concepto Tiroideo</Label>
                <Textarea
                  value={formData.analisisTiroideo}
                  onChange={(e) => handleChange('analisisTiroideo', e.target.value)}
                  placeholder="Interpretación clínica del perfil tiroideo..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              {/* Otros Paraclínicos Personalizados */}
              <div className="col-span-2 md:col-span-4 border-b border-blue-200 pb-2 mb-2 mt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase">Otros Paraclínicos</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={agregarParaclinico}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar Paraclínico
                </Button>
              </div>

              {/* Lista de paraclínicos agregados */}
              {(formData.otrosParaclinicos || []).length === 0 ? (
                <div className="col-span-2 md:col-span-4 text-center py-4 text-gray-400 text-sm">
                  <TestTube className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay paraclínicos adicionales.</p>
                  <p className="text-xs">Haga clic en "Agregar Paraclínico" para incluir exámenes adicionales.</p>
                </div>
              ) : (
                (formData.otrosParaclinicos || []).map((paraclinico, index) => (
                  <div key={paraclinico.id} className="col-span-2 md:col-span-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-blue-700">Paraclínico #{index + 1}</span>
                        <Select
                          value={paraclinico.tipo || 'estructurado'}
                          onValueChange={(value) => actualizarParaclinico(paraclinico.id, 'tipo', value)}
                        >
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Tipo de entrada" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="estructurado">Nombre y Resultado</SelectItem>
                            <SelectItem value="texto">Solo Texto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarParaclinico(paraclinico.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {(paraclinico.tipo || 'estructurado') === 'estructurado' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-blue-700">Nombre del Examen</Label>
                          <Input
                            type="text"
                            value={paraclinico.nombre}
                            onChange={(e) => actualizarParaclinico(paraclinico.id, 'nombre', e.target.value)}
                            placeholder="Ej: Vitamina D, PTH, Cortisol..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-blue-700">Valor/Resultado</Label>
                          <Input
                            type="text"
                            value={paraclinico.valor}
                            onChange={(e) => actualizarParaclinico(paraclinico.id, 'valor', e.target.value)}
                            placeholder="Resultado con unidad"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs text-blue-700">Descripción del Paraclínico</Label>
                        <Textarea
                          value={paraclinico.textoLibre || ''}
                          onChange={(e) => actualizarParaclinico(paraclinico.id, 'textoLibre', e.target.value)}
                          placeholder="Escriba la información del paraclínico aquí..."
                          className="mt-1 min-h-[80px]"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Botón adicional para agregar más si ya hay al menos uno */}
              {(formData.otrosParaclinicos || []).length > 0 && (
                <div className="col-span-2 md:col-span-4 flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={agregarParaclinico}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar otro paraclínico
                  </Button>
                </div>
              )}
            </div>
        </div>

      </CardContent>

      {/* Modal de Histórico de Signos Vitales con Gráficas */}
      {showHistorico && pacienteId && (
        <HistoricoSignosVitalesModal
          pacienteId={pacienteId}
          onClose={() => setShowHistorico(false)}
        />
      )}

      {/* Modal de Índices Nutricionales */}
      {showIndicesNutricionales && (
        <IndicesNutricionales
          isModal={true}
          onClose={() => setShowIndicesNutricionales(false)}
          pacienteData={{
            peso: formData.peso,
            talla: formData.talla,
            edadAnios: pacienteEdad,
            genero: pacienteGenero,
            perimetroCefalico: formData.perimetroCefalico,
            perimetroBraquial: formData.perimetroBraquial,
            circunferenciaCintura: formData.perimetroAbdominal, // Usamos perímetro abdominal
          }}
        />
      )}
    </Card>
  );
}
