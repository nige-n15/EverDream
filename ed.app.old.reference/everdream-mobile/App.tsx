import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { AppShell } from "./src/components/AppShell";
import { WebDesignPreview } from "./src/components/WebDesignPreview";

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      {Platform.OS === "web" ? <WebDesignPreview /> : <AppShell />}
    </>
  );
}
