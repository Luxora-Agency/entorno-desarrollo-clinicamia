const prisma = require('../db/prisma');

const auditMiddleware = (action, resource) => {
  return async (c, next) => {
    // Execute the request first
    await next();

    // Log after successful execution (or before? usually after to ensure it happened)
    // In Hono, next() waits for downstream handlers.
    // If status is 2xx, we log.
    
    if (c.res.status >= 200 && c.res.status < 300) {
      try {
        const user = c.get('user');
        const body = await c.req.json().catch(() => ({})); // Try to get body, might fail if already consumed or not json
        const { id } = c.req.param();

        await prisma.auditLog.create({
          data: {
            userId: user ? user.id : null,
            action: action || c.req.method,
            resource: resource || c.req.path,
            resourceId: id || null,
            details: body,
            ipAddress: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
            userAgent: c.req.header('user-agent'),
          }
        });
      } catch (err) {
        console.error('Failed to create audit log:', err);
        // Don't fail the request just because audit failed
      }
    }
  };
};

module.exports = { auditMiddleware };
