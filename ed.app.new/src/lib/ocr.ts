// OCR module — STUBBED for now
// tesseract.js was removed because it uses require() and doesn't work in browser.
// TODO: Reimplement as a Web Worker or backend service in a future feature.

export interface OcrResult {
  photoId: string;
  text: string;
  confidence: number;
}

export async function extractTextFromImage(
  _imageSource: string | File | HTMLCanvasElement | HTMLImageElement,
  _onProgress?: (progress: number) => void,
  _preprocess = true,
  _autoCorrectOrientation = false,
): Promise<OcrResult> {
  return { photoId: 'stub', text: '', confidence: 0 };
}

export async function extractTextFromMultipleImages(
  images: { id: string; source: string | File }[],
  _onPhotoProgress?: (photoId: string, progress: number) => void,
  _onPhotoComplete?: (photoId: string, result: OcrResult) => void,
): Promise<OcrResult[]> {
  return images.map((img) => ({ photoId: img.id, text: '', confidence: 0 }));
}

export function preprocessImage(
  _imageSource: string | File | HTMLImageElement,
  _options: Record<string, unknown> = {},
): Promise<HTMLCanvasElement> {
  return Promise.reject(new Error('OCR is currently disabled'));
}

export async function correctOrientation(
  _imageSource: string | File | HTMLCanvasElement | HTMLImageElement,
): Promise<HTMLCanvasElement | null> {
  return null;
}
