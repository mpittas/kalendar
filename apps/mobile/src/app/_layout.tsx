import "@/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

/**
 * The root layout. Task 1.2 brings the theme provider and the primitives, task 1.3 the auth gate
 * (the signed-out stack versus the tabs), so for now this is just the router.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
