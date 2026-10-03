import "@/global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastProvider } from "@/components/ui";
import { INTER_FONTS, useFonts } from "@/fonts";
import { applyStoredTheme, ThemePreferenceProvider, useThemePreference } from "@/theme/preference";

// Module scope, on purpose: the saved theme has to be applied before anything is painted, and the
// splash screen must stay up until Inter is loaded, so no frame ever shows a fallback font.
applyStoredTheme();
SplashScreen.preventAutoHideAsync().catch(() => {});

/** The status bar follows the *resolved* theme: "system" means the phone decides, including at dusk. */
function ThemedStatusBar() {
  const { resolved } = useThemePreference();
  return <StatusBar style={resolved === "dark" ? "light" : "dark"} />;
}

/**
 * The root layout. Task 1.3 replaces the plain stack with the auth gate (the signed-out screens
 * versus the tabs); the providers around it — theme, toast, safe area, gestures — stay.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(INTER_FONTS);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemePreferenceProvider>
          <ThemedStatusBar />
          <ToastProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </ToastProvider>
        </ThemePreferenceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
