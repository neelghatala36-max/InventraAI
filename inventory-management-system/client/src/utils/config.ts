const getBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
  const rawBaseUrl = envUrl.length > 0 ? envUrl : 'http://localhost:5000/api/v1';
  const cleanUrl = rawBaseUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
};

export const config = {
  baseUrl: getBaseUrl(),
  VITE_CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  VITE_CLOUDINARY_API_KEY: import.meta.env.VITE_CLOUDINARY_API_KEY,
  VITE_CLOUDINARY_API_SECRET: import.meta.env.VITE_CLOUDINARY_API_SECRET,
  VITE_CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
};