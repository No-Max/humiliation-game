import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { resolveUploadDir } from './lib/paths.js';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@humiliation-game/shared';
import { publicRouter } from './routes/public.js';
import { authRouter } from './routes/auth.js';
import { adminAuthRouter } from './routes/admin/auth.js';
import { adminSeriesRouter } from './routes/admin/series.js';
import { adminToursRouter } from './routes/admin/tours.js';
import { adminMediaRouter } from './routes/admin/media.js';
import { adminReviewsRouter } from './routes/admin/reviews.js';
import { setupSocketHandlers } from './socket/handlers.js';

const PORT = Number(process.env.PORT ?? 3200);
const uploadDir = resolveUploadDir();
const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3210,http://localhost:3220')
  .split(',')
  .map((s) => s.trim());

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: corsOrigins, credentials: true },
});

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(uploadDir)));

app.get('/', (_req, res) => {
  res.json({
    message: 'Humiliation Game API',
    web: 'http://localhost:3210',
    admin: 'http://localhost:3220',
    health: '/api/health',
  });
});

app.use('/api', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin/series', adminSeriesRouter);
app.use('/api/admin/tours', adminToursRouter);
app.use('/api/admin/media', adminMediaRouter);
app.use('/api/admin/reviews', adminReviewsRouter);

setupSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
