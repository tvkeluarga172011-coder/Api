'use strict';

const youtubeService = require('../services/youtube.service');
const { sendSuccess } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * YouTubeController
 *
 * Thin layer between HTTP and the service.
 * Responsibilities: parse request → call service → send response → delegate errors.
 */
class YouTubeController {
  /**
   * POST /api/youtube/download
   *
   * Accepts a YouTube URL (and optional quality preference) and returns
   * the video's metadata together with all available download formats.
   *
   * @param {import('express').Request}  req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getVideoInfo(req, res, next) {
    try {
      const { url, quality = null } = req.body;

      logger.info(`[getVideoInfo] url="${url}" quality="${quality || 'any'}"`);

      const data = await youtubeService.getVideoInfo(url, quality);

      return sendSuccess(res, data, 'Video information retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/youtube/status
   *
   * Returns API health, uptime, supported qualities, and endpoint docs.
   *
   * @param {import('express').Request}  req
   * @param {import('express').Response} res
   */
  async getStatus(req, res) {
    const data = youtubeService.getServiceStatus();
    return sendSuccess(res, data, 'Service is operational.');
  }
}

module.exports = new YouTubeController();
