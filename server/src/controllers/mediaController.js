import { uploadImageAsset } from '../services/cloudinaryService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const allowedFolders = new Set([
  'planeforge/avatars',
  'planeforge/courses',
  'planeforge/products',
  'planeforge/content',
  'planeforge/media'
]);

const normalizeFolder = (value) => {
  const folder = String(value || '').trim();
  return allowedFolders.has(folder) ? folder : 'planeforge/media';
};

const sanitizePublicId = (value) =>
  String(value || '')
    .trim()
    .replace(/[^a-z0-9-_]/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);

export const uploadImage = asyncHandler(async (req, res) => {
  const data = String(req.body?.data || req.body?.image || '').trim();
  if (!data) {
    throw new ApiError(400, 'Image data is required');
  }

  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(data) && !/^https?:\/\//i.test(data)) {
    throw new ApiError(400, 'Provide an image data URL or an existing image URL');
  }

  const upload = await uploadImageAsset(data, {
    folder: normalizeFolder(req.body?.folder),
    ...(req.body?.publicId ? { public_id: sanitizePublicId(req.body.publicId) } : {})
  });

  res.status(201).json({
    asset: {
      url: upload.secure_url,
      secureUrl: upload.secure_url,
      publicId: upload.public_id,
      resourceType: upload.resource_type || 'image',
      width: upload.width,
      height: upload.height,
      format: upload.format
    }
  });
});
