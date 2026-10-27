import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import enhanceRoutes from './routes/enhance.js';
import contactRoutes from './routes/contact.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initDB } from './services/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables locally (on Vercel, they are injected into process.env automatically)
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialise DB (creates table if not exists) — non-blocking, best-effort
initDB().catch((err) => console.error('[DB] initDB error:', err.message));

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Trust reverse proxy (required on Vercel, cloud platforms, and load balancers for rate limiting)
app.set('trust proxy', 1);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Support configured frontend URL or localhost dev servers
      const allowedOrigins = [
        FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
      ];

      // Automatically support Vercel preview/production domains and browser extensions
      const isVercelDomain = origin.endsWith('.vercel.app');
      const isExtension = origin.startsWith('chrome-extension://');

      if (
        allowedOrigins.includes(origin) ||
        isVercelDomain ||
        isExtension ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }

      return callback(new Error('Cross-Origin Request Blocked by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '2mb' }));

// Rate limiter for API endpoints (e.g., max 60 requests per 15 minutes window)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

// Apply rate limiter to API routes (protects both /api/enhance and /enhance)
app.use(['/api', '/enhance', '/health'], apiLimiter);

// Health check endpoint handler
const healthHandler = (req, res) => {
  const hasKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here');
  res.status(200).json({
    status: 'online',
    app: 'TejasAI Server',
    groqConfigured: hasKey,
    groqModel: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
    timestamp: new Date().toISOString(),
  });
};

// Support both /api/health and /health (in case Vercel rewrites strip /api)
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Mount main routes under both /api and / to handle direct calls & serverless rewrites seamlessly
app.use('/api', contactRoutes);
app.use('/', contactRoutes);
app.use('/api', enhanceRoutes);
app.use('/', enhanceRoutes);

// 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
