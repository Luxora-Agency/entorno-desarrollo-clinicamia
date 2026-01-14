/**
 * Upload utilities for handling file uploads
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

// Base directory for uploads
const UPLOAD_BASE_DIR = path.join(__dirname, '..', 'public', 'uploads');

// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed document types for Calidad 2.0
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
];
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Ensures the upload directory exists
 * @param {string} subDir - Subdirectory name (e.g., 'doctors')
 */
function ensureUploadDir(subDir) {
  const dir = path.join(UPLOAD_BASE_DIR, subDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Generates a unique filename
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}${ext}`;
}

/**
 * Validates an image file
 * @param {Object} file - File object with type and size
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
function validateImage(file) {
  if (!file) {
    return { valid: false, error: 'No se proporcionó archivo' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Permitidos: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  return { valid: true };
}

/**
 * Validates a document file (for Calidad 2.0)
 * @param {Object} file - File object with type and size
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
function validateDocument(file) {
  if (!file) {
    return { valid: false, error: 'No se proporcionó archivo' };
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Permitidos: PDF, Word, Excel, PowerPoint, imágenes`
    };
  }

  if (file.size > MAX_DOCUMENT_SIZE) {
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo de ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB`
    };
  }

  return { valid: true };
}

/**
 * Gets file extension from mime type
 * @param {string} mimeType - MIME type
 * @returns {string} File extension with dot
 */
function getExtensionFromMime(mimeType) {
  const extMap = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return extMap[mimeType] || '';
}

/**
 * Saves an uploaded file to disk
 * @param {ArrayBuffer} fileData - File data as ArrayBuffer
 * @param {string} originalName - Original filename
 * @param {string} subDir - Subdirectory (e.g., 'doctors')
 * @returns {Promise<string>} Relative path to the saved file
 */
async function saveFile(fileData, originalName, subDir) {
  const uploadDir = ensureUploadDir(subDir);
  const filename = generateUniqueFilename(originalName);
  const filepath = path.join(uploadDir, filename);

  // Convert ArrayBuffer to Buffer and write
  const buffer = Buffer.from(fileData);
  await fs.promises.writeFile(filepath, buffer);

  // Return relative URL path
  return `/uploads/${subDir}/${filename}`;
}

/**
 * Deletes a file from uploads
 * @param {string} fileUrl - Relative URL path to the file
 */
async function deleteFile(fileUrl) {
  if (!fileUrl) return;

  // Convert URL to filepath
  const relativePath = fileUrl.replace(/^\//, '');
  const filepath = path.join(__dirname, '..', 'public', relativePath);

  try {
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

/**
 * Processes a base64 image and saves it
 * @param {string} base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param {string} subDir - Subdirectory (e.g., 'doctors')
 * @returns {Promise<string>} Relative path to the saved file
 */
async function saveBase64Image(base64Data, subDir) {
  if (!base64Data) return null;

  // Extract mime type and data from base64 string
  let mimeType = 'image/jpeg';
  let base64Content = base64Data;

  if (base64Data.includes(',')) {
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      base64Content = matches[2];
    }
  }

  // Validate mime type
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    throw new Error(`Tipo de imagen no permitido: ${mimeType}`);
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Content, 'base64');

  // Check size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Determine extension from mime type
  const extMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
  };
  const ext = extMap[mimeType] || '.jpg';

  // Generate filename and save
  const uploadDir = ensureUploadDir(subDir);
  const filename = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`;
  const filepath = path.join(uploadDir, filename);

  await fs.promises.writeFile(filepath, buffer);

  return `/uploads/${subDir}/${filename}`;
}

/**
 * Resizes a base64 image to fit within max dimensions
 * Optimized for signatures and stamps (firma/sello)
 * @param {string} base64Data - Base64 encoded image data (with data URI prefix)
 * @param {Object} options - Options for resizing
 * @param {number} options.maxWidth - Maximum width (default: 400)
 * @param {number} options.maxHeight - Maximum height (default: 200)
 * @param {number} options.quality - JPEG quality 1-100 (default: 85)
 * @returns {Promise<string>} Resized base64 image with data URI prefix
 */
async function resizeBase64Image(base64Data, options = {}) {
  if (!base64Data) return null;

  const { maxWidth = 400, maxHeight = 200, quality = 85 } = options;

  try {
    // Extract mime type and data from base64 string
    let mimeType = 'image/png';
    let base64Content = base64Data;

    if (base64Data.includes(',')) {
      const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Content = matches[2];
      }
    }

    // Convert base64 to buffer
    const inputBuffer = Buffer.from(base64Content, 'base64');

    // Get image metadata to check if resizing is needed
    const metadata = await sharp(inputBuffer).metadata();

    // If image is already small enough, return original (but convert to PNG for consistency)
    if (metadata.width <= maxWidth && metadata.height <= maxHeight) {
      const optimizedBuffer = await sharp(inputBuffer)
        .png({ quality })
        .toBuffer();
      return `data:image/png;base64,${optimizedBuffer.toString('base64')}`;
    }

    // Resize maintaining aspect ratio
    const resizedBuffer = await sharp(inputBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({ quality })
      .toBuffer();

    return `data:image/png;base64,${resizedBuffer.toString('base64')}`;
  } catch (error) {
    console.error('[Upload] Error resizing image:', error.message);
    // Return original if resize fails
    return base64Data;
  }
}

module.exports = {
  validateImage,
  validateDocument,
  saveFile,
  deleteFile,
  saveBase64Image,
  resizeBase64Image,
  ensureUploadDir,
  generateUniqueFilename,
  getExtensionFromMime,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE,
  MAX_DOCUMENT_SIZE,
};
