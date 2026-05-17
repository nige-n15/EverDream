import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useDreamStore } from "../src/store/useDreamStore";

export default function RootLayout() {
  const hydrateLocal = useDreamStore((state) => state.hydrateLocal);

  useEffect(() => {
    // Hydrate Zustand store from local storage on app start
    const hydrate = async () => {
      try {
        await hydrateLocal();
      } catch (error) {
        console.error("Failed to hydrate store:", error);
      }
    };

    hydrate();
  }, [hydrateLocal]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#e4d2b0", // panelStrong
          },
          headerTintColor: "#17211f", // ink
          headerTitleStyle: {
            fontWeight: "600",
          },
          contentStyle: {
            backgroundColor: "#f4efe6", // background
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Everdream",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="capture"
          options={{
            title: "Capture Dream",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="verify"
          options={{
            title: "Verify & Save",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="post-capture"
          options={{
            title: "Post Capture",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="longitudinal"
          options={{
            title: "Dream Calendar",
            presentation: "modal",
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4efe6",
  },
});