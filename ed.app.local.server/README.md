# Local Stable Diffusion Server for EverDream

This is a simple local server that wraps AUTOMATIC1111 or ComfyUI to provide a clean API for the EverDream app.

## Quick Start

### Prerequisites

- Node.js 18+
- AUTOMATIC1111 Stable Diffusion WebUI running locally

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start AUTOMATIC1111** (in another terminal):
   ```bash
   cd ~/stable-diffusion-webui
   webui-user.bat --api --cors-allow-origins=http://localhost:3001
   ```

3. **Start this server**:
   ```bash
   npm start
   ```

4. **Configure EverDream app**:
   Add to `.env`:
   ```env
   VITE_LOCAL_GEN_URL=http://localhost:3001
   VITE_ENABLE_LOCAL_GEN=true
   ```

## API Reference

### POST /api/generate

Generate an image from text.

**Request Body**:
```json
{
  "prompt": "A surreal dream with floating lanterns",
  "negative_prompt": "blurry, ugly, distorted",
  "width": 1024,
  "height": 1024,
  "steps": 20,
  "cfg_scale": 7,
  "seed": -1
}
```

**Response**:
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,iVBOR...",
  "metadata": {
    "seed": 42341,
    "model": "sd-v1-5",
    "generationTime": 5.2
  }
}
```

### GET /health

Check if the server is running.

**Response**:
```json
{
  "status": "ok",
  "sdWebUI": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Configuration

Create a `.env` file:

```env
# Port for this server
PORT=3001

# URL to AUTOMATIC1111 WebUI
SD_WEBUI_URL=http://localhost:7860

# Enable CORS for these origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Default generation settings
DEFAULT_WIDTH=1024
DEFAULT_HEIGHT=1024
DEFAULT_STEPS=20
DEFAULT_CFG_SCALE=7
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│  EverDream App  │ ───► │  Local Server (:3001)│ ───► │  A1111 WebUI     │
│                 │      │  (Express + CORS)    │      │  (:7860)         │
└─────────────────┘      └──────────────────────┘      └──────────────────┘
```

The server:
1. Receives requests from the EverDream app
2. Adds CORS headers for browser access
3. Forwards requests to A1111 WebUI
4. Returns formatted responses with metadata

## Troubleshooting

### "Connection refused" error

Make sure A1111 is running with `--api` flag:
```bash
webui-user.bat --api
```

### CORS errors in browser

Add your app's URL to CORS_ORIGINS:
```env
CORS_ORIGINS=http://localhost:5173
```

### Slow generation

- Reduce image size (512x512 instead of 1024x1024)
- Reduce steps (15-20 instead of 30+)
- Use a smaller model (SD 1.5 instead of SDXL)

## License

MIT
