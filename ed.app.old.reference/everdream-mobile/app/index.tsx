import { Redirect } from "expo-router";

export default function Index() {
  // Redirect to capture screen as the default
  return <Redirect href="/capture" />;
}