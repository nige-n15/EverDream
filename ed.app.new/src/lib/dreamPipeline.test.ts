import { describe, it, expect } from 'vitest';
import {
  runDreamPipeline,
  analyzeAndVisualize,
  transcribeAndAnalyze,
  type PipelineInput,
  type PipelineResult,
} from '../lib/dreamPipeline';

describe('Dream Pipeline', () => {
  describe('runDreamPipeline', () => {
    it('should be defined and callable', () => {
      expect(runDreamPipeline).toBeDefined();
      expect(typeof runDreamPipeline).toBe('function');
    });

    it('should accept PipelineInput', () => {
      const input: PipelineInput = { text: 'I was flying over mountains' };
      expect(input.text).toBe('I was flying over mountains');
    });

    it('should accept audio input', () => {
      const input: PipelineInput = { audioData: new Blob() };
      expect(input.audioData).toBeDefined();
    });

    it('should accept options', async () => {
      const input: PipelineInput = { text: 'Test dream' };
      const options = {
        skipTranscription: true,
        skipAnalysis: true,
        skipImage: true,
        skipParallax: true,
      };

      // Should not throw with all skips enabled (no API calls)
      const result = await runDreamPipeline(input, options);
      expect(result).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(result.steps.length).toBe(4);
    });

    it('should skip transcription when no audio data', async () => {
      const result = await runDreamPipeline(
        { text: 'Test dream text' },
        { skipAnalysis: true, skipImage: true, skipParallax: true }
      );

      const transcribeStep = result.steps.find(s => s.name === 'Transcription');
      expect(transcribeStep?.status).toBe('skipped');
    });

    it('should skip analysis when text is too short', async () => {
      const result = await runDreamPipeline(
        { text: 'Hi' },
        { skipImage: true, skipParallax: true }
      );

      const analyzeStep = result.steps.find(s => s.name === 'Dream Analysis');
      expect(analyzeStep?.status).toBe('skipped');
    });
  });

  describe('analyzeAndVisualize', () => {
    it('should be defined and callable', () => {
      expect(analyzeAndVisualize).toBeDefined();
      expect(typeof analyzeAndVisualize).toBe('function');
    });

    it('should skip transcription', async () => {
      const result = await analyzeAndVisualize('Test dream', undefined);
      const transcribeStep = result.steps.find(s => s.name === 'Transcription');
      expect(transcribeStep?.status).toBe('skipped');
    });
  });

  describe('transcribeAndAnalyze', () => {
    it('should be defined and callable', () => {
      expect(transcribeAndAnalyze).toBeDefined();
      expect(typeof transcribeAndAnalyze).toBe('function');
    });

    it('should skip image and parallax', async () => {
      const result = await transcribeAndAnalyze(new Blob(), undefined);
      const imageStep = result.steps.find(s => s.name === 'Image Generation');
      const parallaxStep = result.steps.find(s => s.name === 'Parallax Video');
      expect(imageStep?.status).toBe('skipped');
      expect(parallaxStep?.status).toBe('skipped');
    });
  });

  describe('PipelineResult type', () => {
    it('should have correct structure', () => {
      const result: PipelineResult = {
        transcription: null,
        analysis: null,
        image: null,
        parallaxVideoUrl: null,
        steps: [],
        totalDuration: 0,
      };

      expect(result.transcription).toBeNull();
      expect(result.analysis).toBeNull();
      expect(result.image).toBeNull();
      expect(result.parallaxVideoUrl).toBeNull();
      expect(result.steps).toEqual([]);
      expect(result.totalDuration).toBe(0);
    });
  });
});
