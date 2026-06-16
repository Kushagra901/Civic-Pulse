import cloudinary from '../../config/cloudinary.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

const log = {
  info: (obj, msg) => console.log(`[INFO] ${msg}`, obj),
  error: (obj, msg) => console.error(`[ERROR] ${msg}`, obj)
};

// Allowed image MIME types
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_BYTES  = 8 * 1024 * 1024; // 8 MB

export const getSignedUploadUrl = asyncHandler(async (req, res) => {
  const { folder = 'incidents', format = 'jpg' } = req.query;

  if (!ALLOWED_FORMATS.includes(format.toLowerCase())) {
    throw new ApiError(400, `Format not allowed. Use: ${ALLOWED_FORMATS.join(', ')}`);
  }

  const timestamp = Math.round(Date.now() / 1000);

  // These params are signed — Cloudinary will reject uploads
  // that deviate from them (wrong folder, oversized files, etc.)
  const paramsToSign = {
    timestamp,
    folder:             `civicpulse/${folder}`,
    allowed_formats:    ALLOWED_FORMATS.join(','),
    max_file_size:      MAX_FILE_BYTES,
    // Auto-compress and cap dimensions — important for mobile uploads
    eager:              'c_limit,w_1280,h_1280,q_auto,f_auto',
    eager_async:        true,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET,
  );

  log.info({ userId: req.user.id, folder }, 'Signed upload URL generated');

  res.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey:    process.env.CLOUDINARY_API_KEY,
    folder:    paramsToSign.folder,
    eager:     paramsToSign.eager,
  });
});
