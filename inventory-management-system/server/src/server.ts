import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './config';

let server: Server;

async function main() {
  server = app.listen(config.port, () => {
    console.log(`app is listening on port ${config.port}`);
  });

  try {
    console.log('Connecting to database...');
    await mongoose.connect(config.database_url as string);
    console.log('Database connected successfully!');
  } catch (err) {
    console.error('Database connection error:', err);
    console.log('⚠️ Database connection failed. Running in mock/offline mode for testing.');
  }
}

main();

process.on('unhandledRejection', (err) => {
  console.log(`😈 unahandledRejection is detected , shutting down ...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on('uncaughtException', () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});
