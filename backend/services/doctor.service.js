const prisma = require('../db/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ValidationError, NotFoundError, AppError } = require('../utils/errors');
const { uploadImage, deleteImage, getPublicIdFromUrl, isConfigured: isCloudinaryConfigured } = require('../utils/cloudinary');
const { saveBase64Image, deleteFile, resizeBase64Image } = require('../utils/upload');
const emailService = require('./email.service');

/**
 * Genera una contraseña segura aleatoria
 * @param {number} length - Longitud de la contraseña (mínimo 12)
 * @returns {string} - Contraseña segura
 */
function generateSecurePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
}

class DoctorService {
  async crear(data) {
    const {
      nombre,
      apellido,
      cedula,
      email,
      telefono,
      genero,
      fecha_nacimiento,
      direccion,
      licencia_medica,
      universidad,
      anios_experiencia,
      biografia,
      foto,
      firma, // Firma digital del doctor (base64)
      sello, // Sello del doctor (base64)
      especialidades_ids,
      horarios,
      activo,
      password: customPassword // Contraseña personalizada (opcional)
    } = data;

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
      throw new ValidationError('El email o cédula ya están registrados');
    }

    try {
      // Procesar foto si se proporciona como base64
      let fotoUrl = null;
      console.log('[Doctor.crear] foto recibida:', foto ? `${String(foto).substring(0, 50)}... (${String(foto).length} chars)` : 'NULL');

      if (foto && foto.startsWith('data:')) {
        // Intentar subir a Cloudinary primero, fallback a almacenamiento local
        if (isCloudinaryConfigured()) {
          console.log('[Doctor] Subiendo foto a Cloudinary...');
          const result = await uploadImage(foto, 'doctors');
          fotoUrl = result.url;
          console.log('[Doctor] Foto subida a Cloudinary:', fotoUrl);
        } else {
          console.log('[Doctor] Cloudinary no configurado, usando almacenamiento local...');
          fotoUrl = await saveBase64Image(foto, 'doctors');
        }
      } else if (foto) {
        fotoUrl = foto; // Ya es una URL
        console.log('[Doctor] Usando URL existente:', fotoUrl);
      } else {
        console.log('[Doctor] No se proporcionó foto');
      }

      // Procesar y redimensionar firma si se proporciona (máx 400x200px para PDF optimizado)
      let firmaOptimizada = null;
      if (firma && firma.startsWith('data:image')) {
        console.log('[Doctor] Optimizando firma digital...');
        firmaOptimizada = await resizeBase64Image(firma, { maxWidth: 400, maxHeight: 200 });
        console.log('[Doctor] Firma optimizada');
      }

      // Procesar y redimensionar sello si se proporciona (máx 300x300px)
      let selloOptimizado = null;
      if (sello && sello.startsWith('data:image')) {
        console.log('[Doctor] Optimizando sello...');
        selloOptimizado = await resizeBase64Image(sello, { maxWidth: 300, maxHeight: 300 });
        console.log('[Doctor] Sello optimizado');
      }

      // Determinar la contraseña a usar (para guardar y para el correo)
      // SEGURIDAD: Generar contraseña aleatoria segura si no se proporciona una personalizada
      const passwordOriginal = customPassword && customPassword.length >= 6 ? customPassword : generateSecurePassword(12);

      // Uso de transacción para asegurar consistencia
      const result = await prisma.$transaction(async (tx) => {
        // 1. Crear usuario con rol DOCTOR
        const password = await bcrypt.hash(passwordOriginal, 10);

        const usuario = await tx.usuario.create({
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

        // 2. Crear perfil de doctor
        const doctor = await tx.doctor.create({
          data: {
            usuarioId: usuario.id,
            licenciaMedica: licencia_medica,
            universidad,
            aniosExperiencia: anios_experiencia ? parseInt(anios_experiencia) : null,
            biografia,
            foto: fotoUrl,
            firma: firmaOptimizada || firma || null, // Firma digital del doctor (optimizada)
            sello: selloOptimizado || sello || null, // Sello del doctor (optimizado)
            horarios: horarios || {},
          },
          include: {
            usuario: true,
          }
        });

        // 3. Asignar especialidades
        if (especialidades_ids && especialidades_ids.length > 0) {
          // Verificar que las especialidades existan
          const count = await tx.especialidad.count({
            where: { id: { in: especialidades_ids } }
          });

          if (count !== especialidades_ids.length) {
            throw new ValidationError('Una o más especialidades no existen');
          }

          await tx.doctorEspecialidad.createMany({
            data: especialidades_ids.map(espId => ({
              doctorId: doctor.id,
              especialidadId: espId
            }))
          });
        }

        return doctor;
      });

      // 4. Enviar correo de bienvenida (fuera de la transacción para no bloquear)
      try {
        await emailService.sendDoctorWelcomeEmail({
          to: email,
          nombre,
          apellido,
          email,
          password: passwordOriginal
        });
        console.log(`[Doctor] Correo de bienvenida enviado a ${email}`);
      } catch (emailError) {
        // No fallar la creación si el correo no se envía
        console.error('[Doctor] Error enviando correo de bienvenida:', emailError.message);
      }

      return this.obtenerPorId(result.id);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new AppError('Error al crear el doctor: ' + error.message);
    }
  }

  async listar({ search = '', limit = 50, page = 1, usuarioId = '', activo = undefined }) {
    const skip = (page - 1) * limit;

    const where = {};

    // Filtro por usuarioId
    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    // Filtro por estado activo
    if (activo !== undefined) {
      where.usuario = {
        ...where.usuario,
        activo: activo
      };
    }

    // Filtro por búsqueda
    if (search) {
      where.usuario = {
        ...where.usuario,
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
          { cedula: { contains: search } },
        ]
      };
    }

    try {
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
        foto: doctor.foto,
        firma: doctor.firma, // Firma digital del doctor
        sello: doctor.sello, // Sello médico del doctor
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
    } catch (error) {
      throw new AppError('Error al listar doctores: ' + error.message);
    }
  }

  async obtenerPorId(id) {
    try {
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
      throw new NotFoundError('Doctor no encontrado');
    }

    // Validar que el usuario asociado exista
    if (!doctor.usuario) {
      throw new NotFoundError('El doctor tiene datos inconsistentes: usuario no encontrado');
    }

    // Extraer datos del usuario para evitar sobreescribir el ID del doctor
    const { id: userId, ...usuarioData } = doctor.usuario;

    return {
      id: doctor.id,
      usuarioId: userId,
      ...usuarioData,
      licenciaMedica: doctor.licenciaMedica,
      universidad: doctor.universidad,
      aniosExperiencia: doctor.aniosExperiencia,
      biografia: doctor.biografia,
      foto: doctor.foto,
      firma: doctor.firma, // Firma digital del doctor
      sello: doctor.sello, // Sello del doctor
      horarios: doctor.horarios,
      especialidades: doctor.especialidades?.map(de => de.especialidad?.titulo) || [],
      especialidadesIds: doctor.especialidades?.map(de => de.especialidad?.id) || [],
    };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError('Error al obtener doctor: ' + error.message);
    }
  }

  async actualizar(id, data) {
    const doctorExiste = await prisma.doctor.findUnique({ where: { id } });
    if (!doctorExiste) {
      throw new NotFoundError('Doctor no encontrado');
    }

    const {
      nombre,
      apellido,
      cedula,
      email,
      telefono,
      genero,
      fecha_nacimiento,
      direccion,
      licencia_medica,
      universidad,
      anios_experiencia,
      biografia,
      foto,
      firma, // Firma digital del doctor (base64)
      sello, // Sello del doctor (base64)
      especialidades_ids,
      horarios,
      activo,
      password: newPassword // Nueva contraseña (opcional)
    } = data;

    try {
      // Procesar nueva foto si se proporciona
      let fotoUrl = undefined; // undefined significa no actualizar
      console.log('[Doctor] foto recibida:', foto ? `${foto.substring(0, 50)}... (${foto.length} chars)` : 'NULL');

      if (foto && foto.startsWith('data:')) {
        // Nueva foto en base64 - subirla
        if (isCloudinaryConfigured()) {
          console.log('[Doctor] Subiendo nueva foto a Cloudinary...');
          const result = await uploadImage(foto, 'doctors');
          fotoUrl = result.url;
          console.log('[Doctor] Foto subida a Cloudinary:', fotoUrl);

          // Eliminar foto anterior de Cloudinary si existe
          if (doctorExiste.foto && doctorExiste.foto.includes('cloudinary.com')) {
            const oldPublicId = getPublicIdFromUrl(doctorExiste.foto);
            if (oldPublicId) {
              await deleteImage(oldPublicId);
            }
          } else if (doctorExiste.foto) {
            // Eliminar foto local si existe
            await deleteFile(doctorExiste.foto);
          }
        } else {
          console.log('[Doctor] Cloudinary no configurado, usando almacenamiento local...');
          fotoUrl = await saveBase64Image(foto, 'doctors');
          if (doctorExiste.foto) {
            await deleteFile(doctorExiste.foto);
          }
        }
      } else if (foto === null) {
        // Se quiere eliminar la foto
        if (doctorExiste.foto) {
          if (doctorExiste.foto.includes('cloudinary.com')) {
            const publicId = getPublicIdFromUrl(doctorExiste.foto);
            if (publicId) {
              await deleteImage(publicId);
            }
          } else {
            await deleteFile(doctorExiste.foto);
          }
        }
        fotoUrl = null;
      } else if (foto) {
        // Ya es una URL, usarla directamente
        fotoUrl = foto;
      }

      // Procesar y redimensionar firma si se proporciona como base64 (máx 400x200px para PDF optimizado)
      let firmaOptimizada = undefined;
      if (firma !== undefined) {
        if (firma && firma.startsWith('data:image')) {
          console.log('[Doctor] Optimizando firma digital...');
          firmaOptimizada = await resizeBase64Image(firma, { maxWidth: 400, maxHeight: 200 });
          console.log('[Doctor] Firma optimizada');
        } else {
          firmaOptimizada = firma; // null o URL existente
        }
      }

      // Procesar y redimensionar sello si se proporciona como base64 (máx 300x300px)
      let selloOptimizado = undefined;
      if (sello !== undefined) {
        if (sello && sello.startsWith('data:image')) {
          console.log('[Doctor] Optimizando sello...');
          selloOptimizado = await resizeBase64Image(sello, { maxWidth: 300, maxHeight: 300 });
          console.log('[Doctor] Sello optimizado');
        } else {
          selloOptimizado = sello; // null o URL existente
        }
      }

      await prisma.$transaction(async (tx) => {
        // 1. Actualizar usuario
        const usuarioUpdateData = {
          nombre,
          apellido,
          cedula,
          email,
          telefono,
          activo,
        };

        // Actualizar contraseña si se proporciona
        if (newPassword && newPassword.length >= 6) {
          usuarioUpdateData.password = await bcrypt.hash(newPassword, 10);
          console.log('[DEBUG Doctor] Contraseña actualizada');
        }

        await tx.usuario.update({
          where: { id: doctorExiste.usuarioId },
          data: usuarioUpdateData
        });

        // 2. Actualizar doctor
        const doctorUpdateData = {
          licenciaMedica: licencia_medica,
          universidad,
          aniosExperiencia: anios_experiencia ? parseInt(anios_experiencia) : null,
          biografia,
          horarios: horarios,
        };

        // Solo incluir foto si se proporcionó
        if (fotoUrl !== undefined) {
          doctorUpdateData.foto = fotoUrl;
        }

        // Actualizar firma si se proporcionó (usa versión optimizada)
        if (firmaOptimizada !== undefined) {
          doctorUpdateData.firma = firmaOptimizada;
        }

        // Actualizar sello si se proporcionó (usa versión optimizada)
        if (selloOptimizado !== undefined) {
          doctorUpdateData.sello = selloOptimizado;
        }

        await tx.doctor.update({
          where: { id },
          data: doctorUpdateData
        });

        // 3. Actualizar especialidades
        if (especialidades_ids) {
          // Verificar que las especialidades existan
          if (especialidades_ids.length > 0) {
            const count = await tx.especialidad.count({
              where: { id: { in: especialidades_ids } }
            });
            
            if (count !== especialidades_ids.length) {
              throw new ValidationError('Una o más especialidades no existen');
            }
          }

          // Eliminar especialidades anteriores
          await tx.doctorEspecialidad.deleteMany({
            where: { doctorId: id }
          });

          // Crear nuevas especialidades
          if (especialidades_ids.length > 0) {
            await tx.doctorEspecialidad.createMany({
              data: especialidades_ids.map(espId => ({
                doctorId: id,
                especialidadId: espId
              }))
            });
          }
        }
      });

      return this.obtenerPorId(id);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      throw new AppError('Error al actualizar doctor: ' + error.message);
    }
  }

  async eliminar(id) {
    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      throw new NotFoundError('Doctor no encontrado');
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Eliminar doctor (las especialidades se eliminan en cascada por la definición del modelo)
        // Pero es buena práctica ser explícito o confiar en el onDelete: Cascade del schema

        // Primero eliminamos el doctor
        await tx.doctor.delete({ where: { id } });

        // Luego eliminamos el usuario asociado
        await tx.usuario.delete({ where: { id: doctor.usuarioId } });
      });

      return { message: 'Doctor eliminado exitosamente' };
    } catch (error) {
      throw new AppError('Error al eliminar doctor: ' + error.message);
    }
  }

  async toggleActivo(id) {
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: { usuario: true }
    });

    if (!doctor) {
      throw new NotFoundError('Doctor no encontrado');
    }

    const nuevoEstado = !doctor.usuario.activo;

    try {
      await prisma.usuario.update({
        where: { id: doctor.usuarioId },
        data: { activo: nuevoEstado }
      });

      return {
        id: doctor.id,
        activo: nuevoEstado,
        message: nuevoEstado
          ? 'Doctor activado exitosamente'
          : 'Doctor desactivado exitosamente'
      };
    } catch (error) {
      throw new AppError('Error al cambiar estado del doctor: ' + error.message);
    }
  }

  async actualizarHorarios(id, horarios) {
    const doctor = await prisma.doctor.findUnique({ where: { id } });

    if (!doctor) {
      throw new NotFoundError('Doctor no encontrado');
    }

    try {
      await prisma.doctor.update({
        where: { id },
        data: { horarios: horarios || {} }
      });

      return this.obtenerPorId(id);
    } catch (error) {
      throw new AppError('Error al actualizar horarios: ' + error.message);
    }
  }
}

module.exports = new DoctorService();
