'use strict';

const { sendError } = require('../utils/response');
const { ERROR_CODES } = require('../config/constants');

/**
 * 404 Not Found handler.
 *
 * Catch-all middleware for routes that don't match any registered handler.
 * Must be placed after all route definitions and before the global error handler.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const notFound = (req, res) => {
  return sendError(
    res,
    `The requested endpoint "${req.method} ${req.originalUrl}" does not exist.`,
    404,
    ERROR_CODES.NOT_FOUND
  );
};

module.exports = notFound;
