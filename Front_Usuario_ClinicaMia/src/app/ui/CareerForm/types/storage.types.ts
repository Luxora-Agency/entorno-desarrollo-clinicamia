/**
 * Storage Types
 * Type definitions for file storage operations
 */

export type ResourceType = 'image' | 'video' | 'raw' | 'auto';
export type StorageProvider = 'cloudinary' | 's3' | 'local';

/**
 * Request for generating upload signature
 */
export interface SignatureRequest {
  folder?: string;
  uploadPreset?: string;
  publicId?: string;
  tags?: string[];
  context?: Record<string, string>;
  resourceType?: ResourceType;
  allowedFormats?: string[];
  maxBytes?: number;
}

/**
 * Response from signature generation endpoint
 */
export interface SignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  uploadUrl: string;
  folder?: string;
  uploadPreset?: string;
  publicId?: string;
  tags?: string[];
  context?: Record<string, string>;
  allowedFormats?: string[];
  maxBytes?: number;
}

/**
 * Upload result from Cloudinary
 */
export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
}

/**
 * Options for upload operations
 */
export interface UploadOptions {
  folder?: string;
  tags?: string[];
  altText?: string;
  resourceType?: ResourceType;
  maxBytes?: number;
  allowedFormats?: string[];
  onProgress?: (progress: number) => void;
}

/**
 * Media metadata to save in database
 */
export interface MediaMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileType: 'image' | 'pdf' | 'excel' | 'document' | 'other';
  url: string;
  altText?: string;
  metadata?: Record<string, any>;
  uploadStatus: 'completed' | 'failed';
  provider?: StorageProvider;
  uploadedBy: string;
}
