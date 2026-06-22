'use strict';

const express = require('express');

const youtubeController = require('../controllers/youtube.controller');
const { validateDownloadRequest } = require('../middlewares/validateRequest');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/youtube/download
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @route   POST /api/youtube/download
 * @desc    Retrieve video metadata and all available download formats/resolutions
 * @access  Public
 *
 * @body    {string}  url       - Valid YouTube video URL (required)
 * @body    {string}  [quality] - Filter recommended formats (e.g. "720p", "1080p")
 *
 * @returns {object} JSON with { video, formats, meta }
 */
router.post('/download', validateDownloadRequest, (req, res, next) =>
  youtubeController.getVideoInfo(req, res, next)
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/youtube/status
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @route   GET /api/youtube/status
 * @desc    Return service status, supported qualities, uptime, and endpoint docs
 * @access  Public
 */
router.get('/status', (req, res) =>
  youtubeController.getStatus(req, res)
);

module.exports = router;
