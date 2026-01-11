const prisma = require('../db/prisma');

class AuditService {
  /**
   * Log an action to the audit log
   * @param {Object} params
   * @param {string} params.userId - User ID performing the action
   * @param {string} params.action - Action name (e.g. "CREATE_ROLE")
   * @param {string} params.resource - Resource name (e.g. "Role")
   * @param {string} params.resourceId - Resource ID
   * @param {Object} params.details - Additional details (old/new values)
   * @param {string} params.ipAddress - IP Address
   * @param {string} params.userAgent - User Agent
   */
  async log({ userId, action, resource, resourceId, details, ipAddress, userAgent }) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          details,
          ipAddress,
          userAgent
        }
      });
    } catch (error) {
      console.error('Error logging audit:', error);
      // Don't throw error to avoid blocking the main flow
    }
  }

  /**
   * Get audit logs with pagination and filters
   */
  async getLogs({ page = 1, limit = 20, userId, action, resource, startDate, endDate }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (resource) where.resource = { contains: resource, mode: 'insensitive' };
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new AuditService();
