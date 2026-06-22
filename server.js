'use strict';

require('dotenv').config();

const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');

const PORT = config.port;
const HOST = config.host;

// ─── Start Server ──────────────────────────────────────────────────────────────
const server = app.listen(PORT, HOST, () => {
  logger.info('════════════════════════════════════════════');
  logger.info('  🚀  YouTube Downloader API');
  logger.info(`  🌐  http://${HOST}:${PORT}`);
  logger.info(`  📌  Environment : ${config.env}`);
  logger.info(`  📋  Docs        : GET /api/youtube/status`);
  logger.info('════════════════════════════════════════════');
});

// ─── Unhandled Promise Rejections ─────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
  logger.error('At promise:', promise);
  server.close(() => {
    logger.error('Server closed due to unhandled promise rejection');
    process.exit(1);
  });
});

// ─── Uncaught Exceptions ──────────────────────────────────────────────────────
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error.message);
  logger.error(error.stack);
  process.exit(1);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
