'use strict';

/**
 * Regex pattern covering all known YouTube URL formats:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://youtube.com/shorts/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - https://www.youtube.com/v/VIDEO_ID
 *  - https://m.youtube.com/watch?v=VIDEO_ID
 */
const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)$/i;

/**
 * Validate whether a string is a recognized YouTube URL.
 *
 * @param {string} url
 * @returns {boolean}
 */
const isValidYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return YOUTUBE_URL_REGEX.test(url.trim());
};

/**
 * Extract the 11-character video ID from a YouTube URL.
 *
 * @param {string} url
 * @returns {string|null}
 */
const extractVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.trim().match(YOUTUBE_URL_REGEX);
  return match ? match[5] : null;
};

/**
 * Normalize any YouTube URL into a canonical watch URL.
 *
 * @param {string} url
 * @returns {string|null}
 */
const normalizeUrl = (url) => {
  const id = extractVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/watch?v=${id}`;
};

module.exports = {
  isValidYouTubeUrl,
  extractVideoId,
  normalizeUrl,
};
