<script setup lang="ts">
defineProps<{
  start: { to: string; label: string };
  signedIn: boolean;
}>();

const year = new Date().getFullYear();
</script>

<template>
  <footer class="bg-background pb-[max(2rem,env(safe-area-inset-bottom))] pt-10">
    <div class="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <NuxtLink to="/" class="text-lg font-bold tracking-tight text-foreground">klndr.</NuxtLink>
        <p class="mt-1 text-sm text-muted-foreground">A tactile planner for people who time-block.</p>
      </div>
      <nav class="-mx-2 flex flex-wrap items-center text-sm" aria-label="Footer">
        <a href="#how-it-works" class="rounded-md px-2 py-2 text-muted-foreground transition hover:text-foreground">How it works</a>
        <a href="#features" class="rounded-md px-2 py-2 text-muted-foreground transition hover:text-foreground">Features</a>
        <NuxtLink v-if="!signedIn" to="/login" class="rounded-md px-2 py-2 text-muted-foreground transition hover:text-foreground">Log in</NuxtLink>
        <NuxtLink :to="start.to" class="rounded-md px-2 py-2 font-medium text-foreground transition hover:opacity-80">{{ start.label }}</NuxtLink>
      </nav>
    </div>
    <p class="mx-auto mt-8 max-w-6xl px-5 text-xs text-muted-foreground sm:px-8">© {{ year }} klndr.</p>
  </footer>
</template>
