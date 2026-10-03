import { SLOT_MINUTES, formatTime, mediumDate, nowMinutes, todayISO } from "@klndr/core";
import { RADII, SPACING, TABULAR_NUMBERS, THEMES, TYPE_SCALE } from "@klndr/tokens";
import { StyleSheet, Text, View, useColorScheme } from "react-native";

import { env } from "@/env";

/**
 * A placeholder home screen: it boots the app, and it shows that the build-time environment and the
 * shared packages reach the bundle — `@klndr/core` (the date, the clock and the slot length) and
 * `@klndr/tokens` (the theme and the type scale), both of which ship TypeScript source and so have
 * to be compiled by Metro. Task 1.2 replaces this with the design system, Phase 2 with the planner.
 */
export default function HomeScreen() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const { values } = THEMES[scheme];

  return (
    <View style={[styles.container, { backgroundColor: values.background }]}>
      <Text style={[styles.title, { color: values.foreground }]}>klndr</Text>
      <Text style={[styles.detail, { color: values["muted-foreground"] }]}>
        {mediumDate(todayISO())} · {formatTime(nowMinutes())}
      </Text>
      <Text style={[styles.detail, { color: values["muted-foreground"] }]}>
        {SLOT_MINUTES}-minute slots · {scheme} theme
      </Text>

      <View style={[styles.card, { backgroundColor: values.card, borderColor: values.border }]}>
        <Text style={[styles.detail, { color: values["card-foreground"] }]}>
          {env.apiBaseUrl || "No API base URL configured"}
        </Text>
        <Text style={[styles.caption, { color: values["muted-foreground"] }]}>
          Data: {env.dataMode}
          {env.demoMode ? " · demo mode" : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    fontSize: TYPE_SCALE.caption.size,
    fontWeight: TYPE_SCALE.caption.weight,
  },
  card: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    gap: SPACING.xs,
    padding: SPACING.md,
    width: "100%",
  },
  container: {
    alignItems: "center",
    flex: 1,
    gap: SPACING.sm,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  detail: {
    fontSize: TYPE_SCALE.body.size,
    fontWeight: TYPE_SCALE.body.weight,
    fontVariant: [TABULAR_NUMBERS],
  },
  title: {
    fontSize: TYPE_SCALE.display.size,
    fontWeight: TYPE_SCALE.display.weight,
  },
});
