/**
 * Configuración de Swagger/OpenAPI para Clínica Mía API
 * @version 2.1.0
 */
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Clínica Mía API',
      version: '2.1.0',
      description: `
# API de Sistema de Gestión Hospitalaria

API RESTful completa para el sistema de gestión hospitalaria **Clínica Mía**.
Esta documentación detalla todos los endpoints disponibles, modelos de datos,
autenticación y respuestas esperadas.

## Características Principales

- **Autenticación JWT** con refresh tokens
- **Control de acceso basado en roles (RBAC)**
- **Historia Clínica Electrónica (HCE)**
- **Gestión de hospitalización completa**
- **Facturación y generación de RIPS**
- **Módulo de calidad IPS Colombia**
- **Gestión de quirófanos**
- **Imagenología y laboratorio**

## Formato de Respuestas

Todas las respuestas siguen el formato estándar:

\`\`\`json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": { ... }
}
\`\`\`

Para listas paginadas:

\`\`\`json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
\`\`\`
      `,
      contact: {
        name: 'Equipo de Desarrollo Clínica Mía',
        email: 'dev@clinicamia.com',
        url: 'https://clinicamia.com',
      },
      license: {
        name: 'Proprietary',
        url: 'https://clinicamia.com/license',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor de Desarrollo Local',
      },
      {
        url: 'https://api.clinicamia.com',
        description: 'Servidor de Producción',
      },
    ],
    tags: [
      // ============ AUTENTICACIÓN Y USUARIOS ============
      {
        name: 'Autenticación',
        description: 'Endpoints de autenticación, login, logout y gestión de tokens JWT',
      },
      {
        name: 'Usuarios',
        description: 'Gestión de usuarios del sistema',
      },
      {
        name: 'Roles',
        description: 'Gestión de roles y permisos del sistema RBAC',
      },
      {
        name: 'Permisos',
        description: 'Gestión granular de permisos por módulo',
      },
      {
        name: 'Auditoría',
        description: 'Registro y consulta de auditoría del sistema',
      },

      // ============ GESTIÓN CLÍNICA ============
      {
        name: 'Pacientes',
        description: 'Gestión completa de pacientes: registro, actualización, historial',
      },
      {
        name: 'Doctores',
        description: 'Gestión de médicos y profesionales de salud',
      },
      {
        name: 'Citas',
        description: 'Programación y gestión de citas médicas',
      },
      {
        name: 'Agenda',
        description: 'Gestión de agenda médica y disponibilidad',
      },
      {
        name: 'Disponibilidad',
        description: 'Configuración de horarios y disponibilidad de doctores',
      },
      {
        name: 'Consultas',
        description: 'Registro y gestión de consultas médicas',
      },
      {
        name: 'Interconsultas',
        description: 'Solicitud y gestión de interconsultas entre especialidades',
      },

      // ============ ESTRUCTURA ORGANIZACIONAL ============
      {
        name: 'Departamentos',
        description: 'Gestión de departamentos hospitalarios',
      },
      {
        name: 'Especialidades',
        description: 'Gestión de especialidades médicas',
      },

      // ============ HOSPITALIZACIÓN ============
      {
        name: 'Unidades',
        description: 'Gestión de unidades hospitalarias (UCI, Urgencias, etc.)',
      },
      {
        name: 'Habitaciones',
        description: 'Gestión de habitaciones hospitalarias',
      },
      {
        name: 'Camas',
        description: 'Gestión de camas y su disponibilidad',
      },
      {
        name: 'Admisiones',
        description: 'Gestión de admisiones hospitalarias',
      },
      {
        name: 'Movimientos',
        description: 'Traslados y movimientos de pacientes hospitalizados',
      },
      {
        name: 'Egresos',
        description: 'Gestión de altas y egresos hospitalarios',
      },

      // ============ HISTORIA CLÍNICA ELECTRÓNICA ============
      {
        name: 'HCE',
        description: 'Historia Clínica Electrónica - Endpoints principales',
      },
      {
        name: 'Evoluciones',
        description: 'Evoluciones clínicas formato SOAP',
      },
      {
        name: 'Signos Vitales',
        description: 'Registro y consulta de signos vitales',
      },
      {
        name: 'Diagnósticos',
        description: 'Gestión de diagnósticos CIE-10',
      },
      {
        name: 'Alertas',
        description: 'Alertas médicas del paciente (alergias, condiciones)',
      },

      // ============ ÓRDENES MÉDICAS ============
      {
        name: 'Órdenes Médicas',
        description: 'Órdenes de exámenes y procedimientos',
      },
      {
        name: 'Órdenes de Medicamentos',
        description: 'Órdenes de medicamentos y prescripciones',
      },
      {
        name: 'Prescripciones',
        description: 'Prescripciones médicas detalladas',
      },
      {
        name: 'Administraciones',
        description: 'Registro de administración de medicamentos',
      },
      {
        name: 'Procedimientos',
        description: 'Gestión de procedimientos médicos y quirúrgicos',
      },

      // ============ FACTURACIÓN ============
      {
        name: 'Facturas',
        description: 'Facturación, pagos y generación de RIPS',
      },
      {
        name: 'Productos',
        description: 'Gestión de productos (medicamentos, insumos)',
      },
      {
        name: 'Categorías de Productos',
        description: 'Categorización de productos e insumos',
      },
      {
        name: 'Etiquetas de Productos',
        description: 'Etiquetado y clasificación de productos',
      },
      {
        name: 'Paquetes de Hospitalización',
        description: 'Paquetes y tarifas de hospitalización',
      },

      // ============ DIAGNÓSTICO ============
      {
        name: 'Imagenología',
        description: 'Gestión de estudios de imagenología (RX, TAC, RM, etc.)',
      },
      {
        name: 'Categorías de Exámenes',
        description: 'Categorización de exámenes de laboratorio e imagen',
      },
      {
        name: 'Exámenes y Procedimientos',
        description: 'Catálogo de exámenes y procedimientos disponibles',
      },

      // ============ URGENCIAS Y ENFERMERÍA ============
      {
        name: 'Urgencias',
        description: 'Gestión de atención de urgencias y triage',
      },
      {
        name: 'Notas de Enfermería',
        description: 'Registro de notas y cuidados de enfermería',
      },
      {
        name: 'Asignaciones de Enfermería',
        description: 'Asignación de pacientes a personal de enfermería',
      },
      {
        name: 'Glucometrías',
        description: 'Registro y seguimiento de glucometrías',
      },
      {
        name: 'Balance de Líquidos',
        description: 'Control de ingresos y egresos de líquidos',
      },
      {
        name: 'Transfusiones',
        description: 'Registro de transfusiones sanguíneas',
      },
      {
        name: 'Plantillas de Notas',
        description: 'Plantillas predefinidas para notas clínicas',
      },

      // ============ QUIRÓFANOS ============
      {
        name: 'Quirófanos',
        description: 'Gestión de quirófanos y programación quirúrgica',
      },

      // ============ CALIDAD IPS COLOMBIA ============
      {
        name: 'Habilitación',
        description: 'Gestión de requisitos de habilitación IPS',
      },
      {
        name: 'PAMEC',
        description: 'Programa de Auditoría para el Mejoramiento de la Calidad',
      },
      {
        name: 'Acreditación',
        description: 'Gestión del proceso de acreditación en salud',
      },
      {
        name: 'Eventos Adversos',
        description: 'Reporte y gestión de eventos adversos',
      },
      {
        name: 'Seguridad del Paciente',
        description: 'Programa de seguridad del paciente',
      },
      {
        name: 'Indicadores SIC',
        description: 'Sistema de Información de Calidad - Indicadores',
      },
      {
        name: 'PQRS',
        description: 'Peticiones, Quejas, Reclamos y Sugerencias',
      },
      {
        name: 'Comités',
        description: 'Gestión de comités hospitalarios',
      },
      {
        name: 'Vigilancia en Salud',
        description: 'Vigilancia epidemiológica y eventos de salud pública',
      },
      {
        name: 'Documentos de Calidad',
        description: 'Gestión documental del sistema de calidad',
      },
      {
        name: 'Planes de Acción',
        description: 'Planes de mejoramiento y acciones correctivas',
      },

      // ============ SERVICIOS ADICIONALES ============
      {
        name: 'Dashboard',
        description: 'Estadísticas y KPIs del sistema',
      },
      {
        name: 'Reportes',
        description: 'Generación de reportes e informes',
      },
      {
        name: 'MiaPass',
        description: 'Programa de fidelización y suscripciones',
      },
      {
        name: 'Publicaciones',
        description: 'Gestión de publicaciones y comunicados',
      },
      {
        name: 'Tickets',
        description: 'Sistema de tickets de soporte',
      },
      {
        name: 'Documentos del Paciente',
        description: 'Gestión de documentos y archivos del paciente',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido en el endpoint POST /auth/login. El token expira en 15 minutos. Use POST /auth/refresh para renovarlo.',
        },
      },
      schemas: {
        // ============ RESPUESTAS ESTÁNDAR ============
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operación exitosa',
            },
            data: {
              type: 'object',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error en la operación',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {},
            },
            pagination: {
              $ref: '#/components/schemas/Pagination',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 20,
            },
            total: {
              type: 'integer',
              example: 100,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
          },
        },

        // ============ PARÁMETROS COMUNES ============
        IdParameter: {
          type: 'string',
          format: 'uuid',
          description: 'Identificador único UUID',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },

        // ============ AUTENTICACIÓN ============
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@clinicamia.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'admin123',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Login exitoso',
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  description: 'Token JWT de acceso (15 min)',
                },
                refreshToken: {
                  type: 'string',
                  description: 'Token de renovación (7 días)',
                },
                user: {
                  $ref: '#/components/schemas/Usuario',
                },
              },
            },
          },
        },
        RefreshTokenInput: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Token de renovación obtenido en login',
            },
          },
        },

        // ============ USUARIO ============
        Usuario: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            nombre: {
              type: 'string',
            },
            apellido: {
              type: 'string',
            },
            rol: {
              type: 'string',
              enum: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST', 'LAB_TECHNICIAN'],
            },
            activo: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        UsuarioInput: {
          type: 'object',
          required: ['email', 'password', 'nombre', 'apellido', 'rol'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              minLength: 6,
            },
            nombre: {
              type: 'string',
            },
            apellido: {
              type: 'string',
            },
            rol: {
              type: 'string',
              enum: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT', 'PHARMACIST', 'LAB_TECHNICIAN'],
            },
          },
        },

        // ============ PACIENTE ============
        Paciente: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            nombre: {
              type: 'string',
            },
            apellido: {
              type: 'string',
            },
            tipoDocumento: {
              type: 'string',
              enum: ['CC', 'TI', 'CE', 'PA', 'RC', 'NIT'],
            },
            cedula: {
              type: 'string',
            },
            fechaNacimiento: {
              type: 'string',
              format: 'date',
            },
            genero: {
              type: 'string',
              enum: ['Masculino', 'Femenino', 'Otro'],
            },
            telefono: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            direccion: {
              type: 'string',
            },
            eps: {
              type: 'string',
            },
            grupoSanguineo: {
              type: 'string',
              enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            },
            activo: {
              type: 'boolean',
            },
          },
        },
        PacienteInput: {
          type: 'object',
          required: ['nombre', 'apellido', 'cedula'],
          properties: {
            nombre: {
              type: 'string',
            },
            apellido: {
              type: 'string',
            },
            tipoDocumento: {
              type: 'string',
              enum: ['CC', 'TI', 'CE', 'PA', 'RC', 'NIT'],
              default: 'CC',
            },
            cedula: {
              type: 'string',
            },
            fechaNacimiento: {
              type: 'string',
              format: 'date',
            },
            genero: {
              type: 'string',
              enum: ['Masculino', 'Femenino', 'Otro'],
            },
            telefono: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            direccion: {
              type: 'string',
            },
            eps: {
              type: 'string',
            },
            grupoSanguineo: {
              type: 'string',
              enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            },
          },
        },

        // ============ DOCTOR ============
        Doctor: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            nombre: {
              type: 'string',
            },
            apellido: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            telefono: {
              type: 'string',
            },
            registroMedico: {
              type: 'string',
            },
            especialidadId: {
              type: 'string',
              format: 'uuid',
            },
            departamentoId: {
              type: 'string',
              format: 'uuid',
            },
            activo: {
              type: 'boolean',
            },
            especialidad: {
              $ref: '#/components/schemas/Especialidad',
            },
            departamento: {
              $ref: '#/components/schemas/Departamento',
            },
          },
        },

        // ============ CITA ============
        Cita: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            pacienteId: {
              type: 'string',
              format: 'uuid',
            },
            doctorId: {
              type: 'string',
              format: 'uuid',
            },
            especialidadId: {
              type: 'string',
              format: 'uuid',
            },
            fecha: {
              type: 'string',
              format: 'date',
            },
            horaInicio: {
              type: 'string',
              format: 'time',
              example: '09:00',
            },
            horaFin: {
              type: 'string',
              format: 'time',
              example: '09:30',
            },
            estado: {
              type: 'string',
              enum: ['Programada', 'Confirmada', 'EnCurso', 'Completada', 'Cancelada', 'NoAsistio'],
            },
            motivo: {
              type: 'string',
            },
            observaciones: {
              type: 'string',
            },
            paciente: {
              $ref: '#/components/schemas/Paciente',
            },
            doctor: {
              $ref: '#/components/schemas/Doctor',
            },
          },
        },
        CitaInput: {
          type: 'object',
          required: ['paciente_id', 'doctor_id', 'especialidad_id', 'fecha', 'hora_inicio', 'hora_fin'],
          properties: {
            paciente_id: {
              type: 'string',
              format: 'uuid',
            },
            doctor_id: {
              type: 'string',
              format: 'uuid',
            },
            especialidad_id: {
              type: 'string',
              format: 'uuid',
            },
            fecha: {
              type: 'string',
              format: 'date',
            },
            hora_inicio: {
              type: 'string',
              example: '09:00',
            },
            hora_fin: {
              type: 'string',
              example: '09:30',
            },
            motivo: {
              type: 'string',
            },
            observaciones: {
              type: 'string',
            },
          },
        },

        // ============ DEPARTAMENTO Y ESPECIALIDAD ============
        Departamento: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            nombre: {
              type: 'string',
            },
            descripcion: {
              type: 'string',
            },
            activo: {
              type: 'boolean',
            },
          },
        },
        Especialidad: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            titulo: {
              type: 'string',
            },
            descripcion: {
              type: 'string',
            },
            duracionCitaMinutos: {
              type: 'integer',
            },
            activo: {
              type: 'boolean',
            },
          },
        },

        // ============ HOSPITALIZACIÓN ============
        Unidad: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            nombre: {
              type: 'string',
            },
            tipo: {
              type: 'string',
              enum: ['UCI', 'Urgencias', 'Hospitalizacion', 'Cirugia', 'Pediatria', 'Maternidad'],
            },
            piso: {
              type: 'integer',
            },
            capacidad: {
              type: 'integer',
            },
            activo: {
              type: 'boolean',
            },
          },
        },
        Habitacion: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            numero: {
              type: 'string',
            },
            unidadId: {
              type: 'string',
              format: 'uuid',
            },
            tipo: {
              type: 'string',
              enum: ['Individual', 'Doble', 'Suite'],
            },
            tarifaDiaria: {
              type: 'number',
            },
            activo: {
              type: 'boolean',
            },
          },
        },
        Cama: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            numero: {
              type: 'string',
            },
            habitacionId: {
              type: 'string',
              format: 'uuid',
            },
            estado: {
              type: 'string',
              enum: ['Disponible', 'Ocupada', 'Mantenimiento', 'Limpieza'],
            },
          },
        },
        Admision: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            pacienteId: {
              type: 'string',
              format: 'uuid',
            },
            tipo: {
              type: 'string',
              enum: ['Urgencias', 'Hospitalizacion', 'Cirugia', 'Observacion'],
            },
            estado: {
              type: 'string',
              enum: ['Activa', 'Egresada', 'Transferida'],
            },
            fechaIngreso: {
              type: 'string',
              format: 'date-time',
            },
            fechaEgreso: {
              type: 'string',
              format: 'date-time',
            },
            motivoIngreso: {
              type: 'string',
            },
            diagnosticoIngreso: {
              type: 'string',
            },
          },
        },

        // ============ HCE ============
        EvolucionClinica: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            pacienteId: {
              type: 'string',
              format: 'uuid',
            },
            doctorId: {
              type: 'string',
              format: 'uuid',
            },
            subjetivo: {
              type: 'string',
              description: 'S - Síntomas reportados por el paciente',
            },
            objetivo: {
              type: 'string',
              description: 'O - Hallazgos del examen físico',
            },
            analisis: {
              type: 'string',
              description: 'A - Análisis y diagnóstico',
            },
            plan: {
              type: 'string',
              description: 'P - Plan de tratamiento',
            },
            tipoEvolucion: {
              type: 'string',
              enum: ['Ingreso', 'Seguimiento', 'Especialista', 'Egreso'],
            },
            fechaEvolucion: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        SignosVitales: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            pacienteId: {
              type: 'string',
              format: 'uuid',
            },
            frecuenciaCardiaca: {
              type: 'integer',
              description: 'Latidos por minuto',
            },
            frecuenciaRespiratoria: {
              type: 'integer',
              description: 'Respiraciones por minuto',
            },
            presionSistolica: {
              type: 'integer',
              description: 'mmHg',
            },
            presionDiastolica: {
              type: 'integer',
              description: 'mmHg',
            },
            temperatura: {
              type: 'number',
              description: 'Grados Celsius',
            },
            saturacionOxigeno: {
              type: 'integer',
              description: 'Porcentaje',
            },
            peso: {
              type: 'number',
              description: 'Kilogramos',
            },
            talla: {
              type: 'number',
              description: 'Centímetros',
            },
            fechaRegistro: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Diagnostico: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            pacienteId: {
              type: 'string',
              format: 'uuid',
            },
            codigoCIE10: {
              type: 'string',
              description: 'Código CIE-10',
            },
            descripcion: {
              type: 'string',
            },
            tipo: {
              type: 'string',
              enum: ['Principal', 'Secundario', 'Complicacion'],
            },
            estado: {
              type: 'string',
              enum: ['Activo', 'Resuelto', 'Cronico'],
            },
            fechaDiagnostico: {
              type: 'string',
              format: 'date',
            },
          },
        },

        // ============ FACTURACIÓN ============
        Factura: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            numero: {
              type: 'string',
              example: 'F-2025-00001',
            },
            pacienteId: {
              type: 'string',
              format: 'uuid',
            },
            estado: {
              type: 'string',
              enum: ['Pendiente', 'Parcial', 'Pagada', 'Cancelada'],
            },
            subtotal: {
              type: 'number',
            },
            descuentos: {
              type: 'number',
            },
            impuestos: {
              type: 'number',
            },
            total: {
              type: 'number',
            },
            saldoPendiente: {
              type: 'number',
            },
            fechaEmision: {
              type: 'string',
              format: 'date-time',
            },
            fechaVencimiento: {
              type: 'string',
              format: 'date-time',
            },
            cubiertoPorEPS: {
              type: 'boolean',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/FacturaItem',
              },
            },
            pagos: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Pago',
              },
            },
          },
        },
        FacturaItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            tipo: {
              type: 'string',
              enum: ['Consulta', 'OrdenMedica', 'OrdenMedicamento', 'Hospitalizacion', 'Otro'],
            },
            descripcion: {
              type: 'string',
            },
            cantidad: {
              type: 'integer',
            },
            precioUnitario: {
              type: 'number',
            },
            descuento: {
              type: 'number',
            },
            subtotal: {
              type: 'number',
            },
          },
        },
        Pago: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            facturaId: {
              type: 'string',
              format: 'uuid',
            },
            monto: {
              type: 'number',
            },
            metodoPago: {
              type: 'string',
              enum: ['Efectivo', 'Tarjeta', 'Transferencia', 'EPS', 'Otro'],
            },
            referencia: {
              type: 'string',
            },
            fechaPago: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        // ============ URGENCIAS ============
        Urgencia: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            pacienteId: {
              type: 'string',
              format: 'uuid',
            },
            prioridadTriage: {
              type: 'string',
              enum: ['Rojo', 'Naranja', 'Amarillo', 'Verde', 'Azul'],
              description: 'Nivel de triage según protocolo Manchester',
            },
            motivoConsulta: {
              type: 'string',
            },
            estado: {
              type: 'string',
              enum: ['EnEspera', 'EnAtencion', 'EnObservacion', 'Hospitalizado', 'Alta', 'Remitido'],
            },
            fechaIngreso: {
              type: 'string',
              format: 'date-time',
            },
            fechaAtencion: {
              type: 'string',
              format: 'date-time',
            },
            fechaEgreso: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        // ============ QUIRÓFANO ============
        Quirofano: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            nombre: {
              type: 'string',
            },
            tipo: {
              type: 'string',
              enum: ['General', 'Cardiovascular', 'Neurocirugia', 'Ortopedia', 'Oftalmologia'],
            },
            estado: {
              type: 'string',
              enum: ['Disponible', 'EnUso', 'Limpieza', 'Mantenimiento'],
            },
            equipamiento: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        ProgramacionQuirurgica: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            pacienteId: {
              type: 'string',
              format: 'uuid',
            },
            quirofanoId: {
              type: 'string',
              format: 'uuid',
            },
            procedimiento: {
              type: 'string',
            },
            estado: {
              type: 'string',
              enum: ['Programada', 'EnPreparacion', 'EnCurso', 'Completada', 'Cancelada', 'Suspendida'],
            },
            fechaProgramada: {
              type: 'string',
              format: 'date-time',
            },
            duracionEstimada: {
              type: 'integer',
              description: 'Minutos',
            },
            prioridad: {
              type: 'string',
              enum: ['Electivo', 'Urgente', 'Emergencia'],
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acceso faltante o inválido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Token no proporcionado o inválido',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Sin permisos para realizar esta acción',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'No tiene permisos para acceder a este recurso',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Recurso no encontrado',
              },
            },
          },
        },
        ValidationError: {
          description: 'Error de validación en los datos enviados',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Error de validación',
                details: [
                  {
                    path: ['email'],
                    message: 'El email es requerido',
                  },
                ],
              },
            },
          },
        },
        ServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Error interno del servidor',
              },
            },
          },
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Número de página',
          schema: {
            type: 'integer',
            default: 1,
            minimum: 1,
          },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Cantidad de registros por página',
          schema: {
            type: 'integer',
            default: 20,
            minimum: 1,
            maximum: 100,
          },
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda',
          schema: {
            type: 'string',
          },
        },
        IdPathParam: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID único del recurso (UUID)',
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './validators/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
