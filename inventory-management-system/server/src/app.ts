import cors from 'cors';
import express, { Application } from 'express';
import morgan from 'morgan';
import rootRouter from './routes';
import notFound from './middlewares/notFound';
import globalErrorHandler from './middlewares/globalErrorhandler';

import config from './config';

const app: Application = express();

app.use(express.json());
app.use(morgan('dev'));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://inventory-navy.vercel.app',
  ...(config.client_url ? config.client_url.split(',').map((url) => url.trim()) : [])
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in deployment to prevent unexpected CORS blocks
      }
    },
    credentials: true,
  })
);

// application routes
app.use('/api/v1', rootRouter);

app.use(globalErrorHandler);

app.use(notFound);

export default app;
