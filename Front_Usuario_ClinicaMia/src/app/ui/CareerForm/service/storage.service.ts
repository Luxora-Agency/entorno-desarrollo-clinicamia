/**
 * Storage Service
 * Handles file upload operations directly to backend
 */

import type { UploadOptions } from "../types/storage.types";

// Backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface UploadResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadStatus: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class StorageService {
  /**
   * Upload file directly to backend
   * This uploads the file to our own server instead of Cloudinary
   */
  static async uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult | null> {
    try {
      // Defensive validation: ensure file is a valid File instance
      if (!file) {
        throw new Error('No se proporcionó un archivo para subir');
      }

      if (!(file instanceof File)) {
        throw new Error('El archivo proporcionado no es válido. Por favor, seleccione el archivo nuevamente.');
      }

      if (!file.name || typeof file.name !== 'string') {
        throw new Error('El archivo no tiene un nombre válido. Por favor, seleccione el archivo nuevamente.');
      }

      options.onProgress?.(5);

      // Validate file before upload
      const validation = this.validateFile(file, {
        maxSizeMB: (options.maxBytes || 10 * 1024 * 1024) / (1024 * 1024),
        allowedTypes: options.allowedFormats?.map(ext => {
          const mimeMap: Record<string, string> = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
          };
          return mimeMap[ext] || ext;
        }),
      });

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      options.onProgress?.(10);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', options.folder || 'documento');

      // Upload to backend
      const response = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Progress tracking
        if (options.onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              // Map upload progress from 10% to 100%
              const totalProgress = 10 + Math.round(percentComplete * 0.9);
              options.onProgress?.(totalProgress);
            }
          });
        }

        // Success handler
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText) as ApiResponse<UploadResult>;
              if (result.success && result.data) {
                resolve(result.data);
              } else {
                reject(new Error(result.message || 'Error al subir archivo'));
              }
            } catch {
              reject(new Error('Error al procesar respuesta del servidor'));
            }
          } else {
            try {
              const errorResult = JSON.parse(xhr.responseText);
              reject(new Error(errorResult.message || `Error ${xhr.status}: ${xhr.statusText}`));
            } catch {
              reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
            }
          }
        });

        // Error handlers
        xhr.addEventListener('error', () => {
          reject(new Error('Error de red al subir el archivo'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Carga de archivo cancelada'));
        });

        // Send request
        xhr.open('POST', `${API_URL}/candidates/public/upload`);
        xhr.send(formData);
      });

      return response;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(
    file: File | null | undefined,
    options: {
      maxSizeMB?: number;
      allowedTypes?: string[];
    } = {}
  ): { valid: boolean; error?: string } {
    // Defensive check for null/undefined file
    if (!file) {
      return {
        valid: false,
        error: 'No se proporcionó un archivo',
      };
    }

    // Ensure file is a valid File instance
    if (!(file instanceof File)) {
      return {
        valid: false,
        error: 'El archivo no es válido',
      };
    }

    // Ensure file has a name
    if (!file.name || typeof file.name !== 'string') {
      return {
        valid: false,
        error: 'El archivo no tiene un nombre válido',
      };
    }

    const maxSizeMB = options.maxSizeMB || 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Check file size
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `El archivo no puede exceder ${maxSizeMB}MB`,
      };
    }

    // Check file type
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const mimeTypeMatch = options.allowedTypes.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', ''));
        }
        return (
          file.type === type || (fileExtension && type.includes(fileExtension))
        );
      });

      if (!mimeTypeMatch) {
        return {
          valid: false,
          error: 'Tipo de archivo no permitido',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Determine file type from MIME type
   */
  static getFileType(
    mimeType: string
  ): 'image' | 'pdf' | 'excel' | 'document' | 'other' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (
      mimeType.includes('excel') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('.sheet')
    ) {
      return 'excel';
    }
    if (
      mimeType.includes('word') ||
      mimeType.includes('document') ||
      mimeType === 'text/plain'
    ) {
      return 'document';
    }
    return 'other';
  }
}

export const storageService = StorageService;
