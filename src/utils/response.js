'use strict';

const { STATUS } = require('../config/constants');

/**
 * Send a standardized success response.
 *
 * @param {import('express').Response} res
 * @param {*}       data        - Payload to return
 * @param {string}  message     - Success message
 * @param {number}  statusCode  - HTTP status (default: 200)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: STATUS.SUCCESS,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send a standardized error response.
 *
 * @param {import('express').Response} res
 * @param {string}  message     - Error description
 * @param {number}  statusCode  - HTTP status (default: 500)
 * @param {string}  errorCode   - Application error code
 * @param {Array}   errors      - Optional validation errors array
 */
const sendError = (res, message = 'An error occurred', statusCode = 500, errorCode = null, errors = null) => {
  const body = {
    status: STATUS.ERROR,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
  };

  if (errors && Array.isArray(errors) && errors.length > 0) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
};

/**
 * Send a standardized paginated response.
 *
 * @param {import('express').Response} res
 * @param {Array}   data        - Result array
 * @param {object}  pagination  - { page, limit, total, totalPages }
 * @param {string}  message
 */
const sendPaginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    status: STATUS.SUCCESS,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
