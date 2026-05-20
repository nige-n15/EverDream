import React, { useState } from 'react';
import { Card, Badge } from '../ui';

interface SleepArticle {
  id: string;
  title: string;
  summary: string;
  readTime: string;
  category: string;
  content: string;
}

const SLEEP_ARTICLES: SleepArticle[] = [
  {
    id: 'sleep-hygiene',
    title: 'Sleep Hygiene: The Complete Guide',
    summary: 'The habits and practices that help you get consistent, quality sleep. Good sleep hygiene can improve sleep quality by 40-60%.',
    readTime: '8 min',
    category: 'Basics',
    content: `## Key Facts
- Adults need 7-9 hours of sleep per night
- It takes 1-2 weeks to see improvements from sleep hygiene changes
- Your bedroom temperature should be 60-67°F (15-19°C)
- Blue light from screens suppresses melatonin production by up to 50%
- Caffeine has a half-life of 5-6 hours — avoid it after 2pm

## The Perfect Bedtime Routine

**T-90 minutes:**
- Stop eating heavy meals
- Dim all lights in your house
- Put phones/laptops in another room

**T-60 minutes:**
- Take a warm bath or shower
- Do light stretching or yoga
- Write in your dream journal

**T-30 minutes:**
- Read a physical book (not a screen)
- Practice deep breathing (4-7-8 technique)
- Set bedroom temperature to 65°F (18°C)

## The 10-3-2-1-0 Rule
- **10** hours before bed: No more caffeine
- **3** hours before bed: No more food or alcohol
- **2** hours before bed: No more work
- **1** hour before bed: No more screens
- **0**: Number of times you hit snooze`,
  },
  {
    id: 'sleep-stages',
    title: 'Sleep Stages & Dream Science',
    summary: 'Understanding sleep stages is key to understanding why we dream and how dream journaling works.',
    readTime: '10 min',
    category: 'Science',
    content: `## The Sleep Cycle
Sleep occurs in 90-minute cycles, each containing four stages:

### Stage 1 (NREM 1) — Light Sleep (5-10 minutes)
- Transition from wakefulness to sleep
- Muscles relax, heart rate slows
- Easy to wake up

### Stage 2 (NREM 2) — Light Sleep (10-25 minutes)
- Body temperature drops
- Sleep spindles appear — important for memory consolidation
- Makes up about 50% of total sleep

### Stage 3 (NREM 3) — Deep Sleep (20-40 minutes)
- Critical for physical recovery and immune function
- Hardest stage to wake from
- Makes up about 15-25% of total sleep

### REM Sleep (10-60 minutes)
- Most vivid dreaming occurs here
- Important for emotional regulation and memory consolidation
- Body is temporarily paralyzed (atonia)

## Why We Dream
- **Memory Consolidation:** Brain replays and processes the day's experiences
- **Emotional Regulation:** REM sleep acts as overnight therapy
- **Creative Problem-Solving:** Novel connections form during REM

## Dream Recall Tips
1. Keep your dream journal by your bed
2. Don't move when you wake — lie still and replay the dream
3. Set an intention before sleep: "I will remember my dreams"
4. Write in present tense: "I am walking" not "I walked"`,
  },
  {
    id: 'sleep-disorders',
    title: 'Common Sleep Disorders',
    summary: 'Learn to recognize the signs of common sleep disorders and when to see a doctor.',
    readTime: '6 min',
    category: 'Health',
    content: `## Insomnia
Difficulty falling or staying asleep for 3+ weeks.
**Signs:** Taking >30 min to sleep, waking frequently, feeling unrefreshed
**Treatment:** CBT-I (Cognitive Behavioral Therapy for Insomnia) is the gold standard

## Sleep Apnea
Breathing repeatedly stops and starts during sleep.
**Signs:** Loud snoring, gasping during sleep, excessive daytime sleepiness
**Treatment:** CPAP machine, weight loss, positional therapy

## Restless Leg Syndrome
Uncomfortable sensations in legs with an urge to move them.
**Signs:** Worse at night, relieved by movement, disrupts sleep onset
**Treatment:** Iron supplements, medication, lifestyle changes

## Narcolepsy
Excessive daytime sleepiness with sudden sleep attacks.
**Signs:** Sudden muscle weakness (cataplexy), sleep paralysis, vivid hallucinations
**Treatment:** Medication, scheduled naps, lifestyle adjustments

## When to See a Doctor
- Snore loudly or gasp during sleep
- Can't fall asleep for more than 3 weeks
- Experience restless legs or limb movements
- Have excessive daytime sleepiness despite 7+ hours of sleep`,
  },
  {
    id: 'sleep-supplements',
    title: 'Sleep Supplements: What Actually Works',
    summary: 'An evidence-based look at supplements that may help you sleep better.',
    readTime: '7 min',
    category: 'Supplements',
    content: `## What Works

### Magnesium
- **Evidence:** Strong. Helps regulate melatonin and GABA receptors.
- **Dose:** 200-400mg before bed
- **Forms:** Glycinate and threonate are best absorbed
- **Side effects:** May cause loose stools at high doses

### Melatonin
- **Evidence:** Moderate. Best for circadian rhythm issues, not general insomnia.
- **Dose:** 0.5-3mg (lower is often better)
- **Timing:** 2-3 hours before bedtime
- **Best for:** Jet lag, shift work, delayed sleep phase

### L-Theanine
- **Evidence:** Moderate. Promotes relaxation without drowsiness.
- **Dose:** 100-400mg
- **Source:** Found naturally in green tea
- **Best for:** Anxiety-related sleep issues

### Glycine
- **Evidence:** Emerging. May improve sleep quality and next-day alertness.
- **Dose:** 3g before bed
- **Side effects:** Generally well tolerated

## What Doesn't Work (Despite Marketing)
- **Valerin:** Most studies show no significant benefit over placebo
- **CBD:** Limited evidence for sleep specifically
- **Tryptophan:** Food sources don't provide enough to be effective

## Important Notes
- Supplements are not regulated like medications
- Always consult your doctor before starting supplements
- Supplements work best combined with good sleep hygiene
- More is not always better — start with the lowest effective dose`,
  },
];

export default function SleepEducationPage() {
  const [selectedArticle, setSelectedArticle] = useState<SleepArticle | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const categories = ['all', ...new Set(SLEEP_ARTICLES.map(a => a.category))];
  const filtered = filter === 'all' ? SLEEP_ARTICLES : SLEEP_ARTICLES.filter(a => a.category === filter);

  if (selectedArticle) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => setSelectedArticle(null)}
          style={{
            background: 'none', border: 'none', color: '#5ec4a8',
            cursor: 'pointer', fontSize: '0.8rem', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          ← Back to Sleep Education
        </button>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '2rem', color: '#1a1a2e', marginBottom: '8px',
        }}>
          {selectedArticle.title}
        </h1>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <Badge variant="info">{selectedArticle.category}</Badge>
          <span style={{ fontSize: '0.75rem', color: '#9b96b0' }}>
            📖 {selectedArticle.readTime} read
          </span>
        </div>
        <div style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '0.9rem', lineHeight: 1.8, color: '#4a4860',
          whiteSpace: 'pre-wrap',
        }}>
          {selectedArticle.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '2rem', color: '#1a1a2e', marginBottom: '8px',
        }}>
          😴 Sleep Education
        </h1>
        <p style={{ color: '#9b96b0', fontSize: '0.9rem' }}>
          Evidence-based guides to better sleep, dream science, and wellness.
        </p>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: 'none',
              background: filter === cat ? '#5ec4a8' : 'rgba(168,237,220,0.15)',
              color: filter === cat ? '#fff' : '#5ec4a8',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 180ms ease-out',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Article Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
      }}>
        {filtered.map(article => (
          <Card
            key={article.id}
            hover
            onClick={() => setSelectedArticle(article)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <Badge variant="info">{article.category}</Badge>
              <span style={{ fontSize: '0.65rem', color: '#9b96b0' }}>📖 {article.readTime}</span>
            </div>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.1rem', color: '#1a1a2e', marginBottom: '8px',
            }}>
              {article.title}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#9b96b0', lineHeight: 1.6 }}>
              {article.summary}
            </p>
            <div style={{
              marginTop: '16px',
              fontSize: '0.75rem',
              color: '#5ec4a8',
              fontWeight: 600,
            }}>
              Read more →
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
