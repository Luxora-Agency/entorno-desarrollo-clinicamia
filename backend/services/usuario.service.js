/**
 * Service de usuarios
 */
const prisma = require('../db/prisma');

class UsuarioService {
  /**
   * Obtener usuarios sin pacientes (para selectores)
   */
  async getAllNonPatients() {
    const usuarios = await prisma.usuario.findMany({
      where: {
        activo: true,
        rol: { not: 'PATIENT' },
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
      },
      orderBy: [
        { nombre: 'asc' },
        { apellido: 'asc' },
      ],
    });

    return usuarios;
  }
}

module.exports = new UsuarioService();
