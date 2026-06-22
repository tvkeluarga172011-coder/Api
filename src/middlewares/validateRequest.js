'use strict';

const { body, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');
const { ERROR_CODES, QUALITY_ORDER } = require('../config/constants');

// ─────────────────────────────────────────────────────────────────────────────
// Helper — run validationResult and abort on failure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Collect express-validator errors and send a 400 if any exist.
 * Must be the last rule in every validation chain array.
 */
const handleValidationErrors = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true }).map((e) => ({
      field: e.path,
      message: e.msg,
      ...(e.value !== undefined && e.value !== '' ? { receivedValue: e.value } : {}),
    }));

    return sendError(res, 'Validation failed.', 400, ERROR_CODES.VALIDATION_ERROR, errors);
  }

  return next();
};

// ─────────────────────────────────────────────────────────────────────────────
// Validation Rules
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rules for POST /api/youtube/download
 *
 * Required:
 *   url    — must be a non-empty string matching known YouTube URL patterns
 *
 * Optional:
 *   quality — one of QUALITY_ORDER values
 */
const validateDownloadRequest = [
  // ── url ────────────────────────────────────────────────────────────────────
  body('url')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('The "url" field is required.')
    .isString()
    .withMessage('The "url" field must be a string.')
    .trim()
    .isLength({ min: 10, max: 2048 })
    .withMessage('The "url" must be between 10 and 2048 characters.')
    .custom((value) => {
      const YOUTUBE_REGEX =
        /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)$/i;

      if (!YOUTUBE_REGEX.test(value)) {
        throw new Error(
          'Invalid YouTube URL. Supported formats: youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/...'
        );
      }
      return true;
    }),

  // ── quality (optional) ─────────────────────────────────────────────────────
  body('quality')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('The "quality" field must be a string.')
    .trim()
    .isIn(QUALITY_ORDER)
    .withMessage(`"quality" must be one of: ${QUALITY_ORDER.join(', ')}.`),

  // ── Run validation ─────────────────────────────────────────────────────────
  handleValidationErrors,
];

module.exports = {
  validateDownloadRequest,
  handleValidationErrors,
};
