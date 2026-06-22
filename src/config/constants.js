'use strict';

/**
 * Human-readable labels for YouTube video quality levels.
 */
const QUALITY_LABELS = {
  '2160p': '4K Ultra HD',
  '1440p': '2K Quad HD',
  '1080p': 'Full HD',
  '720p': 'HD',
  '480p': 'Standard Definition',
  '360p': 'Low Definition',
  '240p': 'Very Low',
  '144p': 'Minimal',
};

/**
 * Ordered list of supported quality values (highest to lowest).
 */
const QUALITY_ORDER = [
  '2160p',
  '1440p',
  '1080p',
  '720p',
  '480p',
  '360p',
  '240p',
  '144p',
];

/**
 * Supported video MIME types.
 */
const SUPPORTED_MIME_TYPES = {
  VIDEO_MP4: 'video/mp4',
  VIDEO_WEBM: 'video/webm',
  AUDIO_MP4: 'audio/mp4',
  AUDIO_WEBM: 'audio/webm',
};

/**
 * API response status strings.
 */
const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  FAIL: 'fail',
};

/**
 * Structured error codes for consistent error identification.
 */
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_URL: 'INVALID_URL',
  VIDEO_NOT_FOUND: 'VIDEO_NOT_FOUND',
  VIDEO_UNAVAILABLE: 'VIDEO_UNAVAILABLE',
  AGE_RESTRICTED: 'AGE_RESTRICTED',
  PRIVATE_VIDEO: 'PRIVATE_VIDEO',
  LIVE_STREAM: 'LIVE_STREAM',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
};

/**
 * API version.
 */
const API_VERSION = '1.0.0';

module.exports = {
  QUALITY_LABELS,
  QUALITY_ORDER,
  SUPPORTED_MIME_TYPES,
  STATUS,
  ERROR_CODES,
  API_VERSION,
};
