# 2-Stage Dream Image Generation Process

## Overview

The EverDream app now uses a **simplified 2-stage approach** for generating dream visualization images. This makes the system more maintainable while still providing multiple fallback options.

```
┌─────────────────────────────────────────────────────────────┐
│                    STAGE 1: Cloud APIs                      │
│              (Automatic - No Setup Required)                │
├─────────────────────────────────────────────────────────────┤
│  1a. Puter.com AI API → FREE, simple                        │
│  1b. Supabase Edge Fn → FREE, CORS-safe                     │
│  1c. Pollinations.ai  → FREE, unlimited                     │
└─────────────────────────────────────────────────────────────┘
                            ↓ (if all fail)
┌─────────────────────────────────────────────────────────────┐
│              STAGE 2: Local Generation (Optional)           │
│         (Enable when you want full control & privacy)       │
├─────────────────────────────────────────────────────────────┤
│  2a. AUTOMATIC1111 WebUI → Run on your computer             │
│  2b. ComfyUI             → Workflow-based alternative       │
└─────────────────────────────────────────────────────────────┘
                            ↓ (if disabled or fails)
┌─────────────────────────────────────────────────────────────┐
│                    FALLBACK: SVG Placeholder                │
│                  (Always works, instant)                    │
└─────────────────────────────────────────────────────────────┘
```

## Why 2 Stages?

### Stage 1: Cloud APIs (Default)
- ✅ **Zero setup** - Works immediately
- ✅ **FREE** - No API keys required
- ✅ **Reliable** - Multiple fallback providers
- ✅ **Fast** - 10-20 second generation time

### Stage 2: Local Generation (Optional)
- ✅ **Full control** - Choose your own models
- ✅ **Privacy** - Images generated on your machine
- ✅ **Unlimited** - No rate limits
- ✅ **Cost-free** - After initial hardware investment
- ⚠️ **Requires setup** - Need to install Stable Diffusion
- ⚠️ **Hardware intensive** - Needs GPU with 8GB+ VRAM

---

## Quick Start (Stage 1 - Cloud APIs)

### Option A: Use Immediately (No Setup)

The app works out of the box! Just start creating dreams and images will be generated automatically using free cloud APIs.

```bash
# Start the development server
npm run dev

# Or build for production
npm run build
```

### Option B: Deploy Supabase Edge Function (Recommended)

For better reliability and CORS handling:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the generate-image function
supabase functions deploy generate-image
```

**Required `.env` variables:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Advanced Setup (Stage 2 - Local Generation)

### Prerequisites

- **GPU**: NVIDIA GPU with 8GB+ VRAM (RTX 3060 or better recommended)
- **Storage**: 20-50GB free space for models
- **RAM**: 16GB+ system RAM recommended
- **OS**: Windows 10/11, Linux, or macOS (Apple Silicon)

### Option A: AUTOMATIC1111 Stable Diffusion WebUI

This is the most popular and user-friendly option.

#### Installation Steps:

1. **Install Git** (if not already installed)
   ```bash
   # Windows: Download from https://git-scm.com/
   # macOS: xcode-select --install
   # Linux: sudo apt-get install git
   ```

2. **Clone the repository**
   ```bash
   cd ~
   git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
   cd stable-diffusion-webui
   ```

3. **Run the web UI**
   ```bash
   # Windows
   webui-user.bat
   
   # macOS/Linux
   ./webui.sh
   ```

4. **First launch** will download models (~10GB). Wait for completion.

5. **Enable API access** by editing `webui-user.bat` (Windows) or `webui.sh` (Linux/Mac):
   ```bash
   # Add this line:
   set COMMANDLINE_ARGS=--api
   ```

6. **Verify it's running** at `http://localhost:7860`

#### Configure App for Local Generation:

Add to your `.env` file:
```env
VITE_LOCAL_GEN_URL=http://localhost:7860
VITE_ENABLE_LOCAL_GEN=true
```

### Option B: ComfyUI

ComfyUI offers a node-based workflow interface.

#### Installation Steps:

1. **Clone the repository**
   ```bash
   cd ~
   git clone https://github.com/comfyanonymous/ComfyUI.git
   cd ComfyUI
   ```

2. **Install dependencies**
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   pip install -r requirements.txt
   ```

3. **Run ComfyUI**
   ```bash
   python main.py --listen
   ```

4. **Configure App for ComfyUI**:
   ```env
   VITE_LOCAL_GEN_URL=http://localhost:8188
   VITE_ENABLE_LOCAL_GEN=true
   ```

---

## How It Works in Code

### Frontend Service (`src/modules/sleep/dreamAssetGenerator.ts`)

```typescript
export async function generateDreamImage(prompt: string): Promise<DreamAsset> {
  // ========== STAGE 1: Cloud APIs ==========
  
  try {
    // First: Try Puter.com AI API (FREE, simple)
    return await generateWithPuter(prompt);
  } catch (puterError) {
    console.warn('Puter.com failed:', puterError);
  }

  try {
    // Second: Try Supabase Edge Function (handles CORS)
    return await generateWithEdgeFunction(prompt);
  } catch (edgeError) {
    console.warn('Edge function failed:', edgeError);
  }

  try {
    // Third: Direct Pollinations (may have CORS issues)
    return await generateWithPollinations(prompt);
  } catch (pollinationsError) {
    console.warn('Pollinations failed:', pollinationsError);
  }

  // ========== STAGE 2: Local Generation (Optional) ==========
  
  const enableLocal = import.meta.env.VITE_ENABLE_LOCAL_GEN === 'true';
  
  if (enableLocal) {
    try {
      return await generateWithLocalProvider(prompt);
    } catch (localError) {
      console.warn('Local provider failed:', localError);
    }
  }

  // ========== FALLBACK ==========
  
  // Final fallback: SVG placeholder
  return await generateFallbackImage(prompt);
}
```

### Local Provider Detection

The code automatically detects which local service you're running:

```typescript
// Auto-detect based on URL port
if (localUrl.includes('8188')) {
  provider = 'comfyui';
} else if (localUrl.includes('7860')) {
  provider = 'a1111';
}
```

### A1111 API Call Example

```typescript
const response = await fetch(`${baseUrl}/sdapi/v1/txt2img`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: enhancedPrompt,
    negative_prompt: 'blurry, low quality, distorted, ugly',
    steps: 20,
    width: 1024,
    height: 1024,
    cfg_scale: 7,
    sampler_name: 'Euler a',
  }),
});
```

---

## Troubleshooting

### Cloud APIs Not Working?

1. **Check browser console** for error messages
2. **Test Puter.com directly**:
   ```javascript
   fetch('https://api.puter.com/ai/txt2img', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ prompt: 'test' })
   }).then(r => r.json()).then(console.log);
   ```
3. **Verify Supabase connection**:
   ```javascript
   console.log(import.meta.env.VITE_SUPABASE_URL)
   ```

### Local Generation Not Working?

1. **Check if service is running**:
   ```bash
   curl http://localhost:7860/sdapi/v1/txt2img \
     -H "Content-Type: application/json" \
     -d '{"prompt":"test"}'
   ```

2. **Verify CORS settings** (A1111):
   - Add `--cors-allow-origins=http://localhost:5173` to COMMANDLINE_ARGS

3. **Check firewall** - Ensure localhost connections are allowed

4. **Verify .env configuration**:
   ```env
   VITE_LOCAL_GEN_URL=http://localhost:7860
   VITE_ENABLE_LOCAL_GEN=true
   ```

### Out of Disk Space?

Clean up node_modules:
```bash
# Remove expo node_modules (not needed for web app)
rm -rf expo/node_modules

# Clear npm cache
npm cache clean --force
```

---

## Performance Comparison

| Provider | Speed | Quality | Cost | Setup Required |
|----------|-------|---------|------|----------------|
| Puter.com | 10-20s | Good | FREE | ❌ No |
| Supabase + Pollinations | 10-20s | High | FREE | ⚠️ Minimal |
| Direct Pollinations | 10-20s | High | FREE | ❌ No |
| Local A1111 | 5-30s* | Excellent | FREE | ✅ Yes |
| Local ComfyUI | 5-30s* | Excellent | FREE | ✅ Yes |
| SVG Fallback | Instant | N/A | FREE | ❌ No |

*Depends on your GPU

---

## Cost Analysis

### Cloud APIs (Stage 1)
- **Monthly cost: $0**
- Unlimited generations via Pollinations.ai
- Suitable for: MVP, testing, personal use

### Local Generation (Stage 2)
- **Initial hardware cost**: $300-800 (GPU)
- **Electricity**: ~$0.05-0.10 per hour of generation
- **Ongoing cost: $0**
- Suitable for: Production, privacy-focused users, heavy usage

---

## Best Practices

1. **Start with cloud APIs** - No setup, works immediately
2. **Deploy Supabase Edge Function** - Better reliability
3. **Enable local generation later** - When you need more control
4. **Cache generated images** - Store URLs to avoid regenerating
5. **Show loading states** - Generation takes 10-30 seconds
6. **Use deterministic seeds** - Same prompt = same image

---

## Future Enhancements

- [ ] Add support for custom model selection (local)
- [ ] Batch generation for multiple dreams
- [ ] Image style presets (anime, realistic, artistic)
- [ ] Progress indicators during generation
- [ ] Image editing/regeneration features
- [ ] Integration with other AI services (Replicate, Fal AI)

---

## Summary

✅ **Two simple stages** - Cloud first, local optional  
✅ **Multiple fallbacks** - Always produces an image  
✅ **Zero cost default** - Free cloud APIs work great  
✅ **Upgrade path** - Easy to enable local generation later  
✅ **Production ready** - Handles errors gracefully  

Start with Stage 1 (cloud) and only enable Stage 2 (local) when you need it!
