import { Stack } from "expo-router";
import { AIVerifyScreen as AIVerifyScreenComponent } from "../src/components/AIVerifyScreen";

export default function VerificationScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Verify & Save",
          headerShown: true,
        }}
      />
      <AIVerifyScreenComponent />
    </>
  );
}