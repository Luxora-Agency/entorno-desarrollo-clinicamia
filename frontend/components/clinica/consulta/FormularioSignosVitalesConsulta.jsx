'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Activity, Plus, X, AlertCircle, TrendingUp, Scale, Calculator, TestTube, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import HistoricoSignosVitalesModal from './HistoricoSignosVitalesModal';

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
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
             <div className="md:col-span-2">
                <Label>IMC</Label>
                {imcData ? (
                  <div className={`mt-1 px-3 py-2 rounded border text-center ${imcData.bgColor} ${imcData.color} font-bold`}>
                    {imcData.value} - {imcData.categoria}
                  </div>
                ) : <div className="mt-1 px-3 py-2 bg-gray-100 text-gray-400 text-center rounded text-sm">--</div>}
             </div>
           </div>
        </div>

        {/* 3. PARACLÍNICOS RÁPIDOS (POINT OF CARE) */}
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
    </Card>
  );
}
