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

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes
import * as http from 'http';
// #region agent log
const logImport1={location:'index.ts:33',message:'Attempting to import data-import routes',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};const req1=http.request({hostname:'127.0.0.1',port:7243,path:'/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});req1.write(JSON.stringify(logImport1));req1.end();
// #endregion
let importRoutes;
try {
  importRoutes = require('./routes/import.routes');
  // #region agent log
  const logImport2={location:'index.ts:37',message:'Import routes loaded successfully',data:{hasDefault:!!importRoutes.default,hasRoutes:!!importRoutes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};const req2=http.request({hostname:'127.0.0.1',port:7243,path:'/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});req2.write(JSON.stringify(logImport2));req2.end();
  // #endregion
} catch (error: any) {
  // #region agent log
  const logImport3={location:'index.ts:40',message:'Failed to load import routes',data:{errorMessage:error?.message,errorCode:error?.code,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};const req3=http.request({hostname:'127.0.0.1',port:7243,path:'/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',method:'POST',headers:{'Content-Type':'application/json'}},()=>{});req3.write(JSON.stringify(logImport3));req3.end();
  // #endregion
  console.warn('⚠️  Import routes disabled due to module resolution issue:', error.message);
  importRoutes = null;
}
import authRoutes from './routes/auth.routes';
import organizationsRoutes from './routes/organizations.routes';
import usersRoutes from './routes/users.routes';
import clientsRoutes from './routes/clients.routes';

if (importRoutes) {
  app.use('/api/import', importRoutes.default || importRoutes);
}
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clients', clientsRoutes);

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API server running on http://0.0.0.0:${PORT}`);
});

// Handle errors
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

