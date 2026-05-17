import { Stack } from "expo-router";
import { LongitudinalScreen as LongitudinalScreenComponent } from "../src/components/LongitudinalScreen";

export default function LongitudinalScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Dream Calendar",
          headerShown: true,
        }}
      />
      <LongitudinalScreenComponent />
    </>
  );
}