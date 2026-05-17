import { Stack } from "expo-router";
import { CaptureScreen as CaptureScreenComponent } from "../src/components/CaptureScreen";

export default function CaptureScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Capture Dream",
          headerShown: false,
        }}
      />
      <CaptureScreenComponent />
    </>
  );
}