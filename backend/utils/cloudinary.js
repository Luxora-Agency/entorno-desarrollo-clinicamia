/**
 * Cloudinary utility for image uploads
 *
 * Required environment variables:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 image to Cloudinary
 * @param {string} base64Data - Base64 encoded image (with or without data URI prefix)
 * @param {string} folder - Folder name in Cloudinary (e.g., 'doctors', 'patients')
 * @param {string} publicId - Optional custom public ID for the image
 * @returns {Promise<{url: string, publicId: string}>} - URL and public ID of uploaded image
 */
async function uploadImage(base64Data, folder = 'clinicamia', publicId = null) {
  if (!base64Data) {
    throw new Error('No image data provided');
  }

  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('[Cloudinary] No configurado. Configure las variables de entorno CLOUDINARY_*');
    throw new Error('Cloudinary no está configurado. Configure las credenciales en las variables de entorno.');
  }

  try {
    // Ensure the base64 string has the data URI prefix
    let imageData = base64Data;
    if (!base64Data.startsWith('data:')) {
      imageData = `data:image/jpeg;base64,${base64Data}`;
    }

    const uploadOptions = {
      folder: `clinicamia/${folder}`,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    const result = await cloudinary.uploader.upload(imageData, uploadOptions);

    console.log(`[Cloudinary] Imagen subida exitosamente: ${result.secure_url}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('[Cloudinary] Error al subir imagen:', error.message);
    throw new Error(`Error al subir imagen a Cloudinary: ${error.message}`);
  }
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<boolean>} - True if deleted successfully
 */
async function deleteImage(publicId) {
  if (!publicId) return false;

  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn('[Cloudinary] No configurado, no se puede eliminar imagen');
    return false;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary] Imagen eliminada: ${publicId}`, result);
    return result.result === 'ok';
  } catch (error) {
    console.error('[Cloudinary] Error al eliminar imagen:', error.message);
    return false;
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
function getPublicIdFromUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return null;

  try {
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const pathPart = parts[1];
    // Remove version number if present (v1234567890/)
    const withoutVersion = pathPart.replace(/^v\d+\//, '');
    // Remove file extension
    const publicId = withoutVersion.replace(/\.[^/.]+$/, '');

    return publicId;
  } catch (error) {
    console.error('[Cloudinary] Error extracting public ID:', error);
    return null;
  }
}

/**
 * Check if Cloudinary is properly configured
 * @returns {boolean}
 */
function isConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

module.exports = {
  uploadImage,
  deleteImage,
  getPublicIdFromUrl,
  isConfigured,
  cloudinary,
};
