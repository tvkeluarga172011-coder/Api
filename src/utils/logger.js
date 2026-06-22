'use strict';

const winston = require('winston');
const path = require('path');

// ─── Custom log levels (Morgan "http" level added) ─────────────────────────
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

winston.addColors(LOG_COLORS);

// ─── Format: Console (colorized, human-readable) ───────────────────────────
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`
  )
);

// ─── Format: File (structured JSON) ───────────────────────────────────────
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ─── Transports ───────────────────────────────────────────────────────────
const transports = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  const logsDir = path.join(process.cwd(), 'logs');

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );
}

// ─── Logger Instance ──────────────────────────────────────────────────────
const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transports,
  exitOnError: false,
});

module.exports = logger;
