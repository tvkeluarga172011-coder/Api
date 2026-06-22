# YouTube Downloader API

Production-ready REST API built with **Node.js** and **Express.js** for fetching YouTube video metadata and all available download formats with resolution information (144p – 4K).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Health Check](#1-get-apihealth)
  - [Get Video Info & Formats](#2-post-apiyoutubedownload)
  - [Service Status](#3-get-apiyoutubstatus)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Example Responses](#example-responses)

---

## Features

- **Video Metadata** — title, channel, duration, thumbnails, view count, upload date
- **Multi-Resolution Formats** — 144p, 240p, 360p, 480p, 720p, 1080p, 1440p, 2160p (4K)
- **Format Buckets** — recommended (muxed), video-only, audio-only
- **Quality Filter** — request only a specific resolution
- **Input Validation** — `express-validator` with descriptive field-level errors
- **Rate Limiting** — configurable per-IP limits
- **Security Headers** — via `helmet`
- **CORS** — configurable allowed origins
- **Structured Logging** — `winston` (colorized console + JSON file in production)
- **HTTP Logging** — `morgan`
- **Graceful Shutdown** — handles SIGTERM / SIGINT
- **Global Error Handler** — unified error shape across all failures
- **Clean Architecture** — routes → controllers → services → utils

---

## Tech Stack

| Package | Purpose |
|---|---|
| `express` | HTTP server & routing |
| `@distube/ytdl-core` | YouTube info extraction (maintained ytdl fork) |
| `dotenv` | Environment variable management |
| `cors` | Cross-Origin Resource Sharing |
| `helmet` | HTTP security headers |
| `morgan` | HTTP request logging |
| `express-validator` | Input validation & sanitization |
| `express-rate-limit` | Per-IP rate limiting |
| `compression` | Gzip response compression |
| `winston` | Structured application logging |

---

## Project Structure

```
youtube-downloader-api/
├── server.js                  # Entry point — starts HTTP server
├── src/
│   ├── app.js                 # Express app factory (middleware stack)
│   ├── config/
│   │   ├── index.js           # Centralised config (reads .env)
│   │   └── constants.js       # App-wide constants (quality labels, error codes)
│   ├── controllers/
│   │   └── youtube.controller.js  # HTTP layer — parse req, call service, send res
│   ├── middlewares/
│   │   ├── errorHandler.js    # Global Express error handler (4-param)
│   │   ├── notFound.js        # 404 catch-all
│   │   └── validateRequest.js # express-validator rule sets
│   ├── routes/
│   │   ├── index.js           # Root router (/api/health + mounts sub-routers)
│   │   └── youtube.routes.js  # /api/youtube/* routes
│   ├── services/
│   │   └── youtube.service.js # Business logic — ytdl-core, format processing
│   └── utils/
│       ├── AppError.js        # Custom operational error class
│       ├── formatters.js      # Duration, filesize, container helpers
│       ├── logger.js          # Winston logger instance
│       ├── response.js        # sendSuccess / sendError helpers
│       └── youtubeValidator.js # URL regex, ID extraction, normalisation
├── logs/                      # Log files (production only, git-ignored)
├── .env.example               # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0

### Installation

```bash
# 1. Clone / extract the project
cd youtube-downloader-api

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Edit .env with your preferred values

# 4. Start (development — auto-restart with nodemon)
npm run dev

# 4b. Start (production)
npm start
```

The server will start at `http://localhost:3000` by default.

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` or `production` |
| `PORT` | `3000` | HTTP server port |
| `HOST` | `0.0.0.0` | Bind address |
| `CORS_ORIGIN` | `*` | Allowed origins (comma-separated or `*`) |
| `YOUTUBE_REQUEST_TIMEOUT` | `30000` | ytdl request timeout in ms |
| `YOUTUBE_MAX_RETRIES` | `3` | Retry attempts for failed requests |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window per IP |
| `LOG_LEVEL` | `debug` | `error` \| `warn` \| `info` \| `http` \| `debug` |

---

## API Reference

### Base URL

```
http://localhost:3000/api
```

All responses are JSON and follow the [Response Format](#response-format) below.

---

### 1. GET /api/health

Simple health check — no external calls.

**Response 200**
```json
{
  "status": "success",
  "message": "YouTube Downloader API is healthy.",
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "environment": "development",
    "uptime": 42.3
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. POST /api/youtube/download

Fetch video metadata and all available download formats.

**Request**

```
POST /api/youtube/download
Content-Type: application/json
```

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "720p"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | ✅ | Any valid YouTube URL |
| `quality` | string | ❌ | Filter recommended formats: `2160p` `1440p` `1080p` `720p` `480p` `360p` `240p` `144p` |

**Supported URL formats**
```
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://youtube.com/shorts/VIDEO_ID
https://www.youtube.com/embed/VIDEO_ID
https://m.youtube.com/watch?v=VIDEO_ID
```

**Response 200**

```json
{
  "status": "success",
  "message": "Video information retrieved successfully.",
  "data": {
    "video": {
      "videoId": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
      "duration": {
        "seconds": 213,
        "formatted": "03:33"
      },
      "thumbnail": {
        "low": "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
        "medium": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        "high": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        "all": [...]
      },
      "channel": {
        "name": "Rick Astley",
        "id": "UCuAXFkgsw1L7xaCfnd5JJOw",
        "url": "https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw",
        "verified": true
      },
      "statistics": {
        "viewCount": 1500000000,
        "viewCountFormatted": "1,500,000,000",
        "isLiveContent": false
      },
      "meta": {
        "uploadDate": "2009-10-25",
        "category": "Music",
        "isPrivate": false,
        "ageRestricted": false
      }
    },
    "formats": {
      "recommended": [
        {
          "itag": 22,
          "mimeType": "video/mp4",
          "container": "mp4",
          "quality": "720p",
          "qualityLabel": "HD",
          "width": 1280,
          "height": 720,
          "fps": 30,
          "hasVideo": true,
          "hasAudio": true,
          "fileSize": "45.23 MB",
          "fileSizeBytes": 47448064,
          "url": "https://..."
        }
      ],
      "combined": [...],
      "videoOnly": [...],
      "audioOnly": [...],
      "availableQualities": ["1080p", "720p", "360p", "240p", "144p"],
      "summary": {
        "totalCombined": 4,
        "totalVideoOnly": 12,
        "totalAudioOnly": 6,
        "highestQualityAvailable": "1080p"
      }
    },
    "meta": {
      "fetchedAt": "2024-01-01T00:00:00.000Z",
      "sourceUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "totalFormatsAvailable": 22
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### 3. GET /api/youtube/status

Returns service info, supported resolutions, uptime, and endpoint documentation.

**Response 200**
```json
{
  "status": "success",
  "message": "Service is operational.",
  "data": {
    "service": "YouTube Downloader API",
    "version": "1.0.0",
    "status": "operational",
    "uptime": { "seconds": 120, "formatted": "2m 0s" },
    "supportedQualities": ["2160p","1440p","1080p","720p","480p","360p","240p","144p"],
    "endpoints": { ... },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Response Format

Every response (success or error) uses this envelope:

**Success**
```json
{
  "status": "success",
  "message": "Human-readable success message",
  "data": { ... },
  "timestamp": "ISO 8601"
}
```

**Error**
```json
{
  "status": "error",
  "message": "Human-readable error description",
  "errorCode": "MACHINE_READABLE_CODE",
  "errors": [ { "field": "url", "message": "..." } ],
  "timestamp": "ISO 8601"
}
```

---

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body failed validation |
| `INVALID_URL` | 400 | URL is not a recognized YouTube URL |
| `VIDEO_NOT_FOUND` | 404 | Video ID does not exist |
| `VIDEO_UNAVAILABLE` | 404 | Video has been removed or is unavailable |
| `PRIVATE_VIDEO` | 403 | Video is private |
| `AGE_RESTRICTED` | 403 | Video requires age verification |
| `LIVE_STREAM` | 422 | Live streams are not supported |
| `RATE_LIMITED` | 429 | Too many requests from this IP |
| `TIMEOUT` | 504 | YouTube request timed out |
| `NOT_FOUND` | 404 | API endpoint does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## License

MIT
