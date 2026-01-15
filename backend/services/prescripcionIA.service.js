/**
 * Servicio de Cálculo Inteligente de Prescripciones
 * Combina lógica algorítmica + IA para calcular cantidades óptimas de medicamentos
 */
const { ValidationError } = require('../utils/errors');
const prisma = require('../db/prisma');

class PrescripcionIAService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.baseUrl = 'https://api.openai.com/v1';

    // Mapeo de frecuencias a tomas por día
    this.frecuenciasPorDia = {
      'Unica': 1,
      'Cada4Horas': 6,
      'Cada6Horas': 4,
      'Cada8Horas': 3,
      'Cada12Horas': 2,
      'Cada24Horas': 1,
      'Cada48Horas': 0.5,
      'Cada72Horas': 0.33,
      'PRN': 3, // Estimado promedio
      'BID': 2, // Dos veces al día
      'TID': 3, // Tres veces al día
      'QID': 4, // Cuatro veces al día
    };

    // Presentaciones comunes por forma farmacéutica
    this.presentacionesComunes = {
      'tableta': [10, 14, 20, 28, 30, 60, 100],
      'capsula': [10, 14, 20, 28, 30, 60, 100],
      'jarabe': [60, 100, 120, 150, 200, 240], // ml
      'suspension': [60, 100, 120, 150, 200], // ml
      'gotas': [5, 10, 15, 20, 30], // ml
      'crema': [15, 20, 30, 40, 60], // g
      'unguento': [15, 20, 30, 40], // g
      'ampolla': [1, 3, 5, 6, 10, 25],
      'vial': [1, 5, 10],
      'sobre': [10, 14, 20, 30],
      'parche': [4, 7, 14, 28, 30],
      'inhalador': [1, 200], // dosis por inhalador
      'ovulo': [3, 6, 7, 10],
      'supositorio': [5, 6, 10, 12],
    };

    // System prompt para cálculo de medicamentos
    this.systemPrompt = `Eres un asistente farmacéutico experto en cálculo de dosis y cantidades de medicamentos. Tu trabajo es ayudar a calcular la cantidad exacta de medicamento que necesita un paciente.

REGLAS IMPORTANTES:
1. SIEMPRE redondea hacia ARRIBA la cantidad de envases/frascos
2. Considera que los medicamentos se venden en presentaciones comerciales específicas
3. Para LÍQUIDOS (jarabes, suspensiones, gotas): calcula ml totales y sugiere cuántos frascos
4. Para SÓLIDOS (tabletas, cápsulas): calcula unidades totales y sugiere cuántas cajas
5. Para TÓPICOS (cremas, ungüentos): considera área de aplicación y frecuencia
6. Detecta posibles errores de dosificación (dosis muy altas o muy bajas)
7. Considera rangos de dosis pediátricos vs adultos según edad del paciente

FORMATO DE RESPUESTA (JSON estricto):
{
  "cantidadTotal": número,
  "unidadCantidad": "tabletas|ml|g|ampollas|etc",
  "presentacionSugerida": "descripción de presentación recomendada",
  "cantidadEnvases": número,
  "calculoDetallado": "explicación paso a paso",
  "alertas": ["lista de alertas si las hay"],
  "dosisValidacion": {
    "esCorrecta": true|false,
    "mensaje": "mensaje si hay problema",
    "rangoNormal": "rango esperado"
  },
  "recomendaciones": ["sugerencias adicionales"],
  "costoEstimado": número o null
}`;
  }

  /**
   * Verificar que el servicio esté configurado
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Cálculo básico algorítmico (sin IA)
   */
  calculoBasico(medicamento, dosis, frecuencia, duracionDias, formaFarmaceutica = 'tableta') {
    const tomasPorDia = this.frecuenciasPorDia[frecuencia] || 1;
    const dias = parseInt(duracionDias) || 1;

    // Calcular cantidad total de tomas
    const totalTomas = Math.ceil(tomasPorDia * dias);

    // Extraer valor numérico de la dosis si es string
    let dosisNumerica = 1;
    if (typeof dosis === 'string') {
      const match = dosis.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        dosisNumerica = parseFloat(match[1]);
      }
    } else if (typeof dosis === 'number') {
      dosisNumerica = dosis;
    }

    // Calcular cantidad total según forma farmacéutica
    let cantidadTotal = totalTomas;
    let unidad = 'unidades';
    let cantidadPorToma = dosisNumerica;

    const formaLower = formaFarmaceutica?.toLowerCase() || 'tableta';

    if (['jarabe', 'suspension', 'solucion', 'elixir'].some(f => formaLower.includes(f))) {
      // Líquidos: ml por toma × tomas totales
      cantidadTotal = Math.ceil(cantidadPorToma * totalTomas);
      unidad = 'ml';
    } else if (['gotas', 'colirio', 'gotas oftalmicas', 'gotas oticas'].some(f => formaLower.includes(f))) {
      // Gotas: aproximadamente 20 gotas por ml
      const gotasPorMl = 20;
      const mlTotales = Math.ceil((cantidadPorToma * totalTomas) / gotasPorMl);
      cantidadTotal = mlTotales;
      unidad = 'ml (aprox)';
    } else if (['crema', 'unguento', 'gel', 'pomada'].some(f => formaLower.includes(f))) {
      // Tópicos: estimado de 0.5-1g por aplicación
      cantidadTotal = Math.ceil(1 * totalTomas);
      unidad = 'g (estimado)';
    } else if (['ampolla', 'vial', 'inyectable'].some(f => formaLower.includes(f))) {
      cantidadTotal = totalTomas;
      unidad = 'ampollas';
    } else {
      // Tabletas, cápsulas, etc.
      cantidadTotal = Math.ceil(cantidadPorToma * totalTomas);
      unidad = 'unidades';
    }

    // Sugerir cantidad de envases
    const presentaciones = this.presentacionesComunes[formaLower] || [30];
    const presentacionOptima = this.encontrarPresentacionOptima(cantidadTotal, presentaciones);

    return {
      cantidadTotal,
      unidadCantidad: unidad,
      tomasPorDia,
      totalDias: dias,
      totalTomas,
      presentacionSugerida: `${presentacionOptima.tamano} ${unidad}`,
      cantidadEnvases: presentacionOptima.cantidadEnvases,
      calculoDetallado: `${tomasPorDia} toma(s)/día × ${dias} día(s) × ${dosisNumerica} ${unidad}/toma = ${cantidadTotal} ${unidad}`,
      metodo: 'algoritmico'
    };
  }

  /**
   * Encontrar la presentación óptima (mínimo desperdicio)
   */
  encontrarPresentacionOptima(cantidadNecesaria, presentaciones) {
    let mejorOpcion = { tamano: presentaciones[0], cantidadEnvases: 1, desperdicio: Infinity };

    for (const tamano of presentaciones) {
      const cantidadEnvases = Math.ceil(cantidadNecesaria / tamano);
      const totalUnidades = cantidadEnvases * tamano;
      const desperdicio = totalUnidades - cantidadNecesaria;

      if (desperdicio < mejorOpcion.desperdicio ||
          (desperdicio === mejorOpcion.desperdicio && cantidadEnvases < mejorOpcion.cantidadEnvases)) {
        mejorOpcion = { tamano, cantidadEnvases, desperdicio };
      }
    }

    return mejorOpcion;
  }

  /**
   * Cálculo inteligente con IA
   */
  async calculoInteligente(datos) {
    const {
      medicamento,
      principioActivo,
      concentracion,
      formaFarmaceutica,
      dosis,
      via,
      frecuencia,
      duracionDias,
      instrucciones,
      paciente = {},
      presentacionesDisponibles = []
    } = datos;

    // Primero hacer cálculo básico como fallback
    const calculoBase = this.calculoBasico(medicamento, dosis, frecuencia, duracionDias, formaFarmaceutica);

    // Si no hay API key, retornar solo el cálculo básico
    if (!this.isConfigured()) {
      return {
        ...calculoBase,
        metodo: 'algoritmico',
        nota: 'IA no disponible - usando cálculo algorítmico'
      };
    }

    try {
      const prompt = this.construirPromptCalculo(datos, calculoBase);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3, // Baja temperatura para cálculos precisos
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        console.error('[PrescripcionIA] Error API:', response.status);
        return { ...calculoBase, metodo: 'algoritmico', nota: 'Error en IA - usando cálculo algorítmico' };
      }

      const result = await response.json();
      const contenido = result.choices?.[0]?.message?.content;

      if (!contenido) {
        return { ...calculoBase, metodo: 'algoritmico', nota: 'Respuesta vacía de IA' };
      }

      const respuestaIA = JSON.parse(contenido);

      return {
        ...respuestaIA,
        calculoAlgoritmico: calculoBase,
        metodo: 'ia',
        modeloUsado: this.model
      };

    } catch (error) {
      console.error('[PrescripcionIA] Error:', error.message);
      return {
        ...calculoBase,
        metodo: 'algoritmico',
        nota: `Error IA: ${error.message}`
      };
    }
  }

  /**
   * Construir prompt para el cálculo
   */
  construirPromptCalculo(datos, calculoBase) {
    const {
      medicamento,
      principioActivo,
      concentracion,
      formaFarmaceutica,
      dosis,
      via,
      frecuencia,
      duracionDias,
      instrucciones,
      paciente = {},
      presentacionesDisponibles = []
    } = datos;

    // Determinar si es pediátrico
    const esPediatrico = paciente.edad && paciente.edad < 18;
    const peso = paciente.peso || null;

    return `
CALCULAR CANTIDAD DE MEDICAMENTO:

**Medicamento:** ${medicamento}
**Principio Activo:** ${principioActivo || 'No especificado'}
**Concentración:** ${concentracion || 'No especificada'}
**Forma Farmacéutica:** ${formaFarmaceutica || 'Tableta'}

**Prescripción:**
- Dosis por toma: ${dosis}
- Vía de administración: ${via}
- Frecuencia: ${frecuencia}
- Duración: ${duracionDias} días
- Instrucciones: ${instrucciones || 'Ninguna especial'}

**Paciente:**
- Edad: ${paciente.edad ? `${paciente.edad} años` : 'No especificada'}${esPediatrico ? ' (PEDIÁTRICO)' : ''}
- Peso: ${peso ? `${peso} kg` : 'No especificado'}
- Género: ${paciente.genero || 'No especificado'}

**Cálculo algorítmico base:**
- Tomas por día: ${calculoBase.tomasPorDia}
- Total días: ${calculoBase.totalDias}
- Cantidad total calculada: ${calculoBase.cantidadTotal} ${calculoBase.unidadCantidad}

${presentacionesDisponibles.length > 0 ? `**Presentaciones disponibles en inventario:**\n${presentacionesDisponibles.map(p => `- ${p}`).join('\n')}` : ''}

Por favor:
1. Valida si la dosis es apropiada para ${esPediatrico ? 'un paciente pediátrico' : 'un adulto'}
2. Calcula la cantidad exacta necesaria
3. Sugiere la presentación comercial más adecuada
4. Indica cuántos envases/frascos necesita
5. Detecta cualquier alerta o problema potencial

Responde SOLO con el JSON especificado, sin texto adicional.`;
  }

  /**
   * Detectar errores de dosificación comunes
   */
  async detectarErroresDosificacion(datos) {
    const { medicamento, principioActivo, dosis, paciente = {} } = datos;

    if (!this.isConfigured()) {
      return { alertas: [], validado: false, nota: 'IA no disponible para validación' };
    }

    try {
      const prompt = `
Analiza esta prescripción y detecta posibles errores:

Medicamento: ${medicamento}
Principio Activo: ${principioActivo || 'No especificado'}
Dosis: ${dosis}
Edad paciente: ${paciente.edad || 'No especificada'}
Peso paciente: ${paciente.peso || 'No especificado'} kg

Responde en JSON:
{
  "dosisValida": true|false,
  "alertas": ["lista de alertas si las hay"],
  "rangoNormalDosis": "rango esperado",
  "recomendacion": "texto si hay problema"
}`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: 'Eres un farmacéutico experto en validación de dosis. Responde solo en JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 500,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        return { alertas: [], validado: false };
      }

      const result = await response.json();
      return JSON.parse(result.choices?.[0]?.message?.content || '{}');

    } catch (error) {
      console.error('[PrescripcionIA] Error validación:', error.message);
      return { alertas: [], validado: false, error: error.message };
    }
  }

  /**
   * Obtener información del producto desde la base de datos
   */
  async obtenerInfoProducto(productoId) {
    try {
      const producto = await prisma.producto.findUnique({
        where: { id: productoId },
        select: {
          id: true,
          nombre: true,
          principioActivo: true,
          concentracion: true,
          formaFarmaceutica: true,
          presentacion: true,
          precioVenta: true,
          unidadMedida: true,
          requiereReceta: true,
        }
      });
      return producto;
    } catch (error) {
      console.error('[PrescripcionIA] Error obteniendo producto:', error);
      return null;
    }
  }

  /**
   * Obtener información del paciente
   */
  async obtenerInfoPaciente(pacienteId) {
    try {
      const paciente = await prisma.paciente.findUnique({
        where: { id: pacienteId },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          fechaNacimiento: true,
          genero: true,
          peso: true,
          altura: true,
          alergias: true,
        }
      });

      if (paciente?.fechaNacimiento) {
        const hoy = new Date();
        const nacimiento = new Date(paciente.fechaNacimiento);
        paciente.edad = Math.floor((hoy - nacimiento) / (365.25 * 24 * 60 * 60 * 1000));
      }

      return paciente;
    } catch (error) {
      console.error('[PrescripcionIA] Error obteniendo paciente:', error);
      return null;
    }
  }
}

module.exports = new PrescripcionIAService();
