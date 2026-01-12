/**
 * Service para documentos legales de pacientes
 * (términos y condiciones, política de privacidad, etc.)
 */
const prisma = require('../db/prisma');
const { NotFoundError, ValidationError } = require('../utils/errors');

class DocumentoLegalService {
  /**
   * Obtener todos los documentos legales
   */
  async getAll() {
    return prisma.documentoLegalPaciente.findMany({
      orderBy: { tipo: 'asc' }
    });
  }

  /**
   * Obtener un documento por tipo (público)
   */
  async getByTipo(tipo) {
    const documento = await prisma.documentoLegalPaciente.findUnique({
      where: { tipo }
    });

    if (!documento) {
      throw new NotFoundError(`Documento de tipo ${tipo} no encontrado`);
    }

    return documento;
  }

  /**
   * Obtener un documento por ID
   */
  async getById(id) {
    const documento = await prisma.documentoLegalPaciente.findUnique({
      where: { id }
    });

    if (!documento) {
      throw new NotFoundError('Documento no encontrado');
    }

    return documento;
  }

  /**
   * Crear un nuevo documento legal
   */
  async create(data, userId = null) {
    // Verificar si ya existe un documento de este tipo
    const existing = await prisma.documentoLegalPaciente.findUnique({
      where: { tipo: data.tipo }
    });

    if (existing) {
      throw new ValidationError(`Ya existe un documento de tipo ${data.tipo}. Use actualizar en su lugar.`);
    }

    return prisma.documentoLegalPaciente.create({
      data: {
        tipo: data.tipo,
        titulo: data.titulo,
        contenido: data.contenido,
        version: data.version || '1.0',
        activo: data.activo !== undefined ? data.activo : true,
        createdBy: userId,
        updatedBy: userId
      }
    });
  }

  /**
   * Actualizar un documento legal
   */
  async update(id, data, userId = null) {
    const existing = await prisma.documentoLegalPaciente.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Documento no encontrado');
    }

    return prisma.documentoLegalPaciente.update({
      where: { id },
      data: {
        titulo: data.titulo !== undefined ? data.titulo : existing.titulo,
        contenido: data.contenido !== undefined ? data.contenido : existing.contenido,
        version: data.version !== undefined ? data.version : existing.version,
        activo: data.activo !== undefined ? data.activo : existing.activo,
        updatedBy: userId
      }
    });
  }

  /**
   * Actualizar o crear documento por tipo (upsert)
   */
  async upsertByTipo(tipo, data, userId = null) {
    return prisma.documentoLegalPaciente.upsert({
      where: { tipo },
      create: {
        tipo,
        titulo: data.titulo,
        contenido: data.contenido,
        version: data.version || '1.0',
        activo: data.activo !== undefined ? data.activo : true,
        createdBy: userId,
        updatedBy: userId
      },
      update: {
        titulo: data.titulo,
        contenido: data.contenido,
        version: data.version,
        activo: data.activo,
        updatedBy: userId
      }
    });
  }

  /**
   * Eliminar un documento legal
   */
  async delete(id) {
    const existing = await prisma.documentoLegalPaciente.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundError('Documento no encontrado');
    }

    return prisma.documentoLegalPaciente.delete({
      where: { id }
    });
  }

  /**
   * Obtener términos y condiciones (público)
   */
  async getTerminosCondiciones() {
    const doc = await prisma.documentoLegalPaciente.findUnique({
      where: { tipo: 'TERMINOS_CONDICIONES' }
    });

    if (!doc || !doc.activo) {
      return null;
    }

    return doc;
  }

  /**
   * Obtener política de privacidad (público)
   */
  async getPoliticaPrivacidad() {
    const doc = await prisma.documentoLegalPaciente.findUnique({
      where: { tipo: 'POLITICA_PRIVACIDAD' }
    });

    if (!doc || !doc.activo) {
      return null;
    }

    return doc;
  }

  /**
   * Inicializar documentos con contenido de ejemplo
   */
  async seedDocumentos() {
    const terminosExist = await prisma.documentoLegalPaciente.findUnique({
      where: { tipo: 'TERMINOS_CONDICIONES' }
    });

    const privacidadExist = await prisma.documentoLegalPaciente.findUnique({
      where: { tipo: 'POLITICA_PRIVACIDAD' }
    });

    const results = [];

    if (!terminosExist) {
      const terminos = await this.create({
        tipo: 'TERMINOS_CONDICIONES',
        titulo: 'Términos y Condiciones de Servicio',
        contenido: this.getTerminosEjemplo(),
        version: '1.0'
      });
      results.push(terminos);
    }

    if (!privacidadExist) {
      const privacidad = await this.create({
        tipo: 'POLITICA_PRIVACIDAD',
        titulo: 'Política de Privacidad y Tratamiento de Datos',
        contenido: this.getPoliticaEjemplo(),
        version: '1.0'
      });
      results.push(privacidad);
    }

    return results;
  }

  /**
   * Contenido de ejemplo para términos y condiciones
   */
  getTerminosEjemplo() {
    return `# Términos y Condiciones de Servicio

## Clínica MIA - Ibagué, Tolima

**Última actualización:** ${new Date().toLocaleDateString('es-CO')}

### 1. Aceptación de los Términos

Al acceder y utilizar los servicios de Clínica MIA, usted acepta estar sujeto a estos términos y condiciones de servicio. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.

### 2. Descripción del Servicio

Clínica MIA ofrece servicios de atención médica incluyendo:
- Consultas médicas generales y especializadas
- Servicios de diagnóstico y laboratorio
- Procedimientos médicos ambulatorios
- Hospitalización
- Servicios de urgencias
- Farmacia

### 3. Agendamiento de Citas

3.1. Las citas médicas pueden ser agendadas a través de nuestra plataforma web, telefónicamente o presencialmente.

3.2. Para agendar una cita, el paciente debe proporcionar información personal verídica y actualizada.

3.3. La confirmación de la cita está sujeta a la disponibilidad del profesional de salud seleccionado.

### 4. Política de Cancelación

4.1. Las cancelaciones deben realizarse con al menos 24 horas de anticipación.

4.2. Las cancelaciones tardías o inasistencias sin previo aviso pueden estar sujetas a cargos administrativos.

4.3. Tres inasistencias consecutivas sin justificación pueden resultar en restricción temporal del servicio de agendamiento en línea.

### 5. Pagos y Facturación

5.1. Los precios de los servicios están sujetos a cambio sin previo aviso.

5.2. El pago puede realizarse mediante efectivo, tarjeta débito, tarjeta crédito o transferencia bancaria.

5.3. Para pacientes con EPS, se requiere presentar documentación vigente al momento de la cita.

### 6. Responsabilidades del Paciente

El paciente se compromete a:
- Proporcionar información médica completa y veraz
- Seguir las indicaciones médicas proporcionadas
- Informar sobre alergias, medicamentos actuales y condiciones preexistentes
- Llegar puntualmente a las citas programadas
- Mantener actualizados sus datos de contacto

### 7. Limitación de Responsabilidad

7.1. Clínica MIA no se hace responsable por:
- Complicaciones derivadas de información médica incompleta o inexacta proporcionada por el paciente
- Resultados médicos que dependan de factores fuera del control de los profesionales de salud
- Interrupciones del servicio por causas de fuerza mayor

### 8. Propiedad Intelectual

Todo el contenido de la plataforma, incluyendo textos, gráficos, logos, imágenes y software, es propiedad de Clínica MIA y está protegido por las leyes de propiedad intelectual de Colombia.

### 9. Modificaciones

Clínica MIA se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en la plataforma.

### 10. Ley Aplicable

Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa será sometida a la jurisdicción de los tribunales de Ibagué, Tolima.

### 11. Contacto

Para consultas sobre estos términos:
- **Dirección:** Cra. 5 #28-85, Ibagué, Tolima
- **Teléfono:** 324 333 8555
- **Email:** info@clinicamiacolombia.com

---
*Clínica MIA - Comprometidos con tu salud*`;
  }

  /**
   * Contenido de ejemplo para política de privacidad
   */
  getPoliticaEjemplo() {
    return `# Política de Privacidad y Tratamiento de Datos Personales

## Clínica MIA - Ibagué, Tolima

**Última actualización:** ${new Date().toLocaleDateString('es-CO')}

En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, Clínica MIA informa su política de tratamiento de datos personales.

### 1. Responsable del Tratamiento

**CLÍNICA MIA S.A.S.**
- NIT: [NIT de la empresa]
- Dirección: Cra. 5 #28-85, Ibagué, Tolima
- Teléfono: 324 333 8555
- Email: protecciondedatos@clinicamiacolombia.com

### 2. Datos que Recopilamos

Recopilamos los siguientes tipos de datos personales:

**Datos de identificación:**
- Nombre completo
- Tipo y número de documento de identidad
- Fecha de nacimiento
- Género
- Estado civil

**Datos de contacto:**
- Dirección de residencia
- Teléfono fijo y móvil
- Correo electrónico
- Contacto de emergencia

**Datos de salud (datos sensibles):**
- Historia clínica
- Antecedentes médicos
- Resultados de exámenes y diagnósticos
- Tratamientos y medicamentos
- Alergias

**Datos financieros:**
- Información de EPS/Prepagada
- Datos de facturación

### 3. Finalidades del Tratamiento

Sus datos personales serán utilizados para:

1. **Prestación de servicios de salud:**
   - Atención médica y hospitalaria
   - Elaboración y gestión de historia clínica
   - Seguimiento a tratamientos
   - Remisión a especialistas

2. **Gestión administrativa:**
   - Agendamiento de citas
   - Facturación y cobro de servicios
   - Comunicación sobre citas y servicios

3. **Cumplimiento legal:**
   - Reportes a entidades de salud (Secretaría de Salud, Superintendencia)
   - Reportes epidemiológicos obligatorios
   - Auditorías de calidad

4. **Mejora del servicio:**
   - Encuestas de satisfacción
   - Análisis estadísticos (datos anonimizados)

### 4. Derechos del Titular

Usted tiene derecho a:

- **Conocer:** Acceder a sus datos personales
- **Actualizar:** Corregir datos inexactos o incompletos
- **Rectificar:** Modificar información errónea
- **Suprimir:** Solicitar eliminación de datos (cuando sea procedente)
- **Revocar:** Retirar el consentimiento otorgado
- **Acceder:** Obtener copia de sus datos

### 5. Procedimiento para Ejercer sus Derechos

Para ejercer sus derechos, puede:

1. Enviar solicitud escrita a: protecciondedatos@clinicamiacolombia.com
2. Presentarse en nuestras instalaciones con documento de identidad
3. Llamar a nuestra línea de atención: 324 333 8555

**Tiempos de respuesta:**
- Consultas: 10 días hábiles
- Reclamos: 15 días hábiles

### 6. Seguridad de la Información

Implementamos medidas de seguridad técnicas, humanas y administrativas para proteger sus datos:

- Encriptación de datos sensibles
- Control de acceso basado en roles
- Capacitación al personal en protección de datos
- Auditorías periódicas de seguridad
- Respaldo seguro de información

### 7. Transferencia de Datos

Sus datos pueden ser compartidos con:

- Otras IPS para continuidad de atención
- EPS y aseguradoras para facturación
- Laboratorios y centros de diagnóstico
- Autoridades sanitarias (cuando sea obligatorio)

En todos los casos, exigimos a los terceros el cumplimiento de la normativa de protección de datos.

### 8. Conservación de Datos

- **Historia clínica:** 20 años después de la última atención (Resolución 1995 de 1999)
- **Datos de contacto:** Mientras exista relación con el paciente
- **Datos de facturación:** 10 años (normativa tributaria)

### 9. Uso de Cookies

Nuestra plataforma web utiliza cookies para:
- Mejorar la experiencia de navegación
- Recordar preferencias del usuario
- Análisis de uso del sitio

Puede desactivar las cookies en la configuración de su navegador.

### 10. Menores de Edad

El tratamiento de datos de menores de edad requiere autorización del representante legal, conforme a la ley.

### 11. Cambios en la Política

Nos reservamos el derecho de modificar esta política. Los cambios serán publicados en nuestra página web.

### 12. Autorización

Al utilizar nuestros servicios, usted autoriza el tratamiento de sus datos personales conforme a esta política.

### 13. Contacto

**Oficial de Protección de Datos:**
- Email: protecciondedatos@clinicamiacolombia.com
- Teléfono: 324 333 8555
- Dirección: Cra. 5 #28-85, Ibagué, Tolima

---
*Clínica MIA - Tu privacidad es nuestra prioridad*`;
  }
}

module.exports = new DocumentoLegalService();
