/**
 * Service de pacientes
 */
const prisma = require('../db/prisma');
const { validateRequired } = require('../utils/validators');
const { ValidationError, NotFoundError } = require('../utils/errors');

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
    // Validar campos mínimos requeridos
    const missing = validateRequired(['nombre'], data);
    if (missing) {
      throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
    }

    // Verificar cédula única si se proporciona
    if (data.cedula) {
      const existing = await prisma.paciente.findUnique({ 
        where: { cedula: data.cedula } 
      });
      
      if (existing) {
        throw new ValidationError('La cédula ya está registrada');
      }
    }

    // Crear paciente
    const paciente = await prisma.paciente.create({
      data: {
        // Datos Personales
        nombre: data.nombre,
        apellido: data.apellido || '',
        tipoDocumento: data.tipo_documento,
        cedula: data.cedula || `TEMP-${Date.now()}`,
        fechaNacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null,
        genero: data.genero,
        estadoCivil: data.estado_civil,
        
        // Ubicación
        paisNacimiento: data.pais_nacimiento,
        departamento: data.departamento,
        municipio: data.municipio,
        barrio: data.barrio,
        direccion: data.direccion,
        
        // Contacto
        telefono: data.telefono,
        email: data.email,
        
        // Contactos de Emergencia (JSON)
        contactosEmergencia: data.contactos_emergencia,
        
        // Aseguramiento
        eps: data.eps,
        regimen: data.regimen,
        tipoAfiliacion: data.tipo_afiliacion,
        nivelSisben: data.nivel_sisben,
        numeroAutorizacion: data.numero_autorizacion,
        fechaAfiliacion: data.fecha_afiliacion ? new Date(data.fecha_afiliacion) : null,
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
        
        // Información Médica
        tipoSangre: data.tipo_sangre,
        peso: data.peso ? parseFloat(data.peso) : null,
        altura: data.altura ? parseFloat(data.altura) : null,
        alergias: data.alergias,
        enfermedadesCronicas: data.enfermedades_cronicas,
        medicamentosActuales: data.medicamentos_actuales,
        antecedentesQuirurgicos: data.antecedentes_quirurgicos,
        
      },
    });

    return paciente;
  }

  /**
   * Actualizar un paciente
   */
  async update(id, data) {
    // Verificar que existe
    await this.getById(id);

    // Construir datos de actualización
    const updateData = {};
    
    // Datos Personales
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.apellido !== undefined) updateData.apellido = data.apellido;
    if (data.tipo_documento !== undefined) updateData.tipoDocumento = data.tipo_documento;
    if (data.cedula !== undefined) updateData.cedula = data.cedula;
    if (data.fecha_nacimiento !== undefined) updateData.fechaNacimiento = new Date(data.fecha_nacimiento);
    if (data.genero !== undefined) updateData.genero = data.genero;
    if (data.estado_civil !== undefined) updateData.estadoCivil = data.estado_civil;
    
    // Ubicación
    if (data.pais_nacimiento !== undefined) updateData.paisNacimiento = data.pais_nacimiento;
    if (data.departamento !== undefined) updateData.departamento = data.departamento;
    if (data.municipio !== undefined) updateData.municipio = data.municipio;
    if (data.barrio !== undefined) updateData.barrio = data.barrio;
    if (data.direccion !== undefined) updateData.direccion = data.direccion;
    
    // Contacto
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.contactos_emergencia !== undefined) updateData.contactosEmergencia = data.contactos_emergencia;
    
    // Aseguramiento
    if (data.eps !== undefined) updateData.eps = data.eps;
    if (data.regimen !== undefined) updateData.regimen = data.regimen;
    if (data.tipo_afiliacion !== undefined) updateData.tipoAfiliacion = data.tipo_afiliacion;
    if (data.nivel_sisben !== undefined) updateData.nivelSisben = data.nivel_sisben;
    if (data.numero_autorizacion !== undefined) updateData.numeroAutorizacion = data.numero_autorizacion;
    if (data.fecha_afiliacion !== undefined) updateData.fechaAfiliacion = new Date(data.fecha_afiliacion);
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
    
    // Información Médica
    if (data.tipo_sangre !== undefined) updateData.tipoSangre = data.tipo_sangre;
    if (data.peso !== undefined) updateData.peso = data.peso ? parseFloat(data.peso) : null;
    if (data.altura !== undefined) updateData.altura = data.altura ? parseFloat(data.altura) : null;
    if (data.alergias !== undefined) updateData.alergias = data.alergias;
    if (data.enfermedades_cronicas !== undefined) updateData.enfermedadesCronicas = data.enfermedades_cronicas;
    if (data.medicamentos_actuales !== undefined) updateData.medicamentosActuales = data.medicamentos_actuales;
    if (data.antecedentes_quirurgicos !== undefined) updateData.antecedentesQuirurgicos = data.antecedentes_quirurgicos;
    
    const paciente = await prisma.paciente.update({
      where: { id },
      data: updateData,
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
}

module.exports = new PacienteService();
