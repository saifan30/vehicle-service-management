import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { validateEnvironment } from './server/config/env.ts';
import { initDatabase, getDbStatus } from './server/db/index.ts';

import authRoutes from './server/routes/auth.ts';
import vehiclesRoutes from './server/routes/vehicles.ts';
import servicesRoutes from './server/routes/services.ts';
import bookingsRoutes from './server/routes/bookings.ts';
import usersRoutes from './server/routes/users.ts';
import uploadRoutes from './server/routes/upload.ts';
import cloudRoutes from './server/routes/cloud.ts';

dotenv.config();

// 1. Validate environment configuration at server startup
const envConfig = validateEnvironment();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = envConfig.PORT;
const isProd = envConfig.NODE_ENV === 'production';

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging for cloud access monitoring
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[REST API] ${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint for AWS Elastic Beanstalk Application Load Balancer
// Works strictly without authentication
app.get('/health', (req, res) => {
  const dbStatus = getDbStatus();
  res.status(200).json({
    status: 'HEALTHY',
    service: 'Vehicle Service Management System',
    platform: 'AWS Elastic Beanstalk',
    compute: 'Amazon EC2',
    database: dbStatus.driver,
    timestamp: new Date().toISOString(),
  });
});

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cloud', cloudRoutes);

// Global Error Handler (Hides internal stack traces in production)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Server Error]:', err.message);
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error occurred.' : (err.message || 'Server error'),
  });
});

async function startServer() {
  // Initialize Database (Amazon RDS PostgreSQL using DATABASE_URL via pg.Pool)
  await initDatabase();

  if (!isProd) {
    // Vite Dev Middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
      },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production static file serving for AWS Elastic Beanstalk / EC2
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` Cloud-Based Vehicle Service Management System Started `);
    console.log(` Host: http://0.0.0.0:${PORT}                          `);
    console.log(` Mode: ${envConfig.NODE_ENV.toUpperCase()}             `);
    console.log(` Target Cloud Platform: AWS (Beanstalk + EC2 + RDS + S3) `);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Server Fatal Startup Error]:', err.message);
  process.exit(1);
});
