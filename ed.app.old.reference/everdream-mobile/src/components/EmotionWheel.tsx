import { Pressable, StyleSheet, Text, View } from "react-native";
import { everdreamTheme } from "../theme/everdreamTheme";

interface EmotionWheelProps {
  emotions: string[];
  levels: Record<string, number>;
  selectedEmotion: string | null;
  onSelectEmotion: (emotion: string) => void;
}

const orbitPositions = [
  { top: 20, left: 108 },
  { top: 66, left: 198 },
  { top: 168, left: 198 },
  { top: 218, left: 108 },
  { top: 168, left: 20 },
  { top: 66, left: 20 },
  { top: 8, left: 64 },
  { top: 235, left: 64 },
];

export function EmotionWheel({
  emotions,
  levels,
  selectedEmotion,
  onSelectEmotion,
}: EmotionWheelProps) {
  const visibleEmotions = emotions.slice(0, orbitPositions.length);

  return (
    <View style={styles.root}>
      <View style={styles.wheelFrame}>
        <View style={styles.centerCore}>
          <Text style={styles.centerTitle}>Now</Text>
          <Text style={styles.centerSubtitle}>{selectedEmotion ?? "Pick a feeling"}</Text>
        </View>

        {visibleEmotions.map((emotion, index) => {
          const selected = emotion === selectedEmotion;
          const level = levels[emotion] ?? 0;
          const position = orbitPositions[index];

          return (
            <Pressable
              key={emotion}
              onPress={() => onSelectEmotion(emotion)}
              style={[
                styles.petals,
                {
                  top: position.top,
                  left: position.left,
                },
                selected ? styles.petalsSelected : null,
              ]}
            >
              <Text style={[styles.petalLabel, selected ? styles.petalLabelSelected : null]} numberOfLines={2}>
                {emotion}
              </Text>
              <Text style={[styles.petalLevel, selected ? styles.petalLabelSelected : null]}>{level}/5</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  wheelFrame: {
    width: 300,
    height: 300,
    position: "relative",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: "#fcfaf5",
  },
  centerCore: {
    position: "absolute",
    top: 108,
    left: 108,
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.panel,
  },
  centerTitle: {
    color: everdreamTheme.colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: "700",
  },
  centerSubtitle: {
    color: everdreamTheme.colors.ink,
    fontSize: 12,
    textAlign: "center",
    fontWeight: "700",
  },
  petals: {
    position: "absolute",
    width: 80,
    minHeight: 62,
    borderWidth: 1,
    borderColor: everdreamTheme.colors.line,
    backgroundColor: everdreamTheme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  petalsSelected: {
    backgroundColor: everdreamTheme.colors.berrySoft,
    borderColor: everdreamTheme.colors.berry,
  },
  petalLabel: {
    color: everdreamTheme.colors.ink,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
  },
  petalLabelSelected: {
    color: everdreamTheme.colors.berry,
  },
  petalLevel: {
    color: everdreamTheme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
});
