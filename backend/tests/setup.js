// Mock Prisma with Proxy to handle any model access
jest.mock('../db/prisma', () => {
  const mockCache = {}; // Cache for model mocks

  return new Proxy({}, {
    get: (target, prop) => {
      if (prop === '__esModule') return false; // Handle esModule check
      if (prop === 'default') return target;   // Handle default export if needed

      if (prop === '$transaction') {
        return jest.fn((arg) => {
             if (Array.isArray(arg)) return Promise.all(arg);
             if (typeof arg === 'function') return arg(target);
             return Promise.resolve(arg);
        });
      }
      if (prop === '$disconnect' || prop === '$connect') return jest.fn();
      
      // Check cache
      if (!mockCache[prop]) {
        mockCache[prop] = {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            createMany: jest.fn(),
            update: jest.fn(),
            upsert: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            groupBy: jest.fn(),
            aggregate: jest.fn(),
            deleteMany: jest.fn(),
            updateMany: jest.fn(),
        };
      }
      return mockCache[prop];
    }
  });
});

// Mock Auth Middleware globally
jest.mock('../middleware/auth', () => ({
  authMiddleware: jest.fn((c, next) => next()),
  authorize: jest.fn(() => (c, next) => next()),
  protect: jest.fn((c, next) => next()),
  permissionMiddleware: jest.fn(() => (c, next) => next()),
  roleMiddleware: jest.fn(() => (c, next) => next()),
  requirePermission: jest.fn(() => (c, next) => next()),
}));

// Clean mocks
afterEach(() => {
  jest.clearAllMocks();
});

global.console = {
  ...console,
  // log: jest.fn(),
};
