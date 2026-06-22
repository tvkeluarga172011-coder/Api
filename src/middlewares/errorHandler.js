'use strict';

const AppError = require('../utils/AppError');
const { sendError } = require('../utils/response');
const { ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Global Express error-handling middleware.
 *
 * Must be registered LAST, after all routes and other middleware.
 * Express identifies error middleware by the 4-parameter signature (err, req, res, next).
 *
 * @param {Error}                        err
 * @param {import('express').Request}    req
 * @param {import('express').Response}   res
 * @param {import('express').NextFunction} next  — must be declared even if unused
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // ─── Log the error ───────────────────────────────────────────────────────
  const isProduction = process.env.NODE_ENV === 'production';

  logger.error(
    `[${req.method}] ${req.originalUrl} → ${err.statusCode || 500} "${err.message}"`,
    {
      errorCode: err.errorCode || 'UNKNOWN',
      stack: isProduction ? undefined : err.stack,
      body: req.body,
      ip: req.ip,
    }
  );

  // ─── Malformed JSON body ─────────────────────────────────────────────────
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Invalid JSON in request body.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // ─── Payload too large ───────────────────────────────────────────────────
  if (err.type === 'entity.too.large') {
    return sendError(res, 'Request payload is too large.', 413, ERROR_CODES.VALIDATION_ERROR);
  }

  // ─── Known operational error (AppError) ─────────────────────────────────
  if (err instanceof AppError && err.isOperational) {
    return sendError(res, err.message, err.statusCode, err.errorCode);
  }

  // ─── Unknown / programmer error ──────────────────────────────────────────
  const message = isProduction
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal Server Error';

  return sendError(res, message, err.statusCode || 500, ERROR_CODES.INTERNAL_ERROR);
};

module.exports = errorHandler;
