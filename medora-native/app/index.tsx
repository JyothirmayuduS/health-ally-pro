import { Redirect } from "expo-router";

// Entry point: redirect straight to dashboard
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
