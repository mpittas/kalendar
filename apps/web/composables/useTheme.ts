export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "klndr-theme";

const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const applyTheme = (pref: ThemePreference) => {
  const dark = pref === "dark" || (pref === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", dark);
};

const readPreference = (): ThemePreference => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "system";
};

// The initial class is set by an inline script in <head> (see nuxt.config.ts) so there is no
// flash of the wrong theme; this composable keeps it in sync afterwards.
export const useTheme = () => {
  const preference = useState<ThemePreference>("theme-preference", () => "system");

  const setPreference = (pref: ThemePreference) => {
    preference.value = pref;
    try {
      if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {}
    applyTheme(pref);
  };

  const toggle = () => {
    const isDark = document.documentElement.classList.contains("dark");
    setPreference(isDark ? "light" : "dark");
  };

  // Call once on the client: restore the saved preference and follow OS changes while on "system".
  const init = () => {
    preference.value = readPreference();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (preference.value === "system") applyTheme("system");
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  };

  return { preference, setPreference, toggle, init };
};
