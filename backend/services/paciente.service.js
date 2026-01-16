/**
 * Service de pacientes
 */
const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { saveBase64Image, deleteFile } = require('../utils/upload');
const { hashPassword } = require('../utils/auth');
const emailService = require('./email.service');

// Siigo integration for customer synchronization
let customerSiigoService = null;
let siigoService = null;

const getSiigoServices = () => {
  if (!customerSiigoService) {
    try {
      customerSiigoService = require('./siigo/customer.siigo.service');
      siigoService = require('./siigo/siigo.service');
    } catch (e) {
      console.warn('[Paciente] Siigo services not available:', e.message);
    }
  }
  return { customerSiigoService, siigoService };
};

class PacienteService {
  /**
   * Obtener todos los pacientes con paginación
   */
  async getAll({ page = 1, limit = 10, search = '' }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      // activo: true,
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
          { cedula: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.paciente.count({where:{...where,activo:true} }),
    ]);

    return {
      pacientes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Obtener un paciente por ID
   */
  async getById(id) {
    const paciente = await prisma.paciente.findUnique({
      where: { id, activo: true },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    return paciente;
  }

  /**
   * Crear un paciente
   */
  async create(data) {
    // Validar cédula única
    if (data.cedula) {
      const existing = await prisma.paciente.findUnique({ 
        where: { cedula: data.cedula } 
      });
      
      if (existing) {
        throw new ValidationError('La cédula ya está registrada');
      }
    }

    // Crear paciente
    // Mapear campos de snake_case (schema) a camelCase (prisma)
    const paciente = await prisma.paciente.create({
      data: {
        // Datos Personales
        nombre: data.nombre,
        apellido: data.apellido,
        tipoDocumento: data.tipo_documento,
        cedula: data.cedula,
        lugarExpedicion: data.lugar_expedicion,
        fechaNacimiento: data.fecha_nacimiento,
        genero: data.genero,
        identidadGenero: data.identidad_genero,
        etnia: data.etnia,
        preferenciaLlamado: data.preferencia_llamado,
        estadoCivil: data.estado_civil,

        // Ubicación
        paisNacimiento: data.pais_nacimiento,
        departamento: data.departamento,
        municipio: data.municipio,
        barrio: data.barrio,
        direccion: data.direccion,
        zona: data.zona,

        // Contacto
        telefono: data.telefono,
        email: data.email,

        // Contactos de Emergencia (JSON)
        contactosEmergencia: data.contactos_emergencia,

        // Acompañante y Responsable (JSON)
        acompanante: data.acompanante,
        responsable: data.responsable,

        // Aseguramiento
        eps: data.eps,
        regimen: data.regimen,
        tipoAfiliacion: data.tipo_afiliacion,
        nivelSisben: data.nivel_sisben,
        numeroAutorizacion: data.numero_autorizacion,
        fechaAfiliacion: data.fecha_afiliacion,
        convenio: data.convenio,
        carnetPoliza: data.carnet_poliza,
        arl: data.arl,

        // Información Demográfica y Laboral
        ocupacion: data.ocupacion,
        nivelEducacion: data.nivel_educacion,
        empleadorActual: data.empleador_actual,
        tipoUsuario: data.tipo_usuario,

        // Información de Referencia
        referidoPor: data.referido_por,
        nombreRefiere: data.nombre_refiere,
        tipoPaciente: data.tipo_paciente,
        categoria: data.categoria,

        // Discapacidad
        discapacidad: data.discapacidad,
        tipoDiscapacidad: data.tipo_discapacidad,

        // Información Médica
        tipoSangre: data.tipo_sangre,
        peso: data.peso,
        altura: data.altura,
        alergias: data.alergias,
        enfermedadesCronicas: data.enfermedades_cronicas,
        medicamentosActuales: data.medicamentos_actuales,
        antecedentesQuirurgicos: data.antecedentes_quirurgicos,
      },
    });

    // Sincronizar con Siigo de forma asíncrona (no bloquea la respuesta)
    this.syncPacienteConSiigoAsync(paciente.id).catch(err => {
      console.error(`[Paciente] Error sincronizando paciente ${paciente.id} con Siigo:`, err.message);
    });

    // Crear usuario de paciente automáticamente (async, no bloqueante)
    this.crearUsuarioPacienteAsync(paciente, data.cedula).catch(err => {
      console.error(`[Paciente] Error creando usuario para paciente ${paciente.id}:`, err.message);
    });

    return paciente;
  }

  /**
   * Crear usuario automáticamente para un paciente nuevo
   * Usuario: email del paciente
   * Contraseña: número de documento (cédula)
   */
  async crearUsuarioPacienteAsync(paciente, passwordPlain) {
    try {
      // Verificar que el paciente tiene email
      if (!paciente.email) {
        console.log(`[Paciente] No se puede crear usuario: paciente ${paciente.id} no tiene email`);
        return;
      }

      // Verificar que no existe usuario con este email
      const existingUser = await prisma.usuario.findUnique({
        where: { email: paciente.email }
      });

      if (existingUser) {
        console.log(`[Paciente] Usuario ya existe para email ${paciente.email}`);
        return;
      }

      // Hashear la contraseña (número de documento)
      const hashedPassword = await hashPassword(passwordPlain);

      // Crear usuario con rol PATIENT
      const usuario = await prisma.usuario.create({
        data: {
          email: paciente.email,
          password: hashedPassword,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          rol: 'PATIENT',
          telefono: paciente.telefono,
          cedula: paciente.cedula,
        },
      });

      console.log(`[Paciente] ✓ Usuario creado para paciente ${paciente.id}: ${usuario.email}`);

      // Intentar asignar rol en la tabla de roles relacionales
      try {
        const role = await prisma.role.findUnique({ where: { name: 'PATIENT' } });
        if (role) {
          await prisma.userRole.create({
            data: {
              usuarioId: usuario.id,
              roleId: role.id
            }
          });
        }
      } catch (roleErr) {
        console.warn('[Paciente] No se pudo asignar rol relacional:', roleErr.message);
      }

      // Enviar email de bienvenida con credenciales
      const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
      emailService.sendWelcomeEmail({
        to: paciente.email,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        password: passwordPlain, // Enviar contraseña sin hashear en el email
        loginUrl: `${frontendUrl}/login`
      }).then(result => {
        if (result.success) {
          console.log(`[Paciente] ✓ Email de bienvenida enviado a: ${paciente.email}`);
        } else {
          console.warn(`[Paciente] No se pudo enviar email de bienvenida: ${result.error}`);
        }
      }).catch(err => {
        console.error(`[Paciente] Error enviando email de bienvenida:`, err.message);
      });

      return usuario;
    } catch (error) {
      console.error(`[Paciente] Error en crearUsuarioPacienteAsync:`, error.message);
      throw error;
    }
  }

  /**
   * Actualizar un paciente
   */
  async update(id, data) {
    // Verificar que existe
    await this.getById(id);

    // Mapear campos de snake_case (schema) a camelCase (prisma)
    const updateData = {};

    // Datos Personales
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.apellido !== undefined) updateData.apellido = data.apellido;
    if (data.tipo_documento !== undefined) updateData.tipoDocumento = data.tipo_documento;
    if (data.cedula !== undefined) updateData.cedula = data.cedula;
    if (data.lugar_expedicion !== undefined) updateData.lugarExpedicion = data.lugar_expedicion;
    if (data.fecha_nacimiento !== undefined) updateData.fechaNacimiento = data.fecha_nacimiento;
    if (data.genero !== undefined) updateData.genero = data.genero;
    if (data.identidad_genero !== undefined) updateData.identidadGenero = data.identidad_genero;
    if (data.etnia !== undefined) updateData.etnia = data.etnia;
    if (data.preferencia_llamado !== undefined) updateData.preferenciaLlamado = data.preferencia_llamado;
    if (data.estado_civil !== undefined) updateData.estadoCivil = data.estado_civil;

    // Ubicación
    if (data.pais_nacimiento !== undefined) updateData.paisNacimiento = data.pais_nacimiento;
    if (data.departamento !== undefined) updateData.departamento = data.departamento;
    if (data.municipio !== undefined) updateData.municipio = data.municipio;
    if (data.barrio !== undefined) updateData.barrio = data.barrio;
    if (data.direccion !== undefined) updateData.direccion = data.direccion;
    if (data.zona !== undefined) updateData.zona = data.zona;

    // Contacto
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.contactos_emergencia !== undefined) updateData.contactosEmergencia = data.contactos_emergencia;

    // Acompañante y Responsable
    if (data.acompanante !== undefined) updateData.acompanante = data.acompanante;
    if (data.responsable !== undefined) updateData.responsable = data.responsable;

    // Aseguramiento
    if (data.eps !== undefined) updateData.eps = data.eps;
    if (data.regimen !== undefined) updateData.regimen = data.regimen;
    if (data.tipo_afiliacion !== undefined) updateData.tipoAfiliacion = data.tipo_afiliacion;
    if (data.nivel_sisben !== undefined) updateData.nivelSisben = data.nivel_sisben;
    if (data.numero_autorizacion !== undefined) updateData.numeroAutorizacion = data.numero_autorizacion;
    if (data.fecha_afiliacion !== undefined) updateData.fechaAfiliacion = data.fecha_afiliacion;
    if (data.convenio !== undefined) updateData.convenio = data.convenio;
    if (data.carnet_poliza !== undefined) updateData.carnetPoliza = data.carnet_poliza;
    if (data.arl !== undefined) updateData.arl = data.arl;

    // Información Demográfica y Laboral
    if (data.ocupacion !== undefined) updateData.ocupacion = data.ocupacion;
    if (data.nivel_educacion !== undefined) updateData.nivelEducacion = data.nivel_educacion;
    if (data.empleador_actual !== undefined) updateData.empleadorActual = data.empleador_actual;
    if (data.tipo_usuario !== undefined) updateData.tipoUsuario = data.tipo_usuario;

    // Información de Referencia
    if (data.referido_por !== undefined) updateData.referidoPor = data.referido_por;
    if (data.nombre_refiere !== undefined) updateData.nombreRefiere = data.nombre_refiere;
    if (data.tipo_paciente !== undefined) updateData.tipoPaciente = data.tipo_paciente;
    if (data.categoria !== undefined) updateData.categoria = data.categoria;

    // Discapacidad
    if (data.discapacidad !== undefined) updateData.discapacidad = data.discapacidad;
    if (data.tipo_discapacidad !== undefined) updateData.tipoDiscapacidad = data.tipo_discapacidad;

    // Información Médica
    if (data.tipo_sangre !== undefined) updateData.tipoSangre = data.tipo_sangre;
    if (data.peso !== undefined) updateData.peso = data.peso;
    if (data.altura !== undefined) updateData.altura = data.altura;
    if (data.alergias !== undefined) updateData.alergias = data.alergias;
    if (data.enfermedades_cronicas !== undefined) updateData.enfermedadesCronicas = data.enfermedades_cronicas;
    if (data.medicamentos_actuales !== undefined) updateData.medicamentosActuales = data.medicamentos_actuales;
    if (data.antecedentes_quirurgicos !== undefined) updateData.antecedentesQuirurgicos = data.antecedentes_quirurgicos;
    
    const paciente = await prisma.paciente.update({
      where: { id },
      data: updateData,
    });

    // Sincronizar con Siigo de forma asíncrona (no bloquea la respuesta)
    this.syncPacienteConSiigoAsync(paciente.id).catch(err => {
      console.error(`[Paciente] Error sincronizando actualización de paciente ${paciente.id} con Siigo:`, err.message);
    });

    return paciente;
  }

  /**
   * Eliminar un paciente (soft delete)
   */
  async delete(id) {
    await this.getById(id);
    
    await prisma.paciente.update({
      where: { id },
      data: { activo: false },
    });

    return true;
  }

  /**
   * Búsqueda rápida de pacientes por nombre, cédula o email
   */
  async search(query) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();

    const pacientes = await prisma.paciente.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: searchTerm, mode: 'insensitive' } },
          { apellido: { contains: searchTerm, mode: 'insensitive' } },
          { cedula: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        cedula: true,
        email: true,
        telefono: true,
        fechaNacimiento: true,
        genero: true,
        eps: true,
        tipoSangre: true,
        tipoDocumento: true,
        fotoUrl: true, // Foto del paciente para mostrar en búsqueda
      },
    });

    return pacientes;
  }

  /**
   * Activar o inactivar un paciente
   */
  async toggleActivo(id) {
    const paciente = await prisma.paciente.findUnique({
      where: { id },
      select: { id: true, activo: true, nombre: true, apellido: true },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    const updated = await prisma.paciente.update({
      where: { id },
      data: { activo: !paciente.activo,estado:paciente.estado=='Activo' ? 'Inactivo':'Activo' },
    });

    return updated;
  }

  // =============================================
  // Métodos para el portal de pacientes
  // =============================================

  /**
   * Obtener paciente por email
   */
  async getByEmail(email) {
    const paciente = await prisma.paciente.findFirst({
      where: { email, activo: true },
    });

    if (!paciente) {
      // Si no existe, devolver null (el paciente puede no haber completado su perfil)
      return null;
    }

    // Extraer contacto de emergencia del JSON si existe
    const contactoEmergencia = paciente.contactosEmergencia?.[0] || {};

    // Agregar aliases para compatibilidad con frontend
    return {
      ...paciente,
      documento: paciente.cedula,  // Alias para frontend
      tipo_documento: paciente.tipoDocumento,
      fecha_nacimiento: paciente.fechaNacimiento,
      ciudad: paciente.municipio,
      foto_url: paciente.fotoUrl,  // Alias para frontend
      tipo_afiliacion: paciente.tipoAfiliacion,  // Alias para frontend
      contacto_emergencia_nombre: contactoEmergencia.nombre || '',
      contacto_emergencia_telefono: contactoEmergencia.telefono || '',
    };
  }

  /**
   * Completar perfil de paciente después del registro
   */
  async completarPerfil(email, data) {
    // Buscar paciente por email
    let paciente = await prisma.paciente.findFirst({
      where: { email },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    // Verificar si la cédula ya está en uso por otro paciente
    if (data.documento) {
      const existing = await prisma.paciente.findFirst({
        where: {
          cedula: data.documento,
          id: { not: paciente.id }
        }
      });

      if (existing) {
        throw new ValidationError('El número de documento ya está registrado');
      }
    }

    // Procesar imagen si viene en base64
    let fotoUrl = undefined;  // undefined para no incluir en update si no hay imagen
    const imageData = data.foto_url || data.fotoUrl;
    if (imageData) {
      if (imageData.startsWith('data:image')) {
        // Es una imagen base64, procesarla
        try {
          fotoUrl = await saveBase64Image(imageData, 'pacientes');
          console.log('[Paciente] Imagen guardada:', fotoUrl);
        } catch (imgError) {
          console.warn('[Paciente] Error guardando imagen:', imgError.message);
          // No guardar nada si falla el procesamiento
          fotoUrl = undefined;
        }
      } else if (imageData.startsWith('/uploads/') || imageData.startsWith('http')) {
        // Ya es una URL válida, mantenerla
        fotoUrl = imageData;
      }
      // Si no es base64 ni URL válida, ignorar (fotoUrl queda undefined)
    }

    // Mapear campos del frontend a campos del modelo
    const updateData = {
      tipoDocumento: data.tipo_documento || data.tipoDocumento,
      cedula: data.documento,
      telefono: data.telefono,
      fechaNacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null,
      genero: data.genero,
      direccion: data.direccion,
      municipio: data.ciudad,
      departamento: data.departamento,
      eps: data.eps,
      tipoAfiliacion: data.tipo_afiliacion,
      fotoUrl: fotoUrl,  // Campo de imagen procesado (undefined si no hay)
      contactosEmergencia: data.contacto_emergencia_nombre ? [{
        nombre: data.contacto_emergencia_nombre,
        telefono: data.contacto_emergencia_telefono,
        parentesco: 'Contacto de emergencia'
      }] : undefined,
    };

    // Eliminar campos undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updated = await prisma.paciente.update({
      where: { id: paciente.id },
      data: updateData,
    });

    return updated;
  }

  /**
   * Actualizar perfil del paciente autenticado
   */
  async actualizarPerfil(email, data) {
    const paciente = await prisma.paciente.findFirst({
      where: { email },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    // Verificar si la cédula ya está en uso por otro paciente
    if (data.documento && data.documento !== paciente.cedula) {
      const existing = await prisma.paciente.findFirst({
        where: {
          cedula: data.documento,
          id: { not: paciente.id }
        }
      });

      if (existing) {
        throw new ValidationError('El número de documento ya está registrado');
      }
    }

    // Procesar imagen si viene en base64
    const imageData = data.foto_url || data.fotoUrl;
    let fotoUrl = undefined;
    if (imageData !== undefined) {
      if (imageData && imageData.startsWith('data:image')) {
        // Es una imagen base64, procesarla
        try {
          // Si hay imagen anterior, intentar eliminarla
          if (paciente.fotoUrl) {
            await deleteFile(paciente.fotoUrl);
          }
          fotoUrl = await saveBase64Image(imageData, 'pacientes');
          console.log('[Paciente] Imagen actualizada:', fotoUrl);
        } catch (imgError) {
          console.warn('[Paciente] Error guardando imagen:', imgError.message);
          // No actualizar si falla
          fotoUrl = undefined;
        }
      } else if (imageData && (imageData.startsWith('/uploads/') || imageData.startsWith('http'))) {
        // Ya es una URL válida, mantenerla
        fotoUrl = imageData;
      } else if (imageData === '' || imageData === null) {
        // Se quiere eliminar la imagen
        if (paciente.fotoUrl) {
          await deleteFile(paciente.fotoUrl);
        }
        fotoUrl = null;
      }
      // Si no es base64 ni URL válida ni eliminación, ignorar (fotoUrl queda undefined)
    }

    // Mapear campos del frontend a campos del modelo
    const updateData = {};

    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.apellido !== undefined) updateData.apellido = data.apellido;
    if (data.tipo_documento !== undefined) updateData.tipoDocumento = data.tipo_documento;
    if (data.documento !== undefined) updateData.cedula = data.documento;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.fecha_nacimiento !== undefined) updateData.fechaNacimiento = data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null;
    if (data.genero !== undefined) updateData.genero = data.genero;
    if (data.direccion !== undefined) updateData.direccion = data.direccion;
    if (data.ciudad !== undefined) updateData.municipio = data.ciudad;
    if (data.departamento !== undefined) updateData.departamento = data.departamento;
    if (data.eps !== undefined) updateData.eps = data.eps;
    if (data.tipo_afiliacion !== undefined) updateData.tipoAfiliacion = data.tipo_afiliacion;
    if (fotoUrl !== undefined) updateData.fotoUrl = fotoUrl;

    if (data.contacto_emergencia_nombre || data.contacto_emergencia_telefono) {
      updateData.contactosEmergencia = [{
        nombre: data.contacto_emergencia_nombre || '',
        telefono: data.contacto_emergencia_telefono || '',
        parentesco: 'Contacto de emergencia'
      }];
    }

    const updated = await prisma.paciente.update({
      where: { id: paciente.id },
      data: updateData,
    });

    return updated;
  }

  /**
   * Obtener solicitudes de historia clínica del paciente
   */
  async getSolicitudesHCE(email) {
    const paciente = await prisma.paciente.findFirst({
      where: { email, activo: true },
      select: { id: true },
    });

    if (!paciente) {
      return [];
    }

    const solicitudes = await prisma.solicitudHistoriaClinica.findMany({
      where: { pacienteId: paciente.id },
      orderBy: { createdAt: 'desc' },
    });

    // Map enum values to frontend-friendly format
    return solicitudes.map(s => ({
      id: s.id,
      tipo: s.tipo === 'COMPLETA' ? 'completa' : 'parcial',
      periodo: s.periodo,
      motivo: s.motivo,
      estado: this.mapEstadoSolicitud(s.estado),
      notas: s.notas,
      archivoUrl: s.archivoUrl,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  /**
   * Mapear estado de solicitud a formato frontend
   */
  mapEstadoSolicitud(estado) {
    const map = {
      'PENDIENTE': 'Pendiente',
      'EN_PROCESO': 'EnProceso',
      'LISTA': 'Lista',
      'ENTREGADA': 'Entregada',
      'RECHAZADA': 'Rechazada',
    };
    return map[estado] || estado;
  }

  /**
   * Solicitar copia de historia clínica
   */
  async solicitarHistoriaMedica(email, data) {
    const paciente = await prisma.paciente.findFirst({
      where: { email, activo: true },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    // Map tipo to enum value
    const tipoEnum = data.tipo === 'completa' ? 'COMPLETA' : 'PARCIAL';

    const solicitud = await prisma.solicitudHistoriaClinica.create({
      data: {
        pacienteId: paciente.id,
        tipo: tipoEnum,
        periodo: data.periodo || null,
        motivo: data.motivo || null,
        estado: 'PENDIENTE',
      },
    });

    console.log('[Paciente] Solicitud HC creada:', solicitud.id, 'para paciente:', paciente.email);

    // Send confirmation email
    try {
      const emailService = require('./email.service');
      console.log('[Paciente] Email service enabled:', emailService.isEnabled());

      const emailResult = await emailService.sendMedicalRecordRequestConfirmation({
        to: email,
        paciente,
        solicitud: {
          ...solicitud,
          tipo: data.tipo,
        },
      });
      console.log('[Paciente] Resultado email:', emailResult);
    } catch (emailError) {
      console.error('[Paciente] Error enviando email de confirmación de solicitud:', emailError.message);
    }

    return {
      id: solicitud.id,
      tipo: data.tipo,
      periodo: solicitud.periodo,
      motivo: solicitud.motivo,
      estado: 'Pendiente',
      createdAt: solicitud.createdAt,
    };
  }

  /**
   * Descargar historia médica como PDF
   * Nota: Por ahora devuelve un PDF placeholder - integrar con hce-pdf.service.js cuando esté listo
   */
  async descargarHistoriaMedica(email, solicitudId) {
    const paciente = await prisma.paciente.findFirst({
      where: { email },
      include: {
        usuario: true,
      },
    });

    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    // TODO: Verificar que la solicitud existe y pertenece al paciente
    // TODO: Verificar que la solicitud está en estado 'Lista'
    // TODO: Integrar con hce-pdf.service.js para generar el PDF real

    // Por ahora, generar un PDF placeholder
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    const chunks = [];

    return new Promise((resolve, reject) => {
      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Historia Clínica', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text('Clínica Mía', { align: 'center' });
      doc.moveDown(2);

      // Patient info
      doc.fontSize(12);
      doc.text(`Paciente: ${paciente.usuario?.nombre || ''} ${paciente.usuario?.apellido || ''}`);
      doc.text(`Documento: ${paciente.tipo_documento || 'CC'} ${paciente.documento || 'N/A'}`);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CO')}`);
      doc.moveDown(2);

      // Placeholder message
      doc.fontSize(11).fillColor('#666');
      doc.text('Este es un documento placeholder. La historia clínica completa será generada cuando el módulo de HCE esté completamente integrado.', {
        align: 'center',
        width: 400,
      });

      doc.end();
    });
  }

  // =============================================
  // Integración con Siigo
  // =============================================

  /**
   * Sincronizar paciente con Siigo de forma asíncrona
   * Este método no bloquea la operación principal
   */
  async syncPacienteConSiigoAsync(pacienteId) {
    try {
      const { customerSiigoService, siigoService } = getSiigoServices();

      if (!customerSiigoService || !siigoService) {
        console.log(`[Paciente] Servicios Siigo no disponibles - paciente ${pacienteId} pendiente de sync`);
        return;
      }

      // Verificar si Siigo está conectado
      if (!siigoService.initialized) {
        console.log(`[Paciente] Siigo no conectado - paciente ${pacienteId} será sincronizado por cron job`);
        // Crear registro de sincronización pendiente
        await prisma.siigoSync.upsert({
          where: {
            entidad_entidadId: { entidad: 'paciente', entidadId: pacienteId }
          },
          update: {
            estado: 'pendiente',
            ultimaSync: new Date()
          },
          create: {
            entidad: 'paciente',
            entidadId: pacienteId,
            estado: 'pendiente'
          }
        });
        return;
      }

      // Sincronizar con Siigo
      await customerSiigoService.syncPaciente(pacienteId);
      console.log(`[Paciente] ✓ Paciente ${pacienteId} sincronizado con Siigo`);
    } catch (error) {
      console.error(`[Paciente] Error en sync con Siigo para paciente ${pacienteId}:`, error.message);

      // Registrar error para reintento por cron
      try {
        await prisma.siigoSync.upsert({
          where: {
            entidad_entidadId: { entidad: 'paciente', entidadId: pacienteId }
          },
          update: {
            estado: 'error',
            errorMessage: error.message,
            ultimaSync: new Date()
          },
          create: {
            entidad: 'paciente',
            entidadId: pacienteId,
            estado: 'error',
            errorMessage: error.message
          }
        });
      } catch (syncErr) {
        console.error(`[Paciente] Error registrando sync error:`, syncErr.message);
      }

      throw error;
    }
  }

  /**
   * Forzar sincronización de un paciente con Siigo
   * Uso manual o desde endpoints de admin
   */
  async forceSyncWithSiigo(pacienteId) {
    const paciente = await this.getById(pacienteId);
    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }

    return this.syncPacienteConSiigoAsync(pacienteId);
  }
}

module.exports = new PacienteService();
