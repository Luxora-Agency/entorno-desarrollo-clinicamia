const prisma = require('../db/prisma');

class PermissionService {
  async getAll() {
    return await prisma.permission.findMany({
      orderBy: {
        module: 'asc'
      }
    });
  }

  async create({ name, description, module }) {
    return await prisma.permission.create({
      data: {
        name,
        description,
        module
      }
    });
  }

  async bulkCreate(permissions) {
    return await prisma.permission.createMany({
      data: permissions,
      skipDuplicates: true
    });
  }
}

module.exports = new PermissionService();
