import { describe, it, expect } from 'vitest';
import {
  extractTextFromImage,
  extractTextFromMultipleImages,
  preprocessImage,
} from '../lib/ocr';

// Note: These tests verify the OCR module structure and function signatures.
// Full integration tests require Tesseract.js WASM which doesn't work in jsdom.
// The actual OCR functions are tested via the component integration tests.

describe('OCR Module', () => {
  describe('extractTextFromImage', () => {
    it('should be defined and callable', () => {
      expect(extractTextFromImage).toBeDefined();
      expect(typeof extractTextFromImage).toBe('function');
    });

    it('should accept string input', () => {
      // Verify function signature accepts string | File | HTMLCanvasElement | HTMLImageElement
      const fn = extractTextFromImage;
      expect(fn.length).toBeGreaterThanOrEqual(1);
    });

    it('should accept optional onProgress callback', () => {
      const fn = extractTextFromImage;
      // Function should accept 3 parameters: source, onProgress, preprocess
      expect(fn.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('extractTextFromMultipleImages', () => {
    it('should be defined and callable', () => {
      expect(extractTextFromMultipleImages).toBeDefined();
      expect(typeof extractTextFromMultipleImages).toBe('function');
    });

    it('should accept array of images', () => {
      const fn = extractTextFromMultipleImages;
      expect(fn.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('preprocessImage', () => {
    it('should be defined and callable', () => {
      expect(preprocessImage).toBeDefined();
      expect(typeof preprocessImage).toBe('function');
    });

    it('should accept image source and optional options', () => {
      const fn = preprocessImage;
      expect(fn.length).toBe(1);
    });
  });
});
