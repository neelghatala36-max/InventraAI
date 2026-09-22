import dotenv from 'dotenv';

dotenv.config();

export default {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET,
  gemini_api_key: process.env.GEMINI_API_KEY,
  client_url: process.env.CLIENT_URL || process.env.FRONTEND_URL
};
