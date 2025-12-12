const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

class DoctorService {
  async crear(data) {
    const { nombre, apellido, cedula, email, telefono, genero, fecha_nacimiento, direccion, licencia_medica, universidad, anios_experiencia, biografia, especialidades_ids, horarios, activo } = data;

    // Verificar si el email o cédula ya existen
    const usuarioExiste = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email },
          { cedula }
        ]
      }
    });

    if (usuarioExiste) {
      throw new Error('El email o cédula ya están registrados');
    }

    // Crear usuario con rol DOCTOR
    const password = await bcrypt.hash(cedula, 10); // Password temporal = cédula
    
    const usuario = await prisma.usuario.create({
      data: {
        email,
        password,
        nombre,
        apellido,
        cedula,
        rol: 'DOCTOR',
        telefono,
        activo: activo !== undefined ? activo : true,
      }
    });

    // Crear perfil de doctor
    const doctor = await prisma.doctor.create({
      data: {
        usuarioId: usuario.id,
        licenciaMedica: licencia_medica,
        universidad,
        aniosExperiencia: anios_experiencia ? parseInt(anios_experiencia) : null,
        biografia,
        horarios: horarios || {},
      },
      include: {
        usuario: true,
      }
    });

    // Asignar especialidades
    if (especialidades_ids && especialidades_ids.length > 0) {
      await prisma.doctorEspecialidad.createMany({
        data: especialidades_ids.map(espId => ({
          doctorId: doctor.id,
          especialidadId: espId
        }))
      });
    }

    return this.obtenerPorId(doctor.id);
  }

  async listar({ search = '', limit = 50, page = 1, usuarioId = '' }) {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    // Filtro por usuarioId
    if (usuarioId) {
      where.usuarioId = usuarioId;
    }
    
    // Filtro por búsqueda
    if (search) {
      where.usuario = {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
          { cedula: { contains: search } },
        ]
      };
    }

    const [doctores, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              cedula: true,
              email: true,
              telefono: true,
              activo: true,
            }
          },
          especialidades: {
            include: {
              especialidad: {
                select: {
                  id: true,
                  titulo: true,
                }
              }
            }
          }
        },
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.doctor.count({ where }),
    ]);

    const doctoresFormateados = doctores.map(doctor => ({
      id: doctor.id, // ID del doctor (tabla doctores)
      usuarioId: doctor.usuarioId, // ID del usuario asociado
      nombre: doctor.usuario?.nombre,
      apellido: doctor.usuario?.apellido,
      cedula: doctor.usuario?.cedula,
      email: doctor.usuario?.email,
      telefono: doctor.usuario?.telefono,
      activo: doctor.usuario?.activo,
      licenciaMedica: doctor.licenciaMedica,
      universidad: doctor.universidad,
      aniosExperiencia: doctor.aniosExperiencia,
      biografia: doctor.biografia,
      horarios: doctor.horarios,
      especialidades: doctor.especialidades.map(de => de.especialidad.titulo),
      especialidadesIds: doctor.especialidades.map(de => de.especialidad.id),
      createdAt: doctor.createdAt,
    }));

    return {
      doctores: doctoresFormateados,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async obtenerPorId(id) {
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        usuario: true,
        especialidades: {
          include: {
            especialidad: true,
          }
        }
      }
    });

    if (!doctor) {
      throw new Error('Doctor no encontrado');
    }

    return {
      id: doctor.id,
      ...doctor.usuario,
      licenciaMedica: doctor.licenciaMedica,
      universidad: doctor.universidad,
      aniosExperiencia: doctor.aniosExperiencia,
      biografia: doctor.biografia,
      horarios: doctor.horarios,
      especialidades: doctor.especialidades.map(de => de.especialidad.titulo),
      especialidadesIds: doctor.especialidades.map(de => de.especialidad.id),
    };
  }

  async actualizar(id, data) {
    const doctorExiste = await prisma.doctor.findUnique({ where: { id } });
    if (!doctorExiste) {
      throw new Error('Doctor no encontrado');
    }

    const { nombre, apellido, cedula, email, telefono, genero, fecha_nacimiento, direccion, licencia_medica, universidad, anios_experiencia, biografia, especialidades_ids, horarios, activo } = data;

    // Actualizar usuario
    await prisma.usuario.update({
      where: { id: doctorExiste.usuarioId },
      data: {
        nombre,
        apellido,
        cedula,
        email,
        telefono,
        activo,
      }
    });

    // Actualizar doctor
    await prisma.doctor.update({
      where: { id },
      data: {
        licenciaMedica: licencia_medica,
        universidad,
        aniosExperiencia: anios_experiencia ? parseInt(anios_experiencia) : null,
        biografia,
        horarios,
      }
    });

    // Actualizar especialidades
    if (especialidades_ids) {
      // Eliminar especialidades anteriores
      await prisma.doctorEspecialidad.deleteMany({
        where: { doctorId: id }
      });

      // Crear nuevas especialidades
      if (especialidades_ids.length > 0) {
        await prisma.doctorEspecialidad.createMany({
          data: especialidades_ids.map(espId => ({
            doctorId: id,
            especialidadId: espId
          }))
        });
      }
    }

    return this.obtenerPorId(id);
  }

  async eliminar(id) {
    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      throw new Error('Doctor no encontrado');
    }

    // Eliminar doctor (las especialidades se eliminan en cascada)
    await prisma.doctor.delete({ where: { id } });
    
    // Eliminar usuario
    await prisma.usuario.delete({ where: { id: doctor.usuarioId } });

    return { message: 'Doctor eliminado exitosamente' };
  }
}

module.exports = new DoctorService();
