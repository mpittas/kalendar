<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from "vue";

const { init } = useTheme();
const { isConfigured } = useAuth();
const route = useRoute();
let stop: (() => void) | undefined;

// The day planner is an app-like screen: the page itself never scrolls, only the timeline does.
const isDayView = computed(() => route.path.startsWith("/day"));
// The landing page brings its own header.
const isLanding = computed(() => route.path === "/");

// Who is signed in is only known in the browser, so the server can't tell whether a protected page
// should be shown. Rendering it there would flash its content before the redirect to /login.
const waitsForAuth = computed(() => isConfigured.value && !PUBLIC_PATHS.has(route.path));

onMounted(() => {
  stop = init();
});
onBeforeUnmount(() => stop?.());
</script>

<template>
  <div
    class="flex w-full flex-col bg-canvas font-sans text-foreground antialiased"
    :class="isDayView ? 'h-dvh overflow-hidden' : 'min-h-dvh'"
  >
    <AppHeader v-if="!isLanding" />
    <main class="flex min-h-0 w-full flex-1 flex-col">
      <ClientOnly v-if="waitsForAuth"><NuxtPage /></ClientOnly>
      <NuxtPage v-else />
    </main>
  </div>
</template>
