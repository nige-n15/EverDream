const narrativeInput = document.querySelector("#narrativeInput");
const energyMode = document.querySelector("#energyMode");
const generateButton = document.querySelector("#generateButton");
const mintButton = document.querySelector("#mintButton");
const projectionCard = document.querySelector("#projectionCard");
const projectionTone = document.querySelector("#projectionTone");
const projectionMotif = document.querySelector("#projectionMotif");
const projectionSummary = document.querySelector("#projectionSummary");
const visualMotif = document.querySelector("#visualMotif");
const signalRead = document.querySelector("#signalRead");
const resonanceSlider = document.querySelector("#resonanceSlider");
const resonanceValue = document.querySelector("#resonanceValue");
const xpValue = document.querySelector("#xpValue");
const complexityValue = document.querySelector("#complexityValue");
const integrationValue = document.querySelector("#integrationValue");
const valenceValue = document.querySelector("#valenceValue");
const multiplierValue = document.querySelector("#multiplierValue");
const proofHash = document.querySelector("#proofHash");
const ledgerList = document.querySelector("#ledgerList");

const sampleNarratives = {
  dream:
    "I was in a library built inside a greenhouse. Every shelf was dripping with rain, and when I opened one red book I heard my grandmother laughing from the next room.",
  creative:
    "I had an idea for a story about a city that only appears during commuter delays, where every missed train reveals a new district and people trade memories instead of money.",
  healing:
    "I kept seeing a cracked bowl repaired with glowing lines. Every time I touched it, I felt less ashamed of the parts of me that had broken."
};

const storedLedger = JSON.parse(localStorage.getItem("subjectivexp-ledger") || "[]");
const state = {
  projection: null,
  metrics: null,
  ledger: storedLedger
};

const themeKeywords = {
  water: ["water", "flood", "sea", "river", "rain"],
  light: ["light", "lantern", "sun", "glow", "bright"],
  movement: ["walk", "walking", "running", "train", "station", "journey"],
  memory: ["grandmother", "memory", "memories", "remember", "home"],
  healing: ["repair", "repaired", "healing", "whole", "forgive", "broken"],
  awe: ["map", "stars", "cosmic", "vast", "sacred"],
  creativity: ["story", "idea", "write", "create", "paint", "music"]
};

const emotionKeywords = {
  calm: ["warm", "still", "quiet", "soft", "safe"],
  awe: ["light", "map", "vast", "glow", "sacred"],
  tension: ["rush", "rushing", "flooded", "panic", "lost"],
  repair: ["repair", "repaired", "healing", "whole", "forgive", "mend"]
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function detectThemes(words) {
  return Object.entries(themeKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => words.includes(keyword)))
    .map(([theme]) => theme);
}

function pickTone(words) {
  const matches = Object.entries(emotionKeywords).map(([tone, keywords]) => ({
    tone,
    count: keywords.filter((keyword) => words.includes(keyword)).length
  }));

  matches.sort((a, b) => b.count - a.count);
  return matches[0].count > 0 ? matches[0].tone : "reflective";
}

function createSummary(text, themes, tone) {
  const base = text.trim().split(/[.!?]/)[0];
  const themeLine = themes.length ? ` motifs of ${themes.join(", ")}` : " subtle symbolic patterns";

  const tonePrefix = {
    calm: "This feels like a quiet act of orientation, with",
    awe: "This reads like a threshold moment, full of",
    tension: "This holds urgency, but also a search for order through",
    repair: "This carries healing energy through",
    reflective: "This suggests an unresolved but meaningful state shaped by"
  };

  return `${tonePrefix[tone]}${themeLine}. Core image: "${base.trim()}."`;
}

function generateProjection(text) {
  const words = normalizeWords(text);
  const themes = detectThemes(words);
  const tone = pickTone(words);

  const motifMap = {
    calm: "steady warmth",
    awe: "expanding horizon",
    tension: "charged transition",
    repair: "visible repair",
    reflective: "symbolic drift"
  };

  return {
    tone,
    themes,
    summary: createSummary(text, themes, tone),
    motif: motifMap[tone],
    signal:
      themes.length >= 3
        ? "High narrative coherence"
        : themes.length === 2
          ? "Medium symbolic density"
          : "Early pattern emerging"
  };
}

function calculateMetrics(text, resonance, mode) {
  const words = normalizeWords(text);
  const uniqueWords = new Set(words);
  const themes = detectThemes(words);
  const connectors = words.filter((word) =>
    ["because", "when", "while", "then", "so", "but", "and"].includes(word)
  ).length;
  const sensoryHits = words.filter((word) =>
    ["warm", "bright", "cold", "sound", "laughing", "glow", "red"].includes(word)
  ).length;
  const positiveHits = words.filter((word) =>
    ["warm", "glow", "healing", "safe", "whole", "light"].includes(word)
  ).length;
  const negativeHits = words.filter((word) =>
    ["lost", "panic", "dark", "broken", "flooded"].includes(word)
  ).length;

  const rawComplexity = clamp(
    0.25 + words.length / 140 + uniqueWords.size / 240 + sensoryHits * 0.03,
    0.1,
    1
  );
  const semanticIntegration = clamp(
    0.2 + themes.length * 0.12 + connectors * 0.03,
    0.1,
    1
  );
  const valence = clamp(
    0.45 + positiveHits * 0.05 - negativeHits * 0.03,
    0.2,
    1
  );

  const multiplierMap = {
    standard: 1,
    renewable: 1.25,
    experimental: 1.5
  };

  const multiplier = multiplierMap[mode];
  const xp = rawComplexity * resonance * semanticIntegration * valence * multiplier * 100;

  return {
    xp,
    rawComplexity,
    semanticIntegration,
    valence,
    multiplier
  };
}

function hashString(input) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return `xp_${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function renderProjection() {
  if (!state.projection) {
    return;
  }

  projectionCard.classList.remove("hidden");
  projectionTone.textContent = state.projection.tone;
  projectionMotif.textContent = state.projection.themes.length
    ? state.projection.themes.join(" / ")
    : "emerging motifs";
  projectionSummary.textContent = state.projection.summary;
  visualMotif.textContent = state.projection.motif;
  signalRead.textContent = state.projection.signal;
}

function renderMetrics() {
  if (!state.metrics) {
    return;
  }

  xpValue.textContent = state.metrics.xp.toFixed(2);
  complexityValue.textContent = state.metrics.rawComplexity.toFixed(2);
  integrationValue.textContent = state.metrics.semanticIntegration.toFixed(2);
  valenceValue.textContent = state.metrics.valence.toFixed(2);
  multiplierValue.textContent = `${state.metrics.multiplier.toFixed(2)}x`;
}

function renderLedger() {
  if (!state.ledger.length) {
    ledgerList.innerHTML = '<li class="ledger-empty">No sessions minted yet.</li>';
    return;
  }

  ledgerList.innerHTML = state.ledger
    .slice()
    .reverse()
    .map(
      (entry) => `
        <li>
          <div>
            <strong>${entry.title}</strong>
            <p>${entry.summary}</p>
            <div class="ledger-meta">${entry.date} · ${entry.mode}</div>
          </div>
          <strong>${entry.xp} XP</strong>
        </li>
      `
    )
    .join("");
}

function recalculateLiveMetrics() {
  const text = narrativeInput.value.trim();

  if (!text) {
    return;
  }

  const resonance = Number(resonanceSlider.value) / 100;
  state.metrics = calculateMetrics(text, resonance, energyMode.value);
  renderMetrics();
}

document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    narrativeInput.value = sampleNarratives[button.dataset.sample];
    recalculateLiveMetrics();
  });
});

generateButton.addEventListener("click", () => {
  const text = narrativeInput.value.trim();

  if (!text) {
    narrativeInput.focus();
    return;
  }

  generateButton.textContent = "Projecting...";
  generateButton.disabled = true;

  window.setTimeout(() => {
    state.projection = generateProjection(text);
    state.metrics = calculateMetrics(text, Number(resonanceSlider.value) / 100, energyMode.value);
    renderProjection();
    renderMetrics();
    proofHash.textContent = "pending";
    generateButton.textContent = "Generate Projection";
    generateButton.disabled = false;
  }, 420);
});

resonanceSlider.addEventListener("input", () => {
  resonanceValue.textContent = `${resonanceSlider.value}%`;
  recalculateLiveMetrics();
});

energyMode.addEventListener("change", recalculateLiveMetrics);

mintButton.addEventListener("click", () => {
  const text = narrativeInput.value.trim();

  if (!text || !state.projection) {
    return;
  }

  state.metrics = calculateMetrics(text, Number(resonanceSlider.value) / 100, energyMode.value);

  const entry = {
    title: state.projection.tone.charAt(0).toUpperCase() + state.projection.tone.slice(1),
    summary: state.projection.summary,
    xp: state.metrics.xp.toFixed(2),
    mode: energyMode.options[energyMode.selectedIndex].text,
    date: new Date().toLocaleString(),
    hash: hashString(`${text}-${state.metrics.xp}-${Date.now()}`)
  };

  proofHash.textContent = entry.hash;
  state.ledger.push(entry);
  localStorage.setItem("subjectivexp-ledger", JSON.stringify(state.ledger));
  renderMetrics();
  renderLedger();
});

renderLedger();
recalculateLiveMetrics();
