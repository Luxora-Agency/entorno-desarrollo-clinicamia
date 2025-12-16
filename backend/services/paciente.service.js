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
        tipoDocumento: data.tipo_documento || data.tipoDocumento,
        cedula: data.cedula || `TEMP-${Date.now()}`,
        fechaNacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : (data.fechaNacimiento ? new Date(data.fechaNacimiento) : null),
        genero: data.genero,
        estadoCivil: data.estado_civil || data.estadoCivil,
        
        // Ubicación
        paisNacimiento: data.pais_nacimiento || data.paisNacimiento,
        departamento: data.departamento,
        municipio: data.municipio,
        barrio: data.barrio,
        direccion: data.direccion,
        
        // Contacto
        telefono: data.telefono,
        email: data.email,
        
        // Contactos de Emergencia (JSON)
        contactosEmergencia: data.contactos_emergencia || data.contactosEmergencia || null,
        
        // Aseguramiento
        eps: data.eps,
        regimen: data.regimen,
        tipoAfiliacion: data.tipo_afiliacion || data.tipoAfiliacion,
        nivelSisben: data.nivel_sisben || data.nivelSisben,
        numeroAutorizacion: data.numero_autorizacion || data.numeroAutorizacion,
        fechaAfiliacion: data.fecha_afiliacion ? new Date(data.fecha_afiliacion) : (data.fechaAfiliacion ? new Date(data.fechaAfiliacion) : null),
        convenio: data.convenio,
        carnetPoliza: data.carnet_poliza || data.carnetPoliza,
        arl: data.arl,
        
        // Información Demográfica y Laboral
        ocupacion: data.ocupacion,
        nivelEducacion: data.nivel_educacion || data.nivelEducacion,
        empleadorActual: data.empleador_actual || data.empleadorActual,
        tipoUsuario: data.tipo_usuario || data.tipoUsuario,
        
        // Información de Referencia
        referidoPor: data.referido_por || data.referidoPor,
        nombreRefiere: data.nombre_refiere || data.nombreRefiere,
        tipoPaciente: data.tipo_paciente || data.tipoPaciente,
        categoria: data.categoria,
        
        // Información Médica
        tipoSangre: data.tipo_sangre || data.tipoSangre,
        peso: data.peso ? parseFloat(data.peso) : null,
        altura: data.altura ? parseFloat(data.altura) : null,
        alergias: data.alergias,
        enfermedadesCronicas: data.enfermedades_cronicas || data.enfermedadesCronicas,
        medicamentosActuales: data.medicamentos_actuales || data.medicamentosActuales,
        antecedentesQuirurgicos: data.antecedentes_quirurgicos || data.antecedentesQuirurgicos,
        
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
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.apellido !== undefined) updateData.apellido = data.apellido;
    if (data.tipo_documento !== undefined || data.tipoDocumento !== undefined) updateData.tipoDocumento = data.tipo_documento || data.tipoDocumento;
    if (data.cedula !== undefined) updateData.cedula = data.cedula;
    if (data.fecha_nacimiento || data.fechaNacimiento) updateData.fechaNacimiento = new Date(data.fecha_nacimiento || data.fechaNacimiento);
    if (data.genero !== undefined) updateData.genero = data.genero;
    if (data.estado_civil !== undefined || data.estadoCivil !== undefined) updateData.estadoCivil = data.estado_civil || data.estadoCivil;
    
    // Ubicación
    if (data.pais_nacimiento !== undefined || data.paisNacimiento !== undefined) updateData.paisNacimiento = data.pais_nacimiento || data.paisNacimiento;
    if (data.departamento !== undefined) updateData.departamento = data.departamento;
    if (data.municipio !== undefined) updateData.municipio = data.municipio;
    if (data.barrio !== undefined) updateData.barrio = data.barrio;
    if (data.direccion !== undefined) updateData.direccion = data.direccion;
    
    // Contacto
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.contactos_emergencia !== undefined || data.contactosEmergencia !== undefined) updateData.contactosEmergencia = data.contactos_emergencia || data.contactosEmergencia;
    
    // Aseguramiento
    if (data.eps !== undefined) updateData.eps = data.eps;
    if (data.regimen !== undefined) updateData.regimen = data.regimen;
    if (data.tipo_afiliacion !== undefined || data.tipoAfiliacion !== undefined) updateData.tipoAfiliacion = data.tipo_afiliacion || data.tipoAfiliacion;
    if (data.nivel_sisben !== undefined || data.nivelSisben !== undefined) updateData.nivelSisben = data.nivel_sisben || data.nivelSisben;
    if (data.numero_autorizacion !== undefined || data.numeroAutorizacion !== undefined) updateData.numeroAutorizacion = data.numero_autorizacion || data.numeroAutorizacion;
    if (data.fecha_afiliacion || data.fechaAfiliacion) updateData.fechaAfiliacion = new Date(data.fecha_afiliacion || data.fechaAfiliacion);
    if (data.convenio !== undefined) updateData.convenio = data.convenio;
    if (data.carnet_poliza !== undefined || data.carnetPoliza !== undefined) updateData.carnetPoliza = data.carnet_poliza || data.carnetPoliza;
    if (data.arl !== undefined) updateData.arl = data.arl;
    
    // Información Demográfica y Laboral
    if (data.ocupacion !== undefined) updateData.ocupacion = data.ocupacion;
    if (data.nivel_educacion !== undefined || data.nivelEducacion !== undefined) updateData.nivelEducacion = data.nivel_educacion || data.nivelEducacion;
    if (data.empleador_actual !== undefined || data.empleadorActual !== undefined) updateData.empleadorActual = data.empleador_actual || data.empleadorActual;
    if (data.tipo_usuario !== undefined || data.tipoUsuario !== undefined) updateData.tipoUsuario = data.tipo_usuario || data.tipoUsuario;
    
    // Información de Referencia
    if (data.referido_por !== undefined || data.referidoPor !== undefined) updateData.referidoPor = data.referido_por || data.referidoPor;
    if (data.nombre_refiere !== undefined || data.nombreRefiere !== undefined) updateData.nombreRefiere = data.nombre_refiere || data.nombreRefiere;
    if (data.tipo_paciente !== undefined || data.tipoPaciente !== undefined) updateData.tipoPaciente = data.tipo_paciente || data.tipoPaciente;
    if (data.categoria !== undefined) updateData.categoria = data.categoria;
    
    // Información Médica
    if (data.tipo_sangre !== undefined || data.tipoSangre !== undefined) updateData.tipoSangre = data.tipo_sangre || data.tipoSangre;
    if (data.peso !== undefined) updateData.peso = data.peso ? parseFloat(data.peso) : null;
    if (data.altura !== undefined) updateData.altura = data.altura ? parseFloat(data.altura) : null;
    if (data.alergias !== undefined) updateData.alergias = data.alergias;
    if (data.enfermedades_cronicas !== undefined || data.enfermedadesCronicas !== undefined) updateData.enfermedadesCronicas = data.enfermedades_cronicas || data.enfermedadesCronicas;
    if (data.medicamentos_actuales !== undefined || data.medicamentosActuales !== undefined) updateData.medicamentosActuales = data.medicamentos_actuales || data.medicamentosActuales;
    if (data.antecedentes_quirurgicos !== undefined || data.antecedentesQuirurgicos !== undefined) updateData.antecedentesQuirurgicos = data.antecedentes_quirurgicos || data.antecedentesQuirurgicos;
    
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
