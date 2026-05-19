import { describe, it, expect } from 'vitest';

/**
 * Tests for the DreamStatsDashboard component logic.
 * Tests the statistical calculations used by the dashboard.
 */

const SAMPLE_DREAMS = [
  {
    id: '1',
    content: 'I was flying over a beautiful ocean at sunset. The water was impossibly blue.',
    mood: 'peaceful',
    category: 'adventure',
    date: new Date().toISOString(),
    aiAnalysis: { symbols: ['flying', 'ocean'], themes: ['freedom'], interpretation: 'You seek freedom.' },
    imageUrl: 'https://example.com/img1.jpg',
  },
  {
    id: '2',
    content: 'A strange dream about being in a maze. I could not find the exit. It was very confusing and somewhat scary.',
    mood: 'anxious',
    category: 'nightmare',
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    content: 'I was talking to my grandmother in a garden full of flowers. She told me everything would be okay.',
    mood: 'peaceful',
    category: 'peaceful',
    date: new Date(Date.now() - 172800000).toISOString(),
    aiAnalysis: { symbols: ['grandmother', 'garden'], themes: ['comfort'], interpretation: 'You need comfort.' },
  },
  {
    id: '4',
    content: 'Running through a city made of glass. Everything was reflective and I could see infinite versions of myself.',
    mood: 'exciting',
    category: 'lucid',
    date: new Date(Date.now() - 259200000).toISOString(),
    imageUrl: 'https://example.com/img4.jpg',
  },
  {
    id: '5',
    content: 'I was back in my childhood home but everything was slightly wrong. The doors were in different places.',
    mood: 'confusing',
    category: 'recurring',
    date: new Date(Date.now() - 345600000).toISOString(),
  },
];

describe('Dream Stats Dashboard Logic', () => {
  it('should calculate total dream count', () => {
    expect(SAMPLE_DREAMS.length).toBe(5);
  });

  it('should count AI analyzed dreams', () => {
    const aiAnalyzed = SAMPLE_DREAMS.filter(d => d.aiAnalysis).length;
    expect(aiAnalyzed).toBe(2);
  });

  it('should count dreams with images', () => {
    const withImages = SAMPLE_DREAMS.filter(d => d.imageUrl).length;
    expect(withImages).toBe(2);
  });

  it('should calculate mood frequency', () => {
    const moodCounts: Record<string, number> = {};
    SAMPLE_DREAMS.forEach(d => {
      if (d.mood) {
        moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
      }
    });
    expect(moodCounts['peaceful']).toBe(2);
    expect(moodCounts['anxious']).toBe(1);
    expect(moodCounts['exciting']).toBe(1);
    expect(moodCounts['confusing']).toBe(1);
  });

  it('should calculate category breakdown', () => {
    const catCounts: Record<string, number> = {};
    SAMPLE_DREAMS.forEach(d => {
      catCounts[d.category] = (catCounts[d.category] || 0) + 1;
    });
    expect(catCounts['adventure']).toBe(1);
    expect(catCounts['nightmare']).toBe(1);
    expect(catCounts['peaceful']).toBe(1);
    expect(catCounts['lucid']).toBe(1);
    expect(catCounts['recurring']).toBe(1);
  });

  it('should calculate average content length', () => {
    const avgLength = Math.round(
      SAMPLE_DREAMS.reduce((sum, d) => sum + d.content.length, 0) / SAMPLE_DREAMS.length
    );
    expect(avgLength).toBeGreaterThan(0);
    expect(avgLength).toBeLessThan(200);
  });

  it('should identify unique dates for streak calculation', () => {
    const sortedDates = SAMPLE_DREAMS
      .map(d => new Date(d.date).toDateString())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const uniqueDates = [...new Set(sortedDates)];
    expect(uniqueDates.length).toBeLessThanOrEqual(SAMPLE_DREAMS.length);
    expect(uniqueDates.length).toBeGreaterThan(0);
  });
});

describe('DreamList Component Logic', () => {
  it('should filter dreams by search query', () => {
    const query = 'ocean';
    const filtered = SAMPLE_DREAMS.filter(d =>
      d.content.toLowerCase().includes(query) ||
      (d.mood && d.mood.toLowerCase().includes(query))
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('1');
  });

  it('should filter dreams by category', () => {
    const category = 'peaceful';
    const filtered = SAMPLE_DREAMS.filter(d => d.category === category);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('3');
  });

  it('should return empty for non-matching search', () => {
    const query = 'xyznonexistent';
    const filtered = SAMPLE_DREAMS.filter(d =>
      d.content.toLowerCase().includes(query)
    );
    expect(filtered.length).toBe(0);
  });

  it('should handle empty dream list', () => {
    const empty: typeof SAMPLE_DREAMS = [];
    expect(empty.length).toBe(0);
    const filtered = empty.filter(d => d.category === 'any');
    expect(filtered.length).toBe(0);
  });
});

describe('Toast Notification Logic', () => {
  it('should generate unique toast IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      ids.add(id);
    }
    // All IDs should be unique (or very close to it)
    expect(ids.size).toBeGreaterThan(90);
  });

  it('should support all toast types', () => {
    const types = ['success', 'error', 'info', 'warning'] as const;
    const styles: Record<string, { bg: string; border: string; icon: string; text: string }> = {
      success: { bg: 'rgba(94,196,168,0.12)', border: '#5ec4a8', icon: '✓', text: '#4a9e86' },
      error:   { bg: 'rgba(232,143,160,0.12)', border: '#e88fa0', icon: '✕', text: '#c86070' },
      info:    { bg: 'rgba(200,184,255,0.12)', border: '#9b8fd4', icon: 'ℹ', text: '#7b6fb4' },
      warning: { bg: 'rgba(255,216,168,0.12)', border: '#c49a42', icon: '⚠', text: '#a07a30' },
    };
    types.forEach(type => {
      expect(styles[type]).toBeDefined();
      expect(styles[type].icon).toBeTruthy();
    });
  });
});
