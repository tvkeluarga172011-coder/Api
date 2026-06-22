'use strict';

/**
 * Format seconds into HH:MM:SS or MM:SS string.
 *
 * @param {number} totalSeconds
 * @returns {string}
 */
const formatDuration = (totalSeconds) => {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) return '00:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Format bytes into a human-readable file size string.
 *
 * @param {number} bytes
 * @returns {string}
 */
const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return 'Unknown';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1);
  const value = (bytes / Math.pow(1024, i)).toFixed(2);

  return `${value} ${units[i]}`;
};

/**
 * Format a number with thousand separators (locale-aware).
 *
 * @param {number|string} num
 * @returns {string}
 */
const formatNumber = (num) => {
  const n = parseInt(num, 10);
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US');
};

/**
 * Extract the container format from a MIME type string.
 *
 * @param {string|null} mimeType  - e.g. "video/mp4; codecs=..."
 * @returns {string}
 */
const getContainer = (mimeType) => {
  if (!mimeType) return 'unknown';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('3gpp')) return '3gp';
  if (mimeType.includes('mpeg')) return 'mpeg';
  return 'unknown';
};

/**
 * Strip extra info from a MIME type and return just "video/mp4" etc.
 *
 * @param {string|null} mimeType
 * @returns {string}
 */
const cleanMimeType = (mimeType) => {
  if (!mimeType) return 'unknown';
  return mimeType.split(';')[0].trim();
};

module.exports = {
  formatDuration,
  formatFileSize,
  formatNumber,
  getContainer,
  cleanMimeType,
};
