import { v2 as cloudinary } from 'cloudinary';

// Validate that all required environment variables are present
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('⚠️ Cloudinary credentials missing. Image uploads will fail.');
  console.warn('Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local');
}

cloudinary.config({
  cloud_name: cloudName || '',
  api_key: apiKey || '',
  api_secret: apiSecret || '',
});

export default cloudinary;

