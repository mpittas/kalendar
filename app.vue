<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";

const { init } = useTheme();
let stop: (() => void) | undefined;

onMounted(() => {
  stop = init();
});
onBeforeUnmount(() => stop?.());
</script>

<template>
  <div class="min-h-screen bg-canvas text-foreground antialiased font-sans flex flex-col">
    <AppHeader />
    <main class="flex-1 min-h-0 flex flex-col">
      <NuxtPage />
    </main>
  </div>
</template>
