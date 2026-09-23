import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

if (env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret
  });
}

export const uploadAsset = async (filePath, options = {}) => {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    return {
      secure_url: filePath,
      public_id: `local-${Date.now()}`
    };
  }

  return cloudinary.uploader.upload(filePath, {
    folder: 'planeforge',
    resource_type: 'auto',
    ...options
  });
};

export const uploadImageAsset = async (data, options = {}) => {
  const source = String(data || '').trim();
  if (!source) {
    throw new Error('Image data is required');
  }

  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    return {
      secure_url: source,
      public_id: `local-image-${Date.now()}`,
      resource_type: 'image'
    };
  }

  return cloudinary.uploader.upload(source, {
    folder: 'planeforge',
    resource_type: 'image',
    overwrite: false,
    ...options
  });
};

export { cloudinary };
