'use strict';

require('dotenv').config();

/**
 * Centralized application configuration.
 * All environment variables are read from here — never access process.env directly in app code.
 */
const config = {
  // ─── Server ──────────────────────────────────────────────────────────────
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',

  // ─── CORS ────────────────────────────────────────────────────────────────
  cors: {
    origin: process.env.CORS_ORIGIN === '*'
      ? '*'
      : (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  },

  // ─── YouTube ─────────────────────────────────────────────────────────────
  youtube: {
    requestTimeout: parseInt(process.env.YOUTUBE_REQUEST_TIMEOUT, 10) || 30_000,
    maxRetries: parseInt(process.env.YOUTUBE_MAX_RETRIES, 10) || 3,
  },

  // ─── Rate Limiting ───────────────────────────────────────────────────────
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1_000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  // ─── Logging ─────────────────────────────────────────────────────────────
  log: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  },
};

module.exports = config;
