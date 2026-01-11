/**
 * Utilidades para autenticación
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = '7d'; // 7 días
const REFRESH_TOKEN_EXPIRES_DAYS = 30; // 30 días

const SALT_ROUNDS = 10;

/**
 * Genera un Access Token JWT (corto tiempo de vida)
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

/**
 * Genera un Refresh Token (opaco, larga duración)
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Verifica un token JWT
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Hashea una contraseña
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compara una contraseña con su hash
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Mantener compatibilidad con código existente que usa generateToken
const generateToken = (payload) => {
  return generateAccessToken(payload);
};

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashPassword,
  comparePassword,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_DAYS
};
