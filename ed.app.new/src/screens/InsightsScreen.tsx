import { Sparkles, Activity, Heart, Brain, Moon } from 'lucide-react';

interface InsightData {
  totalDreams: number;
  currentStreak: number;
  mostCommonCategory?: [string, number];
  avgRarity: string;
  topThemes: [string, number][];
  avgSleepQuality: number;
  avgREMTime: number;
  moodTimeline?: { date: string; emotion: string; quality: number }[];
}

interface InsightsScreenProps {
  insights: InsightData | null;
  correlations: string[] | null;
  EmptyState: React.ComponentType<{ icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; message: string }>;
  InsightCard: React.ComponentType<{ title: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; items: { label: string; value: string | number; badge?: boolean }[] }>;
}

export function InsightsScreen({
  insights,
  correlations,
  EmptyState,
  InsightCard,
}: InsightsScreenProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl font-medium text-ink">Your Dream Patterns</h2>
      {insights ? (
        <>
          <InsightCard
            title="Dream Overview"
            icon={Sparkles}
            items={[
              { label: 'Total Dreams', value: insights.totalDreams },
              { label: 'Current Streak', value: `${insights.currentStreak} days` },
              { label: 'Most Common Type', value: insights.mostCommonCategory?.[0] || 'N/A', badge: true },
              { label: 'Avg Rarity Score', value: insights.avgRarity }
            ]}
          />

          {/* Sleep-Dream Correlations */}
          {correlations && (
            <div className="rounded-2xl border border-line bg-cream p-4 shadow-paper">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-ink">
                <Activity className="w-5 h-5 text-sage" strokeWidth={1.5} />
                Sleep-Dream Correlations
              </h3>
              <div className="space-y-2 text-sm">
                {correlations.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-sage">•</span>
                    <span className="text-muted">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.moodTimeline && insights.moodTimeline.length > 0 && (
            <div className="rounded-2xl border border-line bg-cream p-4 shadow-paper">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-ink">
                <Heart className="w-5 h-5 text-duskDeep" strokeWidth={1.5} />
                Emotional Timeline (Last 7 Days)
              </h3>
              <div className="space-y-2">
                {insights.moodTimeline.map((day, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="text-xs text-muted w-16">{day.date}</div>
                    <div className="flex-1 bg-parchment border border-line rounded-full h-6 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-sage/80 to-sageDark/80 h-full rounded-full flex items-center justify-center text-xs text-cream"
                        style={{ width: `${day.quality}%` }}
                      >
                        {day.quality}%
                      </div>
                    </div>
                    <span className="text-sm text-muted">{day.emotion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-line bg-cream p-4 shadow-paper">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-ink">
              <Brain className="w-5 h-5 text-duskDeep" strokeWidth={1.5} />
              Recurring Themes
            </h3>
            <div className="flex flex-wrap gap-2">
              {insights.topThemes.map(([theme, count]) => {
                const size = Math.min(count * 4 + 12, 24);
                return (
                  <span 
                    key={theme}
                    className="bg-parchment border border-line px-3 py-1 rounded-full capitalize text-ink"
                    style={{ fontSize: `${size}px` }}
                  >
                    {theme}
                  </span>
                );
              })}
            </div>
          </div>

          <InsightCard
            title="Sleep Metrics"
            icon={Moon}
            items={[
              { label: 'Avg Sleep Quality', value: `${insights.avgSleepQuality}%` },
              { label: 'Avg REM Sleep', value: `${insights.avgREMTime} min` }
            ]}
          />
        </>
      ) : (
        <EmptyState icon={Sparkles} message="Record more dreams to see insights" />
      )}
    </div>
  );
}
