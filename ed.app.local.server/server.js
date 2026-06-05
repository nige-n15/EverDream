/**
 * Local Stable Diffusion Server for EverDream App
 * 
 * This server acts as a proxy between the EverDream app and AUTOMATIC1111 WebUI.
 * It handles CORS, adds custom headers, and provides a clean API interface.
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const SD_WEBUI_URL = process.env.SD_WEBUI_URL || 'http://localhost:7860';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check if SD WebUI is accessible
    await axios.get(`${SD_WEBUI_URL}/sdapi/v1/cmd-flags`, { timeout: 5000 });
    
    res.json({
      status: 'ok',
      sdWebUI: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      sdWebUI: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Generate image endpoint
app.post('/api/generate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const {
      prompt,
      negative_prompt = 'blurry, low quality, distorted, ugly, watermark',
      width = parseInt(process.env.DEFAULT_WIDTH) || 1024,
      height = parseInt(process.env.DEFAULT_HEIGHT) || 1024,
      steps = parseInt(process.env.DEFAULT_STEPS) || 20,
      cfg_scale = parseFloat(process.env.DEFAULT_CFG_SCALE) || 7,
      seed = -1,
      sampler_name = 'Euler a',
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    console.log(`[Generate] Prompt: ${prompt.substring(0, 50)}...`);
    console.log(`[Generate] Settings: ${width}x${height}, ${steps} steps, CFG ${cfg_scale}`);

    // Call AUTOMATIC1111 API
    const response = await axios.post(
      `${SD_WEBUI_URL}/sdapi/v1/txt2img`,
      {
        prompt: prompt,
        negative_prompt: negative_prompt,
        steps: steps,
        width: width,
        height: height,
        cfg_scale: cfg_scale,
        seed: seed,
        sampler_name: sampler_name,
        n_iter: 1,
        batch_size: 1,
      },
      {
        timeout: 120000, // 2 minute timeout for generation
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Generate] Completed in ${generationTime}s`);

    if (!response.data.images || response.data.images.length === 0) {
      throw new Error('No images generated');
    }

    const base64Image = response.data.images[0];
    const info = response.data.info || {};
    
    res.json({
      success: true,
      imageUrl: `data:image/png;base64,${base64Image}`,
      metadata: {
        seed: info.seed || seed,
        model: info.sd_model_hash || 'unknown',
        prompt: prompt,
        negativePrompt: negative_prompt,
        width: width,
        height: height,
        steps: steps,
        cfgScale: cfg_scale,
        sampler: sampler_name,
        generationTime: parseFloat(generationTime),
      }
    });

  } catch (error) {
    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[Generate] Error after ${generationTime}s:`, error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      generationTime: parseFloat(generationTime),
      details: error.response?.data || null
    });
  }
});

// Get available models endpoint
app.get('/api/models', async (req, res) => {
  try {
    const response = await axios.get(`${SD_WEBUI_URL}/sdapi/v1/sd-models`);
    
    res.json({
      success: true,
      models: response.data.map(model => ({
        title: model.title,
        name: model.model_name,
        hash: model.sha256,
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`╔════════════════════════════════════════════════════╗`);
  console.log(`║   EverDream Local Generation Server               ║`);
  console.log(`╠════════════════════════════════════════════════════╣`);
  console.log(`║   Port:         http://localhost:${PORT}                ║`);
  console.log(`║   SD WebUI:     ${SD_WEBUI_URL.padEnd(30)}║`);
  console.log(`║   Status:       Running                            ║`);
  console.log(`╠════════════════════════════════════════════════════╣`);
  console.log(`║   Endpoints:                                       ║`);
  console.log(`║   GET  /health          - Health check             ║`);
  console.log(`║   POST /api/generate    - Generate image           ║`);
  console.log(`║   GET  /api/models      - List available models    ║`);
  console.log(`╚════════════════════════════════════════════════════╝`);
  console.log(``);
  console.log(`Configure your EverDream app with:`);
  console.log(`  VITE_LOCAL_GEN_URL=http://localhost:${PORT}`);
  console.log(`  VITE_ENABLE_LOCAL_GEN=true`);
});
