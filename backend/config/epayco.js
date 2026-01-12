/**
 * ePayco Smart Checkout Configuration
 *
 * Documentation: https://docs.epayco.com/docs/checkout-implementacion
 */

const epaycoConfig = {
  // API Endpoints
  endpoints: {
    auth: 'https://apify.epayco.co/login',
    session: 'https://apify.epayco.co/payment/session/create',
  },

  // Credentials from environment
  publicKey: process.env.EPAYCO_PUBLIC_KEY,
  privateKey: process.env.EPAYCO_PRIVATE_KEY,
  customerId: process.env.EPAYCO_CUSTOMER_ID,
  pKey: process.env.EPAYCO_P_KEY,

  // Mode
  testMode: process.env.EPAYCO_TEST_MODE === 'true',

  // URLs base
  urls: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  },

  // URLs de respuesta
  // Response URL uses backend redirect endpoint (for ngrok/dev) or frontend directly (production)
  get responseUrl() {
    // In development with ngrok, use backend redirect endpoint
    if (this.urls.backendUrl && !this.urls.backendUrl.includes('localhost')) {
      return `${this.urls.backendUrl}/payments/result`;
    }
    // In production or without ngrok, use frontend directly
    return `${this.urls.frontendUrl}/cita/resultado`;
  },
  get confirmationUrl() {
    return `${this.urls.backendUrl}/payments/webhook`;
  },

  // Checkout configuration
  checkout: {
    version: '2',
    currency: 'COP',
    country: 'co',  // lowercase as per ePayco docs
    lang: 'ES',     // uppercase as per ePayco docs
  },

  // Validate required configuration
  validate() {
    const required = ['publicKey', 'privateKey', 'customerId', 'pKey'];
    const missing = required.filter(key => !this[key]);

    if (missing.length > 0) {
      console.warn(`ePayco: Missing configuration: ${missing.join(', ')}`);
      return false;
    }
    return true;
  },
};

module.exports = epaycoConfig;
