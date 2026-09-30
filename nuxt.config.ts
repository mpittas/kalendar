import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "",
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "",
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "",
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "",
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "",
    },
  },
  nitro: {
    esbuild: {
      options: {
        target: "esnext",
      },
    },
  },
  app: {
    head: {
      title: "DayForge · Daily Task Scheduler",
      meta: [
        {
          name: "description",
          content:
            "Plan your day on a calendar, then drag activities like cleaning, workouts and project work onto an hour-by-hour timeline.",
        },
      ],
      link: [
        {
          rel: "icon",
          href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none'><rect width='32' height='32' rx='8' fill='%230f172a'/><rect x='6' y='8' width='20' height='18' rx='3' stroke='white' stroke-width='2'/><path d='M19 5v4M13 5v4M6 14h20M11 18h3M11 21h7' stroke='white' stroke-width='2' stroke-linecap='round'/></svg>",
        },
      ],
    },
  },
});
