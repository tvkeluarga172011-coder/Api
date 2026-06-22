'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');
const logger = require('./utils/logger');

const app = express();

// ─── Trust Proxy (for correct IP behind reverse proxy) ─────────────────────
app.set('trust proxy', 1);

// ─── Security Headers ──────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // disable if serving API only
    crossOriginEmbedderPolicy: false,
  })
);

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.cors.origin,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
    credentials: config.cors.credentials,
    optionsSuccessStatus: 200,
  })
);

// ─── Response Compression ──────────────────────────────────────────────────
app.use(compression());

// ─── Body Parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Request Logger ───────────────────────────────────────────────────
const morganFormat = config.env === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
    skip: (req) => req.url === '/api/health', // skip health check logs
  })
);

// ─── Global Rate Limiter ───────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const { sendError } = require('./utils/response');
    const { ERROR_CODES } = require('./config/constants');
    return sendError(
      res,
      `Too many requests. Please try again after ${Math.ceil(config.rateLimit.windowMs / 60000)} minutes.`,
      429,
      ERROR_CODES.RATE_LIMITED
    );
  },
});

app.use('/api', limiter);

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
