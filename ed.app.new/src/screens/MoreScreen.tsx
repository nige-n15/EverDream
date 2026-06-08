import { Palette, Brain, Camera, Watch, Shield, Award, Eye, ChevronRight } from 'lucide-react';

interface MoreScreenProps {
  isPearl: boolean;
  setSkin: (skin: string) => void;
  navigate: (screen: string) => void;
}

export function MoreScreen({ isPearl, setSkin, navigate }: MoreScreenProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-medium text-ink">More</h2>
        <p className="text-sm text-muted mt-1">
          Sleep sync, keepsakes, milestones, and your data choices.
        </p>
      </div>

      {/* Appearance */}
      <div className={`rounded-2xl border overflow-hidden ${isPearl ? 'border-[var(--glass-border)] bg-[var(--glass-bg)]' : 'border-line bg-cream'}`}>
        <div className={`px-4 py-3 border-b ${isPearl ? 'border-[var(--glass-border)]' : 'border-line'}`}>
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium">Appearance</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full border ${isPearl ? 'bg-[var(--aqua-light)]/20 border-[var(--glass-border)]' : 'bg-parchment border-line'}`}>
              <Palette className="w-5 h-5 text-duskDeep" strokeWidth={1.75} />
            </span>
            <div className="flex-1 min-w-0">
              <span className="block font-medium text-ink">App Skin</span>
              <span className="block text-xs text-muted">
                {isPearl ? 'Pearl Light — iridescent, airy, luminous' : 'Paper — warm, parchment, grounded'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSkin(isPearl ? 'default' : 'pearl')}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                isPearl ? 'bg-[var(--aqua-deep)]' : 'bg-sage'
              }`}
              aria-label="Toggle skin"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  isPearl ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {isPearl && (
            <div className="mt-3 flex gap-2">
              {[
                { color: '#f7f5ff', label: 'Pearl' },
                { color: '#a8eddc', label: 'Aqua' },
                { color: '#c8b8ff', label: 'Lavender' },
                { color: '#c49a42', label: 'Gold' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border border-white/50" style={{ background: color }} />
                  <span className="text-[10px] text-muted">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className={`rounded-2xl border overflow-hidden ${isPearl ? 'border-[var(--glass-border)] bg-[var(--glass-bg)]' : 'border-line bg-cream'}`}>
        <div className={`px-4 py-3 border-b ${isPearl ? 'border-[var(--glass-border)]' : 'border-line'}`}>
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium">Features</h3>
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          {[
            { label: 'Insights', sub: 'Patterns & correlations', screen: 'dashboard', icon: Brain },
            { label: 'Import journal photos', sub: 'OCR from pictures', screen: 'import-photos', icon: Camera },
            { label: 'Sleep & wearables', sub: 'Sessions and sync', screen: 'wearables', icon: Watch },
            { label: 'Keepsakes', sub: 'Images & provenance', screen: 'assets', icon: Shield },
            { label: 'Achievements', sub: 'Small wins', screen: 'achievements', icon: Award },
          ].map(({ label, sub, screen, icon: Icon }) => (
            <button
              key={screen}
              type="button"
              onClick={() => navigate(screen)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${isPearl ? 'hover:bg-white/60' : 'hover:bg-parchment/80'}`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-full border ${isPearl ? 'bg-[var(--aqua-light)]/20 border-[var(--glass-border)]' : 'bg-parchment border-line'}`}>
                <Icon className="w-5 h-5 text-duskDeep" strokeWidth={1.75} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium text-ink">{label}</span>
                <span className="block text-xs text-muted">{sub}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted shrink-0" strokeWidth={1.75} />
            </button>
          ))}
        </div>
      </div>

      {/* Privacy & Data */}
      <div className={`rounded-2xl border overflow-hidden ${isPearl ? 'border-[var(--glass-border)] bg-[var(--glass-bg)]' : 'border-line bg-cream'}`}>
        <div className={`px-4 py-3 border-b ${isPearl ? 'border-[var(--glass-border)]' : 'border-line'}`}>
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium">Privacy & Data</h3>
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          {[
            { label: 'Privacy policy', sub: 'Your rights & controls', screen: 'privacy', icon: Eye },
          ].map(({ label, sub, screen, icon: Icon }) => (
            <button
              key={screen}
              type="button"
              onClick={() => navigate(screen)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${isPearl ? 'hover:bg-white/60' : 'hover:bg-parchment/80'}`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-full border ${isPearl ? 'bg-[var(--aqua-light)]/20 border-[var(--glass-border)]' : 'bg-parchment border-line'}`}>
                <Icon className="w-5 h-5 text-duskDeep" strokeWidth={1.75} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium text-ink">{label}</span>
                <span className="block text-xs text-muted">{sub}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted shrink-0" strokeWidth={1.75} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
