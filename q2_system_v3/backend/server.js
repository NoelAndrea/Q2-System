// server.js  –  Entry point for the Planting Decision Tool backend
'use strict';

require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const initDB        = require('./src/config/initDB');
const authRoutes    = require('./src/routes/auth');
const simRoutes     = require('./src/routes/simulations');
const adminRoutes   = require('./src/routes/admin');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── 1. Security headers (Helmet) ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── 2. CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── 3. Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));       // reject huge bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── 4. HTTP request logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ── 5. Global rate limiter ────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX        || '100'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
app.use(globalLimiter);

// Stricter limiter for auth endpoints (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

// ── 6. Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',     authLimiter, authRoutes);
app.use('/api/simulate', simRoutes);
app.use('/api/admin',    adminRoutes);

// Health-check — useful for uptime monitors / Docker
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 7. 404 handler ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── 8. Global error handler ───────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);

  // CORS errors
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body.' });
  }

  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── 9. Boot ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    await initDB();                     // create tables & seed data
    app.listen(PORT, () => {
      console.log(`\n🚀  Server running on http://localhost:${PORT}`);
      console.log(`📋  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐  CORS origin:  ${allowedOrigins.join(', ')}\n`);
    });
  } catch (err) {
    console.error('❌  Server failed to start:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app; // exported for testing
