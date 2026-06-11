import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { initDb } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeSocket } from './socket.js';
import { setupEventSubscribers } from './services/eventSubscribers.js';
import { initMailTransport } from './services/emailService.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialiser Socket.IO
const io = initializeSocket(httpServer);
app.locals.io = io;

// Initialiser les subscribers event bus (passe io pour les émissions socket)
setupEventSubscribers(io);

// Initialiser le transport SMTP pour les emails
initMailTransport();

app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
];

app.use(cors({
  origin: process.env.CORS_ORIGIN === 'dev' || process.env.CORS_ORIGIN === '*'
    ? true
    : (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} non autorisée par CORS`));
      },
  credentials: true,
}));
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

async function start() {
  try {
    await initDb();
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
