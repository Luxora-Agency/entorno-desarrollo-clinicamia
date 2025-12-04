/**
 * Service de autenticación
 */
const prisma = require('../db/prisma');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { validateRequired, isValidEmail, isValidPassword } = require('../utils/validators');
const { ValidationError, UnauthorizedError, NotFoundError } = require('../utils/errors');

class AuthService {
  /**
   * Registrar un nuevo usuario
   */
  async register(data) {
    // Validar campos requeridos
    const missing = validateRequired(['email', 'password', 'nombre', 'apellido', 'rol'], data);
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

    // Crear usuario
    const user = await prisma.usuario.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: data.rol,
        telefono: data.telefono,
        cedula: data.cedula,
      },
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
      },
    });

    // Generar token
    const token = generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
    });

    return { user, token };
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

    // Verificar contraseña
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Generar token
    const token = generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
    });

    // Remover password
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
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
      },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return user;
  }
}

module.exports = new AuthService();
