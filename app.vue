<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from "vue";

const { init } = useTheme();
const route = useRoute();
let stop: (() => void) | undefined;

// The day planner is an app-like screen: the page itself never scrolls, only the timeline does.
const isDayView = computed(() => route.path.startsWith("/day"));

onMounted(() => {
  stop = init();
});
onBeforeUnmount(() => stop?.());
</script>

<template>
  <div
    class="flex flex-col bg-canvas font-sans text-foreground antialiased"
    :class="isDayView ? 'h-dvh overflow-hidden' : 'min-h-dvh'"
  >
    <AppHeader />
    <main class="flex min-h-0 flex-1 flex-col">
      <NuxtPage />
    </main>
  </div>
</template>
