'use strict';

const ytdl = require('@distube/ytdl-core');

const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { formatDuration, formatFileSize, formatNumber, getContainer, cleanMimeType } = require('../utils/formatters');
const { normalizeUrl } = require('../utils/youtubeValidator');
const { QUALITY_LABELS, QUALITY_ORDER, ERROR_CODES, API_VERSION } = require('../config/constants');
const config = require('../config');

// ─────────────────────────────────────────────────────────────────────────────
// YouTubeService
// ─────────────────────────────────────────────────────────────────────────────

class YouTubeService {
  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Fetch detailed video information and all available download formats.
   *
   * @param {string}      rawUrl          - Any valid YouTube URL
   * @param {string|null} preferredQuality - e.g. '720p' to filter recommended list
   * @returns {Promise<object>}
   */
  async getVideoInfo(rawUrl, preferredQuality = null) {
    const url = normalizeUrl(rawUrl);
    if (!url) {
      throw new AppError('Invalid YouTube URL provided.', 400, ERROR_CODES.INVALID_URL);
    }

    logger.debug(`Fetching info for: ${url}`);

    let info;
    try {
      info = await ytdl.getInfo(url, {
        requestOptions: { timeout: config.youtube.requestTimeout },
      });
    } catch (err) {
      this._handleYtdlError(err);
    }

    const videoDetails = this._extractVideoDetails(info);
    const formats = this._processFormats(info.formats, preferredQuality);

    return {
      video: videoDetails,
      formats,
      meta: {
        fetchedAt: new Date().toISOString(),
        sourceUrl: url,
        totalFormatsAvailable: info.formats.length,
        preferredQuality: preferredQuality || null,
      },
    };
  }

  /**
   * Return a summary of this service's capabilities.
   * Used by GET /api/youtube/status.
   *
   * @returns {object}
   */
  getServiceStatus() {
    return {
      service: 'YouTube Downloader API',
      version: API_VERSION,
      status: 'operational',
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: this._formatUptime(process.uptime()),
      },
      supportedQualities: QUALITY_ORDER,
      endpoints: {
        'POST /api/youtube/download': {
          description: 'Retrieve video metadata and all available download formats.',
          contentType: 'application/json',
          body: {
            url: {
              type: 'string',
              required: true,
              description: 'Any valid YouTube video URL',
            },
            quality: {
              type: 'string',
              required: false,
              description: `Optional preferred quality filter. Allowed: ${QUALITY_ORDER.join(' | ')}`,
            },
          },
        },
        'GET /api/youtube/status': {
          description: 'Retrieve API status, uptime, and supported qualities.',
        },
        'GET /api/health': {
          description: 'Simple health check — returns 200 OK.',
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  // ── Private — Video Details ─────────────────────────────────────────────────

  /**
   * Shape ytdl-core's videoDetails into our standard structure.
   */
  _extractVideoDetails(info) {
    const d = info.videoDetails;

    // Thumbnails sorted by resolution (largest last)
    const thumbnails = (d.thumbnails || []).sort((a, b) => (a.width || 0) - (b.width || 0));

    return {
      videoId: d.videoId,
      title: d.title,
      description: d.shortDescription || null,
      url: `https://www.youtube.com/watch?v=${d.videoId}`,

      duration: {
        seconds: parseInt(d.lengthSeconds, 10) || 0,
        formatted: formatDuration(parseInt(d.lengthSeconds, 10)),
      },

      thumbnail: {
        low: thumbnails[0]?.url || null,
        medium: thumbnails[Math.floor(thumbnails.length / 2)]?.url || null,
        high: thumbnails[thumbnails.length - 1]?.url || null,
        all: thumbnails,
      },

      channel: {
        name: d.author?.name || null,
        id: d.author?.id || null,
        url: d.author?.channel_url || null,
        verified: d.author?.verified || false,
        subscriberCount: d.author?.subscriber_count
          ? formatNumber(d.author.subscriber_count)
          : null,
      },

      statistics: {
        viewCount: parseInt(d.viewCount, 10) || 0,
        viewCountFormatted: formatNumber(d.viewCount),
        likes: d.likes || null,
        isLiveContent: d.isLiveContent || false,
      },

      meta: {
        uploadDate: d.uploadDate || null,
        category: d.category || null,
        keywords: d.keywords || [],
        isPrivate: d.isPrivate || false,
        isUnlisted: d.isUnlisted || false,
        ageRestricted: d.age_restricted || false,
        isFamilySafe: d.isFamilySafe !== undefined ? d.isFamilySafe : null,
      },
    };
  }

  // ── Private — Format Processing ─────────────────────────────────────────────

  /**
   * Organise all ytdl formats into grouped buckets:
   *  - recommended  : best muxed format per quality (optionally filtered)
   *  - combined     : all muxed (video + audio) formats
   *  - videoOnly    : adaptive video-only streams
   *  - audioOnly    : adaptive audio-only streams
   *  - availableQualities : sorted list of quality strings found in this video
   */
  _processFormats(rawFormats, preferredQuality) {
    const combined = [];
    const videoOnly = [];
    const audioOnly = [];

    // Map: qualityLabel → best muxed format (mp4 preferred over webm)
    const bestMuxedMap = new Map();

    rawFormats.forEach((fmt) => {
      if (!fmt.url) return; // skip formats without a download URL

      const shaped = this._shapeFormat(fmt);

      if (fmt.hasVideo && fmt.hasAudio) {
        combined.push(shaped);

        // Keep only the best mp4 format per quality label
        const existing = bestMuxedMap.get(shaped.quality);
        const isPreferredContainer = shaped.container === 'mp4';
        if (!existing || (isPreferredContainer && existing.container !== 'mp4')) {
          bestMuxedMap.set(shaped.quality, shaped);
        }
      } else if (fmt.hasVideo && !fmt.hasAudio) {
        videoOnly.push(shaped);
      } else if (!fmt.hasVideo && fmt.hasAudio) {
        audioOnly.push(shaped);
      }
    });

    // Build ordered recommended list
    const recommended = QUALITY_ORDER
      .map((q) => bestMuxedMap.get(q))
      .filter(Boolean);

    // Apply quality filter for "recommended" bucket if requested
    const filteredRecommended = preferredQuality
      ? recommended.filter((f) => f.quality === preferredQuality)
      : recommended;

    // Collect all unique quality labels present in this video
    const allQualities = new Set([
      ...combined.map((f) => f.quality),
      ...videoOnly.map((f) => f.quality),
    ]);
    const availableQualities = QUALITY_ORDER.filter((q) => allQualities.has(q));

    return {
      recommended: filteredRecommended.length > 0 ? filteredRecommended : recommended,
      combined: this._sortByQuality(combined),
      videoOnly: this._sortByQuality(videoOnly),
      audioOnly: audioOnly.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0)),
      availableQualities,
      summary: {
        totalCombined: combined.length,
        totalVideoOnly: videoOnly.length,
        totalAudioOnly: audioOnly.length,
        highestQualityAvailable: availableQualities[0] || null,
      },
    };
  }

  /**
   * Transform a single ytdl format object into our API shape.
   */
  _shapeFormat(fmt) {
    const fileSizeBytes = fmt.contentLength ? parseInt(fmt.contentLength, 10) : null;

    return {
      itag: fmt.itag,
      mimeType: cleanMimeType(fmt.mimeType),
      container: getContainer(fmt.mimeType),
      codecs: fmt.codecs || null,

      // Quality
      quality: fmt.qualityLabel || fmt.quality || null,
      qualityLabel: QUALITY_LABELS[fmt.qualityLabel] || fmt.qualityLabel || 'Unknown',
      width: fmt.width || null,
      height: fmt.height || null,
      fps: fmt.fps || null,

      // Audio
      hasAudio: fmt.hasAudio || false,
      hasVideo: fmt.hasVideo || false,
      audioBitrate: fmt.audioBitrate || null,
      audioSampleRate: fmt.audioSampleRate || null,
      audioChannels: fmt.audioChannels || null,

      // Bitrate
      bitrate: fmt.bitrate || null,
      averageBitrate: fmt.averageBitrate || null,

      // File size
      fileSizeBytes,
      fileSize: formatFileSize(fileSizeBytes),

      // Download URL
      url: fmt.url,
    };
  }

  /**
   * Sort a format array from highest to lowest quality.
   */
  _sortByQuality(formats) {
    return formats.slice().sort((a, b) => {
      const ai = QUALITY_ORDER.indexOf(a.quality);
      const bi = QUALITY_ORDER.indexOf(b.quality);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  // ── Private — Error Handling ────────────────────────────────────────────────

  /**
   * Map ytdl-core error messages into structured AppError instances.
   */
  _handleYtdlError(err) {
    const msg = err?.message?.toLowerCase() || '';
    logger.error('ytdl-core error:', err.message);

    if (msg.includes('video unavailable') || msg.includes('removed')) {
      throw new AppError('This video is unavailable or has been removed.', 404, ERROR_CODES.VIDEO_UNAVAILABLE);
    }
    if (msg.includes('private video') || msg.includes('is private')) {
      throw new AppError('This video is private.', 403, ERROR_CODES.PRIVATE_VIDEO);
    }
    if (msg.includes('age-restricted') || msg.includes('age restricted')) {
      throw new AppError('This video is age-restricted and cannot be accessed.', 403, ERROR_CODES.AGE_RESTRICTED);
    }
    if (msg.includes('is a live stream') || msg.includes('premieres')) {
      throw new AppError('Live streams are not supported.', 422, ERROR_CODES.LIVE_STREAM);
    }
    if (msg.includes('timeout') || msg.includes('etimedout')) {
      throw new AppError('Request timed out while fetching video info. Please try again.', 504, ERROR_CODES.TIMEOUT);
    }
    if (msg.includes('no such video') || msg.includes('not found') || msg.includes('404')) {
      throw new AppError('Video not found.', 404, ERROR_CODES.VIDEO_NOT_FOUND);
    }

    throw new AppError(
      'An unexpected error occurred while fetching video information.',
      500,
      ERROR_CODES.INTERNAL_ERROR
    );
  }

  // ── Private — Helpers ───────────────────────────────────────────────────────

  /**
   * Format process uptime into "Xd Xh Xm Xs".
   */
  _formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  }
}

module.exports = new YouTubeService();
