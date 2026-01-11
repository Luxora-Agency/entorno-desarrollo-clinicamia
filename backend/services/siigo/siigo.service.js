/**
 * Siigo Service - Main initialization and authentication service
 * Uses siigo_api SDK for Siigo Nube integration
 */
const prisma = require('../../db/prisma');
const crypto = require('crypto');

class SiigoService {
  constructor() {
    this.initialized = false;
    this.SiigoApi = null;
    this.lastHealthCheck = null;
    this.healthCheckInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelayMs = 5000;
  }

  /**
   * Auto-initialize on server startup
   * Should be called from server.js
   */
  async autoInitialize() {
    console.log('[Siigo] Iniciando auto-inicialización...');
    const result = await this.initialize();

    if (result.success) {
      console.log('[Siigo] ✓ Conectado exitosamente');
      this.startHealthCheck();
    } else {
      console.warn('[Siigo] ✗ No se pudo conectar:', result.message);
      console.warn('[Siigo] Configure las credenciales en Configuración > Siigo');
    }

    return result;
  }

  /**
   * Start periodic health check
   */
  startHealthCheck() {
    // Check every 5 minutes
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 5 * 60 * 1000);

    console.log('[Siigo] Health check programado cada 5 minutos');
  }

  /**
   * Perform health check and reconnect if needed
   */
  async performHealthCheck() {
    if (!this.initialized) {
      console.log('[Siigo] Health check: No inicializado, intentando reconectar...');
      await this.reconnect();
      return;
    }

    try {
      // Try a simple API call to verify connection
      const taxApi = this.getTaxApi();
      await taxApi.getTaxes();
      this.lastHealthCheck = new Date();
      this.reconnectAttempts = 0;
      console.log('[Siigo] Health check: OK');
    } catch (error) {
      console.error('[Siigo] Health check fallido:', error.message);
      this.initialized = false;
      await this.reconnect();
    }
  }

  /**
   * Reconnect to Siigo with retry logic
   */
  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Siigo] Máximo de intentos de reconexión alcanzado');
      return { success: false, message: 'Máximo de intentos alcanzado' };
    }

    this.reconnectAttempts++;
    console.log(`[Siigo] Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);

    const result = await this.initialize();

    if (result.success) {
      console.log('[Siigo] ✓ Reconexión exitosa');
      this.reconnectAttempts = 0;
      return result;
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, this.reconnectDelayMs));
    return result;
  }

  /**
   * Ensure Siigo is connected before any operation
   * Call this at the beginning of any Siigo operation
   */
  async ensureConnected() {
    if (this.initialized) return true;

    const result = await this.initialize();
    if (!result.success) {
      throw new Error(`Siigo no conectado: ${result.message}. Configure las credenciales en Configuración > Siigo`);
    }
    return true;
  }

  /**
   * Get encryption key from environment
   */
  getEncryptionKey() {
    const key = process.env.SIIGO_ENCRYPTION_KEY || process.env.JWT_SECRET;
    // Ensure key is 32 bytes for AES-256
    return crypto.createHash('sha256').update(key).digest();
  }

  /**
   * Encrypt sensitive data (accessKey)
   */
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.getEncryptionKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText) {
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) return encryptedText;
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.getEncryptionKey(), iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Error decrypting:', error.message);
      return encryptedText;
    }
  }

  /**
   * Initialize Siigo SDK with stored configuration
   */
  async initialize() {
    try {
      try {
        this.SiigoApi = require('siigo_api');
      } catch (e) {
        console.warn('siigo_api SDK not installed. Running in mock mode.');
        this.initialized = false;
        return { success: false, message: 'SDK no instalado. Ejecute: npm install siigo_api' };
      }

      const config = await prisma.configuracionSiigo.findFirst({
        where: { activo: true }
      });

      if (!config) {
        return { success: false, message: 'Configuración Siigo no encontrada' };
      }

      this.SiigoApi.initialize({
        basePath: 'https://api.siigo.com',
        urlSignIn: 'https://api.siigo.com/auth',
      });

      await this.SiigoApi.signIn({
        userName: config.userName,
        accessKey: this.decrypt(config.accessKey),
      });

      this.initialized = true;

      await prisma.configuracionSiigo.update({
        where: { id: config.id },
        data: { ultimaSync: new Date() }
      });

      return { success: true, message: 'Conexión establecida con Siigo' };
    } catch (error) {
      console.error('Error initializing Siigo:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get current configuration (without accessKey)
   */
  async getConfig() {
    const config = await prisma.configuracionSiigo.findFirst({
      where: { activo: true }
    });

    if (config) {
      return {
        id: config.id,
        userName: config.userName,
        ambiente: config.ambiente,
        activo: config.activo,
        ultimaSync: config.ultimaSync,
        hasAccessKey: !!config.accessKey
      };
    }
    return null;
  }

  /**
   * Save or update Siigo configuration (full update with new accessKey)
   */
  async saveConfig(data) {
    const { userName, accessKey, ambiente } = data;

    await prisma.configuracionSiigo.updateMany({
      where: { activo: true },
      data: { activo: false }
    });

    const config = await prisma.configuracionSiigo.create({
      data: {
        userName,
        accessKey: this.encrypt(accessKey),
        ambiente: ambiente || 'sandbox',
        activo: true
      }
    });

    // Reset initialized state to force re-authentication
    this.initialized = false;

    return {
      id: config.id,
      userName: config.userName,
      ambiente: config.ambiente,
      activo: config.activo
    };
  }

  /**
   * Update partial configuration (userName and/or ambiente only)
   * Keeps existing accessKey
   */
  async updatePartialConfig(data) {
    const { userName, ambiente } = data;

    const existingConfig = await prisma.configuracionSiigo.findFirst({
      where: { activo: true }
    });

    if (!existingConfig) {
      throw new Error('No existe configuración activa para actualizar');
    }

    const config = await prisma.configuracionSiigo.update({
      where: { id: existingConfig.id },
      data: {
        userName: userName || existingConfig.userName,
        ambiente: ambiente || existingConfig.ambiente,
        updatedAt: new Date()
      }
    });

    return {
      id: config.id,
      userName: config.userName,
      ambiente: config.ambiente,
      activo: config.activo,
      ultimaSync: config.ultimaSync
    };
  }

  /**
   * Test connection with provided credentials
   */
  async testConnection(userName, accessKey) {
    try {
      let SiigoApi;
      try {
        SiigoApi = require('siigo_api');
      } catch (e) {
        return {
          success: false,
          message: 'SDK siigo_api no instalado. Ejecute: npm install siigo_api'
        };
      }

      SiigoApi.initialize({
        basePath: 'https://api.siigo.com',
        urlSignIn: 'https://api.siigo.com/auth',
      });

      await SiigoApi.signIn({ userName, accessKey });

      return { success: true, message: 'Conexión exitosa con Siigo' };
    } catch (error) {
      return { success: false, message: `Error de conexión: ${error.message}` };
    }
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus() {
    const [clientes, productos, facturas, asientos, errores, ultimosLogs] = await Promise.all([
      prisma.siigoSync.count({ where: { entidad: 'paciente', estado: 'sincronizado' } }),
      prisma.siigoSync.count({ where: { entidad: 'producto', estado: 'sincronizado' } }),
      prisma.siigoSync.count({ where: { entidad: 'factura', estado: 'sincronizado' } }),
      prisma.siigoSync.count({ where: { entidad: 'asiento', estado: 'sincronizado' } }),
      prisma.siigoSync.count({ where: { estado: 'error' } }),
      prisma.siigoLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
    ]);

    const config = await this.getConfig();

    return {
      connected: this.initialized,
      lastHealthCheck: this.lastHealthCheck,
      reconnectAttempts: this.reconnectAttempts,
      config,
      stats: { clientes, productos, facturas, asientos, errores },
      ultimosLogs
    };
  }

  /**
   * Force reconnection (reset attempts counter)
   */
  async forceReconnect() {
    this.reconnectAttempts = 0;
    this.initialized = false;
    return this.reconnect();
  }

  /**
   * Get health status for monitoring
   */
  getHealthStatus() {
    return {
      initialized: this.initialized,
      lastHealthCheck: this.lastHealthCheck,
      reconnectAttempts: this.reconnectAttempts,
      sdkLoaded: !!this.SiigoApi
    };
  }

  /**
   * Get sync errors
   */
  async getSyncErrors(limit = 50) {
    return prisma.siigoSync.findMany({
      where: { estado: 'error' },
      orderBy: { ultimaSync: 'desc' },
      take: limit
    });
  }

  /**
   * Get API logs
   */
  async getLogs(filters = {}) {
    const { page = 1, limit = 50, endpoint, responseCode } = filters;
    const where = {};
    if (endpoint) where.endpoint = { contains: endpoint };
    if (responseCode) where.responseCode = responseCode;

    const [logs, total] = await Promise.all([
      prisma.siigoLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.siigoLog.count({ where })
    ]);

    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Log API call with full details
   */
  async logApiCall(data) {
    try {
      // Sanitize sensitive data from request/response
      const sanitizedRequest = this.sanitizeLogData(data.requestBody);
      const sanitizedResponse = this.sanitizeLogData(data.responseBody);

      return await prisma.siigoLog.create({
        data: {
          operacion: data.operacion || 'unknown',
          entidad: data.entidad || null,
          entidadId: data.entidadId || null,
          siigoId: data.siigoId || null,
          endpoint: data.endpoint,
          metodo: data.metodo,
          requestBody: sanitizedRequest ? JSON.stringify(sanitizedRequest) : null,
          responseCode: data.responseCode || 0,
          responseBody: sanitizedResponse ? JSON.stringify(sanitizedResponse) : null,
          duracionMs: data.duracionMs || 0,
          exito: data.exito !== false,
          error: data.error || null,
          errorCode: data.errorCode || null,
          errorDetails: data.errorDetails || null,
          usuarioId: data.usuarioId || null,
          ip: data.ip || null,
          userAgent: data.userAgent || null,
          cufe: data.cufe || null,
          estadoDian: data.estadoDian || null
        }
      });
    } catch (logError) {
      console.error('[Siigo] Error guardando log:', logError.message);
      // No lanzar error para no interrumpir la operación principal
    }
  }

  /**
   * Sanitize sensitive data from logs
   */
  sanitizeLogData(data) {
    if (!data) return null;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return data;
      }
    }

    const sensitiveFields = ['accessKey', 'password', 'token', 'secret', 'key'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Execute Siigo API call with automatic logging
   * This is the main method for all Siigo operations
   *
   * @param {Function} apiCall - Async function that makes the API call
   * @param {Object} context - Context for logging
   * @param {string} context.operacion - Operation name (e.g., 'createCustomer')
   * @param {string} context.endpoint - API endpoint
   * @param {string} context.metodo - HTTP method
   * @param {string} [context.entidad] - Entity type (e.g., 'paciente')
   * @param {string} [context.entidadId] - Local entity ID
   * @param {Object} [context.requestBody] - Request body for logging
   * @param {string} [context.usuarioId] - User ID who triggered the operation
   */
  async executeWithLogging(apiCall, context) {
    const startTime = Date.now();
    let responseCode = 0;
    let responseBody = null;
    let exito = true;
    let errorMessage = null;
    let errorCode = null;
    let errorDetails = null;
    let siigoId = null;
    let cufe = null;
    let estadoDian = null;

    try {
      // Execute the API call
      const result = await apiCall();

      // Extract relevant data from result
      responseCode = 200;
      responseBody = result;

      // Extract Siigo ID if present
      if (result?.id) siigoId = result.id;
      if (result?.stamp?.cufe) cufe = result.stamp.cufe;
      if (result?.stamp?.status) estadoDian = result.stamp.status;

      return result;
    } catch (error) {
      exito = false;
      errorMessage = error.message;

      // Parse Siigo API error response
      if (error.response) {
        responseCode = error.response.status || 500;
        try {
          const errorBody = error.response.data || error.response.body;
          responseBody = errorBody;
          if (errorBody?.Errors) {
            errorCode = errorBody.Errors[0]?.Code;
            errorDetails = JSON.stringify(errorBody.Errors);
          } else if (errorBody?.error) {
            errorCode = errorBody.error.code;
            errorDetails = errorBody.error.message;
          }
        } catch {
          responseBody = { error: error.message };
        }
      } else {
        responseCode = 500;
        responseBody = { error: error.message };
      }

      throw error;
    } finally {
      const duracionMs = Date.now() - startTime;

      // Log the operation
      await this.logApiCall({
        operacion: context.operacion,
        entidad: context.entidad,
        entidadId: context.entidadId,
        siigoId,
        endpoint: context.endpoint,
        metodo: context.metodo,
        requestBody: context.requestBody,
        responseCode,
        responseBody,
        duracionMs,
        exito,
        error: errorMessage,
        errorCode,
        errorDetails,
        usuarioId: context.usuarioId,
        ip: context.ip,
        userAgent: context.userAgent,
        cufe,
        estadoDian
      });

      // Console log for debugging
      const logPrefix = exito ? '✓' : '✗';
      const logLevel = exito ? 'log' : 'error';
      console[logLevel](
        `[Siigo] ${logPrefix} ${context.operacion} - ${context.endpoint} (${duracionMs}ms)`,
        exito ? '' : `- Error: ${errorMessage}`
      );
    }
  }

  /**
   * Format date for Siigo API (YYYY-MM-DD)
   */
  formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Get logs with advanced filtering
   */
  async getLogsAdvanced(filters = {}) {
    const {
      page = 1,
      limit = 50,
      operacion,
      entidad,
      entidadId,
      exito,
      responseCode,
      fechaDesde,
      fechaHasta,
      search
    } = filters;

    const where = {};

    if (operacion) where.operacion = operacion;
    if (entidad) where.entidad = entidad;
    if (entidadId) where.entidadId = entidadId;
    if (exito !== undefined) where.exito = exito === 'true' || exito === true;
    if (responseCode) where.responseCode = parseInt(responseCode);

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
      if (fechaHasta) where.createdAt.lte = new Date(fechaHasta);
    }

    if (search) {
      where.OR = [
        { operacion: { contains: search, mode: 'insensitive' } },
        { endpoint: { contains: search, mode: 'insensitive' } },
        { error: { contains: search, mode: 'insensitive' } },
        { entidadId: { contains: search, mode: 'insensitive' } },
        { siigoId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [logs, total, stats] = await Promise.all([
      prisma.siigoLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.siigoLog.count({ where }),
      prisma.siigoLog.groupBy({
        by: ['exito'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        _count: true
      })
    ]);

    const exitosos = stats.find(s => s.exito === true)?._count || 0;
    const fallidos = stats.find(s => s.exito === false)?._count || 0;

    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: {
        last24h: { exitosos, fallidos, total: exitosos + fallidos }
      }
    };
  }

  /**
   * Get operation summary statistics
   */
  async getOperationStats(days = 7) {
    const fechaDesde = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [byOperation, byEntity, byResponseCode, timeline] = await Promise.all([
      // Stats by operation
      prisma.siigoLog.groupBy({
        by: ['operacion', 'exito'],
        where: { createdAt: { gte: fechaDesde } },
        _count: true,
        _avg: { duracionMs: true }
      }),

      // Stats by entity
      prisma.siigoLog.groupBy({
        by: ['entidad', 'exito'],
        where: { createdAt: { gte: fechaDesde }, entidad: { not: null } },
        _count: true
      }),

      // Stats by response code
      prisma.siigoLog.groupBy({
        by: ['responseCode'],
        where: { createdAt: { gte: fechaDesde } },
        _count: true
      }),

      // Timeline (daily counts)
      prisma.$queryRaw`
        SELECT
          DATE(created_at) as fecha,
          COUNT(*) FILTER (WHERE exito = true) as exitosos,
          COUNT(*) FILTER (WHERE exito = false) as fallidos,
          AVG(duracion_ms) as promedio_ms
        FROM siigo_log
        WHERE created_at >= ${fechaDesde}
        GROUP BY DATE(created_at)
        ORDER BY fecha DESC
      `
    ]);

    return {
      byOperation,
      byEntity,
      byResponseCode,
      timeline,
      periodo: { dias: days, desde: fechaDesde, hasta: new Date() }
    };
  }

  getCustomerApi() {
    if (!this.SiigoApi) throw new Error('Siigo SDK not initialized');
    return new this.SiigoApi.CustomerApi();
  }

  getProductApi() {
    if (!this.SiigoApi) throw new Error('Siigo SDK not initialized');
    return new this.SiigoApi.ProductApi();
  }

  getInvoiceApi() {
    if (!this.SiigoApi) throw new Error('Siigo SDK not initialized');
    return new this.SiigoApi.InvoiceApi();
  }

  getCreditNoteApi() {
    if (!this.SiigoApi) throw new Error('Siigo SDK not initialized');
    return new this.SiigoApi.CreditNoteApi();
  }

  getVoucherApi() {
    if (!this.SiigoApi) throw new Error('Siigo SDK not initialized');
    return new this.SiigoApi.VoucherApi();
  }

  getJournalApi() {
    if (!this.SiigoApi) throw new Error('Siigo SDK not initialized');
    return new this.SiigoApi.JournalEntryApi();
  }

  getTaxApi() {
    if (!this.SiigoApi) throw new Error('Siigo SDK not initialized');
    return new this.SiigoApi.TaxApi();
  }

  getAccountGroupApi() {
    if (!this.SiigoApi) throw new Error('Siigo SDK not initialized');
    return new this.SiigoApi.AccountGroupApi();
  }

  getCostCenterApi() {
    if (!this.SiigoApi) throw new Error('Siigo SDK not initialized');
    return new this.SiigoApi.CostCenterApi();
  }

  getPaymentTypeApi() {
    if (!this.SiigoApi) throw new Error('Siigo SDK not initialized');
    return new this.SiigoApi.PaymentTypeApi();
  }

  getDocumentTypeApi() {
    if (!this.SiigoApi) throw new Error('Siigo SDK not initialized');
    return new this.SiigoApi.DocumentTypeApi();
  }

  /**
   * Map documento type to Siigo code
   */
  mapTipoDocumento(tipoDocumento) {
    const mapping = {
      'CC': '13',           // Cédula de Ciudadanía
      'CE': '22',           // Cédula de Extranjería
      'NIT': '31',          // NIT
      'TI': '12',           // Tarjeta de Identidad
      'PA': '41',           // Pasaporte
      'RC': '11',           // Registro Civil
      'DNI': '13',          // Documento Nacional de Identidad (treated as CC)
      'PEP': '42',          // Permiso Especial de Permanencia
      'PPT': '47',          // Permiso por Protección Temporal
      'NUIP': '13',         // NUIP (treated as CC)
      'CD': '13',           // Carné Diplomático (treated as CC)
      'SC': '43',           // Salvoconducto
    };
    const tipo = (tipoDocumento || 'CC').toUpperCase();
    return mapping[tipo] || '13'; // Default: CC
  }

  /**
   * Get Siigo city code from city name and department
   */
  getCityCode(ciudad, departamento) {
    // This is a simplified version - for production, use the full DANE codes
    // Format: StateCode + CityCode (e.g., '11001' for Bogotá)
    const ciudadesPrincipales = {
      // Bogotá
      'bogota': '11001', 'bogotá': '11001',
      // Antioquia
      'medellin': '05001', 'medellín': '05001', 'bello': '05088', 'itagui': '05360', 'itagüí': '05360',
      'envigado': '05266', 'rionegro': '05615',
      // Valle del Cauca
      'cali': '76001', 'palmira': '76520', 'buenaventura': '76109', 'tulua': '76834', 'tuluá': '76834',
      // Atlántico
      'barranquilla': '08001', 'soledad': '08758', 'malambo': '08433',
      // Santander
      'bucaramanga': '68001', 'floridablanca': '68276', 'giron': '68307', 'girón': '68307', 'piedecuesta': '68547',
      // Cundinamarca
      'soacha': '25754', 'chia': '25175', 'chía': '25175', 'zipaquira': '25899', 'zipaquirá': '25899',
      'facatativa': '25269', 'facatativá': '25269', 'fusagasuga': '25290', 'fusagasugá': '25290',
      // Bolívar
      'cartagena': '13001', 'magangue': '13430', 'magangué': '13430',
      // Norte de Santander
      'cucuta': '54001', 'cúcuta': '54001', 'pamplona': '54518',
      // Tolima
      'ibague': '73001', 'ibagué': '73001', 'espinal': '73268',
      // Nariño
      'pasto': '52001', 'tumaco': '52835', 'ipiales': '52356',
      // Risaralda
      'pereira': '66001', 'dosquebradas': '66170',
      // Caldas
      'manizales': '17001', 'la dorada': '17380',
      // Córdoba
      'monteria': '23001', 'montería': '23001', 'lorica': '23417',
      // Meta
      'villavicencio': '50001', 'acacias': '50006', 'acacías': '50006',
      // Huila
      'neiva': '41001', 'pitalito': '41551',
      // Cesar
      'valledupar': '20001', 'aguachica': '20011',
      // Quindío
      'armenia': '63001', 'calarca': '63130', 'calarcá': '63130',
      // Boyacá
      'tunja': '15001', 'duitama': '15238', 'sogamoso': '15759',
      // Magdalena
      'santa marta': '47001', 'cienaga': '47189', 'ciénaga': '47189',
      // Cauca
      'popayan': '19001', 'popayán': '19001', 'santander de quilichao': '19698',
      // La Guajira
      'riohacha': '44001', 'maicao': '44430',
      // Sucre
      'sincelejo': '70001', 'corozal': '70215',
      // Casanare
      'yopal': '85001',
      // Arauca
      'arauca': '81001',
      // Putumayo
      'mocoa': '86001',
      // Caquetá
      'florencia': '18001',
      // Chocó
      'quibdo': '27001', 'quibdó': '27001',
      // San Andrés
      'san andres': '88001', 'san andrés': '88001',
      // Amazonas
      'leticia': '91001',
      // Guaviare
      'san jose del guaviare': '95001', 'san josé del guaviare': '95001',
      // Vaupés
      'mitu': '97001', 'mitú': '97001',
      // Vichada
      'puerto carreno': '99001', 'puerto carreño': '99001',
      // Guainía
      'inirida': '94001', 'inírida': '94001',
    };

    const ciudadKey = (ciudad || '').toLowerCase().trim();
    if (ciudadesPrincipales[ciudadKey]) {
      return ciudadesPrincipales[ciudadKey];
    }

    // Default to department capital or Bogotá
    const capitales = {
      'amazonas': '91001', 'antioquia': '05001', 'arauca': '81001',
      'atlántico': '08001', 'atlantico': '08001', 'bogotá': '11001', 'bogota': '11001',
      'bolívar': '13001', 'bolivar': '13001', 'boyacá': '15001', 'boyaca': '15001',
      'caldas': '17001', 'caquetá': '18001', 'caqueta': '18001', 'casanare': '85001',
      'cauca': '19001', 'cesar': '20001', 'chocó': '27001', 'choco': '27001',
      'córdoba': '23001', 'cordoba': '23001', 'cundinamarca': '25001',
      'guainía': '94001', 'guainia': '94001', 'guaviare': '95001', 'huila': '41001',
      'la guajira': '44001', 'magdalena': '47001', 'meta': '50001',
      'nariño': '52001', 'narino': '52001', 'norte de santander': '54001',
      'putumayo': '86001', 'quindío': '63001', 'quindio': '63001', 'risaralda': '66001',
      'san andrés': '88001', 'san andres': '88001', 'santander': '68001',
      'sucre': '70001', 'tolima': '73001', 'valle del cauca': '76001',
      'vaupés': '97001', 'vaupes': '97001', 'vichada': '99001'
    };

    const deptoKey = (departamento || '').toLowerCase().trim();
    return capitales[deptoKey] || '11001'; // Default: Bogotá
  }

  /**
   * Get payment type ID for Siigo
   */
  getPaymentTypeId(metodoPago) {
    const mapping = {
      'efectivo': 10489,
      'tarjeta': 10490,
      'tarjeta_credito': 10490,
      'tarjeta_debito': 10490,
      'transferencia': 5636,
      'cheque': 5637,
      'consignacion': 5636,
      'epayco': 10490,
      'nequi': 10490,
      'daviplata': 10490,
      'pse': 5636,
      'credito': 5636,
    };
    const metodo = (metodoPago || 'efectivo').toLowerCase().replace(/[^a-z]/g, '_');
    return mapping[metodo] || 10489; // Default: efectivo
  }
}

module.exports = new SiigoService();
