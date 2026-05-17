import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useDreamStore } from "../store/useDreamStore";
import { everdreamTheme } from "../theme/everdreamTheme";

const palette = everdreamTheme.colors;

// Simple calendar component - in a real app you'd use a proper calendar library
function DreamCalendar({ dreams }: { dreams: any[] }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Group dreams by date
  const dreamsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    dreams.forEach((dream) => {
      const date = new Date(dream.timestamp).toDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(dream);
    });
    return grouped;
  }, [dreams]);

  const getEmojiForDream = (dream: any) => {
    // Simple emoji mapping based on themes
    const theme = dream.themes?.[0]?.toLowerCase();
    if (theme?.includes("water")) return "🌊";
    if (theme?.includes("flight") || theme?.includes("fly")) return "🦅";
    if (theme?.includes("home") || theme?.includes("house")) return "🏠";
    if (theme?.includes("memory")) return "🧠";
    return "💭"; // Default dream emoji
  };

  const renderCalendarDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toDateString();
    const dayDreams = dreamsByDate[dateString] || [];

    return (
      <View key={day} style={styles.calendarDay}>
        <Text style={styles.dayNumber}>{day}</Text>
        {dayDreams.length > 0 && (
          <View style={styles.dreamIndicator}>
            <Text style={styles.dreamEmoji}>
              {dayDreams.length === 1
                ? getEmojiForDream(dayDreams[0])
                : `${dayDreams.length}💭`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.calendarContainer}>
      <Text style={styles.monthTitle}>
        {new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}
      </Text>

      <View style={styles.weekdays}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <Text key={day} style={styles.weekday}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <View key={`empty-${i}`} style={styles.calendarDay} />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }, (_, i) => renderCalendarDay(i + 1))}
      </View>
    </View>
  );
}

function PatternInsights({ dreams }: { dreams: any[] }) {
  const insights = useMemo(() => {
    if (dreams.length < 3) {
      return ["Capture more dreams to see patterns!"];
    }

    const insights: string[] = [];

    // Theme frequency analysis
    const themeCounts: Record<string, number> = {};
    dreams.forEach((dream) => {
      dream.themes?.forEach((theme: string) => {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });
    });

    const topThemes = Object.entries(themeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topThemes.length > 0) {
      insights.push(`You often dream about ${topThemes[0][0]} (${topThemes[0][1]} times)`);
    }

    // Emotional patterns
    const avgValence = dreams.reduce((sum, dream) => sum + (dream.valence || 0), 0) / dreams.length;
    if (avgValence > 2) {
      insights.push("Your dreams tend to have positive emotional tones");
    } else if (avgValence < -2) {
      insights.push("Your dreams often explore challenging emotions");
    }

    return insights.length > 0 ? insights : ["Keep capturing dreams to discover more patterns!"];
  }, [dreams]);

  return (
    <View style={styles.insightsContainer}>
      <Text style={styles.sectionTitle}>Pattern Insights</Text>
      {insights.map((insight, index) => (
        <View key={index} style={styles.insightCard}>
          <Text style={styles.insightText}>💡 {insight}</Text>
        </View>
      ))}
    </View>
  );
}

export function LongitudinalScreen() {
  const { dreams } = useDreamStore(useShallow((state) => ({
    dreams: state.dreams,
  })));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBand}>
        <Text style={styles.eyebrow}>EVERDREAM</Text>
        <Text style={styles.title}>Your Dream Journey</Text>
        <Text style={styles.subtitle}>
          Explore patterns and memories across your dream experiences
        </Text>
      </View>

      <DreamCalendar dreams={dreams} />

      <PatternInsights dreams={dreams} />

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Dream Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{dreams.length}</Text>
            <Text style={styles.statLabel}>Total Dreams</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {dreams.length > 0
                ? Math.round(dreams.reduce((sum, dream) => sum + (dream.themes?.length || 0), 0) / dreams.length)
                : 0}
            </Text>
            <Text style={styles.statLabel}>Avg Themes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {dreams.length > 0
                ? new Set(dreams.flatMap((dream) => dream.themes || [])).size
                : 0}
            </Text>
            <Text style={styles.statLabel}>Unique Themes</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 24,
  },
  headerBand: {
    marginBottom: 32,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.accent,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: palette.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: palette.muted,
    lineHeight: 24,
  },
  calendarContainer: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: palette.ink,
    textAlign: "center",
    marginBottom: 16,
  },
  weekdays: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekday: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: palette.muted,
    textAlign: "center",
    textTransform: "uppercase",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%", // 100% / 7 days
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayNumber: {
    fontSize: 16,
    color: palette.ink,
  },
  dreamIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
  },
  dreamEmoji: {
    fontSize: 12,
  },
  insightsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: palette.ink,
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: palette.panel,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 16,
    color: palette.ink,
    lineHeight: 24,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.surface,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: palette.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: palette.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});