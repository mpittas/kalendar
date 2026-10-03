<script setup lang="ts">
import LandingLogo from "~/components/landing/LandingLogo.vue";

defineProps<{
  start: { to: string; label: string };
  signedIn: boolean;
}>();

const year = new Date().getFullYear();
</script>

<template>
  <footer class="relative overflow-hidden bg-background pt-12">
    <div class="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <NuxtLink to="/" class="text-lg text-foreground transition hover:opacity-80" aria-label="klndr. home"><LandingLogo /></NuxtLink>
        <p class="mt-2 text-sm text-muted-foreground">A tactile planner for people who time-block.</p>
      </div>
      <nav class="-mx-2 flex flex-wrap items-center text-sm" aria-label="Footer">
        <a href="#how-it-works" class="rounded-md px-2 py-2 text-muted-foreground transition hover:text-foreground">How it works</a>
        <a href="#features" class="rounded-md px-2 py-2 text-muted-foreground transition hover:text-foreground">Features</a>
        <NuxtLink v-if="!signedIn" to="/login" class="rounded-md px-2 py-2 text-muted-foreground transition hover:text-foreground">Log in</NuxtLink>
        <NuxtLink :to="start.to" class="rounded-md px-2 py-2 font-medium text-foreground transition hover:opacity-80">{{ start.label }}</NuxtLink>
      </nav>
    </div>
    <p class="mx-auto mt-8 max-w-6xl px-5 text-xs text-muted-foreground sm:px-8">© {{ year }} klndr.</p>

    <!-- The wordmark, large and fading into the page -->
    <p
      aria-hidden="true"
      class="footer-wordmark pointer-events-none mx-auto -mb-[0.2em] mt-4 max-w-6xl select-none px-5 text-center text-[clamp(5.5rem,25vw,19rem)] font-bold leading-[0.9] tracking-[-0.065em] sm:px-8"
    >
      klndr.
    </p>
  </footer>
</template>

<style scoped>
.footer-wordmark {
  background-image: linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 9%, transparent) 30%, transparent 92%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
