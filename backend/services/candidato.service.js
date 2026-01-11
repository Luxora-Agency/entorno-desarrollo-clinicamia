const prisma = require('../db/prisma');
const { ValidationError, NotFoundError } = require('../utils/errors');

// Mapeo de estados entre CandidatoTalento y THCandidato
const ESTADO_MAP = {
  'Pendiente': 'APLICADO',
  'EnRevision': 'EN_REVISION',
  'Entrevista': 'ENTREVISTA_REALIZADA',
  'Seleccionado': 'SELECCIONADO',
  'Rechazado': 'RECHAZADO',
  'Contratado': 'CONTRATADO',
  'Archivado': 'RECHAZADO',
};

// Mapeo de género
const GENERO_MAP = {
  'male': 'Masculino',
  'female': 'Femenino',
  'other': 'Otro',
  'prefer_not_to_say': 'No especificado',
};

// Mapeo de estado civil
const ESTADO_CIVIL_MAP = {
  'single': 'Soltero',
  'married': 'Casado',
  'common_law': 'Unión libre',
  'divorced': 'Divorciado',
  'widowed': 'Viudo',
};

// Mapeo de tipo de documento
const TIPO_DOC_MAP = {
  'CC': 'CC',
  'CE': 'CE',
  'PA': 'Pasaporte',
  'TI': 'TI',
};

class CandidatoService {
  
  // Helper to map DB snake_case to API camelCase
  _mapToCamelCase(dbCandidato) {
    if (!dbCandidato) return null;
    return {
      id: dbCandidato.id,
      firstName: dbCandidato.first_name,
      lastName: dbCandidato.last_name,
      documentType: dbCandidato.document_type,
      documentNumber: dbCandidato.document_number,
      birthDate: dbCandidato.birth_date,
      gender: dbCandidato.gender,
      maritalStatus: dbCandidato.marital_status,
      nationality: dbCandidato.nationality,
      mobilePhone: dbCandidato.mobile_phone,
      landlinePhone: dbCandidato.landline_phone,
      email: dbCandidato.email,
      alternativeEmail: dbCandidato.alternative_email,
      residenceAddress: dbCandidato.residence_address,
      city: dbCandidato.city,
      department: dbCandidato.department,
      country: dbCandidato.country,
      profession: dbCandidato.profession,
      specialty: dbCandidato.specialty,
      subspecialty: dbCandidato.subspecialty,
      professionalLicenseNumber: dbCandidato.professional_license_number,
      medicalRegistryNumber: dbCandidato.medical_registry_number,
      educationInstitution: dbCandidato.education_institution,
      educationCountry: dbCandidato.education_country,
      graduationYear: dbCandidato.graduation_year,
      yearsOfExperience: dbCandidato.years_of_experience,
      previousExperience: dbCandidato.previous_experience,
      previousInstitutions: dbCandidato.previous_institutions,
      currentPosition: dbCandidato.current_position,
      currentInstitution: dbCandidato.current_institution,
      currentlyEmployed: dbCandidato.currently_employed,
      immediateAvailability: dbCandidato.immediate_availability,
      areasOfInterest: dbCandidato.areas_of_interest,
      preferredModality: dbCandidato.preferred_modality,
      preferredContractType: dbCandidato.preferred_contract_type,
      salaryExpectation: dbCandidato.salary_expectation ? Number(dbCandidato.salary_expectation) : null,
      scheduleAvailability: dbCandidato.schedule_availability,
      availableShifts: dbCandidato.available_shifts,
      languages: dbCandidato.languages,
      references: dbCandidato.references,
      howDidYouHear: dbCandidato.how_did_you_hear,
      motivation: dbCandidato.motivation,
      professionalExpectations: dbCandidato.professional_expectations,
      willingToTravel: dbCandidato.willing_to_travel,
      willingToRelocate: dbCandidato.willing_to_relocate,
      hasOwnVehicle: dbCandidato.has_own_vehicle,
      driverLicense: dbCandidato.driver_license,
      documentIds: dbCandidato.document_ids,
      estado: dbCandidato.estado,
      notasInternas: dbCandidato.notas_internas,
      fechaRevision: dbCandidato.fecha_revision,
      revisadoPor: dbCandidato.revisado_por,
      createdAt: dbCandidato.created_at,
      updatedAt: dbCandidato.updated_at,
    };
  }

  // Helper to map API camelCase to DB snake_case
  _mapToSnakeCase(data) {
    const mapped = {
      first_name: data.firstName,
      last_name: data.lastName,
      document_type: data.documentType,
      document_number: data.documentNumber,
      birth_date: data.birthDate,
      gender: data.gender,
      marital_status: data.maritalStatus,
      nationality: data.nationality,
      mobile_phone: data.mobilePhone,
      landline_phone: data.landlinePhone,
      email: data.email,
      alternative_email: data.alternativeEmail,
      residence_address: data.residenceAddress,
      city: data.city,
      department: data.department,
      country: data.country,
      profession: data.profession,
      specialty: data.specialty,
      subspecialty: data.subspecialty,
      professional_license_number: data.professionalLicenseNumber,
      medical_registry_number: data.medicalRegistryNumber,
      education_institution: data.educationInstitution,
      education_country: data.educationCountry,
      graduation_year: data.graduationYear,
      years_of_experience: data.yearsOfExperience,
      previous_experience: data.previousExperience,
      previous_institutions: data.previousInstitutions,
      current_position: data.currentPosition,
      current_institution: data.currentInstitution,
      currently_employed: data.currentlyEmployed,
      immediate_availability: data.immediateAvailability,
      areas_of_interest: data.areasOfInterest,
      preferred_modality: data.preferredModality,
      preferred_contract_type: data.preferredContractType,
      salary_expectation: data.salaryExpectation,
      schedule_availability: data.scheduleAvailability,
      available_shifts: data.availableShifts,
      languages: data.languages,
      references: data.references,
      how_did_you_hear: data.howDidYouHear,
      motivation: data.motivation,
      professional_expectations: data.professionalExpectations,
      willing_to_travel: data.willingToTravel,
      willing_to_relocate: data.willingToRelocate,
      has_own_vehicle: data.hasOwnVehicle,
      driver_license: data.driverLicense,
      document_ids: data.documentIds,
      // Optional fields
      ...(data.estado && { estado: data.estado }),
      ...(data.notasInternas && { notas_internas: data.notasInternas }),
      ...(data.fechaRevision && { fecha_revision: data.fechaRevision }),
      ...(data.revisadoPor && { revisado_por: data.revisadoPor }),
    };

    // Remove undefined
    Object.keys(mapped).forEach(key => mapped[key] === undefined && delete mapped[key]);
    return mapped;
  }

  /**
   * Create a new candidate application (public endpoint)
   * Sincroniza con th_candidatos del módulo de Talento Humano
   */
  async create(data) {
    // Check if document number already exists
    const existing = await prisma.candidatos_talento.findUnique({
      where: { document_number: data.documentNumber },
    });

    if (existing) {
      throw new ValidationError('Ya existe una solicitud con este número de documento');
    }

    // Transform data for Prisma
    const dbData = this._mapToSnakeCase({
      ...data,
      birthDate: new Date(data.birthDate),
      languages: data.languages || [],
      references: data.references || [],
      previousInstitutions: data.previousInstitutions || [],
      areasOfInterest: data.areasOfInterest || [],
      availableShifts: data.availableShifts || [],
      documentIds: data.documentIds || [],
    });

    // Usar transacción para crear en ambas tablas
    const candidato = await prisma.$transaction(async (tx) => {
      // 1. Crear en candidatos_talento (tabla original para el frontend)
      const candidatoTalento = await tx.candidatos_talento.create({
        data: {
            id: require('uuid').v4(),
            ...dbData,
            updated_at: new Date()
        },
      });

      // 2. Sincronizar con th_candidatos (módulo Talento Humano)
      try {
        await this._syncToTHCandidato(tx, candidatoTalento, data);
      } catch (syncError) {
        console.warn('Warning: No se pudo sincronizar con th_candidatos:', syncError.message);
        // No falla si la sincronización falla - el candidato ya se creó
      }

      return candidatoTalento;
    });

    return this._mapToCamelCase(candidato);
  }

  /**
   * Sincroniza un candidatos_talento con th_candidatos
   * @private
   */
  async _syncToTHCandidato(tx, candidatoTalento, originalData) {
    // Verificar si ya existe en th_candidatos
    const existingTH = await tx.th_candidatos.findFirst({
      where: {
        tipo_documento: TIPO_DOC_MAP[candidatoTalento.document_type] || candidatoTalento.document_type,
        documento: candidatoTalento.document_number,
      },
    });

    const thData = this._mapToTHCandidatoData(candidatoTalento, originalData);

    if (existingTH) {
      // Actualizar th_candidatos existente
      return tx.th_candidatos.update({
        where: { id: existingTH.id },
        data: thData,
      });
    }

    // Crear nuevo th_candidatos
    return tx.th_candidatos.create({
      data: {
        id: require('uuid').v4(),
        ...thData,
        tipo_documento: TIPO_DOC_MAP[candidatoTalento.document_type] || candidatoTalento.document_type,
        documento: candidatoTalento.document_number,
      },
    });
  }

  /**
   * Mapea datos de candidatos_talento a formato th_candidatos
   * @private
   */
  _mapToTHCandidatoData(candidatoTalento, originalData = {}) {
    return {
      nombre: candidatoTalento.first_name,
      apellido: candidatoTalento.last_name,
      fecha_nacimiento: candidatoTalento.birth_date,
      genero: GENERO_MAP[candidatoTalento.gender] || candidatoTalento.gender,
      estado_civil: ESTADO_CIVIL_MAP[candidatoTalento.marital_status] || candidatoTalento.marital_status,
      nacionalidad: candidatoTalento.nationality,
      email: candidatoTalento.email,
      telefono: candidatoTalento.mobile_phone,
      direccion: candidatoTalento.residence_address,
      ciudad: candidatoTalento.city,
      departamento_geo: candidatoTalento.department,
      profesion: candidatoTalento.profession,
      nivel_educativo: originalData.specialty || candidatoTalento.specialty,
      institucion_educativa: candidatoTalento.education_institution,
      anio_graduacion: candidatoTalento.graduation_year,
      experiencia_anios: candidatoTalento.years_of_experience,
      cargo_actual: candidatoTalento.current_position,
      empresa_actual: candidatoTalento.current_institution,
      expectativa_salarial: candidatoTalento.salary_expectation,
      disponibilidad: candidatoTalento.immediate_availability ? 'Inmediata' : 'A convenir',
      fuente_aplicacion: 'Portal Web - Trabaja con Nosotros',
      notas: candidatoTalento.motivation || candidatoTalento.professional_expectations,
      documentos: {
        cvIds: candidatoTalento.document_ids || [],
        referencias: originalData.references || [],
        idiomas: originalData.languages || [],
      },
    };
  }

  /**
   * Get all candidates with pagination and filters (admin endpoint)
   */
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 20,
      estado,
      profession,
      specialty,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (profession) {
      where.profession = { contains: profession, mode: 'insensitive' };
    }

    if (specialty) {
      where.specialty = { contains: specialty, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { document_number: { contains: search, mode: 'insensitive' } },
        { profession: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Map sort field
    const sortFieldMap = {
        'createdAt': 'created_at',
        'firstName': 'first_name',
        'lastName': 'last_name',
        'profession': 'profession',
        'yearsOfExperience': 'years_of_experience'
    };
    const dbSortBy = sortFieldMap[sortBy] || 'created_at';

    // Count total
    const total = await prisma.candidatos_talento.count({ where });

    // Get candidates
    const candidatos = await prisma.candidatos_talento.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [dbSortBy]: sortOrder },
    });

    return {
      data: candidatos.map(c => this._mapToCamelCase(c)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single candidate by ID (admin endpoint)
   */
  async findById(id) {
    const candidato = await prisma.candidatos_talento.findUnique({
      where: { id },
    });

    if (!candidato) {
      throw new NotFoundError('Candidato no encontrado');
    }

    return this._mapToCamelCase(candidato);
  }

  /**
   * Update a candidate (admin endpoint)
   */
  async update(id, data) {
    const existing = await prisma.candidatos_talento.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Candidato no encontrado');
    }

    // If document number is being changed, check uniqueness
    if (data.documentNumber && data.documentNumber !== existing.document_number) {
      const duplicate = await prisma.candidatos_talento.findUnique({
        where: { document_number: data.documentNumber },
      });

      if (duplicate) {
        throw new ValidationError('Ya existe un candidato con este número de documento');
      }
    }

    const dbData = this._mapToSnakeCase({
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined
    });

    const candidato = await prisma.candidatos_talento.update({
      where: { id },
      data: {
          ...dbData,
          updated_at: new Date()
      },
    });

    return this._mapToCamelCase(candidato);
  }

  /**
   * Update candidate status (admin endpoint)
   * Sincroniza el estado con th_candidatos
   */
  async updateStatus(id, userId, statusData) {
    const existing = await prisma.candidatos_talento.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Candidato no encontrado');
    }

    const candidato = await prisma.$transaction(async (tx) => {
      // 1. Actualizar candidatos_talento
      const updated = await tx.candidatos_talento.update({
        where: { id },
        data: {
          estado: statusData.estado,
          notas_internas: statusData.notasInternas,
          fecha_revision: new Date(),
          revisado_por: userId,
          updated_at: new Date()
        },
      });

      // 2. Sincronizar estado con th_candidatos
      try {
        await this._syncStatusToTH(tx, updated, statusData.notasInternas);
      } catch (syncError) {
        console.warn('Warning: No se pudo sincronizar estado con th_candidatos:', syncError.message);
      }

      return updated;
    });

    return this._mapToCamelCase(candidato);
  }

  /**
   * Sincroniza el estado del candidato con th_candidatos
   * @private
   */
  async _syncStatusToTH(tx, candidatoTalento, notas) {
    // Buscar th_candidatos correspondiente
    const thCandidato = await tx.th_candidatos.findFirst({
      where: {
        documento: candidatoTalento.document_number,
      },
    });

    if (!thCandidato) {
      // Si no existe, crear uno nuevo
      await this._syncToTHCandidato(tx, candidatoTalento, {});
      return;
    }

    // Actualizar notas en th_candidatos
    await tx.th_candidatos.update({
      where: { id: thCandidato.id },
      data: {
        notas: notas || thCandidato.notas,
      },
    });

    // Si hay una vacante asociada, actualizar th_candidato_vacante
    const vacanteAsociada = await tx.th_candidato_vacante.findFirst({
      where: { candidato_id: thCandidato.id },
      orderBy: { fecha_aplicacion: 'desc' },
    });

    if (vacanteAsociada) {
      const estadoTH = ESTADO_MAP[candidatoTalento.estado] || 'APLICADO';
      await tx.th_candidato_vacante.update({
        where: { id: vacanteAsociada.id },
        data: {
          estado: estadoTH,
          notas: notas,
        },
      });
    }
  }

  /**
   * Delete a candidate (admin endpoint)
   */
  async delete(id) {
    const existing = await prisma.candidatos_talento.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Candidato no encontrado');
    }

    await prisma.candidatos_talento.delete({
      where: { id },
    });

    return { message: 'Candidato eliminado correctamente' };
  }

  /**
   * Get statistics for dashboard
   */
  async getStats() {
    const [
      total,
      pendientes,
      enRevision,
      entrevista,
      seleccionados,
      rechazados,
      contratados,
      archivados,
      ultimos7Dias,
    ] = await Promise.all([
      prisma.candidatos_talento.count(),
      prisma.candidatos_talento.count({ where: { estado: 'Pendiente' } }),
      prisma.candidatos_talento.count({ where: { estado: 'EnRevision' } }),
      prisma.candidatos_talento.count({ where: { estado: 'Entrevista' } }),
      prisma.candidatos_talento.count({ where: { estado: 'Seleccionado' } }),
      prisma.candidatos_talento.count({ where: { estado: 'Rechazado' } }),
      prisma.candidatos_talento.count({ where: { estado: 'Contratado' } }),
      prisma.candidatos_talento.count({ where: { estado: 'Archivado' } }),
      prisma.candidatos_talento.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Get professions breakdown
    const professions = await prisma.candidatos_talento.groupBy({
      by: ['profession'],
      _count: { profession: true },
      orderBy: { _count: { profession: 'desc' } },
      take: 10,
    });

    return {
      total,
      porEstado: {
        pendientes,
        enRevision,
        entrevista,
        seleccionados,
        rechazados,
        contratados,
        archivados,
      },
      ultimos7Dias,
      porProfesion: professions.map((p) => ({
        profession: p.profession,
        count: p._count.profession,
      })),
    };
  }

  /**
   * Export candidates to array (for CSV/Excel export)
   */
  async exportAll(query = {}) {
    const { estado, profession, specialty, search } = query;

    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (profession) {
      where.profession = { contains: profession, mode: 'insensitive' };
    }

    if (specialty) {
      where.specialty = { contains: specialty, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { document_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    const candidatos = await prisma.candidatos_talento.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return candidatos.map(c => this._mapToCamelCase(c));
  }

  // ============ VACANTES PÚBLICAS ============

  /**
   * Obtener vacantes abiertas para el portal público
   */
  async getVacantesPublicas(filters = {}) {
    const { departamento, tipoContrato, search, limit = 20, page = 1 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      estado: 'ABIERTA',
      publicar_externo: true,
    };

    if (departamento) {
      where.departamento_id = departamento;
    }

    if (tipoContrato) {
      where.tipo_contrato = tipoContrato;
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vacantes, total] = await Promise.all([
      prisma.th_vacantes.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          tipo_contrato: true,
          jornada: true,
          salario_min: true,
          salario_max: true,
          ubicacion: true,
          fecha_apertura: true,
          fecha_cierre: true,
          cantidad_puestos: true,
          requisitos: true,
          departamento_id: true,
          th_cargos: {
            select: {
              id: true,
              nombre: true,
            },
          },
          _count: {
            select: { th_candidato_vacante: true },
          },
        },
        orderBy: { fecha_apertura: 'desc' },
      }),
      prisma.th_vacantes.count({ where }),
    ]);

    // Formatear para el frontend
    const vacantesFormateadas = vacantes.map((v) => ({
      id: v.id,
      titulo: v.titulo,
      descripcion: v.descripcion,
      tipoContrato: v.tipo_contrato,
      jornada: v.jornada,
      salarioMin: v.salario_min ? parseFloat(v.salario_min) : null,
      salarioMax: v.salario_max ? parseFloat(v.salario_max) : null,
      ubicacion: v.ubicacion,
      fechaPublicacion: v.fecha_apertura,
      fechaCierre: v.fecha_cierre,
      puestosDisponibles: v.cantidad_puestos,
      requisitos: v.requisitos,
      departamentoId: v.departamento_id,
      cargo: v.th_cargos?.nombre,
      aplicaciones: v._count?.th_candidato_vacante || 0,
    }));

    return {
      data: vacantesFormateadas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener detalle de una vacante pública
   */
  async getVacantePublica(id) {
    const vacante = await prisma.th_vacantes.findFirst({
      where: {
        id,
        estado: 'ABIERTA',
        publicar_externo: true,
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        tipo_contrato: true,
        jornada: true,
        salario_min: true,
        salario_max: true,
        ubicacion: true,
        fecha_apertura: true,
        fecha_cierre: true,
        cantidad_puestos: true,
        requisitos: true,
        departamento_id: true,
        th_cargos: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            funciones: true,
            requisitos: true,
          },
        },
      },
    });

    if (!vacante) {
      throw new NotFoundError('Vacante no encontrada o no disponible');
    }

    return {
      id: vacante.id,
      titulo: vacante.titulo,
      descripcion: vacante.descripcion,
      tipoContrato: vacante.tipo_contrato,
      jornada: vacante.jornada,
      salarioMin: vacante.salario_min ? parseFloat(vacante.salario_min) : null,
      salarioMax: vacante.salario_max ? parseFloat(vacante.salario_max) : null,
      ubicacion: vacante.ubicacion,
      fechaPublicacion: vacante.fecha_apertura,
      fechaCierre: vacante.fecha_cierre,
      puestosDisponibles: vacante.cantidad_puestos,
      requisitos: vacante.requisitos,
      departamentoId: vacante.departamento_id,
      cargo: vacante.th_cargos,
    };
  }

  /**
   * Aplicar a una vacante específica (crea candidato + lo asocia a la vacante)
   */
  async aplicarAVacante(vacanteId, candidatoData) {
    // Verificar que la vacante existe y está abierta
    const vacante = await prisma.th_vacantes.findFirst({
      where: {
        id: vacanteId,
        estado: 'ABIERTA',
      },
    });

    if (!vacante) {
      throw new NotFoundError('La vacante no existe o no está disponible');
    }

    const dbData = this._mapToSnakeCase({
        ...candidatoData,
        birthDate: new Date(candidatoData.birthDate),
        languages: candidatoData.languages || [],
        references: candidatoData.references || [],
        previousInstitutions: candidatoData.previousInstitutions || [],
        areasOfInterest: candidatoData.areasOfInterest || [],
        availableShifts: candidatoData.availableShifts || [],
        documentIds: candidatoData.documentIds || [],
    });

    return prisma.$transaction(async (tx) => {
      // 1. Crear el candidato en candidatos_talento
      const candidatoTalento = await tx.candidatos_talento.create({
        data: {
          id: require('uuid').v4(),
          ...dbData,
          updated_at: new Date()
        },
      });

      // 2. Crear o actualizar en th_candidatos
      let thCandidato = await tx.th_candidatos.findFirst({
        where: {
          documento: candidatoData.documentNumber,
        },
      });

      if (!thCandidato) {
        const thData = this._mapToTHCandidatoData(candidatoTalento, candidatoData);
        thCandidato = await tx.th_candidatos.create({
          data: {
            id: require('uuid').v4(),
            ...thData,
            tipo_documento: TIPO_DOC_MAP[candidatoData.documentType] || candidatoData.documentType,
            documento: candidatoData.documentNumber,
          },
        });
      }

      // 3. Asociar candidato a la vacante
      await tx.th_candidato_vacante.create({
        data: {
          id: require('uuid').v4(),
          candidato_id: thCandidato.id,
          vacante_id: vacanteId,
          estado: 'APLICADO',
          etapa_actual: 'Recepción de CV',
        },
      });

      return {
        candidatoId: candidatoTalento.id,
        vacanteId: vacanteId,
        mensaje: 'Aplicación enviada exitosamente',
      };
    });
  }

  /**
   * Obtener departamentos/áreas disponibles para filtrar vacantes
   */
  async getDepartamentosConVacantes() {
    // Obtener IDs únicos de departamentos con vacantes
    const vacantes = await prisma.th_vacantes.findMany({
      where: {
        estado: 'ABIERTA',
        publicar_externo: true,
        departamento_id: { not: null },
      },
      select: {
        departamento_id: true,
      },
      distinct: ['departamento_id'],
    });

    const departamentoIds = vacantes
      .map((v) => v.departamento_id)
      .filter(Boolean);

    if (departamentoIds.length === 0) {
      return [];
    }

    // Buscar los departamentos por ID
    const departamentos = await prisma.departamento.findMany({
      where: {
        id: { in: departamentoIds },
      },
      select: {
        id: true,
        nombre: true,
      },
    });

    return departamentos;
  }
}

module.exports = new CandidatoService();
