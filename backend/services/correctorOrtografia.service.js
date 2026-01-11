const { OpenAI } = require('openai');

/**
 * Servicio de corrección ortográfica impulsado por IA
 * Utiliza OpenAI para corregir textos médicos manteniendo terminología correcta
 */
class CorrectorOrtografiaService {
  constructor() {
    this.openai = null;
    this.habilitado = false;

    // Inicializar OpenAI solo si la API key está configurada
    if (process.env.OPENAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        this.habilitado = true;
        console.log('[CorrectorOrtografia] Servicio habilitado con OpenAI');
      } catch (error) {
        console.error('[CorrectorOrtografia] Error al inicializar OpenAI:', error);
        this.habilitado = false;
      }
    } else {
      console.log('[CorrectorOrtografia] OPENAI_API_KEY no configurada. Servicio deshabilitado.');
    }
  }

  /**
   * Corrige ortografía y gramática en texto médico
   * @param {string} texto - Texto a corregir
   * @param {string} contexto - Contexto del texto ('medico', 'general')
   * @returns {Promise<object>} - { textoCorregido, cambios[], error }
   */
  async corregirTexto(texto, contexto = 'medico') {
    // Validaciones básicas
    if (!texto || typeof texto !== 'string') {
      return {
        textoCorregido: texto || '',
        cambios: [],
        error: false
      };
    }

    if (texto.length < 3) {
      return {
        textoCorregido: texto,
        cambios: [],
        error: false
      };
    }

    // Si el servicio no está habilitado, retornar texto sin cambios
    if (!this.habilitado) {
      return {
        textoCorregido: texto,
        cambios: [],
        error: false,
        mensaje: 'Servicio de corrección no disponible (OpenAI no configurado)'
      };
    }

    try {
      const prompt = this._construirPrompt(texto, contexto);
      const modelo = process.env.OPENAI_MODEL || 'gpt-4o';

      const completion = await this.openai.chat.completions.create({
        model: modelo,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const respuesta = JSON.parse(completion.choices[0].message.content);

      return {
        textoCorregido: respuesta.textoCorregido || texto,
        cambios: respuesta.cambios || [],
        error: false
      };
    } catch (error) {
      console.error('[CorrectorOrtografia] Error al corregir texto:', error);
      return {
        textoCorregido: texto,
        cambios: [],
        error: true,
        mensaje: 'Error al procesar la corrección'
      };
    }
  }

  /**
   * Construye el prompt para OpenAI según el contexto
   * @param {string} texto - Texto a corregir
   * @param {string} contexto - Contexto del texto
   * @returns {string} - Prompt para OpenAI
   * @private
   */
  _construirPrompt(texto, contexto) {
    if (contexto === 'medico') {
      return `Eres un corrector de ortografía especializado en terminología médica en español de Colombia.

Tu tarea es corregir ÚNICAMENTE errores ortográficos y gramaticales en el siguiente texto médico.

REGLAS ESTRICTAS:
1. NO cambies terminología médica correcta (CIE-10, CIE-11, CUPS, nombres de medicamentos, etc.)
2. NO agregues ni quites información clínica
3. NO cambies el sentido o significado del texto
4. NO hagas sugerencias de estilo, solo correcciones de errores objetivos
5. Respeta abreviaturas médicas comunes (Dx, Tx, Hx, Rx, etc.)
6. Mantén el formato y estructura del texto original

Texto a corregir:
"${texto}"

Retorna la respuesta en formato JSON con esta estructura exacta:
{
  "textoCorregido": "texto corregido aquí",
  "cambios": [
    {
      "original": "palabra o frase original con error",
      "correccion": "palabra o frase corregida",
      "razon": "breve explicación del error (ej: 'error ortográfico', 'concordancia', 'tildes')"
    }
  ]
}

Si no hay errores, retorna el texto original en "textoCorregido" y un array vacío en "cambios".`;
    } else {
      return `Corrige los errores ortográficos y gramaticales en el siguiente texto en español de Colombia.

Texto:
"${texto}"

Retorna la respuesta en formato JSON con esta estructura exacta:
{
  "textoCorregido": "texto corregido aquí",
  "cambios": [
    {
      "original": "palabra o frase original",
      "correccion": "palabra o frase corregida",
      "razon": "breve explicación del error"
    }
  ]
}`;
    }
  }

  /**
   * Verifica si el servicio está habilitado
   * @returns {boolean}
   */
  estaHabilitado() {
    return this.habilitado;
  }

  /**
   * Obtiene estadísticas del servicio
   * @returns {object}
   */
  obtenerEstado() {
    return {
      habilitado: this.habilitado,
      modelo: process.env.OPENAI_MODEL || 'gpt-4o',
      apiKeyConfigurada: !!process.env.OPENAI_API_KEY
    };
  }
}

module.exports = new CorrectorOrtografiaService();
