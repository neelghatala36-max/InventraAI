import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './config';

let server: Server;

async function main() {
  const port = Number(config.port) || 5000;

  if (!config.database_url) {
    console.error('❌ FATAL: DATABASE_URL environment variable is missing.');
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }

  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(config.database_url as string);
    console.log('✅ MongoDB connected successfully!');

    server = app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 InventraAI server listening on port ${port} [env: ${config.nodeEnv || 'development'}]`);
    });
  } catch (err) {
    console.error('❌ Database connection error:', err);
    if (config.nodeEnv === 'production') {
      console.error('❌ Shutting down server due to database connection failure in production.');
      process.exit(1);
    } else {
      // In local development, allow inspecting server with warning
      server = app.listen(port, '0.0.0.0', () => {
        console.log(`⚠️ Dev warning: Server running on port ${port} without active database connection.`);
      });
    }
  }
}

main();

process.on('unhandledRejection', (err) => {
  console.error(`😈 unhandledRejection detected, shutting down...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error(`😈 uncaughtException detected, shutting down...`, err);
  process.exit(1);
});
