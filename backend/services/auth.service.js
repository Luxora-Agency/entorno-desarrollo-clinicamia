/**
 * Service de autenticación
 */
const prisma = require('../db/prisma');
const { 
  hashPassword, 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken,
  REFRESH_TOKEN_EXPIRES_DAYS
} = require('../utils/auth');
const { validateRequired, isValidEmail, isValidPassword } = require('../utils/validators');
const { ValidationError, UnauthorizedError, NotFoundError } = require('../utils/errors');
const { addDays } = require('date-fns');

class AuthService {
  /**
   * Registrar un nuevo usuario
   */
  async register(data) {
    // Validar campos requeridos (rol es opcional, por defecto PATIENT)
    const missing = validateRequired(['email', 'password', 'nombre', 'apellido'], data);
    if (missing) {
      throw new ValidationError(`Campos requeridos: ${missing.join(', ')}`);
    }

    // Validar email
    if (!isValidEmail(data.email)) {
      throw new ValidationError('Email inválido');
    }

    // Validar contraseña
    if (!isValidPassword(data.password)) {
      throw new ValidationError('La contraseña debe tener al menos 6 caracteres');
    }

    // Verificar si el usuario ya existe
    const existing = await prisma.usuario.findUnique({
      where: { email: data.email }
    });

    if (existing) {
      throw new ValidationError('El email ya está registrado');
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(data.password);

    // Rol por defecto es PATIENT si no se especifica
    const rol = data.rol || 'PATIENT';

    // Crear usuario
    const user = await prisma.usuario.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: rol,
        telefono: data.telefono,
        cedula: data.cedula,
      },
    });

    console.log('User created:', user);

    // Si es paciente, crear registro de paciente vinculado
    let paciente = null;
    if (rol === 'PATIENT') {
      try {
        // Generar cédula temporal única basada en el ID del usuario
        const cedulaTemporal = `TEMP-${user.id.substring(0, 8)}`;

        paciente = await prisma.paciente.create({
          data: {
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
            cedula: cedulaTemporal,
            telefono: data.telefono || null,
            tipoDocumento: 'CC',
          },
        });
        console.log('Paciente created:', paciente.id);
      } catch (e) {
        console.warn('No se pudo crear paciente automáticamente:', e);
      }
    }

    // Intentar asignar rol en la tabla nueva si existe
    try {
      const role = await prisma.role.findUnique({ where: { name: rol } });
      if (role) {
        await prisma.userRole.create({
          data: {
            usuarioId: user.id,
            roleId: role.id
          }
        });
      }
    } catch (e) {
      console.warn('No se pudo asignar rol relacional automáticamente:', e);
    }

    // Generar tokens
    const tokens = await this._generateTokens(user);

    // Remover password del usuario antes de devolver
    const { password: _, ...userWithoutPassword } = user;
    const userData = { ...userWithoutPassword, pacienteId: paciente?.id };

    // Devolver tanto 'user' como 'usuario' para compatibilidad con ambos frontends
    return {
      user: userData,
      usuario: userData,
      ...tokens
    };
  }

  /**
   * Login de usuario
   */
  async login(email, password) {
    // Validar datos
    if (!email || !password) {
      throw new ValidationError('Email y contraseña son requeridos');
    }

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { email, activo: true },
    });

    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar bloqueo
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError('Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente más tarde.');
    }

    // Verificar contraseña
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      // Incrementar intentos fallidos
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData = { failedLoginAttempts: failedAttempts };
      
      // Bloquear si supera 5 intentos (por 15 minutos)
      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        updateData.failedLoginAttempts = 0; // Resetear para el siguiente ciclo
      }

      await prisma.usuario.update({
        where: { id: user.id },
        data: updateData
      });

      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Resetear intentos fallidos y actualizar lastLogin
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date()
      }
    });

    // Si es paciente, buscar su registro de paciente
    let pacienteId = null;
    if (user.rol === 'PATIENT') {
      const paciente = await prisma.paciente.findFirst({
        where: { email: user.email },
        select: { id: true }
      });
      pacienteId = paciente?.id;
    }

    // Remover password
    const { password: _, ...userWithoutPassword } = user;
    const userData = { ...userWithoutPassword, pacienteId };

    // Generar tokens
    const tokens = await this._generateTokens(user);

    // Devolver tanto 'user' como 'usuario' para compatibilidad con ambos frontends
    return {
      user: userData,
      usuario: userData,
      ...tokens
    };
  }

  /**
   * Refrescar token
   */
  async refreshToken(token) {
    if (!token) {
      throw new ValidationError('Refresh Token requerido');
    }

    // Buscar token en BD
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!storedToken) {
      throw new UnauthorizedError('Token inválido');
    }

    // Verificar si está revocado
    if (storedToken.revoked) {
      // Detección de robo de token: Revocar todos los tokens de este usuario
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revoked: true }
      });
      throw new UnauthorizedError('Token revocado (posible robo detectado)');
    }

    // Verificar expiración
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Token expirado');
    }

    // Rotación de token: Revocar el usado y generar uno nuevo
    const newTokens = await this._generateTokens(storedToken.user);

    // Marcar el viejo como revocado y reemplazado
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { 
        revoked: true,
        replacedByToken: newTokens.refreshToken
      }
    });

    return newTokens;
  }

  /**
   * Logout (Revocar token)
   */
  async logout(refreshToken) {
    if (!refreshToken) return;

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    if (storedToken) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true }
      });
    }
  }

  /**
   * Helper para generar par de tokens
   */
  async _generateTokens(user) {
    // Access Token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
    });

    // Refresh Token
    const refreshToken = generateRefreshToken();
    const expiresAt = addDays(new Date(), REFRESH_TOKEN_EXPIRES_DAYS);

    // Guardar Refresh Token en BD
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    return { accessToken, refreshToken };
  }

  /**
   * Obtener perfil de usuario
   */
  async getProfile(userId) {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        telefono: true,
        cedula: true,
        activo: true,
        createdAt: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return user;
  }
}

module.exports = new AuthService();
