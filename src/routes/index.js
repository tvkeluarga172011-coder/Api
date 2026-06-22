'use strict';

const express = require('express');
const youtubeRoutes = require('./youtube.routes');
const { sendSuccess } = require('../utils/response');
const { API_VERSION } = require('../config/constants');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health  —  lightweight health check (no service calls)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  return sendSuccess(
    res,
    {
      status: 'healthy',
      version: API_VERSION,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    },
    'YouTube Downloader API is healthy.'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// /api/youtube  —  YouTube feature routes
// ─────────────────────────────────────────────────────────────────────────────
router.use('/youtube', youtubeRoutes);

module.exports = router;
