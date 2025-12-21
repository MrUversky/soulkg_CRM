/**
 * API Server
 * 
 * Main entry point for the backend API
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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
import importRoutes from './routes/import.routes';
import authRoutes from './routes/auth.routes';
import organizationsRoutes from './routes/organizations.routes';
import usersRoutes from './routes/users.routes';
import clientsRoutes from './routes/clients.routes';

app.use('/api/import', importRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clients', clientsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});

