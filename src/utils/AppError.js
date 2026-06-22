'use strict';

/**
 * Custom operational error class.
 * Used to distinguish expected, handled errors from unexpected programmer errors.
 *
 * @param {string} message     - Human-readable error description
 * @param {number} statusCode  - HTTP status code (default: 500)
 * @param {string} errorCode   - Application-level error code (e.g., 'INVALID_URL')
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // marks this as an expected, handled error

    // Capture clean stack trace (Node.js v8+)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = AppError;
