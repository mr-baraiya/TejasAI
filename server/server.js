import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import enhanceRoutes from './routes/enhance.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables from .env
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Support configured frontend URL or localhost on any standard dev port
      const allowedOrigins = [
        FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
      ];

      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
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

app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here');
  res.status(200).json({
    status: 'online',
    app: 'TejasAI Server',
    groqConfigured: hasKey,
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    timestamp: new Date().toISOString(),
  });
});

// Main routes
app.use('/api', enhanceRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  TejasAI Backend Server running!        `);
  console.log(`  Port: http://localhost:${PORT}         `);
  console.log(`  Model: ${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'}`);
  console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.error(`   Another instance of TejasAI or another app is running on port ${PORT}.`);
    console.error(`   To resolve, close the other process or run: npx kill-port ${PORT}\n`);
    process.exit(1);
  } else {
    console.error('Server startup error:', err);
  }
});

