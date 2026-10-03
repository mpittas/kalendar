import type { ConfigContext, ExpoConfig } from "expo/config";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
/**
 * The app identity. iOS cannot change the bundle id after the first store release and Android
 * cannot change the package either, so both come from this one constant — HUMAN_TODO: confirm it
 * before the first store build.
 */
const BUNDLE_ID = "com.klndr.app";

/** The project root and the two Firebase native config files (build inputs, not bundle values). */
const projectRoot = __dirname;
const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json";
const GOOGLE_SERVICES_PLIST = process.env.GOOGLE_SERVICES_INFO_PLIST ?? "./GoogleService-Info.plist";

/**
 * The path to a config file, if it is actually there. Both files are gitignored (they are project
 * configuration, and EAS supplies them per environment), so a checkout without them still starts:
 * the app runs in demo mode without Firebase, and a build for the stores needs them present.
 */
function nativeConfigFile(relativePath: string): string | undefined {
  return existsSync(resolve(projectRoot, relativePath)) ? relativePath : undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesJson = nativeConfigFile(GOOGLE_SERVICES_JSON);
  const googleServicesPlist = nativeConfigFile(GOOGLE_SERVICES_PLIST);

  return {
    ...config,
    name: "klndr",
    slug: "klndr",
    scheme: "klndr",
    version: "0.1.0",
    orientation: "portrait",
    // Both themes are real, and the app follows the system setting (see 1.2 for the override).
    userInterfaceStyle: "automatic",
    icon: "./assets/images/icon.png",
    ios: {
      bundleIdentifier: BUNDLE_ID,
      // The day planner is a phone app; a tablet layout is out of scope.
      supportsTablet: false,
      icon: "./assets/expo.icon",
      // Task 1.3 uses this; the capability has to be declared for the native build.
      usesAppleSignIn: true,
      ...(googleServicesPlist ? { googleServicesFile: googleServicesPlist } : {}),
    },
    android: {
      package: BUNDLE_ID,
      // Edge-to-edge is always on from SDK 57, so it is not a setting any more.
      // Android 16 predictive back, off until expo-router declares support.
      predictiveBackGestureEnabled: false,
      ...(googleServicesJson ? { googleServicesFile: googleServicesJson } : {}),
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          // Placeholder artwork and colour: task 4.3 generates the real ones from the calendar mark.
          backgroundColor: "#ffffff",
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
