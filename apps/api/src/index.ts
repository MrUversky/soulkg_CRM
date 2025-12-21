/**
 * API Server
 * 
 * Main entry point for the backend API
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables (only if .env file exists, Railway uses env vars directly)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
// CORS configuration - allow requests from frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

// Health check - must be before any route imports to ensure it works even if DB is down
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes with error handling
let importRoutes;
try {
  importRoutes = require('./routes/import.routes');
  if (importRoutes) {
    app.use('/api/import', importRoutes.default || importRoutes);
  }
} catch (error: any) {
  console.warn('⚠️  Import routes disabled due to module resolution issue:', error.message);
  importRoutes = null;
}

// Import other routes
let authRoutes, organizationsRoutes, usersRoutes, clientsRoutes;
try {
  authRoutes = require('./routes/auth.routes').default;
  organizationsRoutes = require('./routes/organizations.routes').default;
  usersRoutes = require('./routes/users.routes').default;
  clientsRoutes = require('./routes/clients.routes').default;
  
  app.use('/api/auth', authRoutes);
  app.use('/api/organizations', organizationsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/clients', clientsRoutes);
} catch (error: any) {
  console.error('❌ Failed to load routes:', error.message);
  console.error(error.stack);
  // Don't exit - health check should still work
}

// Start server with error handling
let server;
try {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check available at http://0.0.0.0:${PORT}/health`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

// Handle errors
if (server) {
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

    switch (error.code) {
      case 'EACCES':
        console.error(`❌ ${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`❌ ${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
    });
  }
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit - let Railway handle it
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - let Railway handle it
});

