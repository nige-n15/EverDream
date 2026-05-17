# App Functionality: Feature Specs (MVP) — Chunk-Based Build

> **Build Strategy**: Ship one chunk at a time. Each chunk is independently testable and valuable.

---

## Chunk A: Sleep Encouragement & Education
**Goal**: Help users establish healthy sleep habits without coercion.

### Features
- [ ] Guided meditations/breathing library (5-10 min sessions)
  - Categories: Wind-down, anxiety relief, lucid prep
  - Offline download support
- [ ] Ambient soundscape player
  - Presets: Rain, forest, ocean, white noise, binaural beats
  - Timer + fade-out options
- [ ] Sleep timing reminders
  - User-set window + smart suggestions (based on sleep score history)
  - Gentle notification copy: "Consider winding down soon 🌙"
- [ ] Circadian education cards
  - Short, skimmable tips: blue light, room temperature, chronotypes
  - Sources: Foster protocols, sleep science research
  - Localized per user tradition (Buddhist, Celtic, Scientific, etc.)
- [ ] Ethical affiliate shelf (optional)
  - OTC sleep aids that encourage dreaming: melatonin, L-theanine, ashwagandha
  - Clear disclaimer: "Not medical advice; consult your doctor"
  - Revenue share to fund open development

### Technical Specs
```typescript
interface SleepEducationCard {
  id: string;
  title: string;
  content: string;
  source: string;
  tradition?: 'buddhist' | 'celtic' | 'scientific' | 'general';
  readTimeSec: number;
}

interface AmbientSound {
  id: string;
  name: string;
  url: string; // CDN
  durationSec: number;
  tags: ['rain', 'calm', 'sleep'];
}