const prisma = require('../db/prisma');
const auditService = require('./audit.service');

class RoleService {
  async getAll() {
    return await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        parent: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getById(id) {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        parent: true,
        children: true
      }
    });
  }

  async create(data, actorId) {
    const { name, description, parentId, permissions } = data;

    const role = await prisma.role.create({
      data: {
        name,
        description,
        parentId,
        permissions: {
          create: permissions?.map(permId => ({
            permission: { connect: { id: permId } }
          }))
        }
      }
    });

    await auditService.log({
      userId: actorId,
      action: 'CREATE_ROLE',
      resource: 'Role',
      resourceId: role.id,
      details: { name, description, parentId, permissions }
    });

    return role;
  }

  async update(id, data, actorId) {
    const { name, description, parentId, permissions } = data;

    // Get current state for audit
    const currentRole = await this.getById(id);

    // Prepare update data
    const updateData = {
      name,
      description,
      parentId
    };

    if (permissions) {
      // Delete existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // Add new permissions
      updateData.permissions = {
        create: permissions.map(permId => ({
          permission: { connect: { id: permId } }
        }))
      };
    }

    const role = await prisma.role.update({
      where: { id },
      data: updateData
    });

    await auditService.log({
      userId: actorId,
      action: 'UPDATE_ROLE',
      resource: 'Role',
      resourceId: role.id,
      details: {
        old: {
          name: currentRole.name,
          description: currentRole.description,
          parentId: currentRole.parentId,
          permissions: currentRole.permissions.map(p => p.permissionId)
        },
        new: { name, description, parentId, permissions }
      }
    });

    return role;
  }

  async delete(id, actorId) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (role.isSystem) {
      throw new Error('Cannot delete system role');
    }

    await prisma.role.delete({ where: { id } });

    await auditService.log({
      userId: actorId,
      action: 'DELETE_ROLE',
      resource: 'Role',
      resourceId: id,
      details: { name: role.name }
    });

    return true;
  }

  async assignRoleToUser(userId, roleId, assignerId, expiresAt = null) {
    // Check if assignment exists
    const existing = await prisma.userRole.findFirst({
      where: {
        usuarioId: userId,
        roleId: roleId
      }
    });

    if (existing) {
      // Update expiration if exists
      await prisma.userRole.update({
        where: { id: existing.id },
        data: { expiresAt, assignedBy: assignerId, assignedAt: new Date() }
      });
    } else {
      await prisma.userRole.create({
        data: {
          usuarioId: userId,
          roleId: roleId,
          assignedBy: assignerId,
          expiresAt
        }
      });
    }

    await auditService.log({
      userId: assignerId,
      action: 'ASSIGN_ROLE',
      resource: 'User',
      resourceId: userId,
      details: { roleId, expiresAt }
    });
  }

  async removeRoleFromUser(userId, roleId, actorId) {
    // Find the record first since composite key might not be set up as expected in Prisma for delete
    const userRole = await prisma.userRole.findFirst({
      where: {
        usuarioId: userId,
        roleId: roleId
      }
    });

    if (userRole) {
      await prisma.userRole.delete({
        where: { id: userRole.id }
      });
    }

    await auditService.log({
      userId: actorId,
      action: 'REMOVE_ROLE',
      resource: 'User',
      resourceId: userId,
      details: { roleId }
    });
  }

  async getUserRoles(userId) {
    const userRoles = await prisma.userRole.findMany({
      where: { usuarioId: userId },
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
    });

    // Filter expired roles
    const activeRoles = userRoles.filter(ur => !ur.expiresAt || ur.expiresAt > new Date());
    
    // Flatten permissions
    const permissions = new Set();
    activeRoles.forEach(ur => {
      ur.role.permissions.forEach(rp => {
        permissions.add(rp.permission.name);
      });
    });

    return {
      roles: activeRoles.map(ur => ur.role),
      permissions: Array.from(permissions)
    };
  }
}

module.exports = new RoleService();
